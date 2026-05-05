import { useState, useEffect, useCallback } from 'react';
import { PROXY_API, DIALECT_PROXY, TOKEN_MINTS, TOKEN_ICONS } from '../config';

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
  const borrowPositions = positions.filter(p => p.totalBorrowValue > 0);
  if (borrowPositions.length === 0) {
    return { label: 'Safe', color: 'safe', description: 'No borrows across your positions.' };
  }
  const lowestHf = Math.min(...borrowPositions.map(p => p.healthFactor ?? Infinity));
  return getHealthStatus(lowestHf);
}

export default function useKaminoPositions(walletAddress) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [overallHealth, setOverallHealth] = useState(null);

  const fetchPositions = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        PROXY_API(`https://api.kamino.finance/v2/users/${walletAddress}/obligations`)
      );

      if (!res.ok) {
        if (res.status === 404) {
          setPositions([]);
          setPortfolioValue(0);
          setOverallHealth(null);
          setLoading(false);
          return;
        }
        throw new Error(`Kamino API returned ${res.status}`);
      }

      const data = await res.json();
      const obligations = Array.isArray(data) ? data : (data.obligations || data.data || []);

      if (obligations.length === 0) {
        setPositions([]);
        setPortfolioValue(0);
        setOverallHealth(null);
        setLoading(false);
        return;
      }

      const parsed = obligations.map((ob, idx) => {
        const deposits = (ob.deposits || ob.collateral || []).map(d => {
          const token = resolveToken(d.mintAddress || d.mint || d.tokenMint);
          const amount = parseFloat(d.amount || d.depositedAmount || d.quantity || 0);
          const value = parseFloat(d.marketValueUsd || d.valueUsd || d.usdValue || d.value || 0);
          const supplyApy = parseFloat(d.supplyApy || d.apy || d.supply_apy || 0);
          return { ...token, amount, value, supplyApy };
        });

        const borrows = (ob.borrows || ob.loans || []).map(b => {
          const token = resolveToken(b.mintAddress || b.mint || b.tokenMint);
          const amount = parseFloat(b.amount || b.borrowedAmount || b.quantity || 0);
          const value = parseFloat(b.marketValueUsd || b.valueUsd || b.usdValue || b.value || 0);
          const borrowApy = parseFloat(b.borrowApy || b.apy || b.borrow_apy || 0);
          return { ...token, amount, value, borrowApy };
        });

        const totalDepositValue = deposits.reduce((sum, d) => sum + d.value, 0);
        const totalBorrowValue = borrows.reduce((sum, b) => sum + b.value, 0);

        const stats = ob.stats || ob.obligationStats || {};
        let healthFactor = parseFloat(stats.loanToValue || stats.healthFactor || stats.health_factor || ob.healthFactor || ob.health_factor || 0);

        if (stats.loanToValue && !stats.healthFactor) {
          const ltv = parseFloat(stats.loanToValue);
          healthFactor = ltv > 0 ? 1 / ltv : Infinity;
        }

        if (totalBorrowValue === 0) healthFactor = Infinity;

        const liquidationThreshold = parseFloat(
          stats.liquidationThreshold || stats.liquidation_threshold || ob.liquidationThreshold || 0
        );
        const borrowLimit = parseFloat(stats.borrowLimit || stats.borrow_limit || ob.borrowLimit || 0);
        const netValue = totalDepositValue - totalBorrowValue;
        const ltv = totalDepositValue > 0 ? totalBorrowValue / totalDepositValue : 0;

        let liquidationPrice = null;
        if (totalBorrowValue > 0 && deposits.length === 1 && deposits[0].amount > 0 && liquidationThreshold > 0) {
          liquidationPrice = totalBorrowValue / (deposits[0].amount * liquidationThreshold);
        }

        const marketLabel = ob.market === 'DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek'
          ? 'JLP Market'
          : 'Main Market';

        const healthStatus = getHealthStatus(healthFactor);

        const rewards = (ob.rewards || []).map(r => {
          const token = resolveToken(r.mintAddress || r.mint);
          return { ...token, amount: parseFloat(r.amount || 0), value: parseFloat(r.valueUsd || 0) };
        });

        return {
          id: ob.obligationAddress || ob.address || ob.pubkey || `pos-${idx}`,
          market: marketLabel,
          marketAddress: ob.market || '',
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

      const totalValue = parsed.reduce((sum, p) => sum + p.netValue, 0);
      setPositions(parsed);
      setPortfolioValue(totalValue);
      setOverallHealth(getOverallHealth(parsed));
    } catch (err) {
      console.error('Failed to fetch Kamino positions:', err);
      setError(err.message || 'Failed to fetch positions');
      setPositions([]);
      setPortfolioValue(0);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return { positions, loading, error, portfolioValue, overallHealth, refetch: fetchPositions };
}

export { getHealthStatus };
