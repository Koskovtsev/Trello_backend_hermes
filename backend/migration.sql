-- CreateTable
CREATE TABLE "BoardUser" (
    "boardId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,

    PRIMARY KEY ("boardId", "userId"),
    CONSTRAINT "BoardUser_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoardUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CardUser" (
    "cardId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,

    PRIMARY KEY ("cardId", "userId"),
    CONSTRAINT "CardUser_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CardUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Board" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "custom" TEXT
);
INSERT INTO "new_Board" ("custom", "id", "title") SELECT "custom", "id", "title" FROM "Board";
DROP TABLE "Board";
ALTER TABLE "new_Board" RENAME TO "Board";
CREATE TABLE "new_Card" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "position" INTEGER,
    "listId" BIGINT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "custom" TEXT,
    "created_at" BIGINT,
    CONSTRAINT "Card_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Card" ("color", "custom", "description", "id", "listId", "position", "title") SELECT "color", "custom", "description", "id", "listId", "position", "title" FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
CREATE TABLE "new_List" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "position" INTEGER,
    "custom" TEXT,
    "boardId" BIGINT NOT NULL,
    CONSTRAINT "List_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_List" ("boardId", "custom", "id", "position", "title") SELECT "boardId", "custom", "id", "position", "title" FROM "List";
DROP TABLE "List";
ALTER TABLE "new_List" RENAME TO "List";
CREATE TABLE "new_User" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refreshToken" TEXT
);
INSERT INTO "new_User" ("email", "id", "username") SELECT "email", "id", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

