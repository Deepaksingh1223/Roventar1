// app/page.js (JavaScript version with light theme and loading animation)
"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  return <AIAssistant />;
}

function AIAssistant() {
  // ----- STATE -----
  const [credits, setCredits] = useState(845);
  const [selectedCategory, setSelectedCategory] = useState("forex");
  const [selectedType, setSelectedType] = useState("quick");
  const [selectedRisk, setSelectedRisk] = useState("low");
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [hasReport, setHasReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // refs for DOM manipulation (typing, gauge, chart)
  const reportRef = useRef(null);
  const typingRef = useRef(null);
  const reasoningRef = useRef(null);
  const gaugeCircleRef = useRef(null);
  const confNumRef = useRef(null);
  const tvContainerRef = useRef(null);

  // ----- HELPERS -----
  const assetMap = {
    forex: [
      "EUR/USD — Euro / US Dollar",
      "GBP/USD — British Pound / US Dollar",
      "USD/JPY — US Dollar / Japanese Yen",
      "AUD/USD — Australian Dollar / US Dollar",
      "USD/CAD — US Dollar / Canadian Dollar",
      "USD/CHF — US Dollar / Swiss Franc",
      "NZD/USD — New Zealand Dollar / US Dollar",
      "XAU/USD — Gold / US Dollar",
      "XAG/USD — Silver / US Dollar",
    ],
    crypto: [
      "BTC/USDT — Bitcoin / Tether",
      "ETH/USDT — Ethereum / Tether",
      "SOL/USDT — Solana / Tether",
      "BNB/USDT — BNB / Tether",
      "XRP/USDT — Ripple / Tether",
      "DOGE/USDT — Dogecoin / Tether",
      "ADA/USDT — Cardano / Tether",
      "AVAX/USDT — Avalanche / Tether",
    ],
    metals: [
      "XAU/USD — Gold / US Dollar",
      "XAG/USD — Silver / US Dollar",
      "XPT/USD — Platinum / US Dollar",
      "XPD/USD — Palladium / US Dollar",
      "COPPER — Copper CFD",
    ],
    indices: [
      "US30 — Dow Jones Industrial",
      "NAS100 — NASDAQ 100",
      "SP500 — S&P 500",
      "DAX — Germany DAX 40",
      "FTSE100 — UK FTSE 100",
      "NIKKEI — Japan Nikkei 225",
      "HSI — Hang Seng Index",
    ],
    commodities: [
      "WTI/USD — Crude Oil WTI",
      "BRENT/USD — Crude Oil Brent",
      "NGAS/USD — Natural Gas",
      "WHEAT — Wheat Futures",
      "CORN — Corn Futures",
      "SOYBEANS — Soybean Futures",
    ],
  };

  const tvMap = {
    "EUR/USD": "FX:EURUSD",
    "GBP/USD": "FX:GBPUSD",
    "USD/JPY": "FX:USDJPY",
    "AUD/USD": "FX:AUDUSD",
    "USD/CAD": "FX:USDCAD",
    "USD/CHF": "FX:USDCHF",
    "NZD/USD": "FX:NZDUSD",
    "XAU/USD": "OANDA:XAUUSD",
    "XAG/USD": "OANDA:XAGUSD",
    "XPT/USD": "OANDA:XPTUSD",
    "XPD/USD": "OANDA:XPDUSD",
    "BTC/USDT": "BINANCE:BTCUSDT",
    "ETH/USDT": "BINANCE:ETHUSDT",
    "SOL/USDT": "BINANCE:SOLUSDT",
    "BNB/USDT": "BINANCE:BNBUSDT",
    "XRP/USDT": "BINANCE:XRPUSDT",
    "DOGE/USDT": "BINANCE:DOGEUSDT",
    "ADA/USDT": "BINANCE:ADAUSDT",
    "AVAX/USDT": "BINANCE:AVAXUSDT",
    COPPER: "COMEX:HG1!",
    US30: "TVC:DJI",
    NAS100: "TVC:NDX",
    SP500: "TVC:SPX",
    DAX: "TVC:DAX",
    FTSE100: "TVC:UKX",
    NIKKEI: "TVC:NI225",
    HSI: "TVC:HSI",
    "WTI/USD": "TVC:USOIL",
    "BRENT/USD": "TVC:UKOIL",
    "NGAS/USD": "NYMEX:NG1!",
    WHEAT: "CBOT:ZW1!",
    CORN: "CBOT:ZC1!",
    SOYBEANS: "CBOT:ZS1!",
  };

  // Loading steps
  const loadingSteps = [
    "Scanning Markets...",
    "Analyzing Liquidity...",
    "Reading Economic Calendar...",
    "Checking Smart Money Flow...",
    "Calculating Risk Parameters...",
    "Evaluating News Sentiment...",
    "Generating Institutional Report...",
  ];

  // ----- MOCK API -----
  function getMockResponse(cat, asset, type, risk) {
    const assetName = asset.split(" — ")[0] || asset;
    const isGold = assetName.includes("XAU") || assetName.includes("Gold");
    const isBTC = assetName.includes("BTC");
    const conf = Math.floor(78 + Math.random() * 18);
    const isBull = Math.random() > 0.35;
    const signal = isBull ? "BUY" : "SELL";
    const trend = isBull ? "Bullish" : "Bearish";

    let entry, sl, tp1, tp2, sup, res;
    if (isGold) {
      entry = 3365;
      sl = 3355;
      tp1 = 3378;
      tp2 = 3392;
      sup = 3358;
      res = 3388;
    } else if (isBTC) {
      entry = 67100;
      sl = 65800;
      tp1 = 68500;
      tp2 = 70000;
      sup = 66200;
      res = 68800;
    } else if (assetName.includes("EUR")) {
      entry = 1.0841;
      sl = isBull ? 1.081 : 1.0872;
      tp1 = isBull ? 1.088 : 1.08;
      tp2 = isBull ? 1.092 : 1.076;
      sup = 1.082;
      res = 1.09;
    } else if (assetName.includes("NAS")) {
      entry = 19720;
      sl = 19580;
      tp1 = 19900;
      tp2 = 20100;
      sup = 19600;
      res = 20000;
    } else {
      entry = 1.2741;
      sl = isBull ? 1.271 : 1.277;
      tp1 = isBull ? 1.279 : 1.27;
      tp2 = isBull ? 1.284 : 1.265;
      sup = 1.272;
      res = 1.28;
    }
    const rr = ((Math.abs(tp2 - entry) / Math.abs(sl - entry)) || 1).toFixed(1);

    const news = isBull
      ? [
          {
            text: "<strong>US Dollar Index</strong> weakened following softer-than-expected inflation data, boosting risk appetite.",
            sentiment: "Positive",
          },
          {
            text: `<strong>${assetName}</strong> gaining strength supported by institutional buying and declining treasury yields.`,
            sentiment: "Positive",
          },
        ]
      : [
          {
            text: "<strong>Federal Reserve</strong> hawkish commentary renewed USD strength, weighing on risk assets.",
            sentiment: "Negative",
          },
          {
            text: `<strong>${assetName}</strong> facing headwinds from profit-taking at key resistance levels.`,
            sentiment: "Negative",
          },
        ];

    const cal = [
      { time: "15:30", event: "US CPI (MoM)", impact: "high" },
      { time: "17:00", event: "Fed Member Speech", impact: "medium" },
      { time: "19:00", event: "US Crude Oil Inventories", impact: "medium" },
    ];

    const reasoning = isBull
      ? `Our AI identified a <strong>bullish continuation setup</strong> after detecting weakening USD strength, positive institutional order flow and a confirmed breakout above the key $${sup} support-turned-resistance level. Momentum indicators (RSI at ${Math.floor(
          52 + Math.random() * 12
        )}, MACD bullish crossover) support further upside. Smart money positioning data shows net-long accumulation for the third consecutive session. The upcoming economic events may increase short-term volatility — recommended risk per trade remains at 1% of account capital. Suggested to <strong>trail stop to breakeven</strong> once TP1 is reached.`
      : `Our AI identified a <strong>bearish reversal signal</strong> following deteriorating order flow and a confirmed rejection at the $${res} resistance zone. MACD shows bearish crossover on H4, RSI overbought at ${Math.floor(
          68 + Math.random() * 10
        )}. Institutional data reflects increased short positioning. News sentiment is negative, reinforcing downside probability. Monitor upcoming economic releases for volatility spikes. Recommended risk per trade: 1% of account capital.`;

    return {
      instrument: assetName,
      signal,
      trend,
      confidence: conf,
      entry,
      sl,
      tp1,
      tp2,
      rr: `1 : ${rr}`,
      riskLevel: risk.charAt(0).toUpperCase() + risk.slice(1),
      indicators: {
        rsi: Math.floor(48 + Math.random() * 28),
        macd: isBull ? "Bullish X" : "Bearish X",
        ema: isBull ? "Above 200" : "Below 200",
        atr: "High Vol",
        adx: conf > 85 ? "Very Strong" : "Strong",
      },
      structure: {
        trend,
        liquidity: isBull ? "Buy Side" : "Sell Side",
        support: sup,
        resistance: res,
        flow: isBull ? "Positive" : "Negative",
      },
      news,
      cal,
      reasoning,
      timestamp: new Date().toISOString(),
    };
  }

  // ----- HANDLERS -----
  function handleCategory(el, cat) {
    setSelectedCategory(cat);
  }

  function handleType(el, t) {
    setSelectedType(t);
  }

  function handleRisk(r) {
    setSelectedRisk(r);
  }

  function loadTradingView(instrument) {
    const container = tvContainerRef.current;
    if (!container) return;
    const symbol = tvMap[instrument] || "OANDA:XAUUSD";
    container.innerHTML =
      '<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div></div>';
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [[instrument, symbol + "|1D"]],
      chartOnly: false,
      width: "100%",
      height: "380",
      locale: "en",
      colorTheme: "light",
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system,BlinkMacSystemFont,Trebuchet MS,Roboto,Ubuntu,sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "candlesticks",
      maLineColor: "#2962FF",
      maLineWidth: 1,
      maLength: 9,
      headerFontSize: "medium",
      lineWidth: 2,
      lineType: 0,
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
    });
    container.querySelector(".tradingview-widget-container")?.appendChild(script);
  }

  function renderReport(data) {
    setReportData(data);
    setHasReport(true);

    // Trigger gauge animation after render
    setTimeout(() => {
      const circle = gaugeCircleRef.current;
      const num = confNumRef.current;
      if (circle) {
        const circ = 276.46;
        const offset = circ - (circ * (data.confidence / 100));
        circle.style.strokeDashoffset = String(offset);
      }
      if (num) {
        let cn = 0;
        const interval = setInterval(() => {
          cn = Math.min(cn + 2, data.confidence);
          num.textContent = cn + "%";
          if (cn >= data.confidence) clearInterval(interval);
        }, 20);
      }
    }, 200);

    // Typewriter effect for reasoning
    const rt = reasoningRef.current;
    const typing = typingRef.current;
    if (rt && typing) {
      rt.innerHTML = "";
      typing.style.display = "inline-block";
      let idx = 0;
      const raw = data.reasoning;
      const stripped = raw.replace(/<[^>]+>/g, "");
      function typeNext() {
        if (idx < stripped.length) {
          rt.innerHTML = stripped.substring(0, idx + 1);
          idx++;
          if (idx < stripped.length) {
            setTimeout(typeNext, idx < 50 ? 30 : idx < 150 ? 18 : 12);
          } else {
            rt.innerHTML = raw;
            typing.style.display = "none";
          }
        }
      }
      setTimeout(typeNext, 200);
    }

    // Load chart
    loadTradingView(data.instrument);
  }

  async function handleGenerate() {
    if (generating) return;
    if (credits <= 0) {
      setShowModal(true);
      return;
    }
    setGenerating(true);
    setHasReport(false);
    setReportData(null);
    setCurrentStep(0);
    setLoadingProgress(0);

    // Decrement credits
    setCredits((c) => Math.max(0, c - 1));

    // Simulate loading with steps
    const totalSteps = loadingSteps.length;
    
    for (let i = 0; i < totalSteps; i++) {
      setCurrentStep(i);
      const progress = Math.round(((i + 1) / totalSteps) * 100);
      setLoadingProgress(progress);
      
      // Random delay between 600-1200ms for realistic feel
      const delay = 600 + Math.random() * 600;
      await new Promise((r) => setTimeout(r, delay));
    }

    // Final delay before showing report
    await new Promise((r) => setTimeout(r, 500));

    // Get mock data
    const assetEl = document.getElementById("ata-asset");
    const asset = assetEl ? assetEl.value : "XAU/USD";
    const data = getMockResponse(selectedCategory, asset, selectedType, selectedRisk);

    // Add to history
    const newEntry = {
      date: new Date(),
      instrument: data.instrument,
      category: selectedCategory,
      trend: data.trend,
      confidence: data.confidence,
      credits: 1,
      data,
    };
    setHistory((prev) => [newEntry, ...prev].slice(0, 20));

    // Show report
    renderReport(data);
    setGenerating(false);
  }

  function buyCredits(amount) {
    setCredits((c) => c + amount);
  }

  function copyReport() {
    const text = reportRef.current?.innerText || "No report";
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function loadHistory(index) {
    const entry = history[index];
    if (!entry) return;
    setHasReport(true);
    renderReport(entry.data);
  }

  // ----- EFFECTS -----
  useEffect(() => {
    // Clock
    const clockEl = document.getElementById("ata-clock");
    if (clockEl) {
      const tick = () => {
        const n = new Date();
        clockEl.textContent = n.toUTCString().split(" ").slice(4, 5)[0] + " UTC";
      };
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  // ----- RENDER -----
  return (
    <div
      style={{
        background: "#f5f7fa",
        color: "#1a1a2e",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`
        :root{--bg:#f5f7fa;--bg2:#ffffff;--bg3:#f0f2f5;--bg4:#e8eaed;--glass:rgba(255,255,255,0.7);--glass-hover:rgba(255,255,255,0.9);--accent:#07dbc7;--accent-dim:rgb(0 123 184 / 12%);--accent-glow:rgba(0,184,90,0.25);--text-primary:#1a1a2e;--text-secondary:#6b7280;--text-muted:#9ca3af;--border:rgba(0,0,0,0.08);--border-hover:rgba(0,0,0,0.15);--red:#EF4444;--gold:#F59E0B;--blue:#3B82F6;--purple:#8B5CF6;}
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text-primary);}
        .topbar{padding:13px 26px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);position:sticky;top:0;z-index:50;}
        .topbar-left{display:flex;align-items:center;gap:12px;flex-shrink:0;}
        .vlv-name-top{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;letter-spacing:2.5px;color:#1a1a2e;line-height:1.1;}
        .vlv-tag-top{font-size:10px;letter-spacing:1.3px;color:#07dbc7;font-weight:600;margin-top:2px;}
        .topbar-right{margin-left:auto;display:flex;align-items:center;gap:10px;}
        .sb{display:flex;align-items:center;gap:7px;background:var(--glass);border:1px solid var(--border);border-radius:8px;padding:7px 12px;width:210px;}
        .sb:focus-within{border-color:rgba(0,184,90,0.35);}
        .sb input{background:none;border:none;outline:none;color:var(--text-primary);font-size:12.5px;width:100%;font-family:'Inter',sans-serif;}
        .sb input::placeholder{color:var(--text-muted);}
        .icon-btn{width:33px;height:33px;background:var(--glass);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;position:relative;}
        .icon-btn:hover{border-color:var(--border-hover);}
        .ndot{position:absolute;top:6px;right:6px;width:6px;height:6px;border-radius:50%;background:var(--accent);border:1.5px solid #fff;}
        .user-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, #07dbc7, #2ec4ce);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;cursor:pointer;}
        .ata-wrap{padding:22px 26px;display:flex;flex-direction:column;gap:20px;}
        .ata-topbar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
        .ata-credits-card{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,rgba(0,184,90,0.08),rgba(255,255,255,0.5));border:1px solid rgba(0,184,90,0.2);border-radius:14px;padding:14px 20px;position:relative;overflow:hidden;}
        .ata-credits-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgb(0 138 184 / 40%),transparent);}
        .ata-cred-icon{width:38px;height:38px;border-radius:10px;background:rgb(0 123 184 / 12%);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
        .ata-cred-lbl{font-size:10.5px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:2px;}
        .ata-cred-val{font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:700;color:var(--accent);line-height:1;transition:all 0.4s;}
        .ata-cred-sub{font-size:10.5px;color:var(--text-secondary);margin-top:2px;}
        .ata-buy-btn{display:inline-flex;align-items:center;gap:7px;background:var(--accent);color:#fff;padding:10px 20px;border-radius:9px;font-size:13px;font-weight:700;border:none;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
        .ata-buy-btn:hover{background:#008844;box-shadow:0 4px 20px rgba(0,184,90,0.35);}
        .ata-clock{margin-left:auto;font-family:'Space Grotesk',sans-serif;font-size:13px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;}
        .ata-main{display:grid;grid-template-columns:380px 1fr;gap:18px;align-items:start;}
        .ata-left{background:#fff;border:1px solid var(--border);border-radius:16px;overflow:hidden;position:sticky;top:76px;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .ata-left-head{padding:18px 20px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,rgba(0,184,90,0.04),transparent);}
        .ata-left-title{font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;margin-bottom:3px;color:var(--text-primary);}
        .ata-left-sub{font-size:11.5px;color:var(--text-secondary);}
        .ata-step{padding:16px 20px;border-bottom:1px solid rgba(0,0,0,0.04);}
        .ata-step-lbl{font-size:10.5px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
        .ata-step-num{width:18px;height:18px;border-radius:50%;background:var(--accent);color:#fff;font-size:9px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ata-cats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
        .ata-cat{padding:9px 6px;background:var(--bg3);border:1px solid var(--border);border-radius:9px;text-align:center;cursor:pointer;transition:all 0.2s;font-size:11.5px;font-weight:500;color:var(--text-secondary);}
        .ata-cat:hover{border-color:rgba(0,184,90,0.3);color:var(--text-primary);}
        .ata-cat.sel{background:var(--accent-dim);border-color:rgb(0 138 184 / 40%);color:var(--accent);font-weight:600;}
        .ata-cat-icon{font-size:17px;display:block;margin-bottom:4px;}
        .ata-select{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:9px;padding:10px 14px;color:var(--text-primary);font-size:13px;outline:none;font-family:'Inter',sans-serif;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:calc(100% - 12px) 50%;padding-right:30px;transition:border-color 0.2s;cursor:pointer;}
        .ata-select:focus{border-color:rgb(0 138 184 / 40%);}
        .ata-select option{background:#fff;}
        .ata-types{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
        .ata-type{padding:9px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:9px;cursor:pointer;transition:all 0.2s;font-size:11.5px;font-weight:500;color:var(--text-secondary);display:flex;align-items:center;gap:6px;}
        .ata-type:hover{border-color:rgba(0,184,90,0.3);color:var(--text-primary);}
        .ata-type.sel{background:var(--accent-dim);border-color:rgb(0 138 184 / 40%);color:var(--accent);font-weight:600;}
        .ata-type-icon{font-size:14px;flex-shrink:0;}
        .ata-risks{display:flex;gap:8px;}
        .ata-risk{flex:1;padding:9px;background:var(--bg3);border:1px solid var(--border);border-radius:9px;text-align:center;cursor:pointer;font-size:12px;font-weight:500;color:var(--text-secondary);transition:all 0.2s;}
        .ata-risk:hover{border-color:rgba(0,184,90,0.3);}
        .ata-risk.sel-low{background:rgb(0 132 184 / 10%);border-color:rgb(0 138 184 / 40%);color:var(--accent);}
        .ata-risk.sel-med{background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.4);color:var(--gold);}
        .ata-risk.sel-high{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.4);color:var(--red);}
        .ata-gen-footer{padding:16px 20px;}
        .ata-credit-req{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:9px 13px;background:var(--bg3);border-radius:8px;border:1px solid var(--border);}
        .ata-gen-btn{width:100%;padding:13px;background:linear-gradient(135deg, #07dbc7, #2ec4ce);color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.25s;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Inter',sans-serif;}
        .ata-gen-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,184,90,0.35);}
        .ata-gen-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;box-shadow:none;}
        .ata-right{display:flex;flex-direction:column;gap:16px;}
        .ata-empty{background:#fff;border:1px solid var(--border);border-radius:16px;padding:60px 30px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .ata-empty-icon{width:80px;height:80px;border-radius:50%;background:var(--accent-dim);border:1px solid rgba(0,184,90,0.2);display:flex;align-items:center;justify-content:center;font-size:34px;animation:ata-float 3s ease-in-out infinite;}
        @keyframes ata-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .ata-loading{background:#fff;border:1px solid rgba(0,184,90,0.2);border-radius:16px;padding:50px 30px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:20px;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .ata-loading.hidden{display:none;}
        .ata-load-spinner{width:60px;height:60px;border-radius:50%;border:3px solid rgba(0,184,90,0.15);border-top-color:var(--accent);animation:ata-spin 0.8s linear infinite;position:relative;}
        .ata-load-spinner::after{content:'';position:absolute;inset:6px;border-radius:50%;border:3px solid rgba(0,136,68,0.15);border-bottom-color:#008844;animation:ata-spin 1.2s linear infinite reverse;}
        @keyframes ata-spin{to{transform:rotate(360deg)}}
        .ata-load-steps{display:flex;flex-direction:column;gap:6px;width:100%;max-width:320px;text-align:left;}
        .ata-load-step{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;font-size:12.5px;color:var(--text-secondary);transition:all 0.4s;}
        .ata-load-step.done{color:var(--accent);background:rgba(0,184,90,0.06);}
        .ata-load-step.active{color:var(--text-primary);background:rgba(0,0,0,0.03);font-weight:500;}
        .ata-load-dot{width:8px;height:8px;border-radius:50%;background:var(--text-muted);flex-shrink:0;transition:background 0.3s;}
        .ata-load-step.done .ata-load-dot{background:var(--accent);}
        .ata-load-step.active .ata-load-dot{background:var(--accent);animation:blink 0.8s infinite;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .ata-progress-bar{width:100%;max-width:320px;height:4px;background:rgba(0,0,0,0.06);border-radius:2px;overflow:hidden;}
        .ata-progress-fill{height:100%;background:linear-gradient(90deg,#07dbc7,#008844);border-radius:2px;width:0%;transition:width 0.5s ease;}
        .ata-progress-text{font-size:12px;font-weight:600;color:var(--accent);margin-top:-8px;}
        .ata-report{background:#fff;border:1px solid var(--border);border-radius:16px;overflow:hidden;display:none;animation:ata-fadein 0.5s ease;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .ata-report.show{display:block;}
        @keyframes ata-fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .ata-report-head{padding:18px 22px;background:linear-gradient(135deg,rgba(0,184,90,0.05),rgba(255,255,255,0.5));border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;position:relative;}
        .ata-report-head::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,184,90,0.3),transparent);}
        .ata-complete-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(0,184,90,0.08);border:1px solid rgba(0,184,90,0.2);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:600;color:var(--accent);}
        .ata-report-body{padding:22px;}
        .ata-tv-card{background:var(--bg3);border:1px solid var(--border);border-radius:12px;margin-bottom:18px;overflow:hidden;}
        .ata-tv-head{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid var(--border);background:#fff;}
        .ata-tv-head-lbl{font-size:10.5px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.6px;display:flex;align-items:center;gap:6px;}
        .ata-tv-live-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);display:inline-block;animation:blink 1.6s infinite;}
        .ata-tv-body{padding:0;background:#f8f9fa;}
        .ata-instr-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px;}
        .ata-instr{font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;color:var(--text-primary);}
        .ata-signal-badge{padding:6px 18px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:0.5px;}
        .ata-signal-buy{background:rgba(0,184,90,0.15);color:var(--accent);border:1px solid rgba(0,184,90,0.3);}
        .ata-signal-sell{background:rgba(239,68,68,0.15);color:var(--red);border:1px solid rgba(239,68,68,0.3);}
        .ata-signal-hold{background:rgba(245,158,11,0.12);color:var(--gold);border:1px solid rgba(245,158,11,0.25);}
        .ata-trend-conf{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;margin-bottom:18px;}
        .ata-trend-box{padding:14px;background:var(--bg3);border-radius:11px;border:1px solid var(--border);}
        .ata-trend-lbl{font-size:10.5px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:5px;}
        .ata-trend-val{font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;color:var(--text-primary);}
        .ata-gauge{width:110px;height:110px;position:relative;flex-shrink:0;}
        .ata-gauge-val{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
        .ata-gauge-num{font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;color:var(--accent);line-height:1;}
        .ata-gauge-lbl{font-size:9.5px;color:var(--text-secondary);margin-top:1px;}
        .ata-levels{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:18px;}
        .ata-level-box{background:var(--bg3);border-radius:9px;padding:11px 8px;text-align:center;border:1px solid var(--border);}
        .ata-level-lbl{font-size:9.5px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;}
        .ata-level-val{font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:var(--text-primary);}
        .ata-indicators{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:18px;}
        .ata-ind-card{background:var(--bg3);border:1px solid var(--border);border-radius:9px;padding:11px 8px;text-align:center;}
        .ata-ind-name{font-size:10px;color:var(--text-secondary);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px;}
        .ata-ind-val{font-size:12px;font-weight:700;margin-bottom:2px;color:var(--text-primary);}
        .ata-ind-sub{font-size:9.5px;color:var(--text-secondary);}
        .ata-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;}
        .ata-section-card{background:var(--bg3);border:1px solid var(--border);border-radius:11px;padding:14px;}
        .ata-section-title{font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;display:flex;align-items:center;gap:5px;}
        .ata-struct-row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:7px;align-items:center;}
        .ata-struct-row span:first-child{color:var(--text-secondary);}
        .ata-struct-row strong{color:var(--text-primary);}
        .ata-news-item{padding:9px 0;border-bottom:1px solid rgba(0,0,0,0.04);font-size:12px;line-height:1.6;color:var(--text-secondary);}
        .ata-news-item:last-child{border-bottom:none;padding-bottom:0;}
        .ata-news-item strong{color:var(--text-primary);}
        .ata-cal-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(0,0,0,0.04);font-size:12px;}
        .ata-cal-item:last-child{border-bottom:none;}
        .ata-cal-time{font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;color:var(--text-primary);width:40px;flex-shrink:0;}
        .ata-cal-impact{padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;flex-shrink:0;}
        .ata-high-impact{background:rgba(239,68,68,0.1);color:var(--red);border:1px solid rgba(239,68,68,0.2);}
        .ata-med-impact{background:rgba(245,158,11,0.1);color:var(--gold);border:1px solid rgba(245,158,11,0.2);}
        .ata-reasoning{background:linear-gradient(135deg,rgba(0,184,90,0.04),rgba(255,255,255,0.5));border:1px solid rgb(0 132 184 / 10%);border-radius:11px;padding:16px;margin-bottom:18px;font-size:13px;line-height:1.85;color:var(--text-primary);}
        .ata-reasoning-head{display:flex;align-items:center;gap:9px;margin-bottom:12px;}
        .ata-reasoning-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg, #07dbc7, #2ec4ce);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
        .ata-typing{display:inline-block;width:2px;height:13px;background:var(--accent);animation:blink 1s infinite;border-radius:1px;margin-left:3px;}
        .ata-report-actions{display:flex;gap:8px;flex-wrap:wrap;padding:0 22px 22px;}
        .chip{padding:3px 8px;border-radius:20px;font-size:11px;font-weight:500;border:1px solid var(--border);color:var(--text-secondary);background:#fff;}
        .cg{color:var(--accent);border-color:rgba(0,184,90,0.2);background:rgba(0,184,90,0.06);}
        .ata-history{background:#fff;border:1px solid var(--border);border-radius:16px;padding:18px;margin-top:18px;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
        .ata-hist-title{font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:600;margin-bottom:14px;color:var(--text-primary);}
        .sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
        .tw{overflow-x:auto;}
        table{width:100%;border-collapse:collapse;}
        th{font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;padding:9px 13px;text-align:left;border-bottom:2px solid var(--border);}
        td{padding:11px 13px;font-size:13px;border-bottom:1px solid rgba(0,0,0,0.03);}
        tr:hover td{background:rgba(0,0,0,0.02);}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all 0.2s;font-family:'Inter',sans-serif;}
        .btn-p{background:var(--accent);color:#fff;}
        .btn-p:hover{background:#008844;box-shadow:0 4px 16px rgba(0,184,90,0.3);}
        .btn-s{background:var(--glass);color:var(--text-primary);border:1px solid var(--border);}
        .btn-s:hover{border-color:var(--border-hover);background:var(--bg3);}
        .bsm{padding:6px 11px;font-size:12px;border-radius:7px;}
        .ata-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);z-index:999;display:none;align-items:center;justify-content:center;}
        .ata-modal-overlay.show{display:flex;}
        .ata-modal{background:#fff;border:1px solid rgba(0,184,90,0.2);border-radius:18px;padding:34px;max-width:380px;width:90%;text-align:center;animation:ata-fadein 0.3s ease;box-shadow:0 20px 60px rgba(0,0,0,0.15);}
        .ata-modal-icon{font-size:40px;margin-bottom:16px;}
        .ata-modal-title{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:700;margin-bottom:8px;color:var(--text-primary);}
        .ata-modal-sub{font-size:13px;color:var(--text-secondary);margin-bottom:22px;line-height:1.6;}
        @media(max-width:1000px){.ata-main{grid-template-columns:1fr}.ata-left{position:static}}
        @media(max-width:680px){.ata-levels,.ata-indicators{grid-template-columns:repeat(3,1fr)}.ata-2col{grid-template-columns:1fr}.ata-cats{grid-template-columns:repeat(3,1fr)}}
      `}</style>

      

      {/* MAIN CONTENT */}
      <div className="ata-wrap">
        {/* CREDITS BAR */}
        <div className="ata-topbar">
          <div className="ata-credits-card">
            <div className="ata-cred-icon">⚡</div>
            <div>
              <div className="ata-cred-lbl">Available Credits</div>
              <div className="ata-cred-val" id="ata-cred-display">
                {credits}
              </div>
              <div className="ata-cred-sub">AI analysis credits</div>
            </div>
          </div>
          <button className="ata-buy-btn" onClick={() => buyCredits(50)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Buy Credits
          </button>
          <div className="ata-clock">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span id="ata-clock">--:--:-- UTC</span>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="ata-main">
          {/* LEFT PANEL */}
          <div className="ata-left">
            <div className="ata-left-head">
              <div className="ata-left-title">✦ Generate AI Market Analysis</div>
              <div className="ata-left-sub">
                Configure your request · 1 credit per analysis
              </div>
            </div>

            {/* Step 1: Category */}
            <div className="ata-step">
              <div className="ata-step-lbl">
                <span className="ata-step-num">1</span>Market Category
              </div>
              <div className="ata-cats">
                {["forex", "crypto", "metals", "indices", "commodities"].map(
                  (cat) => (
                    <div
                      key={cat}
                      className={`ata-cat ${
                        selectedCategory === cat ? "sel" : ""
                      }`}
                      onClick={(e) => handleCategory(e.currentTarget, cat)}
                    >
                      <span className="ata-cat-icon">
                        {cat === "forex" && "💱"}
                        {cat === "crypto" && "₿"}
                        {cat === "metals" && "🥇"}
                        {cat === "indices" && "📈"}
                        {cat === "commodities" && "🛢"}
                      </span>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Step 2: Asset */}
            <div className="ata-step">
              <div className="ata-step-lbl">
                <span className="ata-step-num">2</span>Choose Asset
              </div>
              <select className="ata-select" id="ata-asset">
                {assetMap[selectedCategory]?.map((asset) => (
                  <option key={asset} value={asset.split(" — ")[0]}>
                    {asset}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Analysis Type */}
            <div className="ata-step">
              <div className="ata-step-lbl">
                <span className="ata-step-num">3</span>Analysis Type
              </div>
              <div className="ata-types">
                {[
                  { id: "quick", label: "Quick Signal", icon: "⚡" },
                  { id: "intraday", label: "Intraday", icon: "📊" },
                  { id: "swing", label: "Swing Analysis", icon: "🔄" },
                  { id: "scalping", label: "Scalping", icon: "⚡" },
                  { id: "position", label: "Position Trade", icon: "📋" },
                  { id: "outlook", label: "Market Outlook", icon: "🌐" },
                ].map((t) => (
                  <div
                    key={t.id}
                    className={`ata-type ${selectedType === t.id ? "sel" : ""}`}
                    onClick={(e) => handleType(e.currentTarget, t.id)}
                  >
                    <span className="ata-type-icon">{t.icon}</span>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 4: Risk */}
            <div className="ata-step">
              <div className="ata-step-lbl">
                <span className="ata-step-num">4</span>Risk Preference
              </div>
              <div className="ata-risks">
                {[
                  { id: "low", label: "Low", emoji: "🟢" },
                  { id: "med", label: "Medium", emoji: "🟡" },
                  { id: "high", label: "High", emoji: "🔴" },
                ].map((r) => (
                  <div
                    key={r.id}
                    className={`ata-risk ${
                      selectedRisk === r.id ? `sel-${r.id}` : ""
                    }`}
                    onClick={() => handleRisk(r.id)}
                  >
                    {r.emoji}
                    <br />
                    <span style={{ fontSize: "11px", fontWeight: "600" }}>
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate */}
            <div className="ata-gen-footer">
              <div className="ata-credit-req">
                <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                  Credits Required
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "var(--accent)",
                  }}
                >
                  ⚡ 1 Credit
                </span>
              </div>
              <button
                className="ata-gen-btn"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span
                      style={{
                        animation: "ata-spin 0.8s linear infinite",
                        display: "inline-block",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        width: "14px",
                        height: "14px",
                      }}
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                    Generate AI Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="ata-right">
            {/* Empty State */}
            {!generating && !hasReport && (
              <div className="ata-empty">
                <div className="ata-empty-icon">🤖</div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: "17px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                  }}
                >
                  Request Your First Analysis
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    maxWidth: "320px",
                    lineHeight: "1.7",
                  }}
                >
                  Configure your market parameters on the left and click{" "}
                  <strong style={{ color: "var(--accent)" }}>
                    Generate AI Analysis
                  </strong>{" "}
                  to receive institutional-grade intelligence.
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    marginTop: "8px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>📊</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      Technical Analysis
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>📰</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      News Sentiment
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>📅</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      Economic Calendar
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>🧠</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      AI Reasoning
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading */}
            {generating && (
              <div className="ata-loading">
                <div className="ata-load-spinner"></div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                  }}
                >
                  Initializing AI Analysis...
                </div>
                <div className="ata-load-steps">
                  {loadingSteps.map((label, i) => (
                    <div
                      key={i}
                      className={`ata-load-step ${
                        i < currentStep
                          ? "done"
                          : i === currentStep
                          ? "active"
                          : ""
                      }`}
                    >
                      <span className="ata-load-dot"></span>
                      {label}
                    </div>
                  ))}
                </div>
                <div className="ata-progress-bar">
                  <div
                    className="ata-progress-fill"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <div className="ata-progress-text">{loadingProgress}% Complete</div>
              </div>
            )}

            {/* Report */}
            <div
              className={`ata-report ${hasReport ? "show" : ""}`}
              ref={reportRef}
            >
              {reportData && (
                <>
                  <div className="ata-report-head">
                    <div>
                      <div className="ata-complete-badge">
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "var(--accent)",
                            display: "inline-block",
                          }}
                        ></span>
                        Analysis Complete
                      </div>
                      <div
                        style={{
                          fontSize: "11.5px",
                          color: "var(--text-secondary)",
                          marginTop: "6px",
                        }}
                      >
                        Generated <span id="rpt-time">just now</span> &nbsp;·&nbsp;{" "}
                        via XOXO FX AI Engine
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        ⚡ 1 Credit Used
                      </span>
                      <span className="chip cg" style={{ fontSize: "10.5px" }}>
                        {selectedType.charAt(0).toUpperCase() +
                          selectedType.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="ata-report-body">
                    {/* Chart */}
                    <div className="ata-tv-card">
                      <div className="ata-tv-head">
                        <div className="ata-tv-head-lbl">
                          <span className="ata-tv-live-dot"></span>Live Market
                          Chart
                        </div>
                        <div
                          style={{ fontSize: "10px", color: "var(--text-muted)" }}
                        >
                          Powered by TradingView
                        </div>
                      </div>
                      <div className="ata-tv-body" ref={tvContainerRef}></div>
                    </div>

                    {/* Instrument + Signal */}
                    <div className="ata-instr-row">
                      <div>
                        <div
                          style={{
                            fontSize: "10.5px",
                            color: "var(--text-secondary)",
                            marginBottom: "3px",
                            textTransform: "uppercase",
                            letterSpacing: "0.6px",
                          }}
                        >
                          Instrument
                        </div>
                        <div className="ata-instr">
                          {reportData.instrument}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "10.5px",
                            color: "var(--text-secondary)",
                            marginBottom: "5px",
                            textTransform: "uppercase",
                            letterSpacing: "0.6px",
                          }}
                        >
                          AI Recommendation
                        </div>
                        <span
                          className={`ata-signal-badge ${
                            reportData.signal === "BUY"
                              ? "ata-signal-buy"
                              : "ata-signal-sell"
                          }`}
                        >
                          {reportData.signal}
                        </span>
                      </div>
                    </div>

                    {/* Trend + Confidence */}
                    <div className="ata-trend-conf">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                        }}
                      >
                        <div className="ata-trend-box">
                          <div className="ata-trend-lbl">Market Trend</div>
                          <div
                            className="ata-trend-val"
                            style={{
                              color:
                                reportData.trend === "Bullish"
                                  ? "var(--accent)"
                                  : "var(--red)",
                            }}
                          >
                            {reportData.trend}
                          </div>
                        </div>
                        <div className="ata-trend-box">
                          <div className="ata-trend-lbl">Risk Level</div>
                          <div
                            className="ata-trend-val"
                            style={{ color: "var(--gold)" }}
                          >
                            {reportData.riskLevel}
                          </div>
                        </div>
                        <div className="ata-trend-box">
                          <div className="ata-trend-lbl">Risk Reward</div>
                          <div className="ata-trend-val">{reportData.rr}</div>
                        </div>
                        <div className="ata-trend-box">
                          <div className="ata-trend-lbl">Rec. Risk/Trade</div>
                          <div
                            className="ata-trend-val"
                            style={{ color: "var(--accent)" }}
                          >
                            1%
                          </div>
                        </div>
                      </div>
                      <div className="ata-gauge">
                        <svg width="110" height="110" viewBox="0 0 110 110">
                          <circle
                            cx="55"
                            cy="55"
                            r="44"
                            fill="none"
                            stroke="rgba(0,0,0,0.06)"
                            strokeWidth="8"
                          />
                          <circle
                            ref={gaugeCircleRef}
                            cx="55"
                            cy="55"
                            r="44"
                            fill="none"
                            stroke="url(#ataGrad)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="276.46"
                            strokeDashoffset="276.46"
                            transform="rotate(-90 55 55)"
                            style={{ transition: "stroke-dashoffset 1.4s ease" }}
                          />
                          <defs>
                            <linearGradient id="ataGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#07dbc7" />
                              <stop offset="100%" stopColor="#008844" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="ata-gauge-val">
                          <div className="ata-gauge-num" ref={confNumRef}>
                            {reportData.confidence}%
                          </div>
                          <div className="ata-gauge-lbl">Confidence</div>
                        </div>
                      </div>
                    </div>

                    {/* Levels */}
                    <div className="ata-levels">
                      <div className="ata-level-box">
                        <div className="ata-level-lbl">Entry Zone</div>
                        <div className="ata-level-val">{reportData.entry}</div>
                      </div>
                      <div
                        className="ata-level-box"
                        style={{ borderColor: "rgba(239,68,68,0.2)" }}
                      >
                        <div className="ata-level-lbl">Stop Loss</div>
                        <div
                          className="ata-level-val"
                          style={{ color: "var(--red)" }}
                        >
                          {reportData.sl}
                        </div>
                      </div>
                      <div
                        className="ata-level-box"
                        style={{ borderColor: "rgba(0,184,90,0.2)" }}
                      >
                        <div className="ata-level-lbl">Take Profit 1</div>
                        <div
                          className="ata-level-val"
                          style={{ color: "var(--accent)" }}
                        >
                          {reportData.tp1}
                        </div>
                      </div>
                      <div
                        className="ata-level-box"
                        style={{ borderColor: "rgba(0,184,90,0.3)" }}
                      >
                        <div className="ata-level-lbl">Take Profit 2</div>
                        <div
                          className="ata-level-val"
                          style={{ color: "var(--accent)" }}
                        >
                          {reportData.tp2}
                        </div>
                      </div>
                      <div
                        className="ata-level-box"
                        style={{ borderColor: "rgba(59,130,246,0.2)" }}
                      >
                        <div className="ata-level-lbl">Risk Reward</div>
                        <div
                          className="ata-level-val"
                          style={{ color: "var(--blue)" }}
                        >
                          {reportData.rr}
                        </div>
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: "600",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.7px",
                        marginBottom: "8px",
                      }}
                    >
                      Technical Indicators
                    </div>
                    <div className="ata-indicators" style={{ marginBottom: "18px" }}>
                      {[
                        {
                          label: "RSI",
                          value: reportData.indicators.rsi,
                          sub: "Neutral",
                          color:
                            reportData.indicators.rsi > 70
                              ? "var(--red)"
                              : reportData.indicators.rsi < 30
                              ? "var(--accent)"
                              : "var(--gold)",
                        },
                        {
                          label: "MACD",
                          value: reportData.indicators.macd,
                          sub: "Crossover",
                          color: reportData.indicators.macd.includes("Bull")
                            ? "var(--accent)"
                            : "var(--red)",
                        },
                        {
                          label: "EMA",
                          value: reportData.indicators.ema,
                          sub: "Trend",
                          color: reportData.indicators.ema.includes("Above")
                            ? "var(--accent)"
                            : "var(--red)",
                        },
                        {
                          label: "ATR",
                          value: reportData.indicators.atr,
                          sub: "Volatility",
                          color: "var(--gold)",
                        },
                        {
                          label: "ADX",
                          value: reportData.indicators.adx,
                          sub: "Trend Str.",
                          color: "var(--accent)",
                        },
                      ].map((ind, i) => (
                        <div key={i} className="ata-ind-card">
                          <div className="ata-ind-name">{ind.label}</div>
                          <div
                            className="ata-ind-val"
                            style={{ color: ind.color, fontSize: "10px" }}
                          >
                            {ind.value}
                          </div>
                          <div className="ata-ind-sub">{ind.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Structure + News */}
                    <div className="ata-2col">
                      <div className="ata-section-card">
                        <div className="ata-section-title">📐 Market Structure</div>
                        <div className="ata-struct-row">
                          <span>Trend</span>
                          <strong
                            style={{
                              color:
                                reportData.structure.trend === "Bullish"
                                  ? "var(--accent)"
                                  : "var(--red)",
                            }}
                          >
                            {reportData.structure.trend}
                          </strong>
                        </div>
                        <div className="ata-struct-row">
                          <span>Liquidity</span>
                          <strong>{reportData.structure.liquidity}</strong>
                        </div>
                        <div className="ata-struct-row">
                          <span>Support</span>
                          <strong>{reportData.structure.support}</strong>
                        </div>
                        <div className="ata-struct-row">
                          <span>Resistance</span>
                          <strong>{reportData.structure.resistance}</strong>
                        </div>
                        <div className="ata-struct-row">
                          <span>Order Flow</span>
                          <strong
                            style={{
                              color:
                                reportData.structure.flow === "Positive"
                                  ? "var(--accent)"
                                  : "var(--red)",
                            }}
                          >
                            {reportData.structure.flow}
                          </strong>
                        </div>
                      </div>
                      <div className="ata-section-card">
                        <div className="ata-section-title">📰 News Sentiment</div>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "600",
                            marginBottom: "10px",
                            background:
                              reportData.signal === "BUY"
                                ? "rgba(0,184,90,0.08)"
                                : "rgba(239,68,68,0.08)",
                            color:
                              reportData.signal === "BUY"
                                ? "var(--accent)"
                                : "var(--red)",
                            border: `1px solid ${
                              reportData.signal === "BUY"
                                ? "rgba(0,184,90,0.2)"
                                : "rgba(239,68,68,0.2)"
                            }`,
                          }}
                        >
                          {reportData.signal === "BUY" ? "● Positive" : "● Negative"}{" "}
                          Sentiment
                        </div>
                        {reportData.news.map((n, i) => (
                          <div
                            key={i}
                            className="ata-news-item"
                            dangerouslySetInnerHTML={{ __html: n.text }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Economic Calendar */}
                    <div
                      className="ata-section-card"
                      style={{ marginBottom: "18px" }}
                    >
                      <div className="ata-section-title">
                        📅 Economic Calendar — Today's Events
                      </div>
                      {reportData.cal.map((c, i) => (
                        <div key={i} className="ata-cal-item">
                          <span className="ata-cal-time">{c.time}</span>
                          <span
                            className={`ata-cal-impact ${
                              c.impact === "high"
                                ? "ata-high-impact"
                                : "ata-med-impact"
                            }`}
                          >
                            {c.impact === "high" ? "HIGH" : "MED"}
                          </span>
                          <span
                            style={{ fontSize: "12.5px", fontWeight: "500" }}
                          >
                            {c.event}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* AI Reasoning */}
                    <div className="ata-reasoning">
                      <div className="ata-reasoning-head">
                        <div className="ata-reasoning-avatar">AI</div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "600" }}>
                            XOXO FX AI Reasoning
                          </div>
                          <div
                            style={{ fontSize: "11px", color: "var(--text-secondary)" }}
                          >
                            Institutional Analysis Engine
                          </div>
                        </div>
                      </div>
                      <div ref={reasoningRef}></div>
                      <span className="ata-typing" ref={typingRef}></span>
                    </div>

                    {/* Actions */}
                    <div className="ata-report-actions">
                      <button className="btn btn-s bsm" onClick={copyReport}>
                        <svg
                          width="13"
                          height="13"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Analysis
                      </button>
                      <button className="btn btn-s bsm">
                        <svg
                          width="13"
                          height="13"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                      </button>
                      <button className="btn btn-p bsm" onClick={handleGenerate}>
                        <svg
                          width="13"
                          height="13"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Generate Again
                      </button>
                      <button className="btn btn-s bsm">
                        <svg
                          width="13"
                          height="13"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Save Report
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="ata-history">
                <div className="sh">
                  <div className="ata-hist-title">Previous Reports</div>
                  <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                    {history.length} request{history.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Instrument</th>
                        <th>Category</th>
                        <th>Trend</th>
                        <th>Confidence</th>
                        <th>Credits</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i}>
                          <td>
                            {h.date.toLocaleDateString()}{" "}
                            {h.date.toLocaleTimeString()}
                          </td>
                          <td>
                            <strong>{h.instrument}</strong>
                          </td>
                          <td>
                            <span
                              className="chip"
                              style={{
                                fontSize: "10.5px",
                                textTransform: "capitalize",
                              }}
                            >
                              {h.category}
                            </span>
                          </td>
                          <td>
                            <strong
                              style={{
                                color:
                                  h.trend === "Bullish"
                                    ? "var(--accent)"
                                    : "var(--red)",
                              }}
                            >
                              {h.trend}
                            </strong>
                          </td>
                          <td>
                            <strong style={{ color: "var(--accent)" }}>
                              {h.confidence}%
                            </strong>
                          </td>
                          <td style={{ color: "var(--gold)" }}>
                            ⚡ {h.credits}
                          </td>
                          <td>
                            <button
                              className="btn btn-s bsm"
                              onClick={() => loadHistory(i)}
                              style={{ padding: "4px 10px", fontSize: "11px" }}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <div className={`ata-modal-overlay ${showModal ? "show" : ""}`}>
        <div className="ata-modal">
          <div className="ata-modal-icon">⚡</div>
          <div className="ata-modal-title">No AI Credits Available</div>
          <div className="ata-modal-sub">
            You've used all your credits. Purchase more credits to continue
            receiving institutional AI market intelligence.
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="btn btn-p"
              onClick={() => {
                buyCredits(50);
                setShowModal(false);
              }}
            >
              Buy Credits
            </button>
            <button className="btn btn-s" onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
