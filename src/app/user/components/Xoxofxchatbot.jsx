import { useState, useRef, useEffect } from "react";
import { useTheme } from '@/components/ThemeProvider';

const KB = {
  // ---------- PLATFORM OVERVIEW ----------
  "what is xoxo fx": "XOXO FX is a cutting-edge AI bot trading platform built to automate and optimize market performance. It combines fund management, CRM, broker connectivity, and AI into one unified ecosystem.",
  "xoxo fx kya hai": "XOXO FX ek cutting-edge AI bot trading platform hai jo fund management, CRM, broker connectivity, aur AI ko ek unified ecosystem mein combine karta hai.",
  "what does xoxo fx do": "XOXO FX automates trading using AI Robotic Bots that process real-time market data to deliver accurate signals, speed of execution, and predictive profits.",
  "who founded xoxo fx": "XOXO FX was founded by Mr. Chris Luther (Director) to simplify trading by combining fund management, CRM, broker connectivity, and AI into one ecosystem.",
  "what is the xoxo fx ecosystem": "The XOXO FX Unified Ecosystem combines 4 pillars — Fund Management, CRM, Broker Connectivity, and AI Capabilities — to deliver Clarity, Performance, and Trust.",
  "what is the unified ecosystem thesis": "The Unified Ecosystem Thesis: XOXO FX combines Fund Management, CRM, Broker Connectivity, and AI Capabilities into one system, producing Clarity, Performance, and Trust for traders.",
  "what is xoxo fx's tagline": "XOXO FX's tagline is 'Smart Trading. Better Future.'",
  "what is the official website": "Official website: www.xoxofx.com",
  "what markets does xoxo fx trade": "XOXO FX trades across 5 asset classes: Crypto, Forex, Stocks, Indices, and Commodities.",
  "how does xoxo fx combine fund management crm and ai": "XOXO FX unifies Fund Management, CRM, Broker Connectivity, and AI Capabilities into a single ecosystem — enabling professionals to work smarter with more clarity, performance, and trust.",

  // ---------- AI BOTS ----------
  "which ai bots are available": "7 AI trading bots:\n• Sonic Scalper AI — +131.56% APR, 78.4% win, min $50\n• Sonic Forex AI — +126% APR, 72.1% win, min $500\n• Phantom Stealth AI — +123.59% APR, 65.3% win, min $2,000\n• Pip Sniper AI — +149.05% APR, 58.9% win, min $5,000\n• Gold Rush Pro — +120% APR, 61.2% win, min $5,000\n• Aurum Mind AI — +124.54% APR, 69.8% win, min $5,000\n• Mario Momentum AI — +142.03% APR, 70.5% win, min $5,000",
  "sonic scalper ai apr and win rate": "Sonic Scalper AI: +131.56% APR, 78.4% win rate, min investment $50–499, 12,840 traders. Ultra-fast scalping engine using RSI & MACD confluence.",
  "sonic forex ai minimum investment": "Sonic Forex AI minimum investment is $500–1,999. APR +126%, win rate 72.1%, 5,620 traders. AI-driven trend-follower with adaptive neural network pattern recognition.",
  "what is phantom stealth ai used for": "Phantom Stealth AI is a stealth grid trading bot designed for sideways market conditions. APR +123.59%, win rate 65.3%, min investment $2,000–4,999.",
  "pip sniper ai performance": "Pip Sniper AI: +149.05% APR (highest of all bots), 58.9% win rate, min investment $5,000+. Precision pip-hunting bot targeting micro breakout price movements.",
  "what is gold rush pro designed for": "Gold Rush Pro is a specialized gold and commodity trading AI with macroeconomic insights. APR +120%, win rate 61.2%, min investment $5,000+.",
  "aurum mind ai win rate": "Aurum Mind AI win rate is 69.8%. APR +124.54%, min investment $5,000+. It's a psychologically-calibrated AI mimicking expert trader decision-making.",
  "mario momentum ai apr": "Mario Momentum AI APR is +142.03%, win rate 70.5%, min investment $5,000+. A momentum bot conquering market levels one pip at a time with Fibonacci mastery.",
  "best performing bot": "Top 3 by APR:\n1. Pip Sniper AI — +149.05%\n2. Mario Momentum AI — +142.03%\n3. Sonic Scalper AI — +131.56%\nAverage APR: 133.54% | Avg win rate: 68.7%",
  "which bot has the lowest minimum investment": "Sonic Scalper AI has the lowest minimum investment at just $50.",
  "average apr across all bots": "Average APR across all 7 bots is 133.54%, with an average win rate of 68.7%.",
  "how many total active traders": "As of May 2024, XOXO FX has 30,429 active traders across 7 AI bots.",
  "how many ai bots are active": "XOXO FX currently has 7 active AI trading bots.",

  // ---------- INVESTMENT PACKAGES ----------
  "what are the investment packages": "4 AI Bot Packages:\n• BO StartX — $50–$499, 6% daily\n• BO TitanX — $500–$1,999, 7% daily\n• BO QuantumX — $2,000–$4,999, 8% daily\n• BO MegaBullX — $5,000+, 10% daily\n💡 $2,000 in QuantumX unlocks all 30 levels instantly.",
  "what is bo startx": "BO StartX: $50–$499 investment range, 6% projected daily return, linked to Sonic Scalper AI.",
  "what is bo titanx": "BO TitanX: $500–$1,999 investment range, 7% projected daily return, linked to Sonic Forex AI.",
  "what is bo quantumx": "BO QuantumX: $2,000–$4,999 investment range, 8% projected daily return, linked to Phantom Stealth AI. Starting with $2,000 unlocks all 30 levels instantly.",
  "what is bo megabullx": "BO MegaBullX: $5,000+ investment range, 10% projected daily return, linked to Pip Sniper AI.",
  "minimum investment": "Minimum investment is $50 (BO StartX). Invest $2,000+ in BO QuantumX to unlock all 30 leadership levels instantly.",
  "how much to unlock all 30 levels instantly": "Investing a minimum of $2,000 in BO QuantumX unlocks all 30 leadership levels instantly.",
  "self investment 2x working 3x limit": "Platform limit: Self Investment is capped at 2X, and Working income is capped at 3X of the invested amount.",

  // ---------- REFERRAL & INCOME PLANS ----------
  "how does referral income work": "3 income engines:\n1. Power Boost — 3 directs = 3% boost (max 40% at 30 referrals)\n2. Direct Income — 5% on every direct except first 2\n3. Leadership Recurring — 30 levels (L1:10%, L2:5%, L3:4%, L4:3%, L5:2%, L6-30:1%)",
  "what is power boost rewards": "Power Boost Rewards: every 3 direct referrals add a 3% boost to trading income, scaling up to a maximum of 40% at 30 referrals.",
  "how many referrals for 40 percent boost": "30 direct referrals give the maximum Power Boost of 40% on trading income (note: platform text also shows the boost chart topping at 30% for 30 referrals, so check current terms).",
  "what is direct income": "Direct Income: you earn 5% on every direct referral's investment, except for your first 2 directs (A & B), which generate no direct income themselves.",
  "why don't the first 2 directs earn income": "The first 2 directs (A & B) are your root pairing legs used for Pair Volume Bonus and Single Leg Spill — direct income of 5% starts from your 3rd direct onward.",
  "what is leadership recurring income": "Leadership Recurring Income pays across 30 levels: L1: 10%, L2: 5%, L3: 4%, L4: 3%, L5: 2%, L6–L30: 1% each — maximum distribution capped at 50% of ROI.",
  "how many levels does leadership plan cover": "The Leadership Recurring Income plan covers 30 levels total.",
  "level 1 income percentage": "Level 1 Leadership Recurring Income is 10%, and requires 1 direct referral to qualify.",
  "maximum distribution cap for leadership": "The maximum distribution cap for Leadership Recurring Income is 50% of ROI.",
  "what is pair volume bonus": "Pair Volume Bonus: 5% per matching pair (Team A & Team B). Bonus on lower volume. Max cap: 20%. Capping limit = package amount.",
  "maximum cap for pair volume bonus": "The maximum distribution cap for Pair Volume Bonus is 20%, with the capping limit equal to your package amount.",
  "what is single leg spill income": "Single Leg Spill: 5% at unlimited depth. After your first 2 directs, all downline A & B investments generate 5% income for you forever.",
  "does single leg spill have unlimited depth": "Yes — Single Leg Spill Income has unlimited depth. After your first 2 direct referrals, every A & B joining in their downline generates 5% income for you at any depth.",
  "what is the wealth multiplier framework": "The Wealth Multiplier Framework: your passive foundation (AI Bot performance) is scalable up to 2X, while leadership growth potential (network building & spillover) is scalable up to 3X.",

  // ---------- RANKS & MILESTONES ----------
  "what ranks are available": "7 ranks by business volume:\n1. Manager — $2,500\n2. Bronze — $5,000\n3. Silver — $15,000\n4. Gold — $30,000\n5. Ruby — $50,000\n6. Platinum — $100,000\n7. Diamond — $200,000",
  "business volume for manager rank": "Manager rank requires $2,500 in business volume.",
  "business volume for diamond rank": "Diamond rank requires $200,000 in business volume — the highest of the 7 ranks.",
  "what are the milestone rewards": "Milestone rewards:\n• Visionary Elite $2,500 → $100\n• Titan Circle $5,000 → $250\n• Royal Apex $10,000 → $500 or Thailand Tour\n• Legacy Crown $25,000 → $1,000 or Dubai Tour\n• Diamond Sovereign $50,000 → $2,000\n• Infinity Leader $100,000 → $4,000\n• Empire Master $200,000 → $10,000\n• Prestige Titan $500,000 → $25,000\n• Global Pioneer $1M → $50,000\n• Supreme Ambassador $2M → $100,000",
  "visionary elite milestone reward": "Visionary Elite: achieve $2,500 matching business volume to earn a $100 reward.",
  "titan circle milestone reward": "Titan Circle: achieve $5,000 matching business volume to earn a $250 reward.",
  "royal apex reward": "Royal Apex: achieve $10,000 matching business volume to earn $500 cash or a Thailand Luxury Tour.",
  "legacy crown reward": "Legacy Crown: achieve $25,000 matching business volume to earn $1,000 cash or a Dubai Luxury Tour.",
  "diamond sovereign reward": "Diamond Sovereign: achieve $50,000 matching business volume to earn a $2,000 reward.",
  "infinity leader reward": "Infinity Leader: achieve $100,000 matching business volume to earn a $4,000 leadership reward.",
  "empire master reward": "Empire Master: achieve $200,000 matching business volume to earn a $10,000 reward.",
  "prestige titan reward": "Prestige Titan: achieve $500,000 matching business volume to earn a $25,000 reward.",
  "global pioneer reward": "Global Pioneer: achieve $1,000,000 matching business volume to earn a $50,000 reward.",
  "supreme ambassador reward": "Supreme Ambassador: achieve $2,000,000 matching business volume to earn a $100,000 reward — the highest milestone.",

  // ---------- WITHDRAWAL & RISK ----------
  "how does withdrawal work": "Withdrawal: 2% processing fee. Capital remains yours. Fast, secure & transparent system.",
  "withdrawal processing fee": "The withdrawal processing fee is 2%. Your capital remains yours.",
  "does capital remain mine": "Yes — your capital remains yours even after investing; only a 2% withdrawal processing fee applies.",
  "what is risk management": "Risk management:\n1. Stop-Loss — strict entry/exit boundaries\n2. Position Sizing — algorithmic allocation\n3. Drawdown Control — auto pause in extreme volatility\n4. Portfolio Risk Limits — hard caps per asset class",
  "what is stop loss structure": "Stop-Loss Structures use strict entry-exit boundaries to contain downside risk.",
  "what is position sizing": "Position Sizing uses algorithmic allocation based on portfolio weight to manage risk.",
  "what is drawdown control": "Drawdown Control automatically pauses trading during extreme market volatility.",
  "what are portfolio risk limits": "Portfolio Risk Limits set hard caps on exposure per asset class.",

  // ---------- MARKET COMPARISON ----------
  "crypto vs forex": "Crypto: trillion-dollar blockchain, 24/7, high volatility.\nForex: $9.5T daily liquidity, tight spreads, macro-driven.",
  "daily liquidity of forex market": "The forex market mentioned has $9.5 trillion in daily liquidity, with tight spreads and macro-driven trading.",
  "how many traders": "May 2024: 30,429 active traders, 7 bots, avg APR 133.54%, avg win rate 68.7%.",
  "website": "Official website: www.xoxofx.com",
};

