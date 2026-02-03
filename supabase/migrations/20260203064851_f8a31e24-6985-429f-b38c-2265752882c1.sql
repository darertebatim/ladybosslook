-- Fix remaining inner-strength → strength in routines_bank
UPDATE routines_bank SET category = 'strength' WHERE category = 'inner-strength';

-- Create function to cascade category slug updates
CREATE OR REPLACE FUNCTION cascade_category_slug_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    UPDATE admin_task_bank SET category = NEW.slug WHERE category = OLD.slug;
    UPDATE routines_bank SET category = NEW.slug WHERE category = OLD.slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on routine_categories table
DROP TRIGGER IF EXISTS trigger_cascade_category_slug ON routine_categories;
CREATE TRIGGER trigger_cascade_category_slug
  BEFORE UPDATE ON routine_categories
  FOR EACH ROW
  EXECUTE FUNCTION cascade_category_slug_update();