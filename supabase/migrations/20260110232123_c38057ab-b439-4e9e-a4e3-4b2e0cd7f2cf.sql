-- Create FAQs table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active FAQs
CREATE POLICY "Anyone can view active FAQs"
ON public.faqs
FOR SELECT
USING (is_active = true);

-- Admins can view all FAQs
CREATE POLICY "Admins can view all FAQs"
ON public.faqs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert FAQs
CREATE POLICY "Admins can insert FAQs"
ON public.faqs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update FAQs
CREATE POLICY "Admins can update FAQs"
ON public.faqs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete FAQs
CREATE POLICY "Admins can delete FAQs"
ON public.faqs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default FAQs
INSERT INTO public.faqs (question, answer, display_order) VALUES
  ('How long does it take to start a fundraiser?', 'You can create a fundraiser in just 5 minutes. Our team verifies campaigns within 24 hours, after which you can start receiving donations.', 1),
  ('What documents do I need?', 'Basic identity proof and documents related to your cause (like medical bills, school certificates, etc.). This helps us verify and build trust with donors.', 2),
  ('How will I receive the funds?', 'Funds can be disbursed directly to hospitals, educational institutions, or to your verified bank account, depending on the nature of the campaign.', 3),
  ('Is there a minimum or maximum fundraising goal?', 'There''s no minimum goal. You can start fundraising for any amount. For larger campaigns, our team provides dedicated support.', 4),
  ('Can I withdraw funds before reaching my goal?', 'Yes, you can request partial withdrawals as funds come in. We process these requests within 24-48 hours.', 5);