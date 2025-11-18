import { Button } from "@/components/simple-ui/Button";
import { Card } from "@/components/simple-ui/Card";

interface GameModeSelectorProps {
  onSelectMode: (mode: "single" | "multi") => void;
}

export const GameModeSelector = ({ onSelectMode }: GameModeSelectorProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-start via-game-sky-mid to-game-sky-end p-4">
      <Card className="p-6 sm:p-8 space-y-4 sm:space-y-6 bg-card/90 backdrop-blur-sm border-2 border-border w-full max-w-md">
        <h1 className="text-4xl sm:text-5xl font-black text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Flappy Amitabh
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground text-center">Choose your game mode</p>
        <div className="flex flex-col gap-3 sm:gap-4">
          <Button
            onClick={() => onSelectMode("single")}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg sm:text-xl px-8 sm:px-10 py-6 sm:py-7 rounded-xl shadow-game-card active:scale-95 transition-transform touch-none"
          >
            🎮 Single Player
          </Button>
          <Button
            onClick={() => onSelectMode("multi")}
            size="lg"
            variant="secondary"
            className="font-bold text-lg sm:text-xl px-8 sm:px-10 py-6 sm:py-7 rounded-xl shadow-game-card active:scale-95 transition-transform touch-none"
          >
            👥 Multiplayer
          </Button>
        </div>
      </Card>
    </div>
  );
};
