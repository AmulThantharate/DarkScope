"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Shield, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react"
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
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate authentication
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (email && password) {
      router.push("/dashboard")
    } else {
      setError("Please enter valid credentials")
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo and title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon-blue/20 border border-neon-blue/30 mb-4"
            animate={{
              boxShadow: [
                "0 0 20px oklch(0.6 0.2 230 / 0.3)",
                "0 0 40px oklch(0.6 0.2 230 / 0.5)",
                "0 0 20px oklch(0.6 0.2 230 / 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-8 h-8 text-neon-blue" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <span className="text-neon-blue text-glow">Dark</span>
            <span className="text-neon-purple">Scope</span>
            <span className="text-neon-cyan"> AI</span>
          </h1>
          <p className="text-muted-foreground">Dark Web Threat Intelligence</p>
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-card rounded-2xl p-8 shadow-2xl"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email field */}
            <div className="relative">
              <motion.div
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === "email" ? "text-neon-blue" : "text-muted-foreground"
                }`}
              >
                <Mail className="w-5 h-5" />
              </motion.div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="Email address"
                className={`w-full pl-12 pr-4 py-4 bg-secondary/50 border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 ${
                  focusedField === "email"
                    ? "border-neon-blue shadow-[0_0_15px_oklch(0.6_0.2_230_/_0.3)]"
                    : "border-border hover:border-neon-blue/50"
                }`}
              />
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: focusedField === "email" ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Password field */}
            <div className="relative">
              <motion.div
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === "password" ? "text-neon-blue" : "text-muted-foreground"
                }`}
              >
                <Lock className="w-5 h-5" />
              </motion.div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="Password"
                className={`w-full pl-12 pr-12 py-4 bg-secondary/50 border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 ${
                  focusedField === "password"
                    ? "border-neon-blue shadow-[0_0_15px_oklch(0.6_0.2_230_/_0.3)]"
                    : "border-border hover:border-neon-blue/50"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-neon-blue transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: focusedField === "password" ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-high-risk text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {/* Login button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 bg-gradient-to-r from-neon-blue to-neon-purple text-primary-foreground font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.6_0.2_230_/_0.5)] disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner className="w-5 h-5" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Access Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              Authorized personnel only. All access is monitored and logged.
            </p>
          </div>
        </motion.div>

        {/* Bottom decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 flex items-center justify-center gap-4 text-muted-foreground text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-low-risk animate-pulse" />
            <span>System Online</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <span>v2.4.1</span>
        </motion.div>
      </motion.div>
    </main>
  )
}
