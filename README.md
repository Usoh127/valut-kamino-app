# Vault — Solflare x Kamino Portfolio Monitor

Vault is a read-only Solana dApp focused on Kamino position visibility and risk monitoring.

## What it does

- Connect with Solflare (wallet-first entry).
- Alternative access via public Solana address input (no signing required).
- Fetch and display Kamino obligations (deposits, borrows, net value, health/risk).
- Show portfolio-level and per-position health insights.

## Competition track alignment

### Solflare
- Wallet-forward onboarding with Solflare-first connect CTA.
- Read-only trust UX to reduce exploit concerns.
- Optional address-only mode for cautious users.

### Kamino
- Kamino obligations parsing into actionable portfolio data.
- Position-level health and risk state monitoring.
- Direct deep-links to Kamino obligations.

## Tech stack

- React + Vite
- `@solana/wallet-adapter-react` + `@solana/wallet-adapter-react-ui`
- Kamino API (via proxy with direct fallback)

## Local development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Environment variables

Create a `.env` file as needed:

```bash
VITE_API_BASE_URL=https://api.eitherway.ai
VITE_HELIUS_RPC_URL=<optional custom rpc>
VITE_SUPABASE_URL=<optional>
VITE_SUPABASE_ANON_KEY=<optional>
```

## Deployment checklist

- [ ] Public live URL
- [ ] Wallet connect flow tested (Solflare + at least one other Wallet Standard wallet)
- [ ] Public-address read-only flow tested with known Kamino wallet
- [ ] Demo video (2–3 min)
- [ ] This repository public and linked in submission

