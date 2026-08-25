'use client'

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { appLogin } from "@/app/redux/slices/authSlice"
import { RotateCcw, User, Lock, Shield, Check, ArrowRight } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { decryptData } from "@/app/constants/encryption"


const PUZZLE_WIDTH = 320
const PUZZLE_HEIGHT = 160
const PIECE_SIZE = 45
const TRACK_WIDTH = PUZZLE_WIDTH - PIECE_SIZE
const TOLERANCE = 6


const getRandomPuzzleImage = () => {
  const uniqueSeed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
  return `https://picsum.photos/seed/${uniqueSeed}/${PUZZLE_WIDTH}/${PUZZLE_HEIGHT}`
}


const preloadImage = (url, onLoaded) => {
  const img = new Image()
  img.onload = () => onLoaded(url)
  img.onerror = () => onLoaded(url)
  img.src = url
}

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  const [touched, setTouched] = useState({ username: false, password: false, captcha: false })
  const [validationErrors, setValidationErrors] = useState({ username: "", password: "", captcha: "" })

  // ---- Puzzle captcha state ----
  const [puzzleImage, setPuzzleImage] = useState(() => getRandomPuzzleImage())
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [pieceTopPos, setPieceTopPos] = useState(20)
  const [targetX, setTargetX] = useState(150)
  const [sliderX, setSliderX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const pieceStartX = useRef(0)
  const dragStartClientX = useRef(0)

  const router = useRouter()
  const dispatch = useDispatch()
  const { loading: authLoading, error: authError } = useSelector((state) => state.auth)

  // ========== CANVAS ANIMATION - ADDED ONLY THIS ==========
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.id = 'bgAnimationCanvas'
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.zIndex = '0'
    canvas.style.pointerEvents = 'none'
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5 + 0.2
        this.alpha = Math.random() * 0.5 + 0.1
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x < 0) this.x = canvas.width
        if (this.x > canvas.width) this.x = 0
        if (this.y < 0) this.y = canvas.height
        if (this.y > canvas.height) this.y = 0
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139, 92, 246, ${this.alpha})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34, 211, 238, ${this.alpha * 0.7})`
        ctx.fill()
      }
    }

    const initParticles = () => {
      particles = []
      for (let i = 0; i < 60; i++) {
        particles.push(new Particle())
      }
    }

    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - distance / 100)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    let time = 0
    const animate = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Animated gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#060918')
      gradient.addColorStop(0.5, '#0a0f2a')
      gradient.addColorStop(1, '#030617')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Moving glow orbs
      time += 0.005
      for (let i = 0; i < 4; i++) {
        const x = canvas.width * (0.2 + i * 0.2) + Math.sin(time + i) * 50
        const y = canvas.height * 0.5 + Math.cos(time * 0.7 + i) * 40
        const radius = 120 + Math.sin(time * 0.5 + i) * 30

        const radialGrad = ctx.createRadialGradient(x, y, 0, x, y, radius)
        radialGrad.addColorStop(0, 'rgba(139, 92, 246, 0.08)')
        radialGrad.addColorStop(1, 'rgba(34, 211, 238, 0)')
        ctx.fillStyle = radialGrad
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      connectParticles()

      animationId = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', () => {
      resizeCanvas()
      initParticles()
    })

    resizeCanvas()
    initParticles()
    animate()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])
  // ========== END OF CANVAS ANIMATION ==========

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // ---- Puzzle captcha logic ----
  const generatePuzzle = () => {
    const maxX = TRACK_WIDTH - 10
    const minX = 60
    const newTargetX = Math.floor(Math.random() * (maxX - minX) + minX)
    const newTopPos = Math.floor(
      Math.random() * (PUZZLE_HEIGHT - PIECE_SIZE - 20) + 10
    )

    setTargetX(newTargetX)
    setPieceTopPos(newTopPos)
    setSliderX(0)
    setIsVerified(false)
    setIsFailed(false)

    // Loader dikhao tab tak jab nayi image fully load nahi ho jaati
    setIsImageLoading(true)
    const newUrl = getRandomPuzzleImage()
    preloadImage(newUrl, (loadedUrl) => {
      setPuzzleImage(loadedUrl)
      setIsImageLoading(false)
    })
  }

  useEffect(() => {
    generatePuzzle()
  }, [])

  const handleDragStart = (clientX) => {
    if (isVerified) return
    setIsDragging(true)
    setIsFailed(false)
    dragStartClientX.current = clientX
    pieceStartX.current = sliderX
  }

  const handleDragMove = (clientX) => {
    if (!isDragging || isVerified) return
    const delta = clientX - dragStartClientX.current
    let newX = pieceStartX.current + delta
    newX = Math.max(0, Math.min(newX, TRACK_WIDTH))
    setSliderX(newX)
  }

  const handleDragEnd = () => {
    if (!isDragging || isVerified) return
    setIsDragging(false)

    if (Math.abs(sliderX - targetX) <= TOLERANCE) {
      setSliderX(targetX)
      setIsVerified(true)
      if (touched.captcha) setValidationErrors(prev => ({ ...prev, captcha: "" }))
    } else {
      setIsFailed(true)
      setSliderX(0)
      setTimeout(() => setIsFailed(false), 600)
    }
  }

  const onMouseDown = (e) => {
    e.preventDefault()
    handleDragStart(e.clientX)
  }
  const onMouseMove = (e) => handleDragMove(e.clientX)
  const onMouseUp = () => handleDragEnd()
  const onTouchStart = (e) => handleDragStart(e.touches[0].clientX)
  const onTouchMove = (e) => handleDragMove(e.touches[0].clientX)
  const onTouchEnd = () => handleDragEnd()

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("mouseup", onMouseUp)
      window.addEventListener("touchmove", onTouchMove)
      window.addEventListener("touchend", onTouchEnd)
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, sliderX])

  const handleRefreshCaptcha = (e) => {
    if (e) e.preventDefault()
    generatePuzzle()
    setError("")
  }

  const validateUsername = (value) => {
    if (!value.trim()) return "Username is required"
    return ""
  }

  const validatePassword = (value) => {
    if (!value.trim()) return "Password is required"
    return ""
  }

  const validateCaptcha = () => {
    if (!isVerified) return "Please complete the puzzle captcha"
    return ""
  }

  const validateField = (field, value) => {
    let errorMsg = ""
    switch (field) {
      case "username": errorMsg = validateUsername(value); break
      case "password": errorMsg = validatePassword(value); break
      case "captcha": errorMsg = validateCaptcha(); break
    }
    setValidationErrors(prev => ({ ...prev, [field]: errorMsg }))
    return errorMsg === ""
  }

  const autoLogin = async (user, pass) => {
    try {
      const result = await dispatch(
        appLogin({
          username: user,
          password: pass,
        })
      ).unwrap()

      if (result.statusCode == 200) {
        router.push("/user/dashboard")
      } else {
        toast.error(result.message || "Login failed")
      }
    } catch (err) {
      toast.error(err || "Login failed")
    }
  }

  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const urlUsername = urlParams.get("username");
  //   const urlPassword = urlParams.get("password");

  //   if (urlUsername && urlPassword) {
  //     try {
  //       const decryptedUsername = decryptData(urlUsername);
  //       const decryptedPassword = decryptData(urlPassword);

  //       console.log("✅ Decrypted:", { decryptedUsername, decryptedPassword });

  //       // ✅ Sirf EK "XO" hatao
  //       let cleanUsername = decryptedUsername;
  //       if (cleanUsername && cleanUsername.startsWith("XO")) {
  //         cleanUsername = cleanUsername.substring(2);
  //       }

  //       console.log("✅ Final username:", cleanUsername);

  //       setUsername(cleanUsername);
  //       setPassword(decryptedPassword);
  //       setIsVerified(true);

  //       setTimeout(() => {
  //         autoLogin(cleanUsername, decryptedPassword);
  //       }, 300);

  //     } catch (error) {
  //       console.error("❌ Error:", error);
  //       toast.error("Invalid login link");
  //     }
  //   }
  // }, []);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const urlUsername = urlParams.get("username");
    const urlPassword = urlParams.get("password");

    if (urlUsername && urlPassword) {
      try {
        const decryptedUsername = decryptData(urlUsername);
        const decryptedPassword = decryptData(urlPassword);

        console.log("✅ Decrypted:", {
          decryptedUsername,
          decryptedPassword,
        });

        // ✅ XO ko remove nahi karna hai
        const finalUsername = decryptedUsername;

        console.log("✅ Final username:", finalUsername);

        setUsername(finalUsername);
        setPassword(decryptedPassword);
        setIsVerified(true);

        setTimeout(() => {
          autoLogin(finalUsername, decryptedPassword);
        }, 300);

      } catch (error) {
        console.error("❌ Error:", error);
        toast.error("Invalid login link");
      }
    }
  }, []);
  const handleFieldChange = (field, value) => {
    switch (field) {
      case "username": setUsername(value); break
      case "password": setPassword(value); break
    }
    if (touched[field]) validateField(field, value)
  }

  const handleFieldBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    let value = ""
    switch (field) {
      case "username": value = username; break
      case "password": value = password; break
    }
    validateField(field, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    setTouched({ username: true, password: true, captcha: true })

    const isUsernameValid = validateField("username", username)
    const isPasswordValid = validateField("password", password)
    const isCaptchaValid = validateField("captcha")

    if (!isUsernameValid || !isPasswordValid || !isCaptchaValid) {
      toast.error("Please fix the validation errors")
      return
    }

    try {
      const result = await dispatch(appLogin({ username, password })).unwrap()
      if (result.statusCode == 200) {
        router.push('/user/dashboard')
      } else {
        toast.error(result.message || "Login failed")
      }

    } catch (err) {
      toast.error(err || "Login failed")
      handleRefreshCaptcha()
    }
  }

  const handleInputFocus = (e) => {
    e.target.style.borderColor = "rgb(255 255 255 / 70%)5)"
    e.target.style.background = "rgba(139,92,246,0.09)"
    e.target.style.boxShadow = "none"
  }

  const handleInputBlurStyle = (e, hasError = false) => {
    e.target.style.borderColor = hasError ? "rgba(239,68,68,0.6)" : "rgba(139,92,246,0.2)"
    e.target.style.background = "rgba(139,92,246,0.05)"
    e.target.style.boxShadow = "none"
  }

  if (pageLoading) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100..900;1,100..900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/login.css" />
        <style jsx>{`
          .loader-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #060918 0%, #0a0f2a 100%);
            z-index: 9999;
          }
          .loader-spinner {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(139, 92, 246, 0.2);
            border-top: 3px solid #8b5cf6;
            border-right: 3px solid #22d3ee;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loader-text {
            margin-top: 20px;
            color: #8b5cf6;
            font-family: monospace;
            font-size: 14px;
            letter-spacing: 2px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
        <div className="loader-container">
          <div style={{ textAlign: "center" }}>
            <div className="loader-spinner"></div>
            <div className="loader-text">LOADING</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100..900;1,100..900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/assets/css/login.css" />
     <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#060918",
            color: "#e8e0fa",
            border: "1px solid rgba(34,232,212,0.25)",
            borderRadius: "12px",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#22e8d4", secondary: "#04060b" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#e8e0fa" } },
        }}
      />

      {/* Full-screen container */}
      <div className="login-theme min-vh-100 d-flex align-items-center justify-content-center px-3 py-5 position-relative overflow-hidden">
        {/* Orb - purple top-left */}
        <div className="position-absolute rounded-circle pe-none orb-purple" />

        {/* Orb - cyan bottom-right */}
        <div className="position-absolute rounded-circle pe-none orb-cyan" />

        {/* Orb - center */}
        <div className="position-absolute top-50 start-50 translate-middle rounded-circle pe-none orb-center" />

        {/* Card */}
        <div className="position-relative z-1 w-100 px-4 px-md-5 py-5 rounded-4 login-card">
          {/* Top shimmer line */}
          <div className="position-absolute top-0 start-50 translate-middle-x shimmer-line" />

          {/* Logo */}
          <div className="d-flex justify-content-center mb-2">
            <Link href='/'>
              <img src="/logo.png" alt="Logo" className="login-logo" />
            </Link>
          </div>

          {/* Sign In divider */}
          <div className="d-flex align-items-center gap-3 mt-4 mb-4">
            <div className="flex-grow-1 divider-line" />
            <span className="signin-text">Sign In</span>
            <div className="flex-grow-1 divider-line" />
          </div>

          <form onSubmit={handleSubmit}>
            {/* General error */}
            {error && (
              <div className="px-3 py-2 rounded-3 mb-3 general-error">
                ! {error}
              </div>
            )}

            {/* Username */}
            <div className="mb-3">
              <label className="login-label">Username</label>
              <div className="position-relative">
                <div className="position-absolute top-50 start-0 translate-middle-y ms-3 input-icon">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleFieldChange("username", e.target.value)}
                  onBlur={(e) => { handleFieldBlur("username"); handleInputBlurStyle(e, !!validationErrors.username && touched.username) }}
                  placeholder="Enter Username"
                  className={`form-control login-input ps-5 ${touched.username && validationErrors.username ? 'login-input-error' : ''}`}
                  onFocus={handleInputFocus}
                />
              </div>
              {touched.username && validationErrors.username && (
                <div className="error-message">⚠ {validationErrors.username}</div>
              )}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="login-label">Password</label>
              <div className="position-relative">
                <div className="position-absolute top-50 start-0 translate-middle-y ms-3 input-icon">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  onBlur={(e) => { handleFieldBlur("password"); handleInputBlurStyle(e, !!validationErrors.password && touched.password) }}
                  placeholder="Enter Password"
                  className={`form-control ps-5 pe-5 login-input ${touched.password && validationErrors.password ? 'login-input-error' : ''}`}
                  onFocus={handleInputFocus}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent me-2 password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {touched.password && validationErrors.password && (
                <div className="error-message">⚠ {validationErrors.password}</div>
              )}
              <div className="d-flex justify-content-end mt-1">
                <button
                  type="button"
                  onClick={() => router.push('/user/forgot')}
                  className="border-0 bg-transparent p-0 forgot-password"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* ---------------- Puzzle Image CAPTCHA ---------------- */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="login-label mb-0">Slide to complete the puzzle</label>
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  className="captcha-btn"
                  title="Refresh puzzle"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: "8px",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#c4b5fd",
                  }}
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Puzzle image with gap + piece overlay */}
              <div
                style={{
                  position: "relative",
                  width: PUZZLE_WIDTH,
                  maxWidth: "100%",
                  height: PUZZLE_HEIGHT,
                  margin: "0 auto",
                  overflow: "hidden",
                  borderRadius: 10,
                  border: "1px solid rgba(139,92,246,0.3)",
                  userSelect: "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={puzzleImage}
                  alt="Captcha puzzle"
                  draggable={false}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    pointerEvents: "none",
                    opacity: isImageLoading ? 0 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                />

                {/* Loader shown while the new puzzle image is loading */}
                {isImageLoading && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(6,9,24,0.85)",
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        border: "3px solid rgba(139,92,246,0.25)",
                        borderTop: "3px solid #8b5cf6",
                        borderRight: "3px solid #22d3ee",
                        borderRadius: "50%",
                        animation: "puzzleSpin 0.7s linear infinite",
                      }}
                    />
                    <style jsx>{`
                      @keyframes puzzleSpin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                )}

                {/* Empty gap (hole) at target position */}
                {!isImageLoading && (
                  <div
                    style={{
                      position: "absolute",
                      left: targetX,
                      top: pieceTopPos,
                      width: PIECE_SIZE,
                      height: PIECE_SIZE,
                      borderRadius: 6,
                      border: "2px dashed rgba(255,255,255,0.8)",
                      background: "rgba(0,0,0,0.35)",
                    }}
                  />
                )}

                {/* Draggable puzzle piece */}
                {!isImageLoading && (
                  <div
                    onMouseDown={onMouseDown}
                    onTouchStart={onTouchStart}
                    style={{
                      position: "absolute",
                      left: sliderX,
                      top: pieceTopPos,
                      width: PIECE_SIZE,
                      height: PIECE_SIZE,
                      borderRadius: 6,
                      overflow: "hidden",
                      border: `2px solid ${isVerified ? "#22d3ee" : isFailed ? "#ef4444" : "#ffffff"}`,
                      boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                      cursor: isVerified ? "default" : "grab",
                      backgroundImage: `url(${puzzleImage})`,
                      backgroundSize: `${PUZZLE_WIDTH}px ${PUZZLE_HEIGHT}px`,
                      backgroundPosition: `-${targetX}px -${pieceTopPos}px`,
                    }}
                  />
                )}

                {isVerified && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#22d3ee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={14} color="#060918" />
                  </div>
                )}
              </div>

              {/* Slider track */}
              <div
                style={{
                  position: "relative",
                  width: PUZZLE_WIDTH,
                  maxWidth: "100%",
                  height: 40,
                  margin: "8px auto 0",
                  borderRadius: 8,
                  background: isVerified
                    ? "rgba(34,211,238,0.1)"
                    : isFailed
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(139,92,246,0.05)",
                  border: `1px solid ${isVerified
                      ? "rgba(34,211,238,0.5)"
                      : isFailed
                        ? "rgba(239,68,68,0.5)"
                        : "rgba(139,92,246,0.2)"
                    }`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                >
                  {isImageLoading
                    ? "Loading puzzle..."
                    : isVerified
                      ? "Verified!"
                      : isFailed
                        ? "Try again"
                        : "Drag the piece to match the puzzle"}
                </div>
                <div
                  onMouseDown={isImageLoading ? undefined : onMouseDown}
                  onTouchStart={isImageLoading ? undefined : onTouchStart}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    cursor: isImageLoading ? "not-allowed" : isVerified ? "default" : "grab",
                    background: isVerified ? "#22d3ee" : isFailed ? "#ef4444" : "#8b5cf6",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    opacity: isImageLoading ? 0.5 : 1,
                    transform: `translateX(${sliderX}px)`,
                    transition: isDragging ? "none" : "transform 0.2s ease",
                  }}
                >
                  {isVerified ? <Check size={18} /> : <ArrowRight size={18} />}
                </div>
              </div>

              {/* Captcha validation error */}
              {touched.captcha && validationErrors.captcha && (
                <div className="error-message">⚠ {validationErrors.captcha}</div>
              )}
            </div>
            {/* -------------- End Puzzle CAPTCHA -------------- */}

            {/* Submit button */}
            <button
              type="submit"
              disabled={authLoading}
              className={`btn w-100 d-flex align-items-center justify-content-center gap-2 fw-bold text-uppercase mt-2 login-submit ${authLoading ? 'login-submit-loading' : ''}`}
            >
              {authLoading && (
                <span className="spinner-border spinner-border-sm spinner-white" />
              )}
              {authLoading ? "Logging In..." : "Login Now"}
            </button>
          </form>

          {/* OR separator */}
          <div className="d-flex align-items-center gap-2 my-4">
            <div className="flex-grow-1 or-divider" />
            <span className="or-text">or</span>
            <div className="flex-grow-1 or-divider" />
          </div>

          {/* Signup button */}
          <button
            onClick={() => router.push('/user/register')}
            className="btn w-100 signup-button"
          >
            Create an account
          </button>
        </div>
      </div>
    </>
  )
}