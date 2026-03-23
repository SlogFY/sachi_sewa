-- Create site_settings table for configurable social links and other settings
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (they're public)
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Only admins can insert settings
CREATE POLICY "Admins can insert site settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Only admins can delete settings
CREATE POLICY "Admins can delete site settings" 
ON public.site_settings 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Insert default social media settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('instagram_url', 'https://www.instagram.com/sacchi_sewa/', 'Instagram profile URL'),
  ('facebook_url', 'https://www.facebook.com/sacchisewa/', 'Facebook page URL'),
  ('whatsapp_number', '9311536630', 'WhatsApp contact number'),
  ('whatsapp_default_message', 'Hi! I would like to support this cause.', 'Default WhatsApp message'),
  ('twitter_url', 'https://x.com/SacchiSewa', 'Twitter/X profile URL'),
  ('linkedin_url', 'https://www.linkedin.com/showcase/sachi-sewa/about/', 'LinkedIn page URL');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();