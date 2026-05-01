// 五子棋前端 - 棋盤渲染 & Socket.IO 通訊
// 整合 gomoku-game UI 風格到 gomoku Express 伺服器
const socket = io();

// ======== 背景粒子系統（多層次視差） ========
(function() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let fireflies = [], dusts = [], embers = [];
  let animId, time = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // 螢火蟲：大粒、緩慢、金色
  for (let i = 0; i < 20; i++) {
    fireflies.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 1.5,
      vx: (Math.random() - .5) * .08,
      vy: (Math.random() - .5) * .08 - .04,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * .02 + .008,
      hue: 35 + Math.random() * 15
    });
  }
  // 微塵：小粒、漂浮
  for (let i = 0; i < 50; i++) {
    dusts.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * .8 + .2,
      vx: (Math.random() - .5) * .04,
      vy: (Math.random() - .5) * .04 - .02,
      alpha: Math.random() * .4 + .1
    });
  }
  // 餘燼：向上飄、更亮
  for (let i = 0; i < 30; i++) {
    embers.push({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 200,
      r: Math.random() * 1.5 + .5,
      vy: -(Math.random() * .3 + .1),
      vx: (Math.random() - .5) * .2,
      life: Math.random(),
      alpha: Math.random() * .6 + .2
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time += .016;

    // 微塵
    for (const p of dusts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,160,100,${p.alpha})`;
      ctx.fill();
    }

    // 螢火蟲
    for (const p of fireflies) {
      p.x += p.vx; p.y += p.vy;
      p.phase += p.speed;
      if (p.x < -20) p.x = canvas.width + 20;
      if (p.x > canvas.width + 20) p.x = -20;
      if (p.y < -20) p.y = canvas.height + 20;
      if (p.y > canvas.height + 20) p.y = -20;
      const a = (.3 + .7 * Math.sin(p.phase)) * .6;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grad.addColorStop(0, `hsla(${p.hue},70%,60%,${a})`);
      grad.addColorStop(.5, `hsla(${p.hue},60%,45%,${a*.3})`);
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // 餘燼
    for (const p of embers) {
      p.y += p.vy; p.x += p.vx;
      p.life += .003;
      if (p.life > 1) { p.y = canvas.height + 50; p.x = Math.random() * canvas.width; p.life = 0; }
      if (p.x < -10 || p.x > canvas.width + 10) { p.x = Math.random() * canvas.width; p.y = canvas.height + 50; p.life = 0; }
      const a = p.alpha * (1 - p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 - p.life * .5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,180,60,${a})`;
      ctx.fill();
    }

    animId = requestAnimationFrame(animate);
  }
  animate();
})();

// ======== 裝飾棋盤背景 ========
(function() {
  const canvas = document.getElementById('decoCanvas');
  if (!canvas) return;
  canvas.width = 800; canvas.height = 800;
  const dctx = canvas.getContext('2d');
  const size = 15, cell = 36, pad = 60;

  // 木質背景
  const bgGrad = dctx.createLinearGradient(0, 0, 800, 800);
  bgGrad.addColorStop(0, '#e8c97a');
  bgGrad.addColorStop(.3, '#f0d9a0');
  bgGrad.addColorStop(.6, '#e0c080');
  bgGrad.addColorStop(1, '#d4b06a');
  dctx.fillStyle = bgGrad;
  dctx.fillRect(0, 0, 800, 800);

  // 網格
  dctx.strokeStyle = 'rgba(80,50,20,0.6)';
  dctx.lineWidth = 1.2;
  for (let i = 0; i < size; i++) {
    const p = pad + i * cell;
    dctx.beginPath(); dctx.moveTo(pad, p); dctx.lineTo(pad + 14 * cell, p); dctx.stroke();
    dctx.beginPath(); dctx.moveTo(p, pad); dctx.lineTo(p, pad + 14 * cell); dctx.stroke();
  }

  // 星位
  [3, 7, 11].forEach(r => {
    [3, 7, 11].forEach(c => {
      dctx.beginPath();
      dctx.arc(pad + c * cell, pad + r * cell, 5, 0, Math.PI * 2);
      dctx.fillStyle = 'rgba(80,50,20,0.8)';
      dctx.fill();
    });
  });

  // 隨機裝飾棋子
  const moves = [
    [3,3,2],[3,7,1],[3,11,2],[7,4,1],[7,8,2],[7,11,1],
    [8,7,1],[9,5,2],[9,9,1],[10,3,2],[5,5,1],[5,9,2],
    [6,10,1],[11,6,2],[11,10,1],[4,4,1]
  ];
  moves.forEach(([r, c, color]) => {
    const x = pad + c * cell, y = pad + r * cell;
    const grad = dctx.createRadialGradient(x-3, y-3, 1, x, y, 16);
    if (color === 1) {
      grad.addColorStop(0, '#555'); grad.addColorStop(.7, '#1a1a1a'); grad.addColorStop(1, '#0a0a0a');
    } else {
      grad.addColorStop(0, '#fff'); grad.addColorStop(.7, '#e0e0e0'); grad.addColorStop(1, '#c0c0c0');
    }
    dctx.beginPath();
    dctx.arc(x, y, 16, 0, Math.PI * 2);
    dctx.fillStyle = grad;
    dctx.fill();
  });
})();

