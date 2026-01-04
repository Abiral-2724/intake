/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "gender" "Gender",
    "profile" TEXT NOT NULL DEFAULT 'https://plus.unsplash.com/premium_vector-1682269287900-d96e9a6c188b?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    "role" "Role" NOT NULL DEFAULT 'user',
    "subscriptionPlan" "Plan" NOT NULL DEFAULT 'Free',
    "typeOfWorkYouDo" "typeWork" NOT NULL DEFAULT 'Other',
    "yourRole" TEXT,
    "whereYouDiscoverIntake" "whereDiscover" NOT NULL DEFAULT 'Other',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
