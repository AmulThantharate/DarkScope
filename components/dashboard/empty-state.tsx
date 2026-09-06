"use client"

import { motion } from "framer-motion"
import { SearchX, Shield } from "lucide-react"

interface EmptyStateProps {
  query: string
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        className="relative mb-6"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-24 h-24 rounded-full bg-neon-blue/10 flex items-center justify-center">
          <SearchX className="w-12 h-12 text-neon-blue/50" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-neon-blue/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      <h3 className="text-xl font-semibold text-foreground mb-2">No Threats Found</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        No dark web threats were detected for {'"'}{query}{'"'}. This is good news, but stay vigilant.
      </p>

      <div className="flex items-center gap-2 text-sm text-low-risk">
        <Shield className="w-4 h-4" />
        <span>Your query appears clean</span>
      </div>
    </motion.div>
  )
}
