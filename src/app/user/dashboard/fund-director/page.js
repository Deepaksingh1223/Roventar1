"use client";
import { useState, useEffect } from "react";
import { fundDirectorTabs } from "@/app/constants/funddirector.js";
import SelfDeposit from "./self-deposit/page";
import FundRequest from "./fund-request/page";
import InstantTransfer from "./instant-transfer/page";
import UserTransfer from "./user-transfer/page";
import WithDrawal from "./with-drawal/page";
import { usePathname } from "next/navigation";

export default function FundDirector() {
  const [activeTab, setActiveTab] = useState("deposit");

  function getPName(pathname) {
    if (!pathname) return "";
    const parts = pathname.split("/");
    let last = parts[parts.length - 1] || parts[parts.length - 2];
    return last
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const pathname = usePathname();
  const pageName = getPName(pathname);

  return (
    <>
      <div className="tabs-container">
        <div className="tabs mb-0">
        {fundDirectorTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn  ${activeTab === tab.id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
  </div>
        {activeTab === "deposit" && <SelfDeposit />}
        {/* {activeTab === "fundRequest" && <FundRequest />} */}
        {activeTab === "instant" && <InstantTransfer />}
        {activeTab === "userTransfer" && <UserTransfer />}
        {activeTab === "withdraw" && <WithDrawal />}
       
    </>
  );
}