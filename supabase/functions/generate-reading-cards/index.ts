import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { document_id, lesson_id } = await req.json();
    if (!document_id || !lesson_id) {
      return new Response(JSON.stringify({ error: "document_id and lesson_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch document text
    const { data: doc, error: docErr } = await supabase
      .from("admin_documents")
      .select("extracted_text, title")
      .eq("id", document_id)
      .single();
    if (docErr || !doc?.extracted_text) {
      return new Response(JSON.stringify({ error: "Document not found or has no extracted text" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const bgColors = ["#F0E3FF", "#D7E9FF", "#E2F9F0", "#FFF3D6", "#FFE0F5", "#FFF492", "#FFE6C9", "#DBEAFE", "#E0FBB8", "#FEE2E2"];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an educational content designer. Break text into 8-15 micro-learning cards. Each card should have a clear title, 2-4 sentences of content, and a bold key takeaway. Return valid JSON only.`,
          },
          {
            role: "user",
            content: `Break this educational text into micro-learning cards. Return a JSON array of objects with: title (string), content (string, 2-4 sentences), key_point (string, one bold takeaway).

Text to process:
${doc.extracted_text.substring(0, 15000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_cards",
              description: "Create reading cards from text",
              parameters: {
                type: "object",
                properties: {
                  cards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                        key_point: { type: "string" },
                      },
                      required: ["title", "content", "key_point"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["cards"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_cards" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { cards: generatedCards } = JSON.parse(toolCall.function.arguments);

    // Delete existing cards for this lesson
    await supabase.from("reading_cards").delete().eq("lesson_id", lesson_id);

    // Insert new cards
    const cardsToInsert = generatedCards.map((card: any, i: number) => ({
      lesson_id,
      sort_order: i,
      title: card.title,
      content: card.content,
      key_point: card.key_point,
      bg_color: bgColors[i % bgColors.length],
    }));

    const { error: insertErr } = await supabase.from("reading_cards").insert(cardsToInsert);
    if (insertErr) throw insertErr;

    // Link document to lesson
    await supabase.from("reading_lessons").update({ source_document_id: document_id }).eq("id", lesson_id);

    return new Response(JSON.stringify({ success: true, count: cardsToInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
