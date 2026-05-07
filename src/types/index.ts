export type Rarity = "common" | "rare" | "epic" | "legendary" | "special";

export interface Card {
  id: number;
  title: string;
  description: string;
  rarity: Rarity;
  category: string;
  icon: string;
}

export interface Profile {
  id: string;
  couple_id?: string;
  invite_code?: string;
  display_name: string;
  avatar_url?: string;
  gender?: string;
  age?: number;
  bio?: string;
  birth_date?: string;
  has_seen_tutorial?: boolean;
  has_seen_setup_tutorial?: boolean;
}

export interface Game {
  id: string;
  couple_id: string;
  status: 'active' | 'finished';
  created_at: string;
}

export interface PlayerCard {
  id: string;
  game_id: string;
  user_id: string;
  card_id: number;
  status: 'in_hand' | 'pending' | 'active' | 'discarded';
  played_at?: string;
  is_unblockable?: boolean;
  is_double?: boolean;
}
