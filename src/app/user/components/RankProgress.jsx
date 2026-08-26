"use client";

import React from "react";

export default function RankProgress({
  totQualifyRnk = 0,
  total = 7,
  activeRank = "No Rank",
  description = "Welcome back to your Roventar ecosystem. Monitor your trading performance, team growth and reward progress from one place.",
  title = "Good Morning UserName",
}) {
  const pct = Math.min(100, Math.max(0, Math.round((totQualifyRnk / total) * 100)));

  const getRankImage = (rank) => {
    switch (rank?.toUpperCase()) {
      case "MANAGER":
        return "/Rank/1.png";

      case "BRONZE":
        return "/Rank/2.png";

      case "SILVER":
        return "/Rank/3.png";

      case "GOLD":
        return "/Rank/4.png";

      case "RUBY":
        return "/Rank/5.png";

      case "PLATINUM":
        return "/Rank/6.png";

      case "DIAMOND":
        return "/Rank/7.png";

      default:
        return "/Rank/default.png"; // agar koi aur rank aaye
    }
  };


  const ACCENT = "var(--brand-cyan, #14b8a6)";
  const ACCENT_2 = "var(--brand-cyan2, #0ea5a4)";

  const styles = {
    hero: {
      background:
        "linear-gradient(120deg, var(--bg-card, #ffffff) 0%, var(--bg-card, #ffffff) 45%, var(--bg-2, #f1fbfa) 100%)",
      border: "1px solid #ddebec",
      borderRadius: "1.5rem",
      overflow: "hidden",
      boxShadow: "0 1px 2px var(--shadow, rgba(16,40,60,0.04))",
      margin: "1rem 0",
      color: "var(--text-1)",
    },
    body: {
      padding: "2.5rem",
      position: "relative",
    },
    row: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "2rem",
    },
    left: {
      flex: "1 1 520px",
      minWidth: 0,
      position: "relative",
      zIndex: 2,
    },
    right: {
      flex: "1 1 320px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      zIndex: 2,
    },
    eyebrow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      color: ACCENT,
      fontSize: "11.5px",
      fontWeight: 700,
      letterSpacing: "1.6px",
      textTransform: "uppercase",
      marginBottom: "8px",
    },
    title: {
      color: "var(--text-1, #0f2942)",
      fontSize: "clamp(26px, 3.2vw, 36px)",
      fontWeight: 700,
      letterSpacing: "-0.6px",
      margin: "0 0 8px 0",
    },
    desc: {
      color: "var(--text-2, #7c8a97)",
      fontSize: "15px",
      lineHeight: 1.6,
      maxWidth: "480px",
      margin: "0 0 20px 0",
    },
    chipsRow: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "10px",
      marginBottom: "28px",
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "var(--bg-card2, #ffffff)",
      border: "1px solid var(--border, #e9edf1)",
      borderRadius: "999px",
      padding: "8px 16px 8px 8px",
      boxShadow: "0 1px 2px var(--shadow, rgba(16,40,60,0.03))",
      color: "var(--text-1, #16324f)",
      fontSize: "13px",
      fontWeight: 700,
      lineHeight: 1,
      whiteSpace: "nowrap",
    },
    chipCheck: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "22px",
      height: "22px",
      borderRadius: "999px",
      background: "var(--glow-c, #e6faf6)",
      flexShrink: 0,
    },
    progressSection: {
      maxWidth: "480px",
    },
    progressHead: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
    },
    progressLbl: {
      color: "var(--text-2, #8a97a4)",
      fontSize: "12.5px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.6px",
    },
    progressPct: {
      color: ACCENT,
      fontSize: "13px",
      fontWeight: 700,
    },
    progressTrack: {
      width: "100%",
      height: "8px",
      background: "var(--bg-3, #edf2f5)",
      borderRadius: "999px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      background: `linear-gradient(90deg, ${ACCENT_2}, ${ACCENT})`,
      borderRadius: "999px",
      transition: "width 0.5s ease",
      width: `${pct}%`,
    },
    infoNote: {
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
      maxWidth: "520px",
      marginTop: "18px",
      background: "var(--bg-hover, #f3fbfa)",
      border: "1px solid var(--border2, #e3f5f2)",
      borderRadius: "14px",
      padding: "14px 16px",
      color: "var(--text-2, #6f8290)",
      fontSize: "12.5px",
      lineHeight: 1.55,
    },
    artWrap: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "190px",
      width: "100%",
    },
    rankImg: {
      display: "none",
    },
  };

  return (
    <div className="rpc-hero card" style={styles.hero}>
      <div className="card-body">
        <div className="row align-items-center" style={styles.row}>
          {/* LEFT SIDE */}
          <div style={styles.left}>
            <div style={styles.eyebrow}>
        
              <div class="dx-avatar"><TrophyIcon /></div>
              <span>ROVENTAR ECOSYSTEM</span>
            </div>
            <h3 style={styles.title}>{title}</h3>
            <p style={styles.desc}>{description}</p>
            {/* PROGRESS */}
            <div style={styles.progressSection}>
              <div style={styles.progressHead}>
              </div>
            </div>

            <div className="mb-4">
              <div className=" flex-grow-1">
                <div className=" d-flex flex-wrap gap-2">
                  
                  <span className=" dx-badge-chip">Rank MANAGER</span>
                  <span className=" dx-badge-chip success">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="">
                      <polyline points="2,8 5.5,11.5 14,3.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" className="">
                      </polyline>
                      </svg>Trading Package Active</span>
                      <span className=" dx-badge-chip success">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="">
                      <polyline points="2,8 5.5,11.5 14,3.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" className="">
                        </polyline></svg>KYC Verified</span><span className=" dx-badge-chip success">
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="">
                        <polyline points="2,8 5.5,11.5 14,3.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                          className="jsx-9b7-seven c6１４３ｃ７０ｄ３ｄｆ"></polyline></svg>Account Active</span></div>
              </div></div>
          </div>

          {/* RIGHT SIDE */}

          <img
            src="/banner-img.png"
            alt={activeRank}
            className="Rank-img rpc-rankImg"
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Icons & decorative art ----------
   Every icon carries explicit width/height HTML attributes and
   inline styles so sizing never depends on external CSS loading.
   Stroke/fill colors reference the theme accent variable so they
   flip correctly in light/dark mode. */

const ICON_ACCENT = "var(--brand-cyan, #14b8a6)";

function ChartArt() {
  return (
    <svg
      viewBox="0 0 420 190"
      width="100%"
      height="100%"
      fill="none"
      style={{ opacity: 0.95, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <g stroke={ICON_ACCENT} strokeOpacity="0.35" strokeWidth="1">
        <circle cx="70" cy="48" r="34" />
        <circle cx="70" cy="48" r="3.5" fill={ICON_ACCENT} stroke="none" />
        <path d="M70 14v68M36 48h68M46 24l48 48M94 24l-48 48" />
      </g>
      <path
        d="M8 168 L78 122 L120 146 L182 88 L236 118 L300 62 L346 92 L406 28"
        stroke={ICON_ACCENT}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="406" cy="28" r="7" fill={ICON_ACCENT} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke={ICON_ACCENT}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function TrophyIcon() {
  return (
<svg
  viewBox="0 0 24 24"
  width="15"
  height="15"
  fill="none"
  stroke="#ffffff"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  style={{ display: "block", flexShrink: 0 }}
  aria-hidden="true"
>
  <path d="M8 21h8" />
  <path d="M12 17v4" />
  <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
  <path d="M17 5h2.5A1.5 1.5 0 0 1 21 6.5v0A3.5 3.5 0 0 1 17.5 10H17" />
  <path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5v0A3.5 3.5 0 0 0 6.5 10H7" />
</svg>
  );
}

function InfoIcon() {
  return (
    <img src="/banner-img.png" alt="Info" width="16" height="16" style={{ display: "block", flexShrink: 0 }} />
  );
}