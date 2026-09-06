"use client"

import { motion } from "framer-motion"
import { AlertOctagon, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        className="relative mb-6"
        animate={{
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-24 h-24 rounded-full bg-high-risk/10 flex items-center justify-center">
          <AlertOctagon className="w-12 h-12 text-high-risk" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-high-risk/30"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      <h3 className="text-xl font-semibold text-foreground mb-2">Scan Failed</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={onRetry}
          className="bg-gradient-to-r from-neon-blue to-neon-purple text-primary-foreground hover:shadow-[0_0_20px_oklch(0.6_0.2_230_/_0.5)]"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Scan
        </Button>
      </motion.div>
    </motion.div>
  )
}