// ======== DOM 元素 ========
const el = (id) => document.getElementById(id);

const mainMenu = el('mainMenu');
const lobbyScreen = el('lobbyScreen');
const matchingScreen = el('matchingScreen');
const gameScreen = el('gameScreen');
const resultOverlay = el('resultOverlay');
const confirmOverlay = el('confirmOverlay');
const boardCanvas = el('boardCanvas');
const ctx = boardCanvas.getContext('2d');
const connectionStatus = el('connectionStatus');

// ======== Cookie 輔助 ========
const COOKIE_NAME = 'gomoku_player_name';
const COOKIE_DAYS = 365;

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}

// ======== 音效引擎 ========
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  _getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    el('btnSoundToggle').textContent = this.enabled ? '🔊' : '🔇';
    return this.enabled;
  }

  isEnabled() { return this.enabled; }

  playPlace(isBlack) {
    if (!this.enabled) return;
    try {
      const c = this._getCtx();
      const now = c.currentTime;
      // 主音
      const osc = c.createOscillator();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isBlack ? 800 : 1000, now);
      osc.frequency.exponentialRampToValueAtTime(isBlack ? 200 : 250, now + 0.08);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(filter); filter.connect(gain); gain.connect(c.destination);
      osc.start(now); osc.stop(now + 0.15);
      // 共振
      const osc2 = c.createOscillator();
      const gain2 = c.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(isBlack ? 400 : 500, now);
      osc2.frequency.exponentialRampToValueAtTime(100, now + 0.12);
      gain2.gain.setValueAtTime(0.1, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2); gain2.connect(c.destination);
      osc2.start(now); osc2.stop(now + 0.12);
    } catch {}
  }

  playWin() {
    if (!this.enabled) return;
    try {
      const c = this._getCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, c.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0, c.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.2, c.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.15 + 0.4);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(c.currentTime + i * 0.15);
        osc.stop(c.currentTime + i * 0.15 + 0.4);
      });
    } catch {}
  }

  playLose() {
    if (!this.enabled) return;
    try {
      const c = this._getCtx();
      const notes = [400, 350, 300, 250];
      notes.forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, c.currentTime + i * 0.2);
        gain.gain.setValueAtTime(0, c.currentTime + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.15, c.currentTime + i * 0.2 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.2 + 0.5);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(c.currentTime + i * 0.2);
        osc.stop(c.currentTime + i * 0.2 + 0.5);
      });
    } catch {}
  }

  playDraw() {
    if (!this.enabled) return;
    try {
      const c = this._getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, c.currentTime);
      gain.gain.setValueAtTime(0.15, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.6);
    } catch {}
  }
}

const sound = new SoundEngine();

// ======== 遊戲狀態 ========
const BOARD_SIZE = 15;
const CELL_SIZE = 38;
const PADDING = 24;

let gameState = null;     // 來自伺服器的 getState() 結果
let gameMode = null;      // 'ai' | 'online'
let mySocketId = null;
let playerName = '';
let onlineOpponentName = '';
let aiDifficulty = 'medium';
let chatMessages = [];    // { name, msg }[]
let stoneAnimations = []; // { row, col, startTime, color }
let winLineData = null;   // { cells: [{row,col}], direction } - for glow animation
let animFrameId = 0;

// ======== UI 狀態管理 ========
function showScreen(screen) {
  [mainMenu, lobbyScreen, matchingScreen, gameScreen].forEach(s => {
    s.classList.add('hidden');
  });
  if (screen) {
    screen.classList.remove('hidden');
    if (screen === mainMenu) {
      screen.style.transition = 'none';
      screen.offsetHeight;
      screen.style.opacity = '1';
      screen.style.transform = 'translateY(0)';
      screen.classList.add('visible');
      requestAnimationFrame(() => { screen.style.transition = ''; });
    }
  }
}

// Helper: show any fade-in card instantly (bypass CSS transition)
function showCard(card) {
  card.style.transition = 'none';
  card.offsetHeight;
  card.style.opacity = '1';
  card.style.transform = 'translateY(0)';
  card.classList.add('visible');
  requestAnimationFrame(() => { card.style.transition = ''; });
}

