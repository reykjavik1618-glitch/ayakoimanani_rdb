import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// データベースファイルのパス
const dbPath = join(__dirname, 'timeline.db');

// データベースインスタンス
let db;

// データベースを初期化
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // 既存のデータベースファイルがあれば読み込み
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // テーブルを作成（存在しない場合）
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON posts(created_at DESC)`);
  
  // データベースを保存
  saveDatabase();
}

// データベースをファイルに保存
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

// 初期化を実行
await initDatabase();

/**
 * 新しい投稿を作成
 */
export function createPost(author, content, timestamp) {
  db.run(
    'INSERT INTO posts (author, content, timestamp, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    [author, content, timestamp]
  );
  
  const result = db.exec('SELECT last_insert_rowid() as id');
  const id = result[0].values[0][0];
  
  // データベースを保存
  saveDatabase();
  
  return {
    id,
    author,
    content,
    timestamp
  };
}

/**
 * 最新の投稿を取得（最大1000件）
 */
export function getRecentPosts(limit = 1000) {
  const result = db.exec(`
    SELECT id, author, content, timestamp 
    FROM posts 
    ORDER BY created_at DESC 
    LIMIT ?
  `, [limit]);
  
  if (result.length === 0) {
    return [];
  }
  
  const posts = result[0].values.map(row => ({
    id: row[0],
    author: row[1],
    content: row[2],
    timestamp: row[3]
  }));
  
  return posts.reverse(); // 古い順に並べ替えて返す
}

/**
 * 指定されたタイムスタンプ以降の投稿を取得
 */
export function getPostsSince(sinceTimestamp) {
  const result = db.exec(`
    SELECT id, author, content, timestamp 
    FROM posts 
    WHERE timestamp > ?
    ORDER BY created_at ASC
  `, [sinceTimestamp]);
  
  if (result.length === 0) {
    return [];
  }
  
  return result[0].values.map(row => ({
    id: row[0],
    author: row[1],
    content: row[2],
    timestamp: row[3]
  }));
}

/**
 * データベースを閉じる
 */
export function closeDb() {
  if (db) {
    saveDatabase();
    db.close();
  }
}

export default db;
