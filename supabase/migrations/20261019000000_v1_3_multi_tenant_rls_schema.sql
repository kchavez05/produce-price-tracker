-- =============================================================================
-- PantryBot v1.3 Migration: Multi-Tenant PostgreSQL Schema & Row-Level Security
-- Ticket #27 (#524): Strict PII Minimization + Database-Level Isolation (RLS)
-- =============================================================================

-- 1. User Profiles Table (Strict PII Boundary)
-- Only stores opaque UUID, email, optional display name/avatar, and SSO provider.
-- Zero passwords, zero street addresses, zero phone numbers, zero payment data.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'PantryBot Shopper',
  avatar_url TEXT,
  provider TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google', 'apple')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  default_zip TEXT NOT NULL DEFAULT '80542',
  favorite_store_ids TEXT[] NOT NULL DEFAULT ARRAY[
    'KING_SOOPERS',
    'SAFEWAY',
    'ALDI',
    'WALMART',
    'TARGET',
    'SPROUTS'
  ],
  macro_goal TEXT NOT NULL DEFAULT 'ANY',
  dietary_constraints TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  vessel_archetype TEXT NOT NULL DEFAULT 'ANY',
  target_servings INTEGER NOT NULL DEFAULT 6 CHECK (target_servings IN (4, 6, 8)),
  pinned_ingredient_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  on_hand_ingredient_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Cloud Virtual Freezer Inventory Table
CREATE TABLE IF NOT EXISTS public.user_freezer_items (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  canonical_ingredient_id TEXT NOT NULL,
  ingredient_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity_lb_or_doz NUMERIC(8, 2) NOT NULL CHECK (quantity_lb_or_doz > 0),
  unit TEXT NOT NULL DEFAULT 'lb' CHECK (unit IN ('lb', 'doz')),
  purchase_price_per_unit NUMERIC(8, 2) NOT NULL,
  regular_price_per_unit NUMERIC(8, 2) NOT NULL,
  total_cost_basis NUMERIC(10, 2) NOT NULL,
  estimated_savings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  store TEXT NOT NULL,
  store_banner TEXT NOT NULL,
  purchased_at_iso TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id),
  UNIQUE (user_id, canonical_ingredient_id)
);

-- 4. Cloud Saved Meal-Prep Recipes Table
CREATE TABLE IF NOT EXISTS public.user_saved_recipes (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  style TEXT NOT NULL,
  dish_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Indexes for fast multi-tenant lookups
CREATE INDEX IF NOT EXISTS idx_user_freezer_items_user_id
  ON public.user_freezer_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_user_id
  ON public.user_saved_recipes(user_id);

-- =============================================================================
-- Enable Row-Level Security (RLS) on All User Tables
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_freezer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_recipes ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.users FOR DELETE
  USING (auth.uid() = id);

-- Policies for public.user_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for public.user_freezer_items
CREATE POLICY "Users can view their own freezer items"
  ON public.user_freezer_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own freezer items"
  ON public.user_freezer_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own freezer items"
  ON public.user_freezer_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own freezer items"
  ON public.user_freezer_items FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for public.user_saved_recipes
CREATE POLICY "Users can view their own saved recipes"
  ON public.user_saved_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved recipes"
  ON public.user_saved_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved recipes"
  ON public.user_saved_recipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved recipes"
  ON public.user_saved_recipes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- Automatic Profile & Preferences Provisioning Trigger on OAuth Sign-Up
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_provider TEXT;
  clean_provider TEXT;
  derived_name TEXT;
BEGIN
  raw_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'google');
  IF raw_provider = 'apple' THEN
    clean_provider := 'apple';
  ELSE
    clean_provider := 'google';
  END IF;

  derived_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(COALESCE(NEW.email, 'Shopper'), '@', 1)
  );

  INSERT INTO public.users (id, email, display_name, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    derived_name,
    NEW.raw_user_meta_data->>'avatar_url',
    clean_provider
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), public.users.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
