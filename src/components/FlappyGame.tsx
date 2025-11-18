import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/simple-ui/Button";
import amitabhFace from "@/assets/amitabh-face.png";
import { playJumpSound } from "@/utils/audioUtils";

interface Pipe {
  x: number;
  topHeight: number;
  gap: number;
  passed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface FlappyGameProps {
  customImage?: string;
}

export const FlappyGame = ({ customImage }: FlappyGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("flappyHighScore");
    return saved ? parseInt(saved) : 0;
  });

  const gameRef = useRef({
    bird: {
      y: 250,
      velocity: 0,
      rotation: 0,
    },
    pipes: [] as Pipe[],
    frameCount: 0,
    image: null as HTMLImageElement | null,
    particles: [] as Particle[],
  });

  const collisionAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    collisionAudioRef.current = new Audio("/sounds/collision.mp3");
    collisionAudioRef.current.volume = 0.7;
  }, []);

  const GRAVITY = 0.28; // Reduced for smoother fall and easier gameplay
  const JUMP_FORCE = -8.5; // Slightly less powerful for better control
  const BIRD_SIZE = 50;
  const PIPE_WIDTH = 80;
  const PIPE_GAP = 200; // Increased gap for easier passage
  const PIPE_SPEED = 2.5; // Slower pipes for easier gameplay

  useEffect(() => {
    const img = new Image();
    img.src = customImage || amitabhFace;
    img.onload = () => {
      gameRef.current.image = img;
    };
  }, [customImage]);

  const startGame = () => {
    gameRef.current.bird = {
      y: 250,
      velocity: 0,
      rotation: 0,
    };
    gameRef.current.pipes = [];
    gameRef.current.frameCount = 0;
    setScore(0);
    setGameState("playing");
  };

  const jump = () => {
    if (gameState === "playing") {
      gameRef.current.bird.velocity = JUMP_FORCE;
      playJumpSound();
      // Create jump particles
      for (let i = 0; i < 8; i++) {
        gameRef.current.particles.push({
          x: 100,
          y: gameRef.current.bird.y + 25,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 4 + 2,
          life: 1,
        });
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = () => {
      const game = gameRef.current;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw enhanced gradient background with animated sky
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      const skyOffset = Math.sin(game.frameCount * 0.001) * 5;
      gradient.addColorStop(0, `hsl(200, 100%, ${85 + skyOffset}%)`);
      gradient.addColorStop(0.5, `hsl(195, 100%, ${88 + skyOffset}%)`);
      gradient.addColorStop(1, `hsl(190, 85%, ${92 + skyOffset}%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw enhanced clouds with soft shadows
      const drawCloud = (x: number, y: number, size: number, opacity: number = 0.7) => {
        // Shadow
        ctx.fillStyle = `rgba(150, 180, 220, ${opacity * 0.3})`;
        ctx.beginPath();
        ctx.arc(x + 2, y + 4, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8 + 2, y + 4, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 1.6 + 2, y + 4, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Cloud
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 1.6, y, size, 0, Math.PI * 2);
        ctx.fill();
      };

      const cloudOffset = (game.frameCount * 0.2) % canvas.width;
      drawCloud(-cloudOffset + 100, 80, 25, 0.8);
      drawCloud(-cloudOffset + 300, 150, 30, 0.7);
      drawCloud(-cloudOffset + canvas.width + 50, 100, 28, 0.75);
      drawCloud(-cloudOffset + canvas.width + 250, 120, 26, 0.65);

      if (gameState === "playing") {
        game.frameCount++;

        // Update bird physics
        game.bird.velocity += GRAVITY;
        game.bird.y += game.bird.velocity;
        game.bird.rotation = Math.min(Math.max(game.bird.velocity * 3, -30), 90);

        // Generate pipes (increased interval for easier gameplay)
        if (game.frameCount % 110 === 0) { // Changed from 90 to 110 frames
          const topHeight = Math.random() * (canvas.height - PIPE_GAP - 200) + 100;
          game.pipes.push({
            x: canvas.width,
            topHeight,
            gap: PIPE_GAP,
            passed: false,
          });
        }

        // Update and draw particles
        game.particles = game.particles.filter((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.3; // Gravity for particles
          particle.life -= 0.02;

          if (particle.life > 0) {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = "hsl(48, 96%, 53%)";
            ctx.shadowColor = "hsl(48, 96%, 53%)";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return true;
          }
          return false;
        });

        // Update and draw pipes with enhanced 3D effect
        game.pipes.forEach((pipe, index) => {
          pipe.x -= PIPE_SPEED;

          // Pipe shadow
          ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
          ctx.fillRect(pipe.x + 5, 0, PIPE_WIDTH, pipe.topHeight);
          ctx.fillRect(pipe.x + 5, pipe.topHeight + pipe.gap, PIPE_WIDTH, canvas.height);

          // Draw pipes with enhanced 3D gradient
          const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
          pipeGradient.addColorStop(0, "hsl(142, 76%, 28%)");
          pipeGradient.addColorStop(0.2, "hsl(142, 76%, 45%)");
          pipeGradient.addColorStop(0.5, "hsl(142, 76%, 40%)");
          pipeGradient.addColorStop(0.8, "hsl(142, 76%, 45%)");
          pipeGradient.addColorStop(1, "hsl(142, 76%, 28%)");

          // Top pipe body
          ctx.fillStyle = pipeGradient;
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

          // Pipe highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fillRect(pipe.x + 8, 0, 15, pipe.topHeight);

          // Pipe darker edge
          ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
          ctx.fillRect(pipe.x + PIPE_WIDTH - 10, 0, 10, pipe.topHeight);

          // Pipe cap (top) with gradient
          const capGradient = ctx.createLinearGradient(pipe.x, pipe.topHeight - 30, pipe.x, pipe.topHeight);
          capGradient.addColorStop(0, "hsl(142, 80%, 52%)");
          capGradient.addColorStop(1, "hsl(142, 80%, 42%)");
          ctx.fillStyle = capGradient;
          ctx.fillRect(pipe.x - 6, pipe.topHeight - 30, PIPE_WIDTH + 12, 30);

          // Cap highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.fillRect(pipe.x - 4, pipe.topHeight - 30, 20, 30);

          // Cap darker edge
          ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
          ctx.fillRect(pipe.x + PIPE_WIDTH - 6, pipe.topHeight - 30, 12, 30);

          // Bottom pipe body
          const bottomPipeY = pipe.topHeight + pipe.gap;
          ctx.fillStyle = pipeGradient;
          ctx.fillRect(pipe.x, bottomPipeY, PIPE_WIDTH, canvas.height - bottomPipeY);

          // Bottom pipe highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fillRect(pipe.x + 8, bottomPipeY, 15, canvas.height - bottomPipeY);

          // Bottom pipe darker edge
          ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
          ctx.fillRect(pipe.x + PIPE_WIDTH - 10, bottomPipeY, 10, canvas.height - bottomPipeY);

          // Pipe cap (bottom) with gradient
          const bottomCapGradient = ctx.createLinearGradient(pipe.x, bottomPipeY, pipe.x, bottomPipeY + 30);
          bottomCapGradient.addColorStop(0, "hsl(142, 80%, 52%)");
          bottomCapGradient.addColorStop(1, "hsl(142, 80%, 42%)");
          ctx.fillStyle = bottomCapGradient;
          ctx.fillRect(pipe.x - 6, bottomPipeY, PIPE_WIDTH + 12, 30);

          // Bottom cap highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.fillRect(pipe.x - 4, bottomPipeY, 20, 30);

          // Bottom cap darker edge
          ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
          ctx.fillRect(pipe.x + PIPE_WIDTH - 6, bottomPipeY, 12, 30);

          // Score when passing pipe
          if (!pipe.passed && pipe.x + PIPE_WIDTH < canvas.width / 2 - BIRD_SIZE / 2) {
            pipe.passed = true;
            setScore((s) => {
              const newScore = s + 1;
              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem("flappyHighScore", newScore.toString());
              }
              return newScore;
            });
            // Score particles
            for (let i = 0; i < 12; i++) {
              game.particles.push({
                x: canvas.width / 2,
                y: game.bird.y,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * 6 - 3,
                life: 1,
              });
            }
          }

          // Check collision
          const birdLeft = canvas.width / 2 - BIRD_SIZE / 2;
          const birdRight = canvas.width / 2 + BIRD_SIZE / 2;
          const birdTop = game.bird.y;
          const birdBottom = game.bird.y + BIRD_SIZE;

          if (
            pipe.x < birdRight &&
            pipe.x + PIPE_WIDTH > birdLeft &&
            (birdTop < pipe.topHeight || birdBottom > bottomPipeY)
          ) {
            if (collisionAudioRef.current) {
              collisionAudioRef.current.currentTime = 0;
              collisionAudioRef.current.play().catch(e => console.log("Audio play failed:", e));
            }
            setGameState("gameOver");
          }

          // Remove off-screen pipes
          if (pipe.x + PIPE_WIDTH < 0) {
            game.pipes.splice(index, 1);
          }
        });

        // Check ground/ceiling collision
        if (game.bird.y + BIRD_SIZE > canvas.height || game.bird.y < 0) {
          if (collisionAudioRef.current) {
            collisionAudioRef.current.currentTime = 0;
            collisionAudioRef.current.play().catch(e => console.log("Audio play failed:", e));
          }
          setGameState("gameOver");
        }
      }

      // Draw bird with enhanced effects
      if (game.image) {
        ctx.save();
        ctx.translate(canvas.width / 2, game.bird.y + BIRD_SIZE / 2);
        ctx.rotate((game.bird.rotation * Math.PI) / 180);

        // Enhanced shadow with glow
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 8;

        // Outer glow effect
        ctx.shadowColor = "rgba(52, 211, 153, 0.5)";
        ctx.shadowBlur = 35;

        // Draw main bird
        ctx.drawImage(
          game.image,
          -BIRD_SIZE / 2,
          -BIRD_SIZE / 2,
          BIRD_SIZE,
          BIRD_SIZE
        );

        // Motion trail effect when moving fast
        if (Math.abs(game.bird.velocity) > 3) {
          ctx.globalAlpha = 0.25;
          ctx.shadowBlur = 0;
          ctx.drawImage(
            game.image,
            -BIRD_SIZE / 2 - game.bird.velocity * 0.8,
            -BIRD_SIZE / 2,
            BIRD_SIZE,
            BIRD_SIZE
          );
          ctx.globalAlpha = 1;
        }

        ctx.restore();
      } else {
        // Fallback if image hasn't loaded
        ctx.save();
        ctx.translate(canvas.width / 2, game.bird.y + BIRD_SIZE / 2);
        ctx.rotate((game.bird.rotation * Math.PI) / 180);
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = "hsl(25, 95%, 53%)";
        ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
        ctx.restore();
      }

      // Draw ground with enhanced 3D effect
      const groundHeight = 80;
      const groundGradient = ctx.createLinearGradient(0, canvas.height - groundHeight, 0, canvas.height);
      groundGradient.addColorStop(0, "hsl(30, 60%, 48%)");
      groundGradient.addColorStop(0.2, "hsl(30, 60%, 42%)");
      groundGradient.addColorStop(0.5, "hsl(30, 60%, 38%)");
      groundGradient.addColorStop(1, "hsl(30, 60%, 28%)");
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

      // Ground texture pattern with animation
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      const patternOffset = (game.frameCount * 2) % 40;
      for (let i = -40; i < canvas.width + 40; i += 40) {
        // Brick pattern
        ctx.fillRect(i + patternOffset, canvas.height - groundHeight + 10, 35, 4);
        ctx.fillRect(i + patternOffset + 10, canvas.height - groundHeight + 25, 35, 4);
        ctx.fillRect(i + patternOffset, canvas.height - groundHeight + 40, 35, 4);
        ctx.fillRect(i + patternOffset + 10, canvas.height - groundHeight + 55, 35, 4);
      }

      // Ground highlight on top
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 3);

      // Ground shadow line
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 1);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, highScore]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-start via-game-sky-mid to-game-sky-end p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="border-4 border-primary/30 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] cursor-pointer transition-transform hover:scale-[1.01]"
          onClick={gameState === "playing" ? jump : undefined}
        />
        
        {gameState !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-black/70 rounded-2xl animate-fade-in">
            <div className="text-center space-y-6 p-8 max-w-sm">
              <h1 className="text-6xl font-black text-white mb-4 drop-shadow-[0_4px_20px_rgba(255,255,255,0.3)] animate-scale-in">
                {gameState === "menu" ? "Flappy Amitabh" : "Game Over!"}
              </h1>
              {gameState === "gameOver" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-secondary/20 backdrop-blur-sm border-2 border-secondary rounded-xl p-4">
                    <p className="text-sm text-white/80 uppercase tracking-wider mb-1">Your Score</p>
                    <p className="text-5xl font-black text-secondary drop-shadow-lg">{score}</p>
                  </div>
                  <div className="bg-primary/20 backdrop-blur-sm border border-primary/50 rounded-lg p-3">
                    <p className="text-xs text-white/70 uppercase tracking-wider mb-1">Best Score</p>
                    <p className="text-2xl font-bold text-white">{highScore}</p>
                  </div>
                </div>
              )}
              <Button
                onClick={startGame}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl px-10 py-7 rounded-xl shadow-[0_10px_30px_-5px_rgba(34,197,94,0.5)] hover:shadow-[0_15px_40px_-5px_rgba(34,197,94,0.6)] transition-all hover:scale-105 active:scale-95"
              >
                {gameState === "menu" ? "🚀 Start Game" : "🔄 Play Again"}
              </Button>
              <p className="text-sm text-white/60 mt-4 font-medium">
                {gameState === "menu" ? "Click or tap to make Amitabh fly!" : "Click or tap to flap"}
              </p>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className="absolute top-6 left-0 right-0 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] border-2 border-white/50">
              <span className="text-2xl">🏆</span>
              <p className="text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{score}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center space-y-3 bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl">👑</span>
          <p className="text-lg font-bold text-foreground">Best: <span className="text-primary">{highScore}</span></p>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          💻 Desktop: Click | 📱 Mobile: Tap
        </p>
      </div>
    </div>
  );
};
