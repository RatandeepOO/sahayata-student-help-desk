-- Sahayata Help Desk Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create custom users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'technical', 'admin')),
  name TEXT NOT NULL,
  branch TEXT,
  roll_number TEXT,
  semester TEXT,
  year TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  dob DATE,
  profile_picture TEXT,
  phone_number TEXT,
  department TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('electrical', 'mechanical', 'networking', 'plumbing', 'civil', 'other')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  emergency BOOLEAN DEFAULT FALSE,
  fix_till_date DATE NOT NULL,
  photo TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  raised_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  raised_by_name TEXT NOT NULL,
  raised_by_branch TEXT,
  raised_by_profile_pic TEXT,
  volunteer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  volunteer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('complaint_resolved', 'new_message', 'complaint_accepted')),
  message TEXT NOT NULL,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create technical_team table
CREATE TABLE public.technical_team (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_team ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- RLS Policies for complaints table
CREATE POLICY "Anyone can read complaints" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own complaints" ON public.complaints FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = raised_by));
CREATE POLICY "Volunteers can update complaints" ON public.complaints FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = volunteer_id));
CREATE POLICY "Admins can delete complaints" ON public.complaints FOR DELETE USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE role = 'admin'));

-- RLS Policies for messages table
CREATE POLICY "Users can read own messages" ON public.messages FOR SELECT USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = sender_id OR id = receiver_id));
CREATE POLICY "Authenticated users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = receiver_id));

-- RLS Policies for notifications table
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- RLS Policies for technical_team table
CREATE POLICY "Anyone can read technical team" ON public.technical_team FOR SELECT USING (true);
CREATE POLICY "Technical members can update own status" ON public.technical_team FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = technical_team.id));
CREATE POLICY "System can insert technical team" ON public.technical_team FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_complaints_raised_by ON public.complaints(raised_by);
CREATE INDEX idx_complaints_volunteer_id ON public.complaints(volunteer_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_category ON public.complaints(category);
CREATE INDEX idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for complaint photos
INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-photos', 'complaint-photos', true);

-- Storage policies for complaint photos
CREATE POLICY "Anyone can view complaint photos" ON storage.objects FOR SELECT USING (bucket_id = 'complaint-photos');
CREATE POLICY "Authenticated users can upload complaint photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'complaint-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE USING (bucket_id = 'complaint-photos' AND auth.uid() = owner);
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE USING (bucket_id = 'complaint-photos' AND auth.uid() = owner);
