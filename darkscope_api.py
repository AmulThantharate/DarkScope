"""
DarkScope API Server
FastAPI bridge between the Next.js frontend and Python crawler/AI backend.
"""

import os
import hashlib
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import core DarkScope modules
from threat_model import DarkScopeAI
from local_threat_crawler import DarkScopeCrawler

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("darkscope_api")

# ---------------------------------------------------------------------------
# Pydantic models for request/response
# ---------------------------------------------------------------------------

class ScanRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    max_sites: int = Field(default=5, ge=1, le=20)


class UrlScanRequest(BaseModel):
    url: str = Field(..., min_length=5)


class ThreatResultResponse(BaseModel):
    id: str
    url: str
    title: str
    threatScore: int
    riskLevel: str  # critical | high | medium | low
    category: str   # leak | marketplace | forum | database | credential
    timestamp: str
    description: str
    tags: List[str] = []
    aiAnalysis: Optional[Dict] = None


class ScanResponse(BaseModel):
    results: List[ThreatResultResponse]
    totalFound: int
    scanDuration: int
    torActive: bool = False
    mode: str = "live"  # "live" or "demo"


class HealthResponse(BaseModel):
    status: str
    torActive: bool
    aiModels: List[Dict]
    timestamp: str


# ---------------------------------------------------------------------------
# Demo data — used when Tor is not available
# ---------------------------------------------------------------------------
DEMO_RESULTS = [
    {
        "url": "http://exmpl43mhsn7u6uozk.onion/data/breachdb",
        "title": "Credential Dump — Corporate Email List",
        "status": "success",
        "overall_threat_level": "high",
        "analyses": [
            {
                "provider": "openrouter",
                "model": "demo-mode",
                "threat_level": "high",
                "details": {
                    "summary": "Large set of corporate email/password pairs detected. Includes MFA bypass tokens and internal domain credentials.",
                    "threat_level": "high",
                    "leaked_credentials": [{"type": "email", "value": "demo@corp.com", "confidence": 0.92}],
                    "recommendations": ["Reset all affected passwords", "Enable MFA on all accounts"],
                },
            }
        ],
    },
    {
        "url": "http://drkforum7abcd123.onion/thread/4821",
        "title": "Underground Marketplace — Exploit Kits",
        "status": "success",
        "overall_threat_level": "critical",
        "analyses": [
            {
                "provider": "openrouter",
                "model": "demo-mode",
                "threat_level": "critical",
                "details": {
                    "summary": "Active marketplace selling zero-day exploit kits targeting enterprise VPN appliances. Seller has verified reputation.",
                    "threat_level": "critical",
                    "marketplace_listings": [{"item": "VPN Exploit Kit", "price": "$5000"}],
                    "recommendations": ["Patch VPN infrastructure immediately", "Initiate threat hunt"],
                },
            }
        ],
    },
    {
        "url": "http://leakz99xyzwq.onion/dump/2024q1",
        "title": "Database Export — 2.3M User Records",
        "status": "success",
        "overall_threat_level": "high",
        "analyses": [
            {
                "provider": "openrouter",
                "model": "demo-mode",
                "threat_level": "high",
                "details": {
                    "summary": "SQL database dump containing 2.3 million user records with email, hashed passwords, and phone numbers.",
                    "threat_level": "high",
                    "pii_found": ["email", "phone", "hashed_password"],
                    "recommendations": ["Notify affected users", "Check credential reuse"],
                },
            }
        ],
    },
    {
        "url": "http://forum47deep.onion/discuss/cve-2024",
        "title": "Dark Web Forum — CVE Discussion Thread",
        "status": "success",
        "overall_threat_level": "medium",
        "analyses": [
            {
                "provider": "openrouter",
                "model": "demo-mode",
                "threat_level": "medium",
                "details": {
                    "summary": "Forum discussion sharing proof-of-concept code for recent CVEs. Multiple actors discussing weaponization.",
                    "threat_level": "medium",
                    "threat_actors": ["APT_Shadow", "CyberVault99"],
                    "recommendations": ["Monitor CVE advisories", "Apply patches"],
                },
            }
        ],
    },
    {
        "url": "http://cc5shop.onion/batch/usa-2024",
        "title": "Stolen Credit Card Batch — USA",
        "status": "success",
        "overall_threat_level": "critical",
        "analyses": [
            {
                "provider": "openrouter",
                "model": "demo-mode",
                "threat_level": "critical",
                "details": {
                    "summary": "Batch of 15,000 stolen credit cards with CVV and billing data. Cards verified within last 48 hours.",
                    "threat_level": "critical",
                    "financial_data": [{"type": "credit_card", "count": 15000}],
                    "recommendations": ["Report to card networks", "Alert fraud team"],
                },
            }
        ],
    },
    {
        "url": "http://apidump.onion/keys/cloud",
        "title": "Leaked API Keys — Cloud Providers",
        "status": "success",
        "overall_threat_level": "high",
        "analyses": [
            {
                "provider": "openrouter",
                "model": "demo-mode",
                "threat_level": "high",
                "details": {
                    "summary": "Repository containing exposed API keys for AWS, GCP, and Azure. Some keys still active.",
                    "threat_level": "high",
                    "raw_indicators": ["AKIA...", "AIza..."],
                    "recommendations": ["Rotate all exposed keys immediately", "Audit IAM policies"],
                },
            }
        ],
    },
]


