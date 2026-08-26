 

"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Chart from 'chart.js/auto';
import TradingViewHeatMap from "../../components/TradingViewHeatMap";

const openExplorer = (chain, hash) => {
  const chainLower = chain?.toLowerCase() || '';


  if (chainLower.includes('avax')) {
    window.open(`https://snowtrace.io/tx/${hash}`, '_blank');
    return;
  }

  const explorers = {
    sol: `https://solscan.io/tx/${hash}`,
    bsc: `https://bscscan.com/tx/${hash}`,
    eth: `https://etherscan.io/tx/${hash}`,
  };

  let normalizedChain = 'eth';
  if (chainLower.includes('sol')) normalizedChain = 'sol';
  else if (chainLower.includes('bsc')) normalizedChain = 'bsc';
  else if (chainLower.includes('eth')) normalizedChain = 'eth';

  const url = explorers[normalizedChain];
  if (url) window.open(url, '_blank');
};
const truncateHash = (hash, maxLength = 20) => {
  if (!hash) return '';
  if (hash.length <= maxLength) return hash;
  return `${hash.slice(0, maxLength - 3)}...`;
};

// Animated Counter Component
const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      const duration = 800;
      const steps = 30;
      const stepTime = duration / steps;
      const startValue = prevValueRef.current;
      const endValue = value;
      const diff = endValue - startValue;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const newValue = startValue + (diff * progress);
        setDisplayValue(newValue);
        
        if (currentStep >= steps) {
          setDisplayValue(endValue);
          clearInterval(interval);
        }
      }, stepTime);

      prevValueRef.current = value;
      return () => clearInterval(interval);
    }
  }, [value]);

  const formattedValue = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.floor(displayValue).toLocaleString();

  return <span>{prefix}{formattedValue}{suffix}</span>;
};

