"use client";
import { useState, useEffect } from "react";
import { fundDirectorTabs } from "@/app/constants/funddirector.js";
import Reward from "./reward/page";
import Achievement from "./achievement/page";
import { usePathname } from "next/navigation";

export default function MyRewards() {
  const [activeTab, setActiveTab] = useState("myRewards");

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

 const RewardsTab = [
  { img: "https://imagedelivery.net/nq9qT5FHZv9Sg48UUnD1-A/bd85e7b8-c7c1-4ab2-10fa-2893f5027900/public", id: "myRewards", label: "My Rewards" },
  { img: "https://imagedelivery.net/nq9qT5FHZv9Sg48UUnD1-A/bd85e7b8-c7c1-4ab2-10fa-2893f5027900/public", id: "rankAchievement", label: "Rank Achievements" },
];

  return (
    <>
      <div className="tabs-container">
        <div className="tabs mb-0">
        {RewardsTab.map((tab) => (
          <button
            key={tab.statusCode}
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
        {activeTab === "myRewards" && <Reward />}
        
        {activeTab === "rankAchievement" && <Achievement />}
       

    </>
  );
}