-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "password" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,
    "phoneNumber" TEXT,
    "jobTitle" TEXT,
    "company" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "linkedinUrl" TEXT,
    "instagramUrl" TEXT,
    "githubUrl" TEXT,
    "theme" TEXT DEFAULT 'light',
    "accentColor" TEXT DEFAULT '#3b82f6',
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" DATETIME,
    "totalUploads" INTEGER NOT NULL DEFAULT 0,
    "totalExams" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("bio", "company", "createdAt", "email", "emailVerified", "id", "image", "isActive", "jobTitle", "lastLogin", "location", "name", "password", "phoneNumber", "resetToken", "resetTokenExpiry", "role", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "website") SELECT "bio", "company", "createdAt", "email", "emailVerified", "id", "image", "isActive", "jobTitle", "lastLogin", "location", "name", "password", "phoneNumber", "resetToken", "resetTokenExpiry", "role", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "website" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
