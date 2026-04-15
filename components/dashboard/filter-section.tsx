"use client"

import { motion } from "framer-motion"
import { AlertTriangle, AlertCircle, CheckCircle, Flame } from "lucide-react"
import type { RiskLevel } from "@/lib/types"

interface FilterSectionProps {
  activeFilters: RiskLevel[]
  onFilterToggle: (level: RiskLevel) => void
  resultCounts: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

const filters = [
  {
    level: "critical" as RiskLevel,
    label: "Critical",
    icon: Flame,
    color: "neon-pink",
    bgColor: "bg-neon-pink/10",
    borderColor: "border-neon-pink/30",
    activeColor: "bg-neon-pink/20 border-neon-pink",
  },
  {
    level: "high" as RiskLevel,
    label: "High Risk",
    icon: AlertTriangle,
    color: "high-risk",
    bgColor: "bg-high-risk/10",
    borderColor: "border-high-risk/30",
    activeColor: "bg-high-risk/20 border-high-risk",
  },
  {
    level: "medium" as RiskLevel,
    label: "Medium Risk",
    icon: AlertCircle,
    color: "medium-risk",
    bgColor: "bg-medium-risk/10",
    borderColor: "border-medium-risk/30",
    activeColor: "bg-medium-risk/20 border-medium-risk",
  },
  {
    level: "low" as RiskLevel,
    label: "Low Risk",
    icon: CheckCircle,
    color: "low-risk",
    bgColor: "bg-low-risk/10",
    borderColor: "border-low-risk/30",
    activeColor: "bg-low-risk/20 border-low-risk",
  },
]

export function FilterSection({ activeFilters, onFilterToggle, resultCounts }: FilterSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <span className="text-sm text-muted-foreground">Filter by risk:</span>
      <div className="flex flex-wrap justify-center gap-2">
        {filters.map((filter, index) => {
          const isActive = activeFilters.includes(filter.level)
          const count = resultCounts[filter.level]
          const Icon = filter.icon

          return (
            <motion.button
              key={filter.level}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onFilterToggle(filter.level)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
                isActive
                  ? filter.activeColor
                  : `${filter.bgColor} ${filter.borderColor} hover:${filter.activeColor}`
              }`}
            >
              <motion.div
                animate={{
                  scale: isActive ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <Icon className={`w-4 h-4 text-${filter.color}`} />
              </motion.div>
              <span className={`text-sm font-medium text-${filter.color}`}>{filter.label}</span>
              <motion.span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? `bg-${filter.color}/30` : `bg-${filter.color}/20`
                } text-${filter.color}`}
                animate={{
                  scale: isActive ? [1, 1.1, 1] : 1,
                }}
              >
                {count}
              </motion.span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
