-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create a table for fundraiser requests (pending campaigns)
CREATE TABLE public.fundraiser_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_phone TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    goal_amount NUMERIC NOT NULL DEFAULT 0,
    story TEXT,
    image_url TEXT,
    video_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fundraiser_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a fundraiser request
CREATE POLICY "Anyone can submit fundraiser requests" 
ON public.fundraiser_requests 
FOR INSERT 
WITH CHECK (true);

-- Admins can view all requests
CREATE POLICY "Admins can view all fundraiser requests" 
ON public.fundraiser_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update fundraiser requests" 
ON public.fundraiser_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fundraiser_requests_updated_at
BEFORE UPDATE ON public.fundraiser_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();