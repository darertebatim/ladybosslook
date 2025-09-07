import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== DIRECT MAILCHIMP API TEST ===");
    
    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const listId = Deno.env.get("MAILCHIMP_LIST_ID");
    
    if (!mailchimpApiKey || !listId) {
      console.error("Missing API key or List ID");
      return new Response(JSON.stringify({ 
        error: "Missing configuration",
        has_api_key: !!mailchimpApiKey,
        has_list_id: !!listId 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }
    
    // Extract datacenter from API key
    const datacenter = mailchimpApiKey.split("-")[1];
    
    console.log("Configuration:", {
      datacenter: datacenter,
      listId: listId,
      apiKeyPrefix: mailchimpApiKey.substring(0, 8) + "..."
    });
    
    // Test 1: Get list info
    const listUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}`;
    console.log("Testing list access:", listUrl);
    
    const listResponse = await fetch(listUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mailchimpApiKey}`,
        "Content-Type": "application/json",
      },
    });
    
    const listData = await listResponse.json();
    console.log("List Response:", {
      status: listResponse.status,
      ok: listResponse.ok,
      data: listData
    });
    
    if (!listResponse.ok) {
      return new Response(JSON.stringify({
        error: "Cannot access Mailchimp list",
        status: listResponse.status,
        listData: listData,
        listUrl: listUrl
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }
    
    // Test 2: Try to add the specific email
    const email = "ladybosslookshop@gmail.com";
    const phone = "9495723730";
    
    // Create MD5 hash
    const crypto = await import("https://deno.land/std@0.190.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const emailHash = Array.from(
      new Uint8Array(await crypto.crypto.subtle.digest("MD5", encoder.encode(email.toLowerCase())))
    ).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const memberUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`;
    console.log("Adding member:", { email, emailHash, memberUrl });
    
    const memberResponse = await fetch(memberUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${mailchimpApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        merge_fields: {
          FNAME: "Lady Boss Look Shop",
          PHONE: `+1${phone}`,
          SMSPHONE: `+1${phone}`,
          MERGE8: `+1${phone}`,
          CELLPHONE: `+1${phone}`,
          MOBILE: `+1${phone}`,
        },
      }),
    });
    
    const memberData = await memberResponse.json();
    
    console.log("Member Response:", {
      status: memberResponse.status,
      ok: memberResponse.ok,
      data: memberData
    });
    
    // Test 3: Check if member exists by getting it
    const getResponse = await fetch(memberUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mailchimpApiKey}`,
        "Content-Type": "application/json",
      },
    });
    
    const getData = await getResponse.json();
    console.log("Get Member Response:", {
      status: getResponse.status,
      ok: getResponse.ok,
      data: getData
    });
    
    return new Response(JSON.stringify({
      success: true,
      tests: {
        listAccess: {
          status: listResponse.status,
          ok: listResponse.ok,
          listName: listData.name,
          memberCount: listData.stats?.member_count
        },
        memberAdd: {
          status: memberResponse.status,
          ok: memberResponse.ok,
          memberId: memberData.id,
          email: memberData.email_address,
          status: memberData.status
        },
        memberGet: {
          status: getResponse.status,
          ok: getResponse.ok,
          exists: getResponse.ok,
          memberStatus: getData.status
        }
      },
      configuration: {
        datacenter: datacenter,
        listId: listId,
        memberUrl: memberUrl,
        emailHash: emailHash
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("Direct test error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});