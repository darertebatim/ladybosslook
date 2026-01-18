-- Fix search_path for cascade_program_slug_update function
CREATE OR REPLACE FUNCTION cascade_program_slug_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if slug actually changed
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    -- Update course_enrollments
    UPDATE public.course_enrollments 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update program_rounds
    UPDATE public.program_rounds 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update program_auto_enrollment
    UPDATE public.program_auto_enrollment 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update audio_playlists
    UPDATE public.audio_playlists 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update audio_content
    UPDATE public.audio_content 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update feed_channels
    UPDATE public.feed_channels 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update orders
    UPDATE public.orders 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;