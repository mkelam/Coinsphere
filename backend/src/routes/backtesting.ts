/**
 * Backtesting API Routes - Phase 1 Dashboard
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { ingestOHLCVData, ingestMultipleSymbols, getCachedOHLCV } from '../services/dataIngestionService.js';

const router = Router();

// ============================================================================
// DATA INGESTION ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/backtesting/data-status
 * Get overview of available cached data
 */
router.get('/data-status', async (req, res) => {
  try {
    const stats = await prisma.$queryRaw<Array<{
      symbol: string;
      timeframe: string;
      data_points: bigint;
      earliest_date: Date;
      latest_date: Date;
      data_source: string;
    }>>`
      SELECT
        symbol,
        timeframe,
        COUNT(*) as data_points,
        MIN(timestamp) as earliest_date,
        MAX(timestamp) as latest_date,
        data_source
      FROM market_data_ohlcv
      GROUP BY symbol, timeframe, data_source
      ORDER BY symbol, timeframe
    `;

    const formattedStats = stats.map(s => ({
      symbol: s.symbol,
      timeframe: s.timeframe,
      dataPoints: Number(s.data_points),
      earliestDate: s.earliest_date,
      latestDate: s.latest_date,
      dataSource: s.data_source,
      daysOfData: Math.floor(
        (new Date(s.latest_date).getTime() - new Date(s.earliest_date).getTime()) / (1000 * 60 * 60 * 24)
      )
    }));

    res.json({
      success: true,
      data: formattedStats,
      totalRecords: formattedStats.reduce((sum, s) => sum + s.dataPoints, 0)
    });

  } catch (error: any) {
    logger.error('Failed to get data status', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/backtesting/ingest-data
 * Trigger data ingestion for a symbol
 */
const ingestDataSchema = z.object({
  symbol: z.string(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w']),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  dataSource: z.enum(['coingecko', 'binance']).optional()
});

router.post('/ingest-data', async (req, res) => {
  try {
    const params = ingestDataSchema.parse(req.body);

    logger.info('Starting data ingestion via API', params);

    const recordsInserted = await ingestOHLCVData(params);

    res.json({
      success: true,
      data: {
        symbol: params.symbol,
        timeframe: params.timeframe,
        recordsInserted,
        startDate: params.startDate,
        endDate: params.endDate
      }
    });

  } catch (error: any) {
    logger.error('Data ingestion failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/backtesting/ingest-bulk
 * Ingest data for multiple symbols at once
 */
const ingestBulkSchema = z.object({
  symbols: z.array(z.string()),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w']),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  dataSource: z.enum(['coingecko', 'binance']).optional()
});

router.post('/ingest-bulk', async (req, res) => {
  try {
    const params = ingestBulkSchema.parse(req.body);

    logger.info('Starting bulk data ingestion via API', {
      symbolCount: params.symbols.length,
      timeframe: params.timeframe
    });

    const results = await ingestMultipleSymbols(
      params.symbols,
      params.timeframe,
      params.startDate,
      params.endDate,
      params.dataSource
    );

    res.json({
      success: true,
      data: {
        results,
        totalSymbols: params.symbols.length,
        totalRecords: Object.values(results).reduce((sum, count) => sum + count, 0)
      }
    });

  } catch (error: any) {
    logger.error('Bulk data ingestion failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// BACKTEST CONFIGURATION ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/backtesting/configs
 * List all backtest configurations
 */
router.get('/configs', async (req, res) => {
  try {
    const { strategy_id, status, limit = '50', offset = '0' } = req.query;

    const configs = await prisma.$queryRaw<Array<any>>`
      SELECT
        bc.*,
        ts.name as strategy_name,
        ts.archetype as strategy_archetype,
        COUNT(bt.id) as trade_count
      FROM backtest_configs bc
      LEFT JOIN trading_strategies ts ON bc.strategy_id = ts.id
      LEFT JOIN backtest_trades bt ON bc.id = bt.backtest_id
      WHERE
        (${strategy_id}::text IS NULL OR bc.strategy_id = ${strategy_id})
        AND (${status}::text IS NULL OR bc.status = ${status})
      GROUP BY bc.id, ts.name, ts.archetype
      ORDER BY bc.created_at DESC
      LIMIT ${Number(limit)}
      OFFSET ${Number(offset)}
    `;

    res.json({
      success: true,
      data: configs,
      pagination: {
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error: any) {
    logger.error('Failed to list backtest configs', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/backtesting/configs/:id
 * Get detailed backtest configuration and results
 */
router.get('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const config = await prisma.$queryRaw<Array<any>>`
      SELECT
        bc.*,
        ts.name as strategy_name,
        ts.archetype as strategy_archetype,
        ts.description as strategy_description
      FROM backtest_configs bc
      LEFT JOIN trading_strategies ts ON bc.strategy_id = ts.id
      WHERE bc.id = ${id}::uuid
    `;

    if (!config || config.length === 0) {
      return res.status(404).json({ success: false, error: 'Backtest config not found' });
    }

    // Get trade statistics
    const tradeStats = await prisma.$queryRaw<Array<any>>`
      SELECT
        COUNT(*) as total_trades,
        SUM(CASE WHEN pnl_usd > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN pnl_usd < 0 THEN 1 ELSE 0 END) as losing_trades,
        AVG(pnl_pct) as avg_pnl_pct,
        AVG(CASE WHEN pnl_usd > 0 THEN pnl_pct END) as avg_winner_pct,
        AVG(CASE WHEN pnl_usd < 0 THEN pnl_pct END) as avg_loser_pct,
        SUM(fees_paid + slippage_cost) as total_costs
      FROM backtest_trades
      WHERE backtest_id = ${id}::uuid
        AND status = 'closed'
    `;

    res.json({
      success: true,
      data: {
        config: config[0],
        tradeStats: tradeStats[0]
      }
    });

  } catch (error: any) {
    logger.error('Failed to get backtest config', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/backtesting/configs
 * Create a new backtest configuration
 */
const createConfigSchema = z.object({
  strategyId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w']),
  initialCapital: z.number().default(10000),
  positionSizePct: z.number().default(0.05),
  maxPortfolioHeat: z.number().default(0.25),
  maxDrawdownLimit: z.number().default(0.20),
  makerFee: z.number().default(0.001),
  takerFee: z.number().default(0.001),
  slippagePct: z.number().default(0.005),
  latencyMs: z.number().default(100)
});

router.post('/configs', async (req, res) => {
  try {
    const params = createConfigSchema.parse(req.body);

    const config = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO backtest_configs (
        id, strategy_id, name, description,
        start_date, end_date, timeframe,
        initial_capital, position_size_pct, max_portfolio_heat, max_drawdown_limit,
        maker_fee, taker_fee, slippage_pct, latency_ms,
        status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${params.strategyId}::text,
        ${params.name},
        ${params.description || null},
        ${params.startDate},
        ${params.endDate},
        ${params.timeframe},
        ${params.initialCapital},
        ${params.positionSizePct},
        ${params.maxPortfolioHeat},
        ${params.maxDrawdownLimit},
        ${params.makerFee},
        ${params.takerFee},
        ${params.slippagePct},
        ${params.latencyMs},
        'pending',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id
    `;

    res.json({
      success: true,
      data: { id: config[0].id }
    });

  } catch (error: any) {
    logger.error('Failed to create backtest config', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// BACKTEST TRADES ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/backtesting/configs/:id/trades
 * Get all trades for a backtest
 */
router.get('/configs/:id/trades', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = '100', offset = '0', status } = req.query;

    const trades = await prisma.$queryRaw<Array<any>>`
      SELECT *
      FROM backtest_trades
      WHERE backtest_id = ${id}::uuid
        AND (${status}::text IS NULL OR status = ${status})
      ORDER BY entry_time ASC
      LIMIT ${Number(limit)}
      OFFSET ${Number(offset)}
    `;

    res.json({
      success: true,
      data: trades,
      pagination: {
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error: any) {
    logger.error('Failed to get backtest trades', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// BACKTEST METRICS ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/backtesting/configs/:id/metrics
 * Get performance metrics over time for a backtest
 */
router.get('/configs/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const { interval = 'daily' } = req.query;

    const metrics = await prisma.$queryRaw<Array<any>>`
      SELECT *
      FROM backtest_metrics
      WHERE backtest_id = ${id}::uuid
      ORDER BY timestamp ASC
    `;

    res.json({
      success: true,
      data: metrics
    });

  } catch (error: any) {
    logger.error('Failed to get backtest metrics', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/backtesting/results/:id
 * Get complete backtest results with performance metrics, trades, and equity curve
 *
 * This endpoint provides all data needed for performance visualization:
 * - Configuration details
 * - Performance summary (returns, drawdowns, etc.)
 * - Advanced metrics (Sharpe, Sortino, Calmar, Kelly, etc.)
 * - Complete trade history
 * - Equity curve data points
 */
router.get('/results/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get backtest configuration and basic results
    const config = await prisma.$queryRaw<Array<any>>`
      SELECT
        bc.*,
        ts.name as strategy_name,
        ts.archetype as strategy_archetype,
        ts.description as strategy_description
      FROM backtest_configs bc
      LEFT JOIN trading_strategies ts ON bc.strategy_id = ts.id
      WHERE bc.id = ${id}::uuid
    `;

    if (!config || config.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Backtest not found'
      });
    }

    const backtestConfig = config[0];

    // Get all trades with full details
    const trades = await prisma.$queryRaw<Array<any>>`
      SELECT
        id,
        symbol,
        entry_time,
        exit_time,
        entry_price,
        exit_price,
        position_size,
        pnl_usd,
        pnl_pct,
        fees_paid,
        slippage_cost,
        hold_time_hours,
        entry_reason,
        exit_reason,
        status
      FROM backtest_trades
      WHERE backtest_id = ${id}::uuid
        AND status = 'closed'
      ORDER BY entry_time ASC
    `;

    // Get equity curve metrics (time series of portfolio value)
    // TODO: Populate backtest_metrics during backtest execution
    const equityCurve = [] as Array<any>;

    // Calculate trade statistics
    const tradeStats = {
      totalTrades: trades.length,
      winningTrades: trades.filter((t: any) => t.pnl_usd > 0).length,
      losingTrades: trades.filter((t: any) => t.pnl_usd < 0).length,
      winRate: trades.length > 0
        ? trades.filter((t: any) => t.pnl_usd > 0).length / trades.length
        : 0,
      avgPnL: trades.length > 0
        ? trades.reduce((sum: number, t: any) => sum + Number(t.pnl_usd), 0) / trades.length
        : 0,
      avgWinner: trades.filter((t: any) => t.pnl_usd > 0).length > 0
        ? trades.filter((t: any) => t.pnl_usd > 0).reduce((sum: number, t: any) => sum + Number(t.pnl_usd), 0) / trades.filter((t: any) => t.pnl_usd > 0).length
        : 0,
      avgLoser: trades.filter((t: any) => t.pnl_usd < 0).length > 0
        ? trades.filter((t: any) => t.pnl_usd < 0).reduce((sum: number, t: any) => sum + Number(t.pnl_usd), 0) / trades.filter((t: any) => t.pnl_usd < 0).length
        : 0,
      largestWin: trades.length > 0
        ? Math.max(...trades.map((t: any) => Number(t.pnl_usd)))
        : 0,
      largestLoss: trades.length > 0
        ? Math.min(...trades.map((t: any) => Number(t.pnl_usd)))
        : 0,
      avgHoldTimeHours: trades.length > 0
        ? trades.reduce((sum: number, t: any) => sum + Number(t.hold_time_hours), 0) / trades.length
        : 0,
      totalFees: trades.reduce((sum: number, t: any) => sum + Number(t.fees_paid), 0),
      totalSlippage: trades.reduce((sum: number, t: any) => sum + Number(t.slippage_cost), 0)
    };

    // Calculate profit factor
    const totalWins = trades
      .filter((t: any) => t.pnl_usd > 0)
      .reduce((sum: number, t: any) => sum + Number(t.pnl_usd), 0);
    const totalLosses = Math.abs(
      trades
        .filter((t: any) => t.pnl_usd < 0)
        .reduce((sum: number, t: any) => sum + Number(t.pnl_usd), 0)
    );
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

    // Performance summary
    const performance = {
      initialCapital: Number(backtestConfig.initial_capital),
      finalCapital: equityCurve.length > 0
        ? Number(equityCurve[equityCurve.length - 1].portfolio_value)
        : Number(backtestConfig.initial_capital),
      totalReturn: Number(backtestConfig.total_return_pct) || 0,
      totalReturnPct: Number(backtestConfig.total_return_pct) || 0,
      maxDrawdown: Number(backtestConfig.max_drawdown_pct) || 0,
      maxDrawdownPct: Number(backtestConfig.max_drawdown_pct) || 0,
      winRate: tradeStats.winRate,
      profitFactor: profitFactor,
      sharpeRatio: Number(backtestConfig.sharpe_ratio) || null,
      sortinoRatio: Number(backtestConfig.sortino_ratio) || null,
      calmarRatio: Number(backtestConfig.calmar_ratio) || null
    };

    // Advanced metrics (from stored backtest config)
    const advancedMetrics = {
      // Risk-adjusted returns
      sharpeRatio: Number(backtestConfig.sharpe_ratio) || null,
      sortinoRatio: Number(backtestConfig.sortino_ratio) || null,
      calmarRatio: Number(backtestConfig.calmar_ratio) || null,
      marRatio: Number(backtestConfig.calmar_ratio) || null, // Same as Calmar

      // Win/Loss analysis
      expectancy: Number(backtestConfig.expectancy) || 0,
      kellyCriterion: Number(backtestConfig.kelly_criterion) || 0,
      payoffRatio: Number(backtestConfig.payoff_ratio) || 0,

      // Drawdown metrics
      maxDrawdownPct: Number(backtestConfig.max_drawdown_pct) || 0,
      avgDrawdownPct: Number(backtestConfig.avg_drawdown_pct) || 0,
      maxDrawdownDuration: Number(backtestConfig.max_drawdown_duration) || 0,

      // Trade quality
      profitFactor: profitFactor,
      recoveryFactor: Number(backtestConfig.recovery_factor) || 0,
      ulcerIndex: Number(backtestConfig.ulcer_index) || null,

      // Consistency
      consecutiveWins: Number(backtestConfig.consecutive_wins) || 0,
      consecutiveLosses: Number(backtestConfig.consecutive_losses) || 0,
      winStreakAvg: Number(backtestConfig.win_streak_avg) || 0,
      loseStreakAvg: Number(backtestConfig.lose_streak_avg) || 0
    };

    // Format equity curve for frontend
    const formattedEquityCurve = equityCurve.map((point: any) => ({
      timestamp: point.timestamp,
      value: Number(point.portfolio_value),
      drawdown: Number(point.drawdown_pct) * 100, // Convert to percentage
      positionsCount: Number(point.positions_count)
    }));

    // Return comprehensive results
    res.json({
      success: true,
      data: {
        // Configuration
        config: {
          id: backtestConfig.id,
          name: backtestConfig.name,
          description: backtestConfig.description,
          strategyId: backtestConfig.strategy_id,
          strategyName: backtestConfig.strategy_name,
          strategyArchetype: backtestConfig.strategy_archetype,
          startDate: backtestConfig.start_date,
          endDate: backtestConfig.end_date,
          timeframe: backtestConfig.timeframe,
          initialCapital: Number(backtestConfig.initial_capital),
          positionSizePct: Number(backtestConfig.position_size_pct),
          maxPortfolioHeat: Number(backtestConfig.max_portfolio_heat),
          makerFee: Number(backtestConfig.maker_fee),
          takerFee: Number(backtestConfig.taker_fee),
          slippagePct: Number(backtestConfig.slippage_pct),
          status: backtestConfig.status,
          createdAt: backtestConfig.created_at
        },

        // Performance summary
        performance,

        // Advanced metrics
        metrics: advancedMetrics,

        // Trade statistics
        trades: {
          ...tradeStats,
          profitFactor,
          list: trades.map((t: any) => ({
            id: t.id,
            symbol: t.symbol,
            entryTime: t.entry_time,
            exitTime: t.exit_time,
            entryPrice: Number(t.entry_price),
            exitPrice: Number(t.exit_price),
            positionSize: Number(t.position_size),
            pnlUsd: Number(t.pnl_usd),
            pnlPct: Number(t.pnl_pct),
            feesPaid: Number(t.fees_paid),
            slippageCost: Number(t.slippage_cost),
            holdTimeHours: Number(t.hold_time_hours),
            entryReason: t.entry_reason,
            exitReason: t.exit_reason
          }))
        },

        // Equity curve
        equity: formattedEquityCurve
      }
    });

  } catch (error: any) {
    logger.error('Failed to get backtest results', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backtest results',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// TRADING STRATEGIES ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/backtesting/strategies
 * List all available trading strategies
 */
router.get('/strategies', async (req, res) => {
  try {
    const { status = 'selected', min_score = '70' } = req.query;

    const strategies = await prisma.$queryRaw<Array<any>>`
      SELECT *
      FROM trading_strategies
      WHERE status = ${status}
        AND total_score >= ${Number(min_score)}
      ORDER BY total_score DESC, priority ASC
    `;

    res.json({
      success: true,
      data: strategies
    });

  } catch (error: any) {
    logger.error('Failed to list strategies', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/backtesting/strategies/:id
 * Get detailed strategy information
 */
router.get('/strategies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const strategy = await prisma.$queryRaw<Array<any>>`
      SELECT *
      FROM trading_strategies
      WHERE id = ${id}
    `;

    if (!strategy || strategy.length === 0) {
      return res.status(404).json({ success: false, error: 'Strategy not found' });
    }

    // Get backtest history for this strategy
    const backtests = await prisma.$queryRaw<Array<any>>`
      SELECT id, name, status, total_return_pct, sharpe_ratio, max_drawdown_pct, created_at
      FROM backtest_configs
      WHERE strategy_id = ${id}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    res.json({
      success: true,
      data: {
        strategy: strategy[0],
        backtestHistory: backtests
      }
    });

  } catch (error: any) {
    logger.error('Failed to get strategy', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// DASHBOARD SUMMARY ENDPOINT
// ============================================================================

/**
 * GET /api/v1/backtesting/dashboard
 * Get complete dashboard overview
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get strategy count
    const strategyCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM trading_strategies
      WHERE total_score >= 70
    `;

    // Get backtest summary
    const backtestSummary = await prisma.$queryRaw<Array<any>>`
      SELECT
        status,
        COUNT(*) as count,
        AVG(total_return_pct) as avg_return,
        AVG(sharpe_ratio) as avg_sharpe
      FROM backtest_configs
      GROUP BY status
    `;

    // Get data coverage
    const dataCoverage = await prisma.$queryRaw<Array<any>>`
      SELECT
        COUNT(DISTINCT symbol) as symbols_count,
        COUNT(DISTINCT timeframe) as timeframes_count,
        COUNT(*) as total_records,
        MIN(timestamp) as earliest_data,
        MAX(timestamp) as latest_data
      FROM market_data_ohlcv
    `;

    // Get recent backtests
    const recentBacktests = await prisma.$queryRaw<Array<any>>`
      SELECT
        bc.id,
        bc.name,
        bc.status,
        bc.total_return_pct,
        bc.sharpe_ratio,
        bc.win_rate,
        bc.created_at,
        ts.name as strategy_name
      FROM backtest_configs bc
      LEFT JOIN trading_strategies ts ON bc.strategy_id = ts.id
      ORDER BY bc.created_at DESC
      LIMIT 5
    `;

    // Get top performing strategies with tested symbols
    const topStrategies = await prisma.$queryRaw<Array<any>>`
      SELECT
        ts.id,
        ts.name,
        ts.total_score,
        ts.archetype,
        COUNT(DISTINCT bc.id) as backtest_count,
        AVG(bc.sharpe_ratio) as avg_sharpe,
        AVG(bc.total_return_pct) as avg_return,
        ARRAY_AGG(DISTINCT bt.symbol) FILTER (WHERE bt.symbol IS NOT NULL) as tested_symbols
      FROM trading_strategies ts
      LEFT JOIN backtest_configs bc ON ts.id = bc.strategy_id AND bc.status = 'completed'
      LEFT JOIN backtest_trades bt ON bc.id = bt.backtest_id
      WHERE ts.total_score >= 70
      GROUP BY ts.id, ts.name, ts.total_score, ts.archetype
      ORDER BY ts.total_score DESC
      LIMIT 5
    `;

    // Convert BigInt values to numbers for JSON serialization
    const formattedBacktestSummary = backtestSummary.map(item => ({
      ...item,
      count: Number(item.count)
    }));

    const formattedDataCoverage = dataCoverage[0] ? {
      symbols_count: Number(dataCoverage[0].symbols_count || 0),
      timeframes_count: Number(dataCoverage[0].timeframes_count || 0),
      total_records: Number(dataCoverage[0].total_records || 0),
      earliest_data: dataCoverage[0].earliest_data,
      latest_data: dataCoverage[0].latest_data
    } : {
      symbols_count: 0,
      timeframes_count: 0,
      total_records: 0,
      earliest_data: null,
      latest_data: null
    };

    const formattedTopStrategies = topStrategies.map(item => ({
      ...item,
      backtest_count: Number(item.backtest_count || 0)
    }));

    res.json({
      success: true,
      data: {
        summary: {
          strategiesCount: Number(strategyCount[0]?.count || 0),
          backtestsByStatus: formattedBacktestSummary,
          dataCoverage: formattedDataCoverage
        },
        recentBacktests,
        topStrategies: formattedTopStrategies
      }
    });

  } catch (error: any) {
    logger.error('Failed to get dashboard data', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// RUN BACKTEST ENDPOINT
// ============================================================================

/**
 * POST /api/v1/backtesting/run
 * Execute a backtest with given configuration
 */
const runBacktestSchema = z.object({
  strategyId: z.string().uuid(),
  symbols: z.array(z.string()).min(1),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  timeframe: z.enum(['15m', '1h', '4h', '1d', '1w']),
  initialCapital: z.number().default(10000),
  positionSizePct: z.number().default(0.05),
  maxPortfolioHeat: z.number().default(0.25),
  maxDrawdownLimit: z.number().default(0.20),
  makerFee: z.number().default(0.001),
  takerFee: z.number().default(0.001),
  slippagePct: z.number().default(0.005),
  latencyMs: z.number().default(100)
});

router.post('/run', async (req, res) => {
  try {
    const config = runBacktestSchema.parse(req.body);

    logger.info('Starting backtest execution via API', {
      strategyId: config.strategyId,
      symbols: config.symbols,
      timeframe: config.timeframe
    });

    // Import BacktestEngine dynamically
    const { BacktestEngine } = await import('../services/backtestEngine.js');

    // Get strategy details
    const strategy = await prisma.$queryRaw<Array<any>>`
      SELECT id, name, archetype
      FROM trading_strategies
      WHERE id = ${config.strategyId}::text
    `;

    if (!strategy || strategy.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Initialize backtest engine with configuration
    const engine = new BacktestEngine({
      strategyId: config.strategyId,
      strategyName: strategy[0].name,
      symbols: config.symbols,
      startDate: config.startDate,
      endDate: config.endDate,
      timeframe: config.timeframe,
      initialCapital: config.initialCapital,
      positionSizePct: config.positionSizePct,
      maxPortfolioHeat: config.maxPortfolioHeat,
      makerFee: config.makerFee,
      takerFee: config.takerFee,
      slippagePct: config.slippagePct
    });

    // Run backtest and save results to database
    const { result, backtestId } = await engine.runAndSave();

    logger.info('Backtest completed successfully', {
      backtestId: backtestId,
      totalTrades: result.trades.totalTrades,
      totalReturn: result.performance.totalReturnPct
    });

    res.json({
      success: true,
      data: {
        backtestId: backtestId,
        performance: result.performance,
        trades: {
          totalTrades: result.trades.totalTrades,
          winRate: result.trades.winRate,
          profitFactor: result.trades.profitFactor
        }
      }
    });

  } catch (error: any) {
    logger.error('Backtest execution failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to run backtest',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
