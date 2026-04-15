#!/bin/bash

# Kill all background processes started by this script on exit
trap 'kill 0' SIGINT SIGTERM

echo "🚀 Starting DarkScope AI System..."
echo "====================================="

# Check if port 8000 (Python API) or 3000 (Next.js) are already in use
if lsof -Ti :8000 > /dev/null; then
    echo "⚠️  Port 8000 is already in use. Stopping existing process..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
fi

if lsof -Ti :3000 > /dev/null; then
    echo "⚠️  Port 3000 is already in use. Stopping existing process..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

# 1. Start Python API Server in the background using the virtual environment
echo "🐍 Starting Python FastAPI server (Port 8000)..."
source ./ven/bin/activate
python darkscope_api.py &
API_PID=$!

# Add a small delay to let the API initialize
sleep 2

# 2. Start Next.js Frontend
echo "⚛️  Starting Next.js frontend (Port 3000)..."
# Setup Node.js environment (fnm)
export PATH="$HOME/.local/share/fnm:$PATH"
if command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env)"
fi

npx next dev --port 3000 &
NEXT_PID=$!

echo "====================================="
echo "✅ System is running!"
echo "➡️  Dashboard: http://localhost:3000"
echo "➡️  API Health: http://localhost:8000/api/health"
echo "Press Ctrl+C to stop both servers."
echo "====================================="

# Wait for background processes
wait $API_PID $NEXT_PID
