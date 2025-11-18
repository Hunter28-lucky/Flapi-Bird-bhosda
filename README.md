# Flappy Amitabh - Custom Flappy Bird Game

## Project info

A fun Flappy Bird clone featuring Amitabh Bachchan with multiplayer support, power-ups, and global leaderboards.

## Quick Start

### 1. Install Dependencies

```sh
npm install
```

### 2. Configure Supabase (Optional - for Multiplayer & Leaderboard)

The game works in **single-player mode** without any configuration. For multiplayer and leaderboard features:

1. Copy `.env.local` to `.env`
2. Get your Supabase credentials from [Supabase Dashboard](https://supabase.com/dashboard)
3. Fill in your credentials in `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

### 3. Start Development Server

```sh
npm run dev
```

Visit http://localhost:8080 to play!

## Features

- 🎮 **Single Player Mode** - Works offline, no setup needed
- 👥 **Multiplayer Mode** - Real-time multiplayer (requires Supabase)
- 🏆 **Global Leaderboard** - Compete worldwide (requires Supabase)
- 🎁 **Power-ups** - Shield, Slow Motion, Double Points
- 🖼️ **Custom Bird Images** - Upload your own character
- 🎨 **Beautiful Graphics** - Smooth animations and particle effects

## How can I edit this code?

**Use your preferred IDE**

Clone this repo and push changes to deploy.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Build the project with `npm run build` and deploy the `dist` folder to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

## Custom Domain

You can connect a custom domain through your hosting provider's settings.
