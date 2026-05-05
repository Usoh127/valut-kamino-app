const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.eitherway.ai';

export const DIALECT_PROXY = `${API_BASE_URL}/api/dialect`;
export const PROXY_API = (url) => `${API_BASE_URL}/api/proxy-api?url=${encodeURIComponent(url)}`;

export const HELIUS_RPC_URL = import.meta.env.VITE_HELIUS_RPC_URL || `${API_BASE_URL}/api/solana/rpc/mainnet`;

export const KAMINO_MAIN_MARKET = '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF';
export const KAMINO_JLP_MARKET = 'DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek';

export const TOKEN_ICONS = {
  SOL: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  USDC: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  USDT: 'https://coin-images.coingecko.com/coins/images/325/small/Tether.png',
  JitoSOL: 'https://storage.googleapis.com/token-metadata/JitoSOL-256.png',
  mSOL: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
  bSOL: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1/logo.png',
  PYUSD: 'https://424565.fs1.hubspotusercontent-na1.net/hubfs/424565/PYUSDLOGO.png',
  JUP: 'https://static.jup.ag/jup/icon.png',
  BONK: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
};

export const TOKEN_MINTS = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', decimals: 6 },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'JitoSOL', decimals: 9 },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', decimals: 9 },
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': { symbol: 'bSOL', decimals: 9 },
  '2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN': { symbol: 'PYUSD', decimals: 6 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', decimals: 6 },
};
