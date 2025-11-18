import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/simple-ui/Button";
import { Leaderboard } from "@/components/Leaderboard";
import amitabhFace from "@/assets/amitabh-face.png";
import { playJumpSound } from "@/utils/audioUtils";
import { Shield, Zap, Star, Clock } from "lucide-react";

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
  color?: string;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'shield' | 'slow' | 'double';
  collected: boolean;
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const gameRef = useRef({
    bird: {
      y: 250,
      velocity: 0,
      rotation: 0,
    },
    pipes: [] as Pipe[],
    powerUps: [] as PowerUp[],
    frameCount: 0,
    image: null as HTMLImageElement | null,
    particles: [] as Particle[],
    activeShield: false,
    shieldEndFrame: 0,
    slowMotion: false,
    slowEndFrame: 0,
    doublePoints: false,
    doubleEndFrame: 0,
  });

  const collisionAudioRef = useRef<HTMLAudioElement | null>(null);
  const powerUpAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    collisionAudioRef.current = new Audio("/sounds/collision.mp3");
    collisionAudioRef.current.volume = 0.7;
    
    // Create power-up sound effect
    powerUpAudioRef.current = new Audio();
    powerUpAudioRef.current.volume = 0.5;
  }, []);

  const GRAVITY = 0.28; // Reduced from 0.35 for slower falling
  const JUMP_FORCE = -8.5; // Slightly less powerful jump for more control
  const BIRD_SIZE = 50;
  const PIPE_WIDTH = 80;
  const PIPE_GAP = 200; // Increased from 180 for easier passage
  const PIPE_SPEED = 2.5; // Reduced from 3 for slower pipes
  const POWERUP_SIZE = 35;

  useEffect(() => {
    const img = new Image();
    img.src = customImage || amitabhFace;
    img.onload = () => {
      gameRef.current.image = img;
    };
  }, [customImage]);

  const playPowerUpSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  };

  const startGame = () => {
    gameRef.current.bird = {
      y: 250,
      velocity: 0,
      rotation: 0,
    };
    gameRef.current.pipes = [];
    gameRef.current.powerUps = [];
    gameRef.current.frameCount = 0;
    gameRef.current.particles = [];
    gameRef.current.activeShield = false;
    gameRef.current.slowMotion = false;
    gameRef.current.doublePoints = false;
    setScore(0);
    setGameState("playing");
  };

  const jump = () => {
    if (gameState === "playing") {
      gameRef.current.bird.velocity = JUMP_FORCE;
      playJumpSound();
      
      const color = gameRef.current.activeShield ? '#3b82f6' : 
                    gameRef.current.doublePoints ? '#fbbf24' : '#34d399';
      
      for (let i = 0; i < 12; i++) {
        gameRef.current.particles.push({
          x: 100,
          y: gameRef.current.bird.y + 25,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 4 + 2,
          life: 1,
          color,
        });
      }
    }
  };

  // Spacebar control
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        if (gameState === "playing") {
          jump();
        } else if (gameState === "menu" || gameState === "gameOver") {
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = () => {
      const game = gameRef.current;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Enhanced animated gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      const skyOffset = Math.sin(game.frameCount * 0.001) * 5;
      gradient.addColorStop(0, `hsl(200, 100%, ${85 + skyOffset}%)`);
      gradient.addColorStop(0.5, `hsl(195, 100%, ${88 + skyOffset}%)`);
      gradient.addColorStop(1, `hsl(190, 85%, ${92 + skyOffset}%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Enhanced clouds with animation
      const drawCloud = (x: number, y: number, size: number, opacity: number = 0.7) => {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 1.6, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      const cloudOffset = (game.frameCount * 0.2) % canvas.width;
      drawCloud(-cloudOffset + 100, 80, 25, 0.8);
      drawCloud(-cloudOffset + 300, 150, 30, 0.7);
      drawCloud(-cloudOffset + canvas.width + 50, 100, 28, 0.75);
      drawCloud(-cloudOffset + canvas.width + 250, 120, 26, 0.65);

      if (gameState === "playing") {
        game.frameCount++;

        // Check power-up expiration
        if (game.activeShield && game.frameCount > game.shieldEndFrame) {
          game.activeShield = false;
        }
        if (game.slowMotion && game.frameCount > game.slowEndFrame) {
          game.slowMotion = false;
        }
        if (game.doublePoints && game.frameCount > game.doubleEndFrame) {
          game.doublePoints = false;
        }

        const effectiveGravity = game.slowMotion ? GRAVITY * 0.6 : GRAVITY;
        const effectivePipeSpeed = game.slowMotion ? PIPE_SPEED * 0.5 : PIPE_SPEED;

        // Update bird physics
        game.bird.velocity += effectiveGravity;
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

        // Generate power-ups (every 300 frames, 30% chance)
        if (game.frameCount % 300 === 0 && Math.random() < 0.3) {
          const types: ('shield' | 'slow' | 'double')[] = ['shield', 'slow', 'double'];
          const type = types[Math.floor(Math.random() * types.length)];
          game.powerUps.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 200) + 100,
            type,
            collected: false,
          });
        }

        // Update and draw particles
        game.particles = game.particles.filter((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.3;
          particle.life -= 0.02;

          if (particle.life > 0) {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color || "hsl(48, 96%, 53%)";
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return true;
          }
          return false;
        });

        // Update and draw pipes
        game.pipes.forEach((pipe, index) => {
          pipe.x -= effectivePipeSpeed;

          // Enhanced pipe shadows
          ctx.save();
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
          ctx.shadowOffsetX = 5;
          ctx.shadowOffsetY = 5;
          
          const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
          pipeGradient.addColorStop(0, "hsl(142, 76%, 28%)");
          pipeGradient.addColorStop(0.2, "hsl(142, 76%, 48%)");
          pipeGradient.addColorStop(0.5, "hsl(142, 76%, 42%)");
          pipeGradient.addColorStop(0.8, "hsl(142, 76%, 48%)");
          pipeGradient.addColorStop(1, "hsl(142, 76%, 28%)");

          // Top pipe
          ctx.fillStyle = pipeGradient;
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
          
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.fillRect(pipe.x + 8, 0, 18, pipe.topHeight);
          
          const capGradient = ctx.createLinearGradient(pipe.x, pipe.topHeight - 30, pipe.x, pipe.topHeight);
          capGradient.addColorStop(0, "hsl(142, 80%, 55%)");
          capGradient.addColorStop(1, "hsl(142, 80%, 42%)");
          ctx.fillStyle = capGradient;
          ctx.fillRect(pipe.x - 8, pipe.topHeight - 30, PIPE_WIDTH + 16, 30);

          // Bottom pipe
          const bottomPipeY = pipe.topHeight + pipe.gap;
          ctx.fillStyle = pipeGradient;
          ctx.fillRect(pipe.x, bottomPipeY, PIPE_WIDTH, canvas.height - bottomPipeY);
          
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.fillRect(pipe.x + 8, bottomPipeY, 18, canvas.height - bottomPipeY);
          
          const bottomCapGradient = ctx.createLinearGradient(pipe.x, bottomPipeY, pipe.x, bottomPipeY + 30);
          bottomCapGradient.addColorStop(0, "hsl(142, 80%, 55%)");
          bottomCapGradient.addColorStop(1, "hsl(142, 80%, 42%)");
          ctx.fillStyle = bottomCapGradient;
          ctx.fillRect(pipe.x - 8, bottomPipeY, PIPE_WIDTH + 16, 30);
          
          ctx.restore();

          // Score when passing pipe
          if (!pipe.passed && pipe.x + PIPE_WIDTH < canvas.width / 2 - BIRD_SIZE / 2) {
            pipe.passed = true;
            const points = game.doublePoints ? 2 : 1;
            setScore((s) => {
              const newScore = s + points;
              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem("flappyHighScore", newScore.toString());
              }
              return newScore;
            });
            
            // Enhanced score particles
            const particleColor = game.doublePoints ? '#fbbf24' : '#34d399';
            for (let i = 0; i < 25; i++) {
              game.particles.push({
                x: canvas.width / 2,
                y: game.bird.y,
                vx: Math.random() * 10 - 5,
                vy: Math.random() * 10 - 5,
                life: 1,
                color: particleColor,
              });
            }
          }

          // Check collision (unless shield is active)
          if (!game.activeShield) {
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
          }

          if (pipe.x + PIPE_WIDTH < 0) {
            game.pipes.splice(index, 1);
          }
        });

        // Update and draw power-ups
        game.powerUps.forEach((powerUp, index) => {
          if (!powerUp.collected) {
            powerUp.x -= effectivePipeSpeed;

            // Draw power-up with glow effect
            ctx.save();
            const bobOffset = Math.sin(game.frameCount * 0.1 + index) * 5;
            const powerUpY = powerUp.y + bobOffset;

            // Power-up circle with color
            let color = '#3b82f6';
            let icon = '🛡️';
            
            if (powerUp.type === 'slow') {
              color = '#8b5cf6';
              icon = '⏰';
            } else if (powerUp.type === 'double') {
              color = '#fbbf24';
              icon = '⭐';
            }
            
            ctx.shadowColor = color;
            
            // Background circle
            ctx.fillStyle = color + '40';
            ctx.beginPath();
            ctx.arc(powerUp.x, powerUpY, POWERUP_SIZE, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(powerUp.x, powerUpY, POWERUP_SIZE - 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Icon
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, powerUp.x, powerUpY);
            
            ctx.restore();

            // Check collection
            const birdCenterX = canvas.width / 2;
            const birdCenterY = game.bird.y + BIRD_SIZE / 2;
            const dist = Math.sqrt(
              Math.pow(powerUp.x - birdCenterX, 2) + 
              Math.pow(powerUpY - birdCenterY, 2)
            );

            if (dist < BIRD_SIZE / 2 + POWERUP_SIZE) {
              powerUp.collected = true;
              playPowerUpSound();
              
              // Activate power-up
              if (powerUp.type === 'shield') {
                game.activeShield = true;
                game.shieldEndFrame = game.frameCount + 300; // 5 seconds
              } else if (powerUp.type === 'slow') {
                game.slowMotion = true;
                game.slowEndFrame = game.frameCount + 240; // 4 seconds
              } else if (powerUp.type === 'double') {
                game.doublePoints = true;
                game.doubleEndFrame = game.frameCount + 360; // 6 seconds
              }
              
              // Collect particles
              for (let i = 0; i < 25; i++) {
                game.particles.push({
                  x: powerUp.x,
                  y: powerUpY,
                  vx: Math.random() * 10 - 5,
                  vy: Math.random() * 10 - 5,
                  life: 1,
                  color,
                });
              }
            }

            if (powerUp.x < -POWERUP_SIZE) {
              game.powerUps.splice(index, 1);
            }
          }
        });

        // Check ground/ceiling collision (unless shield is active)
        if (!game.activeShield && (game.bird.y + BIRD_SIZE > canvas.height || game.bird.y < 0)) {
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

        // Shield effect
        if (game.activeShield) {
          const shieldPulse = Math.sin(game.frameCount * 0.2) * 0.3 + 0.7;
          ctx.strokeStyle = `rgba(59, 130, 246, ${shieldPulse})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, BIRD_SIZE / 2 + 10, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Enhanced shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowOffsetX = 6;
        ctx.shadowOffsetY = 6;

        ctx.drawImage(game.image, -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);

        // Motion trail
        if (Math.abs(game.bird.velocity) > 3) {
          ctx.globalAlpha = 0.3;
          ctx.drawImage(
            game.image,
            -BIRD_SIZE / 2 - game.bird.velocity * 1.2,
            -BIRD_SIZE / 2,
            BIRD_SIZE,
            BIRD_SIZE
          );
        }

        ctx.restore();
      }

      // Enhanced ground
      const groundHeight = 80;
      const groundGradient = ctx.createLinearGradient(0, canvas.height - groundHeight, 0, canvas.height);
      groundGradient.addColorStop(0, "hsl(30, 60%, 48%)");
      groundGradient.addColorStop(0.3, "hsl(30, 60%, 42%)");
      groundGradient.addColorStop(0.7, "hsl(30, 60%, 38%)");
      groundGradient.addColorStop(1, "hsl(30, 60%, 28%)");
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

      // Animated ground texture
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      const patternOffset = (game.frameCount * 2) % 40;
      for (let i = -40; i < canvas.width + 40; i += 40) {
        ctx.fillRect(i + patternOffset, canvas.height - groundHeight + 10, 35, 4);
        ctx.fillRect(i + patternOffset + 10, canvas.height - groundHeight + 25, 35, 4);
        ctx.fillRect(i + patternOffset, canvas.height - groundHeight + 40, 35, 4);
        ctx.fillRect(i + patternOffset + 10, canvas.height - groundHeight + 55, 35, 4);
      }
      ctx.restore();

      // Ground highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 2);

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
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl animate-fade-in">
            <div className="text-center space-y-6 p-8 max-w-sm">
              <h1 className="text-6xl font-black text-white mb-4 drop-shadow-[0_4px_20px_rgba(255,255,255,0.3)] animate-scale-in">
                {gameState === "menu" ? "Flappy Amitabh" : "Game Over!"}
              </h1>
              {gameState === "gameOver" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-secondary/30 border-2 border-secondary rounded-xl p-4">
                    <p className="text-sm text-white/80 uppercase tracking-wider mb-1">Your Score</p>
                    <p className="text-5xl font-black text-secondary drop-shadow-lg">{score}</p>
                  </div>
                  <div className="bg-primary/30 border border-primary/50 rounded-lg p-3">
                    <p className="text-xs text-white/70 uppercase tracking-wider mb-1">Best Score</p>
                    <p className="text-2xl font-bold text-white">{highScore}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={startGame}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl px-10 py-7 rounded-xl shadow-[0_10px_30px_-5px_rgba(34,197,94,0.5)] hover:shadow-[0_15px_40px_-5px_rgba(34,197,94,0.6)] transition-all hover:scale-105 active:scale-95"
                >
                  {gameState === "menu" ? "🚀 Start Game" : "🔄 Play Again"}
                </Button>
                {gameState === "gameOver" && (
                  <Button
                    onClick={() => setShowLeaderboard(true)}
                    variant="outline"
                    size="lg"
                    className="font-bold text-lg px-10 py-6 rounded-xl hover:scale-105 transition-all"
                  >
                    🏆 View Leaderboard
                  </Button>
                )}
              </div>
              <p className="text-sm text-white/60 mt-4 font-medium">
                {gameState === "menu" ? "Click, tap, or press SPACE to fly!" : "Click, tap, or press SPACE to flap"}
              </p>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <>
            <div className="absolute top-6 left-0 right-0 text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-gradient-to-br from-white/95 to-white/90 px-8 py-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] border-2 border-white/50">
                <span className="text-2xl">🏆</span>
                <p className="text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{score}</p>
              </div>
            </div>

            {/* Active power-ups display */}
            <div className="absolute top-24 left-4 right-4 flex justify-center gap-3 animate-fade-in">
              {gameRef.current.activeShield && (
                <div className="bg-blue-500 px-4 py-2 rounded-xl border-2 border-blue-300 shadow-lg flex items-center gap-2 animate-pulse">
                  <Shield className="h-5 w-5 text-white" />
                  <span className="text-white font-bold text-sm">Shield Active</span>
                </div>
              )}
              {gameRef.current.slowMotion && (
                <div className="bg-purple-500 px-4 py-2 rounded-xl border-2 border-purple-300 shadow-lg flex items-center gap-2 animate-pulse">
                  <Clock className="h-5 w-5 text-white" />
                  <span className="text-white font-bold text-sm">Slow Motion</span>
                </div>
              )}
              {gameRef.current.doublePoints && (
                <div className="bg-yellow-500 px-4 py-2 rounded-xl border-2 border-yellow-300 shadow-lg flex items-center gap-2 animate-pulse">
                  <Star className="h-5 w-5 text-white" />
                  <span className="text-white font-bold text-sm">2x Points</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-8 text-center space-y-3 bg-card rounded-2xl p-6 shadow-lg border border-border/50">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl">👑</span>
          <p className="text-lg font-bold text-foreground">Best: <span className="text-primary">{highScore}</span></p>
        </div>
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Shield</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-purple-500" />
            <span className="text-muted-foreground">Slow-Mo</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">2x Score</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          💻 Desktop: Click / Spacebar | 📱 Mobile: Tap
        </p>
      </div>

      {showLeaderboard && (
        <Leaderboard 
          currentScore={gameState === "gameOver" ? score : undefined}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
};
