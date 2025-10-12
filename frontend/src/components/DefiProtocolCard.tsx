/**
 * DeFi Protocol Card Component
 * Displays overview of a DeFi protocol with user's positions
 */

import { ExternalLink, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { DefiProtocol, DefiPosition } from '../services/defiService';

interface DefiProtocolCardProps {
  protocol: DefiProtocol;
  positions: DefiPosition[];
  totalValue: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  dex: '🔄',
  lending: '🏦',
  staking: '🔒',
  yield: '🌾',
  derivatives: '📊',
};

const CATEGORY_LABELS: Record<string, string> = {
  dex: 'DEX',
  lending: 'Lending',
  staking: 'Staking',
  yield: 'Yield',
  derivatives: 'Derivatives',
};

export function DefiProtocolCard({ protocol, positions, totalValue }: DefiProtocolCardProps) {
  const categoryIcon = CATEGORY_ICONS[protocol.category] || '💼';
  const categoryLabel = CATEGORY_LABELS[protocol.category] || protocol.category;

  // Calculate average APY across positions
  const avgApy = positions
    .filter(p => p.apy && parseFloat(p.apy) > 0)
    .reduce((sum, p) => sum + parseFloat(p.apy!), 0) /
    (positions.filter(p => p.apy).length || 1);

  // Format blockchain name
  const blockchainLabel = protocol.blockchain.charAt(0).toUpperCase() + protocol.blockchain.slice(1);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {protocol.logoUrl ? (
              <img
                src={protocol.logoUrl}
                alt={protocol.name}
                className="w-10 h-10 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`text-3xl ${protocol.logoUrl ? 'hidden' : ''}`}>
              {categoryIcon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {protocol.name}
                {protocol.website && (
                  <a
                    href={protocol.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {categoryLabel}
                </span>
                <span className="text-xs text-gray-500">
                  {blockchainLabel}
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Total Value */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Total Value</span>
            </div>
            <div className="text-lg font-semibold">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Positions Count */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Layers className="w-3 h-3" />
              <span>Positions</span>
            </div>
            <div className="text-lg font-semibold">
              {positions.length}
            </div>
          </div>

          {/* Average APY */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>Avg APY</span>
            </div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {avgApy > 0 ? `${avgApy.toFixed(2)}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Position Types Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {Object.entries(
              positions.reduce((acc, position) => {
                const type = position.positionType;
                acc[type] = (acc[type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <span
                key={type}
                className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
              >
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
