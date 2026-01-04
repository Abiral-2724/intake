"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Replace with your actual Turnstile site key
const TURNSTILE_SITE_KEY = "0x4AAAAAACJ4iix3SZQIUtNj"
// Backend API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
        theme?: 'light' | 'dark' | 'auto'
        size?: 'normal' | 'compact'
      }) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
      getResponse: (widgetId: string) => string
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentView, setCurrentView] = useState<"login" | "register" | "forgot" | "otp">("login")
  const RESEND_DELAY = 90 // seconds
const [resendTimer, setResendTimer] = useState(0)

  // Auth state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState<string>("")
  const [turnstileLoaded, setTurnstileLoaded] = useState(false)
  const turnstileWidgetId = useRef<string>("")
  const turnstileContainer = useRef<HTMLDivElement>(null)

  // Load Turnstile script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => setTurnstileLoaded(true)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  // Render Turnstile widget when view changes
  useEffect(() => {
    if (!turnstileLoaded || !window.turnstile || !turnstileContainer.current) return

    // Render for login, register, forgot password, and OTP views
    if (currentView !== "login" && currentView !== "register" && currentView !== "forgot" && currentView !== "otp") {
      if (turnstileWidgetId.current) {
        window.turnstile.remove(turnstileWidgetId.current)
        turnstileWidgetId.current = ""
      }
      return
    }

    // Remove existing widget if present
    if (turnstileWidgetId.current) {
      window.turnstile.remove(turnstileWidgetId.current)
    }

    // Render new widget
    try {
      turnstileWidgetId.current = window.turnstile.render(turnstileContainer.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          setTurnstileToken(token)
        },
        'error-callback': () => {
          toast.error("Verification Error", {
            description: "Please refresh and try again",
          })
          setTurnstileToken("")
        },
        'expired-callback': () => {
          setTurnstileToken("")
          toast.error("Verification Expired", {
            description: "Please complete the verification again",
          })
        },
        theme: 'light',
        size: 'normal'
      })
    } catch (error) {
      console.error("Turnstile render error:", error)
    }

    return () => {
      if (turnstileWidgetId.current) {
        window.turnstile.remove(turnstileWidgetId.current)
        turnstileWidgetId.current = ""
      }
    }
  }, [currentView, turnstileLoaded])

  useEffect(() => {
    if (resendTimer <= 0) return
  
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1)
    }, 1000)
  
    return () => clearInterval(interval)
  }, [resendTimer])

  // Reset Turnstile widget
  const resetTurnstile = () => {
    if (turnstileWidgetId.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetId.current)
      setTurnstileToken("")
    }
  }

  // Validate Turnstile token on Express backend
  const validateTurnstileToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/verify-turnstile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const result = await response.json()
      return result.success === true
    } catch (error) {
      console.error('Turnstile validation error:', error)
      toast.error("Connection Error", {
        description: "Could not connect to server. Please try again.",
      })
      return false
    }
  }

  // OAuth sign in
  const signInWithProvider = async (provider: "google" | "github") => {
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error("Access Denied", {
        description: error.message || "OAuth sign in failed",
      })
    }
    setLoading(false)
  }

  // Send OTP email with Turnstile verification
  const sendEmail = async (isResend = false) => {
    if (!email) {
      toast.error("Email Required", {
        description: "Please enter your email address",
      })
      return
    }

    if (!turnstileToken) {
      toast.error("Verification Required", {
        description: "Please complete the security verification",
      })
      return
    }

    setLoading(true)

    // Validate Turnstile token on Express backend
    const isValid = await validateTurnstileToken(turnstileToken)
    
    if (!isValid) {
      toast.error("Verification Failed", {
        description: "Security verification failed. Please try again.",
      })
      resetTurnstile()
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error("Access Denied", {
        description: error.message || "Failed to send email",
      })
      resetTurnstile()
    } else {
      if (!isResend) {
        setCurrentView("otp")
      }
      setResendTimer(RESEND_DELAY)
      toast.success("Check Your Email", {
        description: isResend ? "Code resent successfully" : "We've sent you a 6-digit code",
      })
      resetTurnstile()
    }

    setLoading(false)
  }

  // Verify OTP
  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Invalid OTP", {
        description: "Please enter a valid 6-digit OTP",
      })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    })

    if (error) {
      toast.error("Access Denied", {
        description: "Invalid or expired OTP",
      })
      setCurrentView("login")
    } else {
      toast.success("Success", {
        description: "Successfully authenticated",
      })
      router.replace("/dashboard")
    }

    setLoading(false)
  }

  // Resend OTP with Turnstile verification
  const resendOtp = async () => {
    if (resendTimer > 0) {
      toast.error("Please wait", {
        description: `You can resend OTP in ${resendTimer} seconds`,
      })
      return
    }
    if (!turnstileToken) {
      toast.error("Verification Required", {
        description: "Please complete the security verification before resending",
      })
      return
    }

    await sendEmail(true)
  }

  // Handle traditional login
  const handleLogin = () => {
    if (!email || !password) {
      toast.error("Missing Fields", {
        description: "Please enter both email and password",
      })
      return
    }
    console.log("Traditional login:", email, password)
  }

  // Handle registration with Turnstile verification
  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error("Missing Fields", {
        description: "Please fill in all fields",
      })
      return
    }
    if (password !== confirmPassword) {
      toast.error("Password Mismatch", {
        description: "Passwords do not match",
      })
      return
    }

    if (!turnstileToken) {
      toast.error("Verification Required", {
        description: "Please complete the security verification",
      })
      return
    }

    setLoading(true)

    // Validate Turnstile token on Express backend
    const isValid = await validateTurnstileToken(turnstileToken)
    
    if (!isValid) {
      toast.error("Verification Failed", {
        description: "Security verification failed. Please try again.",
      })
      resetTurnstile()
      setLoading(false)
      return
    }

    // Proceed with registration
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error("Registration Failed", {
        description: error.message || "Could not create account",
      })
      resetTurnstile()
    } else {
      toast.success("Account Created", {
        description: "Please check your email to verify your account",
      })
      setCurrentView("login")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex font-sans">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ backgroundColor: "#3F3FF3" }}>
        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-white flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" width="170" height="50" viewBox="0 0 600 160">
                <text x="40" y="110"
                      fill="#000000"
                      fontSize="104"
                      fontWeight="700"
                      letterSpacing="-4"
                      fontFamily="Arial, Helvetica, sans-serif">
                  intake
                </text>
              </svg>
              <img 
                src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766659954/favicon_wghbca.svg" 
                alt="" 
                className="w-2.5 h-2.5 mt-3 ml-[-78px]"
              />
            </h1>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl text-white mb-6 leading-tight">Effortlessly manage your team and operations.</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Log in to access your CRM dashboard and manage your team.
            </p>
          </div>

          <div className="flex justify-between items-center text-white/70 text-sm">
            <span>Copyright © 2025 intake.com</span>
            <span className="cursor-pointer hover:text-white/90">Privacy Policy</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <h1 className="text-xl font-semibold text-white flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" width="170" height="50" viewBox="0 0 600 160">
                <text x="40" y="110"
                      fill="#000000"
                      fontSize="104"
                      fontWeight="700"
                      letterSpacing="-4"
                      fontFamily="Arial, Helvetica, sans-serif">
                  intake
                </text>
              </svg>
              <img 
                src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766659954/favicon_wghbca.svg" 
                alt="" 
                className="w-2.5 h-2.5 mt-3 ml-[-78px]"
              />
            </h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center">
              {(currentView === "forgot" || currentView === "otp") && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView("login")}
                  className="absolute left-8 top-8 p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h2 className="text-3xl text-foreground">
                {currentView === "login" && "Welcome Back"}
                {currentView === "register" && "Create Account"}
                {currentView === "forgot" && "Reset Password"}
                {currentView === "otp" && "Verify Your Email"}
              </h2>
              <p className="text-muted-foreground">
                {currentView === "login" && "Enter your email to receive a magic link or login code."}
                {currentView === "register" && "Create a new account to get started with intake."}
                {currentView === "forgot" && "Enter your email address and we'll send you a reset link."}
                {currentView === "otp" && "Check your email for a 6-digit login code."}
              </p>
            </div>

            <div className="space-y-4">
              {currentView === "otp" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium text-foreground">
                      Enter OTP Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#3F3FF3] text-center text-lg tracking-widest"
                    />
                  </div>

                  <Button
                    className="w-full h-12 text-sm font-medium text-white hover:opacity-90 rounded-lg shadow-none cursor-pointer"
                    style={{ backgroundColor: "#3F3FF3" }}
                    onClick={verifyOtp}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>

                  {/* Turnstile Widget for Resend OTP */}
                  <div className="flex justify-center py-2">
                    <div ref={turnstileContainer} />
                  </div>

                  <div className="text-center">
                  <Button
  variant="link"
  onClick={resendOtp}
  disabled={loading || resendTimer > 0 || !turnstileToken}
>
  {resendTimer > 0
    ? `Resend in ${resendTimer}s`
    : "Resend Code"}
</Button>

                  </div>
                </>
              ) : (
                <>
                  {currentView === "register" && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-foreground">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#3F3FF3]"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#3F3FF3]"
                    />
                  </div>

                  {currentView !== "forgot" && currentView !== "login" && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#3F3FF3]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentView === "register" && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#3F3FF3]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Turnstile Widget - Shown for login, register, and forgot password */}
                  <div className="flex justify-center py-2">
                    <div ref={turnstileContainer} />
                  </div>

                  {currentView === "login" && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="remember" className="rounded border-gray-300 cursor-pointer" />
                        <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                          Remember Me
                        </Label>
                      </div>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm hover:text-opacity-80 cursor-pointer"
                        style={{ color: "#3F3FF3" }}
                        onClick={() => setCurrentView("forgot")}
                      >
                        Forgot Your Password?
                      </Button>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 text-sm font-medium text-white hover:opacity-90 rounded-lg shadow-none cursor-pointer"
                    style={{ backgroundColor: "#3F3FF3" }}
                    onClick={() => {
                      if (currentView === "login") sendEmail()
                      else if (currentView === "register") handleRegister()
                      else if (currentView === "forgot") sendEmail()
                    }}
                    disabled={loading || !turnstileToken}
                  >
                    {loading ? "Please wait..." : (
                      <>
                        {currentView === "login" && "Send Magic Link"}
                        {currentView === "register" && "Create Account"}
                        {currentView === "forgot" && "Send Reset Link"}
                      </>
                    )}
                  </Button>

                  {currentView !== "forgot" && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">
                            Or {currentView === "login" ? "Login" : "Sign Up"} With
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          className="h-12 border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg bg-white shadow-none cursor-pointer"
                          onClick={() => signInWithProvider("google")}
                          disabled={loading}
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Google
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg bg-white shadow-none cursor-pointer"
                          onClick={() => signInWithProvider("github")}
                          disabled={loading}
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          GitHub
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}

              {currentView !== "otp" && (
                <div className="text-center text-sm text-muted-foreground">
                  {currentView === "login" && (
                    <>
                      Don't Have An Account?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer"
                        style={{ color: "#3F3FF3" }}
                        onClick={() => setCurrentView("register")}
                      >
                        Register Now.
                      </Button>
                    </>
                  )}
                  {currentView === "register" && (
                    <>
                      Already Have An Account?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer"
                        style={{ color: "#3F3FF3" }}
                        onClick={() => setCurrentView("login")}
                      >
                        Sign In.
                      </Button>
                    </>
                  )}
                  {currentView === "forgot" && (
                    <>
                      Remember Your Password?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer"
                        style={{ color: "#3F3FF3" }}
                        onClick={() => setCurrentView("login")}
                      >
                        Back to Login.
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}