import { createToolParameters } from "@goat-sdk/core";
import { z } from "zod";

/**
 * Input parameters for the Token Verdict tool — mirrors the Token
 * Verdict service's real request contract (POST /v1/verdict):
 *
 *   { "address": "0x...", "chain": "base" | "ethereum" | "solana" }
 *
 * `address` is required; `chain` defaults to "base". (Chain selects
 * which token market to analyze; payment always settles in USDC on
 * Base.)
 */
export class GetTokenVerdictParameters extends createToolParameters(
    z.object({
        address: z
            .string()
            .regex(/^0x[a-fA-F0-9]{40}$/, "address must be a 0x token contract address")
            .describe("The token contract address (0x...) to get a risk verdict for"),
        chain: z
            .enum(["base", "ethereum", "solana"])
            .default("base")
            .describe(
                'Which token market to analyze: "base" (default), "ethereum", or "solana". Payment always settles in USDC on Base.',
            ),
    }),
) {}
