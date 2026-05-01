# 五子棋 Gomoku — 線上對戰平台

暗木金主題 · AI 對戰 · 跨地區 PvP · Canvas 棋盤 · WebSocket 即時同步

---

## 功能

| 模式 | 說明 |
|------|------|
| 🤖 **AI 對戰** | 三種難度（簡單/中等/困難），啟發式位置評分 |
| 🌐 **線上 PvP** | 即時配對，與全球玩家對弈 |
| 💬 **對局聊天** | 遊戲內文字聊天 |
| 🏳️ **認輸** | 線上對戰中可隨時認輸 |
| 🔊 **音效** | Web Audio API 落子 / 勝負音效 |
| 🍪 **暱稱記憶** | Cookie 記住你的暱稱，不用重複輸入 |

---

## 快速啟動

### 需求

- Node.js 18+
- npm

### 安裝

```bash
git clone https://github.com/TonyLCH/gomoku.git
cd gomoku
npm install
```

### 啟動

```bash
# 直接啟動
npm start
# → http://localhost:8080

# 或使用管理腳本
./server.sh start        # Linux / macOS
server.bat               # Windows (雙擊)
```

### 管理腳本

```bash
# Linux (screen 背景執行)
./server.sh start        # 啟動
./server.sh stop         # 停止
./server.sh restart      # 重啟
./server.sh status       # 狀態
./server.sh attach       # 查看 log (Ctrl+A D 離開)
./server.sh start 3000   # 自訂 port

# Windows
server.bat               # 互動選單
```

---

## Docker 部署

```bash
docker compose up -d
# → http://localhost:8080
```

### Cloudflare Tunnel（跨地區連線，免公網 IP）

```bash
cp .env.example .env
# 編輯 .env 填入 CF_TUNNEL_TOKEN
docker compose --profile tunnel up -d
```

---

## 手機連線

確保手機和伺服器在同一 WiFi：

```bash
# 啟動後終端機會顯示 LAN IP
./server.sh start
# → 手機: http://192.168.x.x:8080
```

或用 Cloudflare Tunnel 透過域名從任何地方連線。

---

## 專案結構

```
gomoku/
├── server/
│   ├── index.js      # Express + Socket.IO 伺服器
│   ├── game.js       # 五子棋遊戲邏輯
│   └── ai.js         # AI 啟發式演算法
├── public/
│   ├── index.html    # 前端頁面
│   ├── css/style.css # 暗木金主題樣式
│   └── js/game.js    # Canvas 棋盤 + 音效 + WebSocket
├── server.sh         # Linux 管理腳本
├── server.bat        # Windows 管理腳本
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 技術

| 層級 | 技術 |
|------|------|
| 後端 | Node.js · Express · Socket.IO |
| 前端 | HTML5 Canvas · Vanilla JS · CSS |
| AI | 啟發式評分 (Heuristic Evaluation) |
| 部署 | Docker · Cloudflare Tunnel |
| 管理 | screen · bash · batch |
