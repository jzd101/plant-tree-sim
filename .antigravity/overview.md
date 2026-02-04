# Antigravity Documentation

This directory contains the "Inside-Out" documentation of the Plant Tree Sim project. The documentation is structured to move from the core pure logic outwards to the user interface.

## Documentation Map

1.  **[Inner Layer: Math & Algorithms](./math_and_algorithms.md)**
    -   *Pure Logic, No Side Effects.*
    -   Procedural generation algorithms.
    -   Mathematical helpers (Bezier curves, RNG).
    -   Growth stage definitions.

2.  **[Middle Layer: State Management](./state_management.md)**
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
