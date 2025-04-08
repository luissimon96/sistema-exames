-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "subscriptionCanceledAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "subscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN "subscriptionPeriodEnd" DATETIME;
ALTER TABLE "User" ADD COLUMN "subscriptionPeriodStart" DATETIME;
ALTER TABLE "User" ADD COLUMN "subscriptionPlan" TEXT DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'inactive';
