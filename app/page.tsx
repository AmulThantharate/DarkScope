"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Shield, ArrowRight, AlertCircle, Activity, Globe, Database, Network } from "lucide-react"
import { useRouter } from "next/navigation"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate authentication
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (email && password) {
      router.push("/dashboard")
    } else {
      setError("Please enter valid credentials")
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#09090b]">
      {/* Left Column: Form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 py-12 z-10 bg-[#09090b]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[400px] mx-auto"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-neon-blue" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-100">DarkScope AI</span>
          </div>

          <h1 className="text-3xl font-medium tracking-tight text-zinc-100 mb-3">Welcome back</h1>
          <p className="text-zinc-400 text-sm mb-10">
            Sign in to access global threat intelligence and monitor dark web activities.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">Password</label>
                <button type="button" className="text-xs text-neon-blue hover:text-neon-blue/80 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 text-sm py-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {/* Demo Hint */}
            <div className="p-3 mt-2 rounded-lg bg-neon-blue/5 border border-neon-blue/10">
              <p className="text-xs text-neon-blue/80 text-center">
                <span className="font-semibold">Demo Mode:</span> You may use any credentials to sign in.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 mt-4 bg-zinc-100 hover:bg-white text-zinc-900 font-medium rounded-lg transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-16 flex items-center justify-between text-xs text-zinc-500">
            <p>Secure Enterprise Portal</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Visuals */}
      <div className="hidden lg:flex relative overflow-hidden bg-zinc-950 border-l border-zinc-900 items-center justify-center p-12">
        <AnimatedBackground />

        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-2xl p-8 border border-white/5 shadow-2xl backdrop-blur-xl bg-black/40"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-neon-blue animate-pulse" />
                <span className="text-sm font-medium tracking-wide text-zinc-300">Live Network Telemetry</span>
              </div>
              <Activity className="w-4 h-4 text-zinc-500" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <Globe className="w-5 h-5 text-neon-blue mb-3" />
                <div className="text-2xl font-semibold text-zinc-100 mb-1">2,841</div>
                <div className="text-xs text-zinc-500">Active .onion Nodes</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <Database className="w-5 h-5 text-neon-purple mb-3" />
                <div className="text-2xl font-semibold text-zinc-100 mb-1">1.4 TB</div>
                <div className="text-xs text-zinc-500">Threat Data Indexed</div>
              </div>
              <div className="col-span-2 p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Current Scan Engine</div>
                  <div className="text-sm font-medium text-zinc-300">Multi-AI Aggregation (Gemini + Llama)</div>
                </div>
                <Network className="w-5 h-5 text-zinc-600" />
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <p className="text-sm text-zinc-400 leading-relaxed italic">
                "DarkScope continuously monitors the deep and dark web, providing enterprise-grade visibility into compromised assets before they impact your infrastructure."
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

