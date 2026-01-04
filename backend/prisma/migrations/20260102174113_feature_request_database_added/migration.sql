-- CreateTable
CREATE TABLE "featureRequest" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "underReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "featureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filesFeatureRequest" (
    "id" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "filesFeatureRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "featureRequest" ADD CONSTRAINT "featureRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filesFeatureRequest" ADD CONSTRAINT "filesFeatureRequest_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "featureRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
