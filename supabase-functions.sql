-- Additional SQL functions for Sahayata
-- Run this in your Supabase SQL Editor after running supabase-schema.sql

-- Function to increment user points
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET points = points + points_to_add
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get complaint statistics
CREATE OR REPLACE FUNCTION get_complaint_stats(user_id_param UUID DEFAULT NULL)
RETURNS TABLE(
  total_complaints BIGINT,
  open_complaints BIGINT,
  in_progress_complaints BIGINT,
  resolved_complaints BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_complaints,
    COUNT(*) FILTER (WHERE status = 'open') as open_complaints,
    COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_complaints,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_complaints
  FROM public.complaints
  WHERE user_id_param IS NULL OR raised_by = user_id_param;
END;
$$ LANGUAGE plpgsql;