const QUICK = [
  { label: "What is XOXO FX?", q: "what is xoxo fx" },
  { label: "AI bots?", q: "which ai bots are available" },
  { label: "Packages?", q: "what are the investment packages" },
  { label: "Referral income?", q: "how does referral income work" },
  { label: "Ranks?", q: "what ranks are available" },
  { label: "Rewards?", q: "what are the milestone rewards" },
  { label: "Pair bonus?", q: "what is pair volume bonus" },
  { label: "Withdrawal?", q: "how does withdrawal work" },
];

function findAnswer(input) {
  const q = input.toLowerCase().trim();
  if (KB[q]) return KB[q];
  for (const k in KB) {
    if (q.includes(k) || k.includes(q)) return KB[k];
  }
  const words = q.split(" ").filter((w) => w.length > 3);
  for (const k in KB) {
    if (words.some((w) => k.includes(w))) return KB[k];
  }
  if (q.includes("bot") || q.includes("sonic") || q.includes("mario") || q.includes("pip") || q.includes("phantom") || q.includes("gold rush") || q.includes("aurum")) return KB["which ai bots are available"];
  if (q.includes("package") || q.includes("startx") || q.includes("titanx") || q.includes("quantum") || q.includes("megabull")) return KB["what are the investment packages"];
  if (q.includes("invest") || q.includes("minimum") || q.includes("plan")) return KB["what are the investment packages"];
  if (q.includes("rank") || q.includes("manager") || q.includes("bronze") || q.includes("diamond")) return KB["what ranks are available"];
  if (q.includes("reward") || q.includes("milestone") || q.includes("visionary") || q.includes("titan circle") || q.includes("apex") || q.includes("crown") || q.includes("sovereign") || q.includes("ambassador") || q.includes("pioneer")) return KB["what are the milestone rewards"];
  if (q.includes("withdraw")) return KB["how does withdrawal work"];
  if (q.includes("referral") || q.includes("income") || q.includes("direct") || q.includes("boost")) return KB["how does referral income work"];
  if (q.includes("pair")) return KB["what is pair volume bonus"];
  if (q.includes("risk") || q.includes("stop loss") || q.includes("drawdown")) return KB["what is risk management"];
  if (q.includes("crypto") || q.includes("forex")) return KB["crypto vs forex"];
  if (q.includes("spill") || q.includes("single")) return KB["what is single leg spill income"];
  if (q.includes("trader") || q.includes("total") || q.includes("apr")) return KB["how many traders"];
  if (q.includes("site") || q.includes("web") || q.includes("link")) return KB["website"];
  if (q.includes("founder") || q.includes("chris luther") || q.includes("director")) return KB["who founded xoxo fx"];
  if (q.includes("ecosystem") || q.includes("thesis")) return KB["what is the unified ecosystem thesis"];
  return "Try asking about:\n• AI bots & performance\n• Investment packages\n• Referral & income plans\n• Ranks & rewards\n• Withdrawal info";
}

