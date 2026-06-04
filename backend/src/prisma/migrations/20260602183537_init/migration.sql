-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Board" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "custom" TEXT
);
INSERT INTO "new_Board" ("custom", "id", "title") SELECT "custom", "id", "title" FROM "Board";
DROP TABLE "Board";
ALTER TABLE "new_Board" RENAME TO "Board";
CREATE TABLE "new_Card" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT,
    "position" INTEGER,
    "listId" INTEGER NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "custom" TEXT,
    CONSTRAINT "Card_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Card" ("color", "custom", "description", "id", "listId", "position", "title") SELECT "color", "custom", "description", "id", "listId", "position", "title" FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
CREATE TABLE "new_List" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "position" INTEGER,
    "custom" TEXT,
    "boardId" INTEGER NOT NULL,
    CONSTRAINT "List_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_List" ("boardId", "custom", "id", "position", "title") SELECT "boardId", "custom", "id", "position", "title" FROM "List";
DROP TABLE "List";
ALTER TABLE "new_List" RENAME TO "List";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
