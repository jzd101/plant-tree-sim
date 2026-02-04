# Plant Tree Sim 🌳

A specialized, procedural plant growth simulation game built with **Angular 21** and **Tailwind CSS**. Watch your plant evolve from a seed to a magnificent tree through procedural generation and interactive care.

## 🌟 Features

-   **Procedural Growth Engine**: The plant grows organically using mathematical curves (Quadratic Bezier) and recursive branching algorithms. No two trees are exactly alike!
-   **Dynamic Stages**:
    -   🌱 **Seed Stage** (Level 1-3)
    -   🌿 **Sprout Stage** (Level 4-8)
    -   🎋 **Sapling Stage** (Level 9-16)
    -   🌳 **Tree Stage** (Level 17+ with recursive complexity)
-   **Economy System**: Earn Gold 💰 by harvesting fruits, spend it on upgrades.
-   **Interactive Controls**:
    -   **Pan & Zoom**: Infinite canvas navigation.
    -   **Water & Till**: Active care mechanics to gain XP.
    -   **Harvest**: Click golden fruits to collect rewards.
-   **Shop & Upgrades**:
    -   **Instant Fertilizer**: Boost XP and chance for golden flowers.
    -   **Birds**: Buy companions that perch on your tree.
-   **Modern Tech Stack**: Built with Angular 19+ Signals (`signal`, `computed`) for reactive high-performance state management.

## 🎮 How to Play

### 1. The Core Loop
1.  **Gain XP**: Water your plant 💧 and Till the soil 🚜 to earn Experience Points.
2.  **Level Up**: When XP fills the bar, your plant levels up!
3.  **Wait for Fruits**: As your plant grows, Golden Fruits 🍋 will spawn.
4.  **Harvest**: Click fruits to collect Gold 💰.
5.  **Upgrade**: Use Gold in the shop to speed up progress.

### 2. Controls
-   **Left Click (on buttons)**: Perform actions (Water, Till, Buy).
-   **Left Click (on fruits)**: Harvest.
-   **Click & Drag (on screen)**: Pan the camera view.
-   **Scroll Wheel**: Zoom in and out.
-   **Reset View Button (🎯)**: Return camera to default position.

### 3. Game Mechanics

#### Experience & Levels
-   **XP Required** = `Current Level * 100`
-   **Watering**: +80 XP (No cooldown).
-   **Tilling Soil**: +80 XP (60s cooldown).
-   **Instant Fertilizer**: +500 XP (Cost: 3 Gold).

#### Economy
-   **Fruits**: Spawn naturally based on level (Base 60% chance + 4% per level).
-   **Harvesting**: Grants +1 Gold.
-   **Birds**: Decorative companions (Cost: 2 Gold). Only available in Tree Stage (Lvl 17+).

## 🛠️ Tech Stack & Architecture

This project utilizes cutting-edge web technologies:

-   **Framework**: [Angular](https://angular.io) (v21.x)
-   **State Management**: Angular Signals (`signal`, `computed`, `effect`).
-   **Styling**: [Tailwind CSS](https://tailwindcss.com) for utility-first design.
-   **Rendering**: SVG for high-fidelity, scalable vector graphics.
-   **Logic**: Heavy use of procedural generation algorithms (`Math.sin`, `Math.cos`, Recursive Functions).

### Key Files
-   `src/app/app.ts`: Core game logic, state management, and procedural generation algorithms. (Refactored to remove legacy dead code).
-   `src/app/app.html`: The UI structure, SVG rendering loop, and interactions.
-   `src/app/app.css`: Custom animations (wind, float) and global styles.

## 🚀 Installation & Development

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/plant-tree-sim.git
    cd plant-tree-sim
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm start
    # or
    ng serve
    ```
    Navigate to `http://localhost:4200/`.

4.  **Build for production**:
    ```bash
    npm run build
    ```

## 🧪 Logic Overview (For Developers)

The tree generation is deterministic but seeded.
-   **Seed Stage**: Static SVG paths defined in `generateSeed()`.
-   **Sprout/Sapling**: Bezier curves with randomized control points based on level `generateSprout()`.
-   **Tree**: Uses a recursive `drawBranch()` function. It passes `depth` and `angle` state down the stack, creating fractals.
    -   Branches split into 2 sub-branches.
    -   Chance to spawn "twigs" or leaves.
    -   Fruits and Birds are placed on "slots" calculated during generation.

---
*Created with ❤️ by the Plant Tree Sim Team.*
