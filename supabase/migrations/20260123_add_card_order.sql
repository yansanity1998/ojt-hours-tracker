-- Migration to add card_order column to ojt_settings table
-- This allows persisting the user's dashboard layout

ALTER TABLE ojt_settings 
ADD COLUMN IF NOT EXISTS card_order text[] DEFAULT ARRAY['company-input', 'hours-progress'];

-- Example of how to update existing rows to have the default value if needed
UPDATE ojt_settings 
SET card_order = ARRAY['company-input', 'hours-progress'] 
WHERE card_order IS NULL;
