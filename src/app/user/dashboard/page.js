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


export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
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
  const [botActiveTime, setBotActiveTime] = useState(null);

  // Theme (light / dark) — persisted to localStorage
  const [theme, setTheme] = useState('light');

  const BOT_SESSION_KEY = 'xoxoBotActive';
  const BOT_START_KEY = 'xoxoBotStartTime';
  const THEME_KEY = 'xoxoTheme';


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

  // ---- Theme init / persistence (does not touch any business logic) ----
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

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
    const text = "Join me on XOXO AI Engine - earn up to 8% commission!";
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
          <div style="font-family:var(--mono);color:var(--dx-teal);font-weight:900">${exec.profit}</div>
          <div style="font-size:10px;color:var(--dx-muted)">${exec.time}</div>
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
          <div style="font-family:var(--mono);color:var(--dx-muted);font-weight:700">${user.amount}</div>
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
          {track && <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--dx-track)" strokeWidth={stroke} />}
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
      key: 'Withdraw', label: 'Withdraw', path: '/user/dashboard/withdraw', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><path d="M10 3v11M6 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16.5h12" strokeLinecap="round" /></svg>
      )
    },
    {
      key: 'BuyPackage', label: 'Buy Package', path: '/user/dashboard/package', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><path d="M3 7l7-4 7 4-7 4-7-4z" /><path d="M3 7v6l7 4 7-4V7" /></svg>
      )
    },
    {
      key: 'MyTeam', label: 'My Team', path: '/user/dashboard/team', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><circle cx="7" cy="6" r="2.4" /><circle cx="14" cy="7" r="2" /><path d="M2 17c0-2.6 2.3-4.5 5-4.5s5 1.9 5 4.5" strokeLinecap="round" /><path d="M13 12.8c1.9.3 3.5 1.9 3.5 4.2" strokeLinecap="round" /></svg>
      )
    },
    {
      key: 'GrowthRewards', label: 'Growth Rewards', path: '/user/dashboard/growth-rewards', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><circle cx="10" cy="10" r="6.5" /><path d="M10 6.5v3.5l2.3 2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )
    },
    {
      key: 'Accelerator', label: 'Accelerator', path: '/user/dashboard/accelerator', icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><path d="M10 2l1.8 4.6L17 8l-4 3.2L14 17l-4-2.7L6 17l1-5.8-4-3.2 5.2-1.4L10 2z" strokeLinejoin="round" /></svg>
      )
    },
    {
      key: 'Transactions', label: 'Transactions', path: '/user/dashboard/transactions', icon: (
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

    {/* USER PROFILE STRIP */}
          <div className="dx-card dx-profile-strip mb-4">
            <div className="dx-avatar">{(dashboardData?.[0]?.UserName || 'U').slice(0, 2).toUpperCase()}</div>
            <div className="flex-grow-1">
              <div className="fw-bold dx-ink">{dashboardData?.[0]?.UserName || 'User'}</div>
              <div className="small dx-muted mb-2">User ID: {dashboardData?.[0]?.URID || userURID || '—'}</div>
              <div className="d-flex flex-wrap gap-2">
                <span className="dx-badge-chip">Rank {dashboardData?.[0]?.UserRank || 'V1'}</span>
                <span className="dx-badge-chip success">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><polyline points="2,8 5.5,11.5 14,3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Trading Package Active
                </span>
                <span className="dx-badge-chip success">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><polyline points="2,8 5.5,11.5 14,3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  KYC Verified
                </span>
                <span className="dx-badge-chip success">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><polyline points="2,8 5.5,11.5 14,3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Account Active
                </span>
              </div>
            </div>
          </div>


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

        

          {/* RECENT ACHIEVEMENTS + NOTIFICATIONS */}
          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="dx-card h-100">
                <div className="fw-bold mb-3 dx-ink">Recent Achievements</div>
                <div className="d-flex flex-column gap-2">
                  {achievements.map((a, i) => (
                    <div key={i} className="dx-achieve-row">
                      <span className="dx-achieve-check">
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><polyline points="2,8 5.5,11.5 14,3.5" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                      <div>
                        <div className="dx-achieve-title">{a.title}</div>
                        <div className="dx-achieve-sub">{a.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="dx-card h-100">
                <div className="fw-bold mb-3 dx-ink">Notifications</div>
                <div className="dx-notif-list">
                  {notificationList && notificationList.length > 0 ? (
                    notificationList.slice(0, 5).map((n, i) => (
                      <div key={(n.URID || i) + i} className={`dx-notif-card ${n.Seen ? '' : 'unseen'}`}>
                        <div className="d-flex justify-content-between gap-2">
                          <div className="small dx-ink">{n.AdminRemarks || ''}</div>
                          <div className="small dx-muted flex-shrink-0">{n.Amount || ''}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="dx-notif-card">
                        <div className="d-flex align-items-start gap-2">
                          <span className="dx-notif-ic">🔔</span>
                          <div>
                            <div className="fw-semibold small dx-ink">Congratulations</div>
                            <div className="small dx-muted">You qualified for Growth Reward {growthLevels[activeGrowthIdx]?.level}.</div>
                            <div className="dx-mini-stat-label mt-1">2 hours ago</div>
                          </div>
                        </div>
                      </div>
                      <div className="dx-notif-card">
                        <div className="d-flex align-items-start gap-2">
                          <span className="dx-notif-ic">⚡</span>
                          <div>
                            <div className="fw-semibold small dx-ink">Rank Progress</div>
                            <div className="small dx-muted">You are {rankLevels.find(r => r.status === 'current')?.progress || 0}% toward {rankLevels.find(r => r.status === 'current')?.rank}.</div>
                            <div className="dx-mini-stat-label mt-1">5 hours ago</div>
                          </div>
                        </div>
                      </div>
                      <div className="dx-notif-card">
                        <div className="d-flex align-items-start gap-2">
                          <span className="dx-notif-ic">💰</span>
                          <div>
                            <div className="fw-semibold small dx-ink">Income Credited</div>
                            <div className="small dx-muted">Today's trading income has been added to your Income Wallet.</div>
                            <div className="dx-mini-stat-label mt-1">1 day ago</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

        
          {/* INCOME OVERVIEW */}
          <div className="dx-section-head mb-3">
            <h5 className="dx-section-title">Income Overview</h5>
            <div className="dx-section-sub">Your earnings across all trading income streams</div>
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
                <div className="dx-stat-sub">Today</div>
                <div className="dx-sparkline"><Sparkline seed={1} /></div>
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
                <div className="dx-stat-sub">This Month</div>
                <div className="dx-sparkline"><Sparkline seed={2} /></div>
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
                <div className="dx-stat-sub">This Month</div>
                <div className="dx-sparkline"><Sparkline seed={3} /></div>
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
                <div className="dx-stat-sub">This Month</div>
                <div className="dx-sparkline"><Sparkline seed={4} /></div>
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
                <div className="dx-stat-sub">Current</div>
                <div className="dx-sparkline"><Sparkline seed={5} /></div>
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
                <div className="dx-stat-sub">Current Reward</div>
                <div className="dx-sparkline"><Sparkline seed={6} /></div>
              </div>
            </div>
          </div>

          {/* WALLET OVERVIEW — NEW */}
          <div className="dx-section-head mb-3">
            <h5 className="dx-section-title">Wallet Overview</h5>
            <div className="dx-section-sub">Manage your XOXO wallet balances</div>
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
                      <div className="fw-bold dx-ink">XOXO AI Engine</div>
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
            <h5 className="dx-section-title">Network Status</h5>
            <div className="dx-section-sub">Your team's collective downline &amp; business</div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="gold"><span style={{ fontSize: 17 }}>🎯</span></StatIcon>
                <div className="dx-biz-value mt-3">{dashboardData?.[0]?.DirectIds || 0}</div>
                <div className="dx-stat-label">Direct Downline</div>
                <div className="dx-biz-sub">Business ${(dashboardData?.[0]?.DirectBusiness ?? dashboardData?.[0]?.DirectBussiness ?? 0).toFixed(2)}</div>
                <MiniBars seed={1} />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="blue"><span style={{ fontSize: 17 }}>◀</span></StatIcon>
                <div className="dx-biz-value mt-3">{dashboardData?.[0]?.LeftTeam || 0}</div>
                <div className="dx-stat-label">Left Downline</div>
                <div className="dx-biz-sub">Business ${(dashboardData?.[0]?.LeftBussiness || 0).toFixed(2)}</div>
                <MiniBars seed={2} />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="green"><span style={{ fontSize: 17 }}>▶</span></StatIcon>
                <div className="dx-biz-value mt-3">{dashboardData?.[0]?.RightTeam || 0}</div>
                <div className="dx-stat-label">Right Downline</div>
                <div className="dx-biz-sub">Business ${(dashboardData?.[0]?.RightBussiness || 0).toFixed(2)}</div>
                <MiniBars seed={3} />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="dx-card dx-biz-card h-100">
                <StatIcon tone="teal"><span style={{ fontSize: 17 }}>Σ</span></StatIcon>
                <div className="dx-biz-value mt-3">{(dashboardData?.[0]?.LeftTeam || 0) + (dashboardData?.[0]?.RightTeam || 0)}</div>
                <div className="dx-stat-label">Total Downline</div>
                <div className="dx-biz-sub">Business ${((dashboardData?.[0]?.LeftBussiness || 0) + (dashboardData?.[0]?.RightBussiness || 0)).toFixed(2)}</div>
                <MiniBars seed={4} />
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
            <div className="col-lg-5">
              <div className="dx-card h-100">
                <div className="fw-bold mb-1 dx-ink">Accelerator Rank</div>
                <div className="small dx-muted mb-3">Your premium rank achievement system</div>
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

            <div className="col-lg-7">
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
                  <div className="dx-eyebrow-light mb-1">Your Next Best Action</div>
                  <div className="fw-bold dx-ink mb-1">Grow your team business by ₹2,50,000</div>
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
          </div>

          {/* BOTTOM ROW */}
          <div className="row g-3">
            <div className="col-lg-4">
              <div className="dx-card h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="fw-bold dx-ink">Trading Bot Package</div>
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

            <div className="col-lg-4">
              <div className="dx-card h-100 p-0 overflow-hidden">
                <XoxoFxChatbot />
              </div>
            </div>

            <div className="col-lg-4">
              <div className="dx-card h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="fw-bold dx-ink">📰 XOXO Notification</div>
                  <div className="small dx-muted">{notificationCount} items</div>
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

      <style jsx global>{`
        :root {
          --dx-bg: #eef2f6;
          --dx-card: #ffffff;
          --dx-border: #e7ecf1;
          --dx-ink: #0f172a;
          --dx-muted: #64748b;
          --dx-teal: #14b8a6;
          --dx-teal-dark: #0d9488;
          --dx-track: #eef2f6;
          --dx-shadow: 0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.05);
          --dx-radius: 16px;
          --dx-soft: #f8fafc;
        }

        [data-theme="dark"] {
          --dx-bg: #0b1220;
          --dx-card: #121a2b;
          --dx-border: #1f2937;
          --dx-ink: #e8edf5;
          --dx-muted: #94a3b8;
          --dx-teal: #2dd4bf;
          --dx-teal-dark: #14b8a6;
          --dx-track: #fff;
          --dx-shadow: 0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.35);
          --dx-soft: #17213380;
        }

  [data-theme="dark"]  .dx-btn-dark{
  color: #ffffff;
  }
   [data-theme="dark"] .dx-growth-title [data-theme="dark"] .dx-btn-dark{
  color: #ffffff;
  } 
        .dx-wrap {
          padding: 20px;
          color: var(--dx-ink);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Arial, sans-serif;
          transition: background .2s ease, color .2s ease;
          min-height: 100%;
        }
        @media (max-width: 576px) { .dx-wrap { padding: 12px; } }

        .dx-ink { color: var(--dx-ink) !important; }

        .dx-theme-toggle {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--dx-card); border: 1px solid var(--dx-border); color: var(--dx-ink);
          border-radius: 999px; padding: 7px 14px; font-size: 12.5px; font-weight: 600;
          box-shadow: var(--dx-shadow); cursor: pointer;
        }
        .dx-theme-toggle:hover { filter: brightness(1.03); }

        .dx-card {
          background: var(--dx-card);
          border: 1px solid var(--dx-border);
          border-radius: 18px;
          box-shadow: var(--dx-shadow);
          padding: 22px 20px;
          transition: transform .15s ease, box-shadow .15s ease, background .2s ease, border-color .2s ease;
        }
        .dx-stat-card[role="button"]:hover, .dx-card[role="button"]:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 10px rgba(15,23,42,.06), 0 16px 32px rgba(15,23,42,.08);
          cursor: pointer;
        }

        .dx-section-head { display: flex; flex-direction: column; }
        .dx-section-title { font-weight: 700; margin: 0; color: var(--dx-ink); font-size: 18px; }
        .dx-section-sub { font-size: 12.5px; color: var(--dx-muted); }

        /* Icon badges — tone variants matching reference cards */
        .dx-icon-badge {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .dx-icon-blue { background: #e8f1fd; color: #2563eb; }
        .dx-icon-teal { background: #e3f8f4; color: #0d9488; }
        .dx-icon-green { background: #e6f9f1; color: #059669; }
        .dx-icon-gold { background: #fef6e6; color: #d97706; }
        [data-theme="dark"] .dx-icon-blue { background: rgba(37,99,235,.18); color: #7cabff; }
        [data-theme="dark"] .dx-icon-teal { background: rgba(13,148,136,.22); color: #5eead4; }
        [data-theme="dark"] .dx-icon-green { background: rgba(5,150,105,.2); color: #6ee7b7; }
        [data-theme="dark"] .dx-icon-gold { background: rgba(217,119,6,.2); color: #fbbf6d; }

        .dx-icon-circle {
          width: 70px; height: 70px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(20,184,166,0.15), rgba(14,165,233,0.15));
          display: flex; align-items: center; justify-content: center;
        }

        .dx-stat-label { font-size: 13px; color: var(--dx-muted); margin-bottom: 6px; }
        .dx-stat-value { font-size: 24px; font-weight: 800; color: var(--dx-ink); letter-spacing: -.4px; line-height: 1.15; }
        .dx-stat-sub { font-size: 11.5px; color: #94a3b8; margin-top: 2px; margin-bottom: 6px; }

        .dx-badge-up {
          font-size: 11px; font-weight: 700; color: #16a34a;
          background: #eafcf3; border-radius: 999px; padding: 4px 9px; white-space: nowrap;
        }
        [data-theme="dark"] .dx-badge-up { background: rgba(22,163,74,.18); color: #6ee7b7; }
        .dx-badge-gold {
          font-size: 11px; font-weight: 700; color: #b45309;
          background: #fef6e6; border-radius: 999px; padding: 4px 9px; white-space: nowrap;
        }
        .dx-badge-soft {
          font-size: 12px; font-weight: 600; color: var(--dx-teal-dark);
          background: rgba(20,184,166,0.1); border-radius: 999px; padding: 5px 12px;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .dx-badge-chip {
          font-size: 11.5px; font-weight: 600; color: var(--dx-ink);
          background: var(--dx-soft); border: 1px solid var(--dx-border);
          border-radius: 999px; padding: 5px 12px; display: inline-flex; align-items: center; gap: 6px;
        }
        .dx-badge-chip.success { color: #16a34a; background: #eafcf3; border-color: rgba(22,163,74,.2); }
        [data-theme="dark"] .dx-badge-chip.success { color: #6ee7b7; background: rgba(22,163,74,.16); }

        .dx-pill-active {
          font-size: 11px; font-weight: 700; color: #16a34a;
          background: #eafcf3; border-radius: 999px; padding: 4px 10px;
          display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; flex-shrink: 0;
        }
        .dx-pill-active.off { color: #64748b; background: #f1f5f9; }
        [data-theme="dark"] .dx-pill-active { background: rgba(22,163,74,.18); color: #6ee7b7; }
        [data-theme="dark"] .dx-pill-active.off { background: #1c2637; color: var(--dx-muted); }

        .dx-sparkline { margin-top: 10px; height: 30px; }
        .dx-sparkline-svg { width: 100%; height: 100%; display: block; opacity: .9; }

        .dx-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--dx-muted); }
        .dx-eyebrow-light { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: rgba(255,255,255,.7); }

        .dx-mini-stat { background: var(--dx-soft); border-radius: 10px; padding: 8px 4px; }
        .dx-mini-stat-value { font-size: 15px; font-weight: 800; color: var(--dx-ink); }
        .dx-mini-stat-label { font-size: 10.5px; color: var(--dx-muted); }

        /* Business / network overview cards */
        .dx-biz-card { padding: 20px 18px; }
        .dx-biz-value { font-size: 26px; font-weight: 800; color: var(--dx-ink); letter-spacing: -.4px; }
        .dx-biz-sub { font-size: 12px; color: var(--dx-muted); margin-top: 2px; margin-bottom: 12px; }
        .dx-bars { display: flex; align-items: flex-end; gap: 5px; height: 30px; margin-top: 4px; }
        .dx-bar { flex: 1; border-radius: 3px; background: var(--dx-track); min-height: 6px; }
        .dx-bar.active { background: linear-gradient(180deg, #14b8a6, #0d9488); }

        .dx-orb {
          width: 52px; height: 52px; border-radius: 50%; font-size: 26px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(20,184,166,.15), rgba(14,165,233,.15));
        }
        .dx-orb-pulse {
          position: absolute; inset: -4px; border-radius: 50%;
          border: 2px solid var(--dx-teal); opacity: .5; animation: dxpulse 1.6s ease-out infinite;
        }
        @keyframes dxpulse { 0% { transform: scale(.9); opacity:.6 } 100% { transform: scale(1.35); opacity:0 } }

        .dx-status-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
        .dx-status-dot.on { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.18); }
        .dx-status-dot.off { background: #94a3b8; }

        .dx-btn-primary {
          background: linear-gradient(135deg, #0d9488, #0ea5e9);
          color: #fff; border: none; border-radius: 10px;
        }
        .dx-btn-primary:disabled { opacity: .5; }
        .dx-btn-primary:not(:disabled):hover { filter: brightness(1.05); color: #fff; }

        .dx-btn-outline {
          background: transparent; border: 1px solid var(--dx-border); color: var(--dx-ink);
          border-radius: 10px; font-weight: 600; font-size: 13px;
        }
        .dx-btn-outline:hover { background: var(--dx-soft); color: var(--dx-ink); }

        .dx-btn-dark {
          background: var(--dx-ink); 
          color: var(--dx-card); border: none; border-radius: 10px;
          font-weight: 700; padding: 9px 18px; font-size: 13.5px;
        }
        .dx-btn-dark:hover { filter: brightness(1.15); color: var(--dx-card); }

        .dx-notif-bar {
          margin-top: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(14,165,233,0.08));
          border: 1px solid rgba(16,185,129,0.25); border-radius: 12px; padding: 12px 14px;
        }
        .dx-timer-box {
          display: flex; align-items: center; gap: 8px; background: rgba(16,185,129,0.12);
          padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; color: #047857;
        }
        [data-theme="dark"] .dx-timer-box { color: #6ee7b7; }

        .dx-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--dx-border); font-size: 13px; }
        .dx-row:last-child { border-bottom: none; }
        .dx-row-label { color: var(--dx-muted); }
        .dx-row-value { font-weight: 700; color: var(--dx-ink); }

        .dx-notif-list { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; padding-right: 4px; }
        .dx-notif-card { padding: 10px 12px; border-radius: 10px; background: var(--dx-soft); }
        .dx-notif-card.unseen { background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.18); }
        .dx-notif-ic { font-size: 15px; line-height: 1; }
        .dx-tag { font-size: 10px; font-weight: 700; letter-spacing: .3px; }

        .dx-ann {
          display: flex; align-items: center; gap: 10px; background: var(--dx-card);
          border: 1px solid var(--dx-border); border-radius: 999px; padding: 8px 14px; overflow: hidden;
        }
        .dx-ann-badge { font-size: 11px; font-weight: 700; color: #ef4444; background: #fef2f2; border-radius: 999px; padding: 3px 10px; flex-shrink: 0; }
        [data-theme="dark"] .dx-ann-badge { background: rgba(239,68,68,.18); }
        .dx-ann-ticker { overflow: hidden; flex: 1; }
        .dx-ann-track { display: flex; gap: 60px; white-space: nowrap; animation: dxmarquee 18s linear infinite; } 
        .dx-ann-item { font-size: 13px; color: #000; }
        .dx-ann-close { background: none; border: none; color: var(--dx-muted); font-size: 13px; flex-shrink: 0; cursor: pointer; }
        @keyframes dxmarquee { from { transform: translateX(0);} to { transform: translateX(-50%);} }

        .dx-ref-link { font-family: monospace; font-size: 12px; background: var(--dx-soft); border: 1px dashed var(--dx-border); border-radius: 8px; padding: 8px 10px; word-break: break-all; color: var(--dx-ink); }
        .dx-level-box { border: 1px solid; border-radius: 10px; padding: 8px; }
        .dx-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--dx-teal); flex-shrink: 0; }

        .dx-gradient-text {
          background: linear-gradient(135deg, #14b8a6, #0ea5e9);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .dx-gradient-text-alt {
          background: linear-gradient(135deg, #f59e0b, #10b981);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .dx-tip-box { background: rgba(14,165,233,0.08); color: #0369a1; border-radius: 10px; padding: 12px; font-size: 12.5px; text-align: left; }
        [data-theme="dark"] .dx-tip-box { background: rgba(14,165,233,0.14); color: #7dd3fc; }

        .dx-overlay {
          position: fixed; inset: 0; background: rgba(15,23,42,0.55); backdrop-filter: blur(6px);
          z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .dx-modal {
          position: relative; width: 100%; max-width: 460px; background: var(--dx-card);
          border-radius: 18px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.3);
          animation: dxfadeup .35s ease-out;
        }
        .dx-modal-celebrate { animation: dxcelebrate .5s cubic-bezier(.68,-.55,.265,1.55); }
        .dx-modal-bar { height: 4px; }
        .dx-modal-close {
          position: absolute; top: 10px; right: 12px; background: none; border: none;
          font-size: 18px; color: var(--dx-muted); cursor: pointer; z-index: 2;
        }
        .dx-modal-close:hover { color: var(--dx-ink); }

        @keyframes dxfadeup { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dxcelebrate {
          0% { opacity: 0; transform: scale(.75) rotate(-8deg); }
          60% { opacity: 1; transform: scale(1.05) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        /* ---------- NEW: Quick Actions ---------- */
        .dx-quick-row {
          display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px;
        }
        @media (max-width: 992px) { .dx-quick-row { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 576px) { .dx-quick-row { grid-template-columns: repeat(2, 1fr); } }
        .dx-quick-btn {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          background: var(--dx-card); border: 1px solid var(--dx-border); border-radius: 14px;
          padding: 16px 8px; cursor: pointer; transition: all .15s ease;
        }
        .dx-quick-btn:hover { transform: translateY(-2px); box-shadow: var(--dx-shadow); }
        .dx-quick-btn.active { border-color: var(--dx-teal); box-shadow: 0 0 0 3px rgba(20,184,166,.12); }
        .dx-quick-icon {
          width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          background: rgba(20,184,166,.12); color: var(--dx-teal-dark);
        }
        .dx-quick-label { font-size: 12px; font-weight: 600; color: var(--dx-ink); text-align: center; }

        /* ---------- NEW: Achievements ---------- */
        .dx-achieve-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid var(--dx-border); border-radius: 12px; background: var(--dx-soft); }
        .dx-achieve-check { width: 22px; height: 22px; border-radius: 50%; background: rgba(20,184,166,.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .dx-achieve-title { font-size: 13px; font-weight: 700; color: var(--dx-ink); }
        .dx-achieve-sub { font-size: 11.5px; color: var(--dx-muted); }

        /* ---------- NEW: Profile strip ---------- */
        .dx-profile-strip { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .dx-avatar {
          width: 56px; height: 56px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, #14b8a6, #0d9488); color: #fff;
          display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px;
        }

        /* ---------- NEW: Wallets ---------- */
        .dx-wallet-card { display: flex; flex-direction: column; }

        /* ---------- NEW: Gauge ---------- */
        .dx-gauge-wrap { position: relative; }
        .dx-gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .dx-gauge-top { font-size: 14px; font-weight: 800; color: var(--dx-ink); }
        .dx-gauge-bottom { font-size: 10.5px; color: var(--dx-muted); margin-top: 2px; text-align: center; }

        /* ---------- NEW: Growth banner ---------- */
        .dx-growth-banner {
          background: var(--dx-card);
          border-radius: 18px; padding: 26px 24px; color: #fff; box-shadow: var(--dx-shadow);
        }
        .dx-growth-title { font-size: 22px; font-weight: 800; color: #5eead4; }
        .dx-growth-label { font-size: 11px; color: rgba(255,255,255,.65); margin-bottom: 3px; }
        .dx-growth-value { font-size: 15px; font-weight: 700; color: #fff; }

        /* ---------- NEW: Stepper ---------- */
        .dx-stepper { display: flex; align-items: center; }
        .dx-stepper-item { display: flex; align-items: center; flex: 1; }
        .dx-stepper-item:last-child { flex: 0; }
        .dx-stepper-dot {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800;
          background: var(--dx-soft); color: var(--dx-muted); border: 2px solid var(--dx-border);
        }
        .dx-stepper-dot.done { background: var(--dx-teal-dark); border-color: var(--dx-teal-dark); color: #fff; }
        .dx-stepper-dot.current { background: var(--dx-card); border-color: var(--dx-teal); color: var(--dx-teal-dark); box-shadow: 0 0 0 4px rgba(20,184,166,.15); }
        .dx-stepper-line { height: 2px; flex: 1; background: var(--dx-border); margin: 0 6px; }
        .dx-stepper-line.done { background: var(--dx-teal-dark); }

        /* ---------- NEW: Table ---------- */
        .dx-table { color: var(--dx-ink); font-size: 13px; }
        .dx-table thead th { color: var(--dx-muted); font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; font-weight: 700; border-bottom: 1px solid var(--dx-border); padding-bottom: 10px; }
        .dx-table tbody td { border-bottom: 1px solid var(--dx-border); padding: 12px 8px; color: var(--dx-ink); }
        .dx-table tbody tr:last-child td { border-bottom: none; }
        .dx-status-chip { font-size: 11px; font-weight: 700; border-radius: 999px; padding: 4px 10px; display: inline-block; }
        .dx-status-chip.qualified { background: #eafcf3; color: #16a34a; }
        .dx-status-chip.inprogress { background: rgba(14,165,233,.12); color: #0284c7; }
        .dx-status-chip.upcoming { background: var(--dx-soft); color: var(--dx-muted); }
        [data-theme="dark"] .dx-status-chip.qualified { background: rgba(22,163,74,.18); color: #6ee7b7; }
        [data-theme="dark"] .dx-status-chip.inprogress { background: rgba(14,165,233,.18); color: #7dd3fc; }

        /* ---------- NEW: Rank journey tiles ---------- */
        .dx-rank-track { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        @media (max-width: 768px) { .dx-rank-track { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 480px) { .dx-rank-track { grid-template-columns: repeat(2, 1fr); } }
        .dx-rank-tile { border: 1px solid var(--dx-border); border-radius: 12px; padding: 14px 10px; text-align: center; background: var(--dx-soft); }
        .dx-rank-tile.current { border-color: var(--dx-teal); background: rgba(20,184,166,.08); }
        .dx-rank-tile-name { font-size: 16px; font-weight: 800; color: var(--dx-ink); }
        .dx-rank-tile-biz { font-size: 11px; color: var(--dx-muted); margin-bottom: 6px; }
        .dx-rank-tile-status { font-size: 10.5px; font-weight: 700; }
        .dx-rank-tile-status.achieved { color: #16a34a; }
        .dx-rank-tile-status.current { color: #0d9488; }
        .dx-rank-tile-status.upcoming { color: var(--dx-muted); }

        .dx-next-action { border: 1px dashed var(--dx-border); border-radius: 14px; padding: 16px; background: var(--dx-soft); }
        .dx-tag-pill { font-size: 11px; font-weight: 600; background: var(--dx-card); border: 1px solid var(--dx-border); color: var(--dx-ink); padding: 5px 10px; border-radius: 999px; }

        @media (max-width: 480px) {
          .dx-stat-value { font-size: 18px; }
          .dx-card { padding: 14px; }
          .dx-growth-title { font-size: 18px; }
        }
      `}</style>
    </>
  );
}