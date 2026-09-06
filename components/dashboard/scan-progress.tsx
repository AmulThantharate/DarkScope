"use client"

import { motion } from "framer-motion"
import { Radar, Globe, Server, Database, Shield } from "lucide-react"

interface ScanProgressProps {
  progress: number
  query: string
}

const scanStages = [
  { icon: Globe, label: "Connecting to nodes", threshold: 0 },
  { icon: Server, label: "Scanning dark web", threshold: 25 },
  { icon: Database, label: "Analyzing databases", threshold: 50 },
  { icon: Shield, label: "Compiling results", threshold: 75 },
]

export function ScanProgress({ progress, query }: ScanProgressProps) {
  const currentStage = scanStages.findIndex(
    (stage, index) =>
      progress >= stage.threshold &&
      (index === scanStages.length - 1 || progress < scanStages[index + 1].threshold)
  )

  return (
    <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Radar className="w-6 h-6 text-neon-blue" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">Scanning Dark Web</h3>
            <p className="text-sm text-muted-foreground truncate max-w-xs">
              Query: {'"'}{query}{'"'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <motion.span
            className="text-2xl font-bold text-neon-blue"
            key={Math.floor(progress)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {Math.floor(progress)}%
          </motion.span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-6">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-blue/50 via-neon-purple/50 to-neon-cyan/50 rounded-full blur-sm"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Scan stages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {scanStages.map((stage, index) => {
          const Icon = stage.icon
          const isActive = currentStage === index
          const isComplete = progress >= (scanStages[index + 1]?.threshold ?? 100)

          return (
            <motion.div
              key={stage.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? "bg-neon-blue/10 border border-neon-blue/30"
                  : isComplete
                    ? "bg-low-risk/10 border border-low-risk/30"
                    : "bg-secondary/50 border border-transparent"
              }`}
            >
              <motion.div
                animate={
                  isActive
                    ? {
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7],
                      }
                    : {}
                }
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-neon-blue" : isComplete ? "text-low-risk" : "text-muted-foreground"
                  }`}
                />
              </motion.div>
              <span
                className={`text-xs text-center ${
                  isActive ? "text-neon-blue" : isComplete ? "text-low-risk" : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
