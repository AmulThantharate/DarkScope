import requests
import re
import json
import hashlib
import time
import os
import random
from datetime import datetime
from bs4 import BeautifulSoup
from collections import defaultdict
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor, as_completed
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import warnings
import threading
warnings.filterwarnings("ignore")

# Import DarkScope AI model
from threat_model import DarkScopeAI

import logging
from urllib.parse import urlparse

# Define a list of rotating user agents.
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:137.0) Gecko/20100101 Firefox/137.0",
    "Mozilla/5.0 (X11; Linux i686; rv:137.0) Gecko/20100101 Firefox/137.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.3179.54",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.3179.54"
]

MAX_DOWNLOAD_BYTES = 1_000_000
MAX_EXTRACTED_TEXT_CHARS = 50_000
MAX_RETURN_CHARS = 5_000 # Increased for better AI analysis
ALLOWED_CONTENT_TYPES = ("text/html", "application/xhtml+xml", "text/plain")
_thread_local = threading.local()
_logger = logging.getLogger(__name__)

SEARCH_ENGINES = [
    # Verified working (tested 2026-04-15)
    {"name": "Ahmia", "url": "http://juhanurmihxlp77nkq76byazcldy2hlmovfu2epvl5ankdibsot4csyd.onion/search/?q={query}"},
    {"name": "OnionLand", "url": "http://3bbad7fauom4d6sgppalyqddsqbf5u5p56b5k5uk2zxsy3d6ey2jobad.onion/search?q={query}"},
    {"name": "Excavator", "url": "http://2fd6cemt4gmccflhm6imvdfvli3nf7zn6rfrwpsy7uhxrgbypvwf5fad.onion/search?query={query}"},
    # Previously listed but currently unreachable (kept for future re-check)
    # {"name": "Kaizer", "url": "http://kaizerwfvp5gxu6cppibp7jhcqptavq3iqef66wbxenh6a2fklibdvid.onion/search?q={query}"},
    # {"name": "Anima", "url": "http://anima4ffe27xmakwnseih3ic2y7y3l6e7fucwk4oerdn4odf7k74tbid.onion/search?q={query}"},
    # {"name": "Tornado", "url": "http://tornadoxn3viscgz647shlysdy7ea5zqzwda7hierekeuokh5eh5b3qd.onion/search?q={query}"},
    # {"name": "TorNet", "url": "http://tornetupfu7gcgidt33ftnungxzyfq2pygui5qdoyss34xbgx2qruzid.onion/search?q={query}"},
    # {"name": "Torgle", "url": "http://iy3544gmoeclh5de6gez2256v6pjh4omhpqdh2wpeeppjtvqmjhkfwad.onion/torgle/?query={query}"},
    # {"name": "Amnesia", "url": "http://amnesia7u5odx5xbwtpnqk3edybgud5bmiagu75bnqx2crntw5kry7ad.onion/search?query={query}"},
    # {"name": "Torland", "url": "http://torlbmqwtudkorme6prgfpmsnile7ug2zm4u3ejpcncxuhpu4k2j4kyd.onion/index.php?a=search&q={query}"},
    # {"name": "Find Tor", "url": "http://findtorroveq5wdnipkaojfpqulxnkhblymc7aramjzajcvpptd4rjqd.onion/search?q={query}"},
    # {"name": "Onionway", "url": "http://oniwayzz74cv2puhsgx4dpjwieww4wdphsydqvf5q7eyz4myjvyw26ad.onion/search.php?s={query}"},
    # {"name": "Tor66", "url": "http://tor66sewebgixwhcqfnp5inzp5x5uohhdy3kvtnyfxc2e5mxiuh34iid.onion/search?q={query}"},
    # {"name": "OSS", "url": "http://3fzh7yuupdfyjhwt3ugzqqof6ulbcl27ecev33knxe3u7goi3vfn2qqd.onion/oss/index.php?search={query}"},
    # {"name": "Torgol", "url": "http://torgolnpeouim56dykfob6jh5r2ps2j73enc42s2um4ufob3ny4fcdyd.onion/?q={query}"},
    # {"name": "The Deep Searches", "url": "http://searchgf7gdtauh7bhnbyed4ivxqmuoat3nm6zfrg3ymkq6mtnpye3ad.onion/search?q={query}"},
]

