-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create campaigns table
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    goal_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_raised DECIMAL(12,2) NOT NULL DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Everyone can view active campaigns
CREATE POLICY "Anyone can view active campaigns"
ON public.campaigns
FOR SELECT
USING (is_active = true);

-- Admins can view all campaigns
CREATE POLICY "Admins can view all campaigns"
ON public.campaigns
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert campaigns
CREATE POLICY "Admins can insert campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update campaigns
CREATE POLICY "Admins can update campaigns"
ON public.campaigns
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create donations table
CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    donor_name TEXT NOT NULL,
    donor_email TEXT NOT NULL,
    donor_phone TEXT,
    amount DECIMAL(12,2) NOT NULL,
    message TEXT,
    receipt_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Admins can view all donations
CREATE POLICY "Admins can view all donations"
ON public.donations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert donations (public donation)
CREATE POLICY "Anyone can make donations"
ON public.donations
FOR INSERT
WITH CHECK (true);

-- Function to update campaign amount_raised after donation
CREATE OR REPLACE FUNCTION public.update_campaign_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.campaigns
  SET amount_raised = amount_raised + NEW.amount,
      updated_at = now()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$;

-- Trigger to update amount after donation
CREATE TRIGGER on_donation_insert
  AFTER INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_amount();

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  RETURN NEW;
END;
$$;

-- Trigger to generate receipt number before insert
CREATE TRIGGER on_donation_before_insert
  BEFORE INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_receipt_number();

-- Insert sample campaigns
INSERT INTO public.campaigns (title, description, category, goal_amount, amount_raised, image_url) VALUES
('Education for Rural Children', 'Help provide quality education to children in rural areas. Your donation will fund books, supplies, and teacher training.', 'Education', 500000, 125000, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800'),
('Clean Water Initiative', 'Bring clean drinking water to villages without access. Each well serves over 500 families.', 'Health', 300000, 180000, 'https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=800'),
('Women Empowerment Program', 'Support skill development and microfinance for women in underserved communities.', 'Empowerment', 250000, 75000, 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800'),
('Food Security Project', 'Provide nutritious meals to families facing food insecurity. One meal costs just ₹25.', 'Food', 150000, 60000, 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800');