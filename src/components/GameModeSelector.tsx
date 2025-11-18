import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GameModeSelectorProps {
  onSelectMode: (mode: "single" | "multi") => void;
}

export const GameModeSelector = ({ onSelectMode }: GameModeSelectorProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-start via-game-sky-mid to-game-sky-end p-4">
      <Card className="p-8 space-y-6 bg-card/90 backdrop-blur-sm border-2 border-border">
        <h1 className="text-5xl font-black text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Flappy Amitabh
        </h1>
        <p className="text-muted-foreground text-center">Choose your game mode</p>
        <div className="flex flex-col gap-4">
          <Button
            onClick={() => onSelectMode("single")}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl px-10 py-7 rounded-xl shadow-game-card hover:scale-105 transition-transform"
          >
            🎮 Single Player
          </Button>
          <Button
            onClick={() => onSelectMode("multi")}
            size="lg"
            variant="secondary"
            className="font-bold text-xl px-10 py-7 rounded-xl shadow-game-card hover:scale-105 transition-transform"
          >
            👥 Multiplayer
          </Button>
        </div>
      </Card>
    </div>
  );
};
