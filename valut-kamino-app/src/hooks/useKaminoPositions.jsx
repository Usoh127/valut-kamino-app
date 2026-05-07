import { useState, useEffect, useCallback, useRef } from 'react';
import { PROXY_API, TOKEN_MINTS, TOKEN_ICONS, KAMINO_MAIN_MARKET, KAMINO_JLP_MARKET } from '../config';

const KAMINO_API_BASE = 'https://api.kamino.finance';
const KAMINO_SYSTEM_ADDRESS = '11111111111111111111111111111111';
const SCALED_FRACTION_DIVISOR = 2 ** 60;
const FALLBACK_KAMINO_MARKETS = [
  { name: 'Main Market', lendingMarket: KAMINO_MAIN_MARKET },
  { name: 'JLP Market', lendingMarket: KAMINO_JLP_MARKET },
];

let kaminoMarketsPromise = null;
const reserveMetricsPromises = new Map();

function getKaminoMarketsUrl() {
  return `${KAMINO_API_BASE}/v2/kamino-market?env=mainnet-beta`;
}

function getKaminoObligationsUrl(market, walletAddress) {
  return `${KAMINO_API_BASE}/kamino-market/${market}/users/${walletAddress}/obligations?env=mainnet-beta`;
}

function getKaminoReserveMetricsUrl(market) {
  return `${KAMINO_API_BASE}/kamino-market/${market}/reserves/metrics?env=mainnet-beta`;
}

async function fetchWithProxyFallback(url) {
  const proxyUrl = PROXY_API(url);
  let proxyRes;
  let proxyStatus = null;

  try {
    proxyRes = await fetch(proxyUrl);
    proxyStatus = proxyRes.status;
    if (proxyRes.ok) {
      return { res: proxyRes, source: 'proxy' };
    }
  } catch (proxyErr) {
    console.warn('Proxy request failed, attempting direct Kamino request.', proxyErr);
  }

  try {
    const directRes = await fetch(url);
    if (directRes.ok) {
      return { res: directRes, source: 'direct' };
    }
    throw new Error(`direct status: ${directRes.status}`);
  } catch (directErr) {
    console.warn('Direct Kamino request failed.', directErr);
  }

  throw new Error(`Unable to load Kamino data (proxy status: ${proxyStatus ?? 'network error'}).`);
}

async function fetchJsonWithProxyFallback(url) {
  const { res, source } = await fetchWithProxyFallback(url);
  return { data: await res.json(), source };
}

async function fetchKaminoMarkets() {
  if (!kaminoMarketsPromise) {
    kaminoMarketsPromise = fetchJsonWithProxyFallback(getKaminoMarketsUrl())
      .then(({ data, source }) => {
        if (Array.isArray(data) && data.length > 0) {
          console.info(`Loaded ${data.length} Kamino markets via ${source} endpoint.`);
          return data;
        }
        return FALLBACK_KAMINO_MARKETS;
      })
      .catch((err) => {
        console.warn('Unable to load Kamino market list; falling back to bundled markets.', err);
        kaminoMarketsPromise = null;
        return FALLBACK_KAMINO_MARKETS;
      });
  }

  return kaminoMarketsPromise;
}

async function fetchReserveLookup(marketAddress) {
  if (!marketAddress) return {};
  if (!reserveMetricsPromises.has(marketAddress)) {
    const promise = fetchJsonWithProxyFallback(getKaminoReserveMetricsUrl(marketAddress))
      .then(({ data }) => Object.fromEntries(
        (Array.isArray(data) ? data : []).map((reserve) => [reserve.reserve, reserve])
      ))
      .catch((err) => {
        reserveMetricsPromises.delete(marketAddress);
        console.warn(`Unable to load Kamino reserve metrics for ${marketAddress}.`, err);
        return {};
      });
    reserveMetricsPromises.set(marketAddress, promise);
  }

  return reserveMetricsPromises.get(marketAddress);
}