function showResult(title, desc, iconClass, showOverlayActions) {
  hideConfirmDialog();
  el('resultTitle').textContent = title;
  el('resultDesc').textContent = desc || '';
  const icon = el('resultIcon');
  icon.className = 'overlay-icon ' + (iconClass || 'win-black');
  if (iconClass === 'win-black') icon.textContent = '♚';
  else if (iconClass === 'win-white') icon.textContent = '♚';
  else if (iconClass === 'draw-icon') icon.textContent = '½';
  else if (iconClass === 'waiting-icon') icon.textContent = '♚';
  el('resultActions').classList.toggle('hidden', !showOverlayActions);
  resultOverlay.classList.remove('hidden');
}

function hideResult() {
  resultOverlay.classList.add('hidden');
}

// ======== 自訂確認/提示彈窗 ========
let _confirmCallback = null;
let _alertCallback = null;

function showConfirmDialog(title, msg, confirmText, cancelText, onConfirm, onCancel) {
  _confirmCallback = { onConfirm, onCancel };
  el('confirmIcon').className = 'confirm-icon warning';
  el('confirmIcon').textContent = '⚠️';
  el('confirmTitle').textContent = title || '確認';
  el('confirmDesc').textContent = msg || '';
  el('btnConfirmOk').textContent = confirmText || '確定';
  el('btnConfirmCancel').textContent = cancelText || '取消';
  el('btnConfirmOk').className = 'btn btn-danger';
  el('btnConfirmCancel').classList.remove('hidden');
  el('btnConfirmCancel').style.display = '';
  confirmOverlay.classList.remove('hidden');
}

function showAlertDialog(title, msg, buttonText, onClose) {
  _alertCallback = onClose || null;
  el('confirmIcon').className = 'confirm-icon';
  el('confirmIcon').textContent = 'ℹ️';
  el('confirmTitle').textContent = title || '提示';
  el('confirmDesc').textContent = msg || '';
  el('btnConfirmOk').textContent = buttonText || '知道了';
  el('btnConfirmOk').className = 'btn btn-primary';
  el('btnConfirmCancel').style.display = 'none';
  confirmOverlay.classList.remove('hidden');
}

function hideConfirmDialog() {
  confirmOverlay.classList.add('hidden');
}

// ======== 初始化 Canvas ========
function initCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const totalSize = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2;
  boardCanvas.width = totalSize;
  boardCanvas.height = totalSize;
  const displaySize = Math.min(90 * (window.innerWidth / 100), 580);
  boardCanvas.style.width = displaySize + 'px';
  boardCanvas.style.height = displaySize + 'px';
}