# Map Python threat levels → frontend risk levels
THREAT_LEVEL_MAP = {
    "critical": "critical",
    "high": "high",
    "medium": "medium",
    "low": "low",
    "info": "low",
    "unknown": "low",
}

THREAT_SCORE_MAP = {
    "critical": 90,
    "high": 75,
    "medium": 50,
    "low": 25,
    "info": 10,
    "unknown": 5,
}

# Keywords → category inference
CATEGORY_KEYWORDS = {
    "credential": ["credential", "password", "login", "email", "combo", "account"],
    "leak": ["leak", "dump", "exposed", "breach", "api key"],
    "database": ["database", "db", "sql", "records", "export", "user"],
    "marketplace": ["marketplace", "shop", "buy", "sell", "price", "listing", "card"],
    "forum": ["forum", "thread", "discussion", "post", "topic"],
    "bitcoin": ["bitcoin", "btc", "wallet", "address", "transaction"],
}


def infer_category(result: Dict) -> str:
    """Infer threat category from result content."""
    searchable = ""
    # Gather text to search through
    for analysis in result.get("analyses", []):
        details = analysis.get("details", {})
        searchable += " " + details.get("summary", "")
        if details.get("leaked_credentials"):
            return "credential"
        if details.get("marketplace_listings"):
            return "marketplace"
        if details.get("financial_data"):
            return "marketplace"
        if details.get("breach_mentions"):
            return "database"

    searchable += " " + result.get("url", "") + " " + result.get("title", "")
    searchable = searchable.lower()

    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in searchable for kw in keywords):
            return category

    return "leak"  # default


def infer_tags(result: Dict) -> List[str]:
    """Generate tags from result analysis."""
    tags = set()
    level = result.get("overall_threat_level", "unknown")
    if level in ("critical", "high"):
        tags.add("Urgent")

    for analysis in result.get("analyses", []):
        details = analysis.get("details", {})
        if details.get("leaked_credentials"):
            tags.add("Credentials")
        if details.get("financial_data"):
            tags.add("Financial")
        if details.get("pii_found"):
            tags.add("PII")
        if details.get("marketplace_listings"):
            tags.add("Market")
        if details.get("threat_actors"):
            tags.add("APT")
        if details.get("raw_indicators"):
            tags.add("IOC")

    year = str(datetime.now(timezone.utc).year)
    tags.add(year)

    return list(tags)[:4]


def format_timestamp(iso_str: str) -> str:
    """Convert ISO timestamp to relative human-readable string."""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        diff = now - dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else now - dt
        hours = int(diff.total_seconds() / 3600)
        days = hours // 24
        if hours < 1:
            return "Just now"
        elif hours < 24:
            return f"{hours}h ago"
        elif days < 7:
            return f"{days}d ago"
        else:
            return dt.strftime("%b %d")
    except Exception:
        return "Recently"


