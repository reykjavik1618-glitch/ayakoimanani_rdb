import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// データベースファイルのパス
const dbPath = join(__dirname, 'timeline.db');

// データベース接続を作成
const db = new Database(dbPath);

// テーブルを作成（存在しない場合）
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_created_at ON posts(created_at DESC);
`);

/**
 * 新しい投稿を作成
 */
export function createPost(author, content, timestamp) {
  const stmt = db.prepare('INSERT INTO posts (author, content, timestamp) VALUES (?, ?, ?)');
  const result = stmt.run(author, content, timestamp);
  return {
    id: result.lastInsertRowid,
    author,
    content,
    timestamp
  };
}

/**
 * 最新の投稿を取得（最大1000件）
 */
export function getRecentPosts(limit = 1000) {
  const stmt = db.prepare(`
    SELECT id, author, content, timestamp 
    FROM posts 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(limit).reverse(); // 古い順に並べ替えて返す
}

/**
 * 指定されたタイムスタンプ以降の投稿を取得
 */
export function getPostsSince(sinceTimestamp) {
  const stmt = db.prepare(`
    SELECT id, author, content, timestamp 
    FROM posts 
    WHERE timestamp > ?
    ORDER BY created_at ASC
  `);
  return stmt.all(sinceTimestamp);
}

/**
 * データベースを閉じる
 */
export function closeDb() {
  db.close();
}

export default db;

