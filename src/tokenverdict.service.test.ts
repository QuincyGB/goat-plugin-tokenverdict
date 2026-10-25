import type { EVMWalletClient } from "@goat-sdk/wallet-evm";
import { describe, expect, it, vi } from "vitest";
import { BASE_USDC_ADDRESS, TOKEN_VERDICT_PRICE } from "./constants";
import { GetTokenVerdictParameters } from "./parameters";
import { TokenVerdictPlugin, tokenVerdict } from "./tokenverdict.plugin";
import { TokenVerdictService } from "./tokenverdict.service";

const WALLET_ADDRESS = "0x1111111111111111111111111111111111111111";
const PAY_TO = "0x097f9685D1e0752bF8B02d61E5Ce9be7eA0FBA7F";
const TOKEN_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const SIGNATURE = `0x${"11".repeat(65)}`;

const VERDICT = {
    token: { address: TOKEN_ADDRESS, chain: "base" },
    verdict: "SOLID",
    score: 82,
    signals: [],
    take: "Deep liquidity, broad trader base.",
    market: {},
};

function paymentRequired(amount: string): string {
    const payload = {
        x402Version: 2,
        error: "Payment required",
        resource: {
            url: "https://token-verdict-production.up.railway.app/v1/verdict",
            description: "Token Verdict",
            mimeType: "application/json",
        },
        accepts: [
            {
                scheme: "exact",
                network: "eip155:8453",
                amount,
                asset: BASE_USDC_ADDRESS,
                payTo: PAY_TO,
                maxTimeoutSeconds: 300,
                extra: { name: "USD Coin", version: "2" },
            },
        ],
        extensions: {},
    };
    return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function createMockWallet() {
    const signTypedData = vi.fn(async () => ({ signature: SIGNATURE }));
    const wallet = {
        getAddress: () => WALLET_ADDRESS,
        getChain: () => ({ type: "evm", id: 8453 }),
        signTypedData,
    } as unknown as EVMWalletClient;
    return { wallet, signTypedData };
}

/** A fetch stub that answers 402 first, then the verdict once paid. */
function createX402Fetch(amount = "20000") {
    const calls: { url: string; paymentSignature: string | null }[] = [];
    const fetchImpl = vi.fn(async (url: unknown, init?: RequestInit) => {
        // @x402/fetch normalizes calls to Request objects.
        const request = url instanceof Request ? url : new Request(String(url), init);
        const paymentSignature = request.headers.get("payment-signature");
        calls.push({ url: String(url), paymentSignature });
        if (!paymentSignature) {
            return new Response("{}", {
                status: 402,
                headers: { "payment-required": paymentRequired(amount) },
            });
        }
        return new Response(JSON.stringify(VERDICT), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    }) as unknown as typeof fetch;
    return { fetchImpl, calls };
}

const parameters = new GetTokenVerdictParameters();
parameters.address = TOKEN_ADDRESS;
parameters.chain = "base";

describe("TokenVerdictService", () => {
    it("pays the $0.02 challenge from the wallet and returns the verdict", async () => {
        const { wallet, signTypedData } = createMockWallet();
        const { fetchImpl, calls } = createX402Fetch();
        const service = new TokenVerdictService({ fetchImpl });

        const result = await service.getTokenVerdict(wallet, parameters);

        expect(result).toEqual(VERDICT);
        expect(calls).toHaveLength(2);
        expect(signTypedData).toHaveBeenCalledTimes(1);

        // The retry carries a payment payload for exactly $0.02 to the service payTo.
        const payment = JSON.parse(Buffer.from(calls[1].paymentSignature ?? "", "base64").toString());
        expect(payment.accepted.amount).toBe("20000");
        expect(payment.accepted.payTo).toBe(PAY_TO);
        expect(payment.payload.authorization.from).toBe(WALLET_ADDRESS);
    });

    it("refuses to pay above the spend guard and never signs", async () => {
        const { wallet, signTypedData } = createMockWallet();
        const { fetchImpl } = createX402Fetch("30000"); // repriced endpoint
        const service = new TokenVerdictService({ fetchImpl });

        await expect(service.getTokenVerdict(wallet, parameters)).rejects.toThrow(
            /Failed to get token verdict/,
        );
        expect(signTypedData).not.toHaveBeenCalled();
    });

    it("respects a raised spend-guard cap", async () => {
        const { wallet, signTypedData } = createMockWallet();
        const { fetchImpl } = createX402Fetch("30000");
        const service = new TokenVerdictService({ fetchImpl, maxAmountPerPayment: "$0.05" });

        const result = await service.getTokenVerdict(wallet, parameters);

        expect(result).toEqual(VERDICT);
        expect(signTypedData).toHaveBeenCalledTimes(1);
    });

    it("surfaces a non-402 HTTP failure as an error, not a verdict", async () => {
        const { wallet } = createMockWallet();
        const fetchImpl = vi.fn(async () => new Response("upstream down", { status: 502 })) as unknown as typeof fetch;
        const service = new TokenVerdictService({ fetchImpl });

        await expect(service.getTokenVerdict(wallet, parameters)).rejects.toThrow(/HTTP 502/);
    });

    it("defaults the spend guard to the known price", () => {
        expect(TOKEN_VERDICT_PRICE).toBe("$0.02");
    });
});

describe("TokenVerdictPlugin", () => {
    it("is created by the factory and named tokenverdict", () => {
        const plugin = tokenVerdict();
        expect(plugin).toBeInstanceOf(TokenVerdictPlugin);
        expect(plugin.name).toBe("tokenverdict");
    });

    it("supports only EVM wallets on Base mainnet", () => {
        const plugin = tokenVerdict();
        expect(plugin.supportsChain({ type: "evm", id: 8453 } as never)).toBe(true);
        expect(plugin.supportsChain({ type: "evm", id: 1 } as never)).toBe(false);
        expect(plugin.supportsChain({ type: "solana" } as never)).toBe(false);
    });

    it("exposes the token_verdict_get_verdict tool", () => {
        const { wallet } = createMockWallet();
        const plugin = tokenVerdict();
        const tools = plugin.getTools(wallet);
        expect(tools.map((tool) => tool.name)).toContain("token_verdict_get_verdict");
    });
});
