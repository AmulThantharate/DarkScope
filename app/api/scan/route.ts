import { NextRequest, NextResponse } from "next/server"
import type { ThreatResult, RiskLevel, ThreatCategory, ScanResponse } from "@/lib/types"

// Python API server URL
const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000"

// ---------------------------------------------------------------------------
// Live mode — proxy to Python FastAPI backend
// ---------------------------------------------------------------------------
async function fetchFromPythonBackend(query: string): Promise<ScanResponse | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 300_000) // 5min timeout for Tor crawling

    const response = await fetch(
      `${PYTHON_API_URL}/api/scan?query=${encodeURIComponent(query)}`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      },
    )

    clearTimeout(timeout)

    if (!response.ok) {
      console.error(`Python API returned ${response.status}`)
      return null
    }

    const data = await response.json()

    // Map Python response → frontend ScanResponse
    const results: ThreatResult[] = (data.results || []).map(
      (r: Record<string, unknown>) => ({
        id: r.id || `py-${Math.random().toString(36).slice(2, 10)}`,
        url: r.url || "",
        title: r.title || "Untitled",
        threatScore: r.threatScore || 0,
        riskLevel: r.riskLevel || "low",
        category: r.category || "leak",
        timestamp: r.timestamp || "Recently",
        description: r.description || "",
        tags: r.tags || [],
        aiAnalysis: r.aiAnalysis || undefined,
      }),
    )

    return {
      results,
      totalFound: data.totalFound || results.length,
      scanDuration: data.scanDuration || 0,
      torActive: data.torActive || false,
      mode: data.mode || "live",
    }
  } catch (error) {
    console.error("Failed to reach Python backend:", error)
    return null
  }
}

// ---------------------------------------------------------------------------
// Fallback — mock data (when Python API is unreachable)
// ---------------------------------------------------------------------------
function generateMockResults(query: string): ThreatResult[] {
  const categories: ThreatCategory[] = ["leak", "marketplace", "forum", "database", "credential"]
  const riskLevels: RiskLevel[] = ["high", "medium", "low"]

  const mockTitles = [
    { title: "Credential Dump - Corporate Email List", category: "credential" as ThreatCategory },
    { title: "Database Export - User Records", category: "database" as ThreatCategory },
    { title: "Underground Marketplace Listing", category: "marketplace" as ThreatCategory },
    { title: "Dark Web Forum Discussion", category: "forum" as ThreatCategory },
    { title: "Leaked API Keys Repository", category: "leak" as ThreatCategory },
    { title: "Financial Data Breach Archive", category: "database" as ThreatCategory },
    { title: "Stolen Credit Card Batch", category: "marketplace" as ThreatCategory },
    { title: "Private Forum Thread - Exploits", category: "forum" as ThreatCategory },
    { title: "Employee Credentials Exposed", category: "credential" as ThreatCategory },
    { title: "Customer Data Leak", category: "leak" as ThreatCategory },
  ]

  const mockDescriptions = [
    "Contains potentially sensitive information matching your search criteria. Multiple data points detected.",
    "Large dataset found with personal identifiable information. Review recommended.",
    "Active listing detected on known dark web marketplace. Price and seller information available.",
    "Discussion thread mentioning your query. Multiple users engaged in conversation.",
    "Repository of leaked credentials found. Hash analysis suggests recent breach.",
    "Financial records detected including transaction history and account details.",
    "Batch listing with card numbers and CVVs. Geographic distribution analysis available.",
    "Technical discussion about vulnerabilities and exploitation techniques.",
    "Internal corporate credentials detected. MFA bypass attempts documented.",
    "Customer database with email addresses, phone numbers, and purchase history.",
  ]

  const onionDomains = [
    "3g2upl4pq6kufc4m.onion",
    "xmh57jrzrnw6insl.onion",
    "zqktlwi4fecvo6ri.onion",
    "msydqstlz2kzerdg.onion",
    "expyuzz4wqqyqhjn.onion",
    "hss3uro2hsxfogfq.onion",
    "uj3wazyk5u4hnvtk.onion",
    "7rmath4ro2of2a42.onion",
    "dreadytofatrn7wo.onion",
    "archivebyd3rzt3s.onion",
  ]

  const tags = [
    ["PII", "2024"],
    ["Financial", "Verified"],
    ["Corporate", "Fresh"],
    ["Exploit", "Critical"],
    ["Credentials", "Bulk"],
    ["Database", "SQL"],
    ["Cards", "USA"],
    ["Forum", "Active"],
    ["API", "Keys"],
    ["Customer", "Export"],
  ]

  const seed = query.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const numResults = 3 + (seed % 8)

  const results: ThreatResult[] = []
  const now = new Date()

  for (let i = 0; i < numResults; i++) {
    const titleIndex = (seed + i * 7) % mockTitles.length
    const riskIndex = (seed + i * 3) % 3
    const domainIndex = (seed + i * 5) % onionDomains.length

    let threatScore: number
    if (riskLevels[riskIndex] === "high") {
      threatScore = 75 + ((seed + i) % 25)
    } else if (riskLevels[riskIndex] === "medium") {
      threatScore = 40 + ((seed + i) % 35)
    } else {
      threatScore = 10 + ((seed + i) % 30)
    }

    const daysAgo = i * 2 + ((seed + i) % 5)
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    results.push({
      id: `threat-${seed}-${i}`,
      url: `http://${onionDomains[domainIndex]}/data/${query.replace(/\s+/g, "-").toLowerCase()}`,
      title: mockTitles[titleIndex].title,
      threatScore,
      riskLevel: riskLevels[riskIndex],
      category: mockTitles[titleIndex].category,
      timestamp: formatTimestamp(timestamp),
      description: mockDescriptions[titleIndex],
      tags: tags[titleIndex],
    })
  }

  return results.sort((a, b) => b.threatScore - a.threatScore)
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    return "Just now"
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  // Try the Python backend first
  const liveResponse = await fetchFromPythonBackend(query)

  if (liveResponse) {
    // Successfully got data from Python backend
    return NextResponse.json(liveResponse)
  }

  // Fallback to mock data
  console.warn("⚠️ Python backend unreachable — returning mock data")

  // Simulate network latency for mock
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000))

  const startTime = Date.now()
  const results = generateMockResults(query)
  const scanDuration = Date.now() - startTime

  const response: ScanResponse = {
    results,
    totalFound: results.length,
    scanDuration,
    torActive: false,
    mode: "demo",
  }

  return NextResponse.json(response)
}
