# 五子棋線上對戰平台

## 🎮 功能特色

- **🤖 AI 對戰**: 三種難度（簡單/中等/困難），使用啟發式評分演算法
- **🌐 線上配對**: 全球跨地區玩家即時配對對戰
- **📡 即時通訊**: 基於 WebSocket (Socket.IO) 的即時遊戲同步
- **🐳 Docker 部署**: 一鍵容器化部署
- **☁️ Cloudflare Tunnel**: 無需公網 IP，穿透內網

## 🚀 快速啟動

### 方式一：Docker (推薦)

```bash
# 1. 進入專案目錄
cd gomoku

# 2. 啟動遊戲伺服器
docker compose up -d

# 3. 開啟瀏覽器
# http://localhost:8080
```

### 方式二：直接執行

```bash
# 1. 安裝依賴
npm install

# 2. 啟動伺服器
npm start

# 3. 開啟 http://localhost:8080
```

## ☁️ 設定 Cloudflare Tunnel (跨地區連線)

### 步驟 1：建立 Cloudflare Tunnel

1. 註冊/登入 [Cloudflare](https://dash.cloudflare.com/)
2. 到 **Zero Trust** → **Networks** → **Tunnels**
3. 點擊 **Create a tunnel**
4. 選擇 **Cloudflared**
5. 命名 tunnel (例如: `gomoku-tunnel`)
6. 複製 tunnel token

### 步驟 2：設定環境變數

```bash
# 複製範本
cp .env.example .env

# 編輯 .env，貼上 tunnel token
# CF_TUNNEL_TOKEN=你的token
```

### 步驟 3：設定 Public Hostname

在 Cloudflare Tunnel 設定中：
- **Subdomain**: `gomoku` (或其他)
- **Domain**: 你的 Cloudflare 域名
- **Service**: `http://localhost:8080`

### 步驟 4：啟動含 Tunnel 的服務

```bash
# Windows PowerShell:
$env:CF_TUNNEL_TOKEN="你的token"
docker compose --profile tunnel up -d

# 或者直接寫入 .env 後:
docker compose --profile tunnel up -d
```

## 📁 專案結構

```
gomoku/
├── server/
│   ├── index.js      # Express + Socket.IO 伺服器
│   ├── game.js       # 五子棋遊戲邏輯
│   └── ai.js         # AI 對手演算法
├── public/
│   ├── index.html    # 前端頁面
│   ├── css/style.css # 樣式
│   └── js/game.js    # 前端互動 & Canvas 繪圖
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## 🛠️ 技術棧

| 層級 | 技術 |
|------|------|
| 後端 | Node.js, Express, Socket.IO |
| 前端 | HTML5 Canvas, Vanilla JS |
| AI | 啟發式位置評分 (Heuristic Evaluation) |
| 部署 | Docker, Docker Compose |
| 穿透 | Cloudflare Tunnel |
