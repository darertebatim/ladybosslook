import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerWithIgAdsLanding from "@/pages/CustomerWithIgAdsLanding";
import { IGTHREE_EMAIL_KEY } from "@/pages/IgThreeGate";

export default function IgThreeWatch() {
  const navigate = useNavigate();
  const [email] = useState(() => {
    try { return localStorage.getItem(IGTHREE_EMAIL_KEY) || ""; } catch { return ""; }
  });

  useEffect(() => {
    if (!email) navigate("/l/igthree", { replace: true });
  }, [email, navigate]);

  if (!email) return null;

  return (
    <CustomerWithIgAdsLanding
      videoId="Fre2PCAuZW0"
      source="igthree_program_waitlist"
      autoplay
      initialEmail={email}
      trackMeta={false}
    />
  );
}
