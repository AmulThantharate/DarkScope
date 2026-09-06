"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Radar, Database, CreditCard, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface SearchSectionProps {
  onSearch: (query: string) => void
  isScanning: boolean
}

const placeholders = [
  "Search leaks, credit cards, databases...",
  "Find exposed credentials...",
  "Monitor dark web forums...",
  "Track data breaches...",
  "Discover marketplace listings...",
]

const quickSearches = [
  { icon: Database, label: "Data Leaks", query: "data leak 2024" },
  { icon: CreditCard, label: "Credit Cards", query: "credit card dump" },
  { icon: Users, label: "Credentials", query: "email password combo" },
  { icon: Shield, label: "Exploits", query: "zero day exploit" },
]

export function SearchSection({ onSearch, isScanning }: SearchSectionProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isScanning) {
      onSearch(query)
    }
  }

  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    onSearch(searchQuery)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-balance">
          <span className="text-foreground">Dark Web </span>
          <span className="text-neon-blue text-glow">Threat Scanner</span>
        </h2>
        <p className="text-muted-foreground">
          Monitor and analyze threats across the dark web in real-time
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <motion.div
          className={`relative glass-card rounded-2xl p-2 transition-all duration-300 ${
            isFocused ? "shadow-[0_0_30px_oklch(0.6_0.2_230_/_0.3)]" : ""
          }`}
          animate={{
            borderColor: isFocused ? "oklch(0.7 0.2 230)" : "oklch(0.35 0.05 270 / 0.2)",
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="pl-4"
              animate={{
                color: isFocused ? "oklch(0.7 0.2 230)" : "oklch(0.6 0.02 270)",
              }}
            >
              {isScanning ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Radar className="w-6 h-6 text-neon-blue" />
                </motion.div>
              ) : (
                <Search className="w-6 h-6" />
              )}
            </motion.div>

            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isScanning}
                className="w-full py-4 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
                placeholder=""
              />
              <AnimatePresence mode="wait">
                {!query && (
                  <motion.span
                    key={placeholderIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.5, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-lg text-muted-foreground/50 pointer-events-none"
                  >
                    {placeholders[placeholderIndex]}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isScanning || !query.trim()}
                className="px-6 py-6 bg-gradient-to-r from-neon-blue to-neon-purple text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_oklch(0.6_0.2_230_/_0.5)] disabled:opacity-50"
              >
                {isScanning ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-5 h-5" />
                    <span className="hidden sm:inline">Scanning</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Radar className="w-5 h-5" />
                    <span className="hidden sm:inline">Scan</span>
                  </span>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(90deg, oklch(0.7 0.2 230 / 0), oklch(0.7 0.2 230 / ${isFocused ? 0.5 : 0}), oklch(0.7 0.2 230 / 0))`,
              backgroundSize: "200% 100%",
            }}
            animate={{
              backgroundPosition: isFocused ? ["0% 0%", "200% 0%"] : "0% 0%",
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </motion.form>

      {/* Quick searches */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <p className="text-sm text-muted-foreground text-center mb-3">Quick searches:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {quickSearches.map((item, index) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              onClick={() => handleQuickSearch(item.query)}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-neon-blue/50 hover:bg-neon-blue/5 transition-all duration-300 disabled:opacity-50"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
