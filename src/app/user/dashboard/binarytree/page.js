"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { AuthLogin } from "@/app/api/auth";
import { createPortal } from "react-dom";

// ─── Helper to build tree from flat API data ────────────────────────────────//
const buildTreeFromApi = (apiNodes) => {
  if (!apiNodes || !Array.isArray(apiNodes) || apiNodes.length === 0) {
    return null;
  }

  // keep all nodes including empty slots
  const allNodes = apiNodes;

  const nodeMap = new Map();

  // ─── Create Node Map ──────────────────────────────────────────────────────
  allNodes.forEach((apiNode) => {

    // detect color from API image path
    const colorPath = apiNode.binarycolorimg || "";

    const isGreen = colorPath.includes("green");
    const isRed = colorPath.includes("red");
    const isGrey = colorPath.includes("grey");

    nodeMap.set(apiNode.id, {
      mapId: apiNode.id,

      id: apiNode.AuthLogin || `EMPTY`,
      username: apiNode.Name || "Available Slot",

      // ACTIVE STATUS FROM IMAGE
      active: isGreen,

      // color type
      nodeColor: isGreen
        ? "green"
        : isRed
          ? "red"
          : "grey",

      binaryColor: colorPath,

      position: apiNode.Position || "",
      level: apiNode.level || 0,

      leftBV: Number(apiNode.LeftBussiness || 0),
      rightBV: Number(apiNode.RighttBussiness || 0),

      leftActive: Number(apiNode.LeftActiveMember || 0),
      rightActive: Number(apiNode.RightActiveMember || 0),

      carryForward: Number(apiNode.CarryForwardBussiness || 0),

      actDate: apiNode.ActDate || "",
      sponsor: apiNode.SponosorDetails || "",
      package: Number(apiNode.Package || 0),

      urid: apiNode.URID,

      buttonLink: apiNode.ButtonLink || "",

      isExists: apiNode.IsExists,
      isEmpty: apiNode.IsExists === 0,

      left: null,
      right: null,
    });
  });

  // ─── Find Root ────────────────────────────────────────────────────────────
  const rootApi = allNodes.find((n) => n.level === 0);

  if (!rootApi) {
    console.error("Root node not found");
    return null;
  }

  // ─── Attach Children Using Binary Heap Logic ─────────────────────────────
  allNodes.forEach((apiNode) => {
    if (apiNode.id === rootApi.id) return;

    const currentNode = nodeMap.get(apiNode.id);

    // parent formula
    const parentId = Math.floor(apiNode.id / 2);

    const parentNode = nodeMap.get(parentId);

    if (!parentNode || !currentNode) return;

    if (apiNode.Position === "L") {
      parentNode.left = currentNode;
    }

    if (apiNode.Position === "R") {
      parentNode.right = currentNode;
    }
  });

  return nodeMap.get(rootApi.id);
};

// ─── Count Active Nodes ─────────────────────────────────────────────
const countActiveNodes = (node) => {
  if (!node) return 0;

  let count = node.active ? 1 : 0;

  return (
    count +
    countActiveNodes(node.left) +
    countActiveNodes(node.right)
  );
};


