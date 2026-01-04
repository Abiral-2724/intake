/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verificationCode` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "typeWork" AS ENUM ('Student', 'Educator', 'Product', 'Engineering', 'Design', 'Sales', 'Marketing', 'CustomerService', 'BusinessAdministration', 'Operations', 'HumanResources', 'IT', 'Finance', 'ArtsAndEntertainment', 'HealthAndMedicine', 'SocialImpact', 'LawAndPublicPolicy', 'Government', 'Other');

-- CreateEnum
CREATE TYPE "whereDiscover" AS ENUM ('RecommendationFromfriend', 'RecommendationFromCoWorker', 'RecommendationFromCommunity', 'XorTwitter', 'TikTok', 'Reddit', 'IndieHackers', 'LinkedIn', 'YouTube', 'Instagram', 'Onlinesearch', 'Newsletter', 'Facebook', 'ProductHunt', 'Blogpost', 'Podcast', 'AI', 'Other');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('Free', 'Pro', 'Business');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "profile" TEXT NOT NULL DEFAULT 'https://plus.unsplash.com/premium_vector-1682269287900-d96e9a6c188b?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'user',
ADD COLUMN     "subscriptionPlan" "Plan" NOT NULL DEFAULT 'Free',
ADD COLUMN     "typeOfWorkYouDo" "typeWork" NOT NULL DEFAULT 'Other',
ADD COLUMN     "verificationCode" INTEGER NOT NULL,
ADD COLUMN     "whereYouDiscoverIntake" "whereDiscover" NOT NULL DEFAULT 'Other',
ADD COLUMN     "yourRole" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
