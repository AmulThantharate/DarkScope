"use client"

import { motion } from "framer-motion"
import { ThreatCard } from "./threat-card"
import type { ThreatResult } from "@/lib/types"

interface ResultsSectionProps {
  results: ThreatResult[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export function ResultsSection({ results }: ResultsSectionProps) {
  return (
    <div>
      {/* Results header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h3 className="text-lg font-semibold text-foreground">
          Threat Intelligence Results
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({results.length} found)
          </span>
        </h3>
      </motion.div>

      {/* Results grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {results.map((result, index) => (
          <ThreatCard key={result.id} result={result} index={index} />
        ))}
      </motion.div>
    </div>
  )
}
