# State Management (Middle Layer)

This layer orchestrates the core algorithms and manages the game's reactive state using **Angular Signals**.

## Core State (Signals)

| Signal | Type | Description |
|Args|---|---|
| `level` | `WritableSignal<number>` | Current level of the plant. Drives the generation algorithms. |
| `experience` | `WritableSignal<number>` | Current XP. Resets after leveling up. |
| `gold` | `WritableSignal<number>` | Currency for the shop. |
| `activeFruits` | `WritableSignal<Set<string>>` | Set of IDs for fruits currently spawned on the tree. |
| `activeBirds` | `WritableSignal<Set<string>>` | Set of IDs for birds currently perched on the tree. |
| `viewPos` | `WritableSignal<{x, y}>` | Camera pan offset. |
| `zoomLevel` | `WritableSignal<number>` | Camera zoom multiplier (0.5x - 5.0x). |

## Computed State

Derived values that update automatically when core signals change.

### `stage`
- **Dependency**: `level`.
- **Logic**: Returns string label (e.g., "Seed Stage 2", "Tree (Growth 5)").

### `xpRequired`
- **Dependency**: `level`.
- **Formula**: `level * 100`.

### `treeData` (Heavy Computation)
- **Dependency**: `level`.
- **Logic**: Calls the appropriate procedural generator (`generateSeed`, `generateSprout`, etc.) from the Inner Layer.
- **Returns**: `{ paths: SVGPath[], slots: Slot[] }`.
- **Optimization**: This is the most expensive computation. It only runs when `level` changes.

### `visualPaths`
- **Dependency**: `treeData`.
- **Logic**: Extracts just the `paths` array for the SVG loop in the UI.

### `renderedFruits` / `renderedBirds`
- **Dependencies**: `treeData`, `activeFruits`, `activeBirds`.
- **Logic**: Filters the available `slots` from `treeData` to return coordinates (`cx`, `cy`) for active items only.

## State Transitions (Actions)

### `gainExperience(amount)`
- **updates**: `experience`.
- **Logic**:
  - **Growth Multiplier**: Multiplies XP by `growthMultiplier` (from Wildcard buffs).
  - **Critical Hit**: 20% chance to trigger a Critical Hit.
    - **Effect**: Multiplies gained XP by 5x (Huge Growth Spurt).
    - **Visual**: Triggers "CRITICAL!" UI overlay.
  - Adds XP.
  - **Level Up Loop**: If `experience >= xpRequired`:
    - Decrements XP.
    - Increments `level`.
    - **Spawn Logic**: Triggers fruit spawns based on new level probability.

### **Wildcard Items**
New gameplay mechanic allowing players to gamble Score for random effects.
- **Mystery Potion** (Cost: 500):
  - **Tier 1**: Generally safe buffs.
  - **Effect**: 50% Speed Boost, 30% Super Speed, 10% Instant Level Up, 10% Drought (Slow).
- **Chaos Seed** (Cost: 1500):
  - **Tier 2**: High risk, high reward.
  - **Effects**: 30% Mega Growth (10x), 10% Instant Maturity, 20% Score Penalty, **40% Tree Death (CATASTROPHE)**.
- **Cooldown**: Randomized (1s to 600s) after every use.

### `spawnFruit()` / `spawnBird()`
- **updates**: `activeFruits` / `activeBirds`.
- **Logic**:
  - GET `treeData().slots`.
  - FILTER slots not in use.
  - SELECT random free slot.
  - UPDATE Set.

### Game Loop
- **Interval**: 1000ms.
- **Updates**: `now` signal (used for cooldown calculations).
