# Antigravity Documentation

This directory contains the "Inside-Out" documentation of the Plant Tree Sim project. The documentation is structured to move from the core pure logic outwards to the user interface.

## Documentation Map

1.  **[Inner Layer: Math & Algorithms](./math_and_algorithms.md)**
    -   *Pure Logic, No Side Effects.*
    -   `logic/biome-generator.ts`: Biome palettes and cycling.
    -   `logic/collision-system.ts`: Spawn position validation and Game Over logic.
    -   `math_and_algorithms.md`: Procedural generation algorithms (Bezier curves).

2.  **[Middle Layer: State Management](./state_management.md)**
    -   *Orchestration & Data Flow.*
    -   `models.ts`: Interface definitions (`Biome`, `TreeEntity`).
    -   Angular Signals (`activeTree`, `legacyTrees`).
    -   Game Loop: Biome transition and Scoring.
    -   *Orchestration & Data Flow.*
    -   Angular Signals (`level`, `experience`).
    -   Computed State (`treeData`, `viewBox`).
    -   Game Loop & State Transitions (`gainExperience`, `spawnFruit`).

3.  **[Outer Layer: UI Architecture](./ui_architecture.md)**
    -   *Rendering & Interaction.*
    -   SVG Rendering Pipeline.
    -   Split-screen Layout.
    -   Event Handling (Mouse Drag/Zoom, Click).

## quick-links
- [README.md](../README.md) - Public facing documentation.
- [RULES.md](../RULES.md) - Project maintenance rules.
