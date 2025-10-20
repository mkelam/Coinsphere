-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "first_name" TEXT,
    "last_name" TEXT,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "subscription_tier" TEXT NOT NULL DEFAULT 'free',
    "subscription_status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coingecko_id" TEXT,
    "blockchain" TEXT NOT NULL,
    "contract_address" TEXT,
    "decimals" INTEGER,
    "logo_url" TEXT,
    "current_price" DECIMAL(18,8),
    "market_cap" DECIMAL(24,2),
    "volume_24h" DECIMAL(24,2),
    "price_change_24h" DECIMAL(10,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Main Portfolio',
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT '💼',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "amount" DECIMAL(24,8) NOT NULL,
    "average_buy_price" DECIMAL(18,8),
    "source" TEXT,
    "source_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(24,8) NOT NULL,
    "price" DECIMAL(18,8) NOT NULL,
    "fee" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "fee_token" TEXT,
    "notes" TEXT,
    "tx_hash" TEXT,
    "exchange" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "predicted_price" DECIMAL(18,8) NOT NULL,
    "price_at_prediction" DECIMAL(18,8) NOT NULL,
    "target_price_range" JSONB NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "confidence_score" DECIMAL(5,4) NOT NULL,
    "model_version" TEXT NOT NULL,
    "model_type" TEXT,
    "ensemble_method" TEXT,
    "features" JSONB,
    "actual_price" DECIMAL(18,8),
    "outcome_calculated_at" TIMESTAMP(3),
    "was_correct" BOOLEAN,
    "accuracy_score" DECIMAL(5,4),
    "price_error" DECIMAL(10,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "target_date" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_scores" (
    "id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "liquidity_score" INTEGER,
    "volatility_score" INTEGER,
    "contract_score" INTEGER,
    "holder_score" INTEGER,
    "analysis" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DECIMAL(18,8) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered" TIMESTAMP(3),
    "trigger_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "scopes" TEXT[] DEFAULT ARRAY['read:portfolio']::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_data" (
    "time" TIMESTAMP(3) NOT NULL,
    "token_id" TEXT NOT NULL,
    "open" DECIMAL(18,8) NOT NULL,
    "high" DECIMAL(18,8) NOT NULL,
    "low" DECIMAL(18,8) NOT NULL,
    "close" DECIMAL(18,8) NOT NULL,
    "volume" DECIMAL(24,8) NOT NULL,

    CONSTRAINT "price_data_pkey" PRIMARY KEY ("time","token_id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "status" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "method" TEXT,
    "path" TEXT,
    "metadata" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "label" TEXT,
    "api_key_encrypted" TEXT NOT NULL,
    "api_secret_encrypted" TEXT NOT NULL,
    "passphrase_encrypted" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_sync_at" TIMESTAMP(3),
    "last_error" TEXT,
    "auto_sync" BOOLEAN NOT NULL DEFAULT true,
    "sync_interval" INTEGER NOT NULL DEFAULT 300,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "blockchain" TEXT NOT NULL,
    "wallet_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_sync_at" TIMESTAMP(3),
    "last_error" TEXT,
    "auto_sync" BOOLEAN NOT NULL DEFAULT true,
    "sync_interval" INTEGER NOT NULL DEFAULT 600,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defi_protocols" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "blockchain" TEXT NOT NULL,
    "logo_url" TEXT,
    "website" TEXT,
    "tvl" DECIMAL(24,2),
    "subgraph_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defi_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defi_positions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "protocol_id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "blockchain" TEXT NOT NULL DEFAULT 'ethereum',
    "position_type" TEXT NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "amount" DECIMAL(24,8) NOT NULL,
    "value_usd" DECIMAL(18,2) NOT NULL,
    "apy" DECIMAL(8,4),
    "rewards_earned" DECIMAL(24,8),
    "rewards_token" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defi_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nft_collections" (
    "id" TEXT NOT NULL,
    "contract_address" TEXT NOT NULL,
    "blockchain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "symbol" TEXT,
    "image_url" TEXT,
    "description" TEXT,
    "external_url" TEXT,
    "floor_price" DECIMAL(18,8),
    "total_supply" INTEGER,
    "num_owners" INTEGER,
    "volume_total" DECIMAL(24,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nft_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfts" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "wallet_address" TEXT NOT NULL,
    "purchase_price" DECIMAL(18,8),
    "purchase_date" TIMESTAMP(3),
    "last_valuation" DECIMAL(18,8),
    "valuation_date" TIMESTAMP(3),
    "attributes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_symbol_key" ON "tokens"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_coingecko_id_key" ON "tokens"("coingecko_id");

-- CreateIndex
CREATE INDEX "portfolios_user_id_idx" ON "portfolios"("user_id");

-- CreateIndex
CREATE INDEX "portfolios_user_id_is_active_idx" ON "portfolios"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "holdings_portfolio_id_idx" ON "holdings"("portfolio_id");

-- CreateIndex
CREATE INDEX "holdings_token_id_idx" ON "holdings"("token_id");

-- CreateIndex
CREATE UNIQUE INDEX "holdings_portfolio_id_token_id_key" ON "holdings"("portfolio_id", "token_id");

-- CreateIndex
CREATE INDEX "transactions_portfolio_id_idx" ON "transactions"("portfolio_id");

-- CreateIndex
CREATE INDEX "transactions_token_id_idx" ON "transactions"("token_id");

-- CreateIndex
CREATE INDEX "transactions_timestamp_idx" ON "transactions"("timestamp");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "predictions_token_id_idx" ON "predictions"("token_id");

-- CreateIndex
CREATE INDEX "predictions_created_at_idx" ON "predictions"("created_at");

-- CreateIndex
CREATE INDEX "predictions_target_date_idx" ON "predictions"("target_date");

-- CreateIndex
CREATE INDEX "predictions_timeframe_idx" ON "predictions"("timeframe");

-- CreateIndex
CREATE INDEX "predictions_model_version_idx" ON "predictions"("model_version");

-- CreateIndex
CREATE INDEX "predictions_was_correct_idx" ON "predictions"("was_correct");

-- CreateIndex
CREATE INDEX "risk_scores_token_id_idx" ON "risk_scores"("token_id");

-- CreateIndex
CREATE INDEX "risk_scores_created_at_idx" ON "risk_scores"("created_at");

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "alerts"("user_id");

-- CreateIndex
CREATE INDEX "alerts_is_active_idx" ON "alerts"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "price_data_token_id_idx" ON "price_data"("token_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_key" ON "email_verifications"("token");

-- CreateIndex
CREATE INDEX "email_verifications_user_id_idx" ON "email_verifications"("user_id");

-- CreateIndex
CREATE INDEX "email_verifications_token_idx" ON "email_verifications"("token");

-- CreateIndex
CREATE INDEX "email_verifications_expires_at_idx" ON "email_verifications"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_status_idx" ON "audit_logs"("status");

-- CreateIndex
CREATE INDEX "audit_logs_ip_address_idx" ON "audit_logs"("ip_address");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_reference_id_key" ON "payment_intents"("reference_id");

-- CreateIndex
CREATE INDEX "payment_intents_user_id_idx" ON "payment_intents"("user_id");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "payment_intents"("status");

-- CreateIndex
CREATE INDEX "payment_intents_reference_id_idx" ON "payment_intents"("reference_id");

-- CreateIndex
CREATE INDEX "exchange_connections_user_id_idx" ON "exchange_connections"("user_id");

-- CreateIndex
CREATE INDEX "exchange_connections_status_idx" ON "exchange_connections"("status");

-- CreateIndex
CREATE INDEX "exchange_connections_last_sync_at_idx" ON "exchange_connections"("last_sync_at");

-- CreateIndex
CREATE INDEX "wallet_connections_user_id_idx" ON "wallet_connections"("user_id");

-- CreateIndex
CREATE INDEX "wallet_connections_address_idx" ON "wallet_connections"("address");

-- CreateIndex
CREATE INDEX "wallet_connections_blockchain_idx" ON "wallet_connections"("blockchain");

-- CreateIndex
CREATE INDEX "wallet_connections_last_sync_at_idx" ON "wallet_connections"("last_sync_at");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_connections_user_id_address_blockchain_key" ON "wallet_connections"("user_id", "address", "blockchain");

-- CreateIndex
CREATE UNIQUE INDEX "defi_protocols_slug_key" ON "defi_protocols"("slug");

-- CreateIndex
CREATE INDEX "defi_protocols_blockchain_idx" ON "defi_protocols"("blockchain");

-- CreateIndex
CREATE INDEX "defi_protocols_category_idx" ON "defi_protocols"("category");

-- CreateIndex
CREATE INDEX "defi_protocols_is_active_idx" ON "defi_protocols"("is_active");

-- CreateIndex
CREATE INDEX "defi_positions_user_id_idx" ON "defi_positions"("user_id");

-- CreateIndex
CREATE INDEX "defi_positions_protocol_id_idx" ON "defi_positions"("protocol_id");

-- CreateIndex
CREATE INDEX "defi_positions_wallet_address_idx" ON "defi_positions"("wallet_address");

-- CreateIndex
CREATE INDEX "defi_positions_blockchain_idx" ON "defi_positions"("blockchain");

-- CreateIndex
CREATE INDEX "defi_positions_status_idx" ON "defi_positions"("status");

-- CreateIndex
CREATE INDEX "defi_positions_last_sync_at_idx" ON "defi_positions"("last_sync_at");

-- CreateIndex
CREATE UNIQUE INDEX "defi_positions_user_id_protocol_id_wallet_address_blockchai_key" ON "defi_positions"("user_id", "protocol_id", "wallet_address", "blockchain", "token_symbol");

-- CreateIndex
CREATE UNIQUE INDEX "nft_collections_contract_address_key" ON "nft_collections"("contract_address");

-- CreateIndex
CREATE UNIQUE INDEX "nft_collections_slug_key" ON "nft_collections"("slug");

-- CreateIndex
CREATE INDEX "nft_collections_blockchain_idx" ON "nft_collections"("blockchain");

-- CreateIndex
CREATE INDEX "nft_collections_slug_idx" ON "nft_collections"("slug");

-- CreateIndex
CREATE INDEX "nfts_user_id_idx" ON "nfts"("user_id");

-- CreateIndex
CREATE INDEX "nfts_collection_id_idx" ON "nfts"("collection_id");

-- CreateIndex
CREATE INDEX "nfts_wallet_address_idx" ON "nfts"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "nfts_collection_id_token_id_wallet_address_key" ON "nfts"("collection_id", "token_id", "wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "verified_wallets_address_key" ON "verified_wallets"("address");

-- CreateIndex
CREATE INDEX "verified_wallets_blockchain_idx" ON "verified_wallets"("blockchain");

-- CreateIndex
CREATE INDEX "verified_wallets_verification_status_idx" ON "verified_wallets"("verification_status");

-- CreateIndex
CREATE INDEX "verified_wallets_research_phase_idx" ON "verified_wallets"("research_phase");

-- CreateIndex
CREATE INDEX "verified_wallets_strategy_archetype_idx" ON "verified_wallets"("strategy_archetype");

-- CreateIndex
CREATE INDEX "verified_wallets_social_leading_score_idx" ON "verified_wallets"("social_leading_score");

-- CreateIndex
CREATE INDEX "verified_wallets_win_rate_idx" ON "verified_wallets"("win_rate");

-- CreateIndex
CREATE INDEX "verified_wallets_monitor_active_idx" ON "verified_wallets"("monitor_active");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_trades_tx_hash_key" ON "wallet_trades"("tx_hash");

-- CreateIndex
CREATE INDEX "wallet_trades_wallet_id_idx" ON "wallet_trades"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_trades_timestamp_idx" ON "wallet_trades"("timestamp");

-- CreateIndex
CREATE INDEX "wallet_trades_token_symbol_idx" ON "wallet_trades"("token_symbol");

-- CreateIndex
CREATE INDEX "wallet_trades_action_idx" ON "wallet_trades"("action");

-- CreateIndex
CREATE INDEX "wallet_trades_was_winner_idx" ON "wallet_trades"("was_winner");

-- CreateIndex
CREATE INDEX "wallet_social_signals_wallet_id_idx" ON "wallet_social_signals"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_social_signals_token_symbol_idx" ON "wallet_social_signals"("token_symbol");

-- CreateIndex
CREATE INDEX "wallet_social_signals_timestamp_idx" ON "wallet_social_signals"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_social_signals_wallet_id_timestamp_token_symbol_key" ON "wallet_social_signals"("wallet_id", "timestamp", "token_symbol");

-- CreateIndex
CREATE UNIQUE INDEX "public_traders_profile_url_key" ON "public_traders"("profile_url");

-- CreateIndex
CREATE INDEX "public_traders_platform_idx" ON "public_traders"("platform");

-- CreateIndex
CREATE INDEX "public_traders_verification_status_idx" ON "public_traders"("verification_status");

-- CreateIndex
CREATE INDEX "public_traders_research_phase_idx" ON "public_traders"("research_phase");

-- CreateIndex
CREATE INDEX "public_traders_has_proof_of_trades_idx" ON "public_traders"("has_proof_of_trades");

-- CreateIndex
CREATE UNIQUE INDEX "research_sources_url_key" ON "research_sources"("url");

-- CreateIndex
CREATE INDEX "research_sources_source_type_idx" ON "research_sources"("source_type");

-- CreateIndex
CREATE INDEX "research_sources_research_phase_idx" ON "research_sources"("research_phase");

-- CreateIndex
CREATE INDEX "research_sources_relevance_score_idx" ON "research_sources"("relevance_score");

-- CreateIndex
CREATE INDEX "research_sources_published_date_idx" ON "research_sources"("published_date");

-- CreateIndex
CREATE UNIQUE INDEX "trading_strategies_name_key" ON "trading_strategies"("name");

-- CreateIndex
CREATE INDEX "trading_strategies_archetype_idx" ON "trading_strategies"("archetype");

-- CreateIndex
CREATE INDEX "trading_strategies_status_idx" ON "trading_strategies"("status");

-- CreateIndex
CREATE INDEX "trading_strategies_total_score_idx" ON "trading_strategies"("total_score");

-- CreateIndex
CREATE INDEX "trading_strategies_priority_idx" ON "trading_strategies"("priority");

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_connections" ADD CONSTRAINT "exchange_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_connections" ADD CONSTRAINT "wallet_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defi_positions" ADD CONSTRAINT "defi_positions_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "defi_protocols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "nft_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_trades" ADD CONSTRAINT "wallet_trades_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "verified_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_social_signals" ADD CONSTRAINT "wallet_social_signals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "verified_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

