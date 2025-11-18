import { useState } from "react";
import { Button } from "@/components/simple-ui/Button";
import { Input } from "@/components/simple-ui/Input";
import { Card } from "@/components/simple-ui/Card";
import { toast } from "@/lib/toast";
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
  onJoinRoom: (roomCode: string, playerName: string, isHost: boolean) => void;
  onBack: () => void;
}

export const MultiplayerLobby = ({ onJoinRoom, onBack }: MultiplayerLobbyProps) => {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = () => {
    try {
      playerNameSchema.parse(playerName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsCreating(true);
    try {
      const code = generateRoomCode();
      
      // Store room in localStorage so others can find it
      const roomData = {
        code,
        host: playerName.trim(),
        createdAt: Date.now(),
      };
      localStorage.setItem(`room_${code}`, JSON.stringify(roomData));
      
      toast.success(`Room created! Share code: ${code}`);
      onJoinRoom(code, playerName.trim(), true);
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create room");
      setIsCreating(false);
    }
  };

  const joinRoom = () => {
    try {
      playerNameSchema.parse(playerName);
      roomCodeSchema.parse(roomCode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    // Check if room exists in localStorage
    const roomData = localStorage.getItem(`room_${roomCode.toUpperCase()}`);
    if (!roomData) {
      toast.error(`Room "${roomCode.toUpperCase()}" not found. Please check the code or create a new room.`);
      return;
    }

    toast.success("Joining room...");
    onJoinRoom(roomCode.toUpperCase(), playerName.trim(), false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-start via-game-sky-mid to-game-sky-end p-4">
      <Card className="p-8 space-y-6 w-full max-w-md bg-card/90 backdrop-blur-sm border-2 border-border">
        <div>
          <h2 className="text-4xl font-black text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Peer-to-Peer Multiplayer
          </h2>
          <p className="text-center text-sm text-muted-foreground mt-2">
            No server needed! Play directly with friends
          </p>
        </div>
        
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

        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>💡 Tip: Both players must be online at the same time</p>
          <p>🌐 Works on same network or using STUN servers</p>
        </div>
      </Card>
    </div>
  );
};
