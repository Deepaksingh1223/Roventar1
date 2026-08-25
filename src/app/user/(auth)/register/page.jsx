
'use client'

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Select from "react-select"
import { userRegistration, getAllCountry, getReferralDataByLoginId } from "@/app/redux/slices/authSlice"
import { Toaster, toast } from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { User, Mail, Lock, Phone, Globe, UserPlus, RotateCcw, Check, ArrowRight, Users } from "lucide-react"

// ---------------------------------------------------------------------------
// IMAGE PUZZLE CAPTCHA COMPONENT
// ---------------------------------------------------------------------------

const PUZZLE_HEIGHT = 170
const PIECE_SIZE = 56      // plain square piece size
const TOLERANCE = 10       // px tolerance for success
const IMAGE_FETCH_WIDTH = 1000

const getRandomPuzzleImage = () => {
  const uniqueSeed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
  return `https://picsum.photos/seed/${uniqueSeed}/${IMAGE_FETCH_WIDTH}/${PUZZLE_HEIGHT}`
}

const preloadImage = (url, onLoaded) => {
  const img = new Image()
  img.onload = () => onLoaded(url)
  img.onerror = () => onLoaded(url)
  img.src = url
}

function ImagePuzzleCaptcha({ verified, onVerify, onReset }) {
  const stageRef = useRef(null)
  const trackRef = useRef(null)
  const [stageWidth, setStageWidth] = useState(0)
  const [image, setImage] = useState(() => getRandomPuzzleImage())
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [targetX, setTargetX] = useState(0)
  const [targetY, setTargetY] = useState(0)
  const [pieceX, setPieceX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [failed, setFailed] = useState(false)

  const maxX = Math.max(0, stageWidth - PIECE_SIZE)

  useEffect(() => {
    if (!stageRef.current) return
    const update = () => setStageWidth(stageRef.current.offsetWidth)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(stageRef.current)
    return () => observer.disconnect()
  }, [])

  const generatePuzzle = useCallback(() => {
    if (stageWidth <= 0) return
    const minX = Math.min(130, maxX * 0.4)
    const tx = Math.floor(minX + Math.random() * (maxX - minX - 10))
    const ty = Math.floor(Math.random() * (PUZZLE_HEIGHT - PIECE_SIZE))
    setTargetX(Math.max(0, tx))
    setTargetY(Math.max(0, ty))
    setPieceX(0)
    setFailed(false)

    setIsImageLoading(true)
    const newUrl = getRandomPuzzleImage()
    preloadImage(newUrl, (loadedUrl) => {
      setImage(loadedUrl)
      setIsImageLoading(false)
    })
  }, [maxX, stageWidth])

  useEffect(() => {
    if (stageWidth > 0) generatePuzzle()
  }, [stageWidth])

  const handleReset = () => {
    generatePuzzle()
    onReset?.()
  }

  const startDrag = () => {
    if (verified || isImageLoading) return
    setDragging(true)
    setFailed(false)
  }

  const moveDrag = useCallback((clientX) => {
    if (!dragging || !trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const handleW = 44
    const usable = rect.width - handleW
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left - handleW / 2) / usable))
    const nextX = Math.round(fraction * maxX)
    setPieceX(Math.max(0, Math.min(maxX, nextX)))
  }, [dragging, maxX])

  const endDrag = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    setPieceX((current) => {
      if (Math.abs(current - targetX) <= TOLERANCE) {
        // Fix: Use setTimeout to defer the state update to avoid rendering conflict
        setTimeout(() => onVerify(true), 0)
        return targetX
      }
      setFailed(true)
      setTimeout(() => setFailed(false), 900)
      return 0
    })
  }, [dragging, targetX, onVerify])

  useEffect(() => {
    const onMouseMove = (e) => moveDrag(e.clientX)
    const onTouchMove = (e) => moveDrag(e.touches[0].clientX)
    const onUp = () => endDrag()

    if (dragging) {
      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("touchmove", onTouchMove, { passive: false })
      window.addEventListener("mouseup", onUp)
      window.addEventListener("touchend", onUp)
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("touchend", onUp)
    }
  }, [dragging, moveDrag, endDrag])

  const trackFraction = maxX > 0 ? (verified ? 1 : pieceX / maxX) : 0

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, color: "#fff" }}>
          Slide to complete the puzzle
        </span>
        <button
          type="button"
          onClick={handleReset}
          title="Refresh puzzle"
          style={{
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(34, 232, 212, 0.08)",
            border: "1px solid rgba(34, 232, 212, 0.25)",
            borderRadius: 8,
            color: "#22e8d4",
            cursor: "pointer",
          }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div
        ref={stageRef}
        style={{
          position: "relative",
          width: "100%",
          height: PUZZLE_HEIGHT,
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid rgba(34, 232, 212, 0.25)",
          background: "#0a1120",
          userSelect: "none",
          isolation: "isolate",
        }}
      >
        <img
          src={image}
          alt="captcha"
          draggable={false}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "none",
            opacity: isImageLoading ? 0 : 1,
            transition: "opacity 0.15s ease",
          }}
        />

        {isImageLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(4,6,11,0.9)",
              zIndex: 3,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                border: "3px solid rgba(34,232,212,0.25)",
                borderTop: "3px solid #22e8d4",
                borderRight: "3px solid #cba463",
                borderRadius: "50%",
                animation: "puzzleSpin 0.7s linear infinite",
              }}
            />
          </div>
        )}

        {!isImageLoading && (
          <div
            style={{
              position: "absolute",
              left: targetX,
              top: targetY,
              width: PIECE_SIZE,
              height: PIECE_SIZE,
              border: "2px solid rgba(255,255,255,0.9)",
              background: "rgba(255,255,255,0.15)",
              boxShadow: "0 0 0 9999px rgba(4,6,20,0.35)",
              borderRadius: 4,
              pointerEvents: "none",
            }}
          />
        )}

        {!isImageLoading && (
          <div
            style={{
              position: "absolute",
              left: Math.max(0, Math.min(maxX, pieceX)),
              top: targetY,
              width: PIECE_SIZE,
              height: PIECE_SIZE,
              borderRadius: 4,
              border: verified ? "2px solid #22c55e" : "2px solid #fff",
              backgroundImage: `url(${image})`,
              backgroundSize: `${stageWidth}px ${PUZZLE_HEIGHT}px`,
              backgroundPosition: `-${targetX}px -${targetY}px`,
              backgroundRepeat: "no-repeat",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              cursor: verified ? "default" : "grab",
              animation: failed ? "puzzleShakeAnim 0.4s" : "none",
              transition: dragging ? "none" : "left 0.15s ease",
              zIndex: 2,
            }}
          />
        )}
      </div>

      <div
        ref={trackRef}
        style={{
          position: "relative",
          marginTop: 10,
          height: 44,
          width: "100%",
          background: "rgba(34, 232, 212, 0.05)",
          border: "1px solid rgba(34, 232, 212, 0.15)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${trackFraction * 100}%`,
            background: "rgba(34, 232, 212, 0.15)",
            pointerEvents: "none",
          }}
        />
        <div
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          style={{
            position: "absolute",
            top: 0,
            left: `calc(${trackFraction * 100}% - ${trackFraction * 44}px)`,
            width: 44,
            height: 44,
            borderRadius: 10,
            background: verified
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "linear-gradient(135deg, #22e8d4, #17b8a8)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            cursor: isImageLoading ? "not-allowed" : verified ? "default" : "grab",
            opacity: isImageLoading ? 0.5 : 1,
            zIndex: 2,
          }}
        >
          {verified ? "✓" : "→"}
        </div>
        <span
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: 13,
            color: "#fff",
            pointerEvents: "none",
          }}
        >
          {isImageLoading
            ? "Loading puzzle..."
            : verified
            ? "Verified"
            : failed
            ? "Not quite — try again"
            : "Drag the piece to match the puzzle"}
        </span>
      </div>

      <style jsx global>{`
        @keyframes puzzleShakeAnim {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @keyframes puzzleSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}


export default function SignupPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const initialReferralId = searchParams.get('ref') || ''
  const initialIntroSide = (() => {
    const pos = searchParams.get('Position')
    if (pos === 'L') return 'L'
    if (pos === 'R') return 'R'
    return ''
  })()
  const [pageLoading, setPageLoading] = useState(true)

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "",
    password: "", phoneNo: "", countryId: "",
    referralId: initialReferralId,
    introSide: initialIntroSide,
  })

  const [countryOptions, setCountryOptions] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [referralData, setReferralData] = useState(null)
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralError, setReferralError] = useState("")
  const [referralBlurCalled, setReferralBlurCalled] = useState(!!initialReferralId)

  const [errors, setErrors] = useState({
    firstName: "", lastName: "", email: "",
    password: "", phoneNo: "", countryId: "", captcha: "", referralId: "", introSide: "",
  })

  const introSideOptions = [
    { value: "L", label: "Team Left" },
    { value: "R", label: "Team Right" },
  ]

  // ========== CANVAS ANIMATION ==========
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

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#060918')
      gradient.addColorStop(0.5, '#0a0f2a')
      gradient.addColorStop(1, '#030617')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

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

  useEffect(() => {
    if (initialReferralId) {
      validateReferralId(initialReferralId)
    }
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const res = await dispatch(getAllCountry()).unwrap()
        if (res?.statusCode === 200 && res.data) {
          const options = res.data
            .filter((c) => c.isActive)
            .map((c) => ({
              value: c.country_Id,
              label: c.country_Name,
              dialCode: c.phonecode,
              flagUrl: c.countryFlag,
              countryCode: c.country_Code?.trim(),
              phonecode: c.phonecode,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
          setCountryOptions(options)
        }
      } catch (err) {
        toast.error("Failed to load countries. Please refresh.")
      }
    })()
  }, [])

  const validateReferralId = async (referralId) => {
    if (!referralId.trim()) {
      setReferralError("")
      setReferralData(null)
      return false
    }

    setReferralLoading(true)
    setReferralError("")

    try {
      const res = await dispatch(getReferralDataByLoginId(referralId)).unwrap()

      if (res?.statusCode === 200 && res?.data) {
        setReferralData(res.data)
        setReferralError("")
        setErrors(prev => ({ ...prev, referralId: "" }))
        return true
      } else {
        setReferralData(null)
        setReferralError(res?.message || "Invalid referral ID")
        setErrors(prev => ({ ...prev, referralId: res?.message || "Invalid referral ID" }))
        return false
      }
    } catch (err) {
      setReferralData(null)
      setReferralError(err?.toString() || "Failed to validate referral ID")
      setErrors(prev => ({ ...prev, referralId: err?.toString() || "Failed to validate referral ID" }))
      return false
    } finally {
      setReferralLoading(false)
    }
  }

  const [typingTimer, setTypingTimer] = useState(null)
  const handleReferralChange = (e) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, referralId: value }))

    if (typingTimer) clearTimeout(typingTimer)

    setReferralBlurCalled(false)
    setReferralData(null)
    setReferralError("")

    if (value.trim()) {
      setTypingTimer(
        setTimeout(() => {
          setReferralBlurCalled(true)
          validateReferralId(value)
        }, 1000)
      )
    } else {
      setErrors(prev => ({ ...prev, referralId: "" }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "phoneNo") {
      if (!/^\d*$/.test(value)) return
      if (value.length > 13) return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleCountryChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      countryId: selectedOption?.value || "",
      phonecode: selectedOption?.phonecode || "",
    }))
    if (errors.countryId) setErrors(prev => ({ ...prev, countryId: "" }))
  }

  const handleIntroSideChange = (selectedOption) => {
    setFormData(prev => ({ ...prev, introSide: selectedOption?.value || "" }))
    if (errors.introSide) setErrors(prev => ({ ...prev, introSide: "" }))
  }

  const handleCaptchaVerify = (isVerified) => {
    setCaptchaVerified(isVerified)
    if (isVerified) setErrors(prev => ({ ...prev, captcha: "" }))
  }

  const handleCaptchaReset = () => {
    setCaptchaVerified(false)
  }

  const validateForm = () => {
    let newErrors = { firstName: "", lastName: "", email: "", password: "", phoneNo: "", countryId: "", captcha: "", referralId: "", introSide: "" }

    if (!formData.firstName?.trim()) newErrors.firstName = "First name is required"
    else if (formData.firstName.trim().length < 2) newErrors.firstName = "At least 2 characters"

    if (!formData.lastName?.trim()) newErrors.lastName = "Last name is required"
    else if (formData.lastName.trim().length < 2) newErrors.lastName = "At least 2 characters"

    if (!formData.email?.trim()) newErrors.email = "Email is required"
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Enter a valid email"

    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 6) newErrors.password = "Min 6 characters"

    if (!formData.phoneNo) newErrors.phoneNo = "Mobile number is required"
    else if (formData.phoneNo.length < 8 || formData.phoneNo.length > 13) newErrors.phoneNo = "Phone number must be 8-13 digits"

    if (!formData.countryId) newErrors.countryId = "Please select a country"

    if (!formData.referralId?.trim()) newErrors.referralId = "Referral ID is required"
    else if (referralError) newErrors.referralId = referralError

    if (!formData.introSide) newErrors.introSide = "Please select Intro Side"

    if (!captchaVerified) newErrors.captcha = "Please complete the puzzle captcha"

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== "")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    if (!referralData && formData.referralId.trim()) {
      const isValid = await validateReferralId(formData.referralId)
      if (!isValid) {
        toast.error("Please enter a valid referral ID")
        return
      }
    }

    setLoading(true)
    try {
      const payload = {
        introAuthlogin: formData.referralId || "",
        password: formData.password,
        fName: formData.firstName,
        lName: formData.lastName,
        mobile: formData.phoneNo,
        email: formData.email,
        countryId: parseInt(formData.countryId),
        address: "",
        introSide: formData.introSide,
      }

      const res = await dispatch(userRegistration(payload)).unwrap()

      if (res?.statusCode !== 200) throw new Error(res?.message || "Signup failed")

      toast.success("Account created successfully!")

      if (typeof window !== "undefined") {
        localStorage.setItem("welcomeData", JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          authLogin: formData.email,
          authPassword: formData.password,
        }))
      }

      setFormData({
        firstName: "", lastName: "", email: "", password: "",
        phoneNo: "", countryId: "",
        referralId: "", introSide: ""
      })
      setReferralData(null)
      setCaptchaVerified(false)
      setTimeout(() => router.push("/user/welcome"), 1500)
    } catch (err) {
      toast.error(err.message || err || "Signup failed")
      setCaptchaVerified(false)
    } finally {
      setLoading(false)
    }
  }

  // ── react-select styles ──────────────────────────────────────────────────
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "rgba(255,255,255,0.04)",
      borderColor: state.isFocused ? "#22e8d4" : "rgba(140,180,200,0.24)",
      borderRadius: "0.75rem",
      minHeight: "48px",
      boxShadow: "none",
      transition: "all 0.2s",
      cursor: "pointer",
      "&:hover": { borderColor: "rgba(34,232,212,0.55)" },
    }),

    menuList: (base) => ({ ...base, padding: "4px", maxHeight: "200px" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "rgba(34,232,212,0.1)" : "transparent",
      color: "#eef3f8",
      fontSize: "13px",
      borderRadius: "8px",
      cursor: "pointer",
      padding: "8px 10px",
    }),
    singleValue: (base) => ({ ...base, color: "#eef3f8", fontSize: "14px" }),
    placeholder: (base) => ({ ...base, color: "#8ea0b5", fontSize: "14px" }),
    input: (base) => ({ ...base, color: "#eef3f8", fontSize: "14px" }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "#8ea0b5",
      "&:hover": { color: "#22e8d4" },
    }),
  }

  const formatOptionLabel = ({ label, dialCode, flagUrl }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <img src={flagUrl} alt={label} className="country-flag" />
      <span className="country-label">{label}</span>
      <span className="country-dial-code">+{dialCode}</span>
    </div>
  )

  const handleFocus = (e) => {
    e.target.style.borderColor = "rgb(255 255 255 / 70%)"
    e.target.style.background = "rgba(34,232,212,0.08)"
    e.target.style.boxShadow = "none"
  }

  const handleBlurStyle = (e, hasError) => {
    e.target.style.borderColor = hasError ? "rgba(239,68,68,0.45)" : "rgba(140,180,200,0.24)"
    e.target.style.background = "rgba(255,255,255,0.04)"
    e.target.style.boxShadow = "none"
  }

  const errorStyle = {
    color: "#f87171",
    fontSize: "11px",
    marginTop: "4px",
    fontFamily: "monospace",
  }

  const iconStyle = {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#22e8d4",
    pointerEvents: "none",
  }

  if (pageLoading) {
    return (
      <>
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

      <div className="login-theme min-vh-100 d-flex align-items-center justify-content-center px-3 py-5 position-relative overflow-hidden">
        <div className="position-absolute rounded-circle pe-none orb-purple" />
        <div className="position-absolute rounded-circle pe-none orb-cyan" />
        <div className="position-absolute top-50 start-50 translate-middle rounded-circle pe-none orb-center" />

        <div className="position-relative z-1 w-100 px-4 px-md-5 py-5 rounded-4 signup-card login-card">
          <div className="position-absolute top-0 start-50 translate-middle-x shimmer-line" />

          <div className="d-flex justify-content-center mb-2">
            <Link href='/'>
              <img src="/logo.png" alt="Logo" className="login-logo" />
            </Link>
          </div>

          <div className="d-flex align-items-center gap-3 mt-4 mb-4">
            <div className="flex-grow-1 divider-line" />
            <span className="login-label">Create Account</span>
            <div className="flex-grow-1 divider-line" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              {[
                { name: "firstName", label: "First Name", placeholder: "Enter First Name", error: errors.firstName },
                { name: "lastName", label: "Last Name", placeholder: "Enter Last Name", error: errors.lastName },
              ].map(({ name, label, placeholder, error }) => (
                <div className="col-12 col-sm-6" key={name}>
                  <label className="login-label">{label}</label>
                  <div className="position-relative">
                    <span style={iconStyle}><User size={15} /></span>
                    <input
                      type="text"
                      name={name}
                      placeholder={placeholder}
                      value={formData[name]}
                      onChange={handleChange}
                      className={`form-control pe-5 login-input ${error ? 'login-input-error' : ''}`}
                      onFocus={handleFocus}
                      onBlur={(e) => handleBlurStyle(e, error)}
                    />
                  </div>
                  {error && <div className="error-message" style={errorStyle}>{error}</div>}
                </div>
              ))}
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className="login-label">Country</label>
                <Select
                  options={countryOptions}
                  onChange={handleCountryChange}
                  formatOptionLabel={formatOptionLabel}
                  placeholder="Select country..."
                  isSearchable
                  styles={selectStyles}
                  value={countryOptions.find((o) => o.value === formData.countryId) || null}
                />
                {errors.countryId && <div className="error-message" style={errorStyle}>{errors.countryId}</div>}
              </div>
              <div className="col-12 col-sm-6">
                <label className="login-label">Email</label>
                <div className="position-relative">
                  <span style={iconStyle}><Mail size={15} /></span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter Email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-control pe-5 login-input  ${errors.email ? 'login-input-error' : ''}`}
                    onFocus={handleFocus}
                    onBlur={(e) => handleBlurStyle(e, errors.email)}
                  />
                </div>
                {errors.email && <div className="error-message" style={errorStyle}>{errors.email}</div>}
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className="login-label">Mobile Number</label>
                <div className="position-relative">
                  <span style={iconStyle}><Phone size={15} /></span>
                  <input
                    type="text"
                    name="phoneNo"
                    placeholder="Enter Mobile Number"
                    value={formData.phoneNo}
                    onChange={handleChange}
                    className={`form-control pe-5 login-input  ${errors.phoneNo ? 'login-input-error' : ''}`}
                    onFocus={handleFocus}
                    onBlur={(e) => handleBlurStyle(e, errors.phoneNo)}
                  />
                </div>
                {errors.phoneNo && <div className="error-message" style={errorStyle}>{errors.phoneNo}</div>}
              </div>
              <div className="col-12 col-sm-6">
                <label className="login-label">Password</label>
                <div className="position-relative">
                  <span style={iconStyle}><Lock size={15} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter Password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-control pe-5 login-input  ${errors.password ? 'login-input-error' : ''}`}
                    onFocus={handleFocus}
                    onBlur={(e) => handleBlurStyle(e, errors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="password-toggle-btn"
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
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <div className="error-message" style={errorStyle}>{errors.password}</div>}
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className="login-label">Referral ID</label>
                <div className="position-relative">
                  <span style={iconStyle}><UserPlus size={15} /></span>
                  <input
                    type="text"
                    name="referralId"
                    placeholder="Enter Referral ID"
                    value={formData.referralId}
                    onChange={handleReferralChange}
                    className={`form-control pe-5 login-input  ${errors.referralId ? 'login-input-error' : ''}`}
                    onFocus={handleFocus}
                    onBlur={(e) => handleBlurStyle(e, errors.referralId)}
                  />
                </div>

                {referralBlurCalled && (
                  <div>
                    {referralLoading ? (
                      <div className="referral-loading">
                        <span className="referral-spinner"></span>
                        <span className="referral-validating-text">Validating referral...</span>
                      </div>
                    ) : referralError ? (
                      <p className="error-message" style={errorStyle}>{referralError}</p>
                    ) : referralData ? (
                      <div className="referral-success">
                        <p className="referral-name">
                          {referralData.fullName || `${referralData.fName} ${referralData.lName}` || "Referral found"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="col-12 col-sm-6">
                <label className="login-label">Team Positions</label>
                <div className="position-relative intro-side-container">
                  <span className="intro-side-icon">
                    <Users size={15} /></span>
                  <Select
                    options={introSideOptions}
                    onChange={handleIntroSideChange}
                    placeholder="Select"
                    isSearchable={false}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: "rgba(139,92,246,0.05)",
                        borderColor: state.isFocused ? "rgb(255 255 255 / 70%)" : "rgba(139,92,246,0.15)",
                        borderRadius: "0.75rem",
                        minHeight: "48px",
                        boxShadow: "none",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        paddingLeft: "32px",
                        "&:hover": { borderColor: "rgba(139,92,246,0.35)" },
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: "#0c0f1e",
                        border: "1px solid rgba(139,92,246,0.15)",
                        borderRadius: "0.75rem",
                        overflow: "hidden",
                        zIndex: 9999,
                        width: "120px",
                      }),
                      menuList: (base) => ({ ...base, padding: "4px", maxHeight: "200px" }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? "rgba(139,92,246,0.1)" : "transparent",
                        color: "#e8e0fa",
                        fontSize: "13px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        padding: "8px 10px",
                      }),
                      singleValue: (base) => ({ ...base, color: "#e8e0fa", fontSize: "13px", marginLeft: "0" }),
                      placeholder: (base) => ({ ...base, color: "rgba(139,92,246,0.3)", fontSize: "12px", marginLeft: "0" }),
                      valueContainer: (base) => ({ ...base, paddingLeft: "0" }),
                      input: (base) => ({ ...base, color: "#e8e0fa", fontSize: "13px" }),
                      indicatorSeparator: () => ({ display: "none" }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        color: "rgba(139,92,246,0.4)",
                        padding: "4px",
                        "&:hover": { color: "rgba(139,92,246,0.8)" },
                      }),
                    }}
                    value={introSideOptions.find((o) => o.value === formData.introSide) || null}
                  />
                </div>
                {errors.introSide && <div className="error-message" style={errorStyle}>{errors.introSide}</div>}
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12">
                <label className="login-label">Captcha</label>
                <ImagePuzzleCaptcha
                  verified={captchaVerified}
                  onVerify={handleCaptchaVerify}
                  onReset={handleCaptchaReset}
                />
                {errors.captcha && <div className="error-message text-center" style={errorStyle}>{errors.captcha}</div>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn w-100 d-flex align-items-center justify-content-center gap-2 fw-bold text-uppercase mt-2 login-submit ${loading ? 'login-submit-loading' : ''}`}
            >
              {loading && (
                <span className="spinner-border spinner-border-sm spinner-white" />
              )}
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="d-flex align-items-center gap-2 my-4">
            <div className="flex-grow-1 or-divider" />
            <span className="or-text">or</span>
            <div className="flex-grow-1 or-divider" />
          </div>

          <button
            onClick={() => router.push("/user/login")}
            className="btn w-100 signup-button"
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </>
  )
}