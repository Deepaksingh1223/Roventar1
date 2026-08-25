"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getActiveProducts } from "@/app/redux/slices/productSlice";
import { getFundRequestReport, usernameByLoginId, addRechargeTransactionUser, getRechargetransactionHIstory } from "@/app/redux/slices/fundManagerSlice";
import { AuthLogin, getUserId } from "@/app/api/auth";
import { activeProducts, productLoading } from "@/app/(main)/admin/product/product-selectors";
import html2pdf from 'html2pdf.js';

const Spark = ({ data, color }) => {
  const W = 120, H = 44, mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - 4 - ((v - mn) / rng) * (H - 8)}`).join(" ");
  const area = `0,${H} ${pts} ${W},${H}`;
  const gid = `sg${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={W} cy={H - 4 - ((data[data.length - 1] - mn) / rng) * (H - 8)} r="3" fill={color} />
    </svg>
  );
};

const ROIChart = ({ data, color }) => {
  const labels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const W = 560, H = 180, mn = Math.min(...data, 0), mx = Math.max(...data), rng = mx - mn || 1;
  const x = i => (i / (data.length - 1)) * (W - 56) + 28;
  const y = v => H - 28 - ((v - mn) / rng) * (H - 52);
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={28} y1={28 + t * (H - 52)} x2={W - 28} y2={28 + t * (H - 52)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <polygon points={`28,${y(data[0])} ${pts} ${x(data.length - 1)},${H - 28} 28,${H - 28}`} fill="url(#rg2)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={color} opacity="0.8" />)}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" style={{ fontSize: "10px", fill: "var(--text-1)" }}>{l}</text>
      ))}
    </svg>
  );
};

