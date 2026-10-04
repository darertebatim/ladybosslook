// 1-on-1 meetings: support-chat messages with a personal one-time sign-in link
// to the web page /dashboard/one-on-one/:slug (works for students on old app versions).

const WEB_BASE = "https://ladybosslook.com";

export const oneOnOnePagePath = (slug: string) => `/dashboard/one-on-one/${slug}`;

/** Creates an invite row and returns the redirector URL that signs the student in. */
export async function createOneOnOneLink(admin: any, userId: string, slug: string, invitedBy?: string | null) {
  const id = crypto.randomUUID();
  const { error } = await admin.from("form_invites").insert({
    id,
    user_id: userId,
    form_key: `oneonone:${slug}`,
    invited_by: invitedBy ?? null,
    channels: ["chat"],
  });
  if (error) {
    console.error("[1on1] invite insert failed", error);
    return `${WEB_BASE}${oneOnOnePagePath(slug)}`;
  }
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/one-on-one-link?i=${id}`;
}

async function anyAdminId(admin: any): Promise<string | null> {
  const { data } = await admin.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
  return data?.user_id ?? null;
}

/** Posts an admin message into the student's support chat and sends a push. */
export async function postSupportMessage(admin: any, userId: string, content: string, pushText: string) {
  const senderId = await anyAdminId(admin);
  if (!senderId) return false;
  let { data: conv } = await admin
    .from("chat_conversations")
    .select("id, unread_count_user")
    .eq("user_id", userId)
    .eq("inbox_type", "support")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!conv) {
    const { data: created, error } = await admin
      .from("chat_conversations")
      .insert({ user_id: userId, status: "open" })
      .select("id, unread_count_user")
      .single();
    if (error) {
      console.error("[1on1] conversation create failed", error);
      return false;
    }
    conv = created;
  }
  const { error: mErr } = await admin.from("chat_messages").insert({
    conversation_id: conv.id,
    sender_id: senderId,
    sender_type: "admin",
    content,
    is_read: false,
  });
  if (mErr) {
    console.error("[1on1] message insert failed", mErr);
    return false;
  }
  await admin
    .from("chat_conversations")
    .update({ last_message_at: new Date().toISOString(), unread_count_user: (conv.unread_count_user || 0) + 1 })
    .eq("id", conv.id);
  try {
    await admin.functions.invoke("send-chat-notification", {
      body: { conversationId: conv.id, messageContent: pushText, senderType: "admin", senderId },
    });
  } catch (e) {
    console.error("[1on1] push failed", e);
  }
  return true;
}

/** Sent right after enrollment in a program with 1-on-1 meetings. */
export async function sendBookingInvite(admin: any, userId: string, slug: string, programTitle: string) {
  const link = await createOneOnOneLink(admin, userId, slug);
  const content =
    `📅 رزرو جلسه ۱ به ۱ شما\n\n` +
    `دوره «${programTitle}» شامل جلسه ۱ به ۱ است. از این لینک وقت جلسه‌تون رو انتخاب کنید (لینک شما رو مستقیم وارد حسابتون می‌کنه):\n` +
    `${link}\n\n` +
    `بعد از رزرو، زمان جلسه و لینک ورود به جلسه هم توی همین صفحه هست.`;
  return postSupportMessage(admin, userId, content, "📅 رزرو جلسه ۱ به ۱ شما");
}

async function userTimezone(admin: any, userId: string) {
  const { data } = await admin.from("journal_reminder_settings").select("timezone").eq("user_id", userId).maybeSingle();
  return data?.timezone || "America/Los_Angeles";
}

/** Sends one confirmation per active future booking that hasn't been announced yet. */
export async function notifyNewBookings(admin: any, userId: string | null) {
  if (!userId) return;
  const { data: rows } = await admin
    .from("one_on_one_bookings")
    .select("id, program_slug, start_time")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("chat_notified_at", null)
    .gt("start_time", new Date().toISOString());
  if (!rows?.length) return;
  const tz = await userTimezone(admin, userId);
  for (const b of rows) {
    // Claim first so parallel syncs never double-send
    const { data: claimed } = await admin
      .from("one_on_one_bookings")
      .update({ chat_notified_at: new Date().toISOString() })
      .eq("id", b.id)
      .is("chat_notified_at", null)
      .select("id");
    if (!claimed?.length || !b.program_slug) continue;
    const { data: prog } = await admin.from("program_catalog").select("title").eq("slug", b.program_slug).maybeSingle();
    let when = b.start_time;
    try {
      when = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
      }).format(new Date(b.start_time));
    } catch { /* keep ISO */ }
    const link = await createOneOnOneLink(admin, userId, b.program_slug);
    const content =
      `✅ جلسه ۱ به ۱ شما رزرو شد\n\n` +
      `دوره: ${prog?.title || b.program_slug}\n` +
      `زمان: ${when}\n\n` +
      `برای ورود به جلسه، تغییر زمان یا لغو، از این لینک استفاده کنید:\n${link}`;
    await postSupportMessage(admin, userId, content, "✅ جلسه ۱ به ۱ شما رزرو شد");
  }
}
