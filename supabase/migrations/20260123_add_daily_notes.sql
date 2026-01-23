-- Create table for daily OJT notes
CREATE TABLE IF NOT EXISTS public.ojt_daily_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ojt_daily_notes_user_id ON public.ojt_daily_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_ojt_daily_notes_date ON public.ojt_daily_notes(date);
CREATE INDEX IF NOT EXISTS idx_ojt_daily_notes_user_date ON public.ojt_daily_notes(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.ojt_daily_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notes"
    ON public.ojt_daily_notes
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
    ON public.ojt_daily_notes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON public.ojt_daily_notes
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON public.ojt_daily_notes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.ojt_daily_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- STORAGE SETUP FOR PROOF IMAGES --
-- Note: You might need to create the 'daily_proofs' bucket manually in Supabase Dashboard -> Storage if this fails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('daily_proofs', 'daily_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Give users access to own folder 1bk279_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'daily_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Give users access to own folder 1bk279_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'daily_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Give users access to own folder 1bk279_2" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'daily_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Give users access to own folder 1bk279_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'daily_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