// ======== Canvas 繪製 ========
function drawStone(cx, cy, color, scale) {
  scale = scale || 1;
  const radius = (CELL_SIZE / 2 - 2) * scale;
  if (radius <= 0) return;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4 * scale;
  ctx.shadowOffsetX = 2 * scale;
  ctx.shadowOffsetY = 2 * scale;

  if (color === 1) {
    const grad = ctx.createRadialGradient(cx - 3 * scale, cy - 3 * scale, 1, cx, cy, radius);
    grad.addColorStop(0, '#555555');
    grad.addColorStop(0.3, '#333333');
    grad.addColorStop(0.7, '#1a1a1a');
    grad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grad;
  } else {
    const grad = ctx.createRadialGradient(cx - 3 * scale, cy - 3 * scale, 1, cx, cy, radius);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, '#F8F8F8');
    grad.addColorStop(0.7, '#E8E8E8');
    grad.addColorStop(1, '#C8C8C8');
    ctx.fillStyle = grad;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 邊框
  ctx.strokeStyle = color === 1 ? 'rgba(0,0,0,0.5)' : 'rgba(150,150,150,0.5)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 高光
  if (scale > 0.5) {
    ctx.save();
    ctx.globalAlpha = color === 1 ? 0.15 : 0.4;
    const hlGrad = ctx.createRadialGradient(cx - 4 * scale, cy - 4 * scale, 0, cx - 4 * scale, cy - 4 * scale, 5 * scale);
    hlGrad.addColorStop(0, '#FFFFFF');
    hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(cx - 4 * scale, cy - 4 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBoard() {
  const totalSize = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2;
  ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

  // 木紋背景
  const bgGrad = ctx.createLinearGradient(0, 0, totalSize, totalSize);
  bgGrad.addColorStop(0, '#f0d9a0');
  bgGrad.addColorStop(0.3, '#f5e6c8');
  bgGrad.addColorStop(0.6, '#ecd9a8');
  bgGrad.addColorStop(1, '#f0d9a0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, totalSize, totalSize);

  // 木紋紋理
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#b8965a';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < totalSize; i += 6) {
    ctx.beginPath();
    ctx.moveTo(0, i + Math.sin(i * 0.05) * 5);
    ctx.bezierCurveTo(
      totalSize * 0.3, i + Math.sin(i * 0.07 + 1) * 6,
      totalSize * 0.7, i + Math.sin(i * 0.04 + 2) * 4,
      totalSize, i + Math.sin(i * 0.06 + 3) * 5
    );
    ctx.stroke();
  }
  ctx.restore();

  // 棋盤紫色發光邊框
  ctx.save();
  ctx.shadowColor = 'rgba(180,140,70,0.15)';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(PADDING - 1, PADDING - 1, (BOARD_SIZE - 1) * CELL_SIZE + 2, (BOARD_SIZE - 1) * CELL_SIZE + 2);
  ctx.restore();

  // 網格線
  ctx.strokeStyle = '#b8965a';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < BOARD_SIZE; i++) {
    const pos = PADDING + i * CELL_SIZE;
    ctx.beginPath(); ctx.moveTo(PADDING, pos); ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, pos); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pos, PADDING); ctx.lineTo(pos, PADDING + (BOARD_SIZE - 1) * CELL_SIZE); ctx.stroke();
  }

  // 座標標記
  ctx.save();
  ctx.font = '9px sans-serif';
  ctx.fillStyle = '#a08060';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < BOARD_SIZE; i++) {
    ctx.fillText(String.fromCharCode(65 + i), PADDING + i * CELL_SIZE, 10);
    ctx.textAlign = 'right';
    ctx.fillText(String(BOARD_SIZE - i), PADDING - 10, PADDING + i * CELL_SIZE);
    ctx.textAlign = 'center';
  }
  ctx.restore();

  // 星位點
  const starPoints = [3, 7, 11];
  ctx.fillStyle = '#a08060';
  for (const r of starPoints) {
    for (const c of starPoints) {
      ctx.beginPath();
      ctx.arc(PADDING + c * CELL_SIZE, PADDING + r * CELL_SIZE, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 繪製棋子（含動畫）
  const now = performance.now();
  const board = gameState ? gameState.board : null;
  if (board) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== 0) {
          const x = PADDING + c * CELL_SIZE;
          const y = PADDING + r * CELL_SIZE;
          const anim = stoneAnimations.find(a => a.row === r && a.col === c);
          let scale = 1;
          if (anim) {
            const elapsed = now - anim.startTime;
            if (elapsed < 200) {
              const t = elapsed / 200;
              scale = 1 + 0.3 * Math.sin(t * Math.PI) * (1 - t);
            }
          }
          drawStone(x, y, board[r][c], scale);
        }
      }
    }
  }

  // 勝利線發光
  if (winLineData && gameState && gameState.gameOver) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 200);
    ctx.save();
    ctx.globalAlpha = 0.3 + pulse * 0.3;
    const winColor = gameState.winner === mySocketId ? '#e2b04a' : '#d44a4a';
    ctx.strokeStyle = winColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = winColor;
    ctx.shadowBlur = 10 + pulse * 10;
    for (const cell of winLineData.cells) {
      const x = PADDING + cell.col * CELL_SIZE;
      const y = PADDING + cell.row * CELL_SIZE;
      ctx.beginPath();
      ctx.arc(x, y, CELL_SIZE / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 最後一手標記
  if (gameState && gameState.lastMove) {
    const x = PADDING + gameState.lastMove.col * CELL_SIZE;
    const y = PADDING + gameState.lastMove.row * CELL_SIZE;
    const pulse = 0.6 + 0.4 * Math.sin(now / 300);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#c89635';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#c89635';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 懸浮預覽
  if (hoverPos && gameState && !gameState.gameOver && gameState.isYourTurn) {
    const r = hoverPos.row, c = hoverPos.col;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && gameState.board[r][c] === 0) {
      const x = PADDING + c * CELL_SIZE;
      const y = PADDING + r * CELL_SIZE;
      const stoneColor = gameState.yourColor;
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.shadowColor = stoneColor === 1 ? '#333' : '#CCC';
      ctx.shadowBlur = 15;
      drawStone(x, y, stoneColor, 0.9);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.5;
      drawStone(x, y, stoneColor, 0.9);
      ctx.restore();
    }
  }
}

// ======== 動畫循環 ========
function startAnimLoop() {
  function loop() {
    const now = performance.now();
    const hasActiveAnim = stoneAnimations.some(a => now - a.startTime < 250);
    const needsAnim = hasActiveAnim || (winLineData && gameState && gameState.gameOver) || (gameState && gameState.lastMove);
    if (needsAnim) {
      drawBoard();
    }
    if (gameScreen.classList.contains('hidden')) return;
    animFrameId = requestAnimationFrame(loop);
  }
  cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(loop);
}

function stopAnimLoop() {
  cancelAnimationFrame(animFrameId);
}

// ======== 勝利線搜尋 ========
function findWinLine(board, row, col, player) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let di = 0; di < directions.length; di++) {
    const [dr, dc] = directions[di];
    const cells = [{ row, col }];
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || board[r][c] !== player) break;
      cells.push({ row: r, col: c });
    }
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || board[r][c] !== player) break;
      cells.push({ row: r, col: c });
    }
    if (cells.length >= 5) return { cells, direction: di };
  }
  return null;
}

