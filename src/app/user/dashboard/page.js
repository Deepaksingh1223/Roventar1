"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Chart from 'chart.js/auto';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation'; 
import { getUserDashboardDetails } from "../../redux/slices/authSlice";
import { getallusernotification } from "../../redux/slices/ticketSlice";
import { useDispatch, useSelector } from "react-redux";
import { getUserId } from "@/app/api/auth";
import { botActivate } from "@/app/redux/slices/fundManagerSlice"
import { useRouter } from 'next/navigation';
import XoxoFxChatbot from '../components/Xoxofxchatbot';
import RankProgress from '../components/RankProgress';
import { useTheme } from '@/components/ThemeProvider';


export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isDark } = useTheme();
  const chartEarnRef = useRef(null);
  const chartPieRef = useRef(null);
  const chartPortRef = useRef(null);
  const oppLRef = useRef(null);
  const heatmapRef = useRef(null);
  const execGridRef = useRef(null);
  const fuTrackRef = useRef(null);
  const timerNumRef = useRef(null);

  // Popup States
  const [showBotPopup, setShowBotPopup] = useState(false);
  const [showSimplePopup, setShowSimplePopup] = useState(false);
  const [showRefPopup, setShowRefPopup] = useState(false);
  const [showBuyPackagePopup, setShowBuyPackagePopup] = useState(false);
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  // Timer states
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [botStartTime, setBotStartTime] = useState(null);
  const [botTime, setBotTime] = useState(null);

  const [isBotActive, setIsBotActive] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  // UI-only state for the Performance Analytics tabs (no data logic attached)
  const [analyticsRange, setAnalyticsRange] = useState('7D');
  const [analyticsMetric, setAnalyticsMetric] = useState('Income');
  const [botActiveTime, setBotActiveTime] = useState(null);

  // Theme (light / dark) — persisted to localStorage
  const theme = isDark ? 'dark' : 'light';

  const BOT_SESSION_KEY = 'RoventarBotActive';
  const BOT_START_KEY = 'RoventarBotStartTime';

  function formatElapsedTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  function formatBotTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  const userURID = getUserId();

  // Hero greeting helpers (display only)
  const userDisplayName = dashboardData?.[0]?.UserName || dashboardData?.[0]?.Name || dashboardData?.[0]?.FullName || 'Investor';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();
  const userInitials = String(userDisplayName).trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const botStatus = Number(dashboardData?.[0]?.chktodayBotStatus ?? 0);
  const notifications = useSelector((state) => state.ticket?.notificationData);

  const notificationList = notifications?.notificationList ?? notifications?.notificationList ?? [];

  const notificationCount = notificationList?.length || 0;
  const unseenTotal = Array.isArray(notificationList) ? notificationList.filter(n => !n.Seen).length : 0;
  const botIsActive = isBotActive || botStatus === 1;

  // IMPORTANT: Bot should only be considered active if Kid === 1
  const shouldBotBeActive = botIsActive && dashboardData?.[0]?.Kid === 1;
  const isKidNotOne = dashboardData?.[0]?.Kid !== 1;
  const isKidFive = dashboardData?.[0]?.Kid === 5;
  const isKidOne = dashboardData?.[0]?.Kid === 1;

  useEffect(() => {
    // if (!userURID) return;

    const fetchNotifications = async () => {
      try {
        await dispatch(getallusernotification()).unwrap();
      } catch (err) {
        try {
          dispatch(Getusernotification());
        } catch (e) {
          console.error('Failed to fetch user notifications:', e || err);
        }
      }
    };

    fetchNotifications();
  }, [dispatch]);

  // Show SIMPLE popup when Kid = 1 and bot is not active (auto on page load)
  useEffect(() => {
    if (dashboardData && !shouldBotBeActive) {
      if (isKidFive) {
        setShowBuyPackagePopup(true);
      } else if (isKidOne) {
        // Show simple message popup when Kid = 1
        setShowSimplePopup(true);
      }
    }
  }, [dashboardData, shouldBotBeActive, isKidFive, isKidOne]);

  // Restore bot state from API and localStorage on page load/refresh
  useEffect(() => {
    try {
      const apiBotTime = dashboardData?.[0]?.BotActiveTime;

      if (apiBotTime && botStatus === 1) {
        let startTime;
        if (typeof apiBotTime === 'number') {
          startTime = apiBotTime;
        } else if (typeof apiBotTime === 'string') {
          startTime = new Date(apiBotTime).getTime();
        }

        if (apiBotTime && !isNaN(apiBotTime)) {
          setBotStartTime(apiBotTime);
          const elapsed = (apiBotTime);
          setElapsedSeconds(elapsed > 0 ? elapsed : 0);
          setIsBotActive(true);

          if (timerNumRef.current) {
            timerNumRef.current.textContent = formatElapsedTime(elapsed > 0 ? elapsed : 0);
          }
        }
      } else {
        const storedActive = localStorage.getItem(BOT_SESSION_KEY) === 'true';

        if (storedActive && storedStart && !Number.isNaN(storedStart)) {
          setBotStartTime(storedStart);
          const elapsed = Math.floor((Date.now() - storedStart) / 1000);
          setElapsedSeconds(elapsed > 0 ? elapsed : 0);
          setIsBotActive(true);

          if (timerNumRef.current) {
            timerNumRef.current.textContent = formatElapsedTime(elapsed > 0 ? elapsed : 0);
          }
        }
      }
    } catch (err) {
      console.warn('Could not restore bot timer from localStorage', err);
    }
  }, [dashboardData, botStatus]);

  // Handle botStatus changes from API
  useEffect(() => {
    if (botStatus === 1) {
      const apiBotTime = dashboardData?.[0]?.BotActiveTime;

      if (apiBotTime) {
        let startTime;
        if (typeof apiBotTime === 'number') {
          startTime = apiBotTime * 1000;
        } else if (typeof apiBotTime === 'string') {
          startTime = new Date(apiBotTime).getTime();
        }

        if (startTime && !isNaN(startTime)) {
          setBotStartTime(startTime);
          setBotActiveTime(startTime);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setElapsedSeconds(elapsed > 0 ? elapsed : 0);

          if (timerNumRef.current) {
            timerNumRef.current.textContent = formatElapsedTime(elapsed > 0 ? elapsed : 0);
          }
        }
      } else {
        const storedStart = Number(localStorage.getItem(BOT_START_KEY));
        if (storedStart && !Number.isNaN(storedStart)) {
          setBotStartTime(storedStart);
          const elapsed = Math.floor((Date.now() - storedStart) / 1000);
          setElapsedSeconds(elapsed > 0 ? elapsed : 0);
          setIsBotActive(true);

          if (timerNumRef.current) {
            timerNumRef.current.textContent = formatElapsedTime(elapsed > 0 ? elapsed : 0);
          }
        } else {
          const now = Date.now();
          setBotStartTime(now);
          setElapsedSeconds(0);

          if (timerNumRef.current) {
            timerNumRef.current.textContent = formatElapsedTime(0);
          }
        }
      }
      setIsBotActive(true);
      // Close any open popups when bot becomes active
      setShowBotPopup(false);
      setShowSimplePopup(false);
      setShowBuyPackagePopup(false);
    } else {
      setIsBotActive(false);
      setBotStartTime(null);
      setElapsedSeconds(0);
      setBotActiveTime(null);
      localStorage.removeItem(BOT_SESSION_KEY);
      localStorage.removeItem(BOT_START_KEY);

      if (timerNumRef.current) {
        timerNumRef.current.textContent = formatElapsedTime(0);
      }
    }
  }, [botStatus, dashboardData]);

  const totalIncome = Number(dashboardData?.[0]?.TotalIncome ?? 0);
  const earningLimit = Number(dashboardData?.[0]?.EarningLimit ?? 0);
  const remainingLimit = Number(dashboardData?.[0]?.RemainingLimit ?? Math.max(0, earningLimit - totalIncome));
  const usedPercentage = earningLimit > 0 ? Math.min(100, (totalIncome / earningLimit) * 100) : 0;
  const visualPercent = Number(usedPercentage.toFixed(1));
  const strokeOffset = 339 - (339 * visualPercent) / 100;

  const slides = [
    { id: 0, image: "/assets/images/forex.png", alt: "Forex" },
    { id: 1, image: "/assets/images/crypto.png", alt: "Crypto" },
    { id: 2, image: "/assets/images/stock.png", alt: "Stock" },
  ];

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      // if (!userURID) return;

      setIsLoading(true);
      try {
        const result = await dispatch(getUserDashboardDetails()).unwrap();

        if (result?.data) {
          setDashboardData(result.data);

          const botTime = result.data[0]?.BotActiveTime;
          if (botTime && botStatus === 1) {
            setBotActiveTime(botTime);

            let startTime;
            if (typeof botTime === 'number') {
              startTime = botTime * 1000;
            } else if (typeof botTime === 'string') {
              startTime = new Date(botTime).getTime();
            }

            if (startTime && !isNaN(startTime)) {
              const elapsed = Math.floor((Date.now() - startTime) / 1000);
              setElapsedSeconds(elapsed > 0 ? elapsed : 0);
              setBotStartTime(startTime);
              setIsBotActive(true);
            }
          }
        } else if (result) {
          setDashboardData(result);

          const botTime = result[0]?.BotActiveTime;
          if (botTime && botStatus === 1) {
            setBotActiveTime(botTime);

            let startTime;
            if (typeof botTime === 'number') {
              startTime = botTime * 1000;
            } else if (typeof botTime === 'string') {
              startTime = new Date(botTime).getTime();
            }

            if (startTime && !isNaN(startTime)) {
              localStorage.setItem(BOT_START_KEY, startTime.toString());
              const elapsed = Math.floor((Date.now() - startTime) / 1000);
              setElapsedSeconds(elapsed > 0 ? elapsed : 0);
              setBotStartTime(startTime);
              setIsBotActive(true);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardDetails();
  }, [dispatch]);

  // Popup Functions
  const openBotFullPopup = () => {
    if (isKidOne && !shouldBotBeActive) {
      setShowSimplePopup(false); // Close simple popup
      setShowBotPopup(true); // Open full popup with checkbox
    }
  };

  const closeBotFullPopup = () => {
    setShowBotPopup(false);
    setIsCheckboxChecked(false);
  };

  const closeSimplePopup = () => {
    setShowSimplePopup(false);
  };

  const closeBuyPackagePopup = () => {
    setShowBuyPackagePopup(false);
  };

  const closeCongratsPopup = () => {
    setShowCongratsPopup(false);
  };

  const openRef = () => {
    setShowRefPopup(true);
  };

  const closeRef = () => {
    setShowRefPopup(false);
  };

  const copyRef = async () => {
    const refLink = "https://arbion.ai/ref/ARB-a9x7k2-premium";
    try {
      await navigator.clipboard.writeText(refLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareOn = (platform) => {
    const refLink = "https://arbion.ai/ref/ARB-a9x7k2-premium";
    const text = "Join me on Roventar AI Engine - earn up to 8% commission!";
    let url = "";
    switch (platform) {
      case "WhatsApp":
        url = `https://wa.me/?text=${encodeURIComponent(text + " " + refLink)}`;
        break;
      case "Facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refLink)}`;
        break;
      case "Instagram":
        navigator.clipboard.writeText(`${text} ${refLink}`);
        alert("Link copied! Share it on Instagram.");
        return;
      case "Telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;
        break;
    }
    if (url) window.open(url, "_blank");
  };

  useEffect(() => {
    let interval;
    if (shouldBotBeActive && botStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - botStartTime) / 1000);
        setElapsedSeconds(elapsed > 0 ? elapsed : 0);

        if (timerNumRef.current) {
          timerNumRef.current.textContent = formatElapsedTime(elapsed > 0 ? elapsed : 0);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [shouldBotBeActive, botStartTime]);

  useEffect(() => {
    if (timerNumRef.current && shouldBotBeActive) {
      timerNumRef.current.textContent = formatElapsedTime(elapsedSeconds);
    }
  }, [elapsedSeconds, shouldBotBeActive]);

  useEffect(() => {
    if (!shouldBotBeActive) return;

    const refreshDashboard = async () => {
      try {
        const result = await dispatch(getUserDashboardDetails()).unwrap();
        const apiBotTime = result?.[0]?.BotActiveTime;
        if (apiBotTime !== undefined) {
          setBotTime(apiBotTime);
        }
      } catch (error) {
        console.error("Failed to refresh dashboard:", error);
      }
    };

    refreshDashboard();
    const interval = setInterval(refreshDashboard, 5000);
    return () => clearInterval(interval);
  }, [shouldBotBeActive, dispatch]);

  const activateBot = async () => {
    if (shouldBotBeActive) return;

    const now = Date.now();

    try {
      const response = await dispatch(botActivate()).unwrap();

      localStorage.setItem(BOT_SESSION_KEY, 'true');
      localStorage.setItem(BOT_START_KEY, now.toString());
      setBotStartTime(now);
      setBotActiveTime(now);
      setElapsedSeconds(0);
      setIsBotActive(true);
      setShowBotPopup(false);
      setShowSimplePopup(false);
      setIsCheckboxChecked(false);

      // Show congratulation popup after successful activation
      setShowCongratsPopup(true);

      if (timerNumRef.current) {
        timerNumRef.current.textContent = formatElapsedTime(0);
      }

      const result = await dispatch(getUserDashboardDetails()).unwrap();
      if (result?.data) {
        setDashboardData(result.data);
      }

      // Auto close congratulation popup after 5 seconds
      setTimeout(() => {
        setShowCongratsPopup(false);
      }, 5000);

    } catch (error) {
      console.error('Failed to activate bot:', error);
      return;
    }

    const botNotif = document.getElementById('botNotif');
    const timerBox = document.getElementById('timerBox');
    const botActArea = document.getElementById('botActArea');
    if (botNotif) botNotif.style.display = 'flex';
    if (timerBox) timerBox.style.display = 'flex';
    if (botActArea) botActArea.style.display = 'none';
  };

  const pauseBot = () => {
    setIsBotActive(false);
    setBotStartTime(null);
    setElapsedSeconds(0);
    setBotActiveTime(null);
    localStorage.removeItem(BOT_SESSION_KEY);
    localStorage.removeItem(BOT_START_KEY);

    if (timerNumRef.current) {
      timerNumRef.current.textContent = formatElapsedTime(0);
    }
  };

  const closeAnnouncement = () => {
    setShowAnnouncement(false);
  };

  // Initialize charts
  useEffect(() => {
    if (chartEarnRef.current) {
      const ctx = chartEarnRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Earned',
              data: [1240, 2890, 4520, 8241],
              borderColor: '#14b8a6',
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Limit',
              data: [3000, 6000, 9000, 12000],
              borderColor: 'rgba(239, 68, 68, 0.5)',
              borderDash: [5, 5],
              backgroundColor: 'transparent',
              tension: 0.4,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    if (chartPieRef.current) {
      const ctx = chartPieRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Trading', 'Level', 'Affiliate', 'Compound'],
          datasets: [{
            data: [4286, 1841, 841, 1274],
            backgroundColor: ['#14b8a6', '#34d399', '#8b5cf6', '#f59e0b'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    if (chartPortRef.current) {
      const ctx = chartPortRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
          datasets: [{
            data: Array.from({ length: 30 }, (_, i) => 38000 + (i * 320)),
            borderColor: '#14b8a6',
            backgroundColor: 'rgba(20, 184, 166, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    return () => {
      const charts = Chart.instances;
      Object.values(charts).forEach(chart => chart.destroy());
    };
  }, []);

  useEffect(() => {
    if (oppLRef.current && dashboardData && dashboardData.length > 0) {
      const userData = dashboardData[0];

      const opportunities = [
        {
          pair: 'Trading Withdrawal',
          profit: `+$${userData?.TradingWithdrawal || 0}`
        },
        {
          pair: 'Income Withdrawal',
          profit: `+$${userData?.IncomeWithdrawal || 0}`
        },
        {
          pair: 'Level Open',
          profit: `${userData.LevelOpen || 0}`
        },
        {
          pair: 'Income Wallet',
          profit: `+$${userData.IncomeWallet || 0}`
        },
        {
          pair: 'Deposit Wallet',
          profit: `+$${userData.DepositWallet || 0}`
        },
        {
          pair: 'Trading Wallet',
          profit: `+$${userData.TradingWallet || 0}`
        },
      ];
      oppLRef.current.innerHTML = opportunities.map(opp => `
        <div class="dx-row">
          <div class="dx-row-label">${opp.pair}</div>
          <div class="dx-row-value">${opp.profit}</div>
        </div>
      `).join('');
    }

    if (execGridRef.current) {
      const executions = [
        { hash: '0x7a3f...b291', profit: '+$342.50', time: '12s ago', chain: 'SOL' },
        { hash: '0x2e8c...d174', profit: '+$218.30', time: '34s ago', chain: 'ETH' },
        { hash: '0x9b4d...f823', profit: '+$156.20', time: '1m ago', chain: 'BSC' },
      ];
      execGridRef.current.innerHTML = executions.map(exec => `
        <div class="exec-item">
          <div style="display:flex;align-items:center;gap:8px"><span class="tag ${exec.chain.toLowerCase()}">${exec.chain}</span><span style="font-family:var(--mono);font-size:11px;cursor:pointer;color:var(--pb)">${exec.hash}</span></div>
          <div style="font-family:var(--mono);color:var(--dashboardroot-teal);font-weight:900">${exec.profit}</div>
          <div style="font-size:10px;color:var(--dashboardroot-muted)">${exec.time}</div>
        </div>
      `).join('');
    }

    if (fuTrackRef.current) {
      const users = [
        { name: 'Alex***', country: '🇺🇸', amount: '$1,240' },
        { name: 'Maria***', country: '🇬🇧', amount: '$892' },
        { name: 'Wei***', country: '🇸🇬', amount: '$2,100' },
        { name: 'Carlos***', country: '🇧🇷', amount: '$567' },
      ];
      fuTrackRef.current.innerHTML = [...users, ...users].map(user => `
        <div class="fu-item">
          <div style="display:flex;align-items:center;gap:6px"><span style="font-size:16px">${user.country}</span><span style="font-weight:600">${user.name}</span></div>
          <div style="font-family:var(--mono);color:var(--dashboardroot-muted);font-weight:700">${user.amount}</div>
        </div>
      `).join('');
    }

    if (heatmapRef.current) {
      const days = 28;
      let html = '';
      for (let i = 0; i < days; i++) {
        const profit = Math.random() * 100;
        let intensity = '';
        if (profit > 80) intensity = 'h4';
        else if (profit > 60) intensity = 'h3';
        else if (profit > 40) intensity = 'h2';
        else intensity = 'h1';
        html += `<div class="hcell ${intensity}" title="+$${Math.floor(profit * 10)}"></div>`;
        if ((i + 1) % 7 === 0 && i !== days - 1) html += '<div style="grid-column:1/-1;height:2px"></div>';
      }
      heatmapRef.current.innerHTML = html;
    }

    let oppCount = 142;
    const opmElement = document.getElementById('opm');
    if (opmElement) {
      const oppInterval = setInterval(() => {
        oppCount = Math.floor(140 + Math.random() * 20);
        opmElement.textContent = `${oppCount}/m`;
      }, 3000);
      return () => clearInterval(oppInterval);
    }
  }, [dashboardData]);

  // ---- Small presentational helpers (styling only, no state/logic) ----
  const StatIcon = ({ children, tone = "blue" }) => (
    <div className={`dx-icon-badge dx-icon-${tone}`}>{children}</div>
  );

  const Sparkline = ({ seed = 1 }) => {
    const pts = [8, 20, 14, 26, 18, 30, 22, 34];
    const off = seed % pts.length;
    const rotated = [...pts.slice(off), ...pts.slice(0, off)];
    const w = 160, h = 34, step = w / (rotated.length - 1);
    const d = rotated.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(h - v).toFixed(1)}`).join(' ');
    return (
      <svg className="dx-sparkline-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path d={d} fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const MiniBars = ({ seed = 1 }) => {
    const heights = [10, 22, 14, 26, 12, 24];
    const off = seed % heights.length;
    const rotated = [...heights.slice(off), ...heights.slice(0, off)];
    return (
      <div className="dx-bars">
        {rotated.map((h, i) => (
          <span key={i} className={`dx-bar ${i === 2 || i === 4 ? 'active' : ''}`} style={{ height: `${h}px` }}></span>
        ))}
      </div>
    );
  };

  // Circular gauge used by Trading Package + Accelerator Rank cards
  const CircularGauge = ({ percent = 0, size = 120, stroke = 9, colorFrom = "#0ea5e9", colorTo = "#14b8a6", gradId, centerTop, centerBottom, track = true }) => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const off = c - (c * Math.min(100, Math.max(0, percent))) / 100;
    const cx = size / 2, cy = size / 2;
    return (
      <div className="dx-gauge-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={colorFrom} />
              <stop offset="100%" stopColor={colorTo} />
            </linearGradient>
          </defs>
          {track && <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--dashboardroot-track)" strokeWidth={stroke} />}
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={`url(#${gradId})`} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={off}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </svg>
        <div className="dx-gauge-center">
          <div className="dx-gauge-top">{centerTop}</div>
          {centerBottom && <div className="dx-gauge-bottom">{centerBottom}</div>}
        </div>
      </div>
    );
  };

  // ---- Static config for NEW presentational sections ----
  // NOTE: these read from dashboardData with safe fallbacks; wire real API fields
  // into the bracketed keys below whenever the backend exposes them.
  const quickActions = [
    {
      key: 'Deposit', label: 'Deposit', active: true, path: '/user/dashboard/deposit', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><rect x="3" y="5" width="14" height="11" rx="2" /><path d="M3 8h14" strokeLinecap="round" /></svg>
      )
    },
    {
      key: 'Withdraw', label: 'Withdraw', path: '/user/dashboard/wallet-statement', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><path d="M10 3v11M6 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16.5h12" strokeLinecap="round" /></svg>
      )
    },
    {
      key: 'BuyPackage', label: 'Buy Package', path: '/user/dashboard/analytics', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><path d="M3 7l7-4 7 4-7 4-7-4z" /><path d="M3 7v6l7 4 7-4V7" /></svg>
      )
    },
    {
      key: 'MyTeam', label: 'My Team', path: '/user/dashboard/fund-director', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><circle cx="7" cy="6" r="2.4" /><circle cx="14" cy="7" r="2" /><path d="M2 17c0-2.6 2.3-4.5 5-4.5s5 1.9 5 4.5" strokeLinecap="round" /><path d="M13 12.8c1.9.3 3.5 1.9 3.5 4.2" strokeLinecap="round" /></svg>
      )
    },
    {
      key: 'GrowthRewards', label: 'Growth Rewards', path: '/user/dashboard/Team', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><circle cx="10" cy="10" r="6.5" /><path d="M10 6.5v3.5l2.3 2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )
    },
    {
      key: 'Accelerator', label: 'Accelerator', path: '/user/dashboard/income-statement', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><path d="M10 2l1.8 4.6L17 8l-4 3.2L14 17l-4-2.7L6 17l1-5.8-4-3.2 5.2-1.4L10 2z" strokeLinejoin="round" /></svg>
      )
    },
    {
      key: 'Transactions', label: 'Transactions', path: '/user/dashboard/my-rewards', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><path d="M4 6h9l-2.5-2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 14H7l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )
    },
  ];

  const [activeQuickAction, setActiveQuickAction] = useState('Deposit');

  const wallets = [
    {
      key: 'income',
      label: 'Income Wallet',
      value: dashboardData?.[0]?.IncomeWallet ?? 0,
      icon: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><circle cx="10" cy="10" r="7" /><path d="M10 6.5v7M7.5 8.3c0-1 .9-1.6 2.5-1.6s2.5.7 2.5 1.7-1 1.4-2.5 1.6c-1.6.2-2.5.7-2.5 1.7s.9 1.7 2.5 1.7 2.5-.6 2.5-1.6" strokeLinecap="round" /></svg>),
      primaryLabel: 'Withdraw',
      onPrimary: () => router.push('/user/dashboard/withdraw'),
    },
    {
      key: 'trading',
      label: 'Trading Wallet',
      value: dashboardData?.[0]?.TradingWallet ?? 0,
      icon: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><polyline points="2,14 6,8 10,11 14,5 18,8" /></svg>),
      primaryLabel: 'Trade',
      onPrimary: () => router.push('/user/dashboard/trade'),
    },
    {
      key: 'deposit',
      label: 'Deposit Wallet',
      value: dashboardData?.[0]?.DepositWallet ?? 0,
      icon: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><rect x="3" y="6" width="14" height="10" rx="2" /><path d="M3 9h14" strokeLinecap="round" /></svg>),
      primaryLabel: 'Deposit',
      onPrimary: () => router.push('/user/dashboard/deposit'),
    },
  ];

  const achievements = [
    { title: 'Trading Package Activated', sub: dashboardData?.[0]?.TradingPackage ? `${dashboardData[0].TradingPackage} package unlocked full benefits` : 'Package unlocked full benefits' },
    { title: 'Growth Reward Achieved', sub: dashboardData?.[0]?.CurrentGrowthReward ? `${dashboardData[0].CurrentGrowthReward} reward credited` : 'Reward credited' },
    { title: 'Active Team Members', sub: `${dashboardData?.[0]?.ActiveTeam ?? ((dashboardData?.[0]?.LeftTeam || 0) + (dashboardData?.[0]?.RightTeam || 0))} active team members` },
    { title: `Rank ${dashboardData?.[0]?.UserRank || 'V1'} Achieved`, sub: 'Rank milestone unlocked' },
  ];

  const growthLevels = [
    { level: 'G1', required: 100000, current: 100000, reward: 5000 },
    { level: 'G2', required: 250000, current: 250000, reward: 10000 },
    { level: 'G3', required: 500000, current: Number(dashboardData?.[0]?.TeamBusiness ?? 425000), reward: 25000 },
    { level: 'G4', required: 1000000, current: Number(dashboardData?.[0]?.TeamBusiness ?? 425000), reward: 50000 },
  ];
  const currentGrowthIdx = Math.max(0, growthLevels.findIndex(g => g.current < g.required));
  const activeGrowthIdx = currentGrowthIdx === -1 ? growthLevels.length - 1 : currentGrowthIdx;
  const growthPct = Math.min(100, Math.round((growthLevels[activeGrowthIdx].current / growthLevels[activeGrowthIdx].required) * 100));

  const rankLevels = [
    { rank: 'V1', business: '₹5L', status: 'achieved' },
    { rank: 'V2', business: '₹10L', status: 'current', progress: 75 },
    { rank: 'V3', business: '₹25L', status: 'upcoming' },
    { rank: 'V4', business: '₹50L', status: 'upcoming' },
    { rank: 'V5', business: '₹1Cr', status: 'upcoming' },
  ];

  // Recent wallet activity — replace with API rows when available
  // Business Overview values — derived from the API fields already in use.
  // Rename the right-hand side keys if your API uses different names.
  const inr = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const leftBiz = Number(dashboardData?.[0]?.LeftBussiness ?? dashboardData?.[0]?.LeftBusiness ?? 0);
  const rightBiz = Number(dashboardData?.[0]?.RightBussiness ?? dashboardData?.[0]?.RightBusiness ?? 0);
  const totalTeam = dashboardData?.[0]?.TotalTeam ?? ((dashboardData?.[0]?.LeftTeam || 0) + (dashboardData?.[0]?.RightTeam || 0));
  const activeTeam = dashboardData?.[0]?.ActiveTeam ?? 0;
  const teamBusiness = dashboardData?.[0]?.TeamBusiness ?? (leftBiz + rightBiz);
  const strongTeamBusiness = dashboardData?.[0]?.StrongTeamBusiness ?? Math.max(leftBiz, rightBiz);
  const otherLegBusiness = dashboardData?.[0]?.OtherLegBusiness ?? Math.min(leftBiz, rightBiz);

  const recentTransactions = [
    { id: '#TRX10291', date: '24 Aug 2026', type: 'Daily Trading Income', wallet: 'Income Wallet', amount: '+₹5,250', status: 'Completed', tone: 'success' },
    { id: '#TRX10277', date: '23 Aug 2026', type: 'Direct Income', wallet: 'Income Wallet', amount: '+₹2,000', status: 'Completed', tone: 'success' },
    { id: '#TRX10254', date: '22 Aug 2026', type: 'Withdrawal', wallet: 'Income Wallet', amount: '-₹8,000', status: 'Pending', tone: 'warning' },
    { id: '#TRX10231', date: '21 Aug 2026', type: 'Team Trading Income', wallet: 'Trading Wallet', amount: '+₹3,420', status: 'Completed', tone: 'success' },
    { id: '#TRX10198', date: '20 Aug 2026', type: 'Deposit', wallet: 'Deposit Wallet', amount: '+₹25,000', status: 'Failed', tone: 'danger' },
  ];

  // Recent achievements — replace with API rows when available
  const recentAchievements = [
    { title: 'Trading Package Activated', sub: 'Elite package unlocked full benefits' },
    { title: 'Growth Reward G2 Achieved', sub: '₹10,000 reward credited' },
    { title: '100 Active Team Members', sub: 'Team milestone reached' },
    { title: `Accelerator ${dashboardData?.[0]?.UserRank || 'V1'} Achieved`, sub: 'First rank unlocked' },
  ];

  return (
    <>
      <div className="" data-theme={theme}>

        {/* SIMPLE POPUP - ONLY FOR Kid = 1 (Auto appears on page load) */}
        {showSimplePopup && isKidOne && !shouldBotBeActive && (
          <div className="dx-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeSimplePopup(); }}>
            <div className="dx-modal">
              <div className="dx-modal-bar" style={{ background: "linear-gradient(90deg, #14b8a6, #0ea5e9, #f59e0b)" }}></div>
              <button type="button" className="dx-modal-close" onClick={closeSimplePopup} aria-label="Close">✕</button>

              <div className="p-4 text-center">
                <div className="dx-icon-circle mx-auto mb-3">
                  <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
                    <rect x="10" y="18" width="44" height="34" rx="9" stroke="#14b8a6" strokeWidth="1.8" />
                    <rect x="10" y="18" width="44" height="12" rx="9" fill="rgba(20,184,166,0.15)" />
                    <rect x="19" y="28" width="8" height="8" rx="3" fill="#0ea5e9" />
                    <rect x="37" y="28" width="8" height="8" rx="3" fill="#14b8a6" />
                    <circle cx="23" cy="32" r="2" fill="#fff" opacity=".7" />
                    <circle cx="41" cy="32" r="2" fill="#fff" opacity=".7" />
                    <path d="M22 42h20" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M26 18V13M38 18V13" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="26" cy="11" r="3" fill="#0ea5e9" />
                    <circle cx="38" cy="11" r="3" fill="#0ea5e9" />
                  </svg>
                </div>

                <h5 className="fw-bold mb-3 dx-gradient-text">🤖 Trading Bot Activation Required</h5>

                <p className="dx-muted small mb-2">Dear Investor,</p>
                <p className="small mb-3 dx-ink">
                  To start receiving your trading income, please activate the AI Trading Bot once from your dashboard.
                </p>

                <div className="dx-tip-box mb-2">
                  ⚡ After activation, the system will automatically connect your account with the trading engine and your trading income process will begin.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BUY PACKAGE POPUP - ONLY FOR Kid = 5 */}
        {showBuyPackagePopup && isKidFive && !shouldBotBeActive && (
          <div className="dx-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeBuyPackagePopup(); }}>
            <div className="dx-modal">
              <div className="dx-modal-bar" style={{ background: "linear-gradient(90deg, #f59e0b, #f97316, #ef4444)" }}></div>
              <button type="button" className="dx-modal-close" onClick={closeBuyPackagePopup} aria-label="Close">✕</button>

              <div className="p-4 text-center">
                <div className="dx-icon-circle mx-auto mb-3" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.15))" }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
                    <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" />
                    <path d="M16 21V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V21" />
                    <path d="M12 7V5" /><path d="M9 13H15" /><path d="M12 10V16" />
                  </svg>
                </div>

                <h5 className="fw-bold mb-3" style={{ color: "#d97706" }}>📦 Package Purchase Required</h5>

                <p className="dx-muted small mb-2">Dear Investor,</p>
                <p className="small mb-3 dx-ink">Please purchase a trading package to activate your AI Trading Bot.</p>

                <div className="dx-tip-box mb-2" style={{ background: "rgba(245,158,11,0.08)", color: "#b45309" }}>
                  🛒 Choose a package that suits your investment goals and start earning!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONGRATULATION POPUP */}
        {showCongratsPopup && (
          <div className="dx-overlay" style={{ zIndex: 10000 }} onClick={(e) => { if (e.target === e.currentTarget) closeCongratsPopup(); }}>
            <div className="dx-modal dx-modal-celebrate">
              <div className="dx-modal-bar" style={{ background: "linear-gradient(90deg, #10b981, #34d399, #f59e0b, #8b5cf6)" }}></div>
              <button type="button" className="dx-modal-close" onClick={closeCongratsPopup} aria-label="Close">✕</button>

              <div className="p-4 text-center">
                <div className="dx-icon-circle mx-auto mb-3" style={{ width: 84, height: 84, background: "linear-gradient(135deg,#10b981,#34d399,#8b5cf6)" }}>
                  <span style={{ fontSize: 42 }}>🤖</span>
                </div>
                <div className="fs-2 fw-bold dx-gradient-text mb-1">🎉 Woo Hoo! 🎉</div>
                <div className="fs-4 fw-bold mb-3 dx-gradient-text-alt">Bot Activated Successfully!</div>
                <p className="small mb-2 dx-ink">Your AI Trading Bot is now live and actively monitoring the markets!</p>
                <p className="small dx-muted mb-0">🚀 The bot has started scanning for profitable opportunities</p>
              </div>
            </div>
          </div>
        )}

        {/* BOT ACTIVATION FULL POPUP */}
        {showBotPopup && isKidOne && !shouldBotBeActive && (
          <div className="dx-overlay" id="botOv" onClick={(e) => { if (e.target === e.currentTarget) closeBotFullPopup(); }}>
            <div className="dx-modal">
              <div className="dx-modal-bar" style={{ background: "linear-gradient(90deg, #14b8a6, #0ea5e9)" }}></div>
              <button type="button" className="dx-modal-close" onClick={closeBotFullPopup} aria-label="Close">✕</button>

              <div className="p-4">
                <div className="d-flex gap-3 mb-3">
                  <div className="dx-icon-circle flex-shrink-0" style={{ width: 60, height: 60 }}>
                    <svg width="38" height="38" viewBox="0 0 64 64" fill="none">
                      <rect x="10" y="18" width="44" height="34" rx="9" stroke="#14b8a6" strokeWidth="1.5" />
                      <rect x="10" y="18" width="44" height="12" rx="9" fill="rgba(20,184,166,0.15)" />
                      <rect x="19" y="28" width="8" height="8" rx="3" fill="#0ea5e9" opacity=".9" />
                      <rect x="37" y="28" width="8" height="8" rx="3" fill="#14b8a6" opacity=".9" />
                      <circle cx="23" cy="32" r="2" fill="#fff" opacity=".7" />
                      <circle cx="41" cy="32" r="2" fill="#fff" opacity=".7" />
                      <path d="M22 42h20" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="fw-bold fs-6 mb-1 dx-ink">🤖 Trading <span style={{ color: "#14b8a6" }}>Bot Activation Required</span></div>
                    <div className="small dx-muted lh-sm">
                      Dear Investor, To start receiving your trading income, please activate the AI Trading Bot once from your dashboard.
                    </div>
                  </div>
                </div>

                <div className="dx-tip-box mb-3">
                  ⚡ After activation, the system will automatically connect your account with the trading engine and your trading income process will begin.
                </div>

                <ul className="list-unstyled small mb-3 dx-ink">
                  <li className="d-flex align-items-center gap-2 mb-2"><span className="dx-dot"></span>The bot may execute automated buy/sell orders</li>
                  <li className="d-flex align-items-center gap-2 mb-2"><span className="dx-dot"></span>Perform arbitrage and MEV trading</li>
                  <li className="d-flex align-items-center gap-2 mb-2"><span className="dx-dot"></span>Monitor market opportunities 24/7</li>
                </ul>

                <div className="d-flex align-items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="approveTrading"
                    className="form-check-input mt-0"
                    checked={isCheckboxChecked}
                    onChange={(e) => setIsCheckboxChecked(e.target.checked)}
                  />
                  <label htmlFor="approveTrading" className="small mb-0 dx-ink" style={{ cursor: "pointer" }}>
                    I understand and approve automated trading execution.
                  </label>
                </div>

                <button
                  className="btn dx-btn-primary w-100 py-2 fw-bold"
                  onClick={activateBot}
                  disabled={shouldBotBeActive || !isCheckboxChecked}
                >
                  {shouldBotBeActive ? '✔ Bot Active' : '🔴 Activate Bot — Start Earning Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REFERRAL POPUP */}
        {showRefPopup && (
          <div className="dx-overlay" id="refOv" onClick={(e) => { if (e.target === e.currentTarget) closeRef(); }}>
            <div className="dx-modal">
              <div className="dx-modal-bar" style={{ background: "linear-gradient(90deg, #14b8a6, #f59e0b)" }}></div>
              <button type="button" className="dx-modal-close" onClick={closeRef} aria-label="Close">✕</button>

              <div className="p-4">
                <div className="text-center mb-3">
                  <div className="fs-5 fw-bold mb-1 dx-ink">Invite &amp; <span style={{ color: "#14b8a6" }}>Earn</span></div>
                  <div className="small dx-muted">
                    Share your link · Earn up to <strong style={{ color: "#f59e0b" }}>8% commission</strong> on every trade — 3 levels deep, paid daily
                  </div>
                </div>

                <div className="row g-2 mb-3 text-center">
                  <div className="col-4"><div className="dx-mini-stat"><div className="dx-mini-stat-value" style={{ color: "#14b8a6" }}>12</div><div className="dx-mini-stat-label">Referrals</div></div></div>
                  <div className="col-4"><div className="dx-mini-stat"><div className="dx-mini-stat-value" style={{ color: "#10b981" }}>$841</div><div className="dx-mini-stat-label">Earned</div></div></div>
                  <div className="col-4"><div className="dx-mini-stat"><div className="dx-mini-stat-value" style={{ color: "#0ea5e9" }}>$92k</div><div className="dx-mini-stat-label">Team Vol</div></div></div>
                </div>

                <div className="dx-eyebrow mb-2">Your Unique Referral Link</div>
                <div className="dx-ref-link mb-2">https://arbion.ai/ref/ARB-a9x7k2-premium</div>
                <button className="btn dx-btn-primary w-100 mb-3" onClick={copyRef}>
                  {copySuccess ? "✓ Copied!" : "Copy Referral Link"}
                </button>

                <div className="row g-2 mb-3 text-center">
                  <div className="col-4"><div className="dx-level-box" style={{ background: "rgba(16,185,129,.08)", borderColor: "rgba(16,185,129,.25)" }}><div className="fw-bold" style={{ color: "#10b981" }}>8%</div><div className="dx-mini-stat-label">Level 1</div></div></div>
                  <div className="col-4"><div className="dx-level-box" style={{ background: "rgba(14,165,233,.08)", borderColor: "rgba(14,165,233,.25)" }}><div className="fw-bold" style={{ color: "#0ea5e9" }}>5%</div><div className="dx-mini-stat-label">Level 2</div></div></div>
                  <div className="col-4"><div className="dx-level-box" style={{ background: "rgba(139,92,246,.08)", borderColor: "rgba(139,92,246,.25)" }}><div className="fw-bold" style={{ color: "#8b5cf6" }}>3%</div><div className="dx-mini-stat-label">Level 3</div></div></div>
                </div>

                <div className="dx-eyebrow mb-2">Share on Social Media</div>
                <div className="row g-2">
                  <div className="col-3"><button className="btn w-100 text-white btn-sm" style={{ background: "#25D366" }} onClick={() => shareOn('WhatsApp')}>WA</button></div>
                  <div className="col-3"><button className="btn w-100 text-white btn-sm" style={{ background: "#1877F2" }} onClick={() => shareOn('Facebook')}>FB</button></div>
                  <div className="col-3"><button className="btn w-100 text-white btn-sm" style={{ background: "#E4405F" }} onClick={() => shareOn('Instagram')}>IG</button></div>
                  <div className="col-3"><button className="btn w-100 text-white btn-sm" style={{ background: "#0088cc" }} onClick={() => shareOn('Telegram')}>TG</button></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container-fluid px-0">
          {/* ANNOUNCEMENT SECTION */}
          {showAnnouncement && dashboardData?.[0]?.News && (() => {
            const newsText = dashboardData[0].News.replace(/<[^>]*>/g, '');
            return (
              <div className="dx-ann mb-3" id="annEl">
                <span className="dx-ann-badge">📢 LIVE</span>
                <div className="dx-ann-ticker"><div className="dx-ann-track">
                  <span className="dx-ann-item">{newsText}</span>
                  <span className="dx-ann-item">{newsText}</span>
                </div></div>
                <button type="button" className="dx-ann-close" onClick={closeAnnouncement} aria-label="Dismiss">✕</button>
              </div>
            );
          })()}

      
          <RankProgress activeRank={dashboardData?.[0]?.UserRank} NextRank={dashboardData?.[0]?.NextRank} totQualifyRnk={dashboardData?.[0]?.totQualifyRnk} />



          {/* QUICK ACTIONS */}
          <div className="dx-section-head mt-4 mb-3">
            <h5 className="dx-section-title">Quick Actions</h5>
          </div>
          <div className="dx-quick-row mb-4">
            {quickActions.map((qa) => (
              <button
                key={qa.key}
                type="button"
                className={`dx-quick-btn ${activeQuickAction === qa.key ? 'active' : ''}`}
                onClick={() => { setActiveQuickAction(qa.key); if (qa.path) router.push(qa.path); }}
              >
                <span className="dx-quick-icon">{qa.icon}</span>
                <span className="dx-quick-label">{qa.label}</span>
              </button>
            ))}
          </div>



          {/* RANK & PACKAGE */}
          <div className="dx-section-head mb-3">
            <h5 className="dx-section-title">Accelerator Rank</h5>
            <div className="dx-section-sub">Your premium rank achievement system</div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-lg-6"> 
              <div className="dx-card h-100">
                <div className="dx-card-title mb-1">Your Rank Journey</div>
                <div className="dx-card-sub mb-3">Your premium rank achievement system</div>
                <div className="d-flex align-items-center gap-4 flex-wrap">
                  <CircularGauge
                    percent={rankLevels.find(r => r.status === 'current')?.progress || 0}
                    size={110} stroke={9} colorFrom="#5eead4" colorTo="#0d9488" gradId="rankGrad"
                    centerTop={dashboardData?.[0]?.UserRank || 'V1'}
                    centerBottom={`${rankLevels.find(r => r.status === 'current')?.progress || 0}%`}
                  />
                  <div className="flex-grow-1">
                    <div className="dx-row"><div className="dx-row-label">Current Business</div><div className="dx-row-value">₹{Number(dashboardData?.[0]?.TeamBusiness || 0).toLocaleString('en-IN')}</div></div>
                    <div className="dx-row"><div className="dx-row-label">Next Rank</div><div className="dx-row-value">{dashboardData?.[0]?.NextRank || 'V2'}</div></div>
                    <div className="dx-row"><div className="dx-row-label">Required Business</div><div className="dx-row-value">₹10,00,000</div></div>
                    <div className="dx-row"><div className="dx-row-label">Remaining</div><div className="dx-row-value">₹2,50,000</div></div>
                  </div>
                </div> 
            </div>
            </div>

            <div className="col-lg-6">
       <div className="dx-card h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="dx-card-title">Trading Package</div>
                  <span className="dx-badge-soft">${dashboardData?.[0]?.TotalInvestment || "0.00"}</span>
                </div>

                <div className="d-flex justify-content-center my-3 position-relative">
                  <CircularGauge percent={visualPercent} size={120} stroke={9} colorFrom="#0ea5e9" colorTo="#14b8a6" gradId="rg" centerTop={`${visualPercent}%`} centerBottom="used" />
                </div>

                <div className="row text-center g-2">
                  <div className="col-4">
                    <div className="dx-mini-stat-label">Total Income</div>
                    <div className="fw-bold" style={{ color: "#14b8a6" }}>${(dashboardData?.[0]?.TotalIncome || 0).toFixed(2) || "0.00"}</div>
                  </div>
                  <div className="col-4">
                    <div className="dx-mini-stat-label">Max Limit</div>
                    <div className="fw-bold" style={{ color: "#f59e0b" }}>${(dashboardData?.[0]?.EarningLimit || 0).toFixed(2) || "0.00"}</div>
                  </div>
                  <div className="col-4">
                    <div className="dx-mini-stat-label">Remaining</div>
                    <div className="fw-bold" style={{ color: "#10b981" }}>${(dashboardData?.[0]?.RemainingLimit || 0).toFixed(2) || "0.00"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* INCOME OVERVIEW */}
          <div className="dx-section-head mb-3">
            <h5 className="dx-section-title">Income Overview</h5>
            <div className="dx-section-sub">Your earnings across all Roventar income streams</div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4 col-xl-3">
              <div className="dx-card dx-stat-card h-100" role="button"
                onClick={() => router.push('/user/dashboard/income-statement?tab=SingleLegIncome')}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <StatIcon tone="blue">
                    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.5" width="19" height="19" stroke="currentColor">
                      <circle cx="7" cy="5.5" r="3" /><circle cx="14" cy="6.5" r="2.5" />
                      <path d="M1 17c0-2.8 2.7-5 6-5s6 2.2 6 5" strokeLinecap="round" />
                      <path d="M14 10.5c2 .4 3.5 2 3.5 4" strokeLinecap="round" />
                    </svg>
                  </StatIcon>
                  <span className="dx-badge-up">↗ ${dashboardData?.[0]?.SingleSpillIncomeToday || "0.00"}</span>
                </div>
                <div className="dx-stat-label">Single Leg Income</div>
                <div className="dx-stat-value">${dashboardData?.[0]?.SingleSpillIncome || "0.00"}</div>
               
              </div>
            </div>

            <div className="col-6 col-md-4 col-xl-3">
              <div className="dx-card dx-stat-card h-100" role="button"
                onClick={() => router.push('/user/dashboard/income-statement?tab=PairVolumeIncome')}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <StatIcon tone="blue">
                    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.5" width="19" height="19" stroke="currentColor">
                      <polyline points="2,14 6,8 10,11 14,5 18,8" />
                      <path d="M14 3h4v4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </StatIcon>
                  <span className="dx-badge-up">↗ ${dashboardData?.[0]?.PairVolumeIncomeToday || "0.00"}</span>
                </div>
                <div className="dx-stat-label">Pair Volume Income</div>
                <div className="dx-stat-value">${dashboardData?.[0]?.PairVolumeIncome || "0.00"}</div>
                
              </div>
            </div>

            <div className="col-6 col-md-4 col-xl-3">
              <div className="dx-card dx-stat-card h-100" role="button"
                onClick={() => router.push('/user/dashboard/income-statement?tab=TradingBotIncome')}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <StatIcon tone="blue">
                    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.5" width="19" height="19" stroke="currentColor">
                      <path d="M10 2L3 6.5v7L10 18l7-4.5v-7z" strokeLinejoin="round" />
                      <path d="M10 11V8M8 9.5h4" strokeLinecap="round" />
                    </svg>
                  </StatIcon>
                  <span className="dx-badge-up">↗ ${dashboardData?.[0]?.TradingBotIncomeToday || "0.00"}</span>
                </div>
                <div className="dx-stat-label">Trading Bot Income</div>
                <div className="dx-stat-value">${dashboardData?.[0]?.TradingBotIncome || "0.00"}</div>
                
              </div>
            </div>

            <div className="col-6 col-md-4 col-xl-3">
              <div className="dx-card dx-stat-card h-100" role="button"
                onClick={() => router.push('/user/dashboard/income-statement?tab=LeadershipRecurringIncome')}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <StatIcon tone="blue">
                    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.5" width="19" height="19" stroke="currentColor">
                      <circle cx="10" cy="10" r="4" />
                      <path d="M10 2v2M10 16v2M2 10h2M16 10h2" strokeLinecap="round" />
                      <path d="M10 8v2l1.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </StatIcon>
                  <span className="dx-badge-up">↗ ${dashboardData?.[0]?.LeadershipTradingIncomeToday || "0.00"}</span>
                </div>
                <div className="dx-stat-label">Leadership Recurring Income</div>
                <div className="dx-stat-value">${dashboardData?.[0]?.LeadershipTradingIncome || "0.00"}</div>
               
              </div>
            </div>

            <div className="col-6 col-md-4 col-xl-3">
              <div className="dx-card dx-stat-card h-100" role="button"
                onClick={() => router.push('/user/dashboard/income-statement?tab=PowerBoostIncome')}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <StatIcon tone="blue">
                    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.5" width="19" height="19" stroke="currentColor">
                      <circle cx="7" cy="5.5" r="3" /><circle cx="14" cy="6.5" r="2.5" />
                      <path d="M1 17c0-2.8 2.7-5 6-5s6 2.2 6 5" strokeLinecap="round" />
                      <path d="M14 10.5c2 .4 3.5 2 3.5 4" strokeLinecap="round" />
                    </svg>
                  </StatIcon>
                  <span className="dx-badge-up">↗ ${dashboardData?.[0]?.PowerBoostIncomeToday || "0.00"}</span>
                </div>
                <div className="dx-stat-label">Power Boost Income</div>
                <div className="dx-stat-value">${dashboardData?.[0]?.PowerBoostIncome || "0.00"}</div>
                 
              </div>
            </div>

            <div className="col-6 col-md-4 col-xl-3">
              <div className="dx-card dx-stat-card h-100" role="button"
                onClick={() => router.push('/user/dashboard/income-statement?tab=RewardIncome')}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <StatIcon tone="blue">
                    <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.5" width="19" height="19" stroke="currentColor">
                      <polyline points="2,14 6,8 10,11 14,5 18,8" />
                      <path d="M14 3h4v4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </StatIcon>
                  <span className="dx-badge-up">↗ ${dashboardData?.[0]?.RewardIncomeToday || "0.00"}</span>
                </div>
                <div className="dx-stat-label">Reward Income</div>
                <div className="dx-stat-value">${dashboardData?.[0]?.RewardIncome || "0.00"}</div>
               
              </div>
            </div>
          </div>

          {/* WALLET OVERVIEW — NEW */}
          <div className="dx-section-head mb-3">
            <h5 className="dx-section-title">Wallet Overview</h5>
            <div className="dx-section-sub">Manage your Roventar wallet balances</div>
          </div>
          <div className="row g-3 mb-4">
            {wallets.map((w) => (
              <div className="col-md-4" key={w.key}>
                <div className="dx-card dx-wallet-card h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <StatIcon tone="teal">{w.icon}</StatIcon>
                    <span className="dx-badge-up">Active</span>
                  </div>
                  <div className="dx-stat-label">{w.label}</div>
                  <div className="dx-stat-value mb-3">${Number(w.value || 0).toFixed(2)}</div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn dx-btn-outline flex-fill" onClick={() => router.push('/user/dashboard/wallet')}>View Wallet</button>
                    <button type="button" className="btn dx-btn-primary flex-fill" onClick={w.onPrimary}>{w.primaryLabel}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BOT + SUMMARY */}
          <div className="dx-section-head mb-3">
            <h5 className="dx-section-title">AI Trading Engine</h5>
            <div className="dx-section-sub">Live bot status and your summary report</div>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="dx-card h-100 position-relative overflow-hidden">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div className="d-flex gap-3">
                    <div className="position-relative">
                      <div className="dx-orb">🤖</div>
                      {shouldBotBeActive && <span className="dx-orb-pulse"></span>}
                    </div>
                    <div>
                      <div className="dx-card-title">Roventar AI Engine</div>
                      <div className="d-flex align-items-center gap-2 small dx-muted flex-wrap">
                        <span>Uptime {formatElapsedTime(elapsedSeconds)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={shouldBotBeActive ? "dx-pill-active" : "dx-pill-active off"}>
                    <span className={`dx-status-dot ${shouldBotBeActive ? 'on' : 'off'}`}></span>
                    {shouldBotBeActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="small dx-muted mb-3">
                  AI-driven Forex &amp; Crypto trading engine operating 24/7 — automatically scanning market trends and executing profitable trading opportunities with high-speed precision.
                </p>

                <div className="row g-2 text-center mb-3">
                  <div className="col-3">
                    <div className="dx-mini-stat">
                      <div className="dx-mini-stat-value">{dashboardData?.[0]?.Bot || 'N/A'}</div>
                      <div className="dx-mini-stat-label">Bot</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="dx-mini-stat">
                      <div className="dx-mini-stat-value">~{dashboardData?.[0]?.APY}</div>
                      <div className="dx-mini-stat-label">APY</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="dx-mini-stat">
                      <div className="dx-mini-stat-value" id="powerBoosterStatus">{dashboardData?.[0]?.PowerBoosterStatus}</div>
                      <div className="dx-mini-stat-label">Boost Status</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="dx-mini-stat">
                      <div className="dx-mini-stat-value">{dashboardData?.[0]?.BoosterValue}</div>
                      <div className="dx-mini-stat-label">Boost Power</div>
                    </div>
                  </div>
                </div>

                <button
                  className="btn dx-btn-primary w-100 py-2 fw-bold mb-2"
                  onClick={() => {
                    if (isKidFive && !shouldBotBeActive) {
                      setShowBuyPackagePopup(true);
                    } else if (isKidOne && !shouldBotBeActive) {
                      openBotFullPopup();
                    }
                  }}
                  disabled={shouldBotBeActive || isKidFive || (!isKidOne && !isKidFive)}
                >
                  {shouldBotBeActive ? '✔ Bot Active' :
                    (isKidFive ? '🔒 Bot Unavailable' :
                      (isKidOne ? '▶ Activate Bot' : '🔒 Not Available'))}
                </button>

                {shouldBotBeActive && (
                  <div className="dx-notif-bar" id="botNotif2">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                      <polyline points="2,8 5.5,11.5 14,3.5" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="small dx-ink">
                      <strong>Your Bot is now ACTIVATED!</strong> — Scanning 142+ opportunities/min across SOL, ETH &amp; BSC. First profit expected within 60 seconds.
                    </span>
                    <div className="dx-timer-box" id="timerBox2">
                      <div className="dx-timer-num">{formatBotTime(botTime)}</div>
                      <div className="dx-timer-lbl">🟢 Running</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-6">
              <div className="dx-card h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="dx-eyebrow mb-0">Summary Report Status</div>
                  <span className="dx-badge-soft" role="button" onClick={openRef}>
                    <span className="dx-status-dot on"></span>
                    {dashboardData?.[0]?.PowerBoosterStatus || "N/A"}
                  </span>
                </div>
                <div id="ol" ref={oppLRef}></div>
              </div>
            </div>
          </div>

          {/* BUSINESS OVERVIEW / NETWORK STATUS */}
          <div className="dx-section-head mb-3">
            <h5 className="dx-section-title">Business Overview</h5>
            <div className="dx-section-sub">Your team&apos;s collective trading business</div>
          </div>

          <div className="row g-3 mb-4 dx-biz-row">
            <div className="col-6 col-md-4 col-xl">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="teal">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="19" height="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  </svg>
                </StatIcon>
                <div className="dx-biz-value mt-3">{totalTeam}</div>
                <div className="dx-biz-label">Total Team</div>
                <MiniBars seed={1} />
              </div>
            </div>
            <div className="col-6 col-md-4 col-xl">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="green">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="19" height="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M19 8v6M22 11h-6" />
                  </svg>
                </StatIcon>
                <div className="dx-biz-value mt-3">{activeTeam}</div>
                <div className="dx-biz-label">Active Team</div>
                <MiniBars seed={2} />
              </div>
            </div>
            <div className="col-6 col-md-4 col-xl">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="blue">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="19" height="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,17 9,11 13,15 21,7" /><path d="M15 7h6v6" />
                  </svg>
                </StatIcon>
                <div className="dx-biz-value mt-3">{'₹'} {inr(teamBusiness)}</div>
                <div className="dx-biz-label">Team Business</div>
                <MiniBars seed={3} />
              </div>
            </div>
            <div className="col-6 col-md-4 col-xl">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="gold">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="19" height="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
                  </svg>
                </StatIcon>
                <div className="dx-biz-value mt-3">{'₹'} {inr(strongTeamBusiness)}</div>
                <div className="dx-biz-label">Strong Team Business</div>
                <MiniBars seed={4} />
              </div>
            </div>
            <div className="col-6 col-md-4 col-xl">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="teal">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="19" height="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                </StatIcon>
                <div className="dx-biz-value mt-3">{'₹'} {inr(otherLegBusiness)}</div>
                <div className="dx-biz-label">Other Leg Business</div>
                <MiniBars seed={5} />
              </div>
            </div>
          </div>

          {/* DIRECT TEAM PERFORMANCE */}
          <div className="dx-section-head mb-3">
            <h5 className="dx-section-title">Direct Team Performance</h5>
            <div className="dx-section-sub">Track your directly sponsored members</div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="blue">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="19" height="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </StatIcon>
                <div className="dx-biz-value mt-3">{dashboardData?.[0]?.TotalDirect ?? 0}</div>
                <div className="dx-biz-label">Total Direct</div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="green">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="19" height="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M19 8v6M22 11h-6" />
                  </svg>
                </StatIcon>
                <div className="dx-biz-value mt-3">{dashboardData?.[0]?.ActiveDirect ?? 0}</div>
                <div className="dx-biz-label">Active Direct</div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="teal">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="19" height="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </StatIcon>
                <div className="dx-biz-value mt-3">&#8377;{Number(dashboardData?.[0]?.DirectBusiness ?? dashboardData?.[0]?.DirectBussiness ?? 0).toLocaleString('en-IN')}</div>
                <div className="dx-biz-label">Direct Business</div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="gold">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="19" height="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" />
                  </svg>
                </StatIcon>
                <div className="dx-biz-label mt-3 mb-2">Level Open</div>
                <span className="dx-pill-active">
                  <span className="dx-status-dot on"></span>
                  LEVEL {dashboardData?.[0]?.LevelOpen ?? 0} OPEN
                </span>
              </div>
            </div>
          </div>


          {/* GROWTH REWARDS BANNER — NEW */}
          <div className="dx-section-head mb-3">
            <h5 className="dx-section-title">Growth Rewards</h5>
            <div className="dx-section-sub">Build your business. Unlock your next milestone.</div>
          </div>
          <div className="dx-growth-banner mb-4">
            <div className="row align-items-center g-3">
              <div className="col-lg-8">
                <div className="dx-eyebrow-light mb-1">Current Milestone</div>
                <div className="dx-growth-title">{growthLevels[activeGrowthIdx]?.level} — ₹{Number(growthLevels[activeGrowthIdx]?.reward).toLocaleString('en-IN')} Reward</div>
                <div className="row g-3 mt-2">
                  <div className="col-4">
                    <div className="dx-growth-label">Business Requirement</div>
                    <div className="dx-growth-value">₹{Number(growthLevels[activeGrowthIdx]?.required).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="col-4">
                    <div className="dx-growth-label">Current Business</div>
                    <div className="dx-growth-value">₹{Number(growthLevels[activeGrowthIdx]?.current).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="col-4">
                    <div className="dx-growth-label">Remaining</div>
                    <div className="dx-growth-value">₹{Math.max(0, Number(growthLevels[activeGrowthIdx]?.required) - Number(growthLevels[activeGrowthIdx]?.current)).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 d-flex justify-content-center">
                <CircularGauge percent={growthPct} size={132} stroke={10} colorFrom="#5eead4" colorTo="#14b8a6" gradId="growthGrad" centerTop={`${growthPct}%`} centerBottom={`${growthLevels[activeGrowthIdx]?.level} Progress`} />
              </div>
            </div>
          </div>

          {/* GROWTH REWARD JOURNEY — NEW */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="dx-card">
                <div className="fw-bold mb-3 dx-ink">Growth Reward Journey</div>
                <div className="dx-stepper mb-4">
                  {growthLevels.map((g, i) => (
                    <div className="dx-stepper-item" key={g.level}>
                      <div className={`dx-stepper-dot ${i < activeGrowthIdx ? 'done' : i === activeGrowthIdx ? 'current' : ''}`}>
                        {i < activeGrowthIdx ? (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polyline points="2,8 5.5,11.5 14,3.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        ) : g.level}
                      </div>
                      {i < growthLevels.length - 1 && <div className={`dx-stepper-line ${i < activeGrowthIdx ? 'done' : ''}`}></div>}
                    </div>
                  ))}
                </div>

                <div className="dx-eyebrow mb-2">Milestone Details</div>
                <div className="table-responsive">
                  <table className="table dx-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Level</th>
                        <th>Business Required</th>
                        <th>Current Business</th>
                        <th>Reward</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {growthLevels.map((g, i) => {
                        const pct = Math.min(100, Math.round((g.current / g.required) * 100));
                        const status = i < activeGrowthIdx ? 'Qualified' : i === activeGrowthIdx ? `${pct}%` : 'Upcoming';
                        const statusClass = i < activeGrowthIdx ? 'qualified' : i === activeGrowthIdx ? 'inprogress' : 'upcoming';
                        return (
                          <tr key={g.level}>
                            <td className="fw-semibold">{g.level}</td>
                            <td>₹{(g.required / 100000).toFixed(1)}L</td>
                            <td>₹{(g.current / 100000).toFixed(2)}L</td>
                            <td>₹{(g.reward / 1000)}K</td>
                            <td><span className={`dx-status-chip ${statusClass}`}>{status}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ACCELERATOR RANK + RANK JOURNEY — NEW */}
          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="dx-card h-100">
                <div className="fw-bold mb-3 dx-ink">Your Rank Journey</div>
                <div className="dx-rank-track mb-3">
                  {rankLevels.map((r) => (
                    <div key={r.rank} className={`dx-rank-tile ${r.status}`}>
                      <div className="dx-rank-tile-name">{r.rank}</div>
                      <div className="dx-rank-tile-biz">{r.business} Business</div>
                      <div className={`dx-rank-tile-status ${r.status}`}>
                        {r.status === 'achieved' ? '✓ Achieved' : r.status === 'current' ? `${r.progress}% Progress` : 'Upcoming'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="dx-next-action">
                  <div className="dx-eyebrow-light mb-1">Your Next Milestone</div>
                  <div className="dx-card-title mb-1">Grow your team business by ₹2,50,000</div>
                  <div className="small dx-muted mb-2">You are only 25% away from Accelerator {dashboardData?.[0]?.NextRank || 'V2'}.</div>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className="dx-tag-pill">Build active team</span>
                    <span className="dx-tag-pill">Increase direct business</span>
                    <span className="dx-tag-pill">Improve team volume</span>
                  </div>
                  <button type="button" className="btn dx-btn-dark" onClick={() => router.push('/user/dashboard/team')}>View Business</button>
                </div>
              </div>
            </div>
        
        <div className="col-lg-6"> 
          {/* RECENT TRANSACTIONS */}
          <div className="dx-card mb-4" id="transactions">
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-3">
              <div className="dx-section-head">
                <h5 className="dx-section-title">Recent Transactions</h5>
                <div className="dx-section-sub">Your latest wallet activity</div>
              </div> 
            </div>
            <div className="dx-table-wrap">
              <table className="dx-table-flat">
                <thead>
                  <tr>
                    <th>Date</th><th>Transaction ID</th><th>Type</th><th>Wallet</th><th>Amount</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t) => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td className="dx-mono">{t.id}</td>
                      <td>{t.type}</td>
                      <td>{t.wallet}</td>
                      <td className={t.amount.startsWith('-') ? 'dx-amount-down' : 'dx-amount-up'}>{t.amount}</td>
                      <td><span className={`dx-badge ${t.tone}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
          </div>

      
    

          {/* BOTTOM ROW */}
          <div className="dx-section-head mb-3">
            <h5 className="dx-section-title">Support &amp; Updates</h5>
            <div className="dx-section-sub">Assistant help and the latest Roventar notifications</div>
          </div>
          <div className="row g-3">
            <div className="col-lg-4">
              <div className="dx-card h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="dx-card-title">Recent Achievements</div>
                  <span className="dx-badge-soft">{recentAchievements.length}</span>
                </div>
                <div className="d-flex flex-column gap-2">
                  {recentAchievements.map((a) => (
                    <div className="dx-achieve-row" key={a.title}>
                      <div className="dx-achieve-check">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <polyline points="2,8 5.5,11.5 14,3.5" stroke="#0d9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <div className="dx-achieve-title">{a.title}</div>
                        <div className="dx-achieve-sub">{a.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="dx-card h-100 p-0 overflow-hidden">
                <XoxoFxChatbot />
              </div>
            </div>

            <div className="col-lg-4">
              <div className="dx-card h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="dx-card-title">Notifications</div>
                  <div className="dx-card-sub">{notificationCount} items</div>
                </div>

                <div className="dx-notif-list">
                  {notificationList && notificationList.length > 0 ? (
                    notificationList.map((n, i) => (
                      <div key={(n.URID || i) + i} className={`dx-notif-card ${n.Seen ? '' : 'unseen'}`}>
                        <div className="d-flex justify-content-between gap-2">
                          <div className="small dx-ink">{n.AdminRemarks || ''}</div>
                          <div className="small dx-muted flex-shrink-0">{n.Amount || ''}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="dx-notif-card" style={{ background: "rgba(20,184,166,0.06)" }}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="dx-tag" style={{ color: "#14b8a6" }}>UPDATE</span>
                          <span className="dx-mini-stat-label">2m ago</span>
                        </div>
                        <div className="small dx-ink">Arbitrum One now live — 3 chains running simultaneously. SOL/USDC spreads widening.</div>
                      </div>
                      <div className="dx-notif-card" style={{ background: "rgba(239,68,68,0.05)" }}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="dx-tag" style={{ color: "#ef4444" }}>ALERT</span>
                          <span className="dx-mini-stat-label">8m ago</span>
                        </div>
                        <div className="small dx-ink">High ETH volatility — bot in opportunistic mode. Execution frequency up 34%.</div>
                      </div>
                      <div className="dx-notif-card" style={{ background: "rgba(16,185,129,0.06)" }}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="dx-tag" style={{ color: "#059669" }}>NEWS</span>
                          <span className="dx-mini-stat-label">15m ago</span>
                        </div>
                        <div className="small dx-ink">BSC gas at 3 gwei — optimal conditions for cross-chain arb operations today.</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

        
        </div>
      </div>

    </>
  );
}