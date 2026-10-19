/**
 * SQLite storage (node:sqlite, built into Node 22+). One file, WAL mode,
 * migrations applied at start-up. Everything the web app knows lives here;
 * themes and rendered files live on disk next to it (data/).
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export interface Db extends DatabaseSync {}

const MIGRATIONS: string[] = [
  `
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    theme TEXT NOT NULL DEFAULT '_default',
    language TEXT NOT NULL DEFAULT 'nl',
    risk_model TEXT NOT NULL DEFAULT 'cvss31',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE engagements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    reference TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    step INTEGER NOT NULL DEFAULT 1,
    data TEXT NOT NULL DEFAULT '{}',          -- engagement.yaml fields as JSON (except findings)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engagement_id INTEGER NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    markdown TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    severity TEXT NOT NULL DEFAULT '',
    library_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE finding_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    finding_id INTEGER NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    markdown TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'nl',
    tags TEXT NOT NULL DEFAULT '',
    markdown TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT '',
    used_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engagement_id INTEGER NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime TEXT NOT NULL,
    bytes INTEGER NOT NULL,
    width INTEGER, height INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(engagement_id, name)
  );
  CREATE TABLE renders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engagement_id INTEGER NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    document TEXT NOT NULL,
    version TEXT NOT NULL,
    language TEXT NOT NULL,
    theme TEXT NOT NULL,
    pdf TEXT, docx TEXT,
    diagnostics TEXT NOT NULL DEFAULT '[]',
    ok INTEGER NOT NULL DEFAULT 1,
    duration_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX findings_eng ON findings(engagement_id, position);
  CREATE INDEX renders_eng ON renders(engagement_id, created_at);
  `,
  `
  CREATE TABLE deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engagement_id INTEGER NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    render_id INTEGER,
    document TEXT NOT NULL,
    version TEXT NOT NULL,
    language TEXT NOT NULL,
    pdf TEXT, docx TEXT,
    sha256_pdf TEXT, sha256_docx TEXT,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  ALTER TABLE renders ADD COLUMN template TEXT NOT NULL DEFAULT 'pentest-report';
  `,
];

export function openDb(file: string): Db {
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
  db.exec('INSERT INTO schema_version SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM schema_version)');
  const row = db.prepare('SELECT version FROM schema_version').get() as { version: number };
  for (let v = row.version; v < MIGRATIONS.length; v++) {
    db.exec('BEGIN');
    db.exec(MIGRATIONS[v]);
    db.prepare('UPDATE schema_version SET version = ?').run(v + 1);
    db.exec('COMMIT');
  }
  return db;
}

export const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