def crawler_result_to_response(result: Dict, index: int, query: str) -> ThreatResultResponse:
    """Transform a Python crawler result into the frontend ThreatResult shape."""
    level = result.get("overall_threat_level", "unknown")
    risk_level = THREAT_LEVEL_MAP.get(level, "low")

    # Build a threat score with some variance per-result
    base_score = THREAT_SCORE_MAP.get(level, 10)
    seed = int(hashlib.md5(result.get("url", str(index)).encode()).hexdigest()[:8], 16)
    variance = (seed % 10) - 5  # -5 to +4
    threat_score = max(1, min(99, base_score + variance))

    # Pick the best summary from AI analyses
    description = "No analysis available"
    ai_analysis = None
    for analysis in result.get("analyses", []):
        details = analysis.get("details", {})
        if details.get("summary"):
            description = details["summary"]
            ai_analysis = details
            break

    category = infer_category(result)
    tags = infer_tags(result)
    timestamp_str = format_timestamp(result.get("timestamp", datetime.now(timezone.utc).isoformat()))

    # Generate stable ID
    result_id = f"ds-{hashlib.sha256((result.get('url', '') + query).encode()).hexdigest()[:12]}"

    return ThreatResultResponse(
        id=result_id,
        url=result.get("url", "unknown"),
        title=result.get("title", "Untitled") if result.get("title") else "Dark Web Content",
        threatScore=threat_score,
        riskLevel=risk_level,
        category=category,
        timestamp=timestamp_str,
        description=description,
        tags=tags,
        aiAnalysis=ai_analysis,
    )


# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------
crawler: Optional[DarkScopeCrawler] = None
tor_available: bool = False


