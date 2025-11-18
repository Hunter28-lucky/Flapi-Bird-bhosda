# Flappy Amitabh - AI Coding Agent Instructions

## Project Overview
A Flappy Bird clone with multiplayer support, power-ups, and leaderboard features. Built with React, TypeScript, Canvas API, and Supabase for real-time multiplayer and global leaderboards.

## Architecture

### Game Engine Pattern
- **Canvas-based rendering**: All games use `<canvas>` refs with `requestAnimationFrame` loops
- **State management**: `useRef` for game state (60fps updates), `useState` for UI state
- **Game loop structure**: Update physics → Check collisions → Render frame → Update DB (multiplayer only)
- See `src/components/FlappyGame.tsx` (474 lines) for base implementation

### Component Hierarchy
```
Index.tsx (routing state machine)
├── GameModeSelector.tsx (menu)
├── FlappyGameEnhanced.tsx (single-player with power-ups)
│   ├── ImageUploader.tsx (custom bird image)
│   └── Leaderboard.tsx (global scores)
└── MultiplayerLobby.tsx → MultiplayerGame.tsx (real-time multiplayer)
```

### Supabase Integration
- **Client**: `src/integrations/supabase/client.ts` - pre-configured singleton
- **Real-time**: Used for multiplayer game state (`room_players` table) and leaderboard updates
- **Pattern**: Subscribe to `postgres_changes` on mount, cleanup channel on unmount
- **Tables**: `leaderboard` (global scores), `multiplayer_rooms`, `room_players`
- **Migrations**: All in `supabase/migrations/` with timestamp prefixes

### Canvas Rendering Pattern
All game components follow this structure:
```typescript
const gameRef = useRef({ bird: {...}, pipes: [], frameCount: 0, ... });
const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d')!;
  
  const gameLoop = () => {
    // 1. Update physics (bird.velocity += GRAVITY)
    // 2. Update game objects (pipes, particles, power-ups)
    // 3. Check collisions
    // 4. Render frame
    // 5. Update database (multiplayer only)
    requestAnimationFrame(gameLoop);
  };
  
  if (gameState === "playing") requestAnimationFrame(gameLoop);
}, [gameState]);
```

## Key Conventions

### File Organization
- **Components**: `src/components/` - Game components and shadcn/ui primitives
- **Pages**: `src/pages/` - Route components (Index, NotFound)
- **Utils**: `src/utils/` - Shared utilities (audioUtils.ts for Web Audio API sounds)
- **Assets**: `src/assets/` - Images (amitabh-face.png is default bird)
- **Styles**: Tailwind CSS with custom game theme colors in `tailwind.config.ts`

### Naming Patterns
- Components: PascalCase with descriptive names (`FlappyGameEnhanced`, `MultiplayerLobby`)
- Game constants: SCREAMING_SNAKE_CASE (`GRAVITY`, `JUMP_FORCE`, `PIPE_GAP`)
- Game state refs: `gameRef.current.bird`, `gameRef.current.pipes`
- Audio: Procedural sounds via Web Audio API in `audioUtils.ts`, file-based in `/public/sounds/`

### State Management
- **UI state**: React `useState` (gameState: "menu" | "playing" | "gameOver")
- **Game state**: `useRef` objects mutated directly (no setState in game loop)
- **Persistence**: `localStorage` for high scores and settings
- **Real-time**: Supabase realtime subscriptions for multiplayer

## Critical Workflows

### Development
```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
```

### Adding New Power-Ups
1. Add power-up type to game state: `gameRef.current.powerUps`
2. Spawn logic in game loop (check frame count % spawn interval)
3. Collision detection: distance-based with bird position
4. Apply effect with duration counter (e.g., `shieldFramesLeft`)
5. Render with glow effect and icon
6. Add particle effects on pickup (see `FlappyGameEnhanced.tsx` lines 200-220)

### Multiplayer State Sync
- Update player state every frame: `bird_y`, `velocity`, `score`, `is_alive`
- Use `supabase.from("room_players").update()` with player ID filter
- Subscribe to changes on `room:${roomId}` channel
- Render other players as semi-transparent birds
- **Critical**: Clean up channel subscriptions in `useEffect` cleanup

### Adding Leaderboard Features
- Table has RLS enabled with public read/insert policies
- Query pattern: `.select().order('score', { ascending: false }).limit(100)`
- Real-time: Subscribe to `postgres_changes` on `leaderboard` table
- Submit score with name validation (1-30 chars, enforced by DB constraint)

## Graphics & Animation

### Canvas Performance
- Use `ctx.save()`/`ctx.restore()` sparingly (expensive)
- Set `imageSmoothingQuality: 'high'` once at canvas init
- Batch similar draw operations (all pipes, then all particles)
- Filter particles before rendering: `particles.filter(p => p.life > 0)`

### Animation Patterns
- **Sine wave motion**: `Math.sin(frameCount * 0.1)` for bobbing power-ups
- **Pulsing effects**: `0.7 + Math.sin(frameCount * 0.1) * 0.3` for shield opacity
- **Rotation**: Bird rotates based on velocity (`rotation = velocity * 0.03`)
- **Particles**: Spawn with random velocity, apply gravity, fade life over time

### Visual Effects Layer
1. Background (animated sky gradient)
2. Clouds (parallax layers)
3. Pipes (with 3D gradients and shadows)
4. Power-ups (with glow and bobbing)
5. Bird (with shield aura if active)
6. Particles (additive blending)
7. Ground (animated brick pattern)
8. UI overlay (score, power-up badges)

## Audio System
- **Jump sound**: Procedural using Web Audio API oscillator (400Hz → 800Hz sweep)
- **Collision**: MP3 file loaded on mount (`/sounds/collision.mp3`)
- **Power-up**: Procedural sound with frequency based on power-up type
- Pattern: Create `AudioContext`, set up oscillator/gain nodes, schedule playback

## Testing & Debugging
- Use browser DevTools canvas inspector for rendering issues
- Check Supabase dashboard for real-time subscription status
- Console logs on multiplayer state changes (enabled in `MultiplayerGame.tsx`)
- Local storage keys: `flappyHighScore` for persistence

## Common Pitfalls
- **Don't setState in game loop** - causes re-renders and kills performance
- **Always cleanup Supabase channels** - memory leaks and stale subscriptions
- **Image loading is async** - check `gameRef.current.image` before drawing
- **Canvas coordinates**: (0,0) is top-left, y increases downward
- **Frame-based timing**: Don't use Date.now(), use frame counters for consistency

## Adding New Features
1. Check `ENHANCEMENTS.md` and `RECOMMENDATIONS.md` for context on existing features
2. For UI components, use shadcn/ui from `src/components/ui/`
3. For game features, extend `FlappyGameEnhanced.tsx` (not the base `FlappyGame.tsx`)
4. Add database changes via new migration files with timestamp prefix
5. Update this file if introducing new architectural patterns

## Deployment
- Project uses Lovable.dev for CI/CD (see README.md)
- Supabase project must be configured with environment variables
- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
