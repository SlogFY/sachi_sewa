-- Add new columns to campaigns table for wizard functionality
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'live')),
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS story TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Update existing campaigns to be 'live' status (they're already active)
UPDATE public.campaigns SET status = 'live' WHERE is_active = true AND status = 'draft';

-- Create storage bucket for campaign images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-images',
  'campaign-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for campaign images
CREATE POLICY "Anyone can view campaign images"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own campaign images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own campaign images"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add RLS policy for creators to view their own campaigns (including drafts)
CREATE POLICY "Creators can view their own campaigns"
ON public.campaigns
FOR SELECT
USING (auth.uid() = creator_id);

-- Add RLS policy for creators to update their own draft campaigns
CREATE POLICY "Creators can update their own draft campaigns"
ON public.campaigns
FOR UPDATE
USING (auth.uid() = creator_id AND status IN ('draft', 'rejected'));

-- Add RLS policy for authenticated users to create campaigns
CREATE POLICY "Authenticated users can create campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Update the existing active campaigns policy to check status
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.campaigns;
CREATE POLICY "Anyone can view live campaigns"
ON public.campaigns
FOR SELECT
USING (status = 'live' AND is_active = true);