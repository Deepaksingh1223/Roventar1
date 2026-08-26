"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import DashboardSidebar from "../components/DashboardHeader";
import DashboardTopbar from "../components/DashboardSidebar";
import Head from "next/head";
import { useTheme } from "@/components/ThemeProvider";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { setTheme } = useTheme();

  useEffect(() => {
    const isPhoneView = window.matchMedia("(max-width: 1024px)").matches;
    setSidebarOpen(!isPhoneView);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setTheme(false);
  }, [setTheme]);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      window.location.replace("/user/login");
    }
  }, []);

  if (pageLoading) {
    return (
      <>
        <Head>
          <title>XOXOFX</title>
          <meta name="description" content="Trading" />
          <link rel="icon" href="/favicon.png" />
          <link rel="shortcut icon" href="/favicon.png" />
          <link rel="apple-touch-icon" href="/favicon.png" />
        </Head>
        <link rel="stylesheet" href="/assets/css/dashboard.css" />
        
        {/* Full screen loader container - perfectly centered */}
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ 
               background: "linear-gradient(135deg, #060918 0%, #0a0f2a 100%)",
               zIndex: 9999,
               margin: 0,
               padding: 0
             }}>
          
          <div className="text-center">
            {/* Animated SVG Loader */}
            <svg
              width="80"
              height="80"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginBottom: "20px" }}
            >
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#8b5cf6", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#22d3ee", stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#22d3ee", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#8b5cf6", stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              
              {/* Outer rotating circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(139, 92, 246, 0.1)"
                strokeWidth="4"
              />
              
              {/* Animated arc 1 */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="60 190"
                strokeDashoffset="0"
                transform="rotate(0 50 50)"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 50 50"
                  to="360 50 50"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
              
              {/* Animated arc 2 - opposite direction */}
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="40 150"
                strokeDashoffset="0"
                transform="rotate(180 50 50)"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="360 50 50"
                  to="0 50 50"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
              
              {/* Pulsing center dot */}
              <circle cx="50" cy="50" r="5" fill="#8b5cf6">
                <animate
                  attributeName="r"
                  values="3;6;3"
                  dur="1s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.5;1;0.5"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>

            {/* Loading text with animation */}
            <div style={{ 
              color: "#8b5cf6", 
              fontFamily: "monospace", 
              fontSize: "13px", 
              letterSpacing: "3px",
              animation: "pulse 1.5s ease-in-out infinite"
            }}>
              LOADING
            </div>
            
            {/* Loading dots animation */}
            <div style={{ 
              display: "flex", 
              gap: "8px", 
              justifyContent: "center", 
              marginTop: "12px" 
            }}>
              <div style={{ 
                width: "6px", 
                height: "6px", 
                borderRadius: "50%", 
                background: "#8b5cf6",
                animation: "bounce 1.4s ease-in-out infinite 0s"
              }}></div>
              <div style={{ 
                width: "6px", 
                height: "6px", 
                borderRadius: "50%", 
                background: "#a78bfa",
                animation: "bounce 1.4s ease-in-out infinite 0.2s"
              }}></div>
              <div style={{ 
                width: "6px", 
                height: "6px", 
                borderRadius: "50%", 
                background: "#c4b5fd",
                animation: "bounce 1.4s ease-in-out infinite 0.4s"
              }}></div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-8px); }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>XOXOFX</title>
        <meta name="description" content="Trading" />
        <link rel="icon" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </Head>

      <link rel="stylesheet" href="/assets/css/dashboard.css" />

      <div className="bg-mesh">
        <div className="blob b1"></div>
        <div className="blob b2"></div>
        <div className="blob b3"></div>
      </div>

      <div className="grid-bg"></div>
      <div id="pts"></div>

      <div className="layout" data-sidebar-open={sidebarOpen ? "1" : "0"}>
        {/* <button
          type="button"
          className="sidebar-hamburger"
          aria-label="Toggle sidebar"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button> */}

        <div
          className="sidebar-wrap"
          aria-hidden={sidebarOpen ? "false" : "true"}
        >
          <DashboardSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </div>

        <div className="main">
          <DashboardTopbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <main className="content">{children}</main>
        </div>
      </div>
    </>
  );
}