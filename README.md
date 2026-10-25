<div align="center">
<a href="https://github.com/goat-sdk/goat">

<img src="https://github.com/user-attachments/assets/5fc7f121-259c-492c-8bca-f15fe7eb830c" alt="GOAT" width="100px" height="auto" style="object-fit: contain;">
</a>
</div>

# Token Verdict GOAT Plugin

[Token Verdict](https://token-verdict-production.up.railway.app/) plugin for Goat. Allows you to create tools for interacting with the Token Verdict API — a pay-per-call token risk screen ($0.02 USDC on Base, paid via x402 from the agent's wallet).

## Installation
```bash
npm install @quincygb/goat-plugin-tokenverdict
yarn add @quincygb/goat-plugin-tokenverdict
pnpm add @quincygb/goat-plugin-tokenverdict
```

## Usage
```typescript
import { getOnChainTools } from "@goat-sdk/core";
import { viem } from "@goat-sdk/wallet-viem";
import { tokenVerdict } from "@quincygb/goat-plugin-tokenverdict";

const tools = await getOnChainTools({
    wallet: viem(walletClient), // any GOAT EVM wallet client, on Base mainnet
    plugins: [
        tokenVerdict()
    ]
});
```

The plugin takes optional overrides:

```typescript
tokenVerdict({
    // Spend guard: maximum authorized per call. Defaults to the known
    // price ("$0.02"); a repriced or hostile endpoint is refused, never
    // silently paid.
    maxAmountPerPayment: "$0.02",
    // baseUrl: "https://token-verdict-production.up.railway.app",
})
```

## Tools
1. Get token verdict — a verdict (SOLID / CAUTION / DANGER) with a 0-100 score, six weighted market-structure signals (liquidity depth, volume churn, sell pressure, price action, trader breadth, pair age), a written analyst take, and the raw market data for a token address on Base, Ethereum, or Solana. Payment always settles in USDC on Base.

<footer>
<br/>
<br/>
<div>
<a href="https://github.com/goat-sdk/goat">
  <img src="https://github.com/user-attachments/assets/59fa5ddc-9d47-4d41-a51a-64f6798f94bd" alt="GOAT" width="100%" height="auto" style="object-fit: contain; max-width: 800px;">
</a>
</div>
</footer>
