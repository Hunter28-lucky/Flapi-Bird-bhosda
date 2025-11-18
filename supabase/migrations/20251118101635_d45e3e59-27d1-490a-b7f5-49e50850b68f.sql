-- Create game rooms table for multiplayer
CREATE TABLE public.game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'waiting',
  started_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT room_code_length CHECK (char_length(room_code) = 6)
);

-- Create room players table to track player states
CREATE TABLE public.room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE NOT NULL,
  player_name TEXT NOT NULL,
  bird_y REAL DEFAULT 250,
  velocity REAL DEFAULT 0,
  score INTEGER DEFAULT 0,
  is_alive BOOLEAN DEFAULT true,
  last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_player_per_room UNIQUE (room_id, player_name)
);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- Policies for game_rooms (public access for multiplayer)
CREATE POLICY "Anyone can view game rooms"
  ON public.game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create game rooms"
  ON public.game_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update game rooms"
  ON public.game_rooms FOR UPDATE
  USING (true);

-- Policies for room_players (public access for multiplayer)
CREATE POLICY "Anyone can view room players"
  ON public.room_players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert room players"
  ON public.room_players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update room players"
  ON public.room_players FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete room players"
  ON public.room_players FOR DELETE
  USING (true);

-- Enable realtime for multiplayer sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;