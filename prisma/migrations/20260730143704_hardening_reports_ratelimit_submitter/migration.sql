-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameRevisionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_gameRevisionId_fkey" FOREIGN KEY ("gameRevisionId") REFERENCES "GameRevision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateLimitEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RateLimitEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "regionOfCart" TEXT NOT NULL,
    "regionFree" TEXT NOT NULL,
    "languages" TEXT NOT NULL,
    "languageLockedToRegion" BOOLEAN NOT NULL,
    "cartridgeFormat" TEXT NOT NULL DEFAULT 'FULL_CARTRIDGE',
    "dataSource" TEXT NOT NULL,
    "sourceCitation" TEXT,
    "notes" TEXT,
    "submittedByUserId" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameRevision_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameRevision_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GameRevision" ("cartridgeFormat", "createdAt", "dataSource", "gameId", "id", "languageLockedToRegion", "languages", "notes", "regionFree", "regionOfCart", "sourceCitation", "updatedAt") SELECT "cartridgeFormat", "createdAt", "dataSource", "gameId", "id", "languageLockedToRegion", "languages", "notes", "regionFree", "regionOfCart", "sourceCitation", "updatedAt" FROM "GameRevision";
DROP TABLE "GameRevision";
ALTER TABLE "new_GameRevision" RENAME TO "GameRevision";
CREATE INDEX "GameRevision_gameId_idx" ON "GameRevision"("gameId");
CREATE INDEX "GameRevision_regionOfCart_idx" ON "GameRevision"("regionOfCart");
CREATE INDEX "GameRevision_regionFree_idx" ON "GameRevision"("regionFree");
CREATE INDEX "GameRevision_submittedByUserId_idx" ON "GameRevision"("submittedByUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Report_gameRevisionId_idx" ON "Report"("gameRevisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_gameRevisionId_userId_key" ON "Report"("gameRevisionId", "userId");

-- CreateIndex
CREATE INDEX "RateLimitEvent_action_userId_createdAt_idx" ON "RateLimitEvent"("action", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitEvent_action_ipAddress_createdAt_idx" ON "RateLimitEvent"("action", "ipAddress", "createdAt");
