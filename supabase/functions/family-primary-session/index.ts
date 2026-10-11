import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// When a student signs in with a linked (secondary) email, hand back a one-time
// token for their main account so every login lands in the same account.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: primaryId } = await admin.rpc('family_primary_of', { _uid: user.id })
    if (!primaryId || primaryId === user.id) return json({ switch: false })

    const { data: primary } = await admin.auth.admin.getUserById(primaryId as string)
    const email = primary?.user?.email
    if (!email) return json({ switch: false })

    // Bring along anything created on the secondary login, then keep access in sync.
    const { data: moved, error: moveErr } = await admin.rpc('move_personal_data', { _from: user.id, _to: primaryId })
    if (moveErr) console.error('move_personal_data', moveErr)
    await admin.rpc('sync_account_family', { _uid: primaryId })

    const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
    if (error || !link?.properties?.hashed_token) return json({ switch: false, error: error?.message })

    console.log(`family switch ${user.email} -> ${email}`, moved)
    return json({ switch: true, token_hash: link.properties.hashed_token, email })
  } catch (e) {
    console.error(e)
    return json({ switch: false, error: String(e) }, 500)
  }
})
