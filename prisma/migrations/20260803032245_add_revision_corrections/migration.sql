-- AlterTable
ALTER TABLE "GameRevision" ADD COLUMN     "correctsRevisionId" TEXT;

-- CreateIndex
CREATE INDEX "GameRevision_correctsRevisionId_idx" ON "GameRevision"("correctsRevisionId");

-- AddForeignKey
ALTER TABLE "GameRevision" ADD CONSTRAINT "GameRevision_correctsRevisionId_fkey" FOREIGN KEY ("correctsRevisionId") REFERENCES "GameRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
