# Apply Daily Notes Migration to Supabase

To enable the Daily Notes feature, you need to run the migration in your Supabase project.

## Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/20260123_add_daily_notes.sql`
5. Click **Run** to execute the migration

## Option 2: Copy SQL directly

You can also copy this SQL and run it in the SQL Editor:

```sql
-- The SQL from 20260123_add_daily_notes.sql
-- (See the migration file for the complete code)
```

## What this migration does:

- ✅ Creates `ojt_daily_notes` table to store daily work notes
- ✅ Sets up Row Level Security (RLS) policies for data protection
- ✅ Adds indexes for better query performance
- ✅ Creates triggers to auto-update timestamps

Once the migration is applied, users can:
- Add daily notes about their OJT work
- Edit existing notes
- Delete notes
- View notes sorted by date (most recent first)
