import { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faSpinner,
  faCoins,
  faCheckCircle,
  faExclamationTriangle,
  faUser,
  faEnvelope,
  faCreditCard,
  faWallet,
  faShieldHalved,
  faCrown,
  faCalendarCheck,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { AdminApi } from "@storyteller/api";
import type { AdminUserInfo } from "@storyteller/api";
import Seo from "../../components/seo";

// ── Types ───────────────────────────────────────────────────────────────

interface AdjustmentResult {
  adjustment_id: string;
  new_balance: number;
  delta: number;
  created_at: string;
}

// ── Main Component ──────────────────────────────────────────────────────

const AdminSupport = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUserInfo | null>(null);

  // Adjustment state
  const [creditAmount, setCreditAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustResult, setAdjustResult] = useState<AdjustmentResult | null>(
    null,
  );

  // ── Handlers ────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);
    setUser(null);
    setAdjustResult(null);
    setAdjustError(null);
    setCreditAmount("");
    setAdjustmentReason("");
    setNotes("");

    const api = new AdminApi();
    const res = await api.GetAdminUser(q);

    setIsSearching(false);

    if (res.success && res.data) {
      setUser(res.data);
    } else {
      setSearchError(res.errorMessage || "User not found");
    }
  }, [searchQuery]);

  const handleAdjust = useCallback(async () => {
    if (!user) return;

    const delta = parseInt(creditAmount, 10);
    if (isNaN(delta) || delta <= 0) {
      setAdjustError("Amount must be a positive integer");
      return;
    }
    if (!adjustmentReason.trim()) {
      setAdjustError("Adjustment reason is required");
      return;
    }
    if (!notes.trim()) {
      setAdjustError("Notes are required");
      return;
    }

    setIsAdjusting(true);
    setAdjustError(null);
    setAdjustResult(null);

    const api = new AdminApi();
    const res = await api.AdjustCredits({
      userId: user.user_id,
      delta,
      adjustmentReason: adjustmentReason.trim(),
      notes: notes.trim(),
    });

    setIsAdjusting(false);

    if (res.success && res.data) {
      setAdjustResult({
        adjustment_id: res.data.adjustment_id,
        new_balance: res.data.credits_balance,
        delta: res.data.delta,
        created_at: res.data.created_at,
      });
      // Update displayed user balance
      setUser((prev) =>
        prev ? { ...prev, credits_balance: res.data!.credits_balance } : prev,
      );
      // Reset the form
      setCreditAmount("");
      setAdjustmentReason("");
      setNotes("");
    } else {
      setAdjustError(res.errorMessage || "Failed to adjust credits");
    }
  }, [user, creditAmount, adjustmentReason, notes]);

  const isUserNotPaid = user?.paid_status !== "paid";

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots flex flex-col">
      <Seo
        title="Admin Support - ArtCraft"
        description="Internal admin tool for ArtCraft customer support."
      />
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-30" />

      {/* Subtle ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[700px] h-[700px] rounded-full bg-gradient-to-br from-purple-700/30 via-blue-600/20 to-teal-500/10 blur-[140px]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center pt-28 pb-16 px-4 sm:px-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="text-center mb-10 max-w-lg">
          <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/50 mb-5">
            <FontAwesomeIcon icon={faShieldHalved} className="text-primary" />
            Internal Tool
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
            Customer Support
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Look up users and manage credit adjustments. All changes are logged.
          </p>
        </div>

        <div className="w-full max-w-xl space-y-6">
          {/* ── Search Section ────────────────────────────────────────── */}
          <section
            id="admin-search-section"
            className="bg-[#1C1C20]/80 backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-4">
              User Lookup
            </h2>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 text-sm"
                />
                <input
                  id="admin-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Email or user ID…"
                  className="w-full bg-black/25 border border-white/10 focus:border-primary/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 outline-none transition-colors text-sm"
                />
              </div>
              <Button
                id="admin-search-button"
                className="h-[46px] px-5 bg-primary hover:bg-primary-600 text-white border-none font-semibold"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {/* Search error */}
            {searchError && (
              <div className="mt-4 flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                {searchError}
              </div>
            )}

            {/* User info card */}
            {user && (
              <div className="mt-5 bg-black/20 border border-white/[0.06] rounded-xl overflow-hidden animate-fadeIn">
                <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                  <InfoCell
                    icon={faUser}
                    label="User ID"
                    value={user.user_id}
                    mono
                  />
                  <InfoCell
                    icon={faEnvelope}
                    label="Email"
                    value={user.email}
                  />
                </div>
                <div className="border-t border-white/[0.06] grid grid-cols-2 divide-x divide-white/[0.06]">
                  <InfoCell
                    icon={faCreditCard}
                    label="Paid Status"
                    value={user.paid_status}
                    badge={user.paid_status === "paid" ? "success" : "warning"}
                  />
                  <InfoCell
                    icon={faWallet}
                    label="Credits Balance"
                    value={user.credits_balance.toLocaleString()}
                    highlight
                  />
                </div>
                <div className="border-t border-white/[0.06] grid grid-cols-2 divide-x divide-white/[0.06]">
                  <InfoCell
                    icon={faCrown}
                    label="Subscription Plan"
                    value={user.subscription_plan || "None"}
                    badge={user.subscription_plan ? "info" : "muted"}
                  />
                  <InfoCell
                    icon={faCalendarCheck}
                    label="Subscription Status"
                    value={user.subscription_status || "N/A"}
                    badge={
                      user.subscription_status === "active"
                        ? "success"
                        : "muted"
                    }
                  />
                </div>
              </div>
            )}
          </section>

          {/* ── Add Credits Section ───────────────────────────────────── */}
          {user && (
            <section
              id="admin-credits-section"
              className="bg-[#1C1C20]/80 backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 shadow-xl animate-fadeIn"
            >
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-4">
                Add Credits
              </h2>

              {/* Not-paid banner */}
              {isUserNotPaid && (
                <div className="flex items-center gap-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-xl text-sm mb-4">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  This user is not on a paid plan. Credit adjustment is
                  disabled.
                </div>
              )}

              <div
                className={`space-y-4 ${isUserNotPaid ? "opacity-40 pointer-events-none select-none" : ""}`}
              >
                {/* Amount */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-credit-amount"
                    className="text-xs font-bold text-white/50 uppercase tracking-wide ml-0.5"
                  >
                    Amount
                  </label>
                  <input
                    id="admin-credit-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-black/25 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors text-sm"
                    disabled={isUserNotPaid}
                  />
                </div>

                {/* Adjustment Reason */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-adjustment-reason"
                    className="text-xs font-bold text-white/50 uppercase tracking-wide ml-0.5"
                  >
                    Adjustment Reason
                  </label>
                  <input
                    id="admin-adjustment-reason"
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="e.g. outage, manual correction, promo grant"
                    className="w-full bg-black/25 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors text-sm"
                    disabled={isUserNotPaid}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-notes"
                    className="text-xs font-bold text-white/50 uppercase tracking-wide ml-0.5"
                  >
                    Notes
                  </label>
                  <textarea
                    id="admin-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ticket reference, additional context…"
                    rows={3}
                    className="w-full bg-black/25 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors resize-none text-sm"
                    disabled={isUserNotPaid}
                  />
                </div>

                {/* Adjust error */}
                {adjustError && (
                  <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fadeIn">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {adjustError}
                  </div>
                )}

                {/* Success toast inline */}
                {adjustResult && (
                  <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3.5 rounded-xl text-sm animate-fadeIn">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="mt-0.5 text-base"
                    />
                    <div>
                      <p className="font-semibold">
                        Credits added successfully
                      </p>
                      <p className="text-emerald-400/70 text-xs mt-1">
                        +{adjustResult.delta.toLocaleString()} credits · New
                        balance:{" "}
                        <span className="text-emerald-400 font-semibold">
                          {adjustResult.new_balance.toLocaleString()}
                        </span>{" "}
                        · ID: {adjustResult.adjustment_id}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  id="admin-add-credits-button"
                  icon={faCoins}
                  className="w-full bg-primary hover:bg-primary-600 text-white border-none justify-center font-bold h-12 mt-1"
                  onClick={handleAdjust}
                  disabled={
                    isAdjusting ||
                    isUserNotPaid ||
                    !creditAmount ||
                    !adjustmentReason.trim() ||
                    !notes.trim()
                  }
                  loading={isAdjusting}
                >
                  Add Credits
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>

      <div className="relative z-10 py-6 text-center text-white/20 text-xs">
        &copy; {new Date().getFullYear()} ArtCraft. Internal use only.
      </div>

      {/* Inline keyframes for fade animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out both;
        }
      `}</style>
    </div>
  );
};

// ── Small sub-component ─────────────────────────────────────────────────

function InfoCell({
  icon,
  label,
  value,
  mono,
  highlight,
  badge,
}: {
  icon: any;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  badge?: "success" | "warning" | "info" | "muted";
}) {
  return (
    <div className="px-4 py-3.5 space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 flex items-center gap-1.5">
        <FontAwesomeIcon icon={icon} className="text-white/20" />
        {label}
      </p>
      <p
        className={`text-sm truncate ${mono ? "font-mono text-white/70" : ""} ${highlight ? "text-primary font-bold text-base" : "text-white/80"}`}
      >
        {badge ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
              badge === "success"
                ? "bg-emerald-500/15 text-emerald-400"
                : badge === "warning"
                  ? "bg-yellow-500/15 text-yellow-400"
                  : badge === "info"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-white/5 text-white/40"
            }`}
          >
            {value}
          </span>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

export default AdminSupport;
