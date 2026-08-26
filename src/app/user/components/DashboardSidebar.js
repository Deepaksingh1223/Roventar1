"use client";

import React, { useState, useEffect, useRef } from "react";
import { CiMenuFries } from "react-icons/ci";
import { FiUser, FiHelpCircle } from "react-icons/fi";
import { FaWhatsapp, FaFacebookF, FaInstagram, FaTelegramPlane, FaFilePdf, FaBell } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { getUserDashboardDetails } from "../../redux/slices/authSlice";
import { Getusernotification, updateNotificationsCount } from "../../redux/slices/ticketSlice";
import { getUserReffrellLink } from "../../redux/slices/walletSlice";
import { useDispatch, useSelector } from "react-redux";
import { getUserId, doUserLogout } from "@/app/api/auth";
import Link from 'next/link';
import { FiLogOut } from "react-icons/fi";
import { useTheme } from '@/components/ThemeProvider';
import { RiMoonLine, RiSunLine } from 'react-icons/ri';

export default function DashboardHeader({ sidebarOpen, setSidebarOpen }) {

  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isDark, toggleTheme } = useTheme();
  const [showBotPopup, setShowBotPopup] = useState(false);
  const [showRefPopup, setShowRefPopup] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState({ parent: "Dashboard", child: "Overview" });
  const [referralLink, setReferralLink] = useState("");
  const userMenuRef = useRef(null);
  const [selectedPosition, setSelectedPosition] = useState("L");
  const [leftUrl, setLeftUrl] = useState("");
  const [rightUrl, setRightUrl] = useState("");


  const [notificationsDropDown, setNotificationsDropDown] = useState(false);
  const [seenNotifications, setSeenNotifications] = useState(new Set());
  const notifyRef = useRef(null);
  const notificationPollingRef = useRef(null);


  const { refrelData, loading: refrelLoading } = useSelector((state) => state.wallet);
  const { userNotifications } = useSelector((state) => state.ticket);

  const notificationsArray = userNotifications?.notificationList || [];
 

  const unseenNotifications = notificationsArray.filter((n) => !seenNotifications.has(n.URID) && !n.Seen);
  const actualUnseenCount = unseenNotifications.length;

  useEffect(() => {
    const pathParts = pathname.split('/').filter(Boolean);

    const breadcrumbMap = {
      'dashboard': { parent: 'Dashboard', child: 'Overview' },
      'Team': { parent: 'Genealogy', child: 'All Teams' },
      'deposit-request': { parent: 'Finance', child: 'Deposit Request' },
      'deposit-history': { parent: 'Finance', child: 'Deposit History' },
      'fund-director': { parent: 'Finance', child: 'Fund Director' },
      'income-statement': { parent: 'Finance', child: 'Income Statement' },
      'wallet-statement': { parent: 'Finance', child: 'Wallet Statement' },
      'ticket-logs': { parent: 'Support', child: 'Ticket Logs' },
      'new-ticket': { parent: 'Support', child: 'New Ticket' },
      'ROI-history': { parent: 'Finance', child: 'ROI History' },
      'roi-request': { parent: 'Finance', child: 'ROI Request' },
      'Admin-profile': { parent: 'Account', child: 'Profile' },
    };

    let parent = 'Dashboard';
    let child = 'Overview';

    for (const part of pathParts) {
      if (breadcrumbMap[part]) {
        parent = breadcrumbMap[part].parent;
        child = breadcrumbMap[part].child;
        break;
      }
    }

    setBreadcrumb({ parent, child });
  }, [pathname]);

 
  const getAuthLogin = () => {
    try {
      const currentUserPlain = localStorage.getItem("currentUserPlain");

      if (currentUserPlain) {
        const userData = JSON.parse(currentUserPlain);
        return userData?.authLogin || userData?.userData?.authLogin;
      }
    } catch (error) {
      console.error("Error getting AuthLogin:", error);
    }
    return null;
  };

  const userID = getAuthLogin();
  const userURID = getUserId();

  // Fetch Dashboard Details
  useEffect(() => {
    const fetchDashboardDetails = async () => {

      setIsLoading(true);
      try {
        const result = await dispatch(getUserDashboardDetails()).unwrap();
        if (result?.data) {
          setDashboardData(result.data);
        } else if (result) {
          setDashboardData(result);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardDetails();
  }, [dispatch]);

  // Fetch Referral Link
  useEffect(() => {
    const fetchReferralLink = async () => {
      // if (!userID) return;

      try {
        const result = await dispatch(getUserReffrellLink()).unwrap();
      } catch (error) {
        console.error("Failed to fetch referral link:", error);
      }
    };

    fetchReferralLink();
  }, [dispatch, userID]);

  useEffect(() => {
    let rentWalletData = null;

    if (refrelData?.data?.rentWallet?.[0]) {
      rentWalletData = refrelData.data.rentWallet[0];
    } else if (refrelData?.rentWallet?.[0]) {
      rentWalletData = refrelData.rentWallet[0];
    }

    if (rentWalletData) {
      setLeftUrl(rentWalletData.LeftURL);
      setRightUrl(rentWalletData.RightURL);

      const initialLink = selectedPosition === "L" ? rentWalletData.LeftURL : rentWalletData.RightURL;
      setReferralLink(initialLink);
    }
  }, [refrelData, selectedPosition]);


  useEffect(() => {
    if (leftUrl && rightUrl) {
      const newLink = selectedPosition === "L" ? leftUrl : rightUrl;
      setReferralLink(newLink);
    }
  }, [selectedPosition, leftUrl, rightUrl]);

 
  useEffect(() => {
    const savedSeenNotifications = localStorage.getItem("seenNotifications");
    if (savedSeenNotifications) setSeenNotifications(new Set(JSON.parse(savedSeenNotifications)));
  }, []);

  useEffect(() => {
    localStorage.setItem("seenNotifications", JSON.stringify([...seenNotifications]));
  }, [seenNotifications]);

  useEffect(() => {
    const pollNotifications = () => {
      // const URID = getUserId();
      // if (URID) {
        dispatch(Getusernotification());
      // }
    };
    pollNotifications();
    notificationPollingRef.current = setInterval(pollNotifications, 30000);
    return () => { 
      if (notificationPollingRef.current) 
        clearInterval(notificationPollingRef.current); 
    };
  }, [dispatch]);

  useEffect(() => {
    const resetInterval = setInterval(() => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const savedTime = localStorage.getItem("seenNotificationsTime");
      if (!savedTime || parseInt(savedTime) < oneDayAgo) {
        setSeenNotifications(new Set());
        localStorage.setItem("seenNotificationsTime", Date.now().toString());
      }
    }, 60000);
    return () => clearInterval(resetInterval);
  }, []);

  const handleNotificationClick = (e) => { 
    e.stopPropagation(); 
    setNotificationsDropDown((prev) => !prev); 
  };

  const handleCloseNotifications = async (e) => {
    e.stopPropagation();
    
    try {
      const allNotificationIds = notificationsArray.map(n => n.URID || n.id || n.NotificationId);
      setSeenNotifications(new Set([...seenNotifications, ...allNotificationIds]));
      const URID = getUserId();
      await dispatch(updateNotificationsCount({ URID })).unwrap();
      
      if (URID) {
        await dispatch(Getusernotification({ URID })).unwrap();
       
      } else {
        console.warn("⚠️ URID not found, skipping Getusernotification");
      }
      
    } catch (error) {
      console.error("Error updating notification:", error);
    }
    
    setNotificationsDropDown(false);
  };

  const handleIndividualNotificationClick = (notification) => {
    const notificationId = notification.URID || notification.id || notification.NotificationId;
    setSeenNotifications((prev) => new Set([...prev, notificationId]));
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowBotPopup(false);
        setShowRefPopup(false);
        setShowUserMenu(false);
        if (notificationsDropDown) {
          const allNotificationIds = notificationsArray.map(n => n.URID || n.id || n.NotificationId);
          setSeenNotifications(new Set([...seenNotifications, ...allNotificationIds]));
          setNotificationsDropDown(false);
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [notificationsDropDown, seenNotifications, notificationsArray]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationsDropDown && notifyRef.current && !notifyRef.current.contains(event.target)) {
        const allNotificationIds = notificationsArray.map(n => n.URID || n.id || n.NotificationId);
        setSeenNotifications(new Set([...seenNotifications, ...allNotificationIds]));
        setNotificationsDropDown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, notificationsDropDown, seenNotifications, notificationsArray]);

  const toggleSidebar = () => {
    setSidebarOpen((isOpen) => !isOpen);
  };

  const closeBot = () => setShowBotPopup(false);
  const closeRef = () => setShowRefPopup(false);

  const activateBot = () => {
    setShowBotPopup(false);
  };

  const copyRef = async () => {
    const refLink = referralLink || `https://xoxofx.com/user/register?ref=${userID || "XO5599007"}&Position=L`;

    try {
      await navigator.clipboard.writeText(refLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareOn = (platform) => {
    const refLink = referralLink || `https://xoxofx.com/user/register?ref=${userID || "XO5599007"}&Position=L`;
    const text = `Join me on XOXO AI Engine - earn up to 8% commission! My ID: ${userID}`;

    let url = "";
    switch (platform) {
      case "WhatsApp":
        url = `https://wa.me/?text=${encodeURIComponent(text + " " + refLink)}`;
        break;
      case "Facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refLink)}`;
        break;
      case "Instagram":
        window.open(
          "https://www.instagram.com/xoxofx_official/",
          "_blank"
        );
        return;

      case "Telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;
        break;
    }
    if (url) window.open(url, "_blank");
  };

  return (
    <>
      <header className="topbar">
        <div className="tb-l">
          <div className="pgtitle">
            {breadcrumb.parent}
            <span style={{ fontSize: "11px", color: "var(--t2)", fontWeight: 400 }}>
              / {breadcrumb.child}
            </span>
          </div>
        </div>

        <div className="tb-r">
          <div className="schip" onClick={() => setShowBotPopup(true)} style={{ cursor: "pointer" }}>
            <span className="dot dc"></span>
            {dashboardData?.[0]?.BotStatus || "BOT ACTIVE"}
          </div>

          <div className="schip" onClick={() => setShowRefPopup(true)} style={{ cursor: "pointer" }}>
            <span className="dot dg"></span>
            INVITE & EARN
          </div>

          <button
            type="button"
            className="dx-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <RiSunLine aria-hidden="true" /> : <RiMoonLine aria-hidden="true" />}
            <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
          </button>

        
          <div style={{ position: "relative" }} ref={notifyRef}>
            <div
              className="schip d-flex align-items-center gap-2"
              onClick={handleNotificationClick}
              style={{ cursor: "pointer", position: "relative" }}
            >
              <FaBell size={16} />
              {actualUnseenCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    minWidth: "16px",
                    height: "16px",
                    padding: "0 4px",
                    borderRadius: "999px",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {actualUnseenCount > 99 ? "99+" : actualUnseenCount}
                </span>
              )}
            </div>

            {notificationsDropDown && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  width: "250px",
                  maxWidth: "calc(100vw - 20px)",
                  background: "linear-gradient(135deg, var(--bg-2) 0%, var(--bg-1) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
                  zIndex: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#00000" }}>Notifications</div>
                    {actualUnseenCount > 0 && (
                      <div style={{ fontSize: "11px", color: "#60a5fa" }}>{actualUnseenCount} unread</div>
                    )}
                  </div>
                  <div onClick={handleCloseNotifications} style={{ cursor: "pointer", color: "var(--t2)", fontSize: "13px" }}>
                    ✕
                  </div>
                </div>

                <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                  {notificationsArray.length > 0 ? (
                    notificationsArray.map((msg, index) => (
                      <div
                        key={index}
                        onClick={() => handleIndividualNotificationClick(msg)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          background: !seenNotifications.has(msg.URID) && !msg.Seen ? "rgba(96, 165, 250, 0.05)" : "transparent",
                        }}
                      >
                        <FaBell size={14} style={{ color: "#60a5fa", marginTop: "2px" }} />
                        <div style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.5 }}>
                          <div>{msg?.AdminRemarks || msg?.message || "Notification"}</div>
                          {msg?.NotificationDate && (
                            <div style={{ fontSize: "10px", color: "var(--t2)", opacity: 0.6, marginTop: "2px" }}>
                              {new Date(msg.NotificationDate).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "30px 16px", textAlign: "center" }}>
                      <FaBell size={22} style={{ color: "var(--t2)", opacity: 0.4, marginBottom: "8px" }} />
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--t2)" }}>All caught up!</div>
                      <div style={{ fontSize: "11px", color: "var(--t2)" }}>No new notifications</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link href="/user/dashboard/fund-director">
            <div className="schip" style={{ cursor: 'pointer' }}>
              + Deposit
            </div>
          </Link>

          <div className="pchip">
            ▲ +${dashboardData?.[0]?.TodayIncome || "0"} today
          </div>

          <div style={{ position: "relative" }} ref={userMenuRef}>
            <button
              className="bdep"
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              style={{
                borderRadius: "999px",
                background: "#E1F3F3",
                border: "1px solid #1d819a",
                color: "#1d5e9a",
                padding: "8px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                minWidth: "fit-content",
                backdropFilter: "blur(10px)",
              }}
            >
              <FiUser style={{ width: "18px", height: "18px" }} />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: "1.2",
                }}
              >
                <span>{userID}</span>

                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748B",
                    fontWeight: "500",
                    marginTop: "1px",
                  }}
                >
                  {dashboardData?.[0]?.UserRank}
                </span>
              </div>
            </button>
            <div>
              {showUserMenu && (
                <div
                  className="user-menu"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 10px)",
                    width: "190px",
                    maxWidth: "calc(100vw - 20px)",
                    background: "linear-gradient(135deg, var(--bg-2) 0%, var(--bg-1) 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
                    padding: "8px 0",
                    zIndex: 999,
                    overflow: "hidden",
                  }}
                >
                  <Link
                    href="/user/dashboard/profile"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 14px",
                      color: "var(--text-2)",
                      textDecoration: "none",
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FiUser />
                    Profile
                  </Link>

                  <Link
                    href="/user/dashboard/support"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 14px",
                      color: "var(--text-2)",
                      textDecoration: "none",
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FiHelpCircle />
                    Support
                  </Link>

                  <Link
                    href="/user/login"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 14px",
                      color: "var(--text-2)",
                      textDecoration: "none",
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => {
                      doUserLogout();
                      setShowUserMenu(false);
                    }}
                  >
                    <FiLogOut />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="btn-mb-show">
            <div className="nbtn" onClick={toggleSidebar}>
              <CiMenuFries />
            </div>
          </div>
        </div>
      </header>

      {/* Bot Popup */}
      {showBotPopup && (
        <div className="overlay show" id="botOv" onClick={(e) => e.target === e.currentTarget && closeBot()}>
          <div className="popup" style={{ maxWidth: "430px" }}>
            <div className="popup-bar"></div>
            <div className="popup-x" onClick={closeBot}>✕</div>
            <div className="popup-body">
              <div style={{ textAlign: "center", marginBottom: "16px", color: "#fff" }}>
                <div style={{ fontSize: "21px", fontWeight: 900, letterSpacing: "-.4px", marginBottom: "4px", color: "#fff" }}>
                  Bot <span style={{ color: "#34d399" }}>Status</span>
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--t2)", lineHeight: 1.6 }}>
                  Your trading bot is currently <strong style={{ color: "#34d399" }}>ACTIVE</strong>
                </div>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                gap: "10px",
                marginTop: "10px"
              }}>
                <button 
                  className="copy-btn" 
                  onClick={activateBot}
                  style={{ background: "#34d399", color: "#000" }}
                >
                  ✓ Bot Active
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Popup */}
      {showRefPopup && (
        <div className="overlay show" id="refOv" onClick={(e) => e.target === e.currentTarget && closeRef()}>
          <div className="popup" style={{ maxWidth: "430px" }}>
            <div className="popup-bar"></div>
            <div className="popup-x" onClick={closeRef}>✕</div>
            <div className="popup-body">
              <div style={{ textAlign: "center", marginBottom: "16px", color: "#fff" }}>
                <div style={{ fontSize: "21px", fontWeight: 900, letterSpacing: "-.4px", marginBottom: "4px", color: "#fff" }}>
                  Invite &amp; <span style={{ color: "#a78bfa" }}>Earn</span>
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--t2)", lineHeight: 1.6 }}>
                  Share your link · Earn up to <strong style={{ color: "#fbbf24" }}>8% commission</strong> on every trade — 3 levels deep, paid daily
                </div>
              </div>

              {(leftUrl || rightUrl) && (
                <div style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "15px",
                  background: "rgba(124,58,237,0.1)",
                  padding: "8px",
                  borderRadius: "12px",
                  justifyContent: "center"
                }}>
                  <button
                    onClick={() => setSelectedPosition("L")}
                    style={{
                      padding: "6px 15px",
                      borderRadius: "8px",
                      border: "none",
                      background: selectedPosition === "L" ? "#7c3aed" : "rgba(124,58,237,0.2)",
                      color: selectedPosition === "L" ? "#fff" : "var(--t2)",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold"
                    }}
                  >
                    Left Position
                  </button>
                  <button
                    onClick={() => setSelectedPosition("R")}
                    style={{
                      padding: "6px 15px",
                      borderRadius: "8px",
                      border: "none",
                      background: selectedPosition === "R" ? "#7c3aed" : "rgba(124,58,237,0.2)",
                      color: selectedPosition === "R" ? "#fff" : "var(--t2)",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold"
                    }}
                  >
                    Right Position
                  </button>
                </div>
              )}

              <div style={{ fontSize: "10px", color: "var(--t2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "6px" }}>
                Your Unique Referral Link {leftUrl && rightUrl ? `(${selectedPosition === "L" ? "Left" : "Right"} Position)` : ""}
              </div>
              <div className="ref-link">
                {refrelLoading ? "Loading..." : (referralLink || `https://xoxofx.com/user/register?ref=${userID || "XO5599007"}&Position=L`)}
              </div>
              <button className="copy-btn" onClick={copyRef} disabled={refrelLoading}>
                {copySuccess ? "✓ Copied!" : "Copy Referral Link"}
              </button>
              <div style={{ fontSize: "10px", color: "var(--t2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "8px", marginTop: "15px" }}>
                Share on Social Media
              </div>
              <div className="soc-grid">
                <button className="soc-btn soc-wa" onClick={() => shareOn("WhatsApp")}>
                  <FaWhatsapp style={{ marginRight: "8px" }} />
                  WhatsApp
                </button>
                <a className="soc-btn soc-pdf" href="https://app.xoxofx.com/xoxofs/XoxoFxV5.pdf" target="_blank">
                  <FaFilePdf />
                  PDF
                </a>
                <button className="soc-btn soc-ig" onClick={() => shareOn("Instagram")}>
                  <FaInstagram style={{ marginRight: "8px" }} />
                  Instagram
                </button>
                <button className="soc-btn soc-tg" onClick={() => shareOn("Telegram")}>
                  <FaTelegramPlane style={{ marginRight: "8px" }} />
                  Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}