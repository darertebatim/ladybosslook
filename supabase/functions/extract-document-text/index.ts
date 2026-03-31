import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

async function extractDocxText(file: File): Promise<string | null> {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const documentXmlFile = zip.file("word/document.xml");
    if (!documentXmlFile) return null;

    const documentXml = await documentXmlFile.async("text");
    const normalizedXml = documentXml
      .replace(/<w:tab(?:\s+[^>]*)?\/>/g, "\t")
      .replace(/<w:(?:br|cr)(?:\s+[^>]*)?\/>/g, "\n");

    const paragraphs = normalizedXml.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];
    const lines = paragraphs
      .map((paragraph) => {
        const parts = Array.from(paragraph.matchAll(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g)).map((m) => decodeXmlEntities(m[1]));
        return parts.join("").replace(/\r/g, "").trim();
      })
      .filter(Boolean);

    if (lines.length > 0) {
      return lines.join("\n");
    }

    const fallbackParts = Array.from(normalizedXml.matchAll(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g)).map((m) => decodeXmlEntities(m[1]).trim()).filter(Boolean);
    return fallbackParts.length > 0 ? fallbackParts.join("\n") : null;
  } catch (error) {
    console.error("DOCX extraction error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Support both FormData and JSON (for re-extract by document ID)
    const contentType = (req.headers.get("content-type") || "").toLowerCase();

    let file: File | null = null;
    let documentId: string | null = null;

    const loadFileByDocumentId = async (id: string): Promise<File | Response> => {
      const { data: doc } = await supabase
        .from("admin_documents")
        .select("file_name, file_url, mime_type")
        .eq("id", id)
        .single();

      if (!doc) {
        return new Response(JSON.stringify({ error: "Document not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const urlParts = doc.file_url.split("/admin-documents/");
      const storagePath = urlParts[urlParts.length - 1];

      const { data: fileData, error: dlError } = await supabase.storage
        .from("admin-documents")
        .download(storagePath);

      if (dlError || !fileData) {
        console.error("Download error:", dlError);
        return new Response(JSON.stringify({ error: "Failed to download file" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new File([fileData], doc.file_name, { type: doc.mime_type || "application/octet-stream" });
    };

    if (contentType.includes("application/json")) {
      const body = await req.json();
      documentId = typeof body?.document_id === "string" ? body.document_id : null;
      if (documentId) {
        const loaded = await loadFileByDocumentId(documentId);
        if (loaded instanceof Response) return loaded;
        file = loaded;
      }
    } else {
      const formData = await req.formData();
      const maybeFile = formData.get("file");
      const maybeDocumentId = formData.get("document_id");

      if (maybeFile instanceof File) {
        file = maybeFile;
      }

      documentId = typeof maybeDocumentId === "string" ? maybeDocumentId : null;

      // Re-extract path: multipart request with document_id but no raw file
      if (!file && documentId) {
        const loaded = await loadFileByDocumentId(documentId);
        if (loaded instanceof Response) return loaded;
        file = loaded;
      }
    }

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mimeType = file.type || "application/octet-stream";
    const lowerName = file.name.toLowerCase();
    const isDocx =
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx");

    // Fast local extract paths
    if (mimeType === "text/plain") {
      const text = await file.text();
      if (documentId) {
        await supabase.from("admin_documents").update({ extracted_text: text }).eq("id", documentId);
      }
      return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isDocx) {
      const text = await extractDocxText(file);
      if (documentId && text) {
        await supabase.from("admin_documents").update({ extracted_text: text }).eq("id", documentId);
      }
      return new Response(JSON.stringify({ text, error: text ? null : "DOCX extraction failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI fallback for PDF and image-based docs
    const canUseAi = mimeType === "application/pdf" || mimeType.startsWith("image/") || mimeType === "application/vnd.apple.pages";
    if (!canUseAi) {
      return new Response(JSON.stringify({ text: null, error: `Unsupported file type: ${mimeType}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64 = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      base64 += String.fromCharCode(...uint8Array.slice(i, i + chunkSize));
    }
    base64 = btoa(base64);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a document text extractor. Extract ALL text content from the provided document. Return ONLY the extracted text, preserving structure and formatting. Do not add commentary or explanations. If the text is in Farsi/Persian, preserve it exactly as-is.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract all text from this ${file.name} document:`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI extraction error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ text: null, error: "Extraction failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices?.[0]?.message?.content || null;

    if (documentId && extractedText) {
      await supabase.from("admin_documents").update({ extracted_text: extractedText }).eq("id", documentId);
    }

    return new Response(JSON.stringify({ text: extractedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-document-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
