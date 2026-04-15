"use client"

import { motion } from "framer-motion"

export function SkeletonCard() {
  return (
    <div className="glass-card rounded-xl p-5 border border-border/50">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-10 h-10 rounded-lg bg-secondary"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div className="space-y-2">
            <motion.div
              className="w-16 h-3 rounded bg-secondary"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            />
            <motion.div
              className="w-12 h-2 rounded bg-secondary"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </div>
        </div>
        <motion.div
          className="w-12 h-12 rounded-full bg-secondary"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
      </div>

      {/* Title skeleton */}
      <motion.div
        className="w-3/4 h-5 rounded bg-secondary mb-3"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
      />

      {/* URL skeleton */}
      <motion.div
        className="w-full h-4 rounded bg-secondary mb-3"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      />

      {/* Description skeleton */}
      <div className="space-y-2 mb-4">
        <motion.div
          className="w-full h-3 rounded bg-secondary"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
        <motion.div
          className="w-2/3 h-3 rounded bg-secondary"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
        />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <motion.div
          className="w-20 h-4 rounded bg-secondary"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
        />
        <div className="flex gap-2">
          <motion.div
            className="w-12 h-4 rounded bg-secondary"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
          />
          <motion.div
            className="w-12 h-4 rounded bg-secondary"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          />
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