// ======== 完整渲染 ========
function renderGame() {
  if (!gameState) return;
  drawBoard();
  updatePlayerInfo();
  updateStatusBadge();
  updateMoveLog();
}

function updatePlayerInfo() {
  if (!gameState) return;
  const isMyTurn = gameState.isYourTurn;
  const myColor = gameState.yourColor;
  const isOnline = gameMode === 'online';

  el('blackPlayerName').textContent = (myColor === 1)
    ? (isOnline ? playerName : '你')
    : (isOnline ? onlineOpponentName : 'AI');
  el('whitePlayerName').textContent = (myColor === 2)
    ? (isOnline ? playerName : '你')
    : (isOnline ? onlineOpponentName : 'AI');

  el('blackPlayerInfo').classList.toggle('active-turn', gameState.currentTurn === 1 && !gameState.gameOver);
  el('whitePlayerInfo').classList.toggle('active-turn', gameState.currentTurn === 2 && !gameState.gameOver);
  el('blackTurnDot').style.display = (gameState.currentTurn === 1 && !gameState.gameOver) ? 'block' : 'none';
  el('whiteTurnDot').style.display = (gameState.currentTurn === 2 && !gameState.gameOver) ? 'block' : 'none';
}

function updateStatusBadge() {
  if (!gameState) return;
  const badge = el('gameStatusBadge');
  badge.classList.remove('my-turn', 'opponent-turn', 'finished');
  if (gameState.gameOver) {
    badge.classList.add('finished');
    if (gameState.winner === mySocketId || (gameMode === 'ai' && gameState.winner === mySocketId)) {
      badge.innerHTML = '🎉 你贏了！';
    } else if (gameState.winner) {
      badge.innerHTML = '😞 你輸了...';
    } else {
      badge.innerHTML = '🤝 平局';
    }
  } else if (gameState.isYourTurn) {
    badge.classList.add('my-turn');
    badge.innerHTML = '<span class="status-dot pulse"></span> 輪到你了';
  } else {
    badge.classList.add('opponent-turn');
    if (gameMode === 'ai') {
      badge.innerHTML = '🧠 AI 思考中...';
    } else {
      badge.innerHTML = '⏳ 等待對手';
    }
  }
}

function updateMoveLog() {
  if (!gameState) return;
  const log = el('moveLog');
  const history = gameState.moveHistory || [];
  el('moveCount').textContent = history.length || gameState.moveCount || 0;

  if (history.length === 0 && (!gameState.moveCount || gameState.moveCount === 0)) {
    log.innerHTML = '<div class="move-log-empty">暫無落子</div>';
    return;
  }

  // 從伺服器狀態重建落子記錄（伺服器傳回的 moveHistory 包含 playerId, row, col, color）
  let html = '';
  const moves = history.length > 0 ? history : [];
  moves.forEach((move, i) => {
    const isBlack = move.color === 1;
    const stoneClass = isBlack ? 'black' : 'white';
    html += '<div class="move-log-item">';
    html += '<span class="move-log-num">' + (i + 1) + '.</span>';
    html += '<span class="move-log-stone ' + stoneClass + '"></span>';
    html += '<span class="move-log-coord">' + String.fromCharCode(65 + move.col) + (BOARD_SIZE - move.row) + '</span>';
    html += '</div>';
  });
  log.innerHTML = html;
  log.scrollTop = log.scrollHeight;
}

// ======== 懸浮預覽 ========
let hoverPos = null;

boardCanvas.addEventListener('mousemove', (e) => {
  if (!gameState || gameState.gameOver || !gameState.isYourTurn) {
    if (hoverPos) { hoverPos = null; drawBoard(); }
    return;
  }
  const rect = boardCanvas.getBoundingClientRect();
  const scaleX = boardCanvas.width / rect.width;
  const scaleY = boardCanvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  const col = Math.round((mx - PADDING) / CELL_SIZE);
  const row = Math.round((my - PADDING) / CELL_SIZE);
  if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && gameState.board[row][col] === 0) {
    if (!hoverPos || hoverPos.row !== row || hoverPos.col !== col) {
      hoverPos = { row, col };
      drawBoard();
    }
    boardCanvas.style.cursor = 'pointer';
  } else {
    if (hoverPos) { hoverPos = null; drawBoard(); }
    boardCanvas.style.cursor = 'default';
  }
});

boardCanvas.addEventListener('mouseleave', () => {
  hoverPos = null;
  drawBoard();
  boardCanvas.style.cursor = 'default';
});

// ======== Toast 通知 ========
let _toastTimer = null;

