-- Add social_share_options column to campaigns table to store which platforms are enabled
ALTER TABLE public.campaigns 
ADD COLUMN social_share_options jsonb DEFAULT '{"whatsapp": true, "facebook": true, "twitter": true, "linkedin": true, "instagram": true}'::jsonb;