// Dark mode theme with #0b1a24 background
const C = {
  // Main background
  bgBase: "#0b1a24",
  bg1: "#0f1f2a",
  bg2: "#132430",
  bg3: "#172a36",
  bg4: "#1b303d",
  bgCard: "rgba(11, 26, 36, 0.85)",
  bgCard2: "rgba(11, 26, 36, 0.65)",
  bgHover: "rgba(34, 232, 212, 0.06)",
  
  // Borders
  border: "rgba(140, 180, 200, 0.14)",
  border2: "rgba(34, 232, 212, 0.28)",
  border3: "rgba(203, 164, 99, 0.28)",
  
  // Text
  text1: "#eef3f8",
  text2: "#8ea0b5",
  text3: "#5c6c80",
  text4: "#3d4d60",
  
  // Shadows & Glows
  shadow: "rgba(0, 0, 0, 0.6)",
  glowC: "rgba(34, 232, 212, 0.12)",
  glowP: "rgba(203, 164, 99, 0.1)",
  
  // Glass effects
  glass: "rgba(255, 255, 255, 0.025)",
  glass2: "rgba(255, 255, 255, 0.06)",
  sidebarBg: "rgba(11, 26, 36, 0.97)",
  inputBg: "rgba(255, 255, 255, 0.04)",
  
  // Accent colors
  primary: "#22E8D4",
  primaryLight: "rgba(34, 232, 212, 0.12)",
  primaryBorder: "rgba(34, 232, 212, 0.28)",
  secondary: "#CBA463",
  secondaryLight: "rgba(203, 164, 99, 0.12)",
  secondaryBorder: "rgba(203, 164, 99, 0.28)",
  
  // User & Bot messages
  userBg: "#22E8D4",
  userText: "#0b1a24",
  botBg: "rgba(255, 255, 255, 0.06)",
  botBorder: "rgba(140, 180, 200, 0.14)",
  
  // Status
  statusBg: "rgba(34, 232, 212, 0.12)",
  statusText: "#22E8D4",
  statusBorder: "rgba(34, 232, 212, 0.28)",
  
  // Quick buttons
  quickBtnBg: "rgba(203, 164, 99, 0.12)",
  quickBtnBorder: "rgba(203, 164, 99, 0.28)",
  quickBtnText: "#CBA463",
  quickBtnHoverBg: "rgba(34, 232, 212, 0.12)",
  quickBtnHoverBorder: "rgba(34, 232, 212, 0.28)",
  quickBtnHoverText: "#22E8D4",
  
  // Input
  inputBorder: "rgba(140, 180, 200, 0.2)",
  inputBg: "rgba(255, 255, 255, 0.04)",
  
  // Send button
  sendBtnBg: "#22E8D4",
  sendBtnText: "#0b1a24",
  
  // Container
  containerBg: "#0b1a24",
  containerBorder: "rgba(140, 180, 200, 0.14)",
  msgsBg: "#0f1f2a",
  headerBg: "rgba(11, 26, 36, 0.97)",
  
  // Typing indicator
  typingBg: "rgba(255, 255, 255, 0.06)",
  typingBorder: "rgba(140, 180, 200, 0.14)",
  dotBg: "#5c6c80",
};

