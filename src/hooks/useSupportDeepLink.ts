import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  APPSFLYER_ATTRIBUTION_EVENT,
  clearStoredAttribution,
  getStoredAttribution,
} from "@/lib/appsflyer";

/**
 * Handles OneLink "support" deep links (used in lead emails).
 * Mobile taps open the app; once the user is authenticated we route them
 * straight into the in-app support chat. Desktop users never reach this —
 * the link's af_web_dp sends them to /dashboard/chat instead.
 */
export function useSupportDeepLink() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ran = useRef(false);
  const [signal, setSignal] = useState(0);

  useEffect(() => {
    const onAttribution = () => {
      ran.current = false;
      setSignal((v) => v + 1);
    };
    window.addEventListener(APPSFLYER_ATTRIBUTION_EVENT, onAttribution);
    return () => window.removeEventListener(APPSFLYER_ATTRIBUTION_EVENT, onAttribution);
  }, []);

  useEffect(() => {
    if (!user?.id || ran.current) return;
    const attribution = getStoredAttribution();
    if (attribution?.deepLinkValue !== "support") return;
    ran.current = true;
    clearStoredAttribution();
    navigate("/app/chat", { replace: true });
  }, [user?.id, navigate, signal]);
}