// ─── Tooltip Component ──────────────────────────────────────────────────────
function Tooltip({ node, x, y }) {
  return (
    <div
      style={{
        position: "fixed",
        left: x + 16,
        top: Math.max(y - 10, 20),
        zIndex: 9999,
        pointerEvents: "none",
        transform: "translateY(-50%)",
      }}
    >
      <div className="bt-tooltip-card">
        <div className="bt-tt-header">
          <span
            className={`bt-tt-dot ${node.active ? "bt-tt-dot--active" : "bt-tt-dot--inactive"
              }`}
          />
          <span className="bt-tt-id">{node.id}</span>
        </div>
        <div className="bt-tt-name">{node.username}</div>
        <div className="bt-tt-divider" />
        <div className="bt-tt-grid">
          <div className="bt-tt-item">
            <span className="bt-tt-label">LEFT BUSS.</span>
            <span className="bt-tt-val bt-tt-val--green">
              ${node.leftBV.toLocaleString()}
            </span>
          </div>
          <div className="bt-tt-item">
            <span className="bt-tt-label">RIGHT BUSS.</span>
            <span className="bt-tt-val bt-tt-val--cyan">
              ${node.rightBV.toLocaleString()}
            </span>
          </div>
          <div className="bt-tt-item">
            <span className="bt-tt-label">LEFT ACTIVE</span>
            <span className="bt-tt-val bt-tt-val--green">
              {node.leftActive}
            </span>
          </div>
          <div className="bt-tt-item">
            <span className="bt-tt-label">RIGHT ACTIVE</span>
            <span className="bt-tt-val bt-tt-val--cyan">
              {node.rightActive}
            </span>
          </div>
          <div className="bt-tt-item">
            <span className="bt-tt-label">C/F BUSS.</span>
            <span className="bt-tt-val bt-tt-val--amber">
              ${node.carryForward.toLocaleString()}
            </span>
          </div>
          <div className="bt-tt-sub-item">
            <span className="bt-tt-label">SPONSOR</span>
            <span className="bt-tt-sub-val">{node.sponsor || "—"}</span>
          </div>
        </div>
        <div className="bt-tt-divider" />
        <div className="bt-tt-sub-grid">

          <div className="bt-tt-sub-item">
            <span className="bt-tt-label">PACKAGE</span>
            <span className="bt-tt-sub-val">${node.package}</span>
          </div>
          <div className="bt-tt-item">
            <span className="bt-tt-label">ACT. DATE</span>
            <span className="bt-tt-val">{node.actDate}</span>
          </div>

        </div>
        {(node.left || node.right) && (
          <>
            <div className="bt-tt-divider" />
            <div className="bt-tt-sub-grid">
              <div className="bt-tt-sub-item">
                <span className="bt-tt-label">LEFT ID</span>
                <span className="bt-tt-sub-val">
                  {node.left ? node.left.id : "—"}
                </span>
              </div>
              <div className="bt-tt-sub-item">
                <span className="bt-tt-label">RIGHT ID</span>
                <span className="bt-tt-sub-val">
                  {node.right ? node.right.id : "—"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Node Component ───────────────────────────────────────────────────────────
function TreeNode({ node, onTooltip, onHideTooltip, onSignup, onFocus, depth, isRoot = false }) {
  const [hovered, setHovered] = useState(false);
  const nodeRef = useRef(null);

  const handleMouseEnter = (e) => {
    if (node.isEmpty && !isRoot) return;
    setHovered(true);
    onTooltip(node, e.clientX, e.clientY);
  };
  const handleMouseMove = (e) => {
    if (node.isEmpty && !isRoot) return;

    onTooltip(node, e.clientX, e.clientY);
  };
  const handleMouseLeave = () => {
    setHovered(false);
    onHideTooltip();
  };

  const color = node.active ? "var(--brand-green)" : "var(--brand-red)";

  return (
    <div className="bt-node-wrapper">
      <div
        ref={nodeRef}
        className={`bt-tree-node ${hovered ? "bt-tree-node--hovered" : ""} ${node.active ? "bt-tree-node--active" : "bt-tree-node--inactive"
          }`}
        style={{
          "--bt-node-color": color,
          "--bt-ring-color": node.active ? color : "var(--brand-red)",
          position: "relative",
          zIndex: 20,
          pointerEvents: "auto",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onFocus(node)}
      >
        <div className="bt-node-avatar">
          <div className="bt-node-avatar-ring" />
          <div className="bt-node-avatar-inner">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="10" r="7" fill={color} opacity="0.9" />
              <path
                d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12"
                stroke={color}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div
            className={`bt-node-status-dot ${node.active ? "bt-node-status-dot--active" : "bt-node-status-dot--inactive"
              }`}
          />
        </div>
        <div className="bt-node-id">{node.id}</div>
      </div>

      <div className="bt-node-children">

        {/* LEFT */}
        {node.left ? (
          node.left.isEmpty ? (
            <EmptySlot
              side="left"
              parentId={node.id}
              onSignup={onSignup}
            />
          ) : (
            <TreeNode
              node={node.left}
              onTooltip={onTooltip}
              onHideTooltip={onHideTooltip}
              onSignup={onSignup}
              onFocus={onFocus}
              depth={depth + 1}
            />
          )
        ) : (
          depth < 3 && (
            <EmptySlot
              side="left"
              parentId={node.id}
              onSignup={onSignup}
            />
          )
        )}

        {/* RIGHT */}
        {node.right ? (
          node.right.isEmpty ? (
            <EmptySlot
              side="right"
              parentId={node.id}
              onSignup={onSignup}
            />
          ) : (
            <TreeNode
              node={node.right}
              onTooltip={onTooltip}
              onHideTooltip={onHideTooltip}
              onSignup={onSignup}
              onFocus={onFocus}
              depth={depth + 1}
            />
          )
        ) : (
          depth < 3 && (
            <EmptySlot
              side="right"
              parentId={node.id}
              onSignup={onSignup}
            />
          )
        )}
      </div>
    </div>
  );
}

// ─── Empty Slot ─────────────────────────────────────────────────────────────
function EmptySlot({ side, parentId, onSignup }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="bt-node-wrapper">
      <div
        className={`bt-empty-slot ${hov ? "bt-empty-slot--hovered" : ""}`}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => onSignup(parentId, side)}
      >
        <div className="bt-slot-inner">
          {hov ? (
            <div className="bt-slot-cta">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>{side.toUpperCase()} JOIN</span>
            </div>
          ) : (
            <div className="bt-slot-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span>Available</span>
            </div>
          )}
        </div>
        <div className="bt-slot-side-badge">{side[0].toUpperCase()}</div>
      </div>
    </div>
  );
}

// ─── Search Modal ───────────────────────────────────────────────────────────
function SearchModal({ onClose, onSearch }) {
  const [val, setVal] = useState("");
  return (
    <div className="bt-modal-overlay" onClick={onClose}>
      <div className="bt-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="bt-modal-title">Search User</div>
        <input
          className="bt-modal-input"
          placeholder="Enter User ID or Username..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(val)}
          autoFocus
        />
        <div className="bt-modal-actions">
          <button className="bt-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="bt-btn-primary" onClick={() => onSearch(val)}>
            Search
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Signup Modal ───────────────────────────────────────────────────────────
function SignupModal({ parentId, side, onClose }) {
  const positionCode = side === "left" ? "L" : "R";
  // Replace with your actual registration URL
  const link = `http://localhost:3000/user/register?ref=${parentId}&Position=${positionCode}`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(link).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bt-modal-overlay" onClick={onClose}>
      <div className="bt-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="bt-modal-title">
          <span className={`bt-side-badge bt-side-badge--${side}`}>
            {positionCode}
          </span>{" "}
          Signup Link
        </div>
        <div className="bt-modal-sub">
          Referral under <strong>{parentId}</strong>
        </div>
        <div className="bt-link-box">
          <span className="bt-link-text">{link}</span>
          <button
            className={`bt-copy-btn ${copied ? "bt-copy-btn--copied" : ""}`}
            onClick={copy}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <div className="bt-modal-actions">
          <button className="bt-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ──────────────────────────────────────────────────────────────
function StatsBar({ root }) {
  if (!root) return null;

  // Use API data: leftActive and rightActive
  const leftCount = root.leftActive;
  const rightCount = root.rightActive;

  // root active check
  const rootActive = root.active ? 1 : 0;

  // total active users
  const total = leftCount + rightCount + rootActive;

  const leftPct =
    total > 0
      ? Math.round((leftCount / total) * 100)
      : 50;

  return (
    <div className="bt-stats-bar">

      {/* LEFT */}
      <div className="bt-stat-card bt-stat-card--left">
        <div className="bt-stat-icon">◀</div>

        <div>
          <div className="bt-stat-label">
            LEFT USERS
          </div>

          <div className="bt-stat-num">
            {leftCount}
          </div>
        </div>
      </div>

      {/* CENTER */}
      <div className="bt-balance-wrap">

        <div className="bt-balance-label">
          TOTAL ACTIVE USERS : {total}
        </div>

        <div className="bt-balance-track">
          <div
            className="bt-balance-fill bt-balance-fill--left"
            style={{ width: `${leftPct}%` }}
          />

          <div
            className="bt-balance-fill bt-balance-fill--right"
            style={{ width: `${100 - leftPct}%` }}
          />
        </div>

        <div className="bt-balance-pcts">
          <span style={{ color: "var(--brand-green)" }}>
            Left: {leftCount}
          </span>

          <span style={{ color: "var(--brand-cyan)" }}>
            Right: {rightCount}
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="bt-stat-card bt-stat-card--right">
        <div>
          <div className="bt-stat-label">
            RIGHT USERS
          </div>

          <div className="bt-stat-num">
            {rightCount}
          </div>
        </div>

        <div className="bt-stat-icon">▶</div>
      </div>
    </div>
  );
}

// ─── Loading / Error ────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="bt-loading-container">
      <div className="bt-loading-spinner" />
      <div className="bt-loading-text">Loading tree data...</div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function BinaryTree() {
  const [tooltip, setTooltip] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [signupModal, setSignupModal] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [focusedNode, setFocusedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = AuthLogin();
  const token = Cookies.get("token");

  const fetchTreeByURID = async (userId, saveHistory = true) => {
    try {
      setLoading(true);
      setError(null);

      // current root history me save karo
      if (saveHistory && treeData?.id) {
        setHistory((prev) => [...prev, treeData.id]);
      }

      const response = await fetch(
        `https://app.xoxofx.com/api/Community/getdownLineTreeDetails?Loginid=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (
        result.statusCode === 200 &&
        result.data?.downLineTreeDetails
      ) {
        const builtTree = buildTreeFromApi(
          result.data.downLineTreeDetails
        );

        if (builtTree) {
          setTreeData(builtTree);
          setTooltip(null);
        } else {
          setError("Could not build tree");
        }
      } else {
        setError(result.message || "Failed to load tree");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Missing authentication. Please log in.");
      setLoading(false);
      return;
    }

    fetchTreeByURID(userId);
  }, [token, userId]);

  const handleTooltip = useCallback((node, x, y) => setTooltip({ node, x, y }), []);
  const handleHideTooltip = useCallback(() => setTooltip(null), []);
  const handleSignup = useCallback(
    (parentId, side) => setSignupModal({ parentId, side }),
    []
  );

  const handleFocus = useCallback(
    (node) => {
      if (!node?.id) return;

      fetchTreeByURID(node.id);
    },
    [token, treeData]
  );

  const handleSearch = useCallback(
    (query) => {
      if (!query.trim() || !treeData) return;
      const searchInTree = (node, term) => {
        if (!node) return null;
        if (
          node.id.toLowerCase().includes(term.toLowerCase()) ||
          node.username.toLowerCase().includes(term.toLowerCase())
        )
          return node;
        return searchInTree(node.left, term) || searchInTree(node.right, term);
      };
      const found = searchInTree(treeData, query);
      if (found) {
        setFocusedNode(found);
      } else {
        alert("User not found in tree");
      }
    },
    [treeData]
  );

  const displayRoot = treeData;

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="bt-error-container">Error: {error}</div>;
  if (!treeData)
    return <div className="bt-error-container">No tree data available</div>;

  return (
    <>
      <div className="bt-root">
        {/* Header */}
        <div className="bt-header">
          <div className="bt-header-left">
            <div className="bt-logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3L3 8.5V15.5L12 21L21 15.5V8.5L12 3Z"
                  stroke="var(--brand-cyan)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M12 3v18M3 8.5l9 6 9-6"
                  stroke="var(--brand-cyan)"
                  strokeWidth="1.2"
                  opacity="0.5"
                />
              </svg>
            </div>
            <span className="bt-logo-text">
              Tree<span className="bt-logo-accent">View</span>
            </span>
          </div>

          <div className="bt-header-center">
            <div className="bt-search-wrap">
              <input
                className="bt-search-input"
                placeholder="Search User ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    handleSearch(searchQuery);
                    setSearchQuery("");
                  }
                }}
              />
              <button
                className="bt-btn-search"
                onClick={() => {
                  if (searchQuery.trim()) {
                    handleSearch(searchQuery);
                    setSearchQuery("");
                  } else {
                    setSearchOpen(true);
                  }
                }}
              >
                Search
              </button>
            </div>
          </div>

          <div className="bt-header-right">
            {history.length > 0 && (
              <button
                className="bt-btn-back"
                onClick={async () => {
                  const prevHistory = [...history];
                  const lastId = prevHistory.pop();

                  setHistory(prevHistory);

                  if (lastId) {
                    await fetchTreeByURID(lastId, false);
                  }
                }}
              >
                ← Back
              </button>
            )}
            <div className="bt-legend">
              <span className="bt-legend-dot bt-legend-dot--active" /> Active
              <span
                className="bt-legend-dot bt-legend-dot--inactive"
                style={{ marginLeft: 12 }}
              />{" "}
              Inactive
            </div>
          </div>
        </div>

        {/* Stats */}
        <StatsBar root={displayRoot} />

        {/* Tree */}
        <div className="bt-tree-scroll">
          <div className="bt-tree-canvas">
            <TreeNode
              node={displayRoot}
              side="root"
              isRoot={true}
              onTooltip={handleTooltip}
              onHideTooltip={handleHideTooltip}
              onSignup={handleSignup}
              onFocus={handleFocus}
              depth={0}
            />
          </div>
        </div>

        {/* Tooltip */}
        {tooltip &&
          createPortal(
            <Tooltip
              node={tooltip.node}
              x={tooltip.x}
              y={tooltip.y}
            />,
            document.body
          )}

        {/* Modals */}
        {searchOpen && (
          <SearchModal
            onClose={() => setSearchOpen(false)}
            onSearch={(q) => {
              handleSearch(q);
              setSearchOpen(false);
            }}
          />
        )}
        {signupModal && (
          <SignupModal
            parentId={signupModal.parentId}
            side={signupModal.side}
            onClose={() => setSignupModal(null)}
          />
        )}
      </div>
    </>
  );
}