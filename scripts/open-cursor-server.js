#!/usr/bin/env node

/**
 * Cursor起動用ローカルブリッジサーバー
 * 
 * WebアプリからCursorを起動するためのローカルサーバー
 * ポート9999で待機し、POSTリクエストを受け取ってCursorを起動します
 */

const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');

const execAsync = promisify(exec);

const app = express();
const PORT = 9999;
const WS_PORT = 9998;

// HTTPサーバーを作成（WebSocket用）
const server = http.createServer(app);

// WebSocketサーバーを作成（別ポート）
const wss = new WebSocket.Server({ port: WS_PORT });

// アクティブな監視セッション
const activeWatchers = new Map(); // instructionId -> { watcher, clients: Set<WebSocket> }

// CORSを許可（ローカル開発用）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

/**
 * Cursorを起動する関数（OS別）
 */
async function openCursor(targetPath) {
  const platform = process.platform;
  const normalizedPath = path.resolve(targetPath);

  try {
    if (platform === 'darwin') {
      // macOS
      await execAsync(`open -a "Cursor" "${normalizedPath}"`);
    } else if (platform === 'win32') {
      // Windows
      // Cursorのインストールパスに応じて調整が必要な場合があります
      await execAsync(`start "" "Cursor" "${normalizedPath}"`);
    } else if (platform === 'linux') {
      // Linux
      // Cursor CLIが利用可能な場合
      await execAsync(`cursor "${normalizedPath}"`);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    return { success: true, message: `Cursor opened: ${normalizedPath}` };
  } catch (error) {
    // Cursor CLIを試す（macOS/Linux）
    if (platform === 'darwin' || platform === 'linux') {
      try {
        await execAsync(`cursor "${normalizedPath}"`);
        return { success: true, message: `Cursor opened via CLI: ${normalizedPath}` };
      } catch (cliError) {
        throw new Error(`Failed to open Cursor: ${error.message}. CLI also failed: ${cliError.message}`);
      }
    }
    throw error;
  }
}

/**
 * Cursorを起動して指示を渡す関数
 */
async function openCursorWithInstruction(targetPath, instruction) {
  const platform = process.platform;
  const normalizedPath = path.resolve(targetPath);

  try {
    // 指示がある場合は、一時ファイルに書き込む
    let tempFile = null;
    if (instruction) {
      const tempDir = path.join(normalizedPath, '.cursor-instructions');
      try {
        await fs.mkdir(tempDir, { recursive: true });
      } catch (err) {
        // ディレクトリが既に存在する場合は無視
      }

      const timestamp = Date.now();
      tempFile = path.join(tempDir, `instruction-${timestamp}.md`);
      await fs.writeFile(tempFile, `# Cursor指示\n\n${instruction}\n\n---\n\n生成日時: ${new Date().toISOString()}\n`, 'utf8');
    }

    // Cursorを起動
    if (platform === 'darwin') {
      // macOS: プロジェクトを開く
      await execAsync(`open -a "Cursor" "${normalizedPath}"`);
      // 指示ファイルがある場合は少し待ってから開く
      if (tempFile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await execAsync(`open -a "Cursor" "${tempFile}"`);
      }
    } else if (platform === 'win32') {
      // Windows: プロジェクトを開く
      await execAsync(`start "" "Cursor" "${normalizedPath}"`);
      // 指示ファイルがある場合は少し待ってから開く
      if (tempFile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await execAsync(`start "" "Cursor" "${tempFile}"`);
      }
    } else if (platform === 'linux') {
      // Linux: プロジェクトを開く
      await execAsync(`cursor "${normalizedPath}"`);
      // 指示ファイルがある場合は少し待ってから開く
      if (tempFile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await execAsync(`cursor "${tempFile}"`);
      }
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    
    return { 
      success: true, 
      message: instruction 
        ? `Cursor opened with instruction: ${normalizedPath}` 
        : `Cursor opened: ${normalizedPath}`,
      instructionFile: tempFile,
    };
  } catch (error) {
    // Cursor CLIを試す（macOS/Linux）
    if (platform === 'darwin' || platform === 'linux') {
      try {
        await execAsync(`cursor "${normalizedPath}"`);
        if (tempFile) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await execAsync(`cursor "${tempFile}"`);
        }
        return { 
          success: true, 
          message: `Cursor opened via CLI: ${normalizedPath}`,
          instructionFile: tempFile,
        };
      } catch (cliError) {
        throw new Error(`Failed to open Cursor: ${error.message}. CLI also failed: ${cliError.message}`);
      }
    }
    throw error;
  }
}

/**
 * POST /open-in-cursor
 * プロジェクトパスを受け取ってCursorを起動
 */
app.post('/open-in-cursor', async (req, res) => {
  try {
    const { path: targetPath, instruction } = req.body;

    if (!targetPath) {
      return res.status(400).json({
        success: false,
        error: 'Path parameter is required',
      });
    }

    console.log(`[${new Date().toISOString()}] Opening Cursor for: ${targetPath}${instruction ? ' with instruction' : ''}`);

    const result = instruction 
      ? await openCursorWithInstruction(targetPath, instruction)
      : await openCursor(targetPath);

    res.json({
      success: true,
      message: result.message,
      path: targetPath,
      instructionFile: result.instructionFile || null,
    });
  } catch (error) {
    console.error('Error opening Cursor:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to open Cursor',
    });
  }
});