class DarkScopeCrawler:
    """Dark web crawler with AI threat detection (Multi-AI)"""
    
    def __init__(self, ai_configs: List[Dict]):
        """Initialize crawler with multiple AI configurations"""
        
        # Tor proxy
        proxy_url = os.environ.get("TOR_PROXY_URL", "socks5h://127.0.0.1:9050")
        self.proxies = {
            "http": proxy_url,
            "https": proxy_url
        }
        
        # Initialize AI models
        self.ai_models = []
        for config in ai_configs:
            model = DarkScopeAI(
                api_key=config.get('api_key'),
                model_name=config.get('model'),
                provider=config.get('provider')
            )
            self.ai_models.append(model)
        
        # Local storage
        self.discovered_urls = set()
        self.threat_intel = []
        
        # Rate limiting
        self.request_delay = 3
    
    def _build_session(self, use_tor=False):
        session = requests.Session()
        retry = Retry(
            total=3,
            read=3,
            connect=3,
            backoff_factor=0.3,
            status_forcelist=[500, 502, 503, 504],
            allowed_methods=frozenset(["GET", "HEAD"]),
            respect_retry_after_header=True,
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retry, pool_connections=20, pool_maxsize=20)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        if use_tor:
            session.proxies = self.proxies

        return session

    def _get_session(self, use_tor=False):
        key = "tor_session" if use_tor else "direct_session"
        if not hasattr(_thread_local, key):
            setattr(_thread_local, key, self._build_session(use_tor=use_tor))
        return getattr(_thread_local, key)

    def get_tor_session(self):
        """Creates a requests Session with Tor SOCKS proxy and automatic retries."""
        return self._build_session(use_tor=True)

    def scrape_single(self, url: str, title: str = "Untitled"):
        """Scrapes a single URL using a robust session."""
        if not url:
            return url, title

        parsed_url = urlparse(url)
        if parsed_url.scheme not in ("http", "https"):
            return url, title

        use_tor = (parsed_url.hostname or "").lower().endswith(".onion")

        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        }

        response = None
        try:
            session = self._get_session(use_tor=use_tor)
            # Increased timeout for Tor latency
            timeout = (10, 45) if use_tor else (5, 25)
            response = session.get(url, headers=headers, timeout=timeout, stream=True)

            if response.status_code == 200:
                content_type = (response.headers.get("Content-Type") or "").lower()
                if content_type and not any(t in content_type for t in ALLOWED_CONTENT_TYPES):
                    return url, title

                chunks = []
                bytes_read = 0
                for chunk in response.iter_content(chunk_size=8192):
                    if not chunk:
                        continue
                    bytes_read += len(chunk)
                    if bytes_read > MAX_DOWNLOAD_BYTES:
                        break
                    chunks.append(chunk)

                html = b"".join(chunks).decode(response.encoding or "utf-8", errors="replace")

                soup = BeautifulSoup(html, "html.parser")
                for script in soup(["script", "style"]):
                    script.extract()
                text = soup.get_text(separator=' ')
                text = ' '.join(text.split())
                text = text[:MAX_EXTRACTED_TEXT_CHARS]
                scraped_text = text if text else title
                return url, scraped_text
            else:
                return url, f"Error: HTTP {response.status_code}"
        except Exception as exc:
            _logger.debug("Failed to scrape url=%s: %s", url, exc)
            return url, f"Error: {str(exc)}"
        finally:
            if response is not None:
                response.close()

    def fetch_search_results(self, endpoint, query):
        url = endpoint.format(query=query)
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        session = self.get_tor_session()

        # Find engine name for logging
        engine_name = "Unknown"
        for e in SEARCH_ENGINES:
            if e["url"] == endpoint:
                engine_name = e["name"]
                break

        try:
            response = session.get(url, headers=headers, timeout=40)
            if response.status_code in (200, 204, 301, 302):
                # Handle redirects
                if response.status_code in (301, 302):
                    redirect_url = response.headers.get('Location', '')
                    if redirect_url:
                        _logger.info(f"  🔄 {engine_name} redirected to: {redirect_url[:80]}...")
                        # Follow redirect for search
                        response = session.get(redirect_url, headers=headers, timeout=40)
                        if response.status_code != 200:
                            _logger.warning(f"  ⚠️ {engine_name} returned {response.status_code} after redirect")
                            return []

                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")
                    links = []
                    # Generic parsing for standard search engine layouts
                    # Extract onion links
                    for a in soup.find_all('a'):
                        try:
                            href = a.get('href', '')
                            title = a.get_text(strip=True)

                            # Regex to find V3 onion addresses
                            onion_match = re.search(r'https?://[a-z0-9]{56}\.onion', href, re.I)
                            if onion_match:
                                link = onion_match.group(0)

                                # FILTERING LOGIC:
                                # 1. Ignore if link is just the search engine itself
                                is_self = any(urlparse(link).hostname == urlparse(e["url"]).hostname for e in SEARCH_ENGINES)
                                # 2. Ignore common static/infrastructure links
                                blacklisted_terms = ["hosting", "about", "contact", "advertise", "donations", "search"]
                                is_static = any(term in title.lower() or term in href.lower() for term in blacklisted_terms)

                                if not is_self and not is_static and len(title) > 3:
                                    links.append({"title": title, "link": link})
                        except:
                            continue
                    _logger.info(f"  ✅ {engine_name} returned {len(links)} links")
                    return links
                else:
                    _logger.warning(f"  ⚠️ {engine_name} returned {response.status_code}")
            else:
                _logger.warning(f"  ⚠️ {engine_name} returned HTTP {response.status_code}")
            return []
        except Exception as e:
            _logger.warning(f"  ❌ {engine_name} failed: {type(e).__name__}: {str(e)[:80]}")
            return []

    def search_onion(self, query: str, max_results: int = 10) -> List[Dict]:
        """Search for .onion URLs using multiple engines in parallel"""
        results = []
        endpoints = [e["url"] for e in SEARCH_ENGINES]
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(self.fetch_search_results, endpoint, query)
                       for endpoint in endpoints]
            for future in as_completed(futures):
                result_urls = future.result()
                results.extend(result_urls)

        # Deduplicate results
        seen_links = set()
        unique_results = []
        for res in results:
            link = res.get("link")
            # Remove trailing slashes and query params for better deduplication
            clean_link = link.split('?')[0].rstrip('/')
            if clean_link not in seen_links:
                seen_links.add(clean_link)
                unique_results.append(res)
                
        return unique_results[:max_results]
    
    def check_tor(self) -> bool:
        """Verify Tor is running"""
        try:
            session = self.get_tor_session()
            response = session.get("http://httpbin.org/ip", timeout=15)
            print(f"🟢 Tor active - IP: {response.json()['origin']}")
            return True
        except Exception as e:
            print(f"🔴 Tor not running: {e}")
            return False
    
    def crawl_and_analyze(self, url: str, title: str = "Untitled") -> Dict:
        """Crawl a .onion site and analyze with all configured AI models"""
        
        result = {
            'url': url,
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'pending',
            'analyses': []
        }
        
        print(f"   🕷️  Scraping content...")
        url, text = self.scrape_single(url, title)
        
        if text.startswith("Error:"):
            result['status'] = text
        else:
            result['status'] = 'success'
            # Analyze with each configured AI model
            for ai in self.ai_models:
                if not ai.use_ai: continue
                
                print(f"   🤖 Analyzing with {ai.provider} ({ai.model_name})...")
                threat_analysis = ai.analyze_threat(text[:MAX_RETURN_CHARS], url=url)
                
                analysis_entry = {
                    'provider': ai.provider,
                    'model': ai.model_name,
                    'threat_level': threat_analysis.get('threat_level', 'unknown'),
                    'details': threat_analysis
                }
                result['analyses'].append(analysis_entry)
            
            # Aggregate threat level (pick highest)
            priority = {'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'info': 1, 'unknown': 0}
            levels = [a['threat_level'] for a in result['analyses']]
            result['overall_threat_level'] = max(levels, key=lambda x: priority.get(x, 0)) if levels else 'unknown'
        
        self.threat_intel.append(result)
        return result
    
    def analyze_direct_url(self, url: str):
        """Analyze a specific URL directly"""
        print("\n" + "="*60)
        print(f"🎯 Direct URL Analysis")
        print(f"   URL: {url}")
        print("="*60)
        
        if not self.check_tor():
            return
        
        print(f"\n🕷️  Analyzing {url}...")
        result = self.crawl_and_analyze(url, "Direct Analysis")
        
        # Show threat level
        threat_level = result.get('threat_analysis', {}).get('threat_level', 'unknown')
        emoji = {'critical': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🟢', 'info': 'ℹ️'}.get(threat_level, '⚪')
        print(f"   {emoji} Threat Level: {threat_level.upper()}")
        
        # Save result
        filename = f"darkscope_direct_analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\n💾 Result saved to: {filename}")

    def run(self, query: str, max_sites: int = 5):
        """Main execution flow"""
        
        print("\n" + "="*60)
        print(f"🎯 DarkScope Threat Intel")
        print(f"   Query: {query}")
        print("="*60)
        
        if not self.check_tor():
            return
        
        # Search for sites
        print(f"\n🔍 Searching for .onion sites...")
        results = self.search_onion(query, max_results=max_sites)
        print(f"📋 Found {len(results)} unique sites")
        
        if not results:
            print("❌ No sites found")
            return
        
        # Crawl and analyze
        print(f"\n🕷️  Crawling and analyzing {len(results)} sites...")
        for i, res in enumerate(results, 1):
            url = res['link']
            title = res.get('title', 'Unknown')
            print(f"\n[{i}/{len(results)}] {title} ({url[:40]}...)")
            result = self.crawl_and_analyze(url, title)
            
            # Show threat level
            threat_level = result.get('threat_analysis', {}).get('threat_level', 'unknown')
            emoji = {'critical': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🟢', 'info': 'ℹ️'}.get(threat_level, '⚪')
            print(f"   {emoji} Threat Level: {threat_level.upper()}")
            
            time.sleep(self.request_delay)
        
        # Save results
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"darkscope_intel_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump({
                'query': query,
                'timestamp': timestamp,
                'results': self.threat_intel
            }, f, indent=2)
        
        print(f"\n💾 Results saved to: {filename}")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print threat summary"""
        print("\n" + "="*60)
        print("📊 DARKSCOPE SUMMARY")
        print("="*60)
        
        levels = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
        
        for result in self.threat_intel:
            level = result.get('threat_analysis', {}).get('threat_level', 'info')
            levels[level] = levels.get(level, 0) + 1
        
        print(f"\n🔴 Critical: {levels['critical']}")
        print(f"🟠 High: {levels['high']}")
        print(f"🟡 Medium: {levels['medium']}")
        print(f"🟢 Low: {levels['low']}")
        print(f"ℹ️  Info: {levels['info']}")


if __name__ == "__main__":
    import os
    
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║                 🛡️ DarkScope Threat Intel                    ║
    ║                (OpenRouter Free AI System)               ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    # Configure OpenRouter free AI models
    ai_configs = [
        {
            "provider": "openrouter",
            "model": "google/gemini-2.0-flash-exp:free",
            "api_key": os.getenv("OPENROUTER_API_KEY")
        },
        {
            "provider": "openrouter",
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "api_key": os.getenv("OPENROUTER_API_KEY")
        }
    ]
    
    # Initialize crawler
    crawler = DarkScopeCrawler(ai_configs=ai_configs)
    
    # List of queries for specific threat detection
    queries = [
        "bitcoin address",
        "leak credentials"
    ]
    
    for query in queries:
        crawler.run(
            query=query,
            max_sites=5
        )