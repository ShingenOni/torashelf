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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameRevision_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GameRevision" ("createdAt", "dataSource", "gameId", "id", "languageLockedToRegion", "languages", "notes", "regionFree", "regionOfCart", "sourceCitation", "updatedAt") SELECT "createdAt", "dataSource", "gameId", "id", "languageLockedToRegion", "languages", "notes", "regionFree", "regionOfCart", "sourceCitation", "updatedAt" FROM "GameRevision";
DROP TABLE "GameRevision";
ALTER TABLE "new_GameRevision" RENAME TO "GameRevision";
CREATE INDEX "GameRevision_gameId_idx" ON "GameRevision"("gameId");
CREATE INDEX "GameRevision_regionOfCart_idx" ON "GameRevision"("regionOfCart");
CREATE INDEX "GameRevision_regionFree_idx" ON "GameRevision"("regionFree");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "name" TEXT,
    "image" TEXT,
    "homeRegion" TEXT NOT NULL DEFAULT 'US',
    "preferredLanguages" TEXT NOT NULL DEFAULT '["EN"]',
    "isEarlyAdopter" BOOLEAN NOT NULL DEFAULT false,
    "signupNumber" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "homeRegion", "id", "image", "name", "preferredLanguages") SELECT "createdAt", "email", "emailVerified", "homeRegion", "id", "image", "name", "preferredLanguages" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