function showToast(msg, type) {
  const toast = el('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + (type || '');
  clearTimeout(_toastTimer);
  requestAnimationFrame(() => { toast.classList.add('show'); });
  _toastTimer = setTimeout(() => { toast.classList.remove('show'); }, 2000);
}

// ======== 棋盤點擊 ========
boardCanvas.addEventListener('click', (e) => {
  if (!gameState) return;
  if (gameState.gameOver) return;
  if (!gameState.isYourTurn) {
    showToast(' 還沒輪到你落子', 'warning');
    return;
  }

  const rect = boardCanvas.getBoundingClientRect();
  const scaleX = boardCanvas.width / rect.width;
  const scaleY = boardCanvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  const col = Math.round((mx - PADDING) / CELL_SIZE);
  const row = Math.round((my - PADDING) / CELL_SIZE);

  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
  if (gameState.board[row][col] !== 0) return;

  socket.emit('make_move', { row, col });
  hoverPos = null;

  // 樂觀 UI
  gameState.board[row][col] = gameState.yourColor;
  gameState.isYourTurn = false;
  stoneAnimations.push({ row, col, startTime: performance.now(), color: gameState.yourColor });
  sound.playPlace(gameState.yourColor === 1);
  renderGame();
});

// ======== 聊天更新 ========
function updateChat() {
  const container = el('chatMessages');
  if (chatMessages.length === 0) {
    container.innerHTML = '<div class="chat-empty">暫無消息</div>';
  } else {
    container.innerHTML = chatMessages.map(m =>
      '<div class="chat-msg"><span class="chat-msg-name">' + escapeHtml(m.name) + ': </span><span class="chat-msg-body">' + escapeHtml(m.msg) + '</span></div>'
    ).join('');
    container.scrollTop = container.scrollHeight;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ======== 返回主選單 ========
function backToMenu() {
  stopAnimLoop();
  gameState = null;
  gameMode = null;
  chatMessages = [];
  stoneAnimations = [];
  winLineData = null;
  hoverPos = null;
  showScreen(mainMenu);
  hideResult();
  socket.emit('leave_matchmaking');
}

// ======== Socket.IO 事件 ========
socket.on('connect', () => {
  mySocketId = socket.id;
  connectionStatus.innerHTML = '已連線';
  el('lobbyConnBadge').className = 'badge badge-connected';
  el('lobbyConnBadge').textContent = '已連接';
  el('btnStartMatch').disabled = false;
});

socket.on('disconnect', () => {
  connectionStatus.innerHTML = '已斷線';
  el('lobbyConnBadge').className = 'badge badge-disconnected';
  el('lobbyConnBadge').textContent = '已斷線';
  el('btnStartMatch').disabled = true;
});

// AI 對戰開始
socket.on('ai_game_started', (state) => {
  gameState = state;
  gameMode = 'ai';
  hideResult();
  showScreen(gameScreen);
  el('gameTitle').textContent = '人機對戰';
  el('aiActions').classList.remove('hidden');
  el('onlineActions').classList.add('hidden');
  el('onlineRematchActions').classList.add('hidden');
  el('chatPanel').classList.add('hidden');
  el('onlineBadge').classList.add('hidden');
  chatMessages = [];
  stoneAnimations = [];
  winLineData = null;
  initCanvas();
  renderGame();
  startAnimLoop();
});

// 線上配對狀態
socket.on('matchmaking_status', (data) => {
  if (data.status === 'waiting') {
    showScreen(matchingScreen);
    showCard(el('matchingCard'));
    el('matchingPlayerName').textContent = playerName;
  } else if (data.status === 'cancelled') {
    // 僅在配對畫面時才跳回大廳（避免離開遊戲後被蓋掉）
    if (!matchingScreen.classList.contains('hidden')) {
      showScreen(lobbyScreen);
      showCard(el('lobbyCard'));
    }
  }
});

// 配對成功
socket.on('match_found', (state) => {
  gameState = state;
  gameMode = 'online';
  onlineOpponentName = state.opponentName || '對手';
  hideResult();
  showScreen(gameScreen);
  el('gameTitle').textContent = '線上對戰 vs ' + onlineOpponentName;
  el('aiActions').classList.add('hidden');
  el('onlineActions').classList.remove('hidden');
  el('onlineActions').classList.toggle('hidden', state.gameOver);
  el('onlineRematchActions').classList.add('hidden');
  el('chatPanel').classList.remove('hidden');
  el('onlineBadge').classList.remove('hidden');
  chatMessages = [];
  stoneAnimations = [];
  winLineData = null;
  initCanvas();
  renderGame();
  startAnimLoop();
  updateChat();
});

// 遊戲狀態更新
socket.on('game_state_update', (state) => {
  if (!gameState) return;
  const prevBoard = gameState.board;
  const prevMoveCount = gameState.moveCount || (gameState.moveHistory ? gameState.moveHistory.length : 0);

  gameState = state;
  stoneAnimations = [];
  winLineData = null;

  // 檢查哪個位置新增了棋子
  if (!state.gameOver) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (state.board[r][c] !== 0 && prevBoard[r][c] === 0) {
          stoneAnimations.push({ row: r, col: c, startTime: performance.now(), color: state.board[r][c] });
          sound.playPlace(state.board[r][c] === 1);
        }
      }
    }
  }

  renderGame();

  if (state.gameOver) {
    stopAnimLoop();
    // 找勝利線
    if (state.winner) {
      const lastMove = state.lastMove;
      if (lastMove) {
        const winnerColor = state.board[lastMove.row][lastMove.col];
        winLineData = findWinLine(state.board, lastMove.row, lastMove.col, winnerColor);
      }
    }
    // 重新啟動動畫來顯示發光效果
    startAnimLoop();

    el('onlineActions').classList.add('hidden');
    el('onlineRematchActions').classList.toggle('hidden', gameMode !== 'online');

    const isMyWin = state.winner === mySocketId || (gameMode === 'ai' && state.winner === mySocketId);
    const isDraw = !state.winner;

    setTimeout(() => {
      if (isMyWin) {
        sound.playWin();
        showResult('恭喜你贏了！', '你成功達成五連！', 'win-black', true);
      } else if (isDraw) {
        sound.playDraw();
        showResult('平局！', '棋盤已滿，不分勝負', 'draw-icon', true);
      } else {
        sound.playLose();
        showResult('你輸了...', '對手先達成了五連', 'win-white', true);
      }
    }, 600);
  }
});

