import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

function resolveDataDir(): string {
  const envDir = process.env.DATA_DIR;
  if (envDir && envDir.trim().length > 0) {
    return envDir;
  }

  return path.join(os.homedir(), ".coach-product-coach");
}

export function resolveDbPath(): string {
  const envPath = process.env.DB_PATH;
  if (envPath && envPath.trim().length > 0) {
    return envPath;
  }

  return path.join(resolveDataDir(), "coach.db");
}

function ensureParentDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function initSchema(sqlite: Database.Database): void {
  sqlite.pragma("journal_mode = WAL");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS auth_config (
      id TEXT PRIMARY KEY,
      passcode_hash TEXT NOT NULL,
      passcode_salt TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS litellm_config (
      id TEXT PRIMARY KEY,
      base_url TEXT NOT NULL,
      model TEXT NOT NULL,
      encrypted_api_key TEXT NOT NULL,
      iv TEXT NOT NULL,
      tag TEXT NOT NULL,
      enable_redaction INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS case_sessions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      week INTEGER NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      last_user_response TEXT,
      evaluation_id TEXT,
      turns_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      normalized_score REAL NOT NULL,
      rubric_json TEXT NOT NULL,
      panel_json TEXT NOT NULL,
      strengths_json TEXT NOT NULL,
      blind_spots_json TEXT NOT NULL,
      missing_evidence_json TEXT NOT NULL,
      better_decision_memo TEXT NOT NULL,
      weakness_signals_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress (
      id TEXT PRIMARY KEY,
      xp INTEGER NOT NULL,
      level INTEGER NOT NULL,
      streak_days INTEGER NOT NULL,
      last_activity_date TEXT
    );

    CREATE TABLE IF NOT EXISTS case_completions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      week INTEGER NOT NULL,
      score REAL NOT NULL,
      xp_awarded INTEGER NOT NULL,
      completed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weakness_history (
      id TEXT PRIMARY KEY,
      axis TEXT NOT NULL,
      signal REAL NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_case_completions_case_id ON case_completions(case_id);
    CREATE INDEX IF NOT EXISTS idx_case_completions_completed_at ON case_completions(completed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_weakness_history_axis ON weakness_history(axis);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);
  `);
}

type DBCache = {
  sqlite: Database.Database;
  db: ReturnType<typeof drizzle>;
};

const GLOBAL_KEY = "__coach_storage_db__";
const requireFromHere = createRequire(import.meta.url);

function resolveNativeBindingPathOrNull(): string | null {
  try {
    const entry = requireFromHere.resolve("better-sqlite3");
    const pkgRoot = path.dirname(path.dirname(entry));
    return path.join(pkgRoot, "build", "Release", "better_sqlite3.node");
  } catch {
    return null;
  }
}

function getCache(): DBCache {
  const globalStore = globalThis as typeof globalThis & { [GLOBAL_KEY]?: DBCache };
  if (globalStore[GLOBAL_KEY]) {
    return globalStore[GLOBAL_KEY] as DBCache;
  }

  const dbPath = resolveDbPath();
  ensureParentDir(dbPath);

  const nativeBinding = resolveNativeBindingPathOrNull();
  const sqlite = new Database(
    dbPath,
    nativeBinding
      ? {
          nativeBinding
        }
      : undefined
  );
  initSchema(sqlite);

  const db = drizzle(sqlite);
  const cache: DBCache = { sqlite, db };
  globalStore[GLOBAL_KEY] = cache;
  return cache;
}

export function getDatabase(): DBCache {
  return getCache();
}
