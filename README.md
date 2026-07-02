# 🛡️ DarkScope AI

**Dark Web Threat Intelligence Platform**  
A production-ready system for monitoring, scanning, and analyzing cyber threats across the dark web in real-time. DarkScope combines active `.onion` crawling through Tor with advanced AI threat classification to visualize risks on a beautiful, interactive dashboard.

---

## ✨ Features

- **🧅 Live Tor Crawling**: Searches across verified working dark web search engines (Ahmia, OnionLand, Excavator) through a local Tor SOCKS5 proxy to discover `.onion` hidden services. Dead engines are commented out and logged for easy re-checking.
- **🤖 AI-Powered Threat Analysis**: Integrates with OpenRouter (using Gemini 2.0 / Llama 3.1 free-tier models) to intelligently analyze scraped text and classify threats.
- **🎯 Smart Categorization**: Automatically detects leaks, databases, credential dumps, zero-day exploits, marketplace listings, and more.
- **📊 Cyberpunk Dashboard**: A stunning, next-generation Next.js UI featuring filtering, risk-levels (Critical/High/Medium/Low), and real-time scanning indicators.
- **🔌 FastAPI Backend Bridge**: Fully decoupled Python reconnaissance engine from the Next.js frontend via an asynchronous REST API.
- **🎭 Demo Mode**: Automatically falls back to high-quality mock data when Tor is unavailable so the UI remains testable.
- **📋 Engine Health Logging**: Per-engine status logging with redirect handling so you always know which search engines are alive.

## 🏗️ Architecture

DarkScope uses a two-tier architecture:

1. **Python / FastAPI Backend** (`:8000`): Runs the `DarkScopeCrawler` which routes traffic through a local Tor SOCKS5 proxy (`socks5h://127.0.0.1:9050`). It scrapes raw HTML, cleans it, and feeds it into the `DarkScopeAI` module for processing via OpenRouter. When Tor is unavailable, the API gracefully falls back to demo mode.
2. **Next.js Frontend** (`:3000`): A React-based web application with modern aesthetics (Tailwind CSS, Radix UI, Framer Motion) that consumes the FastAPI endpoints and provides a user-friendly interface for threat analysts.

### Search Engine Status

Dark web search engines frequently go offline. The current verified working engines (as of 2026-04-15) are:

| Engine | Status | Notes |
|--------|--------|-------|
| **Ahmia** | ✅ Working | Safety-first, curated indexing. Also available via clearnet at `ahmia.fi`. |
| **OnionLand** | ✅ Working | Hybrid directory + search with category browsing. |
| **Excavator** | ✅ Working | Unfiltered onion crawler with broad coverage. |

Previously listed but currently unreachable engines are kept as commented entries in `local_threat_crawler.py` for future re-checking.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **Tor Service** running locally on port `9050` (required for live crawling; demo mode works without it)
- **OpenRouter API Key** (Get yours at [OpenRouter](https://openrouter.ai/keys))

#### Installing Tor

```bash
# Debian/Ubuntu
sudo apt install tor && sudo systemctl start tor

# Arch Linux
sudo pacman -S tor && sudo systemctl start tor

# macOS (Homebrew)
brew install tor && brew services start tor
```

Verify Tor is running: `systemctl is-active tor` or `pgrep -x tor`.

### Installation & Deployment

DarkScope supports multiple deployment strategies to fit your infrastructure:

#### 1. Local Development (Native)
Run the system directly on your host using our unified startup script.

```bash
git clone https://github.com/AmulThantharate/DarkScope.git
cd DarkScope
cp .env.example .env # Add your OPENROUTER_API_KEY
python3 -m venv ven && source ven/bin/activate
pip install -r requirements.txt
npm install
./start.sh
```

#### 2. Docker Compose
Deploy instantly using pre-configured, isolated containers for the Tor proxy, FastAPI backend, and Next.js frontend.

```bash
git clone https://github.com/AmulThantharate/DarkScope.git
cd DarkScope
# Edit docker-compose.yml to insert your OPENROUTER_API_KEY
docker compose up -d --build
```
Access the dashboard at `http://localhost:3000`.

#### 3. Enterprise Native Deployment (Ansible)
Deploy a production-ready native stack featuring robust `systemd` services and an Nginx reverse proxy with self-signed SSL on domain `site.local`.

```bash
# Ensure you have ansible installed
ansible-playbook -i localhost, -c local ansible.yml
```

#### 4. Kubernetes (K8s)
Scale horizontally on any Kubernetes cluster. Standardized manifests are located in the `k8s/` directory.

```bash
# First, build your local images
docker build -t darkscope-backend:latest -f Dockerfile.backend .
docker build -t darkscope-frontend:latest -f Dockerfile.frontend .

# Create a secret for your API key
kubectl create secret generic darkscope-secrets --from-literal=openrouter_api_key="YOUR_KEY"

# Apply the unified deployment manifest
kubectl apply -f k8s/darkscope.yaml
```

## ⚙️ Configuration (.env)

| Variable                     | Description                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY`         | Your OpenRouter API key for LLM-based threat analysis. Without this, only regex-based heuristics will run. |
| `DARKSCOPE_API_PORT`         | Port for the FastAPI server (Default: `8000`).                                                             |
| `NEXT_PUBLIC_PYTHON_API_URL` | URL format for the frontend to reach the backend (Default: `http://localhost:8000`).                       |

## 🛡️ Security & Disclaimer

> [!WARNING]
> **For Educational and Authorized Use Only.**
> DarkScope interacts directly with the live dark web. Ensure you are using it within a secure, isolated environment (such as a VM) and routing all traffic exclusively through Tor. The creators hold no liability for misuse, accidental data exposure, or legal repercussions resulting from executing this software.

## 🔧 Troubleshooting

### Connection errors to `.onion` addresses

If you see `Host unreachable` or `Connection timeout` errors for `.onion` search engines, the engines are likely offline (common in the dark web). Check the `SEARCH_ENGINES` list in `local_threat_crawler.py` — working engines are active, dead ones are commented out.

### Tor not detected

Ensure Tor is running on port `9050`:
```bash
systemctl is-active tor      # Should show "active"
curl --socks5-hostname 127.0.0.1:9050 http://httpbin.org/ip  # Should return a Tor exit IP
```

### No results returned

Some search queries may return zero results from certain engines. Try different keywords or check the logs for engine status indicators (`✅`, `⚠️`, `❌`).

## 📜 License

This project is released under the [MIT License](LICENSE).
