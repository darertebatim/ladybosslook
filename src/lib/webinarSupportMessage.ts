export interface WebinarSupportMessageInput {
  title: string;
  name?: string;
  email?: string;
  roundNumber?: number | null;
  roundName?: string | null;
  localDateTime?: string;
  losAngelesDateTime?: string;
  thankYouUrl: string;
}

export function buildWebinarThankYouUrl(
  basePath: string,
  roundId?: string,
  email?: string,
): string {
  const params = new URLSearchParams();
  if (roundId) params.set("round", roundId);
  if (email) params.set("email", email);
  const query = params.toString();
  return `https://ladybosslook.com${basePath}/thankyou${query ? `?${query}` : ""}`;
}

export function buildWebinarSupportMessage({
  title,
  name,
  email,
  roundNumber,
  roundName,
  localDateTime,
  losAngelesDateTime,
  thankYouUrl,
}: WebinarSupportMessageInput): string {
  const round = roundNumber != null
    ? `${roundNumber}${roundName ? ` — ${roundName}` : ""}`
    : roundName;

  return [
    `سلام، در ${title} ثبت‌نام کرده‌ام. لطفاً لینک ورود و جزئیات جلسه‌ام را برایم بفرستید.`,
    name && `👤 نام: ${name}`,
    email && `📧 ایمیل: ${email}`,
    round && `🔢 دور: ${round}`,
    localDateTime && `🕒 زمان جلسه به وقت من: ${localDateTime.replace(/\n/g, " — ")}`,
    losAngelesDateTime && `🌎 زمان جلسه به وقت لس‌آنجلس: ${losAngelesDateTime}`,
    `🔗 صفحه تشکر و جزئیات ثبت‌نام من:\n${thankYouUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}
