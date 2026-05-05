import React from 'react';

const colorMap = {
  safe: {
    bg: 'bg-health-safe/8',
    border: 'border-health-safe/25',
    text: 'text-health-safe',
    dot: 'bg-health-safe',
  },
  moderate: {
    bg: 'bg-health-moderate/8',
    border: 'border-health-moderate/25',
    text: 'text-health-moderate',
    dot: 'bg-health-moderate',
  },
  risk: {
    bg: 'bg-health-risk/8',
    border: 'border-health-risk/25',
    text: 'text-health-risk',
    dot: 'bg-health-risk',
  },
  critical: {
    bg: 'bg-health-critical/8',
    border: 'border-health-critical/25',
    text: 'text-health-critical',
    dot: 'bg-health-critical',
  },
};

export default function HealthBadge({ status, size = 'md' }) {
  if (!status) return null;
  const c = colorMap[status.color] || colorMap.safe;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${c.bg} ${c.border} ${c.text} ${
        isSmall ? 'px-2 py-0.5 text-xs rounded-md' : 'px-3 py-1 text-sm rounded-lg'
      } font-semibold font-sans`}
    >
      <span className={`${c.dot} ${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full`} />
      {status.label}
    </span>
  );
}

export function HealthBar({ healthFactor, className = '' }) {
  if (healthFactor === null || healthFactor === undefined || healthFactor === Infinity) {
    return (
      <div className={`${className}`}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-sans text-vault-muted">Health Factor</span>
          <span className="text-xs font-mono text-health-safe">∞</span>
        </div>
        <div className="h-1.5 bg-vault-surface-2 border border-vault-border rounded-full overflow-hidden">
          <div className="h-full bg-health-safe rounded-full w-full" />
        </div>
      </div>
    );
  }

  const clamped = Math.min(Math.max(healthFactor, 0), 3);
  const pct = (clamped / 3) * 100;

  let barColor = 'bg-health-safe';
  if (healthFactor < 1.1) barColor = 'bg-health-critical';
  else if (healthFactor < 1.5) barColor = 'bg-health-risk';
  else if (healthFactor < 2.0) barColor = 'bg-health-moderate';

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-sans text-vault-muted">Health Factor</span>
        <span className={`text-xs font-mono ${healthFactor < 1.1 ? 'text-health-critical' : healthFactor < 1.5 ? 'text-health-risk' : healthFactor < 2.0 ? 'text-health-moderate' : 'text-health-safe'}`}>
          {healthFactor.toFixed(2)}
        </span>
      </div>
      <div className="h-1.5 bg-vault-surface-2 border border-vault-border rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
