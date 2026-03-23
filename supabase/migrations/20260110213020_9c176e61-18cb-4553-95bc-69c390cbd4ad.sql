-- Add completion content and custom social links fields
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS completion_content text,
ADD COLUMN IF NOT EXISTS completion_media jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.campaigns.completion_content IS 'Content to display after campaign completion (Goal Reached message)';
COMMENT ON COLUMN public.campaigns.completion_media IS 'Array of media URLs (images/videos) to display after completion';
COMMENT ON COLUMN public.campaigns.social_links IS 'Custom social media links for sharing (e.g. {"whatsapp": "custom_link", "facebook": "custom_link"})';