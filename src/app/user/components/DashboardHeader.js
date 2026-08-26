
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from 'next/navigation';
import {
  FiGrid,
  FiZap,
  FiBarChart2,
  FiCpu,
  FiRefreshCw,
  FiCreditCard,
  FiUsers,
  FiFileText,
  FiUser,
  FiSettings,
  FiX,
  FiChevronRight,
  FiTrendingUp,
  FiLogOut,
  FiAward ,
  FiBookOpen // Added for Fund Director icon
} from "react-icons/fi";
import { doUserLogout } from "@/app/api/auth";

export default function DashboardHeader({
  sidebarOpen,
  setSidebarOpen,
}) {

  const router = useRouter();
  const pathname = usePathname();

  // Close Sidebar Function
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleSignOut = () => {
    doUserLogout()
    router.push('/user/login');
  };

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <Image
          src="/LOG02.png"
          alt="Logo"
          width={200}
          height={60}
          priority
        />

        {/* Close Button */}
        <button className="close-sidebar-btn" onClick={closeSidebar}>
          <FiX />
        </button>
      </div>

      <div className="nb">
        <div className="nlbl">Platform</div>

        <Link href="/user/dashboard" className={"ni " + (pathname === '/user/dashboard' ? 'on' : '')}>
          <span className="ic">
            <FiGrid />
          </span>
          <span>Dashboard</span>
        </Link>
        <Link href="/user/dashboard/AI-Trading-Bots" className={"ni " + (pathname === '/user/dashboard/AI-Trading-Bots' ? 'on' : '')}>
          <span className="ic">
            <FiZap />
          </span>
          <span>AI Trading Bots</span>
          <span className="npip pg"></span>
        </Link>
        <Link href="/user/dashboard/engine" className={"ni " + (pathname === '/user/dashboard/engine' ? 'on' : '')}>
          <span className="ic">
            <FiZap />
          </span>
          <span>Roventar Engine</span>
          <span className="npip pg"></span>
        </Link>

        <Link href="/user/dashboard/analytics" className={"ni " + (pathname === '/user/dashboard/analytics' ? 'on' : '')}>
          <span className="ic">
            <FiBarChart2 />
          </span>
          <span>Analytics</span>
        </Link>

        {/* <Link href="/user/dashboard/simulate" className="ni">
          <span className="ic">
            <FiCpu />
          </span>
          <span>Simulate</span>
          <span className="nbadge">BETA</span>
        </Link> */}

        {/* <Link href="/user/dashboard/auto-trade" className="ni">
          <span className="ic">
            <FiRefreshCw />
          </span>
          <span>Auto-Trade</span>
          <span className="npip py"></span>
        </Link> */}

        {/* Fund Director Menu Item - Added here */}
        <Link href="/user/dashboard/fund-director" className={"ni " + (pathname === '/user/dashboard/fund-director' ? 'on' : '')}>
          <span className="ic">
            <FiTrendingUp />
          </span>
          <span>Fund Director</span>
        </Link>
        <Link href="/user/dashboard/Team" className={"ni " + (pathname === '/user/dashboard/Team' ? 'on' : '')}>
          <span className="ic">
            <FiUsers />
          </span>
          <span>Genealogy</span>
        </Link>
        {/* <Link href="/user/dashboard/lms" className={"ni " + (pathname === '/user/dashboard/lms' ? 'on' : '')}>
          <span className="ic">
            <FiBookOpen />
          </span>
          <span>Academy</span>
        </Link> */}
      </div>

      <div className="nb">
        <div className="nlbl">Finance</div>

        {/* <Link href="/user/dashboard/wallet" className="ni">
          <span className="ic">
            <FiCreditCard />
          </span>
          <span>Wallet</span>
        </Link> */}

        {/* <Link href="/user/dashboard/community" className="ni">
          <span className="ic">
          
          </span>
          <span>Community</span>
        </Link> */}
        <Link href="/user/dashboard/income-statement" className={"ni " + (pathname === '/user/dashboard/income-statement' ? 'on' : '')}>
          <span className="ic">
            <FiCreditCard />
          </span>
          <span>Income Statement</span>
        </Link>


        <Link href="/user/dashboard/wallet-statement" className={"ni " + (pathname === '/user/dashboard/wallet-statement' ? 'on' : '')}>
          <span className="ic">
            <FiFileText />
          </span>
          <span>Wallet Statement</span>
        </Link>

        <Link href="/user/dashboard/my-rewards" className={"ni " + (pathname === '/user/dashboard/my-rewards' ? 'on' : '')}>
          <span className="ic">
            <FiAward />
          </span>
          <span>Rank Progress</span>
        </Link>
         <Link href="/user/dashboard/ai-assistant" className={"ni " + (pathname === '/user/dashboard/ai-assistant' ? 'on' : '')}>
          <span className="ic">
            <FiCpu />
          </span>
          <span>AI Assistant Demo</span>
        </Link>
      </div>

      <div className="nb">
        <div className="nlbl">Account</div>

        <Link href="/user/dashboard/profile" className={"ni " + (pathname === '/user/dashboard/profile' ? 'on' : '')}>
          <span className="ic">
            <FiUser />
          </span>
          <span>Profile</span>
        </Link>
        <Link
          href="/user/login"
          onClick={doUserLogout}
          className="ni"
        >
          <span className="ic">
            <FiLogOut />
          </span>
          <span>Logout</span>
        </Link>
        {/* <div
          onClick={handleSignOut}
          className="ni"
          style={{
            cursor: 'pointer',
            background: 'rgba(220, 38, 38, 0.1)',
            color: '#ef4444',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
            e.currentTarget.style.border = '1px solid rgba(220, 38, 38, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
            e.currentTarget.style.border = '1px solid rgba(220, 38, 38, 0.2)';
          }}
        >
          <span className="ic">
            <FiLogOut />
          </span>
          <span>Sign Out</span>
        </div> */}

        {/* <Link href="/user/dashboard/settings" className="ni">
          <span className="ic">
            <FiSettings />
          </span>
          <span>Settings</span>
        </Link> */}
      </div>
      {/* 
      <div className="sb-bot">
        <div className="urow">
          <div className="uava">A</div>

          <div className="uinfo">
            <div className="uname">arbion123</div>
            <div className="ulvl">★ PRO TRADER · LV.12</div>
          </div>

          <div className="uarr">
            <FiChevronRight />
          </div>
        </div>

        <div className="chs">
          <div className="cp eth">ETH</div>
          <div className="cp sol">SOL</div>
          <div className="cp bsc">BSC</div>
        </div>
      </div> */}
    </aside>
  );
}