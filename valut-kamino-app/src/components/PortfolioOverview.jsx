import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Shield, RefreshCw, ExternalLink, ChevronRight,
  TrendingUp, TrendingDown, AlertTriangle, Wallet, Info
} from 'lucide-react';
import HealthBadge, { HealthBar } from './HealthBadge';
import { TOKEN_ICONS } from '../config';

function formatUsd(value) {
  if (value === null || value === undefined) return '$0.00';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatAmount(amount, decimals = 4) {
  if (!amount || amount === 0) return '0';
  if (amount < 0.0001) return '<0.0001';
  return amount.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function TokenIcon({ symbol, className = 'w-6 h-6' }) {
  const icon = TOKEN_ICONS[symbol];
  if (icon) {
    return <img src={icon} alt={symbol} className={`${className} rounded-full`} />;
  }
  return (
    <div className={`${className} rounded-full bg-vault-border flex items-center justify-center`}>
      <span className="text-[10px] font-bold text-vault-muted">{(symbol || '?').slice(0, 2)}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-[16px] bg-white border border-vault-border flex items-center justify-center">
          <Wallet className="w-7 h-7 text-vault-accent" />
        </div>
        <h2 className="text-xl font-semibold font-sans text-vault-text mb-3">No Kamino positions found</h2>
        <p className="text-vault-muted text-sm leading-relaxed mb-6">
          Kamino Finance is a DeFi protocol on Solana that lets you earn yield by lending your tokens,
          providing liquidity, or using leveraged strategies. Once you open a position, it will show up here
          with health scores and risk monitoring.
        </p>
        <div className="bg-vault-card border border-vault-border rounded-[12px] p-4 text-left mb-6">
          <p className="text-xs font-semibold text-vault-muted uppercase tracking-wider mb-3">Getting started</p>
          <ol className="space-y-2 text-sm text-vault-text">
            <li className="flex gap-2">
              <span className="text-vault-accent font-bold">1.</span>
              Visit Kamino Finance and connect your wallet.
            </li>
            <li className="flex gap-2">
              <span className="text-vault-accent font-bold">2.</span>
              Deposit tokens into a lending market or liquidity vault.
            </li>
            <li className="flex gap-2">
              <span className="text-vault-accent font-bold">3.</span>
              Come back here to track your positions and health.
            </li>
          </ol>
        </div>
        <a
          href="https://app.kamino.finance"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-[#1E1E35] text-white font-semibold font-sans text-sm rounded-[12px] px-5 py-3 hover:bg-[#0D0D1A] transition-colors"
        >
          Open Kamino Finance
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Decorative element to fill remaining space */}
      <div className="mt-12 flex items-center gap-3 opacity-50">
        <div className="h-px w-12 bg-vault-border" />
        <Shield className="w-4 h-4 text-vault-muted" />
        <div className="h-px w-12 bg-vault-border" />
      </div>
      <p className="mt-3 text-[11px] text-vault-muted/60 tracking-wider uppercase">Powered by Kamino Finance</p>
    </div>
  );
}

function PositionCard({ position, onClick }) {
  const hasDeposits = position.deposits.length > 0;
  const hasBorrows = position.borrows.length > 0;
  const isBorrowPosition = position.totalBorrowValue > 0;

  return (
    <button
      onClick={onClick}
      className="w-full bg-vault-card border border-vault-border rounded-[16px] p-5 text-left hover:border-vault-border-strong transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-vault-muted font-medium tracking-[0.08em]">{position.market}</span>
            <HealthBadge status={position.healthStatus} size="sm" />
          </div>
          <p className="text-[22px] font-medium font-mono text-vault-text">{formatUsd(position.netValue)}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-vault-muted group-hover:text-vault-accent transition-colors" />
      </div>

      {hasDeposits && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-health-safe" />
            <span className="text-xs text-vault-muted font-medium">Deposits</span>
            <span className="text-xs text-vault-text ml-auto">{formatUsd(position.totalDepositValue)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {position.deposits.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-vault-surface-2 rounded-lg px-2.5 py-1.5">
                <TokenIcon symbol={d.symbol} className="w-4 h-4" />
                <span className="text-xs font-medium text-vault-text">
                  {formatAmount(d.amount)} {d.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasBorrows && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="w-3.5 h-3.5 text-health-risk" />
            <span className="text-xs text-vault-muted font-medium">Borrows</span>
            <span className="text-xs text-vault-text ml-auto">{formatUsd(position.totalBorrowValue)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {position.borrows.map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-vault-surface-2 rounded-lg px-2.5 py-1.5">
                <TokenIcon symbol={b.symbol} className="w-4 h-4" />
                <span className="text-xs font-medium text-vault-text">
                  {formatAmount(b.amount)} {b.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isBorrowPosition && <HealthBar healthFactor={position.healthFactor} className="mt-3" />}

      {position.healthStatus.color === 'critical' && (
        <div className="mt-3 flex items-start gap-2 bg-health-critical/5 border border-health-critical/20 rounded-lg p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-health-critical flex-shrink-0 mt-0.5" />
          <p className="text-xs text-health-critical leading-relaxed">
            {position.healthStatus.description}
          </p>
        </div>
      )}

      {position.healthStatus.color === 'risk' && (
        <div className="mt-3 flex items-start gap-2 bg-health-risk/5 border border-health-risk/20 rounded-lg p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-health-risk flex-shrink-0 mt-0.5" />
          <p className="text-xs text-health-risk leading-relaxed">
            {position.healthStatus.description}
          </p>
        </div>
      )}

      <a
        href={`https://app.kamino.finance/lending/obligation/${position.obligationAddress}${position.marketAddress ? `?market=${position.marketAddress}` : ''}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-vault-secondary bg-transparent border border-vault-border rounded-[8px] px-3 py-2 hover:bg-vault-surface-2 transition-colors"
      >
        View on Kamino
        <ExternalLink className="w-3 h-3" />
      </a>
    </button>
  );
}

export default function PortfolioOverview({ positions, loading, error, portfolioValue, overallHealth, onSelectPosition, onRefresh, isMockMode }) {
  return (
    <div className="min-h-screen">
      <header className={`border-b border-vault-border bg-white sticky z-10 ${isMockMode ? 'top-8' : 'top-0'}`}>
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-vault-accent" />
            <span className="font-semibold text-vault-text text-lg">Vault</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-vault-card transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-vault-muted ${loading ? 'animate-spin' : ''}`} />
            </button>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading && positions.length === 0 ? (
          <div>
            <div className="mb-6 rounded-2xl border border-vault-border bg-vault-card p-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-28 bg-vault-surface-2 rounded mb-2" />
                  <div className="h-4 w-40 bg-vault-surface-2 rounded" />
                </div>
                <div className="text-right">
                  <div className="h-3 w-16 bg-vault-border rounded mb-2 ml-auto" />
                  <div className="h-7 w-24 bg-vault-surface-2 rounded ml-auto" />
                </div>
              </div>
            </div>
            <div className="h-3 w-24 bg-vault-surface-2 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-vault-card border border-vault-border rounded-2xl p-5 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-20 bg-vault-surface-2 rounded" />
                        <div className="h-5 w-14 bg-vault-surface-2 rounded-md" />
                      </div>
                      <div className="h-5 w-24 bg-vault-surface-2 rounded" />
                    </div>
                    <div className="w-5 h-5 bg-vault-surface-2 rounded" />
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-3.5 h-3.5 bg-vault-surface-2 rounded" />
                      <div className="h-3 w-14 bg-vault-surface-2 rounded" />
                      <div className="h-3 w-12 bg-vault-surface-2 rounded ml-auto" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-7 w-24 bg-vault-surface-2 rounded-lg" />
                      <div className="h-7 w-20 bg-vault-surface-2 rounded-lg" />
                    </div>
                  </div>
                  <div className="h-1.5 bg-vault-surface-2 rounded-full mt-3" />
                </div>
              ))}
            </div>
            <p className="text-vault-muted text-xs text-center mt-6">Scanning your Kamino positions…</p>
          </div>
        ) : error && positions.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-health-risk/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-health-risk" />
            </div>
            <p className="text-vault-text font-medium mb-2">Unable to load positions</p>
            <p className="text-vault-muted text-sm mb-4">{error}</p>
            <button
              onClick={onRefresh}
              className="text-vault-accent text-sm font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        ) : positions.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {overallHealth && (
              <div className={`mb-6 rounded-2xl border p-5 ${
                overallHealth.color === 'safe' ? 'bg-health-safe/5 border-health-safe/20' :
                overallHealth.color === 'moderate' ? 'bg-health-moderate/5 border-health-moderate/20' :
                overallHealth.color === 'risk' ? 'bg-health-risk/5 border-health-risk/20' :
                'bg-health-critical/5 border-health-critical/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-vault-muted font-sans font-medium uppercase tracking-[0.08em]">Portfolio Health</span>
                      <HealthBadge status={overallHealth} size="sm" />
                    </div>
                    <p className="text-sm text-vault-text">{overallHealth.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-vault-muted mb-0.5">Total Value</p>
                    <p className="text-[28px] font-medium font-mono text-vault-text">{formatUsd(portfolioValue)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold font-sans text-vault-muted uppercase tracking-[0.08em]">
                Positions ({positions.length})
              </h2>
            </div>

            <div className="space-y-3">
              {positions.map(pos => (
                <PositionCard
                  key={pos.id}
                  position={pos}
                  onClick={() => onSelectPosition(pos)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
