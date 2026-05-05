import React, { useState } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { BarChart3, AlertTriangle, Eye } from 'lucide-react';

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export default function ConnectScreen({ onDemo, onPublicAddress }) {
  const { setVisible } = useWalletModal();
  const [addressInput, setAddressInput] = useState('');
  const [addressError, setAddressError] = useState('');

  const handleViewPositions = () => {
    const trimmed = addressInput.trim();
    if (!trimmed) {
      setAddressError('Invalid Solana address');
      return;
    }
    if (!BASE58_REGEX.test(trimmed)) {
      setAddressError('Invalid Solana address');
      return;
    }
    setAddressError('');
    onPublicAddress(trimmed);
  };

  const handleInputChange = (e) => {
    setAddressInput(e.target.value);
    if (addressError) setAddressError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleViewPositions();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-vault-bg">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect
                x="18" y="1.41"
                width="22" height="22"
                rx="2"
                transform="rotate(45 18 1.41)"
                stroke="#0D0D1A"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
          <h1 className="text-[32px] font-semibold font-sans text-vault-text mb-3 tracking-[-0.02em]">Vault</h1>
          <p className="text-vault-secondary font-sans text-base leading-relaxed">
            Monitor your Kamino Finance positions, health scores, and risk — all in one place.
          </p>
        </div>

        <button
          onClick={() => setVisible(true)}
          className="w-full mb-3 inline-flex items-center justify-center gap-2 bg-[#1E1E35] text-white font-semibold font-sans text-sm rounded-[12px] px-5 py-3.5 hover:bg-[#0D0D1A] transition-colors"
        >
          Connect with Solflare
        </button>
        <p className="mb-2 font-sans text-[11px] text-vault-muted">
          Read-only portfolio access. Vault never requests transaction approval.
        </p>
        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-vault-border" />
          <span className="font-mono text-[11px] text-vault-muted">or</span>
          <div className="flex-1 h-px bg-vault-border" />
        </div>

        {/* Public address input */}
        <input
          type="text"
          value={addressInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter wallet address"
          className="w-full font-mono text-xs bg-vault-surface-2 border border-vault-border rounded-[8px] px-4 py-3 text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-text transition-colors"
        />
        {addressError && (
          <p className="mt-1.5 font-mono text-[11px] text-health-critical text-left">{addressError}</p>
        )}

        {/* View Positions button */}
        <button
          onClick={handleViewPositions}
          className="w-full mt-3 inline-flex items-center justify-center gap-2 bg-transparent text-[#1E1E35] font-medium font-sans text-sm rounded-[12px] px-5 py-3.5 hover:bg-vault-surface-2 transition-colors"
          style={{ border: '1.5px solid #1E1E35' }}
        >
          View Positions
        </button>

        {/* Read-only note */}
        <p className="mt-2.5 font-sans text-[11px] text-vault-muted">
          Read-only · No signing required
        </p>

        <div className="flex justify-center mt-4 mb-8">
          <button
            onClick={onDemo}
            className="text-[13px] font-sans text-vault-accent hover:text-vault-accent/80 transition-colors underline underline-offset-2"
          >
            Preview with demo data
          </button>
        </div>

        <div className="bg-white border border-vault-border rounded-[16px] p-5 text-left">
          <p className="text-xs font-semibold font-sans text-vault-muted uppercase tracking-[0.08em] mb-4">
            After connecting, you will see
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-health-safe/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BarChart3 className="w-4 h-4 text-health-safe" />
              </div>
              <div>
                <p className="text-sm font-medium font-sans text-vault-text">Portfolio overview</p>
                <p className="text-xs font-sans text-vault-muted">Total value and all active positions at a glance.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-vault-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Eye className="w-4 h-4 text-vault-accent" />
              </div>
              <div>
                <p className="text-sm font-medium font-sans text-vault-text">Health scores</p>
                <p className="text-xs font-sans text-vault-muted">Clear status indicators for each position's safety.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-health-risk/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-health-risk" />
              </div>
              <div>
                <p className="text-sm font-medium font-sans text-vault-text">Risk warnings</p>
                <p className="text-xs font-sans text-vault-muted">Know when a position needs attention before it's too late.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs font-sans text-vault-muted mt-6">
          Read-only. Vault never asks for transaction approval.
        </p>
      </div>
    </div>
  );
}