const Risk = ({ r }) => {
  const cfg = { Low: { bg: "rgba(34,197,94,0.12)", c: "#4ade80", b: "rgba(34,197,94,0.25)" }, Medium: { bg: "rgba(251,191,36,0.12)", c: "#fbbf24", b: "rgba(251,191,36,0.25)" }, High: { bg: "rgba(248,113,113,0.12)", c: "#f87171", b: "rgba(248,113,113,0.25)" } };
  const s = cfg[r] || cfg.Medium;
  return <span style={{ background: s.bg, color: s.c, border: `1px solid ${s.b}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>{r?.toUpperCase() || "MEDIUM"}</span>;
};

export default function App() {
  const dispatch = useDispatch();
  const loading = useSelector(productLoading);
  const activeProductsData = useSelector(activeProducts);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [tab, setTab] = useState("bots");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [investBot, setInvestBot] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Custom amount state
  const [customAmount, setCustomAmount] = useState("");
  const [amountError, setAmountError] = useState("");

  // User ID related states
  const [uid, setUid] = useState("");
  const [uname, setUname] = useState("");
  const [uerr, setUerr] = useState("");
  const [userURID, setUserURID] = useState("");
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  const [orders, setOrders] = useState([]);
  const [inv, setInv] = useState(null);
  const [hov, setHov] = useState(null);
  const [bots, setBots] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const URID = getUserId();

  const userDashboardData = useSelector((state) => state.auth.UserdashboardData);
  // Check if wallet has sufficient balance for custom amount
  const hasSufficientBalance = () => {
    if (!investBot) return false;
    const amountToInvest = customAmount && customAmount !== "" ? parseFloat(customAmount) : 0;
    if (amountToInvest === 0) return false;
    return walletBalance >= amountToInvest;
  };

  // Get current investment amount
  const getInvestmentAmount = () => {
    if (!investBot) return 0;
    const amount = customAmount && customAmount !== "" ? parseFloat(customAmount) : 0;
    return amount;
  };

  // Validate amount
  const validateAmount = (value) => {
    if (!investBot) return false;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setAmountError("Please enter a valid amount");
      return false;
    }
    if (numValue < investBot.mininvest) {
      setAmountError(`Minimum investment amount is $${investBot.mininvest}`);
      return false;
    }
    if (numValue > walletBalance) {
      setAmountError(`Insufficient balance! Your wallet balance is $${walletBalance.toLocaleString()}`);
      return false;
    }
    setAmountError("");
    return true;
  };

  // Handle amount change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setCustomAmount("");
      setAmountError("");
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setCustomAmount(numValue);
      validateAmount(numValue);
    }
  };

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        setWalletLoading(true);
        const urid = getUserId();
        const result = await dispatch(getFundRequestReport()).unwrap();

        if (result?.walletBalance?.[0]?.depositWallet !== undefined) {
          setWalletBalance(result.walletBalance[0].depositWallet);
        }
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWalletBalance();
  }, [dispatch]);



  // Fetch Order History from API
  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        setOrderHistoryLoading(true);
        const urid = getUserId();
        const result = await dispatch(getRechargetransactionHIstory(urid)).unwrap();

        if (Array.isArray(result)) {
          setOrderHistory(result);
        }
        else if (result?.data && Array.isArray(result.data)) {
          setOrderHistory(result.data);
        }
        else {
          setOrderHistory([]);
        }
      } catch (error) {
        console.error("Failed to fetch order history:", error);
        setOrderHistory([]);
      } finally {
        setOrderHistoryLoading(false);
      }
    };

    if (tab === "orders") {
      fetchOrderHistory();
    }
  }, [dispatch, tab]);

  // Fetch username when userId changes (for invest modal)
  useEffect(() => {
    const fetchUsername = async () => {
      if (!uid.trim()) {
        setUname("");
        setUerr("");
        setUserURID("");
        setIsFetchingUser(false);
        return;
      }

      setIsFetchingUser(true);
      try {
        const result = await dispatch(usernameByLoginId(uid));

        if (result?.payload && result?.payload?.data?.name) {
          setUname(result.payload.data.name);
          setUserURID(result.payload.data.urid || result.payload.data.id || "");
          setUerr("");
        } else {
          setUname("");
          setUerr("Invalid User ID");
          setUserURID("");
        }
      } catch (error) {
        console.error("Error fetching username:", error);
        setUname("");
        setUerr("Error fetching user");
        setUserURID("");
      } finally {
        setIsFetchingUser(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUsername();
    }, 500);

    return () => clearTimeout(timer);
  }, [uid, dispatch]);

  // Generate chart data for each bot
  const generateChartData = (roi) => {
    const baseValue = roi > 0 ? Math.max(0, roi / 10) : Math.abs(roi) / 5;
    const chart = [];
    let current = baseValue / 2;
    for (let i = 0; i < 12; i++) {
      const change = (Math.random() - 0.5) * (Math.abs(roi) / 15);
      current = Math.max(0, current + change);
      chart.push(parseFloat(current.toFixed(2)));
    }
    const trend = chart[chart.length - 1];
    const multiplier = roi > 0 ? roi / trend : -Math.abs(roi) / trend;
    return chart.map(v => parseFloat((v * (multiplier || 1)).toFixed(2)));
  };

  // Helper functions
  const getLogoEmoji = (name) => {
    const emojis = {
      "SONIC": "⚡",
      "XOXOFX": "🔮",
      "PHANTOM": "👻",
      "PIP SNIPER": "🎯",
      "GOLD RUSH": "🏆",
      "AURUM MIND": "🧠",
      "MARIO": "🍄"
    };
    return emojis[name?.toUpperCase()] || "🤖";
  };

  const getColorByRisk = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return "#4ade80";
      case 'medium': return "#fbbf24";
      case 'high': return "#f87171";
      default: return "#6725cd";
    }
  };

  // Fetch active products from Redux
  useEffect(() => {
    dispatch(getActiveProducts());
  }, [dispatch]);

  // Set bots directly from API data
  useEffect(() => {
    if (activeProductsData && activeProductsData.length > 0) {
      setBots(activeProductsData);
    }
  }, [activeProductsData]);

const downloadPDFInvoice = async (orderData) => {
    const d = orderData;
    if (!d) return;

    // Data extraction
    const userName = d.Name || d.user || "User";
    const userId = d.AuthLogin || d.uid || "N/A";
    const roiValue = d.rOI || d.roi || d.APY || "2";
    const invoiceNo = d.RechargeId || d.id || `XFX-${d.OrderDate || Date.now()}`;
    const status = d.status || "Active";
    const amount = Number(d.Rkprice || d.amount || 0);
    const orderDate = d.OrderDate || d.date || new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8" />
        <title>XOXOFX Invoice ${invoiceNo}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                background: #f0f2f5;
                padding: 10px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }

            /* ===== MAIN CONTAINER ===== */
            .invoice {
                max-width: 780px;
                width: 100%;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(108, 99, 255, 0.12);
                page-break-inside: avoid;
                break-inside: avoid;
            }

            /* ===== TOP BAR ===== */
            .top-bar {
                background: linear-gradient(135deg, #6C63FF, #8B7CF7);
                padding: 12px 28px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 3px solid #5a52d5;
            }

            .top-bar .brand {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .top-bar .brand .logo-img {
                width: 44px;
                height: 44px;
                object-fit: contain;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.15);
                padding: 4px;
            }

            .top-bar .brand .brand-text h1 {
                font-size: 18px;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: 1px;
                margin: 0;
                line-height: 1.2;
            }

            .top-bar .brand .brand-text span {
                font-size: 9px;
                color: rgba(255, 255, 255, 0.85);
                font-weight: 400;
                display: block;
                letter-spacing: 0.5px;
            }

            .top-bar .invoice-tag {
                text-align: right;
            }

            .top-bar .invoice-tag .label {
                font-size: 8px;
                color: rgba(255, 255, 255, 0.7);
                text-transform: uppercase;
                letter-spacing: 1.5px;
                font-weight: 600;
            }

            .top-bar .invoice-tag .number {
                font-size: 13px;
                font-weight: 700;
                color: #ffffff;
                letter-spacing: 0.3px;
            }

            /* ===== HEADER ===== */
            .header {
                background: linear-gradient(135deg, #f8f7ff, #f0eeff);
                padding: 16px 28px 14px;
                border-bottom: 1px solid #e8e4ff;
            }

            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;
            }

            .header-left .greeting {
                font-size: 20px;
                font-weight: 700;
                color: #1a1a2e;
            }

            .header-left .greeting span {
                color: #6C63FF;
            }

            .header-left .sub {
                font-size: 12px;
                color: #4a5568;
                font-weight: 400;
                margin-top: 1px;
            }

            .header-right {
                text-align: right;
            }

            .header-right .amount-label {
                font-size: 10px;
                color: #6C63FF;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
            }

            .header-right .amount-wrapper {
                display: flex;
                align-items: baseline;
                justify-content: flex-end;
                gap: 4px;
            }

            .header-right .amount {
                font-size: 28px;
                font-weight: 900;
                color: #1a1a2e;
                line-height: 1.1;
                letter-spacing: -0.5px;
            }

            .header-right .currency {
                font-size: 14px;
                font-weight: 600;
                color: #6C63FF;
                letter-spacing: 0.5px;
            }

            /* ===== STATUS ROW ===== */
            .status-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 28px;
                background: #ffffff;
                border-bottom: 1px solid #e8e4ff;
                flex-wrap: wrap;
                gap: 6px;
            }

            .status-row .date {
                font-size: 12px;
                color: #4a5568;
                font-weight: 500;
            }

            .status-row .date strong {
                color: #1a1a2e;
                font-weight: 700;
            }

            .status-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: #10b981;
                padding: 0;
                background: transparent;
                border: none;
            }

            /* ===== BODY ===== */
            .body {
                padding: 14px 28px 10px;
                background: #ffffff;
            }

            /* ===== SECTIONS ===== */
            .section {
                margin-bottom: 10px;
            }

            .section:last-of-type {
                margin-bottom: 0;
            }

            .section-title {
                font-size: 10px;
                font-weight: 800;
                color: #1a1a2e;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 6px;
                padding-bottom: 4px;
                border-bottom: 2px solid #e8e4ff;
            }

            .section-title .icon {
                margin-right: 6px;
                font-size: 13px;
            }

            /* ===== GRID ===== */
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 8px;
            }

            .grid-3 {
                grid-template-columns: repeat(3, 1fr);
            }

            /* ===== CARD ===== */
            .card {
                background: #f8f7ff;
                border-radius: 10px;
                padding: 8px 14px;
                border: 1px solid #e8e4ff;
            }

            .card .label {
                font-size: 9px;
                font-weight: 700;
                color: #6C63FF;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin-bottom: 2px;
            }

            .card .value {
                font-size: 14px;
                font-weight: 700;
                color: #1a1a2e;
                letter-spacing: -0.2px;
            }

            .card .value-sm {
                font-size: 13px;
                font-weight: 600;
                color: #1a1a2e;
            }

            /* ===== HIGHLIGHT BOX ===== */
            .highlight-box {
                background: linear-gradient(135deg, #f5f3ff, #edeafe);
                border: 2px solid #c8bfff;
                border-radius: 10px;
                padding: 10px 18px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 2px;
            }

            .highlight-box .left .label {
                font-size: 10px;
                font-weight: 700;
                color: #6C63FF;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .highlight-box .left .value {
                font-size: 16px;
                font-weight: 800;
                color: #1a1a2e;
                margin-top: 1px;
                letter-spacing: -0.3px;
            }

            .highlight-box .right {
                text-align: right;
            }

            .highlight-box .right .label {
                font-size: 10px;
                font-weight: 700;
                color: #6C63FF;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .highlight-box .right .value {
                font-size: 18px;
                font-weight: 900;
                color: #6C63FF;
                margin-top: 1px;
                letter-spacing: -0.5px;
            }

            /* ===== COMPANY ADDRESS ===== */
            .company-address {
                background: #f8f7ff;
                padding: 8px 18px;
                border-radius: 10px;
                border: 1px solid #e8e4ff;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 6px;
            }

            .company-address .address-text {
                font-size: 10px;
                color: #4a5568;
                line-height: 1.5;
            }

            .company-address .address-text strong {
                color: #1a1a2e;
            }

            /* ===== STAMP ONLY - RIGHT SIDE ===== */
            .stamp-section {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 2px dashed #e8e4ff;
            }

            .stamp-box {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
            }

            .stamp-box .stamp-label {
                font-size: 7px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 600;
            }

            .stamp-box .stamp-image {
                width: 120px;
                height: 120px;
                object-fit: contain;
                border-radius: 8px;
                background: #ffffff;
                padding: 4px;
            }

            /* ===== FOOTER ===== */
            .footer {
                background: #f8f7ff;
                padding: 10px 28px 8px;
                text-align: center;
                border-top: 2px solid #e8e4ff;
            }

            .footer .brand-name {
                font-size: 14px;
                font-weight: 800;
                color: #1a1a2e;
                letter-spacing: 1px;
            }

            .footer .brand-name span {
                color: #6C63FF;
            }

            .footer .divider {
                width: 25px;
                height: 2px;
                background: linear-gradient(90deg, #6C63FF, #8B7CF7);
                margin: 4px auto;
                border-radius: 2px;
            }

            .footer p {
                font-size: 10px;
                color: #1a1a2e;
                font-weight: 500;
                line-height: 1.4;
            }

            .footer .note {
                font-size: 7px;
                color: #6b7280;
                font-weight: 500;
                margin-top: 3px;
                letter-spacing: 0.3px;
            }

            /* ===== RESPONSIVE ===== */
            @media (max-width: 700px) {
                .top-bar {
                    flex-direction: column;
                    gap: 6px;
                    padding: 10px 16px;
                    text-align: center;
                }
                .top-bar .invoice-tag {
                    text-align: center;
                }
                .header {
                    padding: 12px 16px;
                }
                .header-content {
                    flex-direction: column;
                    align-items: flex-start;
                }
                .header-right {
                    text-align: left;
                    width: 100%;
                }
                .header-right .amount-wrapper {
                    justify-content: flex-start;
                }
                .header-right .amount {
                    font-size: 24px;
                }
                .body {
                    padding: 10px 16px;
                }
                .grid-3 {
                    grid-template-columns: 1fr 1fr;
                }
                .status-row {
                    padding: 6px 16px;
                    flex-direction: column;
                    align-items: flex-start;
                }
                .footer {
                    padding: 8px 16px;
                }
                .stamp-section {
                    justify-content: center;
                }
                .company-address {
                    flex-direction: column;
                    text-align: center;
                }
                .stamp-box .stamp-image {
                    width: 100px;
                    height: 100px;
                }
            }

            @media (max-width: 480px) {
                .grid-3 {
                    grid-template-columns: 1fr;
                }
                .top-bar .brand h1 {
                    font-size: 16px;
                }
                .header-left .greeting {
                    font-size: 17px;
                }
            }

            /* ===== PRINT ===== */
            @media print {
                body {
                    background: #ffffff;
                    padding: 0;
                    margin: 0;
                }
                .invoice {
                    box-shadow: none;
                    border-radius: 0;
                    max-width: 100%;
                }
                .top-bar {
                    background: linear-gradient(135deg, #6C63FF, #8B7CF7) !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .top-bar .brand .logo-img {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .status-badge {
                    color: #10b981 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .highlight-box {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .card {
                    background: #f8f7ff !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .footer {
                    background: #f8f7ff !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .header {
                    background: linear-gradient(135deg, #f8f7ff, #f0eeff) !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .company-address {
                    background: #f8f7ff !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .stamp-image {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .stamp-section {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
            }
        </style>
    </head>

    <body>
        <div class="invoice">

            <!-- ===== TOP BAR ===== -->
            <div class="top-bar">
                <div class="brand">
                    <img src="/logo.png" alt="XOXOFX Logo" class="logo-img" />
                    <div class="brand-text">
                        <h1>XOXOFX</h1>
                        <span>Smart Trading · Better Future</span>
                    </div>
                </div>
                <div class="invoice-tag">
                    <div class="label">Invoice Number</div>
                    <div class="number">#${invoiceNo}</div>
                </div>
            </div>

            <!-- ===== HEADER ===== -->
            <div class="header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="greeting">
                            Hello, <span>${userName}</span>
                        </div>
                        <div class="sub">Thank you for investing with XOXOFX</div>
                    </div>
                    <div class="header-right">
                        <div class="amount-label">Total Investment</div>
                        <div class="amount-wrapper">
                            <span class="amount">$${amount.toFixed(2)}</span>
                            <span class="currency">USD</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== STATUS ROW ===== -->
            <div class="status-row">
                <div class="date">
                    📅 <strong>Transaction Date:</strong> ${orderDate}
                </div>
                <div>
                    <span class="status-badge">${status}</span>
                </div>
            </div>

            <!-- ===== BODY ===== -->
            <div class="body">

                <!-- User Details -->
                <div class="section">
                    <div class="section-title">
                        <span class="icon">👤</span> User Details
                    </div>
                    <div class="grid">
                        <div class="card">
                            <div class="label">Username</div>
                            <div class="value">${userName}</div>
                        </div>
                        <div class="card">
                            <div class="label">User ID</div>
                            <div class="value value-sm">${userId}</div>
                        </div>
                    </div>
                </div>

                <!-- Package Details -->
                <div class="section">
                    <div class="section-title">
                        <span class="icon">🤖</span> Package Details
                    </div>
                    <div class="grid grid-3">
                        <div class="card">
                            <div class="label">Strategy</div>
                            <div class="value">${d.CategoryName || d.bot || "N/A"}</div>
                        </div>
                        <div class="card">
                            <div class="label">Package</div>
                            <div class="value">${d.PackageName || d.package || "N/A"}</div>
                        </div>
                        <div class="card">
                            <div class="label">APY</div>
                            <div class="value">${typeof roiValue === 'number' ? roiValue.toFixed(2) : roiValue}%</div>
                        </div>
                    </div>
                </div>

                <!-- Investment Summary -->
                <div class="section">
                    <div class="section-title">
                        <span class="icon">💰</span> Investment Summary
                    </div>
                    <div class="highlight-box">
                        <div class="left">
                            <div class="label">Package</div>
                            <div class="value">${d.PackageName || d.package || "N/A"}</div>
                        </div>
                        <div class="right">
                            <div class="label">Amount</div>
                            <div class="value">$${amount.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <!-- ===== COMPANY ADDRESS ===== -->
                <div class="section" style="margin-bottom: 4px;">
                    <div class="section-title">
                        <span class="icon">🏢</span> Company Details
                    </div>
                    <div class="company-address">
                        <div class="address-text">
                            <strong>XOXO CAPITAL MANAGEMENT LLC</strong><br />
                            Northwest Registered Agent Service, Inc.<br />
                            117 S Lexington St Ste 100<br />
                            Harrisonville, MO 64701-2444
                        </div>
                        <div class="address-text" style="text-align: right;">
                            <strong>Email:</strong> support@xoxofx.com<br />
                            <strong>Phone:</strong> +1 (800) 555-0199
                        </div>
                    </div>
                </div>

                <!-- ===== STAMP ONLY - RIGHT SIDE ===== -->
                <div class="stamp-section">
                    <div class="stamp-box">
                        <span class="stamp-label">Company Stamp</span>
                        <img src="/stamp.png" alt="XOXO CAPITAL MANAGEMENT LLC Stamp" class="stamp-image" />
                    </div>
                </div>

            </div>

            <!-- ===== FOOTER ===== -->
            <div class="footer">
                <div class="brand-name">✦ XOX<span>OFX</span></div>
                <div class="divider"></div>
                <p>
                    Thank you for trusting XOXOFX with your investment.<br />
                    Our AI-driven strategies are working to grow your wealth.
                </p>
                <div class="note">
                    © ${new Date().getFullYear()} XOXOFX · All Rights Reserved · Computer Generated Invoice
                </div>
            </div>

        </div>
    </body>
    </html>
    `;

    // Generate PDF
    const element = document.createElement("div");
    element.innerHTML = invoiceHTML;
    document.body.appendChild(element);

    const opt = {
        margin: 0,
        filename: `XOXOFX_Invoice_${d.CategoryName || d.bot || "Bot"}_${d.OrderDate || d.date || "Date"}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            scrollY: 0,
            logging: false,
        },
        jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait",
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error("PDF generation error:", error);
        alert("Error generating PDF. Please try again.");
    } finally {
        document.body.removeChild(element);
    }
};

  const submit = async () => {
    if (!uname) {
      setUerr("Please enter a valid User ID");
      return;
    }

    // Get investment amount (custom amount)
    const investmentAmount = getInvestmentAmount();

    // Validate minimum amount
    if (investmentAmount < investBot.mininvest) {
      setAmountError(`Minimum investment amount is $${investBot.mininvest}`);
      return;
    }

    // CHECK INSUFFICIENT FUNDS
    if (walletBalance < investmentAmount) {
      setAmountError(`Insufficient funds! Your wallet balance is $${walletBalance.toLocaleString()} but investment amount is $${investmentAmount.toLocaleString()}`);
      return;
    }

    setIsProcessing(true);

    try {
      const currentUserURID = getUserId();

      const requestBody = {
        // urid: userURID,
        productId: investBot.productId,
        // createdBy: currentUserURID,
        byLoginId: uid,
        rkprice: investmentAmount  // Using custom amount
      };

      const result = await dispatch(addRechargeTransactionUser(requestBody)).unwrap();

      let transactionData;
      if (Array.isArray(result) && result.length > 0) {
        transactionData = result[0];
      } else {
        transactionData = result;
      }
      const o = {
        id: `XFX-${Date.now()}`,
        bot: investBot.categoryName,
        logo: getLogoEmoji(investBot.productName),
        user: uname,
        package: transactionData?.PackageName || getPackageNameByAmount(investmentAmount), // ✅ Fixed
        uid: uid.toUpperCase(),
        amount: investmentAmount,
        date: new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }),
        roi: investBot.roi,
        status: "Active",
        color: getColorByRisk(investBot.type),
        transactionId: transactionData?.RechargeId || transactionData?.transactionId || result?.transactionId || `TXN-${Date.now()}`
      };


      setOrders(p => [o, ...p]);
      setInv(o);
      setInvestBot(null);
      setCustomAmount(""); // Reset custom amount
      setAmountError("");
      setShowSuccess(true);
      setUid("");
      setUname("");
      setUerr("");
      setUserURID("");

      const urid = getUserId();
      const walletResult = await dispatch(getFundRequestReport()).unwrap();
      if (walletResult?.walletBalance?.[0]?.depositWallet !== undefined) {
        setWalletBalance(walletResult.walletBalance[0].depositWallet);
      }

      // Refresh order history after successful transaction
      const historyResult = await dispatch(getRechargetransactionHIstory(urid)).unwrap();
      if (Array.isArray(historyResult)) {
        setOrderHistory(historyResult);
      } else if (historyResult?.data && Array.isArray(historyResult.data)) {
        setOrderHistory(historyResult.data);
      }

    } catch (error) {
      console.error("Transaction failed:", error);
      setUerr(error?.message || "Transaction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getAuthLogin = () => {
    try {
      const currentUserPlain = localStorage.getItem("currentUserPlain");
      if (currentUserPlain) {
        const userData = JSON.parse(currentUserPlain);
        return userData?.FName || userData?.userData?.FName;
      }
    } catch (error) {
      console.error("Error getting AuthLogin:", error);
    }
    return null;
  };

  const userID = getAuthLogin();


  // Invoice download handler
  const dlInvoice = (orderData) => {
    downloadPDFInvoice(orderData);
  };

  const filtered = bots.filter(b =>
    b.categoryName?.toLowerCase().includes(q.toLowerCase()) ||
    b.productName?.toLowerCase().includes(q.toLowerCase())
  );

  const nav = [
    { id: "bots", icon: "◈", label: "Browse Bot" },
    { id: "orders", icon: "≡", label: "Order History" }
  ];

  const totalInvestors = bots.reduce((sum, b) => sum + (b.traders || 0), 0);
  const bestROI = Math.max(...bots.map(b => b.roi || 0));
  const bestBot = bots.find(b => b.roi === bestROI);

  const getPackageNameByAmount = (amount) => {
    if (!amount || isNaN(amount)) return null;

    if (amount >= 10 && amount <= 499) {
      return "BO StartX";
    } else if (amount >= 500 && amount <= 1999) {
      return "BO TitanX";
    } else if (amount >= 2000 && amount <= 4999) {
      return "BO QuantumX";
    } else if (amount >= 5000) {
      return "BO MegaBullX";
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
          <div style={{ fontSize: 18, color: "var(--text-1)" }}>Loading AI Bots...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }} >

      {/* TOP BAR */}
      <div className="flex-wrap" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 28px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-1)",
        position: "sticky",
        top: 0,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            <span style={{ color: "var(--brand-cyan)" }}>AI Trading</span><span style={{ color: "var(--text-1)" }}> Bots</span>
          </div>
          <div style={{ fontSize: 9, color: "var(--text-1)", letterSpacing: "0.1em", fontWeight: 600 }}>BOT MARKETPLACE</div>
        </div>

        <div style={{ display: "flex", gap: 8 }} className="flex-wrap">
          {nav.map(n => (
            <div key={n.id} className={`navitem ${tab === n.id ? "on" : ""}`} onClick={() => setTab(n.id)}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "28px 12px" }}>

        {/* BOTS GRID */}
        {tab === "bots" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <input className="xfield" placeholder="Search bots…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 220, paddingLeft: 38 }} />
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--text-1)" }}>⌕</span>
              </div>
            </div>

            <div className="four-card-div">
              {filtered.map(b => {
                const pos = b.roi >= 0;
                const bcl = pos ? getColorByRisk(b.type) : "#f87171";
                const chartData = generateChartData(b.roi);

                return (
                  <div key={b.id} className="it" onMouseEnter={() => setHov(b.id)} onMouseLeave={() => setHov(null)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${getColorByRisk(b.type)}18`, border: `1px solid ${getColorByRisk(b.type)}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, transition: "transform .3s", transform: hov === b.id ? "scale(1.1)" : "scale(1)" }}>
                          {getLogoEmoji(b.productName)}
                        </div>
                        <div>
                          <div className="ticker" style={{ fontSize: 17, letterSpacing: ".07em", color: "var(--text-1)" }}>{b.categoryName}</div>
                          <div style={{ fontSize: 11, color: "var(--text-1)", marginTop: 2 }}>📊 {b.productName}</div>
                        </div>
                      </div>
                      <Risk r={b.type} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-1)", letterSpacing: ".08em", marginBottom: 3 }}>APR</div>
                        <div className="ticker" style={{ fontSize: 30, color: bcl, lineHeight: 1 }}>{b.roi > 0 ? `+${b.roi}` : b.roi}%</div>
                      </div>
                      <Spark data={chartData} color={bcl} />
                    </div>

                    <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />
                    <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.65, marginBottom: 14 }}>{b.tittle}</div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                      {[
                        { l: "MIN. INVEST", v: `$${b.mininvest}` },
                        { l: "WIN RATE", v: `${b.winrate}%`, c: "var(--brand-purple)" },
                        { l: "TRADERS", v: b.traders?.toLocaleString() || '0', c: "var(--brand-cyan)" }
                      ].map((m, i) => (
                        <div key={i} style={{ background: "var(--bg-hover)", borderRadius: 10, padding: "8px 10px", textAlign: "center", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-1)", letterSpacing: ".07em", marginBottom: 3 }}>{m.l}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: m.c || "var(--text-1)" }}>{m.v}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="obtn" style={{ flex: 1 }} onClick={() => setSelected(b)}>View Details</button>
                      <button className="bdep" style={{ flex: 1 }} onClick={() => {
                        setInvestBot(b);
                        setCustomAmount(""); // Reset custom amount when opening modal
                        setAmountError("");
                      }}>Invest Now ↗</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ORDER HISTORY - WITH STATS ROW */}
        {tab === "orders" && (
          <>
            {/* STATS ROW */}
            <div className="g4" style={{ marginBottom: 24 }}>
              <div className="scard scc">
                <div className="ml">Active Bots</div>
                <div className="mv" style={{ color: "var(--brand-cyan)" }}>{orderHistory.length}</div>
                <div className="mc up">Bots</div>
              </div>

              <div className="scard scc">
                <div className="ml">Total Investment</div>
                <div className="mv" style={{ color: "var(--brand-green)" }}>
                  ${orderHistory[0]?.TotalInvestment?.toLocaleString() || 0}
                </div>
                <div className="mc up">User Investment</div>
              </div>

              <div className="scard scc">
                <div className="ml">Income Limit</div>
                <div className="mv" style={{ color: "var(--text-1)" }}>
                  ${orderHistory[0]?.TotalIncome?.toLocaleString() || 0}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-1)", marginTop: 6 }}>Income</div>
              </div>

              <div className="scard scc">
                <div className="ml">Limit / Remaining</div>
                <div className="mv" style={{ color: "var(--brand-gold)" }}>
                  ${orderHistory[0]?.RemainingLimit?.toLocaleString() || 0}
                </div>
                <div className="mc up">${orderHistory[0]?.EarningLimit?.toLocaleString() || 0}</div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-cyan)", letterSpacing: ".12em", marginBottom: 6 }}>RECORDS</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-1)" }}>Order <span style={{ color: "var(--brand-purple)" }}>History</span></div>
            </div>

            {orderHistoryLoading ? (
              <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                <div style={{ fontSize: 18, color: "var(--text-1)" }}>Loading orders...</div>
              </div>
            ) : orderHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>No Orders Yet</div>
                <div style={{ fontSize: 13, color: "var(--text-2)" }}>Your investment orders will appear here</div>
              </div>
            ) : (
              <>
                <div className="Order-History-Card" >
                  {orderHistory.slice().map((item, index) => {

                    const pos = parseFloat(item.rOI) >= 0;
                    return (
                      <div
                        key={index}
                        style={{
                          background: "var(--bg-2)",
                          border: "1px solid var(--border2)",
                          borderRadius: 18,
                          padding: "20px",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = "translateY(-6px)";
                          e.currentTarget.style.borderColor = "var(--brand-purple)";
                          e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = "var(--border2)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <div style={{
                            fontSize: 40,
                            width: 60,
                            height: 60,
                            borderRadius: 16,
                            background: `${getColorByRisk(item.type)}18`,
                            border: `1px solid ${getColorByRisk(item.type)}33`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            {getLogoEmoji(item.productName)}
                          </div>
                          <div style={{
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "var(--brand-green)",
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 700,
                            border: "1px solid rgba(16, 185, 129, 0.25)"
                          }}>
                            Active
                          </div>
                        </div>

                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>
                          {item.CategoryName}
                        </div>

                        <div style={{ marginBottom: 12, fontSize: 11, color: "var(--text-2)" }}>
                          {item.productName}
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, color: "var(--text-2)", marginBottom: 4, letterSpacing: "0.05em" }}>INVESTED AMOUNT</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-1)" }}>${item.Rkprice.toFixed(2)}</div>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 10, color: "var(--text-2)", marginBottom: 4, letterSpacing: "0.05em" }}>XOXO Package</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: pos ? "var(--brand-green)" : "#f87171" }}>
                            {item.PackageName}
                          </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 10, color: "var(--text-2)", marginBottom: 4, letterSpacing: "0.05em" }}>Activated By</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: pos ? "var(--brand-green)" : "#f87171" }}>
                            {userID}
                          </div>
                        </div>


                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 8,
                          paddingTop: 12,
                          borderTop: "1px solid var(--border)"
                        }}>
                          <div style={{ fontSize: 11, color: "var(--text-2)" }}>
                            📅 {item.OrderDate}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => setShowWelcomePopup(true)}
                              style={{
                                background: "none",
                                border: "1px solid rgba(59, 130, 246, 0.3)",
                                color: "#3b82f6",
                                borderRadius: 8,
                                padding: "6px 12px",
                                fontSize: 11,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                fontWeight: 600,
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = "none";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              👋 Welcome
                            </button>
                            <button
                              onClick={() => dlInvoice(item)}
                              style={{
                                background: "none",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                color: "var(--brand-green)",
                                borderRadius: 8,
                                padding: "6px 12px",
                                fontSize: 11,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                fontWeight: 600,
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = "none";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              📄 Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* DETAILS MODAL */}
        {selected && (
          <div className="xoverlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
            <div className="xmodal scroller" style={{ maxWidth: 700, width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 15, background: `${getColorByRisk(selected.type)}18`, border: `1px solid ${getColorByRisk(selected.type)}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                    {getLogoEmoji(selected.productName)}
                  </div>
                  <div>
                    <div className="ticker" style={{ fontSize: 26, letterSpacing: ".07em", color: "var(--text-1)" }}>{selected.categoryName}</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{selected.productName}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <Risk r={selected.type} />
                      <span style={{ background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>🤖 AI POWERED</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-2)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
              </div>

              <div className="four-card-div">
                {[
                  { l: "APR", v: `${selected.roi > 0 ? `+${selected.roi}` : selected.roi}%`, c: selected.roi >= 0 ? getColorByRisk(selected.type) : "#f87171" },
                  { l: "Win Rate", v: `${selected.winrate}%`, c: "var(--brand-green)" },
                  { l: "Traders", v: selected.traders?.toLocaleString() || '0', c: "var(--text-1)" },
                  { l: "Min Invest", v: `$${selected.mininvest}`, c: "var(--brand-gold)" },
                ].map((s, i) => (
                  <div key={i} className="scard" style={{ textAlign: "center" }}>
                    <div className="ticker" style={{ fontSize: 22, color: s.c, letterSpacing: ".04em" }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: "var(--text-1)", fontWeight: 700, letterSpacing: ".08em", marginTop: 5 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-2)", letterSpacing: ".12em", marginBottom: 10 }}>APR PERFORMANCE</div>
                <div style={{ background: "var(--bg-hover)", borderRadius: 14, padding: "14px 10px 6px", border: "1px solid var(--border)" }}>
                  <ROIChart data={generateChartData(selected.roi)} color={selected.roi >= 0 ? getColorByRisk(selected.type) : "#f87171"} />
                </div>
              </div>

              <div style={{ marginBottom: 22, background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--brand-cyan)", letterSpacing: ".12em", marginBottom: 10 }}>STRATEGY OVERVIEW</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>{selected.tittle}</div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--brand-cyan)", letterSpacing: ".12em", marginBottom: 12 }}>INVESTMENT PLANS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-1)", marginBottom: 8, letterSpacing: ".06em" }}>BO STARTX</div>
                    <div className="ticker" style={{ fontSize: 28, color: "var(--text-1)", marginBottom: 4 }}>${selected.startx || selected.mininvest || 0}</div>
                  </div>

                  <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "2px solid rgba(16, 185, 129, 0.4)", borderRadius: 14, padding: "18px 14px", textAlign: "center", position: "relative" }}>
                    <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--brand-green)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: ".08em", padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>⭐ POPULAR</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-1)", marginBottom: 8, letterSpacing: ".06em" }}>BO TITANX</div>
                    <div className="ticker" style={{ fontSize: 28, color: "var(--text-1)", marginBottom: 4 }}>${selected.titanX || 0}</div>
                  </div>

                  <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-1)", marginBottom: 8, letterSpacing: ".06em" }}>BO QUANTUMX</div>
                    <div className="ticker" style={{ fontSize: 28, color: "var(--text-1)", marginBottom: 4 }}>${selected.quantumX || 0}</div>
                  </div>

                  <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-1)", marginBottom: 8, letterSpacing: ".06em" }}>BO MEGABULLX</div>
                    <div className="ticker" style={{ fontSize: 28, color: "var(--text-1)", marginBottom: 4 }}>${selected.megaBullx || 0}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="obtn" style={{ flex: 1 }} onClick={() => setSelected(null)}>Close</button>
                <button className="bdep" style={{ flex: 2, fontSize: 14 }} onClick={() => { setSelected(null); setInvestBot(selected); setCustomAmount(""); setAmountError(""); }}>Invest in {selected.categoryName} →</button>
              </div>
            </div>
          </div>
        )}

        {/* INVEST MODAL - Hidden minimum, only validation */}
        {investBot && (
          <div className="xoverlay" onClick={e => {
            if (e.target === e.currentTarget) {
              setInvestBot(null);
              setCustomAmount("");
              setAmountError("");
            }
          }}>
            <div className="xmodal" style={{ maxWidth: 460, width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-cyan)", letterSpacing: ".12em", marginBottom: 4 }}>INVEST NOW</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)" }}>Activate <span style={{ color: "var(--brand-purple)" }}>{investBot.categoryName}</span></div>
                </div>
                <button onClick={() => {
                  setInvestBot(null);
                  setCustomAmount("");
                  setAmountError("");
                }} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-2)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>

              <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: 14, padding: "14px 18px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-2)", letterSpacing: ".1em", marginBottom: 3 }}>WALLET BALANCE</div>
                  <div className="ticker" style={{ fontSize: 24, color: "var(--brand-green)" }}>
                    ${Math.floor(walletBalance).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-2)", letterSpacing: ".1em", marginBottom: 3 }}>MIN. INVEST</div>
                  <div className="ticker" style={{ fontSize: 24, color: "var(--text-1)" }}>${investBot.mininvest}</div>
                </div>
              </div>

              {/* USER ID INPUT WITH VALIDATION */}
              <div style={{ marginBottom: 16 }}>
                <label className="lbl">USER ID *</label>
                <input
                  className="xfield"
                  placeholder="Enter User ID (e.g. X0100001)"
                  value={uid}
                  onChange={e => setUid(e.target.value)}
                />
                {!uid.trim() ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#f87171" }}>
                    ⚠ Please enter User ID
                  </div>
                ) : isFetchingUser ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-2)" }}>
                    ⏳ Fetching user details...
                  </div>
                ) : uname ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--brand-green)", fontWeight: 600 }}>
                    ✓ {uname}
                  </div>
                ) : uerr ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#f87171" }}>
                    ⚠ {uerr}
                  </div>
                ) : null}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="lbl">SELECTED BOT</label>
                <div className="xfield" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "default", opacity: .65 }}>
                  <span>{getLogoEmoji(investBot.productName)}</span>
                  <span style={{ fontWeight: 600, color: "var(--text-1)" }}>{investBot.categoryName}</span>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="lbl">INVESTMENT AMOUNT (USD) *</label>
                <input
                  className="xfield"
                  type="number"
                  step="1"
                  placeholder={`Enter amount`}
                  value={customAmount}
                  onChange={handleAmountChange}
                  style={{
                    background: "var(--bg-1)",
                    border: amountError ? "1px solid #f87171" : "1px solid var(--border)",
                    color: "var(--text-1)",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    width: "100%",
                    fontSize: "16px"
                  }}
                />

                {amountError ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#f87171" }}>
                    ⚠ {amountError}
                  </div>
                ) : customAmount && parseFloat(customAmount) >= investBot.mininvest && (
                  (() => {
                    const packageName = getPackageNameByAmount(parseFloat(customAmount));
                    if (packageName) {
                      return (
                        <div style={{ marginTop: 6, fontSize: 12, color: "var(--brand-green)", fontWeight: 500 }}>
                          XOXO Package: <strong>{packageName}</strong>
                        </div>
                      );
                    } else if (parseFloat(customAmount) < 50) {
                      return (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#f87171" }}>
                          ⚠ Minimum package amount is $10
                        </div>
                      );
                    }
                    return null;
                  })()
                )}


              </div>

              <button
                className="bdep"
                style={{
                  width: "100%",
                  padding: "15px",
                  fontSize: 15,
                  borderRadius: 14,
                  letterSpacing: ".04em",
                  opacity: (!uname || isProcessing || isFetchingUser || !customAmount || amountError || customAmount < investBot.mininvest || walletBalance < customAmount) ? 0.5 : 1,
                  cursor: (!uname || isProcessing || isFetchingUser || !customAmount || amountError || customAmount < investBot.mininvest || walletBalance < customAmount) ? "not-allowed" : "pointer"
                }}
                onClick={submit}
                disabled={!uname || isProcessing || isFetchingUser || !customAmount || amountError || customAmount < investBot.mininvest || walletBalance < customAmount}
              >
                {isProcessing ? "PROCESSING..." : `🚀 ACTIVATE INVESTMENT`}
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS MODAL WITH SPARKLE/BALLOON EFFECT */}
        {showSuccess && (
          <div className="xoverlay" onClick={e => e.target === e.currentTarget && setShowSuccess(false)}>
            <div className="xmodal" style={{ maxWidth: 420, width: "100%", textAlign: "center", position: "relative", overflow: "hidden" }}>
              {/* SPARKLE/BALLOON EFFECT - Confetti Animation */}
              <div className="confetti-container">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 3}s`,
                      width: `${6 + Math.random() * 8}px`,
                      height: `${6 + Math.random() * 8}px`,
                      background: [
                        '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
                        '#ff6bff', '#ff9f43', '#00d2d3', '#f368e0',
                        '#ff9ff3', '#54a0ff', '#5f27cd', '#ff6348'
                      ][Math.floor(Math.random() * 12)],
                      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                      position: 'absolute',
                      top: '-20px',
                      animation: 'confetti-fall linear infinite',
                      opacity: 0.8,
                      transform: `rotate(${Math.random() * 360}deg)`,
                      pointerEvents: 'none'
                    }}
                  />
                ))}
                {/* Sparkle stars */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`sparkle-${i}`}
                    className="sparkle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${1.5 + Math.random() * 2}s`,
                      fontSize: `${12 + Math.random() * 20}px`,
                      position: 'absolute',
                      pointerEvents: 'none',
                      animation: 'sparkle-pulse ease-in-out infinite'
                    }}
                  >
                    ✨
                  </div>
                ))}
              </div>

              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "2px solid rgba(16, 185, 129, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  margin: "0 auto 20px",
                  animation: "success-pop 0.6s ease-out"
                }}>🎉</div>
                <div style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--brand-cyan)",
                  letterSpacing: ".14em",
                  marginBottom: 6,
                  animation: "fade-in-up 0.6s ease-out 0.2s both"
                }}>INVESTMENT ACTIVATED</div>
                <div className="ticker" style={{
                  fontSize: 30,
                  color: "var(--brand-green)",
                  letterSpacing: ".04em",
                  marginBottom: 6,
                  animation: "fade-in-up 0.6s ease-out 0.3s both"
                }}>Congratulations!</div>
                <div style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  marginBottom: 22,
                  animation: "fade-in-up 0.6s ease-out 0.4s both"
                }}>Your AI bot investment is now live and running.</div>

                {inv && (
                  <div style={{
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 20,
                    textAlign: "left",
                    animation: "fade-in-up 0.6s ease-out 0.5s both"
                  }}>
                    {[
                      { k: "Order ID", v: inv.id, hi: true },
                      { k: "Bot Strategy", v: inv.bot },
                      { k: "User ID", v: inv.user },
                      { k: "XOXO Package", v: inv.package },
                      { k: "Amount", v: `$${inv.amount.toFixed(2)}`, hi: true },
                      { k: "Date", v: inv.date }
                    ].map(r => (
                      <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                        <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{r.k}</span>
                        <span style={{ fontWeight: r.hi ? 800 : 500, color: r.hi ? "var(--text-1)" : "var(--text-2)" }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{
                  display: "flex",
                  gap: 10,
                  animation: "fade-in-up 0.6s ease-out 0.6s both"
                }}>
                  <button className="obtn" style={{ flex: 1 }} onClick={() => dlInvoice(inv)}>📄 Download PDF</button>
                  <button className="bdep" style={{ flex: 1 }} onClick={() => { setShowSuccess(false); setTab("orders"); }}>Orders →</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 20,
          overflow: "hidden"
        }}>
          {/* Confetti */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: -20,
                left: `${Math.random() * 100}%`,
                width: Math.random() * 10 + 5,
                height: Math.random() * 10 + 5,
                background: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9", "#fd79a8", "#a29bfe"][Math.floor(Math.random() * 8)],
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
                animation: `confetti-fall ${Math.random() * 3 + 2}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.8
              }}
            />
          ))}

          {/* Sparkles */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`sparkle-${i}`}
              style={{
                position: "absolute",
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                background: ["#ffd700", "#ffeb3b", "#fff176", "#ffffff"][Math.floor(Math.random() * 4)],
                borderRadius: "50%",
                animation: `sparkle-pulse ${Math.random() * 2 + 1}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 1.5}s`,
                boxShadow: "0 0 10px currentColor"
              }}
            />
          ))}

          {/* Balloons */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`balloon-${i}`}
              style={{
                position: "absolute",
                bottom: -100,
                left: `${10 + i * 12}%`,
                width: 40,
                height: 50,
                background: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#fd79a8", "#a29bfe", "#74b9ff"][i],
                borderRadius: "50% 50% 50% 50%",
                animation: `balloon-float ${Math.random() * 3 + 4}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                opacity: 0.9
              }}
            >
              <div style={{
                position: "absolute",
                bottom: -20,
                left: "50%",
                width: 1,
                height: 30,
                background: "rgba(255,255,255,0.5)",
                transform: "translateX(-50%)"
              }} />
            </div>
          ))}

          <div style={{
            background: "var(--bg-1)",
            borderRadius: 16,
            padding: 32,
            maxWidth: 600,
            maxHeight: "80vh",
            overflowY: "auto",
            position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            border: "1px solid var(--border)",
            zIndex: 10000
          }}>
            <button
              onClick={() => setShowWelcomePopup(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                color: "var(--text-1)",
                fontSize: 24,
                cursor: "pointer",
                padding: 8,
                borderRadius: 8,
                transition: "all 0.2s ease",
                zIndex: 10001
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "none";
              }}
            >
              ✕
            </button>
            <div style={{
              textAlign: "center",
              marginBottom: 24
            }}>
              <div style={{ fontSize: 48, marginBottom: 12, animation: "bounce 1s ease infinite" }}>🎉</div>
              <h2 style={{
                color: "var(--text-1)",
                fontSize: 24,
                fontWeight: 700,
                margin: 0,
                marginBottom: 8,
                textShadow: "0 0 20px rgba(59, 130, 246, 0.5)"
              }}>
                Welcome to XOXOFX Family!
              </h2>
              <div style={{
                height: 3,
                width: 60,
                background: "linear-gradient(90deg, #3b82f6, #10b981)",
                margin: "0 auto",
                borderRadius: 2,
                animation: "pulse-glow 2s ease-in-out infinite"
              }}></div>
            </div>
            <div style={{
              color: "var(--text-1)",
              lineHeight: 1.8,
              fontSize: 15
            }}>
              <p style={{ margin: "0 0 16px 0" }}>
                <strong>Dear {userID},</strong>
              </p>
              <p style={{ margin: "0 0 16px 0" }}>
                Welcome to the XOXOFX Family! We are delighted to have you join our growing community. Thank you for choosing our Online Education Academy and XOXOFX as your trusted learning and investment partner. Your journey toward smarter investing and professional forex education begins today.
              </p>
              <p style={{ margin: "0 0 16px 0" }}>
                Our dedicated team, expert mentors, and AI-powered strategies are here to support your learning and financial goals. We are committed to providing high-quality education, innovation, transparency, and professional service at every step of your journey.
              </p>
              <p style={{ margin: "0 0 16px 0" }}>
                We wish you success, prosperity, and long-term growth with XOXOFX. Together, let's build a brighter financial future through knowledge, discipline, and smart investing.
              </p>
              <p style={{ margin: "0 0 16px 0" }}>
                Once again, welcome aboard—we're excited to have you with us!
              </p>
              <p style={{ margin: "0 0 24px 0" }}>
                <strong>Best Wishes,</strong><br />
                <img src="/stampbackremove.png" alt="XOXOFX Team" style={{ maxWidth: "120px", height: "auto", borderRadius: "8px", background: "transparent", marginLeft: "-20px" }} />
              </p>
            </div>
            <button
              onClick={() => setShowWelcomePopup(false)}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #3b82f6, #10b981)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                animation: "pulse-glow 2s ease-in-out infinite"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(59, 130, 246, 0.4)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Let's Get Started 🚀
            </button>
          </div>
        </div>
      )}

      {/* ANIMATION STYLES */}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(600px) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes sparkle-pulse {
          0%, 100% {
            transform: scale(0.5) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 1;
          }
        }

        @keyframes balloon-float {
          0%, 100% {
            transform: translateY(0) rotate(-5deg);
          }
          50% {
            transform: translateY(-30px) rotate(5deg);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            opacity: 0.8;
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
          }
        }

        @keyframes success-pop {
          0% {
            transform: scale(0) rotate(-30deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.2) rotate(5deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }

        .confetti-piece {
          position: absolute;
          top: -20px;
          animation: confetti-fall linear infinite;
        }

        .sparkle {
          position: absolute;
          animation: sparkle-pulse ease-in-out infinite;
        }

        .xmodal {
          position: relative;
          z-index: 2;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}