// 落子被拒絕
socket.on('move_rejected', (data) => {
  showAlertDialog('落子無效', data.reason || '此位置已有棋子或還沒輪到你', '知道了');
  if (gameMode === 'ai') {
    const diff = el('.diff-btn.active') ? el('.diff-btn.active').dataset.diff : aiDifficulty;
    socket.emit('start_ai_game', { playerName: playerName || '玩家', difficulty: diff });
  }
});

// 對手斷線
socket.on('opponent_disconnected', (data) => {
  stopAnimLoop();
  gameState = null;
  showResult('對手已斷線', data.message, 'win-black', true);
});

// 聊天消息（來自其他玩家，伺服器會轉發）
socket.on('game_chat', (data) => {
  chatMessages.push({ name: data.playerName || '對手', msg: data.message || data.msg });
  updateChat();
});

// ======== 按鈕事件 ========
// 難度選擇
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    aiDifficulty = btn.dataset.diff;
  });
});

// AI 對戰 - 執黑
el('startAiBlack').addEventListener('click', () => {
  const name = el('playerNameInput').value.trim() || '玩家';
  playerName = name;
  aiDifficulty = document.querySelector('.diff-btn.active')?.dataset?.diff || 'medium';
  socket.emit('start_ai_game', { playerName: name, difficulty: aiDifficulty });
});

// AI 對戰 - 執白（讓 AI 先手）
el('startAiWhite').addEventListener('click', () => {
  const name = el('playerNameInput').value.trim() || '玩家';
  playerName = name;
  aiDifficulty = document.querySelector('.diff-btn.active')?.dataset?.diff || 'medium';
  socket.emit('start_ai_game', { playerName: name, difficulty: aiDifficulty });
});

// 進入線上大廳
el('btnEnterLobby').addEventListener('click', () => {
  let name = el('playerNameInput').value.trim();
  if (!name) {
    name = getCookie(COOKIE_NAME);
  }
  if (!name) {
    showToast(' 請先輸入暱稱');
    el('playerNameInput').focus();
    return;
  }
  playerName = name;
  el('playerNameInput').value = name;
  setCookie(COOKIE_NAME, name, COOKIE_DAYS);
  showScreen(lobbyScreen);
  showCard(el('lobbyCard'));
  el('lobbyPlayerName').textContent = name;
  if (socket.connected) {
    el('lobbyConnBadge').className = 'badge badge-connected';
    el('lobbyConnBadge').textContent = '● 已連接';
  }
});

// 開始匹配
el('btnStartMatch').addEventListener('click', () => {
  if (!socket.connected) return;
  showScreen(matchingScreen);
  showCard(el('matchingCard'));
  el('matchingPlayerName').textContent = playerName;
  socket.emit('join_matchmaking', { playerName });
});

// 取消匹配
el('btnCancelMatch').addEventListener('click', () => {
  socket.emit('leave_matchmaking');
  showScreen(lobbyScreen);
  showCard(el('lobbyCard'));
});

// 返回選單（大廳）
el('btnLobbyBack').addEventListener('click', () => {
  showScreen(mainMenu);
});

// 遊戲中返回選單
el('btnBackToMenu2').addEventListener('click', () => {
  if (gameState && !gameState.gameOver) {
    showConfirmDialog('離開遊戲', '確定要離開當前對局嗎？', '離開', '繼續遊戲', () => {
      socket.emit('leave_matchmaking');
      backToMenu();
    });
  } else {
    socket.emit('leave_matchmaking');
    backToMenu();
  }
});

