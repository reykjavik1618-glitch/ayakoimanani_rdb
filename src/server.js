import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createPost, getRecentPosts, getPostsSince, closeDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 静的ファイルの配信
app.use(express.static(__dirname));

// API: 投稿を作成
app.post('/api/posts', (req, res) => {
  try {
    const { author, content, timestamp } = req.body;
    
    if (!author || !content || !timestamp) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }
    
    if (content.length > 50) {
      return res.status(400).json({ error: '投稿は50文字以内にしてください' });
    }
    
    const post = createPost(author, content, timestamp);
    res.json(post);
  } catch (error) {
    console.error('投稿の作成エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// API: 最新の投稿を取得（最大1000件）
app.get('/api/posts', (req, res) => {
  try {
    const posts = getRecentPosts(1000);
    res.json(posts);
  } catch (error) {
    console.error('投稿の取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// API: 指定されたタイムスタンプ以降の投稿を取得（ポーリング用）
app.get('/api/posts/since/:timestamp', (req, res) => {
  try {
    const { timestamp } = req.params;
    const posts = getPostsSince(timestamp);
    res.json(posts);
  } catch (error) {
    console.error('投稿の取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ルートページ（index.htmlを配信）
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║     ✨ いまなにしてる？サーバー起動しました ✨       ║
║                                                   ║
║     http://localhost:${PORT}                        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nサーバーをシャットダウンしています...');
  server.close(() => {
    closeDb();
    console.log('サーバーを正常に終了しました');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n\nサーバーをシャットダウンしています...');
  server.close(() => {
    closeDb();
    console.log('サーバーを正常に終了しました');
    process.exit(0);
  });
});