const LIGHT_C = {
  ...C,
  bgBase: "#f7fbfc",
  shadow: "rgba(18, 38, 58, 0.12)",
  text1: "#12263a",
  text2: "#647785",
  text3: "#8a9ba7",
  primary: "#0e9c98",
  secondary: "#07dbc7",
  primaryLight: "rgba(24, 199, 194, 0.12)",
  primaryBorder: "rgba(24, 199, 194, 0.38)",
  statusBg: "rgba(24, 199, 194, 0.1)",
  statusText: "#0e716e",
  statusBorder: "rgba(14, 156, 152, 0.38)",
  botBg: "#ffffff",
  botBorder: "#ddebec",
  userBg: "#18c7c2",
  userText: "#12263a",
  typingBg: "#ffffff",
  typingBorder: "#ddebec",
  quickBtnBg: "rgba(184, 134, 42, 0.1)",
  quickBtnBorder: "rgba(184, 134, 42, 0.38)",
  quickBtnText: "#8a6212",
  quickBtnHoverBg: "rgba(24, 199, 194, 0.1)",
  quickBtnHoverBorder: "rgba(14, 156, 152, 0.38)",
  quickBtnHoverText: "#0e716e",
  inputBorder: "#ddebec",
  inputBg: "#ffffff",
  sendBtnBg: "#18c7c2",
  sendBtnText: "#12263a",
  containerBg: "#f7fbfc",
  containerBorder: "#ddebec",
  msgsBg: "#eef6f7",
  headerBg: "#ffffff",
  dotBg: "#8a9ba7",
};

