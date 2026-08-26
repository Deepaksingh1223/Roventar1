 

"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { getRequestWithToken } from '@/app/api/auth';
import { getUserId } from '@/app/api/auth';

export default function ArbionEngine() {
  const pnlChartRef = useRef(null);
  const dailyChartRef = useRef(null);
  const chainChartRef = useRef(null);
  const chartInstances = useRef([]);

  const [tradeHistory, setTradeHistory] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [tradeError, setTradeError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Derive chart data from trade history
  const chartData = useMemo(() => {
    if (!tradeHistory || tradeHistory.length === 0) {
      return {
        pnlData: Array.from({ length: 90 }, (_, i) => i * 91.57),
        dailyData: Array.from({ length: 30 }, () => Math.floor(60 + Math.random() * 280)),
        chainData: { solana: 52, ethereum: 31, bsc: 17 }
      };
    }

    // Sort trades by date
    const sortedTrades = [...tradeHistory].sort((a, b) => {
      return new Date(a.TradeDate) - new Date(b.TradeDate);
    });

    // Calculate cumulative PnL for PnL Curve
    const pnlData = [];
    let cumulative = 0;
    const recentTrades = sortedTrades.slice(-90);
    recentTrades.forEach((trade) => {
      const profit = parseFloat(trade.Profit) || 0;
      cumulative += profit;
      pnlData.push(cumulative);
    });

    // Pad with initial value if less than 90
    while (pnlData.length < 90) {
      pnlData.unshift(pnlData[0] || 0);
    }

    // Daily profits
    const dailyData = [];
    const last30Days = sortedTrades.slice(-30);
    last30Days.forEach((trade) => {
      const profit = parseFloat(trade.Profit) || 0;
      dailyData.push(profit);
    });

    while (dailyData.length < 30) {
      dailyData.push(0);
    }

    // Chain distribution
    const chainDistribution = { Solana: 0, Ethereum: 0, BSC: 0 };
    sortedTrades.forEach((trade) => {
      const market = trade.Market || '';
      if (market.toLowerCase().includes('solana')) {
        chainDistribution.Solana += Math.abs(parseFloat(trade.Profit)) || 0;
      } else if (market.toLowerCase().includes('ethereum') || market.toLowerCase().includes('eth')) {
        chainDistribution.Ethereum += Math.abs(parseFloat(trade.Profit)) || 0;
      } else if (market.toLowerCase().includes('bsc') || market.toLowerCase().includes('binance')) {
        chainDistribution.BSC += Math.abs(parseFloat(trade.Profit)) || 0;
      }
    });

    const totalChain = chainDistribution.Solana + chainDistribution.Ethereum + chainDistribution.BSC || 1;
    const chainPercentages = {
      solana: Math.round((chainDistribution.Solana / totalChain) * 100),
      ethereum: Math.round((chainDistribution.Ethereum / totalChain) * 100),
      bsc: Math.round((chainDistribution.BSC / totalChain) * 100)
    };

    // Ensure total is 100%
    const total = chainPercentages.solana + chainPercentages.ethereum + chainPercentages.bsc;
    if (total !== 100 && total > 0) {
      const diff = 100 - total;
      chainPercentages.solana += diff;
    }

    return {
      pnlData: pnlData.slice(-90),
      dailyData: dailyData.slice(-30),
      chainData: chainPercentages
    };
  }, [tradeHistory]);

  // Total PnL for tag
  const totalPnL = useMemo(() => {
    if (!tradeHistory || tradeHistory.length === 0) return 8241;
    return tradeHistory.reduce((sum, trade) => sum + (parseFloat(trade.Profit) || 0), 0);
  }, [tradeHistory]);

  useEffect(() => {
    chartInstances.current.forEach(chart => chart.destroy());
    chartInstances.current = [];

    if (pnlChartRef.current && chartData.pnlData) {
      const chart = new Chart(pnlChartRef.current, {
        type: 'line',
        data: {
          labels: Array.from({ length: chartData.pnlData.length }, (_, i) => `Day ${i + 1}`),
          datasets: [{
            label: 'PnL',
            data: chartData.pnlData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
      chartInstances.current.push(chart);
    }

    if (dailyChartRef.current && chartData.dailyData) {
      const chart = new Chart(dailyChartRef.current, {
        type: 'bar',
        data: {
          labels: Array.from({ length: chartData.dailyData.length }, (_, i) => `Day ${i + 1}`),
          datasets: [{
            label: 'Daily Profit',
            data: chartData.dailyData,
            backgroundColor: 'rgba(139, 92, 246, 0.7)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
      chartInstances.current.push(chart);
    }

    if (chainChartRef.current && chartData.chainData) {
      const chart = new Chart(chainChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Solana', 'Ethereum', 'BSC'],
          datasets: [{
            data: [chartData.chainData.solana, chartData.chainData.ethereum, chartData.chainData.bsc],
            backgroundColor: ['#9945ff', '#627eea', '#f3ba2f'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: 'var(--t2)', font: { size: 11 } } } }
        }
      });
      chartInstances.current.push(chart);
    }

    return () => {
      chartInstances.current.forEach(chart => chart.destroy());
      chartInstances.current = [];
    };
  }, [chartData]);

  const showToast = (title, message) => alert(`${title}: ${message}`);

  const AITradingPerformance = tradeHistory?.[0]?.AITradingPerformance;
  const AIExecutedTrades = tradeHistory?.[0]?.AIExecutedTrades;
  const PortfolioGrowth = tradeHistory?.[0]?.PortfolioGrowth;
  const AverageDailyReturn = tradeHistory?.[0]?.AverageDailyReturn;

  const urid = useMemo(() => {
    try { return getUserId(); } catch { return null; }
  }, []);

  const formatDate = (value) => {
    if (!value) return { date: '-', time: '' };
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { date: String(value), time: '' };
    return {
      date: d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    };
  };

  const marketClass = (market) => {
    const m = (market || '').toLowerCase();
    if (m.includes('forex')) return 'mkt-forex';
    if (m.includes('metal')) return 'mkt-metals';
    if (m.includes('crypto')) return 'mkt-crypto';
    if (m.includes('indic')) return 'mkt-indices';
    return 'mkt-default';
  };

  const downloadCSV = () => {
    const rows = tradeHistory || [];
    const headers = [
      'TradeDate', 'BotFollow', 'TradeAction', 'Market', 'AssetCode', 'AssetName',
      'AIAgent', 'EntryPrice', 'ExitPrice', 'Profit', 'Capital',
      'PortfolioValue', 'Status',
    ];
    const escapeCSV = (val) => {
      const s = val === null || val === undefined ? '' : String(val);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [
      headers.join(','),
      ...rows.map((t) => [
        t.TradeDate, t.BotFollow, t.TradeAction, t.Market, t.AssetCode, t.AssetName,
        t.AIAgent, t.EntryPrice, t.ExitPrice, t.Profit, t.Capital,
        t.PortfolioValue, t.Status,
      ].map(escapeCSV).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade_history.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchTrades = async () => {
      // if (!urid) { setTradeError('Missing URID'); return; }
      setLoadingTrades(true);
      setTradeError(null);
      try {
        const res = await getRequestWithToken(`/Authentication/getAgentAnalyticsUser`);
        if (cancelled) return;
        const candidates = [res?.data, res?.Data, res?.result, res?.Result, res?.trades, res?.tradeHistory, res];
        const list = candidates.find((x) => Array.isArray(x));
        setTradeHistory(list || []);
      } catch (e) {
        if (cancelled) return;
        setTradeError(e?.response?.data?.message || e?.message || 'Failed to load trade history');
      } finally {
        if (!cancelled) setLoadingTrades(false);
      }
    };
    fetchTrades();
    return () => { cancelled = true; };
  }, []);

  const totalPages = Math.max(1, Math.ceil((tradeHistory?.length || 0) / pageSize));
  const paginated = (tradeHistory || []).slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div id="p-analytics" className="page">
        <div className="g4">
          <div className="scard scc">
            <div className="ml">Portfolio Growth</div>
            <div className="mv" >${PortfolioGrowth}</div>
          </div>
          <div className="scard scc">
            <div className="ml">AI Trading Performance</div>
            <div className="mv">${AITradingPerformance}</div>

          </div>
          <div className="scard scc">
            <div className="ml">AI Executed Trades</div>
            <div className="mv">{AIExecutedTrades}</div>
         
          </div>
          <div className="scard scc">
            <div className="ml">Average Daily Return</div>
            <div className="mv" style={{ color: "var(--a)" }}>${AverageDailyReturn}</div>

          </div>
        </div>

        {/* CHARTS SECTION - Dynamic */}
        <div className="g2">
          <div className="scard scc">
            <div className="sh">
              <div className="st">PnL Curve · 90d</div>
              <span className="tag tg">+${totalPnL.toFixed(2)}</span>
            </div>
            <div className="cw" style={{ height: "210px" }}>
              <canvas ref={pnlChartRef} role="img" aria-label="90d PnL">
                Steady growth to $8,241 over 90 days.
              </canvas>
            </div>
          </div>

          <div className="scard scc">
            <div className="sh">
              <div className="st">Daily Profits · 30d</div>
            </div>
            <div className="cw" style={{ height: "210px" }}>
              <canvas ref={dailyChartRef} role="img" aria-label="Daily profits">
                Daily profits $60–$340.
              </canvas>
            </div>
          </div>
        </div>

        {/* Trade History */}
        <div className="scard scc th-wrap">
          <div className="th-head">
            <div>
              <div className="th-title">Trade History</div>
              <div className="th-sub">Detailed record of all AI trading activities and performance</div>
            </div>
            <div className="th-actions">
              <button
                type="button"
                className="th-btn th-btn-primary"
                onClick={() => {
                  if (!tradeHistory || tradeHistory.length === 0) {
                    showToast('Export CSV', 'No data to export');
                    return;
                  }
                  downloadCSV();
                }}
              >
                Export CSV ↓
              </button>
            </div>
          </div>

          <div className="tw">
            <table className="th-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>AI Agent</th>
                  <th>Market</th>
                  <th>Asset / Pair</th>
                  <th>Action</th>
                  <th>PnL %</th>
                  <th>Profit</th>
                  <th>Portfolio Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingTrades ? (
                  <tr><td colSpan={10} className="th-empty">Loading trade history…</td></tr>
                ) : tradeError ? (
                  <tr><td colSpan={10} className="th-empty th-error">{String(tradeError)}</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={10} className="th-empty">No trade history found.</td></tr>
                ) : (
                  paginated.map((t, idx) => {
                    const profit = t?.Profit ?? t?.profit ?? 0;
                    const isProfit = Number(profit) >= 0;
                    const action = (t?.TradeAction || '').toUpperCase();
                    const agentName = t?.AIAgent;
                    const botFollow = t?.BotFollow;
                    const capital = t?.Capital;
                    const { date } = formatDate(t?.TradeDate);

                    return (
                      <tr key={t?.TradeId || t?.TradeDate || idx}>
                        <td>
                          <div className="th-date">{date}</div>
                          <div className="th-time">${capital}</div>
                        </td>
                        <td>
                          <div className="th-agent">
                            <span className="th-avatar">{agentName?.charAt(0) || 'A'}</span>
                            <div>
                              <div className="th-agent-name">{agentName}</div>
                              <div className="th-agent-sub">{botFollow}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`th-pill ${marketClass(t?.Market)}`}>{t?.Market || '-'}</span>
                        </td>
                        <td>
                          <div className="th-asset-code">{t?.AssetCode || t?.Pair || '-'}</div>
                          <div className="th-asset-name">{t?.AssetName || ''}</div>
                        </td>
                        <td>
                          <span className={`th-action ${action === 'SELL' ? 'th-sell' : 'th-buy'}`}>
                            {action || '-'}
                          </span>
                        </td>
                        <td className="th-mono">{t?.PNL ?? '-'}%</td>
                        <td className={isProfit ? 'th-up' : 'th-down'}>
                          {isProfit ? '+' : ''}${profit}
                        </td>
                        <td className="th-mono">{t?.PortfolioValue ?? '-'}</td>
                        <td>
                          <span className={`th-status ${(t?.Status || 'Closed').toLowerCase()}`}>
                            {t?.Status || 'Closed'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="th-footer">
            <div className="th-count">
              Showing {(tradeHistory?.length || 0) === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, tradeHistory?.length || 0)} of {tradeHistory?.length || 0} trades
            </div>
            <div className="th-pagination">
              <button
                className="th-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(0, 3)
                .map((n) => (
                  <button
                    key={n}
                    className={`th-page-btn ${page === n ? 'active' : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
              {totalPages > 3 && <span className="th-page-dots">…</span>}
              <button
                className="th-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .th-full {
          display: block !important;
          width: 100%;
        }

        .th-wrap {
          width: 100%;
          box-sizing: border-box;
        }

        .tw {
          width: 100%;
          overflow-x: auto;
        }

        .th-table {
          width: 100%;
          table-layout: auto;
          border-radius: 12px;
        }
        .th-wrap {
          padding: 20px 22px 16px;
        }
        .th-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .th-title {
          font-size: 18px;
          font-weight: 600;
          color: #00000;
        }
        .th-sub {
          font-size: 12px;
          color: var(--t2, #8a8f98);
          margin-top: 2px;
        }
        .th-actions {
          display: flex;
          gap: 8px;
        }
        .th-btn {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: var(--t1, #fff);
          font-size: 12px;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .th-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .th-btn-primary {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.3);
          color: #c4b5fd;
        }
        .tw {
          overflow-x: auto;
        }
        .th-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }
        .th-table thead th {
          text-align: left;
          padding: 10px 12px;
          color: var(--t2, #8a8f98);
          font-weight: 500;
          font-size: 11px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          white-space: nowrap;
        }
        .th-table tbody td {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: var(--t1, #e5e7eb);
          vertical-align: middle;
          white-space: nowrap;
        }
        .th-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .th-date {
          font-weight: 500;
          color: var(--t2, #8a8f98);
        }
        .th-time {
          font-size: 11px;
          color: var(--t2, #8a8f98);
          font-family: var(--mono, monospace);
        }
        .th-agent {
          display: flex;
          align-items: center;
          color: var(--t2, #8a8f98);
          gap: 8px;
        }
        .th-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:linear-gradient(135deg, #03bdad, #00BCD4);
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .th-agent-name {
          font-weight: 500;
          font-size: 12.5px;
        }
        .th-agent-sub {
          font-size: 10.5px;
          color: var(--t2, #8a8f98);
        }
        .th-pill {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 6px;
          font-weight: 500;
        }
        .mkt-forex { background:#8b5cf626; color: #3500ff; }
        .mkt-metals { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .mkt-crypto { background: rgba(59, 130, 246, 0.15); color: #93c5fd; }
        .mkt-indices { background: rgba(20, 184, 166, 0.15); color: #5eead4; }
        .mkt-default { background: rgba(255, 255, 255, 0.06); color: var(--t2, #8a8f98); }
        .th-asset-code {
          font-weight: 500;
          color: var(--t2, #8a8f98);
        }
        .th-asset-name {
          font-size: 10.5px;
          color: var(--t2, #8a8f98);
        }
        .th-action {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .th-buy { background: rgba(16, 185, 129, 0.15); color: #34d399 !important; }
        .th-sell { background: rgba(239, 68, 68, 0.15); color: #f87171 !important; }
        .th-mono {
          font-family: var(--mono, monospace);
          color: var(--t2, rgb(2, 2, 2)) !important;
        }
        .th-up { color: #34d399 !important; }
        .th-down { color: #f87171 !important; }
        .th-status {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          text-transform: capitalize;
        }
        .th-empty {
          text-align: center;
          padding: 24px;
          color: var(--t2, #8a8f98);
        }
        .th-error {
          color: #f87171;
        }
        .th-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .th-count {
          font-size: 12px;
          color: var(--t2, #8a8f98);
        }
        .th-pagination {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .th-page-btn {
          min-width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: var(--t2, #8a8f98);
          font-size: 12px;
          cursor: pointer;
        }
        .th-page-btn.active {
          background: #8b5cf6;
          border-color: #8b5cf6;
        }
        .th-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .th-page-dots {
          color: var(--t2, #8a8f98);
          font-size: 12px;
        }

        /* Chart styles */
        .g2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .scard {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 16px;
        }

        .scc {
          background: rgba(255, 255, 255, 0.03);
        }

        .sh {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .st {
          font-size: 14px;
          font-weight: 500;
          color: #00000;
        }

        .tag {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 500;
        }

        .tg {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }

        .cw {
          position: relative;
          width: 100%;
        }

        @media (max-width: 768px) {
          .g2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}