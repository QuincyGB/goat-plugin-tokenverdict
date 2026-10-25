import { Tool } from "@goat-sdk/core";
// Value import (not `import type`): the @Tool decorator reads the
// method's design:paramtypes metadata to detect the wallet parameter,
// mirroring ens.service.ts in @goat-sdk/plugin-ens.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { EVMWalletClient } from "@goat-sdk/wallet-evm";
import { fetchTokenVerdict, type TokenVerdictOptions } from "./api";
import { GetTokenVerdictParameters } from "./parameters";

export type TokenVerdictServiceOptions = TokenVerdictOptions;

/**
 * Service exposing the Token Verdict tool: a pay-per-call token risk
 * screen. The tool calls Token Verdict (POST /v1/verdict, $0.02 USDC
 * on Base via x402 v2) and pays the 402 challenge from the agent's
 * GOAT wallet client.
 */
export class TokenVerdictService {
    private readonly options: TokenVerdictServiceOptions;

    constructor(options: TokenVerdictServiceOptions = {}) {
        this.options = options;
    }

    @Tool({
        name: "token_verdict_get_verdict",
        description:
            "Get a risk verdict for a token before buying, swapping, or routing funds into it. " +
            "Calls Token Verdict, a live x402 service, and pays $0.02 USDC on Base automatically from the agent wallet. " +
            "Returns a verdict (SOLID / CAUTION / DANGER) with a 0-100 score, six weighted market-structure signals " +
            "(liquidity depth, volume churn, sell pressure, price action, trader breadth, pair age), a written analyst take, " +
            "and the raw market data. Use this when about to interact with a token whose market quality is unknown. " +
            "If you are unsure of the token contract address, please ask the user before proceeding.",
    })
    async getTokenVerdict(walletClient: EVMWalletClient, parameters: GetTokenVerdictParameters) {
        try {
            return await fetchTokenVerdict(walletClient, parameters, this.options);
        } catch (error) {
            throw new Error(`Failed to get token verdict: ${error}`);
        }
    }
}
