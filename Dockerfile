# 五子棋線上對戰 - Dockerfile
FROM node:20-alpine

# 建立 app 目錄
WORKDIR /app

# 複製依賴檔案
COPY package.json ./

# 安裝依賴
RUN npm install --production

# 複製原始碼
COPY server/ ./server/
COPY public/ ./public/

# 暴露連接埠
EXPOSE 8080

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# 啟動
CMD ["node", "server/index.js"]
