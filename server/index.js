const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { GomokuGame } = require('./game');
const { GomokuAI } = require('./ai');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  connectionStateRecovery: { maxDisconnectionDuration: 120000 },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// 靜態資源
app.use(express.static(path.join(__dirname, '..', 'public')));

// 遊戲狀態管理
const games = new Map();          // roomId -> GomokuGame
const playerRooms = new Map();   // socketId -> roomId
const matchmakingQueue = [];     // [{ socketId, playerName, joinedAt }]
const aiGames = new Map();       // socketId -> { game, ai }

// ---- Socket.IO 事件處理 ----
io.on('connection', (socket) => {
  console.log(`玩家連線: ${socket.id}`);

  // === 線上配對 ===
  socket.on('join_matchmaking', (data) => {
    const playerName = data?.playerName || '匿名玩家';

    // 防止重複排隊
    if (matchmakingQueue.find(p => p.socketId === socket.id)) {
      socket.emit('matchmaking_status', { status: 'waiting', message: '正在尋找對手中...' });
      return;
    }

    // 檢查是否已有正在等待的玩家
    if (matchmakingQueue.length > 0) {
      const opponent = matchmakingQueue.shift();
      const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // 建立新遊戲
      const game = new GomokuGame(roomId, opponent.socketId, socket.id);
      games.set(roomId, game);
      playerRooms.set(opponent.socketId, roomId);
      playerRooms.set(socket.id, roomId);

      // 將兩個玩家加入 Socket.IO room
      io.sockets.sockets.get(opponent.socketId)?.join(roomId);
      socket.join(roomId);

      // 通知雙方配對成功
      const state1 = game.getState(opponent.socketId);
      const state2 = game.getState(socket.id);

      io.to(opponent.socketId).emit('match_found', {
        ...state1,
        opponentName: playerName,
      });
      io.to(socket.id).emit('match_found', {
        ...state2,
        opponentName: opponent.playerName,
      });

      console.log(`配對成功: ${opponent.playerName} vs ${playerName} (${roomId})`);
    } else {
      // 加入排隊
      matchmakingQueue.push({
        socketId: socket.id,
        playerName,
        joinedAt: Date.now(),
      });
      socket.emit('matchmaking_status', {
        status: 'waiting',
        message: '正在尋找對手中...排隊人數: ' + matchmakingQueue.length,
      });
      console.log(`玩家 ${playerName} 加入配對佇列 (佇列人數: ${matchmakingQueue.length})`);
    }
  });

  socket.on('leave_matchmaking', () => {
    removeFromQueue(socket.id);
    socket.emit('matchmaking_status', { status: 'cancelled', message: '已取消配對' });

    // 若玩家正在遊戲中，通知對手並清理遊戲
    const roomId = playerRooms.get(socket.id);
    if (roomId && games.has(roomId)) {
      const game = games.get(roomId);
      game.gameOver = true;
      const opponent = game.players.find(p => p.id !== socket.id);
      if (opponent) {
        game.winner = opponent.id;
        io.to(opponent.id).emit('opponent_disconnected', {
          message: '對手已退出房間，你贏了！',
        });
      }
      // 清理
      games.delete(roomId);
      for (const p of game.players) {
        playerRooms.delete(p.id);
      }
    }
  });

  // === AI 對戰 ===
  socket.on('start_ai_game', (data) => {
    const playerName = data?.playerName || '玩家';
    const difficulty = data?.difficulty || 'medium';
    const roomId = `ai_${socket.id}`;
    
    // 玩家永遠是黑子(先手)，AI 是白子
    const game = new GomokuGame(roomId, socket.id, 'AI');
    const ai = new GomokuAI(difficulty);
    aiGames.set(socket.id, { game, ai, playerName, difficulty });

    const state = game.getState(socket.id);
    socket.emit('ai_game_started', {
      ...state,
      opponentName: `AI (${getDifficultyLabel(difficulty)})`,
    });

    console.log(`AI對戰開始: ${playerName} vs AI(${difficulty}) [${socket.id}]`);
  });

  // === 落子 ===
  socket.on('make_move', (data) => {
    const { row, col } = data;

    // 檢查是否在 AI 對戰中
    if (aiGames.has(socket.id)) {
      const { game, ai } = aiGames.get(socket.id);
      const result = game.placeStone(socket.id, row, col);

      if (!result.valid) {
        socket.emit('move_rejected', { reason: result.reason });
        return;
      }

      // 發送玩家落子狀態
      socket.emit('game_state_update', game.getState(socket.id));

      // 檢查遊戲是否結束
      if (result.gameOver) {
        handleGameEnd(socket, game, 'ai');
        return;
      }

      // AI 回應
      setTimeout(() => {
        const aiMove = ai.getBestMove(game.board, 2); // AI 是白子(2)
        const aiResult = game.placeStone('AI', aiMove.row, aiMove.col);

        if (aiResult.valid) {
          socket.emit('game_state_update', game.getState(socket.id));

          if (aiResult.gameOver) {
            handleGameEnd(socket, game, 'ai');
          }
        }
      }, 300 + Math.random() * 400); // 模擬思考時間

      return;
    }

    // PvP 線上對戰
    const roomId = playerRooms.get(socket.id);
    if (!roomId) {
      socket.emit('move_rejected', { reason: '你不在任何遊戲中' });
      return;
    }

    const game = games.get(roomId);
    if (!game) {
      socket.emit('move_rejected', { reason: '遊戲不存在' });
      return;
    }

    const result = game.placeStone(socket.id, row, col);

    if (!result.valid) {
      socket.emit('move_rejected', { reason: result.reason });
      return;
    }

    // 廣播遊戲狀態給房間內所有玩家
    for (const player of game.players) {
      io.to(player.id).emit('game_state_update', game.getState(player.id));
    }

    if (result.gameOver) {
      handleGameEnd(socket, game, 'pvp');
    }
  });

  // === 聊天訊息 ===
  socket.on('game_chat', (data) => {
    const roomId = data?.roomId || playerRooms.get(socket.id);
    if (!roomId) return;
    const playerName = data?.playerName || '匿名玩家';
    const message = data?.message || data?.msg || '';
    if (!message.trim()) return;
    // 廣播給房間內其他玩家
    socket.to(roomId).emit('game_chat', { playerName, message });
  });

  // === 認輸 ===
  socket.on('surrender', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    const game = games.get(roomId);
    if (!game || game.gameOver) return;

    game.gameOver = true;
    // 找到對手，宣告對手獲勝
    const opponent = game.players.find(p => p.id !== socket.id);
    if (opponent) {
      game.winner = opponent.id;
    }

    // 通知雙方
    for (const player of game.players) {
      io.to(player.id).emit('game_state_update', game.getState(player.id));
    }
  });

  // === 重新開始（AI 模式） ===
  socket.on('restart_ai_game', (data) => {
    if (!aiGames.has(socket.id)) return;

    const { playerName, difficulty } = aiGames.get(socket.id);
    const newDifficulty = data?.difficulty || difficulty;
    const roomId = `ai_${socket.id}`;

    const game = new GomokuGame(roomId, socket.id, 'AI');
    const ai = new GomokuAI(newDifficulty);
    aiGames.set(socket.id, { game, ai, playerName: playerName, difficulty: newDifficulty });

    const state = game.getState(socket.id);
    socket.emit('ai_game_started', {
      ...state,
      opponentName: `AI (${getDifficultyLabel(newDifficulty)})`,
    });
  });

  // === 斷線處理 ===
  socket.on('disconnect', () => {
    console.log(`玩家離線: ${socket.id}`);

    // 從配對佇列移除
    removeFromQueue(socket.id);

    // 清理 AI 對戰
    if (aiGames.has(socket.id)) {
      aiGames.delete(socket.id);
    }

    // 處理 PvP 遊戲中的斷線
    const roomId = playerRooms.get(socket.id);
    if (roomId && games.has(roomId)) {
      const game = games.get(roomId);
      // 通知對手
      for (const player of game.players) {
        if (player.id !== socket.id && player.id !== 'AI') {
          io.to(player.id).emit('opponent_disconnected', {
            message: '對手已斷線，你贏了！',
          });
        }
      }
      games.delete(roomId);
    }
    playerRooms.delete(socket.id);
  });
});

// --- 輔助函數 ---

function removeFromQueue(socketId) {
  const idx = matchmakingQueue.findIndex(p => p.socketId === socketId);
  if (idx !== -1) matchmakingQueue.splice(idx, 1);
}

function handleGameEnd(socket, game, mode) {
  if (mode === 'pvp') {
    // PvP 結束，清理房間
    setTimeout(() => {
      const roomId = game.roomId;
      if (games.has(roomId)) {
        for (const player of game.players) {
          playerRooms.delete(player.id);
        }
        games.delete(roomId);
      }
    }, 10000); // 10秒後清理
  }
}

function getDifficultyLabel(d) {
  const labels = { easy: '簡單', medium: '中等', hard: '困難' };
  return labels[d] || d;
}

// --- 啟動伺服器 ---
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

function getLanIP() {
  const os = require('os');
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, HOST, () => {
  const lan = getLanIP();
  console.log(`🎮 五子棋伺服器已啟動`);
  console.log(`   本機: http://localhost:${PORT}`);
  console.log(`   手機: http://${lan}:${PORT}`);
  console.log(`📡 WebSocket 就緒，等待玩家連線...`);
});
