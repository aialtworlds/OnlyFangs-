# Dev Server Monitoring Setup

## Overview

This document describes how to set up automatic monitoring and health checks for the Only Fangs development server.

## Components

### 1. Monitor Script
**Location:** `scripts/monitor-dev-server.sh`

The monitoring script:
- Checks server health every 30 seconds
- Verifies if the dev server process is running
- Checks if port 3000 is responding to requests
- Automatically restarts the server if it becomes unresponsive
- Logs all events to `/home/ubuntu/.manus-logs/dev-server-monitor.log`

**Features:**
- 3 consecutive failures before restart (prevents flapping)
- 10-second cooldown after restart
- Graceful process cleanup
- Detailed logging with timestamps

### 2. Systemd Service
**Location:** `scripts/dev-server-monitor.service`

The systemd service file enables:
- Automatic startup on system boot
- Automatic restart if monitor crashes
- Integration with system logging (journalctl)
- Clean process management

## Installation

### Option A: Manual Startup (Development)

```bash
# Start the monitor manually
/home/ubuntu/only-fangs/scripts/monitor-dev-server.sh &

# Check logs
tail -f /home/ubuntu/.manus-logs/dev-server-monitor.log
```

### Option B: Systemd Service (Production)

```bash
# Copy service file to systemd directory
sudo cp /home/ubuntu/only-fangs/scripts/dev-server-monitor.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start the service
sudo systemctl enable dev-server-monitor.service
sudo systemctl start dev-server-monitor.service

# Check status
sudo systemctl status dev-server-monitor.service

# View logs
sudo journalctl -u dev-server-monitor.service -f
```

## Monitoring

### Check Monitor Status
```bash
# View recent logs
tail -50 /home/ubuntu/.manus-logs/dev-server-monitor.log

# Check if monitor is running
ps aux | grep monitor-dev-server.sh

# Check dev server status
curl http://localhost:3000/health || echo "Server not responding"
```

### View Systemd Logs
```bash
# Real-time logs
sudo journalctl -u dev-server-monitor.service -f

# Last 100 lines
sudo journalctl -u dev-server-monitor.service -n 100

# Since last boot
sudo journalctl -u dev-server-monitor.service -b
```

## Configuration

To customize monitoring behavior, edit `scripts/monitor-dev-server.sh`:

```bash
PORT=3000                    # Port to monitor
CHECK_INTERVAL=30            # Seconds between checks
MAX_RETRIES=3                # Failures before restart
RESTART_COOLDOWN=10          # Seconds to wait after restart
```

## Troubleshooting

### Monitor not starting
```bash
# Check if script is executable
ls -la /home/ubuntu/only-fangs/scripts/monitor-dev-server.sh

# Make executable if needed
chmod +x /home/ubuntu/only-fangs/scripts/monitor-dev-server.sh
```

### Systemd service issues
```bash
# Check service status
sudo systemctl status dev-server-monitor.service

# View error logs
sudo journalctl -u dev-server-monitor.service -e

# Restart service
sudo systemctl restart dev-server-monitor.service
```

### Server keeps restarting
1. Check `/home/ubuntu/.manus-logs/dev-server-monitor.log` for error patterns
2. Check `/tmp/dev-server.log` for server startup errors
3. Verify port 3000 is available: `netstat -tlnp | grep 3000`
4. Check disk space: `df -h`
5. Check memory: `free -h`

## Log Locations

- **Monitor logs:** `/home/ubuntu/.manus-logs/dev-server-monitor.log`
- **Dev server logs:** `/tmp/dev-server.log`
- **Systemd logs:** `journalctl -u dev-server-monitor.service`

## Health Check Endpoint

The monitor checks the following in order:
1. HTTP GET to `http://localhost:3000/health` (if available)
2. TCP connection to port 3000
3. Process check for `tsx watch server/_core/index.ts`

## Disabling Monitoring

### Stop Manual Monitor
```bash
pkill -f monitor-dev-server.sh
```

### Disable Systemd Service
```bash
sudo systemctl stop dev-server-monitor.service
sudo systemctl disable dev-server-monitor.service
```

## Next Steps

1. Choose installation method (manual or systemd)
2. Follow installation instructions above
3. Monitor logs to verify it's working
4. Adjust configuration if needed
