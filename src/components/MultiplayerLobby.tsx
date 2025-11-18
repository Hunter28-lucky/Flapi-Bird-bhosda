import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const playerNameSchema = z.string()
  .trim()
  .min(1, "Name is required")
  .max(30, "Name must be 30 characters or less")
  .regex(/^[a-zA-Z0-9\s_-]+$/, "Name can only contain letters, numbers, spaces, hyphens and underscores");

const roomCodeSchema = z.string()
  .trim()
  .length(6, "Room code must be 6 characters")
  .regex(/^[A-Z0-9]{6}$/, "Invalid room code format");

interface MultiplayerLobbyProps {
  onJoinRoom: (roomId: string, roomCode: string, playerName: string) => void;
  onBack: () => void;
}

export const MultiplayerLobby = ({ onJoinRoom, onBack }: MultiplayerLobbyProps) => {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    try {
      playerNameSchema.parse(playerName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
        return;
      }
    }

    setIsCreating(true);
    try {
      const code = generateRoomCode();
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .insert({ room_code: code })
        .select()
        .single();

      if (roomError) throw roomError;

      await supabase
        .from("room_players")
        .insert({
          room_id: room.id,
          player_name: playerName.trim(),
        });

      onJoinRoom(room.id, code, playerName.trim());
    } catch (error) {
      console.error("Error creating room:", error);
      toast({ title: "Failed to create room", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    try {
      playerNameSchema.parse(playerName);
      roomCodeSchema.parse(roomCode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
        return;
      }
    }

    try {
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select()
        .eq("room_code", roomCode.toUpperCase())
        .single();

      if (roomError) {
        toast({ title: "Room not found", variant: "destructive" });
        return;
      }

      const { error: playerError } = await supabase
        .from("room_players")
        .insert({
          room_id: room.id,
          player_name: playerName.trim(),
        });

      if (playerError) {
        toast({ title: "Failed to join room", variant: "destructive" });
        return;
      }

      onJoinRoom(room.id, roomCode.toUpperCase(), playerName.trim());
    } catch (error) {
      console.error("Error joining room:", error);
      toast({ title: "Failed to join room", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-start via-game-sky-mid to-game-sky-end p-4">
      <Card className="p-8 space-y-6 w-full max-w-md bg-card/90 backdrop-blur-sm border-2 border-border">
        <h2 className="text-4xl font-black text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Multiplayer Mode
        </h2>
        
        <div className="space-y-4">
          <Input
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="text-lg"
          />

          <Button
            onClick={createRoom}
            disabled={isCreating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6"
          >
            🎮 Create New Game
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or join existing game</span>
            </div>
          </div>

          <Input
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="text-lg"
            maxLength={6}
          />

          <Button
            onClick={joinRoom}
            variant="secondary"
            className="w-full font-bold text-lg py-6"
          >
            👥 Join Game
          </Button>

          <Button
            onClick={onBack}
            variant="outline"
            className="w-full"
          >
            ← Back
          </Button>
        </div>
      </Card>
    </div>
  );
};
