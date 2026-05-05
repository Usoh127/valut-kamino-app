import { TOKEN_ICONS } from './config';

// Mirrors exactly the shape produced by useKaminoPositions so every
// existing component renders mock data identically to real data.

export const MOCK_POSITIONS = [
  // ── Position 1: Safe lend — SOL only, no borrows ──────────────────────
  {
    id: 'mock-pos-1',
    market: 'Main Market',
    marketAddress: 'DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek',
    obligationAddress: 'demo1111111111111111111111111111111111111111',
    deposits: [
      {
        symbol: 'SOL',
        decimals: 9,
        icon: TOKEN_ICONS['SOL'] || null,
        mint: 'So11111111111111111111111111111111111111112',
        amount: 45.23,
        value: 45.23 * 168,   // ~$7,598 at $168/SOL
        supplyApy: 0.032,
      },
    ],
    borrows: [],
    rewards: [],
    totalDepositValue: 45.23 * 168,
    totalBorrowValue: 0,
    netValue: 45.23 * 168,
    healthFactor: Infinity,
    healthStatus: {
      label: 'Safe',
      color: 'safe',
      description: 'No borrows — no liquidation risk.',
    },
    liquidationThreshold: 0,
    liquidationPrice: null,
    borrowLimit: 0,
    ltv: 0,
  },

  // ── Position 2: Moderate borrow — USDC deposit / USDC borrow ─────────
  {
    id: 'mock-pos-2',
    market: 'Main Market',
    marketAddress: 'DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek',
    obligationAddress: 'demo2222222222222222222222222222222222222222',
    deposits: [
      {
        symbol: 'USDC',
        decimals: 6,
        icon: TOKEN_ICONS['USDC'] || null,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 2500,
        value: 2500,
        supplyApy: 0.054,
      },
    ],
    borrows: [
      {
        symbol: 'USDC',
        decimals: 6,
        icon: TOKEN_ICONS['USDC'] || null,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 800,
        value: 800,
        borrowApy: 0.0675,
      },
    ],
    rewards: [],
    totalDepositValue: 2500,
    totalBorrowValue: 800,
    netValue: 1700,
    healthFactor: 2.1,
    healthStatus: {
      label: 'Moderate',
      color: 'moderate',
      description: 'Position is healthy but worth monitoring.',
    },
    liquidationThreshold: 0.85,
    liquidationPrice: null,
    borrowLimit: 2125,
    ltv: 0.32,
  },

  // ── Position 3: At-risk borrow — USDC deposit / USDC borrow, JLP ─────
  {
    id: 'mock-pos-3',
    market: 'JLP Market',
    marketAddress: '',
    obligationAddress: 'demo3333333333333333333333333333333333333333',
    deposits: [
      {
        symbol: 'USDC',
        decimals: 6,
        icon: TOKEN_ICONS['USDC'] || null,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 1200,
        value: 1200,
        supplyApy: 0.048,
      },
    ],
    borrows: [
      {
        symbol: 'USDC',
        decimals: 6,
        icon: TOKEN_ICONS['USDC'] || null,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 950,
        value: 950,
        borrowApy: 0.081,
      },
    ],
    rewards: [],
    totalDepositValue: 1200,
    totalBorrowValue: 950,
    netValue: 250,
    healthFactor: 1.2,
    healthStatus: {
      label: 'At Risk',
      color: 'risk',
      description: 'Getting close to liquidation threshold. Consider adding collateral.',
    },
    liquidationThreshold: 0.9,
    liquidationPrice: null,
    borrowLimit: 1080,
    ltv: 0.792,
  },
];

// Derived portfolio-level values
export const MOCK_PORTFOLIO_VALUE = MOCK_POSITIONS.reduce((s, p) => s + p.netValue, 0);

export const MOCK_OVERALL_HEALTH = {
  label: 'At Risk',
  color: 'risk',
  description: 'One of your positions is getting close to its liquidation threshold.',
};