/**
 * POST /open-in-cursor-with-instruction
 * プロジェクトパスと指示を受け取ってCursorを起動
 */
app.post('/open-in-cursor-with-instruction', async (req, res) => {
  try {
    const { path: targetPath, instruction } = req.body;

    if (!targetPath) {
      return res.status(400).json({
        success: false,
        error: 'Path parameter is required',
      });
    }

    if (!instruction) {
      return res.status(400).json({
        success: false,
        error: 'Instruction parameter is required',
      });
    }

    console.log(`[${new Date().toISOString()}] Opening Cursor with instruction for: ${targetPath}`);
    console.log(`Instruction: ${instruction.substring(0, 100)}...`);

    // Cursorを起動
    const result = await openCursorWithInstruction(targetPath, instruction);

    // 指示IDを生成（ファイル名から取得）
    const instructionId = result.instructionFile 
      ? path.basename(result.instructionFile, '.md').replace('instruction-', '')
      : Date.now().toString();

    // ファイル監視を開始
    if (result.instructionFile) {
      watchProjectForChanges(targetPath, instructionId, result.instructionFile);
    }

    res.json({
      success: true,
      message: result.message,
      path: targetPath,
      instructionFile: result.instructionFile,
      instructionId,
      wsUrl: `ws://127.0.0.1:${WS_PORT}`,
    });
  } catch (error) {
    console.error('Error opening Cursor with instruction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to open Cursor with instruction',
    });
  }
});

/**
 * ファイル変更を監視してクライアントに通知
 */
