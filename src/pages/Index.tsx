import { useState } from "react";
import { FlappyGame } from "@/components/FlappyGameEnhanced";
import { GameModeSelector } from "@/components/GameModeSelector";
import { MultiplayerLobby } from "@/components/MultiplayerLobby";
import { MultiplayerGame } from "@/components/MultiplayerGame";
import { ImageUploader } from "@/components/ImageUploader";
import amitabhFace from "@/assets/amitabh-face.png";

const Index = () => {
  const [mode, setMode] = useState<"menu" | "single" | "multi" | "playing">("menu");
  const [customImage, setCustomImage] = useState<string | undefined>(undefined);
  const [multiplayerRoom, setMultiplayerRoom] = useState<{
    roomCode: string;
    playerName: string;
    isHost: boolean;
  } | null>(null);

  if (mode === "menu") {
    return <GameModeSelector onSelectMode={(selectedMode) => setMode(selectedMode)} />;
  }

  if (mode === "single") {
    return (
      <div>
        <FlappyGame customImage={customImage} />
        <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50">
          <button
            onClick={() => setMode("menu")}
            className="bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border hover:bg-card transition-all hover:scale-105"
          >
            ← Menu
          </button>
          <ImageUploader
            onImageSelect={setCustomImage}
            currentImage={customImage}
            onReset={() => setCustomImage(undefined)}
          />
        </div>
      </div>
    );
  }

  if (mode === "multi") {
    return (
      <MultiplayerLobby
        onJoinRoom={(roomCode, playerName, isHost) => {
          setMultiplayerRoom({ roomCode, playerName, isHost });
          setMode("playing");
        }}
        onBack={() => setMode("menu")}
      />
    );
  }

  if (mode === "playing" && multiplayerRoom) {
    return (
      <MultiplayerGame
        roomCode={multiplayerRoom.roomCode}
        playerName={multiplayerRoom.playerName}
        isHost={multiplayerRoom.isHost}
        onLeave={() => {
          setMultiplayerRoom(null);
          setMode("menu");
        }}
      />
    );
  }

  return null;
};

export default Index;
