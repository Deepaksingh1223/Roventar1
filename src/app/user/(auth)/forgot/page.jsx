'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { forgotPassword } from "@/app/redux/slices/authSlice";
import { Mail, ArrowLeft, User } from "lucide-react";
import Home from '@/app/(main)/page';

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({ username: "", email: "" });
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Force loader to show for at least 500ms
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const validateForm = () => {
    let newErrors = { username: "", email: "" };
    let isValid = true;

    if (!username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const res = await dispatch(forgotPassword({ 
        userId: username, 
        email: email 
      })).unwrap();

      if (res?.statusCode === 200) {
        toast.success(res?.message || "Reset link sent to your email!");
        setSubmitted(true);
      } else {
        throw new Error(res?.message || 'Failed to send reset link');
      }
    } catch (error) {
      toast.error(error?.message || error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = "rgb(255 255 255 / 70%)";
    e.target.style.background = "rgba(34,232,212,0.08)";
    e.target.style.boxShadow = "none";
  };

  const handleBlurStyle = (e, hasError = false) => {
    e.target.style.borderColor = hasError ? "rgba(239,68,68,0.45)" : "rgba(140,180,200,0.24)";
    e.target.style.background = "rgba(255,255,255,0.04)";
    e.target.style.boxShadow = "none";
  };

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
            border: 3px solid rgba(34, 232, 212, 0.2);
            border-top: 3px solid #22e8d4;
            border-right: 3px solid #cba463;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loader-text {
            margin-top: 20px;
            color: #22e8d4;
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
    );
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
      <a href='/'>
              <img src="/logo.png" alt="Logo" className="login-logo" />
      </a>
          </div>

          {!submitted ? (
            <>
              {/* Forgot Password divider */}
              <div className="d-flex align-items-center gap-3 mt-4 mb-4">
                <div className="flex-grow-1 divider-line" />
                <span className="signin-text">
                  Forgot Password
                </span>
                <div className="flex-grow-1 divider-line" />
              </div>

              <p className="text-center mb-4">
                Enter your username and registered email address to reset your password
              </p>

              {/* Username Field */}
              <div className="mb-4">
                <label className="login-label">Username</label>
                <div className="position-relative">
                  <span className="position-absolute start-0 top-50 translate-middle-y ms-2 input-icon !text-[#22e8d4]">
                    <User size={15} />
                  </span>
                  <input
                    type="text"
                    className={`form-control login-input ${errors.username ? 'login-input-error' : ''}`}
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors({ ...errors, username: "" });
                    }}
                    style={{ paddingLeft: "2.25rem" }}
                    onFocus={handleFocus}
                    onBlur={(e) => handleBlurStyle(e, errors.username)}
                  />
                </div>
                {errors.username && <div className="error-message">{errors.username}</div>}
              </div>

              {/* Email Field */}
              <div className="mb-4">
                <label className="login-label">Email Address</label>
                <div className="position-relative">
                  <span className="position-absolute start-0 top-50 translate-middle-y ms-2 input-icon !text-[#22e8d4]">
                    <Mail size={15} />
                  </span>
                  <input
                    type="email"
                    className={`form-control login-input ${errors.email ? 'login-input-error' : ''}`}
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    style={{ paddingLeft: "2.25rem" }}
                    onFocus={handleFocus}
                    onBlur={(e) => handleBlurStyle(e, errors.email)}
                  />
                </div>
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              {/* Submit Button */}
              <button
                className={`btn w-100 d-flex align-items-center justify-content-center gap-2 fw-bold text-uppercase mt-2 login-submit ${(loading || !username || !email) ? 'login-submit-loading' : ''}`}
                onClick={handleSubmit}
                disabled={!username || !email || loading}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm spinner-white" />
                )}
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              {/* OR separator */}
              <div className="d-flex align-items-center gap-2 my-4">
                <div className="flex-grow-1 or-divider" />
                <span className="or-text !text-[#8ea0b5]">or</span>
                <div className="flex-grow-1 or-divider" />
              </div>

              {/* Back to Login */}
              <Link href="/user/login" style={{ textDecoration: "none" }}>
                <button className="btn w-100 signup-button" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <ArrowLeft size={15} />
                  Back to Login
                </button>
              </Link>
            </>
          ) : (
            <>
              {/* Success divider */}
              <div className="d-flex align-items-center gap-3 mt-4 mb-4">
                <div className="flex-grow-1 divider-line" />
                <span className="signin-text !text-[#22e8d4]" style={{ fontSize: "10px" }}>
                  Email Sent
                </span>
                <div className="flex-grow-1 divider-line" />
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ marginBottom: "24px" }}>
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="var(--cyan)" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p style={{ color: "#fff", fontSize: "18px", fontFamily: "monospace", marginBottom: "12px" }}>
                  Check Your <span style={{ color: "var(--cyan)" }}>Email</span>
                </p>
                <p style={{ color: "rgb(255 255 255 / 70%)", fontSize: "12px", fontFamily: "monospace", marginBottom: "24px" }}>
                  We've sent a password reset link to <strong style={{ color: "var(--cyan)" }}>{email}</strong>
                </p>
                
                <button
                  className="btn w-100"
                  onClick={() => {
                    setSubmitted(false);
                    setUsername('');
                    setEmail('');
                  }}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    background: "transparent",
                    border: "1px solid var(--cyan)",
                    color: "var(--cyan)",
                    fontSize: "14px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(34,211,238,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Send to another email
                </button>
              </div>

              {/* OR separator */}
              <div className="d-flex align-items-center gap-2 my-4">
                <div className="flex-grow-1 or-divider" />
                <span className="or-text !text-[#8ea0b5]">or</span>
                <div className="flex-grow-1 or-divider" />
              </div>

              {/* Back to Login */}
              <Link href="/user/login" style={{ textDecoration: "none" }}>
                <button className="btn w-100 signup-button" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <ArrowLeft size={15} />
                  Back to Login
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}