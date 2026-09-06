"use client"

import { motion } from "framer-motion"
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Globe,
  Clock,
  Tag,
  ExternalLink,
  Shield,
  Database,
  ShoppingCart,
  MessageSquare,
  Key,
} from "lucide-react"
import type { ThreatResult, ThreatCategory } from "@/lib/types"

interface ThreatCardProps {
  result: ThreatResult
  index: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
}

const riskConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-neon-pink",
    bgColor: "bg-neon-pink/10",
    borderColor: "border-neon-pink/30",
    glowColor: "hover:shadow-[0_0_20px_oklch(0.65_0.25_340_/_0.4)]",
    label: "CRITICAL",
  },
  high: {
    icon: AlertTriangle,
    color: "text-high-risk",
    bgColor: "bg-high-risk/10",
    borderColor: "border-high-risk/30",
    glowColor: "hover:shadow-[0_0_20px_oklch(0.65_0.25_25_/_0.3)]",
    label: "HIGH RISK",
  },
  medium: {
    icon: AlertCircle,
    color: "text-medium-risk",
    bgColor: "bg-medium-risk/10",
    borderColor: "border-medium-risk/30",
    glowColor: "hover:shadow-[0_0_20px_oklch(0.8_0.18_85_/_0.3)]",
    label: "MEDIUM",
  },
  low: {
    icon: CheckCircle,
    color: "text-low-risk",
    bgColor: "bg-low-risk/10",
    borderColor: "border-low-risk/30",
    glowColor: "hover:shadow-[0_0_20px_oklch(0.7_0.2_150_/_0.3)]",
    label: "LOW",
  },
}

const categoryConfig: Record<ThreatCategory, { icon: typeof Shield; label: string }> = {
  leak: { icon: Database, label: "Data Leak" },
  marketplace: { icon: ShoppingCart, label: "Marketplace" },
  forum: { icon: MessageSquare, label: "Forum" },
  database: { icon: Database, label: "Database" },
  credential: { icon: Key, label: "Credentials" },
}

export function ThreatCard({ result, index }: ThreatCardProps) {
  const risk = riskConfig[result.riskLevel]
  const category = categoryConfig[result.category]
  const RiskIcon = risk.icon
  const CategoryIcon = category.icon

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        transition: { duration: 0.2 } 
      }}
      className={`glass-card rounded-xl p-5 border ${risk.borderColor} ${risk.glowColor} transition-all duration-300 cursor-pointer group`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            className={`p-2 rounded-lg ${risk.bgColor}`}
            whileHover={{ scale: 1.1 }}
          >
            <RiskIcon className={`w-4 h-4 ${risk.color}`} />
          </motion.div>
          <div>
            <span className={`text-xs font-bold ${risk.color}`}>{risk.label}</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{result.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Threat score */}
        <motion.div
          className={`flex items-center justify-center w-12 h-12 rounded-full ${risk.bgColor} border ${risk.borderColor}`}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <span className={`text-lg font-bold ${risk.color}`}>{result.threatScore}</span>
        </motion.div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-neon-blue transition-colors">
        {result.title}
      </h4>

      {/* URL */}
      <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
        <Globe className="w-4 h-4 shrink-0" />
        <span className="truncate font-mono text-xs">{result.url}</span>
        <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{result.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        {/* Category */}
        <div className="flex items-center gap-2">
          <CategoryIcon className="w-4 h-4 text-neon-cyan" />
          <span className="text-xs text-neon-cyan">{category.label}</span>
        </div>

        {/* Tags */}
        {result.tags && result.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3 text-muted-foreground" />
            <div className="flex gap-1">
              {result.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-xs bg-secondary text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${
            result.riskLevel === "critical"
              ? "oklch(0.65 0.25 340 / 0.15)"
              : result.riskLevel === "high"
                ? "oklch(0.65 0.25 25 / 0.1)"
                : result.riskLevel === "medium"
                  ? "oklch(0.8 0.18 85 / 0.1)"
                  : "oklch(0.7 0.2 150 / 0.1)"
          }, transparent 70%)`,
        }}
      />
    </motion.div>
  )
}
