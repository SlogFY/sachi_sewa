-- Create monthly_donations table
CREATE TABLE public.monthly_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT,
  amount NUMERIC NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  is_indian_citizen BOOLEAN NOT NULL DEFAULT true,
  receipt_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.monthly_donations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all monthly donations" 
ON public.monthly_donations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can make monthly donations" 
ON public.monthly_donations 
FOR INSERT 
WITH CHECK (true);

-- Create trigger to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_monthly_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number := 'MRCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER generate_monthly_receipt
BEFORE INSERT ON public.monthly_donations
FOR EACH ROW
EXECUTE FUNCTION public.generate_monthly_receipt_number();