import { Button } from "@/components/simple-ui/Button";
import { Card } from "@/components/simple-ui/Card";
import { Instagram } from "lucide-react";

interface GameModeSelectorProps {
  onSelectMode: (mode: "single" | "multi") => void;
}

export const GameModeSelector = ({ onSelectMode }: GameModeSelectorProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-start via-game-sky-mid to-game-sky-end p-4">
      <Card className="p-6 sm:p-8 space-y-4 sm:space-y-6 bg-card/90 backdrop-blur-sm border-2 border-border w-full max-w-md">
        <h1 className="text-4xl sm:text-5xl font-black text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Flappy Bhondu Janta Party
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

        {/* High-contrast bold tagline & website promotion inside the card */}
        <div className="pt-4 border-t border-border flex flex-col items-center gap-3">
          <p className="text-pink-500 font-extrabold text-sm sm:text-base tracking-wide animate-pulse text-center">
            💅 Baddies can follow me
          </p>
          <a 
            href="https://www.instagram.com/krish_yogi_12/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-accent/15 border-2 border-accent/40 hover:border-accent/70 px-4 py-3 rounded-xl text-center font-extrabold text-sm text-foreground hover:bg-accent/25 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-md block"
          >
            🚀 Want a custom website/game? DM me!
          </a>
        </div>
      </Card>
      
      <div className="mt-8 text-center bg-black/20 px-6 py-3 rounded-full backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-colors animate-fade-in shadow-lg">
        <p className="text-white/80 text-sm sm:text-base font-medium flex items-center justify-center gap-2">
          Fun Creator: 
          <a 
            href="https://www.instagram.com/krish_yogi_12/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 font-bold transition-transform hover:scale-105 active:scale-95"
          >
            <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
            @krish_yogi_12
          </a>
        </p>
      </div>
    </div>
  );
};