function watchProjectForChanges(projectPath, instructionId, instructionFile) {
  const normalizedPath = path.resolve(projectPath);
  
  // 既存の監視があれば停止
  if (activeWatchers.has(instructionId)) {
    const existing = activeWatchers.get(instructionId);
    existing.watcher.close();
  }

  // ファイル監視を開始
  const watcher = chokidar.watch(normalizedPath, {
    ignored: [
      /node_modules/,
      /.git/,
      /.next/,
      /\.cursor-instructions\/instruction-.*\.md$/, // 指示ファイル自体は除外
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  });

  const clients = new Set();

  watcher.on('change', async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf8').catch(() => '');
      
      const changeInfo = {
        type: 'file_changed',
        instructionId,
        filePath: path.relative(normalizedPath, filePath),
        fullPath: filePath,
        timestamp: new Date().toISOString(),
        size: stats.size,
        modified: stats.mtime.toISOString(),
        preview: content.substring(0, 500), // 最初の500文字をプレビュー
      };

      // すべてのクライアントに通知
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(changeInfo));
        }
      });

      console.log(`[${instructionId}] File changed: ${changeInfo.filePath}`);
    } catch (error) {
      console.error(`Error reading changed file: ${error.message}`);
    }
  });

  watcher.on('add', async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf8').catch(() => '');
      
      const changeInfo = {
        type: 'file_added',
        instructionId,
        filePath: path.relative(normalizedPath, filePath),
        fullPath: filePath,
        timestamp: new Date().toISOString(),
        size: stats.size,
        preview: content.substring(0, 500),
      };

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(changeInfo));
        }
      });

      console.log(`[${instructionId}] File added: ${changeInfo.filePath}`);
    } catch (error) {
      console.error(`Error reading new file: ${error.message}`);
    }
  });

  activeWatchers.set(instructionId, { watcher, clients, projectPath: normalizedPath });

  return { watcher, clients };
}

/**
 * WebSocket接続ハンドラー
 */
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'subscribe') {
        // 監視セッションに参加
        const { instructionId } = data;
        if (activeWatchers.has(instructionId)) {
          const watcherData = activeWatchers.get(instructionId);
          watcherData.clients.add(ws);
          console.log(`Client subscribed to instruction: ${instructionId}`);
          
          // 接続確認を送信
          ws.send(JSON.stringify({
            type: 'subscribed',
            instructionId,
            timestamp: new Date().toISOString(),
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: `No active watcher for instruction: ${instructionId}`,
          }));
        }
      } else if (data.type === 'unsubscribe') {
        // 監視セッションから退出
        const { instructionId } = data;
        if (activeWatchers.has(instructionId)) {
          const watcherData = activeWatchers.get(instructionId);
          watcherData.clients.delete(ws);
          console.log(`Client unsubscribed from instruction: ${instructionId}`);
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    // すべての監視セッションからこのクライアントを削除
    activeWatchers.forEach((watcherData) => {
      watcherData.clients.delete(ws);
    });
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

/**
 * GET /watch/:instructionId
 * 監視を開始
 */
app.post('/watch', async (req, res) => {
  try {
    const { projectPath, instructionId, instructionFile } = req.body;

    if (!projectPath || !instructionId) {
      return res.status(400).json({
        success: false,
        error: 'projectPath and instructionId are required',
      });
    }

    watchProjectForChanges(projectPath, instructionId, instructionFile);

    res.json({
      success: true,
      message: 'Watching started',
      instructionId,
      wsUrl: `ws://127.0.0.1:${WS_PORT}`,
    });
  } catch (error) {
    console.error('Error starting watch:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start watching',
    });
  }
});

/**
 * GET /watch/:instructionId/stop
 * 監視を停止
 */
app.post('/watch/:instructionId/stop', (req, res) => {
  try {
    const { instructionId } = req.params;

    if (activeWatchers.has(instructionId)) {
      const watcherData = activeWatchers.get(instructionId);
      watcherData.watcher.close();
      activeWatchers.delete(instructionId);
      
      res.json({
        success: true,
        message: 'Watching stopped',
        instructionId,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Watcher not found',
      });
    }
  } catch (error) {
    console.error('Error stopping watch:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop watching',
    });
  }
});

/**
 * GET /health
 * サーバーの稼働状況を確認
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    platform: process.platform,
    activeWatchers: activeWatchers.size,
  });
});

// HTTPサーバー起動
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Cursor Bridge Server running on http://127.0.0.1:${PORT}`);
  console.log(`📝 Ready to open Cursor from web app`);
  console.log(`💡 Health check: http://127.0.0.1:${PORT}/health`);
  console.log(`🔌 WebSocket server running on ws://127.0.0.1:${WS_PORT}`);
});

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

