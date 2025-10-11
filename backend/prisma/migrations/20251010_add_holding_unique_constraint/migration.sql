-- AlterTable
-- Add unique constraint on portfolio_id and token_id
CREATE UNIQUE INDEX "holdings_portfolio_id_token_id_key" ON "holdings"("portfolio_id", "token_id");
