/**
 * Simple Web Dashboard for Token Unlock Strategy Results
 *
 * This creates an HTML file you can open in your browser
 * to see strategy results visually.
 *
 * Usage:
 *   npx tsx scripts/view-results-web.ts
 *   Then open: results.html in your browser
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function generateHTML() {
  console.log('📊 Generating Web Dashboard...\n');

  // Fetch data
  const strategy = await prisma.tradingStrategy.findFirst({
    where: { name: { contains: 'Token Unlock', mode: 'insensitive' } },
  });

  if (!strategy) {
    console.log('❌ Strategy not found');
    return;
  }

  const state = await prisma.strategyExecutionState.findUnique({
    where: { strategyId: strategy.id },
  });

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcomingUnlocks = await prisma.tokenUnlockSchedule.findMany({
    where: {
      unlockDate: { gte: now, lte: thirtyDaysFromNow },
    },
    include: { token: true },
    orderBy: { unlockDate: 'asc' },
  });

  // Try to fetch signals (table may not exist)
  let signals: any[] = [];
  try {
    signals = await prisma.tradingSignal.findMany({
      where: { strategyId: strategy.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  } catch (e) {
    console.log('ℹ️  Signals table not created yet');
  }

  // Try to fetch positions
  let positions: any[] = [];
  try {
    positions = await prisma.livePosition.findMany({
      where: { strategyId: strategy.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  } catch (e) {
    console.log('ℹ️  Positions table not created yet');
  }

  // Generate HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Token Unlock Strategy Results</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      color: white;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .card h2 {
      font-size: 1.3rem;
      margin-bottom: 16px;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 8px;
    }
    .stat {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .stat:last-child { border-bottom: none; }
    .stat-label {
      color: #666;
      font-weight: 500;
    }
    .stat-value {
      color: #333;
      font-weight: 600;
    }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .entry-window {
      background: #fef3c7;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      color: #92400e;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #9ca3af;
    }
    .refresh-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: white;
      color: #667eea;
      border: none;
      padding: 16px 24px;
      border-radius: 50px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s;
    }
    .refresh-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
    .timestamp {
      text-align: center;
      color: white;
      opacity: 0.8;
      margin-top: 20px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Token Unlock Strategy Dashboard</h1>
      <p>Real-time Paper Trading Results</p>
    </div>

    <!-- Strategy Overview -->
    <div class="grid">
      <div class="card">
        <h2>🎯 Strategy Status</h2>
        <div class="stat">
          <span class="stat-label">Status</span>
          <span class="stat-value">
            <span class="badge ${state?.isActive ? 'badge-green' : 'badge-red'}">
              ${state?.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
            </span>
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Mode</span>
          <span class="stat-value">${state?.mode.toUpperCase() || 'N/A'}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Win Rate (Backtest)</span>
          <span class="stat-value">${(strategy.winRate.toNumber() * 100).toFixed(2)}%</span>
        </div>
        <div class="stat">
          <span class="stat-label">Risk/Reward</span>
          <span class="stat-value">${strategy.riskRewardRatio.toNumber()}</span>
        </div>
      </div>

      <div class="card">
        <h2>💰 Capital & P&L</h2>
        <div class="stat">
          <span class="stat-label">Current Capital</span>
          <span class="stat-value">$${state?.currentCapital.toNumber().toLocaleString() || '0'}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total P&L</span>
          <span class="stat-value ${(state?.totalPnl.toNumber() || 0) >= 0 ? 'positive' : 'negative'}">
            ${(state?.totalPnl.toNumber() || 0) >= 0 ? '+' : ''}$${(state?.totalPnl.toNumber() || 0).toFixed(2)}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Realized P&L</span>
          <span class="stat-value ${(state?.realizedPnl.toNumber() || 0) >= 0 ? 'positive' : 'negative'}">
            ${(state?.realizedPnl.toNumber() || 0) >= 0 ? '+' : ''}$${(state?.realizedPnl.toNumber() || 0).toFixed(2)}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Unrealized P&L</span>
          <span class="stat-value ${(state?.unrealizedPnl.toNumber() || 0) >= 0 ? 'positive' : 'negative'}">
            ${(state?.unrealizedPnl.toNumber() || 0) >= 0 ? '+' : ''}$${(state?.unrealizedPnl.toNumber() || 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div class="card">
        <h2>📈 Performance</h2>
        <div class="stat">
          <span class="stat-label">Total Trades</span>
          <span class="stat-value">${state?.totalTrades || 0}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Win Rate</span>
          <span class="stat-value">${state?.winRate ? (state.winRate.toNumber() * 100).toFixed(2) + '%' : 'N/A'}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Max Drawdown</span>
          <span class="stat-value">${state?.maxDrawdown ? (state.maxDrawdown.toNumber() * 100).toFixed(2) + '%' : 'N/A'}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Open Positions</span>
          <span class="stat-value">${state?.currentOpenPositions || 0} / ${state?.maxOpenPositions || 3}</span>
        </div>
      </div>
    </div>

    <!-- Upcoming Unlocks -->
    <div class="card" style="margin-bottom: 30px;">
      <h2>📅 Upcoming Token Unlocks (Next 30 Days)</h2>
      ${upcomingUnlocks.length === 0 ? `
        <div class="empty-state">
          <p>No upcoming unlocks found</p>
          <small>Run: npx tsx scripts/add-token-unlock-events.ts</small>
        </div>
      ` : `
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Unlock Date</th>
              <th>Days Until</th>
              <th>Amount</th>
              <th>% Supply</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${upcomingUnlocks.map(unlock => {
              const hoursUntil = Math.round((unlock.unlockDate.getTime() - now.getTime()) / (60 * 60 * 1000));
              const daysUntil = Math.round(hoursUntil / 24);
              const inEntryWindow = hoursUntil >= 24 && hoursUntil <= 48;

              return `
                <tr>
                  <td><strong>${unlock.token.symbol}</strong></td>
                  <td>${unlock.unlockDate.toLocaleDateString()} ${unlock.unlockDate.toLocaleTimeString()}</td>
                  <td>${daysUntil} days (${hoursUntil}h)</td>
                  <td>${unlock.unlockAmount.toNumber().toLocaleString()}</td>
                  <td>${unlock.percentOfSupply.toNumber()}%</td>
                  <td>${unlock.category || 'N/A'}</td>
                  <td>
                    ${inEntryWindow
                      ? '<span class="entry-window">🎯 ENTRY WINDOW</span>'
                      : hoursUntil < 24
                        ? '<span class="badge badge-red">Too Close</span>'
                        : '<span class="badge badge-blue">Waiting</span>'
                    }
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `}
    </div>

    <!-- Recent Signals -->
    <div class="card" style="margin-bottom: 30px;">
      <h2>📡 Recent Signals</h2>
      ${signals.length === 0 ? `
        <div class="empty-state">
          <p>No signals generated yet</p>
          <small>Signals will appear when tokens enter 24-48h window</small>
        </div>
      ` : `
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Symbol</th>
              <th>Strength</th>
              <th>Reasoning</th>
              <th>Executed</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${signals.map(signal => `
              <tr>
                <td><span class="badge ${signal.action === 'buy' ? 'badge-green' : 'badge-red'}">${signal.action.toUpperCase()}</span></td>
                <td><strong>${signal.symbol}</strong></td>
                <td>${signal.strength?.toNumber().toFixed(2) || 'N/A'}</td>
                <td>${signal.reasoning || 'N/A'}</td>
                <td>${signal.executed ? '✅' : '⏳'}</td>
                <td>${new Date(signal.createdAt).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>

    <!-- Open Positions -->
    <div class="card">
      <h2>💼 Recent Positions</h2>
      ${positions.length === 0 ? `
        <div class="empty-state">
          <p>No positions yet</p>
          <small>Positions will appear when signals are executed</small>
        </div>
      ` : `
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Side</th>
              <th>Entry Price</th>
              <th>Quantity</th>
              <th>Current P&L</th>
              <th>Status</th>
              <th>Opened</th>
            </tr>
          </thead>
          <tbody>
            ${positions.map(pos => {
              const pnl = pos.pnl.toNumber();
              const pnlPercent = pos.pnlPercent?.toNumber() || 0;

              return `
                <tr>
                  <td><strong>${pos.symbol}</strong></td>
                  <td><span class="badge ${pos.side === 'long' ? 'badge-green' : 'badge-red'}">${pos.side.toUpperCase()}</span></td>
                  <td>$${pos.entryPrice.toNumber().toFixed(6)}</td>
                  <td>${pos.quantity.toNumber()}</td>
                  <td class="${pnl >= 0 ? 'positive' : 'negative'}">
                    ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)
                  </td>
                  <td><span class="badge ${pos.status === 'open' ? 'badge-green' : 'badge-yellow'}">${pos.status.toUpperCase()}</span></td>
                  <td>${new Date(pos.createdAt).toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `}
    </div>

    <div class="timestamp">
      Last updated: ${new Date().toLocaleString()}
    </div>

    <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
  </div>
</body>
</html>
  `;

  // Write to file
  const filePath = join(process.cwd(), '..', 'results.html');
  writeFileSync(filePath, html, 'utf-8');

  console.log('✅ Web dashboard generated!');
  console.log(`\n📂 File created: ${filePath}`);
  console.log('\n💡 To view:');
  console.log('   1. Open Windows Explorer');
  console.log('   2. Navigate to: C:\\Users\\Mac\\OneDrive\\Desktop\\Projects\\crypo scanner');
  console.log('   3. Double-click: results.html');
  console.log('\n🔄 Re-run this script anytime to refresh the dashboard\n');
}

generateHTML()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
