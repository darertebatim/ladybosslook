import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting audio files sync...');

    // List all files in the audio_files bucket
    const { data: files, error: listError } = await supabaseClient.storage
      .from('audio_files')
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      console.error('Error listing files:', listError);
      throw listError;
    }

    console.log(`Found ${files?.length || 0} files in storage`);

    // Get existing records to avoid duplicates
    const { data: existingRecords } = await supabaseClient
      .from('audio_content')
      .select('file_url');

    const existingUrls = new Set(
      existingRecords?.map((r) => r.file_url) || []
    );

    const results = {
      synced: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each file
    for (const file of files || []) {
      // Skip folders and covers subfolder
      if (!file.name || file.name.includes('/') || file.id === null) {
        continue;
      }

      // Only process audio files
      const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg'];
      const isAudioFile = audioExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!isAudioFile) {
        console.log(`Skipping non-audio file: ${file.name}`);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('audio_files')
        .getPublicUrl(file.name);

      // Check if record already exists
      if (existingUrls.has(publicUrl)) {
        console.log(`Skipping existing record: ${file.name}`);
        results.skipped++;
        continue;
      }

      try {
        // Extract title from filename (remove extension and replace - or _ with spaces)
        const title = file.name
          .replace(/\.(mp3|m4a|wav|ogg)$/i, '')
          .replace(/[-_]/g, ' ')
          .trim();

        // Calculate file size in MB
        const fileSizeMb = (file.metadata?.size || 0) / (1024 * 1024);

        // Create database record
        const { error: insertError } = await supabaseClient
          .from('audio_content')
          .insert({
            title: title,
            file_url: publicUrl,
            duration_seconds: 0, // Will need to be updated manually
            file_size_mb: fileSizeMb,
            category: 'podcast',
            is_free: true,
            sort_order: 0,
            published_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(`Error inserting ${file.name}:`, insertError);
          results.errors.push(`${file.name}: ${insertError.message}`);
        } else {
          console.log(`Successfully synced: ${file.name}`);
          results.synced++;
        }
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        results.errors.push(`${file.name}: ${err.message}`);
      }
    }

    console.log('Sync completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${results.synced} files, skipped ${results.skipped} existing files`,
        ...results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
