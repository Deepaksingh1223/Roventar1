 
'use client'
import { useState, useEffect } from 'react'

export default function IncomeCards() {
  const [packageAmount, setPackageAmount] = useState(null)
  const [isLinked, setIsLinked] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    TradingVolume: 0,
    AverageProfit: 0,
    NoofTrade: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardData = async (userId) => {
    
    if (!userId) {
      setLoading(false)
      return
    }
    
    try {
      const url = `https://apis.arbionai.com/api/Authentication/userDashboardDetails?URID=${userId}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Important: Add this if CORS is blocking
        mode: 'cors',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.statusCode === 200 && result.data && result.data[0]) {
        const data = result.data[0]
        setDashboardData({
          TradingVolume: data.TradingVolume || 0,
          AverageProfit: data.AverageProfit || 0,
          NoofTrade: data.NoofTrade || 0
        })
        
        if (data.Package) {
          setPackageAmount(data.Package)
          localStorage.setItem('botPackage', data.Package.toString())
        }
      } 
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if bot is linked and get package amount
    const linked = localStorage.getItem('isLinked') === 'true'
    const botPackage = localStorage.getItem('botPackage')
    const packageFromVerify = localStorage.getItem('lastVerifiedPackage')
    
    setIsLinked(linked)
    
    if (botPackage) {
      setPackageAmount(parseFloat(botPackage))
    } else if (packageFromVerify) {
      setPackageAmount(parseFloat(packageFromVerify))
    }
    
    // Get UserData from localStorage
    const userDataString = localStorage.getItem('userData')// Debug log
    
    if (userDataString) {
      try {
        const parsedUserData = JSON.parse(userDataString)
// Debug log
        
        if (parsedUserData.UserId) {
          fetchDashboardData(parsedUserData.UserId)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error parsing UserData:', error)
        setError('Failed to parse user data')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
    
    // Listen for storage changes
    const handleStorageChange = () => {
      const updatedLinked = localStorage.getItem('isLinked') === 'true'
      const updatedPackage = localStorage.getItem('botPackage') || localStorage.getItem('lastVerifiedPackage')
      
      setIsLinked(updatedLinked)
      if (updatedPackage) {
        setPackageAmount(parseFloat(updatedPackage))
      }
      
      const updatedUserData = localStorage.getItem('UserData')
      if (updatedUserData) {
        try {
          const parsedUserData = JSON.parse(updatedUserData)
          if (parsedUserData.UserId) {
            fetchDashboardData(parsedUserData.UserId)
          }
        } catch (error) {
          console.error('Error parsing updated UserData:', error)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Show error if any
  if (error) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-4 lg:grid-cols-4">
        <div className="col-span-4 p-4 text-center text-red-500 bg-red-500/10 rounded-xl">
          Error: {error} - Check console for details
        </div>
      </div>
    )
  }

  const cards = [
    {
      label: 'Package',
      value: packageAmount ? `$${packageAmount.toFixed(2)}` : '$0.00',
      
      color: '#a78bfa',
      bg: 'rgba(124,58,237,0.08)',
      border: 'rgba(124,58,237,0.15)',
      shadow: '0 4px 20px rgba(124,58,237,0.08)',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-5 h-5">
          <circle cx="7" cy="5.5" r="3"/><circle cx="14" cy="6.5" r="2.5"/>
          <path d="M1 17c0-2.8 2.7-5 6-5s6 2.2 6 5" strokeLinecap="round"/>
          <path d="M14 10.5c2 .4 3.5 2 3.5 4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Trading Volume',
      value: loading ? 'Loading...' : `$${dashboardData.TradingVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
     
      color: '#22d3ee',
      bg: 'rgba(6,182,212,0.08)',
      border: 'rgba(6,182,212,0.15)',
      shadow: '0 4px 20px rgba(6,182,212,0.08)',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="#22d3ee" strokeWidth="1.5" className="w-5 h-5">
          <polyline points="2,14 6,8 10,11 14,5 18,8"/>
          <path d="M14 3h4v4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: 'Average Profit',
      value: loading ? 'Loading...' : `$${dashboardData.AverageProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      
      color: '#22d3ee',
      bg: 'rgba(6,182,212,0.08)',
      border: 'rgba(6,182,212,0.15)',
      shadow: '0 4px 20px rgba(6,182,212,0.08)',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="#22d3ee" strokeWidth="1.5" className="w-5 h-5">
          <path d="M2 12L6 8L9 11L14 5L18 9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 3H18V7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: 'No of Trade',
      value: loading ? 'Loading...' : dashboardData.NoofTrade.toString(),
      
      color: '#22d3ee',
      bg: 'rgba(6,182,212,0.08)',
      border: 'rgba(6,182,212,0.15)',
      shadow: '0 4px 20px rgba(6,182,212,0.08)',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="#22d3ee" strokeWidth="1.5" className="w-5 h-5">
          <rect x="2" y="8" width="4" height="10" rx="1"/>
          <rect x="8" y="5" width="4" height="13" rx="1"/>
          <rect x="14" y="2" width="4" height="16" rx="1"/>
        </svg>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 border rounded-xl animate-pulse" style={{ background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.1)' }}>
            <div className="w-8 h-8 mb-3 rounded-lg bg-gray-700/30"></div>
            <div className="w-16 h-3 mb-1 rounded bg-gray-700/30"></div>
            <div className="w-24 h-6 mb-2 rounded bg-gray-700/30"></div>
            <div className="w-20 h-4 rounded bg-gray-700/30"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 mb-4 lg:grid-cols-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="rounded-xl p-4 border transition-transform hover:-translate-y-0.5"
          style={{ background: card.bg, borderColor: card.border, boxShadow: card.shadow }}
        >
          <div className="flex items-center justify-center w-8 h-8 mb-3 rounded-lg" style={{ background: card.bg }}>
            {card.icon}
          </div>
          <div className="text-[11px] font-semibold mb-1" style={{ color: card.color }}>{card.label}</div>
          <div className="mb-2 font-mono text-xl font-black" style={{ color: card.color }}>{card.value}</div>
         
        </div>
      ))}
    </div>
  )
}