import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { buildDedicationOneLink } from "@/lib/appsflyer";

export interface SharePayload {
  token: string;
  senderName: string | null;
  momentTitle: string;
  recipientHint?: string | null;
}

export function dedicationUrl(token: string): string {
  return buildDedicationOneLink(token);
}

function baseMessage(p: SharePayload): string {
  const name = p.recipientHint ? `for ${p.recipientHint}` : "for you";
  return `I dedicated "${p.momentTitle}" ${name} on Rilo 💝`;
}

export function whatsappLink(p: SharePayload): string {
  const text = `${baseMessage(p)} — open it: ${dedicationUrl(p.token)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function smsLink(p: SharePayload): string {
  const text = `${baseMessage(p)} — ${dedicationUrl(p.token)}`;
  return `sms:?&body=${encodeURIComponent(text)}`;
}

export function telegramLink(p: SharePayload): string {
  const url = dedicationUrl(p.token);
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(baseMessage(p))}`;
}

export async function nativeShare(p: SharePayload): Promise<boolean> {
  const text = `${baseMessage(p)} — ${dedicationUrl(p.token)}`;
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: "A Care Package from Rilo", text, url: dedicationUrl(p.token) });
      return true;
    }
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      await (navigator as any).share({ title: "A Care Package", text, url: dedicationUrl(p.token) });
      return true;
    }
  } catch { /* cancel */ }
  return false;
}

export async function copyLink(p: SharePayload): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(dedicationUrl(p.token));
    return true;
  } catch { return false; }
}