export default function ArbionEngine() {
  const scanChartRef = useRef(null);
  const chartInstances = useRef([]);
  const [botChecked, setBotChecked] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState('MEV Sandwich');
  const [slippage, setSlippage] = useState(0.5);
  const [minProfit, setMinProfit] = useState(5);
  const [maxGas, setMaxGas] = useState(50);
  const [userId, setUserId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // Stats values
  // const [oppsPerMin, setOppsPerMin] = useState(52);
  // const [executionsToday, setExecutionsToday] = useState(418094);
  // const [averageSpread, setAverageSpread] = useState(0.44);
  const [totalProfit, setTotalProfit] = useState(2483921.52);
const [totalTransactions, setTotalTransactions] = useState(1248932);
const [successRate, setSuccessRate] = useState(99.96);
  
  const [loading, setLoading] = useState(true);
  const [scanData, setScanData] = useState([]);
  const [flashEffect, setFlashEffect] = useState({
  profit:false,
  tx:false,
  success:false
});
  const [updateCounter, setUpdateCounter] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(120);

  const intervalRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Get UserId from localStorage
  useEffect(() => {
    let userDataString = localStorage.getItem('userData');
    if (!userDataString) {
      userDataString = localStorage.getItem('UserData');
    }

    if (userDataString) {
      try {
        const parsedUserData = JSON.parse(userDataString);
        const id = parsedUserData.UserId || parsedUserData.userId || parsedUserData.URID;
        setUserId(id);
      } catch (error) {
        console.error('Error parsing UserData:', error);
      }
    }
  }, []);

  // Function to generate random value within range
  const getRandomValue = (currentValue, minChange, maxChange, isPercentage = false) => {
    const changePercent = (Math.random() * (maxChange - minChange) + minChange) / 100;
    let newValue;
    
    if (isPercentage) {
      newValue = currentValue + (Math.random() * 2 - 1) * changePercent * 10;
      newValue = Math.min(5, Math.max(0.1, newValue));
    } else {
      const change = currentValue * changePercent;
      newValue = currentValue + (Math.random() * 2 - 1) * change;
      newValue = Math.max(40, Math.min(500, newValue));
    }
    
    return parseFloat(newValue.toFixed(2));
  };

  // Function to update stats - NO DEPENDENCIES
  const updateStatsRandomly = useCallback(() => {
    if (!isMounted.current) return;
    
    setTotalProfit(prev =>
  +(prev + (Math.random() * 500 + 50)).toFixed(2)
);

setTotalTransactions(prev =>
  prev + Math.floor(Math.random() * 20) + 5
);

setSuccessRate(prev => {
  let value = prev + (Math.random() * 0.02 - 0.01);

  if (value > 99.99) value = 99.99;
  if (value < 99.90) value = 99.90;

  return +value.toFixed(2);
});
    
    setFlashEffect({ opps: true, spread: true, execs: true });
    setTimeout(() => {
      if (isMounted.current) setFlashEffect({ opps: false, spread: false, execs: false });
    }, 500);
  }, []); // EMPTY DEPENDENCY - KEY FIX!

  // Countdown timer
  useEffect(() => {
    countdownIntervalRef.current = setInterval(() => {
      if (isMounted.current) {
        setSecondsLeft(prev => prev <= 1 ? 120 : prev - 1);
      }
    }, 1000);
    return () => clearInterval(countdownIntervalRef.current);
  }, []);

 
  useEffect(() => {
    updateStatsRandomly(); // Initial update
    statsIntervalRef.current = setInterval(updateStatsRandomly, 120000);
    return () => clearInterval(statsIntervalRef.current);
  }, [updateStatsRandomly]);

  // Fetch ABR Engine data
  const fetchABREngineData = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`https://apis.arbionai.com/api/Authentication/getABREngine?URID=${userId}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-cache'
      });
      const result = await response.json();
      if (result.statusCode === 200 && result.data?.[0] && isMounted.current) {
        const data = result.data[0];
        if (data.oppsMin > 0) setOppsPerMin(data.oppsMin);
        if (data.ExcessToday > 0) setExecutionsToday(data.ExcessToday);
        if (data.AverageSpread > 0) setAverageSpread(data.AverageSpread);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, [userId]);


const fetchTransactionLog = useCallback(async () => {
  try {
    const response = await fetch('https://apis.arbionai.com/api/Authentication/getAllTransactionLog_xoxo', {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-cache'
    });
    const result = await response.json();
    
    if (result.statusCode === 200 && result.data?.length > 0 && isMounted.current) {
      const formattedTx = result.data.map(tx => {
        const date = new Date(tx.Datex);
        let chainDisplay = tx.NetworkChain || 'Unknown';
        if (chainDisplay.toLowerCase().includes('sol')) chainDisplay = 'SOL';
        else if (chainDisplay.toLowerCase().includes('bsc')) chainDisplay = 'BSC';
        else if (chainDisplay.toLowerCase().includes('eth')) chainDisplay = 'ETH';
           else if (chainDisplay.toLowerCase().includes('avax') || chainDisplay.toLowerCase().includes('avalanche')) chainDisplay = 'AVAX';
        
        return {
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          chain: chainDisplay,
          hash: tx.TransactionHash,
          profit: `+$${tx.Amount?.toFixed(2) || '0.00'}`,
          timestamp: date.getTime(),
        };
      });
      
   
      const shuffleArray = (arr) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };
      
      
      const shuffledTransactions = shuffleArray(formattedTx);
      
      setTransactions(shuffledTransactions.slice(0, 50));
      setScanData(prev => [...prev.slice(-29), { value: Math.random() * 100 + 20, timestamp: Date.now() }]);
     
      setFlashEffect(prev => ({ ...prev, execs: true }));
      setTimeout(() => {
        if (isMounted.current) setFlashEffect(prev => ({ ...prev, execs: false }));
      }, 300);
      
    }
  } catch (error) {
    console.error('Error:', error);
  }
}, []);

  // Initial data fetch
  useEffect(() => {
    fetchTransactionLog();
    if (userId) fetchABREngineData();
    intervalRef.current = setInterval(() => fetchTransactionLog(), 5000);
    return () => clearInterval(intervalRef.current);
  }, [userId, fetchABREngineData, fetchTransactionLog]);

  // Generate initial scanner data
  useEffect(() => {
    const initialData = Array.from({ length: 30 }, (_, i) => ({
      value: Math.random() * 100 + 20,
      timestamp: Date.now() - (30 - i) * 1000
    }));
    setScanData(initialData);
    
    const activityInterval = setInterval(() => {
      setScanData(prev => [...prev.slice(-29), { value: Math.random() * 100 + 20, timestamp: Date.now() }]);
    }, 2000);
    return () => clearInterval(activityInterval);
  }, []);

  // Update Chart
  useEffect(() => {
    if (scanChartRef.current && scanData.length > 0) {
      chartInstances.current.forEach(chart => chart.destroy());
      chartInstances.current = [];
      const chart = new Chart(scanChartRef.current, {
        type: 'line',
        data: {
          labels: scanData.map((_, i) => `${i}s`),
          datasets: [{
            data: scanData.map(p => p.value),
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } }
        }
      });
      chartInstances.current.push(chart);
    }
  }, [scanData]);

  // Loading timeout
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const toggleBot = (e) => setBotChecked(e.target.checked);
  const pickStrategy = (name) => setSelectedStrategy(name);
  const handleSlippageChange = (e) => setSlippage(parseFloat(e.target.value));
  const applySettings = () => alert(`Settings applied:\nMax slippage: ${slippage}%\nMin profit: $${minProfit}\nMax gas: ${maxGas} gwei\nStrategy: ${selectedStrategy}`);
   const getChainColor = (chain) => chain === 'SOL' ? 'sol' : chain === 'BSC' ? 'bsc' : chain === 'ETH' ? 'eth' : chain === 'AVAX' ? 'avax' : 'eth';
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) {
    return (
      <div className="page" id="p-engine">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
            <p className="text-gray-400">Loading Roventar Engine data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page" id="p-engine">
        <div className="grid-two-col">
          <div className="left-col">
            <div className="scard main-card">
              <div className="card-header">
                <div className="card-title-section">
                  <div className="card-title">Roventar Engine</div>
                  <div className="card-subtitle">
                    AI MEV + cross-chain arb · 24/7 autonomous — Auto-updates every 2 minutes
                  </div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={botChecked} onChange={toggleBot} />
                  <div className="toggle-track"></div>
                  <div className="toggle-thumb"></div>
                </label>
              </div>
              
              <div className="stats-grid">

  <div className={`scard stat-card ${flashEffect.profit ? "flash-update-slow" : ""}`}>
    <div className="stat-label">Total Profit</div>

    <div className="stat-value stat-value-primary">
      <AnimatedCounter
        value={totalProfit}
        prefix="$"
        decimals={2}
      />
    </div>

    <div className="stat-trend trending-up">
      <span className="live-dot-slow"></span>
      Real-time Earnings
    </div>
  </div>

  <div className={`scard stat-card ${flashEffect.tx ? "flash-update-slow" : ""}`}>
    <div className="stat-label">Total Transactions</div>

    <div className="stat-value stat-value-secondary">
      <AnimatedCounter
        value={totalTransactions}
      />
    </div>

    <div className="stat-trend trending-neutral">
      <span className="pulse-dot-slow"></span>
      Executed Trades
    </div>
  </div>

  <div className={`scard stat-card ${flashEffect.success ? "flash-update-slow" : ""}`}>
    <div className="stat-label">Success Rate</div>

    <div className="stat-value stat-value-tertiary">
      <AnimatedCounter
        value={successRate}
        decimals={2}
        suffix="%"
      />
    </div>

    <div className="stat-trend trending-up">
      <span className="live-dot-slow"></span>
      Stable Performance
    </div>
  </div>

</div>
              
             
              
              <div className="section-header">
                <div className="section-title">Live TX Stream</div>
                <span className="tag tag-live">● LIVE</span>
              </div>
              <div className="transactions-list">
                {transactions.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 py-8">Waiting for transactions...</div>
                ) : (
                  transactions.map((tx, idx) => (
                    <div key={`${tx.hash}-${idx}`} className="tx-item" onClick={() => openExplorer(tx.chain, tx.hash)} style={{ cursor: 'pointer' }}>
                      <div>
                        <span className={`tag ${getChainColor(tx.chain)}`}>{tx.chain}</span>
                        <span className="ml">{truncateHash(tx.hash, 20)}</span>
                      </div>
                      <div className="ml" style={{ color: '#10b981', fontWeight: 600 }}>{tx.profit}</div>
                      <div className="ml" style={{ fontSize: '11px', color: '#64748b' }}>{tx.time}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="scard scanner-card">
              <div className="section-header">
                <div className="section-title">Scanner Activity</div>
                <span className="tag tag-real">Real-time</span>
              </div>
              <div className="scanner-container">
                <div className="scanner-line"></div>
                <div className="chart-wrapper">
                  <canvas ref={scanChartRef}></canvas>
                </div>
              </div>
            </div>
          </div>
          
          <div className="right-col"  style={{
    background: "#F8F6FF",
    borderRadius: "20px",
    padding: "12px",
    overflow: "hidden",
  }}
>
            <TradingViewHeatMap />
          </div>
        </div>
      </div>

      <style jsx>{`
        .stat-label { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .stat-trend { font-size: 10px; margin-top: 8px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
        .trending-up { color: #10b981; }
        .trending-neutral { color: #f59e0b; }
        .update-timer { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 12px; padding: 10px 14px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(124, 58, 237, 0.08)); border-radius: 10px; font-size: 12px; border: 1px solid rgba(6, 182, 212, 0.15); }
        .timer-icon { font-size: 14px; }
        .timer-text { font-weight: 500; color: #94a3b8; }
        .countdown-number { color: #06b6d4; font-weight: bold; font-size: 14px; background: rgba(6, 182, 212, 0.15); padding: 2px 8px; border-radius: 6px; margin-left: 6px; }
        .update-badge { font-size: 10px; background: rgba(124, 58, 237, 0.2); color: #a78bfa; padding: 3px 8px; border-radius: 12px; font-weight: 600; }
        .live-dot-slow { display: inline-block; width: 6px; height: 6px; background-color: #10b981; border-radius: 50%; animation: blink-slow 2s infinite; }
        .pulse-dot-slow { display: inline-block; width: 6px; height: 6px; background-color: #f59e0b; border-radius: 50%; animation: pulse-slow 2s infinite; }
        .flash-update-slow { animation: flash-slow 0.5s ease-in-out; }
        @keyframes blink-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes pulse-slow { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes flash-slow { 0% { background-color: rgba(6, 182, 212, 0); } 30% { background-color: rgba(6, 182, 212, 0.12); } 70% { background-color: rgba(6, 182, 212, 0.06); } 100% { background-color: rgba(6, 182, 212, 0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </>
  );
}