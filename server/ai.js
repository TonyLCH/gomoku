// 五子棋 AI - 基於啟發式位置評分
const BOARD_SIZE = 15;

// 模式分數表
const SCORES = {
  FIVE: 1000000,
  OPEN_FOUR: 100000,
  CLOSED_FOUR: 10000,
  OPEN_THREE: 10000,
  CLOSED_THREE: 1000,
  OPEN_TWO: 1000,
  CLOSED_TWO: 100,
  OPEN_ONE: 100,
  CLOSED_ONE: 10,
};

class GomokuAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty; // easy, medium, hard
  }

  // 獲取最佳落子位置
  getBestMove(board, aiColor) {
    const opponentColor = aiColor === 1 ? 2 : 1;
    let bestScore = -Infinity;
    let bestMoves = [];

    // 評估所有空位
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== 0) continue;

        const attackScore = this.evaluatePosition(board, r, c, aiColor);
        const defendScore = this.evaluatePosition(board, r, c, opponentColor);

        // 防守權重略低，但對手接近勝利時要提高防守
        const totalScore = attackScore + defendScore * 0.9;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMoves = [{ row: r, col: c }];
        } else if (totalScore === bestScore) {
          bestMoves.push({ row: r, col: c });
        }
      }
    }

    // 對於 easy 難度，加入隨機性
    if (this.difficulty === 'easy' && bestMoves.length > 1) {
      // 隨機選一個較好的位置，但可能不是最佳
      const idx = Math.floor(Math.random() * Math.min(bestMoves.length, 5));
      return bestMoves[idx];
    }

    // 從最佳位置中隨機選一個（增加多樣性）
    if (bestMoves.length > 0) {
      // hard 難度加入接近棋盤中心的偏好
      if (this.difficulty === 'hard') {
        bestMoves.sort((a, b) => {
          const distA = Math.abs(a.row - 7) + Math.abs(a.col - 7);
          const distB = Math.abs(b.row - 7) + Math.abs(b.col - 7);
          return distA - distB;
        });
        return bestMoves[0];
      }
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    // 如果棋盤為空，下天元（中心）
    return { row: 7, col: 7 };
  }

  // 評估在某位置落子後的分數
  evaluatePosition(board, row, col, player) {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    let totalScore = 0;

    for (const [dr, dc] of directions) {
      totalScore += this.evaluateDirection(board, row, col, dr, dc, player);
    }

    return totalScore;
  }

  // 評估單一方向
  evaluateDirection(board, row, col, dr, dc, player) {
    let count = 1; // 假設在此落子
    let openEnds = 0;
    let blockEnds = 0;

    // 正方向
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      if (board[r][c] === 0) openEnds++;
      else blockEnds++;
    }

    // 反方向
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      if (board[r][c] === 0) openEnds++;
      else blockEnds++;
    }

    return this.scorePattern(count, openEnds, blockEnds);
  }

  // 根據連續棋子數和開口數評分
  scorePattern(count, openEnds, blockEnds) {
    if (count >= 5) return SCORES.FIVE;
    if (openEnds === 0) return 0; // 兩端都被封死

    if (count === 4) {
      if (openEnds === 2) return SCORES.OPEN_FOUR;
      if (openEnds === 1) return SCORES.CLOSED_FOUR;
    }
    if (count === 3) {
      if (openEnds === 2) return SCORES.OPEN_THREE;
      if (openEnds === 1) return SCORES.CLOSED_THREE;
    }
    if (count === 2) {
      if (openEnds === 2) return SCORES.OPEN_TWO;
      if (openEnds === 1) return SCORES.CLOSED_TWO;
    }
    if (count === 1) {
      if (openEnds === 2) return SCORES.OPEN_ONE;
      if (openEnds === 1) return SCORES.CLOSED_ONE;
    }

    return 0;
  }
}

module.exports = { GomokuAI };
