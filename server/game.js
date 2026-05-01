// 五子棋遊戲核心邏輯
const BOARD_SIZE = 15;

class GomokuGame {
  constructor(roomId, player1Id, player2Id) {
    this.roomId = roomId;
    this.board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    this.players = [
      { id: player1Id, color: 1 },  // 1 = 黑子 (先手)
      { id: player2Id, color: 2 },  // 2 = 白子
    ];
    this.currentTurn = 1;  // 黑先
    this.moveHistory = [];
    this.winner = null;
    this.gameOver = false;
    this.createdAt = Date.now();
  }

  // 落子
  placeStone(playerId, row, col) {
    if (this.gameOver) return { valid: false, reason: '遊戲已結束' };
    
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { valid: false, reason: '你不是此房間的玩家' };
    if (player.color !== this.currentTurn) return { valid: false, reason: '還沒輪到你' };
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return { valid: false, reason: '超出棋盤範圍' };
    }
    if (this.board[row][col] !== 0) return { valid: false, reason: '此位置已有棋子' };

    this.board[row][col] = player.color;
    this.moveHistory.push({ playerId, row, col, color: player.color });

    // 檢查勝利
    if (this.checkWin(row, col, player.color)) {
      this.winner = playerId;
      this.gameOver = true;
      return { valid: true, winner: playerId, gameOver: true };
    }

    // 檢查平局
    if (this.moveHistory.length >= BOARD_SIZE * BOARD_SIZE) {
      this.gameOver = true;
      return { valid: true, draw: true, gameOver: true };
    }

    // 換回合
    this.currentTurn = this.currentTurn === 1 ? 2 : 1;
    return { valid: true, nextTurn: this.currentTurn };
  }

  // 檢查五連
  checkWin(row, col, color) {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of directions) {
      let count = 1;
      // 正方向
      for (let i = 1; i < 5; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board[r][c] === color) count++;
        else break;
      }
      // 反方向
      for (let i = 1; i < 5; i++) {
        const r = row - dr * i, c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board[r][c] === color) count++;
        else break;
      }
      if (count >= 5) return true;
    }
    return false;
  }

  // 獲取遊戲狀態(給特定玩家)
  getState(playerId) {
    const opponent = this.players.find(p => p.id !== playerId);
    const currentPlayer = this.players.find(p => p.color === this.currentTurn);
    return {
      roomId: this.roomId,
      board: this.board,
      currentTurn: this.currentTurn,
      yourColor: this.players.find(p => p.id === playerId)?.color,
      isYourTurn: currentPlayer?.id === playerId,
      winner: this.winner,
      gameOver: this.gameOver,
      moveCount: this.moveHistory.length,
      moveHistory: this.moveHistory,
      lastMove: this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null,
    };
  }
}

module.exports = { GomokuGame, BOARD_SIZE };
