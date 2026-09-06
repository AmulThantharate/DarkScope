import json
import re
import hashlib
import os
from typing import List, Dict, Optional
from datetime import datetime
import requests

class DarkScopeAI:
    """OpenRouter-based AI for DarkScope threat detection"""
    
    def __init__(self, api_key: str = None, model_name: str = "google/gemini-2.0-flash-exp:free", provider: str = "openrouter"):
        """
        Initialize threat detector
        
        Args:
            api_key: API key for OpenRouter
            model_name: Model name (default: "google/gemini-2.0-flash-exp:free")
            provider: "openrouter"
        """
        self.provider = provider.lower()
        self.model_name = model_name
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        
        if not self.api_key:
            print(f"⚠️ No API key found for {self.provider}. Set OPENROUTER_API_KEY environment variable.")
            self.use_ai = False
        else:
            self.use_ai = True
            print(f"✅ {self.provider.capitalize()} ready (model: {model_name})")
        
        # Regex patterns as fallback
        self.patterns = {
            'email': r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            'bitcoin_address': r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b|bc1[ac-hj-np-z02-9]{11,71}\b',
            'leak_database': r'(?:database|db|breach|leak|dump)\s+(?:called|named)?\s*["\']?([a-zA-Z0-9_\-\s]+)',
            'credit_card': r'\b(?:\d[ -]*?){13,16}\b',
            'phone': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            'ip_address': r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
            'database': r'(?:database|db|breach|leak|dump)\s+(?:called|named)?\s*["\']?([a-zA-Z0-9_\-\s]+)',
            'records_count': r'(\d+(?:,\d{3})*)\s*(?:records|rows|entries|users)'
        }
        
    def analyze_threat(self, text: str, url: str = "", context: str = "") -> Dict:
        """Analyze text for threats"""
        # First pass: regex extraction
        regex_findings = self._extract_with_regex(text)
        
        # Second pass: AI analysis
        if self.use_ai and len(text) > 50:
            ai_analysis = self._analyze_with_openrouter(text, url, context)
        else:
            ai_analysis = {}
        
        # Combine results
        return self._merge_results(regex_findings, ai_analysis, text)

    def _extract_with_regex(self, text: str) -> Dict:
        """Extract threats using regex patterns"""
        findings = {}
        for threat_type, pattern in self.patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                unique_matches = list(set(m.lower() if isinstance(m, str) else str(m) for m in matches))
                findings[threat_type] = unique_matches[:10]
        return findings

    def _get_prompt(self, text: str, url: str, context: str) -> str:
        return f"""
You are a dark web threat intelligence analyst. Analyze the following content for security threats.

Source URL: {url if url else 'Unknown'}
Context: {context if context else 'Dark web hidden service content'}

CONTENT TO ANALYZE:
---
{text[:4000]}
---

Return ONLY valid JSON with this structure:
{{
  "threat_level": "critical|high|medium|low|info",
  "summary": "Brief one-sentence summary of the threat",
  "leaked_credentials": [
    {{"type": "email", "value": "user@example.com", "confidence": 0.95}}
  ],
  "financial_data": [],
  "pii_found": [],
  "breach_mentions": [],
  "threat_actors": [],
  "marketplace_listings": [],
  "recommendations": [],
  "raw_indicators": []
}}
"""

    def _analyze_with_openrouter(self, text: str, url: str, context: str) -> Dict:
        """Analyze text with OpenRouter API"""
        prompt = self._get_prompt(text, url, context)
        try:
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                data=json.dumps({
                    "model": self.model_name,
                    "messages": [{"role": "user", "content": prompt}]
                })
            )
            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    return json.loads(json_match.group())
            return {"error": f"OpenRouter Error {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}

    def _merge_results(self, regex_findings: Dict, ai_analysis: Dict, raw_text: str) -> Dict:
        content_hash = hashlib.sha256(raw_text[:1000].encode()).hexdigest()[:16]
        threat_level = ai_analysis.get('threat_level', 'info')
        return {
            'analysis_id': content_hash,
            'timestamp': datetime.utcnow().isoformat(),
            'threat_level': threat_level,
            'regex_matches': regex_findings,
            'ai_analysis': ai_analysis,
            'summary': ai_analysis.get('summary', "Analyzed content"),
            'recommendations': ai_analysis.get('recommendations', [])
        }
