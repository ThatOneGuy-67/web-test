import { createClient } from "@supabase/supabase-js";

const VISITOR_KEY = "tog_visitor_id";
const SESSION_KEY = "tog_session_id";
const HEARTBEAT_MS = 30_000;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function id(key: string, storage: Storage): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  storage.setItem(key, value);
  return value;
}

function visitorDetails() {
  const ua = navigator.userAgent;
  return {
    device: /Mobi|Android/i.test(ua) ? "Mobile" : /iPad|Tablet/i.test(ua) ? "Tablet" : "Desktop",
    os: /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "macOS" : /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : "Unknown",
    browser: /Firefox/i.test(ua) ? "Firefox" : /Edg/i.test(ua) ? "Edge" : /Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : "Unknown",
    referrer: document.referrer ? (() => { try { return new URL(document.referrer).hostname; } catch { return null; } })() : null,
  };
}

function trackingClient(visitorId: string, sessionId: string) {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { "x-visitor-id": visitorId, "x-session-id": sessionId } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Records deliberate router navigation through the server-side validated RPC. */
export function startVisitorTracking(path: string) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || typeof window === "undefined") return () => {};
  const visitorId = id(VISITOR_KEY, localStorage);
  const sessionId = id(SESSION_KEY, sessionStorage);
  const client = trackingClient(visitorId, sessionId);
  const details = visitorDetails();
  let disposed = false;

  const record = async (online: boolean) => {
    if (disposed) return;
    const { error } = await client.rpc("record_visitor_activity", {
      p_visitor_id: visitorId, p_session_id: sessionId,
      p_device_type: details.device, p_operating_system: details.os, p_browser: details.browser,
      p_current_path: path, p_referrer_domain: details.referrer,
      p_is_online: online, p_last_activity: new Date().toISOString(),
    });
    if (error) console.warn("Visitor tracking unavailable:", error.message);
  };

  void record(true);
  const timer = window.setInterval(() => void record(true), HEARTBEAT_MS);
  return () => { disposed = true; window.clearInterval(timer); };
}

export function getTrackedVisitorId() { return typeof window === "undefined" ? null : id(VISITOR_KEY, localStorage); }

export async function checkVisitorBanned(): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || typeof window === "undefined") return false;
  const visitorId = id(VISITOR_KEY, localStorage);
  const { data, error } = await trackingClient(visitorId, "").rpc("is_current_visitor_banned");
  if (error) { console.warn("Visitor ban check unavailable:", error.message); return false; }
  return data === true;
}
