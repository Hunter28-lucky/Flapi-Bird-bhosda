import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/simple-ui/Button";
import { Card } from "@/components/simple-ui/Card";
import { toast } from "@/lib/toast";
import { playJumpSound } from "@/utils/audioUtils";
import amitabhFace from "@/assets/amitabh-face.png";
import P2PMultiplayer, { GameState } from "@/lib/p2pMultiplayer";

interface MultiplayerGameProps {
  roomCode: string;
  playerName: string;
  isHost: boolean;
  onLeave: () => void;
}

interface Player {
  id: string;
  name: string;
  birdY: number;
  velocity: number;
  score: number;
  isAlive: boolean;
}

export const MultiplayerGame = ({ roomCode, playerName, isHost, onLeave }: MultiplayerGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [connected, setConnected] = useState(false);
  const collisionAudioRef = useRef<HTMLAudioElement | null>(null);
  const p2pRef = useRef<P2PMultiplayer | null>(null);

  const gameRef = useRef({
    myBird: { y: 250, velocity: 0, rotation: 0 },
    pipes: [] as Array<{ x: number; topHeight: number; gap: number; passed: boolean }>,
    frameCount: 0,
    score: 0,
    isAlive: true,
    image: null as HTMLImageElement | null,
  });

  const GRAVITY = 0.28;
  const JUMP_FORCE = -8.5;
  const BIRD_SIZE = 50;
  const PIPE_WIDTH = 80;
  const PIPE_GAP = 200;
  const PIPE_SPEED = 2.5;

  useEffect(() => {
    collisionAudioRef.current = new Audio("/sounds/collision.mp3");
    collisionAudioRef.current.volume = 0.7;

    const img = new Image();
    img.src = amitabhFace;
    img.onload = () => {
      gameRef.current.image = img;
    };

    // Initialize P2P connection
    p2pRef.current = new P2PMultiplayer(roomCode, playerName, {
      onPlayerJoined: (playerId, playerName) => {
        console.log(`Player joined: ${playerName}`);
        toast.success(`${playerName} joined!`);
        setPlayers(prev => {
          const newPlayers = new Map(prev);
          newPlayers.set(playerId, {
            id: playerId,
            name: playerName,
            birdY: 250,
            velocity: 0,
            score: 0,
            isAlive: true,
          });
          return newPlayers;
        });
      },
      onPlayerLeft: (playerId) => {
        console.log(`Player left: ${playerId}`);
        const player = players.get(playerId);
        if (player) {
          toast.info(`${player.name} left`);
        }
        setPlayers(prev => {
          const newPlayers = new Map(prev);
          newPlayers.delete(playerId);
          return newPlayers;
        });
      },
      onGameStateUpdate: (playerId, state) => {
        setPlayers(prev => {
          const newPlayers = new Map(prev);
          const player = newPlayers.get(playerId);
          if (player) {
            newPlayers.set(playerId, {
              ...player,
              birdY: state.birdY,
              velocity: state.velocity,
              score: state.score,
              isAlive: state.isAlive,
            });
          }
          return newPlayers;
        });
      },
      onRoomReady: () => {
        setConnected(true);
        toast.success(isHost ? "Room created! Share code: " + roomCode : "Connected to room!");
      },
    }, isHost);

    // Join or create room
    if (isHost) {
      p2pRef.current.createRoom();
    } else {
      p2pRef.current.joinRoom().catch((error) => {
        console.error("Failed to join room:", error);
        toast.error("Failed to join room");
        onLeave();
      });
    }

    return () => {
      p2pRef.current?.disconnect();
    };
  }, [roomCode, playerName, isHost]);

  const updateMyState = () => {
    if (!gameStarted || !p2pRef.current) return;

    p2pRef.current.sendGameState({
      birdY: gameRef.current.myBird.y,
      velocity: gameRef.current.myBird.velocity,
      score: gameRef.current.score,
      isAlive: gameRef.current.isAlive,
    });
  };

  const jump = () => {
    if (gameStarted && gameRef.current.isAlive) {
      gameRef.current.myBird.velocity = JUMP_FORCE;
      playJumpSound();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted) return;

    const ctx = canvas.getContext("2d")!;
    canvas.width = 800;
    canvas.height = 600;

    const gameLoop = () => {
      const game = gameRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw sky
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(1, "#E0F6FF");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (game.isAlive) {
        // Update physics
        game.myBird.velocity += GRAVITY;
        game.myBird.y += game.myBird.velocity;
        game.myBird.rotation = Math.min(Math.max(game.myBird.velocity * 3, -30), 90);

        // Generate pipes (increased interval for easier gameplay)
        if (game.frameCount % 110 === 0) {
          const topHeight = Math.random() * (canvas.height - PIPE_GAP - 200) + 100;
          game.pipes.push({ x: canvas.width, topHeight, gap: PIPE_GAP, passed: false });
        }

        // Update pipes
        game.pipes.forEach((pipe, index) => {
          pipe.x -= PIPE_SPEED;

          // Draw pipes
          ctx.fillStyle = "#2D5016";
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
          ctx.fillRect(pipe.x, pipe.topHeight + pipe.gap, PIPE_WIDTH, canvas.height);

          // Check scoring
          if (!pipe.passed && pipe.x + PIPE_WIDTH < 100) {
            pipe.passed = true;
            game.score++;
          }

          // Check collision
          if (
            100 + BIRD_SIZE > pipe.x &&
            100 < pipe.x + PIPE_WIDTH &&
            (game.myBird.y < pipe.topHeight || game.myBird.y + BIRD_SIZE > pipe.topHeight + pipe.gap)
          ) {
            game.isAlive = false;
            collisionAudioRef.current?.play();
          }

          // Remove off-screen pipes
          if (pipe.x + PIPE_WIDTH < 0) {
            game.pipes.splice(index, 1);
          }
        });

        // Check ground/ceiling collision
        if (game.myBird.y < 0 || game.myBird.y + BIRD_SIZE > canvas.height - 50) {
          game.isAlive = false;
          collisionAudioRef.current?.play();
        }
      }

      // Draw my bird
      if (game.image) {
        ctx.save();
        ctx.translate(100 + BIRD_SIZE / 2, game.myBird.y + BIRD_SIZE / 2);
        ctx.rotate((game.myBird.rotation * Math.PI) / 180);
        ctx.drawImage(game.image, -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
        ctx.restore();
      }

      // Draw other players
      players.forEach((player) => {
        if (player.isAlive && game.image) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.drawImage(game.image, 150, player.birdY, BIRD_SIZE, BIRD_SIZE);
          ctx.globalAlpha = 1;
          ctx.fillStyle = "white";
          ctx.font = "14px Arial";
          ctx.fillText(player.name, 150, player.birdY - 10);
          ctx.restore();
        }
      });

      // Draw ground
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

      // Draw scores
      ctx.fillStyle = "white";
      ctx.font = "24px Arial";
      ctx.fillText(`You: ${game.score}`, 10, 30);
      
      let yOffset = 60;
      players.forEach((player) => {
        ctx.fillText(`${player.name}: ${player.score}`, 10, yOffset);
        yOffset += 30;
      });

      game.frameCount++;
      updateMyState();

      if (game.isAlive) {
        requestAnimationFrame(gameLoop);
      }
    };

    requestAnimationFrame(gameLoop);
  }, [gameStarted, players]);

  const handleLeave = () => {
    p2pRef.current?.disconnect();
    onLeave();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-start via-game-sky-mid to-game-sky-end p-4">
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Room: {roomCode}</h2>
            <p className="text-sm text-muted-foreground">
              {connected ? `${players.size + 1} player(s)` : "Connecting..."}
            </p>
          </div>
          <Button onClick={handleLeave} variant="outline">
            Leave
          </Button>
        </div>

        {!gameStarted ? (
          <div className="text-center space-y-4">
            <p>Waiting for players...</p>
            {isHost && (
              <div className="p-4 bg-blue-100 rounded-lg">
                <p className="font-bold">Share this code:</p>
                <p className="text-3xl font-mono">{roomCode}</p>
              </div>
            )}
            <Button
              onClick={() => setGameStarted(true)}
              disabled={!connected}
              className="w-full"
            >
              Start Game
            </Button>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              onClick={jump}
              className="border-2 border-border rounded-lg cursor-pointer"
            />
            <p className="text-center text-sm">Click or tap to flap!</p>
          </>
        )}
      </Card>
    </div>
  );
};
