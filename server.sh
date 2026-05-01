#!/usr/bin/env bash
# Gomoku Server Manager (Linux)
# Usage: ./server.sh [start|stop|restart|status|attach]

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-8080}"
SCREEN_NAME="gomoku-server"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

show_menu() {
  echo ""
  echo "============================================"
  echo -e "      ${YELLOW}Gomoku Server Manager (Linux)${NC}"
  echo "============================================"
  echo ""
  echo "  1. Start Server"
  echo "  2. Stop Server"
  echo "  3. Restart Server"
  echo "  4. Status"
  echo "  5. Attach (view logs)"
  echo "  6. Open Browser"
  echo "  7. Exit"
  echo ""
  echo "============================================"
  read -r -p "Choose (1-7): " choice
  case "$choice" in
    1) start_server ;;
    2) stop_server ;;
    3) restart_server ;;
    4) show_status ;;
    5) attach_screen ;;
    6) open_browser ;;
    7) exit 0 ;;
    *) show_menu ;;
  esac
}

get_lan_ip() {
  hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost"
}

start_server() {
  echo ""
  echo -e "${CYAN}Starting Gomoku server...${NC}"
  
  # Check if already running
  if screen -list | grep -q "$SCREEN_NAME"; then
    echo -e "${YELLOW}Server screen already exists.${NC}"
    echo "  Use 'attach' to view, or 'stop' first to restart."
    read -r -p "  Reattach? (y/n): " ans
    if [ "$ans" = "y" ]; then
      screen -r "$SCREEN_NAME"
    fi
    show_menu
    return
  fi

  # Start in detached screen
  screen -dmS "$SCREEN_NAME" bash -c "cd '$SCRIPT_DIR' && PORT=$PORT node server/index.js"
  sleep 1

  if screen -list | grep -q "$SCREEN_NAME"; then
    LAN_IP=$(get_lan_ip)
    echo -e "${GREEN}Server started in background screen!${NC}"
    echo "  Screen name: $SCREEN_NAME"
    echo "  Local:       http://localhost:$PORT"
    echo "  LAN:         http://$LAN_IP:$PORT"
    echo ""
    echo "  Attach:      ./server.sh attach"
    echo "  Stop:        ./server.sh stop"
  else
    echo -e "${RED}Failed to start server${NC}"
  fi
  read -r -p "Press Enter to continue..."
  show_menu
}

stop_server() {
  echo ""
  echo -e "${CYAN}Stopping Gomoku server...${NC}"

  # Kill process on port
  PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PID" ]; then
    kill "$PID" 2>/dev/null || true
    sleep 1
    kill -9 "$PID" 2>/dev/null || true
    echo "  Killed PID $PID on port $PORT"
  else
    echo -e "${YELLOW}  No process on port $PORT${NC}"
  fi

  # Kill screen session
  if screen -list | grep -q "$SCREEN_NAME"; then
    screen -S "$SCREEN_NAME" -X quit
    echo "  Screen session '$SCREEN_NAME' closed"
  else
    echo -e "${YELLOW}  No screen session found${NC}"
  fi

  echo -e "${GREEN}Done.${NC}"
  read -r -p "Press Enter to continue..."
  show_menu
}

restart_server() {
  echo ""
  echo -e "${CYAN}Restarting Gomoku server...${NC}"

  # Stop
  PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
  [ -n "$PID" ] && kill "$PID" 2>/dev/null && sleep 1
  screen -list | grep -q "$SCREEN_NAME" && screen -S "$SCREEN_NAME" -X quit
  sleep 1

  # Start
  screen -dmS "$SCREEN_NAME" bash -c "cd '$SCRIPT_DIR' && PORT=$PORT node server/index.js"
  sleep 1

  echo -e "${GREEN}Server restarted!${NC}"
  LAN_IP=$(get_lan_ip)
  echo "  Local: http://localhost:$PORT"
  echo "  LAN:   http://$LAN_IP:$PORT"
  read -r -p "Press Enter to continue..."
  show_menu
}

show_status() {
  echo ""
  echo -e "${CYAN}Server Status:${NC}"
  echo ""

  # Check screen
  if screen -list | grep -q "$SCREEN_NAME"; then
    echo -e "  Screen:  ${GREEN}RUNNING${NC} ($SCREEN_NAME)"
  else
    echo -e "  Screen:  ${RED}NOT RUNNING${NC}"
  fi

  # Check port
  if lsof -i :"$PORT" &>/dev/null; then
    PID=$(lsof -ti :"$PORT" 2>/dev/null)
    echo -e "  Port:    ${GREEN}LISTENING${NC} (PID: $PID)"
    LAN_IP=$(get_lan_ip)
    echo "  Local:   http://localhost:$PORT"
    echo "  LAN:     http://$LAN_IP:$PORT"
  else
    echo -e "  Port:    ${RED}NOT LISTENING${NC}"
  fi

  echo ""
  read -r -p "Press Enter to continue..."
  show_menu
}

attach_screen() {
  if screen -list | grep -q "$SCREEN_NAME"; then
    echo "Attaching to screen '$SCREEN_NAME'..."
    echo "Press Ctrl+A then D to detach"
    sleep 1
    screen -r "$SCREEN_NAME"
  else
    echo -e "${RED}No screen session found${NC}"
    read -r -p "Press Enter to continue..."
  fi
  show_menu
}

open_browser() {
  echo "Opening http://localhost:$PORT ..."
  if command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:$PORT" &
  elif command -v open &>/dev/null; then
    open "http://localhost:$PORT"
  else
    echo "Please open http://localhost:$PORT manually"
  fi
  show_menu
}

# Direct command mode
# Usage: ./server.sh [start|stop|restart|status|attach] [port]
if [ $# -gt 0 ]; then
  case "$1" in
    start|stop|restart|status|attach)
      # Optional port override: ./server.sh start 3000
      if [ -n "$2" ]; then PORT="$2"; fi
      case "$1" in
        start)   start_server; exit 0 ;;
        stop)    stop_server; exit 0 ;;
        restart) restart_server; exit 0 ;;
        status)  show_status; exit 0 ;;
        attach)  attach_screen; exit 0 ;;
      esac
      ;;
    *) echo "Usage: $0 [start|stop|restart|status|attach] [port]"; exit 1 ;;
  esac
fi

# Interactive menu
show_menu
