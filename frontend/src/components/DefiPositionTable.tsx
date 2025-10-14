/**
 * DeFi Position Table Component
 * Displays user's DeFi positions across all protocols
 */

import { useState } from 'react';
import { ArrowUpDown, ExternalLink } from 'lucide-react';
import { DefiPosition } from '../services/defiService';

interface DefiPositionTableProps {
  positions: DefiPosition[];
}

type SortField = 'protocol' | 'type' | 'token' | 'amount' | 'value' | 'apy';
type SortDirection = 'asc' | 'desc';

const POSITION_TYPE_LABELS: Record<string, string> = {
  liquidity: 'Liquidity Pool',
  lending: 'Lending',
  borrowing: 'Borrowing',
  staking: 'Staking',
  farming: 'Yield Farming',
};

const BLOCKCHAIN_EXPLORERS: Record<string, string> = {
  ethereum: 'https://etherscan.io/address/',
  bsc: 'https://bscscan.com/address/',
  polygon: 'https://polygonscan.com/address/',
  arbitrum: 'https://arbiscan.io/address/',
  optimism: 'https://optimistic.etherscan.io/address/',
};

export function DefiPositionTable({ positions }: DefiPositionTableProps) {
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<string>('all');

  // Get unique position types for filter
  const positionTypes = ['all', ...Array.from(new Set(positions.map(p => p.positionType)))];

  // Filter positions
  const filteredPositions = filterType === 'all'
    ? positions
    : positions.filter(p => p.positionType === filterType);

  // Sort positions
  const sortedPositions = [...filteredPositions].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'protocol':
        aValue = a.protocol?.name || '';
        bValue = b.protocol?.name || '';
        break;
      case 'type':
        aValue = a.positionType;
        bValue = b.positionType;
        break;
      case 'token':
        aValue = a.tokenSymbol;
        bValue = b.tokenSymbol;
        break;
      case 'amount':
        aValue = parseFloat(a.amount);
        bValue = parseFloat(b.amount);
        break;
      case 'value':
        aValue = parseFloat(a.valueUsd);
        bValue = parseFloat(b.valueUsd);
        break;
      case 'apy':
        aValue = parseFloat(a.apy || '0');
        bValue = parseFloat(b.apy || '0');
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-[#3b82f6] transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-[#3b82f6]' : 'text-white/40'}`} />
    </button>
  );

  if (positions.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-white/60">No DeFi positions found. Connect a wallet and sync to see your positions.</p>
      </div>
    );
  }

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">DeFi Positions</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/50">Filter:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-white/10 rounded px-2 py-1 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              {positionTypes.map(type => (
                <option key={type} value={type} className="bg-black text-white">
                  {type === 'all' ? 'All Types' : POSITION_TYPE_LABELS[type] || type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-white/70">
                  <SortButton field="protocol">Protocol</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/70">
                  <SortButton field="type">Type</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/70">
                  <SortButton field="token">Token</SortButton>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-white/70">
                  <SortButton field="amount">Amount</SortButton>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-white/70">
                  <SortButton field="value">Value (USD)</SortButton>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-white/70">
                  <SortButton field="apy">APY</SortButton>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-white/70">
                  Rewards
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-white/70">
                  Wallet
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPositions.map((position) => {
                const explorerUrl = position.protocol
                  ? BLOCKCHAIN_EXPLORERS[position.protocol.blockchain]
                  : null;

                return (
                  <tr
                    key={position.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Protocol */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {position.protocol?.logoUrl && (
                          <img
                            src={position.protocol.logoUrl}
                            alt={position.protocol.name}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm text-white">
                            {position.protocol?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-white/50">
                            {position.protocol?.blockchain}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="text-sm bg-[#3b82f6]/10 text-[#3b82f6] px-2 py-1 rounded border border-[#3b82f6]/20">
                        {POSITION_TYPE_LABELS[position.positionType] || position.positionType}
                      </span>
                    </td>

                    {/* Token */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium text-sm text-white">
                        {position.tokenSymbol}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono text-sm text-white">
                      {parseFloat(position.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      })}
                    </td>

                    {/* Value USD */}
                    <td className="py-3 px-4 text-right font-medium text-sm text-white">
                      ${parseFloat(position.valueUsd).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* APY */}
                    <td className="py-3 px-4 text-right">
                      {position.apy ? (
                        <span className="text-sm font-medium text-[#10b981]">
                          {parseFloat(position.apy).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-sm text-white/40">N/A</span>
                      )}
                    </td>

                    {/* Rewards */}
                    <td className="py-3 px-4 text-right">
                      {position.rewardsEarned && parseFloat(position.rewardsEarned) > 0 ? (
                        <div className="text-sm">
                          <div className="font-mono text-white">
                            {parseFloat(position.rewardsEarned).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 8,
                            })}
                          </div>
                          {position.rewardsToken && (
                            <div className="text-xs text-white/50">{position.rewardsToken}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-white/40">-</span>
                      )}
                    </td>

                    {/* Wallet */}
                    <td className="py-3 px-4 text-center">
                      {explorerUrl ? (
                        <a
                          href={`${explorerUrl}${position.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3b82f6] hover:text-[#3b82f6]/80"
                          title={position.walletAddress}
                        >
                          <ExternalLink className="w-4 h-4 inline" />
                        </a>
                      ) : (
                        <span className="text-xs text-white/40 font-mono">
                          {position.walletAddress.slice(0, 6)}...{position.walletAddress.slice(-4)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-sm text-white/60">
          <div>
            Showing {sortedPositions.length} of {positions.length} positions
          </div>
          <div>
            Total Value: <span className="font-semibold text-white">
              ${sortedPositions.reduce((sum, p) => sum + parseFloat(p.valueUsd), 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