function extractObligations(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.obligations)) return data.obligations;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function parseNumericValue(...values) {
  const value = values.find((candidate) => candidate !== undefined && candidate !== null && candidate !== '');
  const parsed = parseFloat(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseScaledFraction(value) {
  const parsed = parseNumericValue(value);
  return parsed > 0 ? parsed / SCALED_FRACTION_DIVISOR : 0;
}
function resolveToken(mint) {
  const known = TOKEN_MINTS[mint];
  if (known) {
    return {
      symbol: known.symbol,
      decimals: known.decimals,
      icon: TOKEN_ICONS[known.symbol] || null,
      mint,
    };
  }
  return {
    symbol: mint ? `${mint.slice(0, 4)}...${mint.slice(-4)}` : 'Unknown',
    decimals: 9,
    icon: null,
    mint,
  };
}

function resolveReserveToken(reserveAddress, reserveLookup) {
  const reserve = reserveLookup?.[reserveAddress];
  if (reserve) {
    const resolvedMint = resolveToken(reserve.liquidityTokenMint);
    return {
      symbol: reserve.liquidityToken || resolvedMint.symbol,
      decimals: resolvedMint.decimals,
      icon: TOKEN_ICONS[reserve.liquidityToken] || resolvedMint.icon,
      mint: reserve.liquidityTokenMint || reserveAddress,
      reserveAddress,
    };
  }
  return { ...resolveToken(reserveAddress), reserveAddress };
}

function getMarketAddress(obligation) {
  if (typeof obligation.market === 'string') return obligation.market;
  return obligation.state?.lendingMarket || obligation.market?.address || '';
}

function getObligationStats(obligation) {
  return obligation.refreshedStats || obligation.stats || obligation.obligationStats || {};
}

function getPositionValue(position) {
  return parseNumericValue(
    position.marketValueUsd,
    position.marketValueRefreshed,
    position.marketValue,
    position.valueUsd,
    position.usdValue,
    position.value
  ) || parseScaledFraction(position.marketValueSf || position.borrowFactorAdjustedMarketValueSf);
}


function getPositionReserve(position, kind) {
  return kind === 'deposit'
    ? position.depositReserve || position.reserve || position.reserveAddress
    : position.borrowReserve || position.reserve || position.reserveAddress;
}

function getPositionAmount(position, kind) {
  return kind === 'deposit'
    ? parseNumericValue(position.amount, position.depositedAmount, position.quantity)
    : parseNumericValue(position.amount, position.borrowedAmount, position.quantity, position.borrowedAmountOutsideElevationGroups);
}

function getPositionToken(position, reserve, reserveLookup) {
  const mint = position.mintAddress || position.mint || position.tokenMint;
  return mint ? resolveToken(mint) : resolveReserveToken(reserve, reserveLookup);
}

function normalizeReservePositions(items, reserveLookup, kind) {
  const normalized = [];

  for (const item of items) {
    const reserve = getPositionReserve(item, kind);
    const value = getPositionValue(item);
    const amount = getPositionAmount(item, kind);

    if (reserve === KAMINO_SYSTEM_ADDRESS || (value <= 0 && amount <= 0)) {
      continue;
    }

    const token = getPositionToken(item, reserve, reserveLookup);
    normalized.push(kind === 'deposit'
      ? {
        ...token,
        amount,
        value,
        supplyApy: parseNumericValue(item.supplyApy, item.apy, item.supply_apy, reserveLookup?.[reserve]?.supplyApy),
      }
      : {
        ...token,
        amount,
        value,
        borrowApy: parseNumericValue(item.borrowApy, item.apy, item.borrow_apy, reserveLookup?.[reserve]?.borrowApy),
      });
  }

  return normalized;
}

function normalizeDeposits(obligation, reserveLookup) {
  const deposits = Array.isArray(obligation.deposits)
    ? obligation.deposits
    : Array.isArray(obligation.collateral)
      ? obligation.collateral
      : Array.isArray(obligation.state?.deposits)
        ? obligation.state.deposits
        : [];

  return normalizeReservePositions(deposits, reserveLookup, 'deposit');
}

function normalizeBorrows(obligation, reserveLookup) {
  const borrows = Array.isArray(obligation.borrows)
    ? obligation.borrows
    : Array.isArray(obligation.loans)
      ? obligation.loans
      : Array.isArray(obligation.state?.borrows)
        ? obligation.state.borrows
        : [];

  return normalizeReservePositions(borrows, reserveLookup, 'borrow');
}

function getHealthFactor(stats, totalBorrowValue) {
  if (totalBorrowValue === 0) return Infinity;

  const explicitHealthFactor = parseNumericValue(stats.healthFactor, stats.health_factor);
  if (explicitHealthFactor > 0) return explicitHealthFactor;

  const borrowLiquidationLimit = parseNumericValue(stats.borrowLiquidationLimit);
  const userTotalBorrow = parseNumericValue(stats.userTotalBorrow, stats.userTotalBorrowBorrowFactorAdjusted);
  if (borrowLiquidationLimit > 0 && userTotalBorrow > 0) {
    return borrowLiquidationLimit / userTotalBorrow;
  }

  const liquidationLtv = parseNumericValue(stats.liquidationLtv, stats.liquidationThreshold, stats.liquidation_threshold);
  const loanToValue = parseNumericValue(stats.loanToValue);
  if (liquidationLtv > 0 && loanToValue > 0) {
    return liquidationLtv / loanToValue;
  }

  return 0;
}

function getHealthStatus(healthFactor) {
  if (healthFactor === null || healthFactor === undefined || healthFactor === Infinity) {
    return { label: 'Safe', color: 'safe', description: 'No borrows — no liquidation risk.' };
  }
  if (healthFactor >= 2.0) {
    return { label: 'Safe', color: 'safe', description: 'Your position is well-collateralized.' };
  }
  if (healthFactor >= 1.5) {
    return { label: 'Moderate', color: 'moderate', description: 'Position is healthy but worth monitoring.' };
  }
  if (healthFactor >= 1.1) {
    return { label: 'At Risk', color: 'risk', description: 'Getting close to liquidation threshold. Consider adding collateral.' };
  }
  return { label: 'Critical', color: 'critical', description: 'Immediate action needed — liquidation is imminent.' };
}

function getOverallHealth(positions) {
  if (!positions || positions.length === 0) return null;
  
  let lowestHf = Infinity;
  let hasBorrow = false;
  for (const position of positions) {
    if (position.totalBorrowValue > 0) {
      hasBorrow = true;
      lowestHf = Math.min(lowestHf, position.healthFactor ?? Infinity);
    }
  }

  if (!hasBorrow) {
    return { label: 'Safe', color: 'safe', description: 'No borrows across your positions.' };
  }
  return getHealthStatus(lowestHf);
}

export default function useKaminoPositions(walletAddress) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [overallHealth, setOverallHealth] = useState(null);
  const fetchIdRef = useRef(0);

  const fetchPositions = useCallback(async () => {
    if (!walletAddress) {
      fetchIdRef.current += 1;
      setPositions([]);
      setPortfolioValue(0);
      setOverallHealth(null);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = fetchIdRef.current + 1;
    fetchIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
       const normalizedWalletAddress = walletAddress.trim();
      const markets = await fetchKaminoMarkets();
      const marketLabels = Object.fromEntries(
        markets.map((market) => [market.lendingMarket, market.name || market.lendingMarket])
      );

      const marketResults = await Promise.allSettled(
        markets.map(async (market) => {
          const marketAddress = market.lendingMarket;
          const kaminoUrl = getKaminoObligationsUrl(marketAddress, normalizedWalletAddress);
          const { data, source } = await fetchJsonWithProxyFallback(kaminoUrl);
          console.info(`Loaded Kamino obligations for ${market.name || marketAddress} via ${source} endpoint.`);
          return {
            market,
            marketAddress,
            obligations: extractObligations(data),
          };
        })
      );

      const obligations = [];
      const requiredMarkets = new Set();
      let failedMarketCount = 0;
      for (const result of marketResults) {
        if (result.status === 'rejected') {
          failedMarketCount += 1;
          continue;
        }

      const { market, marketAddress, obligations: marketObligations } = result.value;
        for (const obligation of marketObligations) {
          const obligationMarket = getMarketAddress(obligation) || marketAddress;
          requiredMarkets.add(obligationMarket);
          obligations.push({
            obligation,
            marketAddress: obligationMarket,
            marketName: market.name,
          });
        }
      }
      if (obligations.length === 0) {
        if (failedMarketCount > 0) {
          throw new Error(`Unable to scan ${failedMarketCount} Kamino market(s). Please try again.`);
        }
        if (fetchIdRef.current !== requestId) return;
        setPositions([]);
        setPortfolioValue(0);
        setOverallHealth(null);
        setLoading(false);
        return;
      }

      if (failedMarketCount > 0) {
        console.warn(`Loaded Kamino positions with ${failedMarketCount} market scan failure(s).`);
      }

        const reserveEntries = await Promise.all(
        [...requiredMarkets].map(async (marketAddress) => [marketAddress, await fetchReserveLookup(marketAddress)])
      );
      const reserveLookups = Object.fromEntries(reserveEntries);

        const parsed = obligations.map(({ obligation: ob, marketAddress, marketName }, idx) => {
        const reserveLookup = reserveLookups[marketAddress] || {};
        const deposits = normalizeDeposits(ob, reserveLookup);
        const borrows = normalizeBorrows(ob, reserveLookup);
        const stats = getObligationStats(ob);
          
        const totalDepositValue = parseNumericValue(stats.userTotalDeposit) || deposits.reduce((sum, d) => sum + d.value, 0);
        const totalBorrowValue = parseNumericValue(stats.userTotalBorrow, stats.userTotalBorrowBorrowFactorAdjusted)
          || borrows.reduce((sum, b) => sum + b.value, 0);
        const netValue = parseNumericValue(stats.netAccountValue) || (totalDepositValue - totalBorrowValue);
        const ltv = parseNumericValue(stats.loanToValue) || (totalDepositValue > 0 ? totalBorrowValue / totalDepositValue : 0);
        const liquidationThreshold = parseNumericValue(
          stats.liquidationLtv, stats.liquidationThreshold, stats.liquidation_threshold, ob.liquidationThreshold
        );
        const borrowLimit = parseNumericValue(stats.borrowLimit, stats.borrow_limit, ob.borrowLimit);
        const healthFactor = getHealthFactor(stats, totalBorrowValue);

        let liquidationPrice = null;
        if (totalBorrowValue > 0 && deposits.length === 1 && deposits[0].amount > 0 && liquidationThreshold > 0) {
          liquidationPrice = totalBorrowValue / (deposits[0].amount * liquidationThreshold);
        }

        const healthStatus = getHealthStatus(healthFactor);

          const rewards = (Array.isArray(ob.rewards) ? ob.rewards : []).map(r => {
          const token = resolveToken(r.mintAddress || r.mint);
          return { ...token, amount: parseNumericValue(r.amount), value: parseNumericValue(r.valueUsd, r.marketValueRefreshed, r.marketValue, r.value) };
        });

        return {
          id: ob.obligationAddress || ob.address || ob.pubkey || `pos-${idx}`,
          market: marketName || marketLabels[marketAddress] || (marketAddress ? `${marketAddress.slice(0, 4)}...${marketAddress.slice(-4)}` : 'Kamino Market'),
          marketAddress,
          deposits,
          borrows,
          rewards,
          totalDepositValue,
          totalBorrowValue,
          netValue,
          healthFactor,
          healthStatus,
          liquidationThreshold,
          liquidationPrice,
          borrowLimit,
          ltv,
          obligationAddress: ob.obligationAddress || ob.address || ob.pubkey || '',
        };
      });

      if (fetchIdRef.current !== requestId) return;
      const totalValue = parsed.reduce((sum, p) => sum + p.netValue, 0);
      setPositions(parsed);
      setPortfolioValue(totalValue);
      setOverallHealth(getOverallHealth(parsed));
      setError(failedMarketCount > 0
        ? `Loaded positions, but ${failedMarketCount} Kamino market(s) could not be scanned.`
        : null);
      if (import.meta.env.DEV) {
        console.debug('Parsed Kamino positions:', parsed);
      }
    } catch (err) {
      if (fetchIdRef.current !== requestId) return;
      console.error('Failed to fetch Kamino positions:', err);
      setError(err.message || 'Failed to fetch positions');
      setPositions([]);
      setPortfolioValue(0);
      setOverallHealth(null);
    } finally {
      if (fetchIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return { positions, loading, error, portfolioValue, overallHealth, refetch: fetchPositions };
}

export { getHealthStatus };
