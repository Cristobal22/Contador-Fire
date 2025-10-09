-- Add cost_center_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN cost_center_id INTEGER,
ADD CONSTRAINT fk_cost_center
  FOREIGN KEY(cost_center_id)
  REFERENCES public.cost_centers(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.cost_center_id IS 'ID of the cost center from the cost_centers table';
