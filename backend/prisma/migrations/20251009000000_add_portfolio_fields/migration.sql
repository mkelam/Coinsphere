-- AlterTable Portfolio add icon, currency, isActive
ALTER TABLE "portfolios" ADD COLUMN "icon" TEXT NOT NULL DEFAULT '💼';
ALTER TABLE "portfolios" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "portfolios" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex for finding active portfolio
CREATE INDEX "portfolios_user_id_is_active_idx" ON "portfolios"("user_id", "is_active");
