-- CreateTable: verified_wallets
CREATE TABLE "verified_wallets" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "nansen_label" TEXT,
    "blockchain" TEXT NOT NULL DEFAULT 'ethereum',
    "discovery_source" TEXT NOT NULL,
    "verification_date" TIMESTAMP(3) NOT NULL,
    "research_phase" TEXT NOT NULL DEFAULT 'week_1',
    "total_trades_analyzed" INTEGER,
    "win_rate" DECIMAL(5,4),
    "avg_hold_time_days" DECIMAL(8,2),
    "avg_position_size_usd" DECIMAL(18,2),
    "total_profit_usd" DECIMAL(18,2),
    "max_drawdown_pct" DECIMAL(5,4),
    "sharpe_ratio" DECIMAL(8,4),
    "primary_tokens" TEXT[],
    "trading_frequency" TEXT,
    "strategy_type" TEXT,
    "social_leading_score" DECIMAL(5,4),
    "behavior_type" TEXT,
    "avg_social_volume_at_entry" DECIMAL(18,2),
    "avg_social_volume_at_peak" DECIMAL(18,2),
    "sentiment_correlation" DECIMAL(5,4),
    "strategy_archetype" TEXT,
    "pattern_notes" TEXT,
    "authenticity_score" INTEGER,
    "transparency_score" INTEGER,
    "skin_in_game_score" INTEGER,
    "total_verification_score" INTEGER,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "monitor_active" BOOLEAN NOT NULL DEFAULT true,
    "last_checked" TIMESTAMP(3),
    "check_frequency" INTEGER DEFAULT 86400,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verified_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: wallet_trades
CREATE TABLE "wallet_trades" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "blockchain" TEXT NOT NULL DEFAULT 'ethereum',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "action" TEXT NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "token_address" TEXT,
    "amount" DECIMAL(24,8) NOT NULL,
    "price_usd" DECIMAL(18,8) NOT NULL,
    "value_usd" DECIMAL(18,2) NOT NULL,
    "gas_fees_usd" DECIMAL(18,2),
    "hold_time_days" DECIMAL(8,2),
    "profit_loss_usd" DECIMAL(18,2),
    "profit_loss_pct" DECIMAL(10,4),
    "was_winner" BOOLEAN,
    "social_volume" DECIMAL(18,2),
    "social_sentiment" DECIMAL(5,4),
    "days_before_social_peak" INTEGER,
    "social_timing" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable: wallet_social_signals
CREATE TABLE "wallet_social_signals" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "social_volume" DECIMAL(18,2) NOT NULL,
    "social_score" DECIMAL(8,4),
    "sentiment" DECIMAL(5,4) NOT NULL,
    "influencer_activity" INTEGER,
    "price_usd" DECIMAL(18,8) NOT NULL,
    "price_change_pct" DECIMAL(10,4),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_social_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable: public_traders
CREATE TABLE "public_traders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "profile_url" TEXT NOT NULL,
    "handle" TEXT,
    "discovery_source" TEXT NOT NULL,
    "verification_date" TIMESTAMP(3) NOT NULL,
    "research_phase" TEXT NOT NULL DEFAULT 'week_1',
    "claimed_win_rate" DECIMAL(5,4),
    "claimed_returns" DECIMAL(10,4),
    "trading_experience" INTEGER,
    "followers_count" INTEGER,
    "has_proof_of_trades" BOOLEAN NOT NULL DEFAULT false,
    "has_public_portfolio" BOOLEAN NOT NULL DEFAULT false,
    "has_wallet_address" BOOLEAN NOT NULL DEFAULT false,
    "wallet_address" TEXT,
    "creator_score" DECIMAL(8,4),
    "social_influence" DECIMAL(18,2),
    "avg_engagement_rate" DECIMAL(5,4),
    "primary_strategy" TEXT,
    "asset_focus" TEXT[],
    "timeframe" TEXT,
    "authenticity_score" INTEGER,
    "transparency_score" INTEGER,
    "skin_in_game_score" INTEGER,
    "total_verification_score" INTEGER,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "monitor_active" BOOLEAN NOT NULL DEFAULT true,
    "last_checked" TIMESTAMP(3),
    "research_notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_traders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: research_sources
CREATE TABLE "research_sources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "authors" TEXT[],
    "published_date" TIMESTAMP(3),
    "venue" TEXT,
    "citations" INTEGER,
    "abstract" TEXT,
    "key_findings" TEXT,
    "strategy_type" TEXT,
    "asset_class" TEXT[],
    "reported_sharpe" DECIMAL(8,4),
    "reported_returns" DECIMAL(10,4),
    "backtest_period" TEXT,
    "discovery_date" TIMESTAMP(3) NOT NULL,
    "research_phase" TEXT NOT NULL DEFAULT 'week_1',
    "relevance_score" INTEGER,
    "extracted_patterns" TEXT,
    "implementation_notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable: trading_strategies
