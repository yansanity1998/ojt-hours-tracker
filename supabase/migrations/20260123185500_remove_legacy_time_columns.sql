-- Remove legacy time_in and time_out columns
ALTER TABLE public.ojt_time_entries
DROP COLUMN time_in,
DROP COLUMN time_out;
