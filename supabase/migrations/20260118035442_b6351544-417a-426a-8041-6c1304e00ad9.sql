-- Function to cascade program slug updates to all related tables
CREATE OR REPLACE FUNCTION cascade_program_slug_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if slug actually changed
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    -- Update course_enrollments
    UPDATE course_enrollments 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update program_rounds
    UPDATE program_rounds 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update program_auto_enrollment
    UPDATE program_auto_enrollment 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update audio_playlists
    UPDATE audio_playlists 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update audio_content
    UPDATE audio_content 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update feed_channels
    UPDATE feed_channels 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
    
    -- Update orders
    UPDATE orders 
    SET program_slug = NEW.slug 
    WHERE program_slug = OLD.slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on program_catalog table
DROP TRIGGER IF EXISTS trigger_cascade_program_slug ON program_catalog;
CREATE TRIGGER trigger_cascade_program_slug
  AFTER UPDATE OF slug ON program_catalog
  FOR EACH ROW
  EXECUTE FUNCTION cascade_program_slug_update();