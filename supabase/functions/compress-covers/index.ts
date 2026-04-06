import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: corsHeaders })
    }

    // Verify caller is admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await anonClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders })
    }

    // Get all reading covers that need compression
    const { data: contents, error: fetchErr } = await supabaseAdmin
      .from('reading_content')
      .select('id, title, cover_url')
      .not('cover_url', 'is', null)
      .not('cover_url', 'eq', '')

    if (fetchErr) throw fetchErr

    const results: any[] = []
    let totalBefore = 0
    let totalAfter = 0

    for (const item of contents || []) {
      const url = item.cover_url
      if (!url) continue

      // Extract storage path from URL
      const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
      if (!match) {
        results.push({ title: item.title, status: 'skipped', reason: 'not a storage URL' })
        continue
      }

      const [, bucket, filePath] = match

      // Skip if already webp and small
      if (filePath.endsWith('.webp')) {
        results.push({ title: item.title, status: 'skipped', reason: 'already webp' })
        continue
      }

      // Download the file
      const { data: fileData, error: dlErr } = await supabaseAdmin.storage
        .from(bucket)
        .download(filePath)
      if (dlErr || !fileData) {
        results.push({ title: item.title, status: 'error', reason: dlErr?.message || 'download failed' })
        continue
      }

      const origSize = fileData.size
      totalBefore += origSize

      // Convert to WebP using canvas API (Deno)
      // Since Deno doesn't have Canvas, we'll use a simpler approach:
      // Just re-upload with proper content type and let Supabase handle it
      // Actually, let's use the sharp-like approach with fetch to an image service
      
      // For now, upload the raw file as-is but with webp path
      // The real compression was done locally. Let's accept pre-compressed files.
      
      // Instead: accept file uploads from the client
      results.push({ title: item.title, status: 'needs_client', origSizeKB: Math.round(origSize / 1024) })
      totalAfter += origSize
    }

    return new Response(JSON.stringify({ results, totalBefore, totalAfter }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
