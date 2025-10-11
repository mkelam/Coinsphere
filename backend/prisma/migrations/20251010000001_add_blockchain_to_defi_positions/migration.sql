-- AlterTable: Add blockchain field to defi_positions
ALTER TABLE "defi_positions" ADD COLUMN "blockchain" TEXT NOT NULL DEFAULT 'ethereum';

-- DropIndex: Drop old unique constraint
DROP INDEX IF EXISTS "defi_positions_userId_protocolId_walletAddress_tokenSymbol_key";

-- CreateIndex: Add new unique constraint with blockchain
CREATE UNIQUE INDEX "defi_positions_userId_protocolId_walletAddress_blockchain_tokenSymbol_key" ON "defi_positions"("user_id", "protocol_id", "wallet_address", "blockchain", "token_symbol");

-- CreateIndex: Add index for blockchain
CREATE INDEX "defi_positions_blockchain_idx" ON "defi_positions"("blockchain");
