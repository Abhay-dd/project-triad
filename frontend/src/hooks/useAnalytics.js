/**
 * useAnalytics — lightweight client-side page-view tracker using localStorage.
 * Call trackPageView(path) on each navigation event.
 * Call getAnalyticsSummary() to get aggregated stats for the Owner dashboard.
 */

const STORAGE_KEY = "triad_analytics_v1";
const MAX_RECORDS = 2000;

/**
 * Track a page view. Stored as { path, ts } in localStorage.
 */
export function trackPageView(path) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const records = raw ? JSON.parse(raw) : [];
    records.push({ path, ts: Date.now() });
    // Keep only the most recent entries to prevent unbounded growth
    const trimmed = records.slice(-MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* silent */
  }
}

/**
 * Return aggregated analytics:
 * - topPages: [{ path, count }] sorted desc
 * - topTeamMembers: [{ id, count }] sorted desc (from /team/:id visits)
 * - topProperties: [{ id, count }] sorted desc (from /projects/:id visits)
 * - totalViews: number
 * - last7Days: number
 */
export function getAnalyticsSummary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAnalytics();
    const records = JSON.parse(raw);
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;

    const pageCounts = {};
    let last7Days = 0;

    records.forEach(({ path, ts }) => {
      pageCounts[path] = (pageCounts[path] || 0) + 1;
      if (now - ts < week) last7Days++;
    });

    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topTeamMembers = records
      .filter(({ path }) => path.startsWith("/team/"))
      .reduce((acc, { path }) => {
        const id = path.replace("/team/", "");
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});

    const topTeam = Object.entries(topTeamMembers)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topPropertiesMap = records
      .filter(({ path }) => path.startsWith("/projects/"))
      .reduce((acc, { path }) => {
        const id = path.replace("/projects/", "");
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});

    const topProperties = Object.entries(topPropertiesMap)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      topPages,
      topTeam,
      topProperties,
      totalViews: records.length,
      last7Days,
    };
  } catch {
    return emptyAnalytics();
  }
}

function emptyAnalytics() {
  return { topPages: [], topTeam: [], topProperties: [], totalViews: 0, last7Days: 0 };
}

/**
 * Hook: automatically tracks the current pathname every time it changes.
 * Import useAnalyticsTracker in App.js or a top-level component.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useAnalyticsTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
}
