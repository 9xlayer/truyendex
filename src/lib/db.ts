import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "truyendex.db");

declare global {
  // eslint-disable-next-line no-var
  var __truyendex_db: Database.Database | undefined;
}

function getDatabase(): Database.Database {
  if (global.__truyendex_db) {
    return global.__truyendex_db;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_history (
      user_id INTEGER NOT NULL,
      manga_id TEXT NOT NULL,
      manga_title TEXT NOT NULL,
      cover TEXT,
      chapter_id TEXT NOT NULL,
      chapter_title TEXT NOT NULL,
      page INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, manga_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_following (
      user_id INTEGER NOT NULL,
      manga_id TEXT NOT NULL,
      manga_title TEXT,
      cover TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, manga_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_history_user_updated ON user_history(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_following_user ON user_following(user_id, created_at DESC);
  `);

  // Migrate existing tables
  try {
    db.exec(`ALTER TABLE user_history ADD COLUMN page INTEGER DEFAULT 0;`);
  } catch {}

  if (process.env.NODE_ENV !== "production") {
    global.__truyendex_db = db;
  }

  return db;
}

let _dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (global.__truyendex_db) return global.__truyendex_db;
  if (!_dbInstance) {
    _dbInstance = getDatabase();
  }
  return _dbInstance;
}

export const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const instance = getDb() as any;
    const val = instance[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export interface DbUser {
  id: number;
  username: string;
}

export interface ReadingHistoryItem {
  mangaTitle: string;
  cover?: string;
  chapterId: string;
  chapterTitle: string;
  page?: number;
  updatedAt?: string;
}

export const LocalAuthDb = {
  createUser(username: string, password: string): DbUser {
    const trimmedUser = username.trim();
    if (trimmedUser.length < 3) {
      throw new Error("Tên người dùng phải có ít nhất 3 ký tự");
    }
    if (password.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const password_hash = hashPassword(password, salt);

    try {
      const stmt = db.prepare(
        "INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
      );
      const result = stmt.run(trimmedUser, password_hash, salt);
      return { id: Number(result.lastInsertRowid), username: trimmedUser };
    } catch (err: any) {
      if (err.message?.includes("UNIQUE constraint failed: users.username")) {
        throw new Error(
          "Tên người dùng này đã tồn tại, vui lòng chọn tên khác",
        );
      }
      throw err;
    }
  },

  verifyUser(username: string, password: string): DbUser | null {
    const stmt = db.prepare(
      "SELECT id, username, password_hash, salt FROM users WHERE username = ?",
    );
    const row = stmt.get(username.trim()) as
      | { id: number; username: string; password_hash: string; salt: string }
      | undefined;

    if (!row) return null;

    const computed = hashPassword(password, row.salt);
    if (
      crypto.timingSafeEqual(
        Buffer.from(computed),
        Buffer.from(row.password_hash),
      )
    ) {
      return { id: row.id, username: row.username };
    }
    return null;
  },

  createSession(userId: number): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString("hex");
    // 30 days expiration
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const stmt = db.prepare(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
    );
    stmt.run(token, userId, expiresAt.toISOString());
    return { token, expiresAt };
  },

  getUserBySession(token: string): DbUser | null {
    if (!token) return null;
    const stmt = db.prepare(`
      SELECT u.id, u.username, s.expires_at 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ?
    `);
    const row = stmt.get(token) as
      | { id: number; username: string; expires_at: string }
      | undefined;

    if (!row) return null;

    if (new Date(row.expires_at) < new Date()) {
      this.deleteSession(token);
      return null;
    }

    return { id: row.id, username: row.username };
  },

  deleteSession(token: string): void {
    if (!token) return;
    const stmt = db.prepare("DELETE FROM sessions WHERE token = ?");
    stmt.run(token);
  },

  // History operations
  getHistory(userId: number): Record<string, ReadingHistoryItem> {
    const stmt = db.prepare(`
      SELECT manga_id, manga_title, cover, chapter_id, chapter_title, page, updated_at
      FROM user_history
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 100
    `);
    const rows = stmt.all(userId) as Array<{
      manga_id: string;
      manga_title: string;
      cover: string | null;
      chapter_id: string;
      chapter_title: string;
      page: number | null;
      updated_at: string;
    }>;

    const result: Record<string, ReadingHistoryItem> = {};
    for (const row of rows) {
      result[row.manga_id] = {
        mangaTitle: row.manga_title,
        cover: row.cover || undefined,
        chapterId: row.chapter_id,
        chapterTitle: row.chapter_title,
        page: row.page || 0,
        updatedAt: row.updated_at,
      };
    }
    return result;
  },

  upsertHistory(
    userId: number,
    item: {
      manga_id: string;
      manga_title: string;
      cover?: string;
      chapter_id: string;
      chapter_title: string;
      page?: number;
    },
  ): void {
    const stmt = db.prepare(`
      INSERT INTO user_history (user_id, manga_id, manga_title, cover, chapter_id, chapter_title, page, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, manga_id) DO UPDATE SET
        manga_title = excluded.manga_title,
        cover = coalesce(excluded.cover, user_history.cover),
        chapter_id = excluded.chapter_id,
        chapter_title = excluded.chapter_title,
        page = coalesce(excluded.page, user_history.page),
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(
      userId,
      String(item.manga_id),
      item.manga_title,
      item.cover || null,
      String(item.chapter_id),
      item.chapter_title,
      item.page !== undefined ? Number(item.page) : 0,
    );
  },

  updateHistoryPage(userId: number, mangaId: string, page: number): void {
    const stmt = db.prepare(`
      UPDATE user_history 
      SET page = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND manga_id = ?
    `);
    stmt.run(Number(page) || 0, userId, String(mangaId));
  },

  syncBatchHistory(userId: number, records: Record<string, any>): void {
    if (!records || typeof records !== "object") return;
    const insertStmt = db.prepare(`
      INSERT INTO user_history (user_id, manga_id, manga_title, cover, chapter_id, chapter_title, page, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, manga_id) DO UPDATE SET
        manga_title = excluded.manga_title,
        cover = coalesce(excluded.cover, user_history.cover),
        chapter_id = excluded.chapter_id,
        chapter_title = excluded.chapter_title,
        page = coalesce(excluded.page, user_history.page),
        updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = db.transaction((items: Array<[string, any]>) => {
      for (const [mangaId, val] of items) {
        if (!val || !val.chapterId) continue;
        insertStmt.run(
          userId,
          String(mangaId),
          val.mangaTitle || "Truyện",
          val.cover || null,
          String(val.chapterId),
          val.chapterTitle || "Chương",
          val.page !== undefined ? Number(val.page) : 0,
        );
      }
    });

    transaction(Object.entries(records));
  },

  deleteHistory(userId: number, mangaId: string): void {
    const stmt = db.prepare(
      "DELETE FROM user_history WHERE user_id = ? AND manga_id = ?",
    );
    stmt.run(userId, String(mangaId));
  },

  // Following operations
  getFollowing(userId: number): Array<{
    series_uuid: string;
    title: string;
    cover: string | null;
    created_at: string;
  }> {
    const stmt = db.prepare(`
      SELECT manga_id AS series_uuid, manga_title AS title, cover, created_at
      FROM user_following
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId) as any;
  },

  isFollowing(userId: number, mangaId: string): boolean {
    const stmt = db.prepare(
      "SELECT 1 FROM user_following WHERE user_id = ? AND manga_id = ?",
    );
    return !!stmt.get(userId, String(mangaId));
  },

  toggleFollow(
    userId: number,
    mangaId: string,
    mangaTitle?: string,
    cover?: string,
  ): boolean {
    const mid = String(mangaId);
    const existing = db
      .prepare(
        "SELECT 1 FROM user_following WHERE user_id = ? AND manga_id = ?",
      )
      .get(userId, mid);

    if (existing) {
      db.prepare(
        "DELETE FROM user_following WHERE user_id = ? AND manga_id = ?",
      ).run(userId, mid);
      return false;
    } else {
      db.prepare(
        "INSERT INTO user_following (user_id, manga_id, manga_title, cover) VALUES (?, ?, ?, ?)",
      ).run(userId, mid, mangaTitle || "Truyện", cover || null);
      return true;
    }
  },
};
