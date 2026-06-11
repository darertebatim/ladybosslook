// Shared helper: send a welcome support-chat message after a purchase / enrollment.
// Used by stripe-webhook, revenuecat-webhook, and admin-create-enrollment.
//
// Idempotent: will not insert a second welcome message for the same user + program_slug.

export interface SendWelcomeArgs {
  userId: string;
  programSlug: string;
  programTitle?: string | null;
}

const PLUS_SLUGS = new Set(["simora-plus", "simora-plus-annual"]);

function buildWelcome(programSlug: string, programTitle: string) {
  const isPlus = PLUS_SLUGS.has(programSlug);

  if (isPlus) {
    const text =
      "Welcome to Rilo Plus! 🎉\n\nEvery tool, sound, and guided session is unlocked. Tap below to start exploring.";
    const linkUrl = "/app";
    const linkText = "Open Rilo";
    return `${text}\n\n🔗 LINK_BUTTON:${linkUrl}:${linkText}`;
  }

  const text = `Welcome to ${programTitle}! 🎉\n\nYour lessons and materials are ready. Tap below to open your program.`;
  const linkUrl = `/app/programs/${programSlug}`;
  const linkText = "Open program";
  return `${text}\n\n🔗 LINK_BUTTON:${linkUrl}:${linkText}`;
}

export async function sendPurchaseWelcomeMessage(
  supabase: any,
  { userId, programSlug, programTitle }: SendWelcomeArgs,
): Promise<void> {
  try {
    if (!userId || !programSlug) {
      console.log("[WELCOME] Skipping — missing userId or programSlug");
      return;
    }

    // Resolve program title if not provided
    let title = programTitle?.trim() || "";
    if (!title) {
      const { data: prog } = await supabase
        .from("program_catalog")
        .select("title")
        .eq("slug", programSlug)
        .maybeSingle();
      title = prog?.title || programSlug;
    }

    // Find or create a conversation for this user
    let { data: conversation } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversation) {
      const { data: newConv, error: convError } = await supabase
        .from("chat_conversations")
        .insert({ user_id: userId, status: "open" })
        .select("id")
        .single();

      if (convError || !newConv) {
        console.error("[WELCOME] Conversation create failed:", convError);
        return;
      }
      conversation = newConv;
    }

    // Idempotency: check if a welcome message for this program already exists in this conversation
    const linkMarker =
      PLUS_SLUGS.has(programSlug)
        ? "🔗 LINK_BUTTON:/app:"
        : `🔗 LINK_BUTTON:/app/programs/${programSlug}:`;

    const { data: existing } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("conversation_id", conversation.id)
      .eq("sender_type", "admin")
      .ilike("content", `%${linkMarker}%`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log("[WELCOME] Already sent for", programSlug, "→ skipping");
      return;
    }

    // Resolve a sender_id (any admin)
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    const senderId = adminRole?.user_id;
    if (!senderId) {
      console.error("[WELCOME] No admin user found to send as — skipping");
      return;
    }

    const content = buildWelcome(programSlug, title);

    const { error: msgError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: senderId,
        sender_type: "admin",
        content,
        is_read: false,
      });

    if (msgError) {
      console.error("[WELCOME] Insert failed:", msgError);
      return;
    }

    await supabase
      .from("chat_conversations")
      .update({
        unread_count_user: 1,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    console.log("[WELCOME] ✓ Sent welcome message for", programSlug, "to user", userId);
  } catch (err: any) {
    console.error("[WELCOME] Unexpected error:", err?.message || err);
  }
}