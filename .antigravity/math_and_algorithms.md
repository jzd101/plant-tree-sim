# Math and Algorithms (Inner Layer)

This document details the core mathematical functions and procedural generation algorithms that drive the Plant Tree Sim. These are pure logic functions that do not depend on the UI.

## Core Helpers

### `pseudoRandom(seed: number): number`
A deterministic pseudo-random number generator.
- **Input**: `seed` (number).
- **Output**: A number between 0 and 1.
- **Logic**: `Math.sin(seed) * 10000` fraction component.
- **Usage**: Used everywhere to ensure the tree looks the same for a given level/seed, but grows unpredictably.

### `getLeafPath(x, y, angle, scale): string`
Generates an SVG path string for a leaf.
- **Logic**: Uses Quadratic Bezier curves (`Q`) to draw a leaf shape rotated by `angle` and scaled by `scale`.
- **Returns**: `M... Q... Q...` path string.

## Procedural Generation Stages

The plant growth is divided into 4 algorithmic stages based on the `level`.

### 1. Seed Generation (`generateSeed`)
- **Applies**: Level 1-3.
- **Logic**: Returns static SVG paths for the Pot and a simple Seed ellipse.
- **Complexity**: O(1).

### 2. Sprout Generation (`generateSprout`)
- **Applies**: Level 4-8.
- **Logic**:
  - Calculates a single quadratic curve for the stem.
  - Adds leaves (`getLeafPath`) at interpolated points along the curve.
  - **Curve Logic**: A start point, end point, and a randomized control point (`cpX`) stimulate a "leaning" organic growth.
  - **Leaf Placement**: Uses quadratic interpolation formula `(1-t)^2...` to place leaves exactly on the stem curve.

### 3. Sapling Generation (`generateSapling`)
- **Applies**: Level 9-16.
- **Logic**:
  - Introduces **branching**.
  - Main trunk is a quadratic curve.
  - **Branches**: Generated in a loop (`branchCount`). Positioned along the trunk using quadratic interpolation.
  - **Asymmetry**: Branches alternate sides and have randomized lengths/angles.
  - **Clusters**: Leaves are generated in clusters of 3 at branch tips.

### 4. Tree Generation (`generateTree`)
- **Applies**: Level 17+.
- **Logic**: **Recursive Fractal Generation**.
- **Function**: `drawBranch(x, y, angle, length, depth, width...)`
  - **Base Case**: If `depth === 0`, draw lush leaf tips/flowers/fruits.
  - **Recursive Step**:
    - Draw current branch segment (Quadratic Curve).
    - Randomly spawn "Twigs" (secondary small branches) along the segment.
    - Recursively call `drawBranch` twice (Left and Right) with reduced length (`* 0.85`) and width.
  - **Depth Control**: Depth increases with level, capped at 7 to prevent performance issues.
- **Assets**:
  - **Flowers**: 15% chance at tips (Level 8+).
  - **Fruits**: Low chance at tips (Level 15+).
  - **Roots**: Replaces the Pot with root paths.
