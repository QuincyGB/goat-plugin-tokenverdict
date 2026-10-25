import { type Chain, PluginBase } from "@goat-sdk/core";
import type { EVMWalletClient } from "@goat-sdk/wallet-evm";
import { TokenVerdictService, type TokenVerdictServiceOptions } from "./tokenverdict.service";

/**
 * Token Verdict plugin for GOAT. Gives an agent a native
 * `token_verdict_get_verdict` tool: a pay-per-call token risk screen
 * backed by the Token Verdict x402 service ($0.02 USDC on Base).
 *
 * Usage:
 *   const tools = await getOnChainTools({
 *       wallet: viem({ ... }), // any GOAT EVM wallet client, on Base
 *       plugins: [tokenVerdict()],
 *   });
 */
export class TokenVerdictPlugin extends PluginBase<EVMWalletClient> {
    constructor(options: TokenVerdictServiceOptions = {}) {
        super("tokenverdict", [new TokenVerdictService(options)]);
    }

    /**
     * Payment settles in USDC on Base, so the wallet must be an EVM
     * wallet on Base mainnet.
     */
    supportsChain = (chain: Chain) => chain.type === "evm" && chain.id === 8453;
}

/**
 * Utility factory function for creating a TokenVerdictPlugin instance.
 */
export function tokenVerdict(options: TokenVerdictServiceOptions = {}) {
    return new TokenVerdictPlugin(options);
}
