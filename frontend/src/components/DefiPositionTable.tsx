/**
 * DeFi Position Table Component
 * Displays user's DeFi positions across all protocols
 */

import { useState } from 'react';
import { ArrowUpDown, ExternalLink } from 'lucide-react';
import { DefiPosition } from '../services/defiService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
    </button>
  );

  if (positions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No DeFi positions found. Connect a wallet and sync to see your positions.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>DeFi Positions</CardTitle>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Filter:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
            >
              {positionTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : POSITION_TYPE_LABELS[type] || type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <SortButton field="protocol">Protocol</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <SortButton field="type">Type</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <SortButton field="token">Token</SortButton>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <SortButton field="amount">Amount</SortButton>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <SortButton field="value">Value (USD)</SortButton>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <SortButton field="apy">APY</SortButton>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rewards
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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
                          <div className="font-medium text-sm">
                            {position.protocol?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {position.protocol?.blockchain}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        {POSITION_TYPE_LABELS[position.positionType] || position.positionType}
                      </span>
                    </td>

                    {/* Token */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium text-sm">
                        {position.tokenSymbol}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      {parseFloat(position.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      })}
                    </td>

                    {/* Value USD */}
                    <td className="py-3 px-4 text-right font-medium text-sm">
                      ${parseFloat(position.valueUsd).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* APY */}
                    <td className="py-3 px-4 text-right">
                      {position.apy ? (
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {parseFloat(position.apy).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>

                    {/* Rewards */}
                    <td className="py-3 px-4 text-right">
                      {position.rewardsEarned && parseFloat(position.rewardsEarned) > 0 ? (
                        <div className="text-sm">
                          <div className="font-mono">
                            {parseFloat(position.rewardsEarned).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 8,
                            })}
                          </div>
                          {position.rewardsToken && (
                            <div className="text-xs text-gray-500">{position.rewardsToken}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Wallet */}
                    <td className="py-3 px-4 text-center">
                      {explorerUrl ? (
                        <a
                          href={`${explorerUrl}${position.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title={position.walletAddress}
                        >
                          <ExternalLink className="w-4 h-4 inline" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 font-mono">
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
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm text-gray-500">
          <div>
            Showing {sortedPositions.length} of {positions.length} positions
          </div>
          <div>
            Total Value: <span className="font-semibold text-gray-900 dark:text-gray-100">
              ${sortedPositions.reduce((sum, p) => sum + parseFloat(p.valueUsd), 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
