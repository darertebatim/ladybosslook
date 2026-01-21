-- Create function to update content_updated_at for all users viewing this round
CREATE OR REPLACE FUNCTION public.notify_round_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update content_updated_at for all users who have viewed this round
  UPDATE public.user_content_views
  SET content_updated_at = now()
  WHERE content_type = 'round' 
    AND content_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on program_rounds updates
DROP TRIGGER IF EXISTS on_round_update_notify ON public.program_rounds;
CREATE TRIGGER on_round_update_notify
  AFTER UPDATE ON public.program_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_round_update();

-- Also notify when enrollment status changes
CREATE OR REPLACE FUNCTION public.notify_enrollment_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update content_updated_at for this enrollment
  UPDATE public.user_content_views
  SET content_updated_at = now()
  WHERE content_type = 'enrollment' 
    AND content_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_enrollment_update_notify ON public.course_enrollments;
CREATE TRIGGER on_enrollment_update_notify
  AFTER UPDATE ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_enrollment_update();