export default function XoxoFxChatbot() {
  const { isDark } = useTheme();
  const colors = isDark ? C : LIGHT_C;
  const [messages, setMessages] = useState([
    { role: "bot", text: "Namaste! Ask me anything about XOXO FX — bots, packages, income plans, ranks, or rewards!" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const ask = (q) => {
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { role: "bot", text: findAnswer(q) }]);
    }, 600);
  };

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    ask(q);
  };

  return (
    <div className="xoxo-fx-assistant-card" style={{
      display: "flex",
      flexDirection: "column",
      height: "520px",
      borderRadius: 16,
      border: `1px solid ${colors.containerBorder}`,
      overflow: "hidden",
      background: colors.containerBg,
      fontFamily: "inherit",
      boxShadow: `0 4px 24px ${colors.shadow}`,
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: "10px 14px",
        background: colors.headerBg,
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text1, lineHeight: 1.2 }}>🧠 AI Companion</div>
            <div style={{ fontSize: 10, color: colors.text2 }}>XOXO FX Assistant</div>
          </div>
        </div>
        <div style={{
          fontSize: 10,
          color: colors.statusText,
          background: colors.statusBg,
          padding: "3px 10px",
          borderRadius: 6,
          border: `1px solid ${colors.statusBorder}`,
          fontWeight: 700,
        }}>ONLINE</div>
      </div>

      {/* Messages */}
      <div ref={msgsRef} style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px 12px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: colors.msgsBg,
        minHeight: 0,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            alignItems: "flex-start",
            gap: 6,
          }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              flexShrink: 0,
              background: msg.role === "bot" ? colors.primary : colors.secondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: 700,
              color: colors.bgBase,
            }}>
              {msg.role === "bot" ? "XF" : "U"}
            </div>
            <div style={{
              maxWidth: "76%",
              padding: "8px 11px",
              borderRadius: 10,
              fontSize: 11,
              lineHeight: 1.6,
              whiteSpace: "pre-line",
              background: msg.role === "bot" ? colors.botBg : colors.userBg,
              color: msg.role === "bot" ? colors.text1 : colors.userText,
              border: msg.role === "bot" ? `1px solid ${colors.botBorder}` : "none",
              borderTopLeftRadius: msg.role === "bot" ? 3 : 10,
              borderTopRightRadius: msg.role === "user" ? 3 : 10,
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              flexShrink: 0,
              background: colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: 700,
              color: colors.bgBase,
            }}>XF</div>
            <div style={{
              padding: "9px 13px",
              borderRadius: 10,
              borderTopLeftRadius: 3,
              background: colors.typingBg,
              border: `1px solid ${colors.typingBorder}`,
              display: "flex",
              gap: 4,
              alignItems: "center",
            }}>
              {[0, 1, 2].map((d) => (
                <span key={d} style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: colors.dotBg,
                  display: "inline-block",
                  animation: `xfBlink 1.2s ${d * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Buttons */}
      <div style={{
        flexShrink: 0,
        padding: "7px 10px",
        background: colors.headerBg,
        borderTop: `1px solid ${colors.border}`,
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
      }}>
        {QUICK.map((q) => (
          <button
            key={q.q}
            onClick={() => ask(q.q)}
            style={{
              background: colors.quickBtnBg,
              border: `1px solid ${colors.quickBtnBorder}`,
              padding: "3px 9px",
              borderRadius: 6,
              fontSize: 10,
              cursor: "pointer",
              color: colors.quickBtnText,
              fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.quickBtnHoverBg;
              e.currentTarget.style.borderColor = colors.quickBtnHoverBorder;
              e.currentTarget.style.color = colors.quickBtnHoverText;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.quickBtnBg;
              e.currentTarget.style.borderColor = colors.quickBtnBorder;
              e.currentTarget.style.color = colors.quickBtnText;
            }}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0,
        padding: "8px 10px",
        background: colors.headerBg,
        borderTop: `1px solid ${colors.border}`,
        display: "flex",
        gap: 6,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about XOXO FX..."
          style={{
            flex: 1,
            fontSize: 11,
            padding: "6px 11px",
            borderRadius: 8,
            border: `1px solid ${colors.inputBorder}`,
            background: colors.inputBg,
            color: colors.text1,
            outline: "none",
          }}
        />
        <button
          onClick={send}
          style={{
            padding: "6px 14px",
            background: colors.sendBtnBg,
            color: colors.sendBtnText,
            border: "none",
            borderRadius: 8,
            fontSize: 11,
            cursor: "pointer",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </div>

      <style>{`
        .xoxo-fx-assistant-card,
        .xoxo-fx-assistant-card * {
          transition: background 0.35s ease, color 0.35s ease,
            border-color 0.35s ease, box-shadow 0.35s ease;
        }
        @keyframes xfBlink {
          0%, 80%, 100% { opacity: 0.25; }
          40% { opacity: 1; }
        }
        /* Custom scrollbar for dark mode */
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(140, 180, 200, 0.2);
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(140, 180, 200, 0.3);
        }
        input::placeholder {
          color: ${colors.text3};
        }
      `}</style>
    </div>
  );
}