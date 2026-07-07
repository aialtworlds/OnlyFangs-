#!/bin/bash

# ═══════════════════════════════════════════════════════════
# Dev Server Health Check & Auto-Restart Monitor
# ═══════════════════════════════════════════════════════════

set -e

PROJECT_DIR="/home/ubuntu/only-fangs"
LOG_FILE="/home/ubuntu/.manus-logs/dev-server-monitor.log"
PID_FILE="/tmp/dev-server-monitor.pid"
PORT=3000
CHECK_INTERVAL=30
MAX_RETRIES=3
RESTART_COOLDOWN=10

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Function to check if server is responding
check_server_health() {
    if timeout 5 curl -s http://localhost:$PORT/health >/dev/null 2>&1; then
        return 0
    elif timeout 5 nc -z localhost $PORT >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check if dev server process is running
check_process_running() {
    if pgrep -f "tsx watch server/_core/index.ts" >/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to restart the server
restart_server() {
    log_message "⚠️  Server health check failed. Attempting restart..."
    
    # Kill existing processes
    pkill -f "tsx watch server/_core/index.ts" 2>/dev/null || true
    sleep 2
    
    # Start new server
    cd "$PROJECT_DIR"
    log_message "Starting dev server..."
    NODE_ENV=development nohup pnpm run dev > /tmp/dev-server.log 2>&1 &
    
    # Wait for server to start
    sleep $RESTART_COOLDOWN
    
    # Verify restart
    if check_server_health; then
        log_message "✅ Server restarted successfully"
        return 0
    else
        log_message "❌ Server restart failed - still not responding"
        return 1
    fi
}

# Function to cleanup on exit
cleanup() {
    log_message "Monitor stopped"
    rm -f "$PID_FILE"
}

# Set trap for cleanup
trap cleanup EXIT

# Save monitor PID
echo $$ > "$PID_FILE"

log_message "🚀 Dev Server Monitor Started (PID: $$)"
log_message "Monitoring port $PORT with ${CHECK_INTERVAL}s interval"

# Main monitoring loop
consecutive_failures=0

while true; do
    if check_process_running; then
        if check_server_health; then
            # Server is healthy
            if [ $consecutive_failures -gt 0 ]; then
                log_message "✅ Server recovered - health check passed"
            fi
            consecutive_failures=0
        else
            # Process running but not responding
            consecutive_failures=$((consecutive_failures + 1))
            log_message "⚠️  Health check failed ($consecutive_failures/$MAX_RETRIES)"
            
            if [ $consecutive_failures -ge $MAX_RETRIES ]; then
                restart_server
                consecutive_failures=0
            fi
        fi
    else
        # Process not running
        consecutive_failures=$((consecutive_failures + 1))
        log_message "⚠️  Dev server process not running ($consecutive_failures/$MAX_RETRIES)"
        
        if [ $consecutive_failures -ge $MAX_RETRIES ]; then
            restart_server
            consecutive_failures=0
        fi
    fi
    
    sleep $CHECK_INTERVAL
done
