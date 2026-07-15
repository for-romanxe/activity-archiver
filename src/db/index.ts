import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const sqlite = new Database(path.join(DATA_DIR, "archive.db"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  org TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL DEFAULT '',
  peers TEXT NOT NULL DEFAULT '',
  invite_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  joined_at TEXT NOT NULL,
  UNIQUE(activity_id, user_id)
);
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id),
  uploader_id TEXT NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id),
  addressee_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  UNIQUE(requester_id, addressee_id)
);
CREATE TABLE IF NOT EXISTS activity_invites (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  invited_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(activity_id, user_id)
);
CREATE TABLE IF NOT EXISTS scraps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  deadline TEXT NOT NULL DEFAULT '',
  memo TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '지원예정',
  created_at TEXT NOT NULL
);
`);

// 기존 DB 마이그레이션: peers 컬럼이 없으면 추가
const activityCols = sqlite.prepare("PRAGMA table_info(activities)").all() as { name: string }[];
if (!activityCols.some((c) => c.name === "peers")) {
  sqlite.exec("ALTER TABLE activities ADD COLUMN peers TEXT NOT NULL DEFAULT ''");
}

export const db = drizzle(sqlite, { schema });
export { schema };