CREATE TABLE "trading_strategies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "avg_hold_time" TEXT NOT NULL,
    "win_rate" DECIMAL(5,4),
    "risk_reward_ratio" DECIMAL(5,2),
    "entry_conditions" TEXT[],
    "exit_conditions" TEXT[],
    "technical_indicators" TEXT[],
    "on_chain_metrics" TEXT[],
    "social_signals" TEXT[],
    "source_wallet_ids" TEXT[],
    "source_trader_ids" TEXT[],
    "source_research_ids" TEXT[],
    "evidence_count" INTEGER NOT NULL,
    "performance_score" DECIMAL(5,2),
    "practicality_score" DECIMAL(5,2),
    "verifiability_score" DECIMAL(5,2),
    "total_score" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'identified',
    "priority" INTEGER,
    "research_notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verified_wallets_address_key" ON "verified_wallets"("address");
CREATE INDEX "verified_wallets_blockchain_idx" ON "verified_wallets"("blockchain");
CREATE INDEX "verified_wallets_verification_status_idx" ON "verified_wallets"("verification_status");
CREATE INDEX "verified_wallets_research_phase_idx" ON "verified_wallets"("research_phase");
CREATE INDEX "verified_wallets_strategy_archetype_idx" ON "verified_wallets"("strategy_archetype");
CREATE INDEX "verified_wallets_social_leading_score_idx" ON "verified_wallets"("social_leading_score");
CREATE INDEX "verified_wallets_win_rate_idx" ON "verified_wallets"("win_rate");
CREATE INDEX "verified_wallets_monitor_active_idx" ON "verified_wallets"("monitor_active");

CREATE UNIQUE INDEX "wallet_trades_tx_hash_key" ON "wallet_trades"("tx_hash");
CREATE INDEX "wallet_trades_wallet_id_idx" ON "wallet_trades"("wallet_id");
CREATE INDEX "wallet_trades_timestamp_idx" ON "wallet_trades"("timestamp");
CREATE INDEX "wallet_trades_token_symbol_idx" ON "wallet_trades"("token_symbol");
CREATE INDEX "wallet_trades_action_idx" ON "wallet_trades"("action");
CREATE INDEX "wallet_trades_was_winner_idx" ON "wallet_trades"("was_winner");

CREATE UNIQUE INDEX "wallet_social_signals_wallet_id_timestamp_token_symbol_key" ON "wallet_social_signals"("wallet_id", "timestamp", "token_symbol");
CREATE INDEX "wallet_social_signals_wallet_id_idx" ON "wallet_social_signals"("wallet_id");
CREATE INDEX "wallet_social_signals_token_symbol_idx" ON "wallet_social_signals"("token_symbol");
CREATE INDEX "wallet_social_signals_timestamp_idx" ON "wallet_social_signals"("timestamp");

CREATE UNIQUE INDEX "public_traders_profile_url_key" ON "public_traders"("profile_url");
CREATE INDEX "public_traders_platform_idx" ON "public_traders"("platform");
CREATE INDEX "public_traders_verification_status_idx" ON "public_traders"("verification_status");
CREATE INDEX "public_traders_research_phase_idx" ON "public_traders"("research_phase");
CREATE INDEX "public_traders_has_proof_of_trades_idx" ON "public_traders"("has_proof_of_trades");

CREATE UNIQUE INDEX "research_sources_url_key" ON "research_sources"("url");
CREATE INDEX "research_sources_source_type_idx" ON "research_sources"("source_type");
CREATE INDEX "research_sources_research_phase_idx" ON "research_sources"("research_phase");
CREATE INDEX "research_sources_relevance_score_idx" ON "research_sources"("relevance_score");
CREATE INDEX "research_sources_published_date_idx" ON "research_sources"("published_date");

CREATE UNIQUE INDEX "trading_strategies_name_key" ON "trading_strategies"("name");
CREATE INDEX "trading_strategies_archetype_idx" ON "trading_strategies"("archetype");
CREATE INDEX "trading_strategies_status_idx" ON "trading_strategies"("status");
CREATE INDEX "trading_strategies_total_score_idx" ON "trading_strategies"("total_score");
CREATE INDEX "trading_strategies_priority_idx" ON "trading_strategies"("priority");

-- AddForeignKey
ALTER TABLE "wallet_trades" ADD CONSTRAINT "wallet_trades_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "verified_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_social_signals" ADD CONSTRAINT "wallet_social_signals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "verified_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
