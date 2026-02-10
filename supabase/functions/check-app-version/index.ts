import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache to avoid excessive API calls
let cachedVersion: { version: string; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface ITunesLookupResponse {
  resultCount: number;
  results: Array<{
    version: string;
    trackViewUrl: string;
    trackId: number;
  }>;
}

async function getLatestAppStoreVersion(): Promise<{ version: string; storeUrl: string } | null> {
  // Check cache first
  if (cachedVersion && Date.now() - cachedVersion.timestamp < CACHE_DURATION_MS) {
    console.log('[check-app-version] Using cached version:', cachedVersion.version);
    return {
      version: cachedVersion.version,
      storeUrl: 'https://apps.apple.com/app/simora-ladybosslook/id6755076134',
    };
  }

  try {
    // Call iTunes Lookup API
    const bundleId = 'com.ladybosslook.academy';
    const response = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${bundleId}&country=us`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[check-app-version] iTunes API error:', response.status);
      return null;
    }

    const data: ITunesLookupResponse = await response.json();
    console.log('[check-app-version] iTunes API response:', JSON.stringify(data));

    if (data.resultCount === 0 || !data.results[0]) {
      console.error('[check-app-version] App not found in App Store');
      return null;
    }

    const result = data.results[0];
    
    // Update cache
    cachedVersion = {
      version: result.version,
      timestamp: Date.now(),
    };

    return {
      version: result.version,
      storeUrl: result.trackViewUrl || `https://apps.apple.com/app/simora-ladybosslook/id${result.trackId}`,
    };
  } catch (error) {
    console.error('[check-app-version] Error fetching from iTunes:', error);
    return null;
  }
}

function compareVersions(current: string, latest: string): boolean {
  // Returns true if latest > current
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get current version from request body
    let currentVersion = '1.0.0';
    
    try {
      const body = await req.json();
      if (body.currentVersion) {
        currentVersion = body.currentVersion;
      }
    } catch {
      // Body parsing failed, use default
    }

    console.log('[check-app-version] Current version:', currentVersion);

    // Check for admin override in database first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: overrideData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'latest_ios_version')
      .maybeSingle();

    let latestVersion: string | null = null;
    let storeUrl = 'https://apps.apple.com/app/id6746970920';

    if (overrideData?.value) {
      console.log('[check-app-version] Using admin override:', overrideData.value);
      latestVersion = overrideData.value;
    } else {
      // Fetch from App Store
      const appStoreResult = await getLatestAppStoreVersion();
      if (appStoreResult) {
        latestVersion = appStoreResult.version;
        storeUrl = appStoreResult.storeUrl;
      }
    }

    if (!latestVersion) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unable to determine latest version',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 to not break the app
        }
      );
    }

    const updateAvailable = compareVersions(currentVersion, latestVersion);

    console.log('[check-app-version] Result:', {
      currentVersion,
      latestVersion,
      updateAvailable,
    });

    return new Response(
      JSON.stringify({
        success: true,
        currentVersion,
        latestVersion,
        updateAvailable,
        storeUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[check-app-version] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 to not break the app
      }
    );
  }
});
