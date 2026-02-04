# UI Architecture (Outer Layer)

The UI layer is responsible for rendering the state and capturing user input. It uses a **Split-Screen Layout** (80% Game / 20% Console).

## Layout Structure (`app.html`)

### 1. Canvas Area (Left 80%)
- **Container**: Handles Drag/Zoom events (`mousedown`, `wheel`, etc.).
- **SVG Element**:
  - `viewBox`: Bound to `viewBox()` computed signal. Controls the "Camera".
  - **Layers**:
    1.  **Wind Effects**: Static background animations (`animate-wind`).
    2.  **Tree Paths**: Iterates over `visualPaths()` using `@for`. Renders `path` or `ellipse`.
    3.  **Interactive Objects**:
        -   **Fruits**: Clickable (`click` -> `harvestFruit`).
        -   **Birds**: Decorative.
  - **CSS Animations**: Uses Tailwind utility classes + custom keyframes for floating/pulsing effects.

### 2. Console Area (Right 20%)
- **Header**: Displays Level and Gold.
- **Stats**: Progress bar for XP (`width.%` binding).
- **Control Panel**:
  - **Shop Buttons**: Buy Bird / Instant Fertilizer.
  - **Action Buttons**: Water / Till Soil.
  - **Feedback**: Disabled states for buttons when poor or on cooldown.

## Interaction Handling (`app.ts`)

### Camera Control
- **Pan**:
  - `onMouseDown`: Sets `isDragging = true` and captures `dragStart` (screen coords).
  - `onMouseMove`: Calculates delta (`dx`, `dy`). Updates `viewPos` signal. Divides delta by `zoomLevel` to keep mouse sync.
- **Zoom**:
  - `onWheel`: Updates `zoomLevel` signal. Clamped between 0.5x and 5.0x.

### Game Actions
- **Event Binding**:
  - `(click)="waterPlant()"`
  - `(click)="buyBird()"`
- **Logic**: Directly calls State Transition methods defined in the Middle Layer.