// 重新開始（AI 模式）
el('btnRestart').addEventListener('click', () => {
  hideResult();
  stoneAnimations = [];
  winLineData = null;
  const diff = document.querySelector('.diff-btn.active')?.dataset?.diff || aiDifficulty;
  socket.emit('restart_ai_game', { difficulty: diff });
});

// 換色重開（AI 模式）
el('btnSwapColor').addEventListener('click', () => {
  hideResult();
  stoneAnimations = [];
  winLineData = null;
  const diff = document.querySelector('.diff-btn.active')?.dataset?.diff || aiDifficulty;
  socket.emit('start_ai_game', { playerName: playerName || '玩家', difficulty: diff });
});

// 認輸（線上模式）
el('btnSurrender').addEventListener('click', () => {
  if (!gameState || gameState.gameOver) return;
  showConfirmDialog('認輸', '確定要認輸嗎？', '認輸', '取消', () => {
    socket.emit('surrender');
    // 樂觀 UI：伺服器會回傳 game_state_update 覆蓋
    gameState.gameOver = true;
    gameState.winner = 'opponent';
    stopAnimLoop();
    renderGame();
  });
});

// 再來一局（線上模式）
el('btnRematch').addEventListener('click', () => {
  hideResult();
  stoneAnimations = [];
  winLineData = null;
  if (gameMode === 'online') {
    socket.emit('rematch_request');
    // 如果伺服器不支持 rematch，返回大廳
    backToMenu();
    showScreen(lobbyScreen);
    showCard(el('lobbyCard'));
    el('lobbyPlayerName').textContent = playerName;
  }
});

// 結果彈窗按鈕
el('btnPlayAgain').addEventListener('click', () => {
  hideResult();
  stoneAnimations = [];
  winLineData = null;
  if (gameMode === 'ai') {
    const diff = document.querySelector('.diff-btn.active')?.dataset?.diff || aiDifficulty;
    socket.emit('restart_ai_game', { difficulty: diff });
  } else {
    // 線上模式：嘗試重賽，否則返回大廳
    socket.emit('rematch_request');
    backToMenu();
    showScreen(lobbyScreen);
    showCard(el('lobbyCard'));
    el('lobbyPlayerName').textContent = playerName;
  }
});

el('btnOverlayMenu').addEventListener('click', () => {
  socket.emit('leave_matchmaking');
  backToMenu();
});

// 音效開關
el('btnSoundToggle').addEventListener('click', () => {
  sound.toggle();
});

// 聊天發送
el('btnSendChat').addEventListener('click', sendChat);
el('chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChat();
});

function sendChat() {
  const input = el('chatInput');
  const msg = input.value.trim();
  if (!msg || !gameState || gameMode !== 'online') return;
  const roomId = gameState.roomId;
  if (!roomId) return;
  socket.emit('game_chat', { roomId, message: msg, playerName });
  chatMessages.push({ name: playerName, msg });
  updateChat();
  input.value = '';
}

// ======== 確認彈窗按鈕 ========
el('btnConfirmOk').addEventListener('click', () => {
  hideConfirmDialog();
  if (_confirmCallback) {
    const cb = _confirmCallback;
    _confirmCallback = null;
    cb.onConfirm && cb.onConfirm();
  } else if (_alertCallback) {
    const cb = _alertCallback;
    _alertCallback = null;
    cb();
  }
});

el('btnConfirmCancel').addEventListener('click', () => {
  hideConfirmDialog();
  if (_confirmCallback) {
    const cb = _confirmCallback;
    _confirmCallback = null;
    cb.onCancel && cb.onCancel();
  }
});

// 點擊背景關閉（僅 alert 模式允許）
confirmOverlay.addEventListener('click', (e) => {
  if (e.target === confirmOverlay && _alertCallback) {
    hideConfirmDialog();
    const cb = _alertCallback;
    _alertCallback = null;
    cb();
  }
});

// 結果彈窗點擊背景關閉
resultOverlay.addEventListener('click', (e) => {
  if (e.target === resultOverlay) {
    hideResult();
  }
});

// ======== 響應式棋盤 ========
window.addEventListener('resize', () => {
  if (gameState) {
    initCanvas();
    renderGame();
  }
});

// ======== 載入已儲存的暱稱 ========
(function loadSavedName() {
  const saved = getCookie(COOKIE_NAME);
  if (saved) {
    el('playerNameInput').value = saved;
    el('playerNameInput').style.color = '#c89635';
  }
  initCanvas();
  drawBoard();
})();

// 輸入時即時儲存暱稱
el('playerNameInput').addEventListener('input', () => {
  const val = el('playerNameInput').value.trim();
  if (val) {
    setCookie(COOKIE_NAME, val, COOKIE_DAYS);
    el('playerNameInput').style.color = '';
  }
});

// ======== 選單淡入動畫 ========
setTimeout(() => {
  el('mainMenu').classList.add('visible');
}, 100);
