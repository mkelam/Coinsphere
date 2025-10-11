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
CREATE INDEX "defi_positions_status_idx" ON "defi_positions"("status");

-- CreateIndex
CREATE INDEX "defi_positions_last_sync_at_idx" ON "defi_positions"("last_sync_at");

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

-- AddForeignKey
ALTER TABLE "defi_positions" ADD CONSTRAINT "defi_positions_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "defi_protocols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "nft_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
