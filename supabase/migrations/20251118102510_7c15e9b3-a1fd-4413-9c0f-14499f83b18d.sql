-- Add database constraints for input validation
ALTER TABLE room_players ADD CONSTRAINT player_name_length CHECK (char_length(player_name) BETWEEN 1 AND 30);
ALTER TABLE game_rooms ADD CONSTRAINT room_code_format CHECK (room_code ~ '^[A-Z0-9]{6}$');