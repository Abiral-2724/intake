-- CreateTable
CREATE TABLE "FeatureUpvote" (
    "id" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureUpvote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeatureUpvote_featureId_userId_key" ON "FeatureUpvote"("featureId", "userId");

-- AddForeignKey
ALTER TABLE "FeatureUpvote" ADD CONSTRAINT "FeatureUpvote_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "featureRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureUpvote" ADD CONSTRAINT "FeatureUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
