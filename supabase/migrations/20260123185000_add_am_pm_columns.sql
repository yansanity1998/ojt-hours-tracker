-- Add AM/PM columns to ojt_time_entries
ALTER TABLE public.ojt_time_entries
ADD COLUMN am_in time without time zone,
ADD COLUMN am_out time without time zone,
ADD COLUMN pm_in time without time zone,
ADD COLUMN pm_out time without time zone;

-- Make old columns nullable since we will use the new ones primarily
ALTER TABLE public.ojt_time_entries
ALTER COLUMN time_in DROP NOT NULL,
ALTER COLUMN time_out DROP NOT NULL;