def init_crawler() -> DarkScopeCrawler:
    """Initialize the DarkScope crawler with configured AI models."""
    api_key = os.getenv("OPENROUTER_API_KEY")

    ai_configs = [
        {
            "provider": "openrouter",
            "model": "google/gemini-2.0-flash-exp:free",
            "api_key": api_key,
        },
        {
            "provider": "openrouter",
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "api_key": api_key,
        },
    ]

    return DarkScopeCrawler(ai_configs=ai_configs)


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global crawler, tor_available
    logger.info("🚀 Starting DarkScope API server...")

    # Try loading .env if python-dotenv is available
    try:
        from dotenv import load_dotenv
        load_dotenv()
        logger.info("📄 Loaded .env file")
    except ImportError:
        pass

    crawler = init_crawler()

    # Check Tor
    try:
        tor_available = crawler.check_tor()
    except Exception:
        tor_available = False

    if tor_available:
        logger.info("🟢 Tor is active — live crawling enabled")
    else:
        logger.warning("🟡 Tor not available — demo mode will be used for dark web queries")

    yield

    logger.info("🛑 DarkScope API shutting down")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="DarkScope API",
    description="Dark web threat intelligence API — bridge between Python crawler and Next.js frontend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with Tor and AI model status."""
    global crawler, tor_available

    models = []
    if crawler:
        for ai in crawler.ai_models:
            models.append({
                "provider": ai.provider,
                "model": ai.model_name,
                "active": ai.use_ai,
            })

    return HealthResponse(
        status="online",
        torActive=tor_available,
        aiModels=models,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/api/scan", response_model=ScanResponse)
async def scan_query(query: str = Query(..., min_length=1)):
    """
    Scan the dark web for threats matching the query.
    Falls back to demo mode if Tor is not available.
    """
    global crawler, tor_available
    start_time = time.time()

    if not crawler:
        crawler = init_crawler()

    if tor_available:
        # --- LIVE MODE ---
        logger.info(f"🔍 Live scan: '{query}'")
        try:
            # Reset previous results
            crawler.threat_intel = []

            # Search for .onion sites
            search_results = crawler.search_onion(query, max_results=5)
            logger.info(f"📋 Found {len(search_results)} sites for '{query}'")

            if not search_results:
                # No results from search, return empty
                return ScanResponse(
                    results=[],
                    totalFound=0,
                    scanDuration=int((time.time() - start_time) * 1000),
                    torActive=True,
                    mode="live",
                )

            # Crawl and analyze each site
            for i, res in enumerate(search_results):
                url = res.get("link", "")
                title = res.get("title", "Untitled")
                logger.info(f"  [{i+1}/{len(search_results)}] Crawling: {title}")
                crawler.crawl_and_analyze(url, title)
                time.sleep(1)  # Rate limit

            # Transform results
            results = []
            for idx, r in enumerate(crawler.threat_intel):
                # Preserve the title from search results if available
                if idx < len(search_results):
                    r["title"] = search_results[idx].get("title", r.get("title", ""))
                results.append(crawler_result_to_response(r, idx, query))

            # Sort by threat score descending
            results.sort(key=lambda x: x.threatScore, reverse=True)

            return ScanResponse(
                results=results,
                totalFound=len(results),
                scanDuration=int((time.time() - start_time) * 1000),
                torActive=True,
                mode="live",
            )

        except Exception as e:
            logger.error(f"❌ Live scan failed: {e}")
            # Fall through to demo mode
            logger.info("⚡ Falling back to demo mode")

    # --- DEMO MODE ---
    logger.info(f"🎭 Demo scan: '{query}'")

    # Filter demo results by query relevance (simple keyword match)
    query_lower = query.lower()
    relevant = []
    for demo in DEMO_RESULTS:
        searchable = (demo.get("title", "") + " " + demo.get("url", "")).lower()
        for a in demo.get("analyses", []):
            searchable += " " + a.get("details", {}).get("summary", "").lower()
        # Include if any query word matches, or include all if generic query
        query_words = query_lower.split()
        if any(word in searchable for word in query_words) or len(query_words) <= 1:
            relevant.append(demo)

    # Ensure at least 3 results
    if len(relevant) < 3:
        relevant = DEMO_RESULTS[:5]

    results = [crawler_result_to_response(r, i, query) for i, r in enumerate(relevant)]
    results.sort(key=lambda x: x.threatScore, reverse=True)

    # Simulate some processing time for realism
    elapsed = time.time() - start_time
    if elapsed < 1.5:
        time.sleep(1.5 - elapsed)

    return ScanResponse(
        results=results,
        totalFound=len(results),
        scanDuration=int((time.time() - start_time) * 1000),
        torActive=False,
        mode="demo",
    )


@app.post("/api/scan/url", response_model=ScanResponse)
async def scan_single_url(request: UrlScanRequest):
    """Scan a single URL directly."""
    global crawler, tor_available
    start_time = time.time()

    if not crawler:
        crawler = init_crawler()

    if not tor_available:
        raise HTTPException(
            status_code=503,
            detail="Tor is not available. Cannot crawl .onion URLs without Tor.",
        )

    try:
        crawler.threat_intel = []
        crawler.crawl_and_analyze(request.url, "Direct Analysis")

        results = [crawler_result_to_response(r, 0, request.url) for r in crawler.threat_intel]

        return ScanResponse(
            results=results,
            totalFound=len(results),
            scanDuration=int((time.time() - start_time) * 1000),
            torActive=True,
            mode="live",
        )
    except Exception as e:
        logger.error(f"❌ URL scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models")
async def list_models():
    """List available OpenRouter models."""
    import requests as req

    try:
        response = req.get("https://openrouter.ai/api/v1/models", timeout=10)
        if response.status_code == 200:
            models = response.json().get("data", [])
            free_models = [m for m in models if ":free" in m.get("id", "")]
            return {
                "total": len(free_models),
                "models": [{"id": m["id"], "name": m.get("name", "N/A")} for m in free_models],
            }
        return {"error": f"OpenRouter returned {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("DARKSCOPE_API_PORT", "8000"))
    logger.info(f"🌐 Starting DarkScope API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
