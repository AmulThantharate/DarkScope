"use client"

import { motion } from "framer-motion"
import { Shield, Activity, User, Menu, X, LogOut } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardHeaderProps {
  isScanning: boolean
}

export function DashboardHeader({ isScanning }: DashboardHeaderProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <header className="glass sticky top-0 z-50 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon-blue/20 border border-neon-blue/30"
              animate={
                isScanning
                  ? {
                      boxShadow: [
                        "0 0 10px oklch(0.6 0.2 230 / 0.3)",
                        "0 0 25px oklch(0.6 0.2 230 / 0.6)",
                        "0 0 10px oklch(0.6 0.2 230 / 0.3)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Shield className="w-5 h-5 text-neon-blue" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold">
                <span className="text-neon-blue">Dark</span>
                <span className="text-neon-purple">Scope</span>
                <span className="text-neon-cyan"> AI</span>
              </h1>
            </div>
          </motion.div>

          {/* Status indicator */}
          <motion.div
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full glass"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${isScanning ? "bg-medium-risk" : "bg-low-risk"}`}
              animate={{
                scale: isScanning ? [1, 1.3, 1] : 1,
                opacity: isScanning ? [1, 0.5, 1] : 1,
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <Activity className={`w-4 h-4 ${isScanning ? "text-medium-risk" : "text-low-risk"}`} />
            <span className="text-sm font-medium">
              {isScanning ? (
                <span className="text-medium-risk">Scanning...</span>
              ) : (
                <span className="text-low-risk">Live</span>
              )}
            </span>
          </motion.div>

          {/* Right section */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative flex items-center gap-2 hover:bg-neon-blue/10"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-medium">Analyst</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-border/50">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer hover:bg-neon-blue/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </motion.div>
        </div>

        {/* Mobile menu */}
        <motion.div
          initial={false}
          animate={{
            height: isMobileMenuOpen ? "auto" : 0,
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg glass">
              <motion.div
                className={`w-2 h-2 rounded-full ${isScanning ? "bg-medium-risk" : "bg-low-risk"}`}
                animate={{
                  scale: isScanning ? [1, 1.3, 1] : 1,
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <span className="text-sm">{isScanning ? "Scanning..." : "System Live"}</span>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
