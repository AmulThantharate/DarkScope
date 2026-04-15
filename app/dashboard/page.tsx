"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedBackground } from "@/components/animated-background"
import { DashboardHeader } from "@/components/dashboard/header"
import { SearchSection } from "@/components/dashboard/search-section"
import { FilterSection } from "@/components/dashboard/filter-section"
import { ResultsSection } from "@/components/dashboard/results-section"
import { ScanProgress } from "@/components/dashboard/scan-progress"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import type { ThreatResult, RiskLevel, ScanResponse } from "@/lib/types"

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [results, setResults] = useState<ThreatResult[]>([])
  const [filteredResults, setFilteredResults] = useState<ThreatResult[]>([])
  const [activeFilters, setActiveFilters] = useState<RiskLevel[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [scanMode, setScanMode] = useState<"live" | "demo" | null>(null)
  const [torActive, setTorActive] = useState(false)

  // Filter results when filters change
  useEffect(() => {
    if (activeFilters.length === 0) {
      setFilteredResults(results)
    } else {
      setFilteredResults(results.filter((result) => activeFilters.includes(result.riskLevel)))
    }
  }, [results, activeFilters])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    setSearchQuery(query)
    setIsScanning(true)
    setScanProgress(0)
    setError(null)
    setResults([])
    setHasSearched(true)

    // Simulate scan progress
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 15
      })
    }, 200)

    try {
      const response = await fetch(`/api/scan?query=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error("Scan failed. Please try again.")
      }

      const data: ScanResponse = await response.json()
      setScanProgress(100)
      setScanMode(data.mode || "demo")
      setTorActive(data.torActive || false)
      
      setTimeout(() => {
        setResults(data.results)
        setIsScanning(false)
      }, 500)
    } catch {
      clearInterval(progressInterval)
      setError("Failed to complete scan. Network error or service unavailable.")
      setIsScanning(false)
    }
  }

  const handleFilterToggle = (level: RiskLevel) => {
    setActiveFilters((prev) =>
      prev.includes(level) ? prev.filter((f) => f !== level) : [...prev, level]
    )
  }

  return (
    <main className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative z-10">
        <DashboardHeader isScanning={isScanning} />

        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-8"
        >
          {/* Search Section */}
          <SearchSection onSearch={handleSearch} isScanning={isScanning} />

          {/* Scan Progress */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8"
              >
                <ScanProgress progress={scanProgress} query={searchQuery} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Section */}
          {!isScanning && hasSearched && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <FilterSection
                activeFilters={activeFilters}
                onFilterToggle={handleFilterToggle}
                resultCounts={{
                  critical: results.filter((r) => r.riskLevel === "critical").length,
                  high: results.filter((r) => r.riskLevel === "high").length,
                  medium: results.filter((r) => r.riskLevel === "medium").length,
                  low: results.filter((r) => r.riskLevel === "low").length,
                }}
              />
            </motion.div>
          )}

          {/* Results Section */}
          {!isScanning && hasSearched && (
            <div className="mt-8">
              {error ? (
                <ErrorState message={error} onRetry={() => handleSearch(searchQuery)} />
              ) : filteredResults.length > 0 ? (
                <ResultsSection results={filteredResults} />
              ) : (
                <EmptyState query={searchQuery} />
              )}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
