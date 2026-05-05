import React from 'react';
import {
  ArrowLeft, ExternalLink, TrendingUp, TrendingDown,
  AlertTriangle, Info, Shield, Gift
} from 'lucide-react';
import HealthBadge, { HealthBar } from './HealthBadge';
import { TOKEN_ICONS } from '../config';

function formatUsd(value) {
  if (value === null || value === undefined) return '$0.00';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatAmount(amount, decimals = 6) {
  if (!amount || amount === 0) return '0';
  if (amount < 0.000001) return '<0.000001';
  return amount.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function formatPct(value) {
  if (!value || value === 0) return '0%';
  return `${(value * 100).toFixed(2)}%`;
}

function TokenIcon({ symbol, className = 'w-8 h-8' }) {
  const icon = TOKEN_ICONS[symbol];
  if (icon) {
    return <img src={icon} alt={symbol} className={`${className} rounded-full`} />;
  }
  return (
    <div className={`${className} rounded-full bg-vault-border flex items-center justify-center`}>
      <span className="text-xs font-bold text-vault-muted">{(symbol || '?').slice(0, 3)}</span>
    </div>
  );
}

function getPositionType(position) {
  const hasBorrows = position.totalBorrowValue > 0;
  const depositSymbols = position.deposits.map(d => d.symbol);
  const borrowSymbols = position.borrows.map(b => b.symbol);

  // Multiply detection: borrowing and depositing the same asset, or deposit is an LST
  // and borrow is SOL (or vice versa) — classic leverage loop
  const isMultiply = hasBorrows && (
    (depositSymbols.length === 1 && borrowSymbols.length === 1 && depositSymbols[0] === borrowSymbols[0]) ||
    (depositSymbols.some(s => ['JitoSOL', 'mSOL', 'bSOL'].includes(s)) && borrowSymbols.includes('SOL'))
  );

  if (isMultiply) return 'Multiply Position';
  if (hasBorrows) return 'Borrow Position';
  return 'Lend Position';
}

function getPositionSummary(position) {
  const type = getPositionType(position);
  const depositSymbols = position.deposits.map(d => d.symbol).join(', ');
  const borrowSymbols = position.borrows.map(b => b.symbol).join(', ');

  if (type === 'Lend Position') {
    return `You're lending ${depositSymbols} to earn interest. Your money is working for you while sitting in the pool. Since you haven't borrowed anything, there's no risk of liquidation.`;
  }
  if (type === 'Multiply Position') {
    return `You're using a leveraged strategy — depositing ${depositSymbols} and borrowing ${borrowSymbols} to amplify your exposure. This can boost your returns, but also means bigger losses if the market moves against you.`;
  }
  return `You deposited ${depositSymbols} as collateral and borrowed ${borrowSymbols}. You owe the borrowed amount back plus interest. If the value of your collateral drops too far, part of it may be sold automatically to cover the debt.`;
}

function getPositionExplanation(position) {
  const depositSymbols = position.deposits.map(d => d.symbol).join(', ');
  const borrowSymbols = position.borrows.map(b => b.symbol).join(', ');
  const hasBorrows = position.totalBorrowValue > 0;

  if (!hasBorrows) {
    return `You have deposited ${depositSymbols} into Kamino's ${position.market} as collateral. Since you haven't borrowed anything, there is no liquidation risk. You're earning supply interest on your deposit.`;
  }

  return `You deposited ${depositSymbols} as collateral and borrowed ${borrowSymbols} from Kamino's ${position.market}. Your collateral backs the loan — if its value drops too much relative to your borrow, your position could be partially liquidated to repay the debt.`;
}

function Section({ title, icon: Icon, iconColor = 'text-vault-accent', children }) {
  return (
    <div className="bg-vault-card border border-vault-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-vault-border flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-semibold text-vault-text">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function PositionDetail({ position, onBack, isMockMode }) {
  const hasBorrows = position.totalBorrowValue > 0;
  const explanation = getPositionExplanation(position);
  const positionType = getPositionType(position);
  const positionSummary = getPositionSummary(position);

  return (
    <div className="min-h-screen">
      <header className={`border-b border-vault-border bg-vault-bg sticky z-10 ${isMockMode ? 'top-8' : 'top-0'}`}>
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-vault-card transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-vault-muted" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-vault-text truncate">{position.market}</h1>
            <p className="text-xs text-vault-muted">{positionType}</p>
          </div>
          <HealthBadge status={position.healthStatus} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Plain Language Summary */}
        <div className="bg-vault-card border border-vault-border rounded-2xl p-4">
          <p className="text-sm text-vault-text leading-relaxed">{positionSummary}</p>
        </div>

        {/* Overview Card */}
        <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-vault-muted mb-0.5">Net Value</p>
              <p className="text-xl font-bold font-mono text-vault-text">{formatUsd(position.netValue)}</p>
            </div>
            <div>
              <p className="text-xs text-vault-muted mb-0.5">Deposited</p>
              <p className="text-lg font-semibold text-health-safe">{formatUsd(position.totalDepositValue)}</p>
            </div>
            <div>
              <p className="text-xs text-vault-muted mb-0.5">Borrowed</p>
              <p className={`text-lg font-semibold ${hasBorrows ? 'text-health-risk' : 'text-gray-500'}`}>
                {hasBorrows ? formatUsd(position.totalBorrowValue) : '—'}
              </p>
            </div>
          </div>
          {hasBorrows && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-vault-muted mb-0.5">Loan-to-Value</p>
                <p className="text-sm font-mono text-vault-text">{formatPct(position.ltv)}</p>
              </div>
              <div>
                <p className="text-xs text-vault-muted mb-0.5">Borrow Limit</p>
                <p className="text-sm font-mono text-vault-text">
                  {position.borrowLimit ? formatUsd(position.borrowLimit) : '—'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="flex items-start gap-3 bg-vault-accent/5 border border-vault-accent/15 rounded-2xl p-4">
          <Info className="w-4 h-4 text-vault-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm text-vault-text leading-relaxed">{explanation}</p>
        </div>

        {/* Risk Warning */}
        {(position.healthStatus.color === 'critical' || position.healthStatus.color === 'risk') && (
          <div className={`flex items-start gap-3 rounded-2xl p-4 border ${
            position.healthStatus.color === 'critical'
              ? 'bg-health-critical/5 border-health-critical/20'
              : 'bg-health-risk/5 border-health-risk/20'
          }`}>
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
              position.healthStatus.color === 'critical' ? 'text-health-critical' : 'text-health-risk'
            }`} />
            <div>
              <p className={`text-sm font-medium mb-1 ${
                position.healthStatus.color === 'critical' ? 'text-health-critical' : 'text-health-risk'
              }`}>
                {position.healthStatus.label} — Action recommended
              </p>
              <p className="text-xs text-vault-text leading-relaxed">
                {position.healthStatus.description} You can improve your health factor by adding
                more collateral or repaying part of your borrow.
              </p>
            </div>
          </div>
        )}

        {/* Health Score */}
        {hasBorrows && (
          <Section title="Health Score" icon={Shield} iconColor="text-health-safe">
            <HealthBar healthFactor={position.healthFactor} className="mb-4" />
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-vault-muted leading-relaxed">
                <strong className="text-vault-text">What is health factor?</strong> It measures how safe your
                borrow position is. A factor of 1.0 means you're at the liquidation threshold — your collateral
                could be sold to repay the loan. Above 2.0 is generally considered safe. The higher, the better.
              </p>
            </div>
          </Section>
        )}

        {/* Deposits */}
        <Section title="Collateral Deposits" icon={TrendingUp} iconColor="text-health-safe">
          <div className="space-y-3">
            {position.deposits.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <TokenIcon symbol={d.symbol} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium text-vault-text">{d.symbol}</p>
                    <p className="text-sm font-medium text-vault-text">{formatUsd(d.value)}</p>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs text-vault-muted">{formatAmount(d.amount)}</p>
                    {d.supplyApy > 0 && (
                      <p className="text-xs text-health-safe">+{formatPct(d.supplyApy)} APY</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {position.deposits.some(d => d.supplyApy > 0) && (
            <div className="mt-4 bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-vault-muted leading-relaxed">
                <strong className="text-vault-text">Supply APY</strong> is the base interest rate you earn
                just by depositing. This is the organic yield from borrower interest — no additional incentives.
              </p>
            </div>
          )}
        </Section>

        {/* Borrows */}
        {hasBorrows && (
          <Section title="Active Borrows" icon={TrendingDown} iconColor="text-health-risk">
            <div className="space-y-3">
              {position.borrows.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <TokenIcon symbol={b.symbol} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium text-vault-text">{b.symbol}</p>
                      <p className="text-sm font-medium text-vault-text">{formatUsd(b.value)}</p>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs text-vault-muted">{formatAmount(b.amount)}</p>
                      {b.borrowApy > 0 && (
                        <p className="text-xs text-health-risk">-{formatPct(b.borrowApy)} APY</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {position.borrows.some(b => b.borrowApy > 0) && (
              <div className="mt-4 bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs text-vault-muted leading-relaxed">
                  <strong className="text-vault-text">Borrow APY</strong> is the interest rate you pay on your
                  loan. This accrues over time and increases the amount you owe. Make sure your strategy earns
                  more than you're paying in borrow interest.
                </p>
              </div>
            )}
          </Section>
        )}

        {/* Liquidation Info */}
        {hasBorrows && (
          <Section title="Liquidation Risk" icon={AlertTriangle} iconColor="text-health-moderate">
            <div className="space-y-3">
              {position.liquidationThreshold > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-vault-muted">Liquidation Threshold</span>
                  <span className="text-sm font-mono text-vault-text">{formatPct(position.liquidationThreshold)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-vault-muted">Current LTV</span>
                <span className={`text-sm font-mono ${
                  position.ltv > 0.8 ? 'text-health-critical' :
                  position.ltv > 0.6 ? 'text-health-risk' : 'text-vault-text'
                }`}>{formatPct(position.ltv)}</span>
              </div>
              {position.liquidationPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-vault-muted">Est. Liquidation Price</span>
                  <span className="text-sm font-mono text-health-risk">{formatUsd(position.liquidationPrice)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-vault-muted leading-relaxed">
                <strong className="text-vault-text">How liquidation works:</strong> If your loan-to-value ratio
                reaches the liquidation threshold, a portion of your collateral is automatically sold to repay part
                of the debt. This protects lenders but costs you a liquidation penalty. Keep your LTV well below
                the threshold to stay safe.
              </p>
              {position.liquidationPrice && (
                <p className="text-xs text-vault-muted leading-relaxed mt-2">
                  <strong className="text-vault-text">Liquidation price</strong> is the estimated price of your
                  collateral at which liquidation would begin. If {position.deposits[0]?.symbol || 'your collateral'} drops
                  to ~{formatUsd(position.liquidationPrice)}, your position is at risk.
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Rewards */}
        {position.rewards && position.rewards.length > 0 && (
          <Section title="Pending Rewards" icon={Gift} iconColor="text-health-moderate">
            <div className="space-y-3">
              {position.rewards.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <TokenIcon symbol={r.symbol} className="w-6 h-6" />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium text-vault-text">{r.symbol}</p>
                      <p className="text-sm text-vault-text">{formatAmount(r.amount)}</p>
                    </div>
                    {r.value > 0 && (
                      <p className="text-xs text-vault-muted text-right">{formatUsd(r.value)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Obligation Address */}
        {position.obligationAddress && (
          <div className="text-center pb-4">
            <a
              href={`https://solscan.io/account/${position.obligationAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-vault-muted hover:text-vault-accent transition-colors"
            >
              View on Solscan
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
