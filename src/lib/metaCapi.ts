// Meta Conversions API (server-side) + browser pixel, deduplicated by event_id.
import { supabase } from "@/integrations/supabase/client";
import { trackLead, trackCustomLead } from "@/lib/metaPixel";

function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return m ? decodeURIComponent(m[2]) : undefined;
}

function newEventId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

async function sendCapi(eventName: string, eventId: string, opts: {
  email?: string;
  phone?: string;
  firstName?: string;
  customData?: Record<string, unknown>;
}) {
  try {
    await supabase.functions.invoke("meta-capi-lead", {
      body: {
        eventName,
        eventId,
        email: opts.email,
        phone: opts.phone,
        firstName: opts.firstName,
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        fbp: cookie("_fbp"),
        fbc: cookie("_fbc"),
        customData: opts.customData,
      },
    });
  } catch (err) {
    console.error("meta capi error", err);
  }
}

/**
 * Fires the standard `Lead` event plus a per-webinar custom event, both in the
 * browser pixel and through the Conversions API (same event_id => deduplicated).
 */
export function trackWebinarLead(params: {
  customEvent: string;
  contentName: string;
  email?: string;
  name?: string;
  phone?: string;
}) {
  const { customEvent, contentName, email, name, phone } = params;
  const customData = { content_name: contentName, content_category: "webinar" };

  const leadId = newEventId();
  const customId = newEventId();

  trackLead(customData, leadId);
  trackCustomLead(customEvent, customData, customId);

  void sendCapi("Lead", leadId, { email, firstName: name, phone, customData });
  void sendCapi(customEvent, customId, { email, firstName: name, phone, customData });
}
