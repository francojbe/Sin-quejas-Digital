-- Sin Quejas Digital - Database Schema
-- Last updated: 2026-05-01

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    couple_id uuid,
    display_name text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    invite_code text UNIQUE,
    gender text,
    age integer,
    bio text,
    birth_date date
);

-- Table: cards_master
CREATE TABLE IF NOT EXISTS public.cards_master (
    id serial PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    rarity text CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'special')),
    category text,
    icon text,
    created_at timestamptz DEFAULT now()
);

-- Table: games
CREATE TABLE IF NOT EXISTS public.games (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id uuid NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'finished', 'pending_start')),
    created_at timestamptz DEFAULT now(),
    duration_days integer DEFAULT 15,
    start_date date DEFAULT CURRENT_DATE,
    restart_requests uuid[] DEFAULT '{}',
    last_event_data jsonb,
    frozen_until timestamptz,
    modifier_unblockable_by uuid REFERENCES public.profiles(id),
    modifier_double_by uuid REFERENCES public.profiles(id),
    break_requests uuid[] DEFAULT '{}'
);

-- Table: player_cards
CREATE TABLE IF NOT EXISTS public.player_cards (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    card_id integer REFERENCES public.cards_master(id),
    status text DEFAULT 'in_hand' CHECK (status IN ('in_hand', 'pending', 'active', 'discarded')),
    played_at timestamptz,
    created_at timestamptz DEFAULT now(),
    is_unblockable boolean DEFAULT false,
    is_double boolean DEFAULT false
);

-- Table: achievements
CREATE TABLE IF NOT EXISTS public.achievements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    rarity text CHECK (rarity IN ('bronze', 'silver', 'gold', 'diamond')),
    title text NOT NULL,
    description text,
    earned_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}',
    achievement_code text
);

-- Table: game_history
CREATE TABLE IF NOT EXISTS public.game_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id),
    action_type text NOT NULL,
    card_id integer REFERENCES public.cards_master(id),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- RLS Policies (Basic examples, should be refined based on actual logic)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- Note: The RPCs and triggers mentioned in the roadmap should also be implemented in the database.
