import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playJumpSound } from "@/utils/audioUtils";
import amitabhFace from "@/assets/amitabh-face.png";

interface MultiplayerGameProps {
  roomId: string;
  roomCode: string;
  playerName: string;
  onLeave: () => void;
}

interface Player {
  id: string;
  player_name: string;
  bird_y: number;
  velocity: number;
  score: number;
  is_alive: boolean;
}

export const MultiplayerGame = ({ roomId, roomCode, playerName, onLeave }: MultiplayerGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string>("");
  const { toast } = useToast();
  const collisionAudioRef = useRef<HTMLAudioElement | null>(null);

  const gameRef = useRef({
    myBird: { y: 250, velocity: 0, rotation: 0 },
    pipes: [] as Array<{ x: number; topHeight: number; gap: number; passed: boolean }>,
    frameCount: 0,
    score: 0,
    isAlive: true,
    image: null as HTMLImageElement | null,
  });

  const GRAVITY = 0.35;
  const JUMP_FORCE = -9;
  const BIRD_SIZE = 50;
  const PIPE_WIDTH = 80;
  const PIPE_GAP = 180;
  const PIPE_SPEED = 3;

  useEffect(() => {
    collisionAudioRef.current = new Audio("/sounds/collision.mp3");
    collisionAudioRef.current.volume = 0.7;

    const img = new Image();
    img.src = amitabhFace;
    img.onload = () => {
      gameRef.current.image = img;
    };
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("room_players")
        .select()
        .eq("room_id", roomId);

      if (data) {
        setPlayers(data);
        const me = data.find((p) => p.player_name === playerName);
        if (me) setMyPlayerId(me.id);
      }
    };

    fetchPlayers();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log("Player update:", payload);
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, playerName]);

  const updateMyState = async () => {
    if (!myPlayerId || !gameStarted) return;

    await supabase
      .from("room_players")
      .update({
        bird_y: gameRef.current.myBird.y,
        velocity: gameRef.current.myBird.velocity,
        score: gameRef.current.score,
        is_alive: gameRef.current.isAlive,
        last_update: new Date().toISOString(),
      })
      .eq("id", myPlayerId);
  };

  const jump = () => {
    if (gameStarted && gameRef.current.isAlive) {
      gameRef.current.myBird.velocity = JUMP_FORCE;
      playJumpSound();
    }
  };

  // Spacebar control
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameStarted]);

  const startGame = async () => {
    gameRef.current.myBird = { y: 250, velocity: 0, rotation: 0 };
    gameRef.current.pipes = [];
    gameRef.current.frameCount = 0;
    gameRef.current.score = 0;
    gameRef.current.isAlive = true;
    setGameStarted(true);

    await supabase
      .from("game_rooms")
      .update({ status: "playing", started_at: new Date().toISOString() })
      .eq("id", roomId);
  };

  useEffect(() => {
    if (!gameStarted) return;

    const interval = setInterval(updateMyState, 100);
    return () => clearInterval(interval);
  }, [gameStarted, myPlayerId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = () => {
      const game = gameRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "hsl(200, 100%, 85%)");
      gradient.addColorStop(0.5, "hsl(195, 100%, 88%)");
      gradient.addColorStop(1, "hsl(190, 85%, 92%)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameStarted && game.isAlive) {
        game.frameCount++;

        // Update physics
        game.myBird.velocity += GRAVITY;
        game.myBird.y += game.myBird.velocity;
        game.myBird.rotation = Math.min(Math.max(game.myBird.velocity * 3, -30), 90);

        // Generate pipes
        if (game.frameCount % 90 === 0) {
          const topHeight = Math.random() * (canvas.height - PIPE_GAP - 200) + 100;
          game.pipes.push({ x: canvas.width, topHeight, gap: PIPE_GAP, passed: false });
        }

        // Update pipes
        game.pipes.forEach((pipe, index) => {
          pipe.x -= PIPE_SPEED;

          // Draw pipes
          const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
          pipeGradient.addColorStop(0, "hsl(142, 76%, 40%)");
          pipeGradient.addColorStop(0.5, "hsl(142, 80%, 50%)");
          pipeGradient.addColorStop(1, "hsl(142, 76%, 40%)");
          ctx.fillStyle = pipeGradient;
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

          ctx.fillStyle = "hsl(142, 76%, 28%)";
          ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, PIPE_WIDTH + 10, 30);

          const bottomY = pipe.topHeight + pipe.gap;
          ctx.fillStyle = pipeGradient;
          ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, canvas.height - bottomY);
          ctx.fillStyle = "hsl(142, 76%, 28%)";
          ctx.fillRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 30);

          // Score
          if (!pipe.passed && pipe.x + PIPE_WIDTH < canvas.width / 2 - BIRD_SIZE / 2) {
            pipe.passed = true;
            game.score++;
          }

          // Collision detection
          const birdLeft = canvas.width / 2 - BIRD_SIZE / 2;
          const birdRight = canvas.width / 2 + BIRD_SIZE / 2;
          const birdTop = game.myBird.y;
          const birdBottom = game.myBird.y + BIRD_SIZE;

          if (
            pipe.x < birdRight &&
            pipe.x + PIPE_WIDTH > birdLeft &&
            (birdTop < pipe.topHeight || birdBottom > bottomY)
          ) {
            collisionAudioRef.current?.play().catch(console.log);
            game.isAlive = false;
          }

          if (pipe.x + PIPE_WIDTH < 0) {
            game.pipes.splice(index, 1);
          }
        });

        // Ground/ceiling collision
        if (game.myBird.y + BIRD_SIZE > canvas.height || game.myBird.y < 0) {
          collisionAudioRef.current?.play().catch(console.log);
          game.isAlive = false;
        }
      }

      // Draw my bird
      ctx.save();
      ctx.translate(canvas.width / 2, game.myBird.y + BIRD_SIZE / 2);
      ctx.rotate((game.myBird.rotation * Math.PI) / 180);
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      if (game.image) {
        ctx.drawImage(game.image, -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
      }
      ctx.restore();

      // Draw other players
      players
        .filter((p) => p.player_name !== playerName && p.is_alive)
        .forEach((p) => {
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.translate(canvas.width / 2 + 80, p.bird_y + BIRD_SIZE / 2);
          if (game.image) {
            ctx.drawImage(game.image, -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
          }
          ctx.restore();

          // Draw player name
          ctx.fillStyle = "white";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(p.player_name, canvas.width / 2 + 80, p.bird_y - 10);
        });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStarted, players, playerName]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-start via-game-sky-mid to-game-sky-end p-4">
      <Card className="mb-4 p-4 bg-card/90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Room Code</p>
            <p className="text-2xl font-black text-primary">{roomCode}</p>
          </div>
          <div className="border-l pl-4">
            <p className="text-sm text-muted-foreground">Players</p>
            <p className="text-xl font-bold">{players.length} online</p>
          </div>
        </div>
      </Card>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="border-4 border-primary/30 rounded-2xl shadow-game-card cursor-pointer"
          onClick={gameStarted ? jump : undefined}
        />

        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-black/70 rounded-2xl">
            <div className="text-center space-y-6 p-8">
              <h2 className="text-4xl font-black text-white">Ready to Play?</h2>
              <p className="text-white/80">Share the room code with your friend!</p>
              <Button onClick={startGame} size="lg" className="bg-primary hover:bg-primary/90 font-bold text-xl px-10 py-7">
                🚀 Start Game
              </Button>
            </div>
          </div>
        )}

        {gameStarted && (
          <div className="absolute top-6 left-0 right-0 text-center">
            <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-game-score">
              <span className="text-2xl">🏆</span>
              <p className="text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {gameRef.current.score}
              </p>
            </div>
          </div>
        )}
      </div>

      <Button onClick={onLeave} variant="outline" className="mt-4">
        ← Leave Game
      </Button>
    </div>
  );
};
