import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Game State Signals
  readonly level = signal(1);
  readonly experience = signal(0);
  readonly lifespan = signal(0); // Deprecated
  readonly isDead = signal(false); // Deprecated but kept to avoid immediate break, will clean up methods next

  // Cooldown State
  readonly lastTillTime = signal(0);
  readonly now = signal(Date.now());

  // Computed State
  readonly stage = computed(() => {
    const lvl = this.level();
    if (lvl <= 3) return `Seed Stage ${lvl}`;
    if (lvl <= 8) return `Sprout Stage ${lvl - 3}`;
    if (lvl <= 16) return `Sapling Stage ${lvl - 8}`;
    return `Tree (Growth ${Math.floor((lvl - 17) / 5) + 1})`;
  });

  // Calculate XP needed for next level: Level * 100
  readonly xpRequired = computed(() => this.level() * 100);

  // Economy State
  readonly gold = signal(0);
  readonly fertilizerLevel = signal(0);
  readonly activeFruits = signal<Set<string>>(new Set());
  readonly activeBirds = signal<Set<string>>(new Set()); // Birds perched on branches


  // View State (Pan & Zoom)
  readonly viewPos = signal({ x: 0, y: 0 }); // Offset from center
  readonly zoomLevel = signal(1.0);
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };

  readonly viewBox = computed(() => {
    // Base view: 400x500
    // Zoom means showing LESS area (w/zoom, h/zoom)
    // Pan means shifting the ORIGIN (x, y)
    const w = 400 / this.zoomLevel();
    const h = 500 / this.zoomLevel();

    // Center point (origin of viewbox) needs to shift by viewPos
    // By default 0,0 is top-left.
    // We want to center at 200, 250 initially?
    // Let's assume 0,0 of SVG is top-left.
    // When we pan, we shift x/y.

    const x = -this.viewPos().x;
    const y = -this.viewPos().y;

    return `${x} ${y} ${w} ${h}`;
  });

  // Computed Tree Data (Paths and Slots)
  readonly treeData = computed(() => {
    const lvl = this.level();
    const paths: any[] = [];
    const slots: any[] = [];

    // Seed Stage (Lv 1-3)
    if (lvl <= 3) {
      return this.generateSeed();
    }

    // Sprout Stage (Lv 4-8) -> 5 stages
    if (lvl <= 8) {
      const sproutStage = lvl - 3; // 1 to 5
      return this.generateSprout(sproutStage);
    }

    // Sapling Stage (Lv 9-16) -> 8 stages
    if (lvl <= 16) {
      const saplingStage = lvl - 8; // 1 to 8
      return this.generateSapling(saplingStage);
    }

    // Tree Stage (Lv 17+) -> Grows every 5 levels
    // Base size + (Level - 17) scaling, but stepped every 5 levels
    const treeGrowthStep = Math.floor((lvl - 17) / 5);
    return this.generateTree(17 + (treeGrowthStep * 2), false);
  });

  // Extract just the paths for rendering
  readonly visualPaths = computed(() => this.treeData().paths);

  // Filter active fruits for rendering
  readonly renderedFruits = computed(() => {
    const slots = this.treeData().slots;
    const active = this.activeFruits();
    return slots.filter(slot => active.has(slot.id));
  });

  // Filter active birds for rendering
  readonly renderedBirds = computed(() => {
    const active = this.activeBirds();
    const slots = this.treeData().slots;
    return slots.filter(slot => active.has(slot.id));
  });

  // Interaction Methods
  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.dragStart = { x: event.clientX, y: event.clientY };
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;

    // Update drag start for next frame (delta movement)
    this.dragStart = { x: event.clientX, y: event.clientY };

    // Pan moves the camera opposite to drag? OR drag moves content?
    // Usually "Drag" moves content. So moving mouse Right (dx > 0) should move ViewBox Left (x decreases)
    // Wait, if I drag content right, I want to see left side? No.
    // If I drag paper right, the content moves right. The "Window" moves left relative to paper.
    // So viewbox X should DECREASE.
    // Efficiency: divide by zoom to keep sync with mouse

    this.viewPos.update(pos => ({
      x: pos.x + dx / this.zoomLevel(),
      y: pos.y + dy / this.zoomLevel()
    }));
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -event.deltaY * zoomSensitivity;

    this.zoomLevel.update(z => {
      const newZ = Math.max(0.5, Math.min(5.0, z + delta)); // Min 0.5x, Max 5x
      return newZ;
    });
  }

  resetView() {
    this.viewPos.set({ x: 0, y: 0 });
    this.zoomLevel.set(1.0);
  }

  // --- Procedural Helpers ---
  private pseudoRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private getLeafColor(seed: number) {
    const leafColors = ['#22C55E', '#16A34A', '#15803D', '#4ADE80', '#86EFAC'];
    return leafColors[Math.floor(Math.abs(seed * 100)) % leafColors.length];
  }

  private getLeafPath(x: number, y: number, angle: number, scale: number) {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const len = 12 * scale;
    const width = 6 * scale;
    const transform = (dx: number, dy: number) => `${x + dx * cos - dy * sin},${y + dx * sin + dy * cos}`;
    const p0 = transform(0, 0);
    const p1 = transform(len * 0.5, -width);
    const p2 = transform(len, 0);
    const p3 = transform(len * 0.5, width);
    return `M${p0} Q${p1} ${p2} Q${p3} ${p0}`;
  }

  private generateSeed() {
    const paths = [];

    // Pot (Static Base)
    paths.push({
      d: 'M80,200 L120,200 L110,240 L90,240 Z',
      fill: '#A0522D', stroke: '#8B4513', width: 2, type: 'pot'
    });
    paths.push({
      d: 'M75,200 L125,200',
      stroke: '#8B4513', width: 4, type: 'pot' // Rim
    });

    // Stage 1-3: More seeds appear
    const seedPaths = [
      // Real seed: Ellipse sitting inside pot
      { isCircle: true, cx: 100, cy: 215, rx: 6, ry: 8, fill: '#8B4513' }
    ];
    return { paths: [...paths, ...seedPaths], slots: [] };
  }

  private generateSprout(stage: number) {
    // Stage 1-5: Organic curved stem
    const paths: any[] = [];
    const slots: any[] = [];
    const height = 30 + (stage * 15);

    // Seed for deterministic randomness
    const seed = stage * 100;
    const lean = (this.pseudoRandom(seed) - 0.5) * 20;

    // Base Stem with curve - starts inside pot
    const x = 100, y = 210;
    const endX = x + lean;
    const endY = y - height;

    // Control point for curve
    const cpX = (x + endX) / 2 + (this.pseudoRandom(seed + 1) - 0.5) * 20;
    const cpY = (y + endY) / 2;

    paths.push({
      d: `M${x},${y} Q${cpX},${cpY} ${endX},${endY}`,
      stroke: '#4ADE80', width: 4 + stage, fill: 'none'
    });

    // Leaves at varied positions
    for (let i = 1; i <= stage; i++) {
      // Interpolate position along quadratic curve
      const t = i / (stage + 1);
      const inv = 1 - t;
      const lx = (inv * inv) * x + 2 * inv * t * cpX + (t * t) * endX;
      const ly = (inv * inv) * y + 2 * inv * t * cpY + (t * t) * endY;

      // Leaf Angle
      const angle = -90 + (this.pseudoRandom(i) * 60 - 30);
      const side = i % 2 === 0 ? 1 : -1;
      const leafAngle = angle + (side * 45);

      // Use helper for leaf path
      const scale = 0.8 + (i * 0.1);
      paths.push({
        d: this.getLeafPath(lx, ly, leafAngle, scale),
        fill: '#4ADE80', stroke: 'none'
      });
    }

    // Top Tip slot
    slots.push({ id: 'sprout-tip', cx: endX, cy: endY });

    // Add Pot
    paths.unshift({
      d: 'M75,200 L125,200',
      stroke: '#8B4513', width: 4, type: 'pot' // Rim
    });
    paths.unshift({
      d: 'M80,200 L120,200 L110,240 L90,240 Z',
      fill: '#A0522D', stroke: '#8B4513', width: 2, type: 'pot'
    });

    return { paths, slots };
  }

  private generateSapling(stage: number) {
    // Organic Sapling: Young tree with asymmetric growth
    const paths: any[] = [];
    const slots: any[] = [];

    const seed = stage * 200;
    const height = 100 + (stage * 10);
    const trunkColor = stage > 4 ? '#8B4513' : '#65A30D';
    const width = 10 + Math.floor(stage / 2);

    const x = 100, y = 210; // Start inside pot
    const endX = x;
    const endY = y - height;

    // Trunk
    const cpX = x + (this.pseudoRandom(seed) - 0.5) * 30;
    paths.push({
      d: `M${x},${y} Q${cpX},${(y + endY) / 2} ${endX},${endY}`,
      stroke: trunkColor, width: width, fill: 'none'
    });

    // Asymmetric Branches
    const branchCount = Math.floor(stage / 2) + 2;
    for (let i = 0; i < branchCount; i++) {
      const branchH = 0.3 + (this.pseudoRandom(seed + i) * 0.6); // 30% to 90% up the trunk

      // Calculate approx position on trunk curve (quadratic)
      const t = branchH;
      const inv = 1 - t;
      const bx = (inv * inv) * x + 2 * inv * t * cpX + (t * t) * endX;
      const by = (inv * inv) * y + 2 * inv * t * (y + endY) / 2 + (t * t) * endY;

      const side = this.pseudoRandom(seed + i + 1) > 0.5 ? 1 : -1;
      const angle = -90 + (side * (30 + this.pseudoRandom(i) * 30));
      const len = 30 + (stage * 5) * (1 - t); // Lower branches longer

      const tipX = bx + Math.cos(angle * Math.PI / 180) * len;
      const tipY = by + Math.sin(angle * Math.PI / 180) * len;

      paths.push({
        d: `M${bx},${by} Q${bx},${by - 10} ${tipX},${tipY}`,
        stroke: trunkColor, width: width * 0.6, fill: 'none'
      });

      // Detailed Leaves at branch tip
      // Cluster of 3 leaves
      const leafScale = 0.8 + (stage * 0.05);
      paths.push({
        d: this.getLeafPath(tipX, tipY, angle, leafScale),
        fill: '#4ADE80', stroke: 'none'
      });
      paths.push({
        d: this.getLeafPath(tipX, tipY, angle - 45, leafScale * 0.8),
        fill: '#22C55E', stroke: 'none'
      });
      paths.push({
        d: this.getLeafPath(tipX, tipY, angle + 45, leafScale * 0.8),
        fill: '#22C55E', stroke: 'none'
      });

      if (stage > 4) {
        slots.push({ id: `sapling-b-${i}`, cx: tipX, cy: tipY });
      }
    }

    // Top tip leaves
    paths.push({ d: this.getLeafPath(endX, endY, -90, 1.2), fill: '#4ADE80', stroke: 'none' });
    paths.push({ d: this.getLeafPath(endX, endY, -135, 1.0), fill: '#22C55E', stroke: 'none' });
    paths.push({ d: this.getLeafPath(endX, endY, -45, 1.0), fill: '#22C55E', stroke: 'none' });

    // Top tip
    slots.push({ id: `sapling-top`, cx: endX, cy: endY });

    // Add Pot
    paths.unshift({
      d: 'M75,200 L125,200',
      stroke: '#8B4513', width: 4, type: 'pot'
    });
    paths.unshift({
      d: 'M80,200 L120,200 L110,240 L90,240 Z',
      fill: '#A0522D', stroke: '#8B4513', width: 2, type: 'pot'
    });

    return { paths, slots };
  }

  private generateTree(lvl: number, isDead: boolean) {
    const paths: any[] = [];
    const slots: any[] = [];

    // Smooth transition from Sapling (which has ~6 branches).
    // Lv 17 should start low complexity. 
    // Formula: (17 - 12) / 2 = 2.5 -> Floor 2. Depth 2 = 7 branches (1 + 2 + 4).
    // As level grows, depth increases.
    const maxDepth = Math.max(2, Math.min(Math.floor((lvl - 12) / 2), 7));

    const trunkColor = isDead ? '#4B5563' : '#8B4513';

    // Recursive Branch Function
    const drawBranch = (x: number, y: number, angle: number, length: number, depth: number, width: number, pathId: string) => {
      const endX = x + Math.cos(angle * Math.PI / 180) * length;
      const endY = y + Math.sin(angle * Math.PI / 180) * length;

      // Control point for subtle curve
      const curveStrength = length * 0.2;
      const curveAngle = angle + (this.pseudoRandom(x * y) > 0.5 ? 90 : -90);
      const cpX = (x + endX) / 2 + Math.cos(curveAngle * Math.PI / 180) * curveStrength;
      const cpY = (y + endY) / 2 + Math.sin(curveAngle * Math.PI / 180) * curveStrength;

      paths.push({
        d: `M${x},${y} Q${cpX},${cpY} ${endX},${endY}`,
        stroke: trunkColor,
        width: width,
        fill: 'none'
      });

      // Add Twigs
      if (width > 2 && !isDead) {
        const hasTwig = this.pseudoRandom(x + y + depth) > 0.4;
        if (hasTwig) {
          const twigDir = (this.pseudoRandom(x) > 0.5 ? 1 : -1);
          const twigAngle = angle + (45 * twigDir);
          const twigLen = length * 0.25;

          const t = 0.5;
          const startTX = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * cpX + t * t * endX;
          const startTY = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cpY + t * t * endY;

          const teX = startTX + Math.cos(twigAngle * Math.PI / 180) * twigLen;
          const teY = startTY + Math.sin(twigAngle * Math.PI / 180) * twigLen;

          paths.push({
            d: `M${startTX},${startTY} L${teX},${teY}`,
            stroke: trunkColor,
            width: width * 0.3,
            fill: 'none'
          });

          // Detailed Leaf at twig end
          paths.push({
            d: this.getLeafPath(teX, teY, twigAngle, 0.6),
            fill: this.getLeafColor(teX + teY),
            stroke: 'none'
          });

          // Potential fruit slot on twig
          if (length > 30) {
            slots.push({ id: `twig-${pathId}-${depth}`, cx: teX, cy: teY });
          }
        }
      }

      if (depth > 0) {
        // Two branches with varied angles
        const spread = 25 + (this.pseudoRandom(depth) * 10);
        drawBranch(endX, endY, angle - spread, length * 0.85, depth - 1, width * 0.7, pathId + 'L');
        drawBranch(endX, endY, angle + spread, length * 0.85, depth - 1, width * 0.7, pathId + 'R');
      } else if (!isDead) {
        // Tips: Lush Leaf Cluster
        const baseLeafColor = this.getLeafColor(endX);

        // Main leaf at tip
        paths.push({
          d: this.getLeafPath(endX, endY, angle, 1.0),
          fill: baseLeafColor,
          stroke: 'none'
        });

        // Side leaves for specific lush look
        const r1 = this.pseudoRandom(endX);
        const r2 = this.pseudoRandom(endY);

        // Add 1-2 extra leaves based on level
        if (lvl > 2) {
          paths.push({
            d: this.getLeafPath(endX, endY, angle - 45, 0.8),
            fill: this.getLeafColor(endX + 1),
            stroke: 'none'
          });
        }
        if (lvl > 5 && r1 > 0.3) {
          paths.push({
            d: this.getLeafPath(endX, endY, angle + 45, 0.8),
            fill: this.getLeafColor(endX + 2),
            stroke: 'none'
          });
        }

        // Flowers (Level 8+)
        if (lvl >= 8 && r2 > 0.7) {
          paths.push({
            isCircle: true, cx: endX, cy: endY, r: 4, fill: '#EC4899' // Pink Flower
          });
          paths.push({
            isCircle: true, cx: endX, cy: endY, r: 2, fill: '#FEF9C3' // Yellow center
          });
        }

        // Fruits (Level 15+)
        if (lvl >= 15 && r1 < 0.3) {
          paths.push({
            isCircle: true, cx: endX + 2, cy: endY + 5, r: 5, fill: '#EF4444' // Red Apple
          });
        }

        // Fruit Slot at Tip
        slots.push({ id: `tip-${pathId}`, cx: endX, cy: endY + 5 });
      }
    };

    drawBranch(100, 200, -90, 40 + (lvl * 2), maxDepth, 12, 'root');

    // Roots (Static) replacing Pot
    paths.unshift({
      d: 'M100,200 Q90,220 80,230', stroke: '#5D4037', width: 8, fill: 'none', type: 'root'
    });
    paths.unshift({
      d: 'M100,200 Q110,220 120,235', stroke: '#5D4037', width: 7, fill: 'none', type: 'root'
    });
    paths.unshift({
      d: 'M100,200 Q100,225 95,245', stroke: '#5D4037', width: 6, fill: 'none', type: 'root'
    });

    return { paths, slots };
  }

  constructor() {
    // Game Loop (Every 1s)
    setInterval(() => {
      this.now.set(Date.now());
      // No death logic anymore
    }, 1000);
  }

  spawnFruit() {
    const slots = this.treeData().slots;
    if (slots.length === 0) return;

    const currentFruits = this.activeFruits();
    // Relax cap slightly as level increases
    if (currentFruits.size >= 5 + this.level()) return;

    const freeSlots = slots.filter(s => !currentFruits.has(s.id));
    if (freeSlots.length === 0) return;

    const randomSlot = freeSlots[Math.floor(Math.random() * freeSlots.length)];

    this.activeFruits.update(set => {
      const newSet = new Set(set);
      newSet.add(randomSlot.id);
      return newSet;
    });
  }

  harvestFruit(id: string) {
    if (!this.activeFruits().has(id)) return;

    this.activeFruits.update(set => {
      const newSet = new Set(set);
      newSet.delete(id);
      return newSet;
    });

    this.gold.update(g => g + 1);
  }

  // Bird Shop
  buyBird() {
    if (this.gold() >= 2) {
      this.gold.update(g => g - 2);
      this.spawnBird();
    }
  }

  spawnBird() {
    const slots = this.treeData().slots;
    if (slots.length === 0) return;

    const currentBirds = this.activeBirds();
    const currentFruits = this.activeFruits();

    // Find slots not occupied by birds or fruits
    const freeSlots = slots.filter(s => !currentBirds.has(s.id) && !currentFruits.has(s.id));
    if (freeSlots.length === 0) return;

    const randomSlot = freeSlots[Math.floor(Math.random() * freeSlots.length)];

    this.activeBirds.update(set => {
      const newSet = new Set(set);
      newSet.add(randomSlot.id);
      return newSet;
    });
  }

  // Shop: Instant Fertilizer
  buyInstantFertilizer() {
    if (this.gold() >= 3) {
      this.gold.update(g => g - 3);
      this.gainExperience(500);

      // 15% Chance for bonus Golden Flower
      if (Math.random() < 0.15) {
        this.spawnFruit(); // Reuse fruit spawn for now as "Golden Reward"
      }
    }
  }

  // Actions
  waterPlant() {
    this.gainExperience(800);
  }

  // Old fertilize removed, standard actions below

  tillSoil() {
    const now = Date.now();
    if (now - this.lastTillTime() < 60000) return; // 60s cooldown

    this.lastTillTime.set(now);
    this.gainExperience(80);
  }

  // Animation State
  readonly isGrowing = signal(false);

  gainExperience(amount: number) {
    this.experience.update(xp => {
      let newXp = xp + amount;
      let required = this.xpRequired();

      // Level up loop
      while (newXp >= required) {
        newXp -= required;

        // Capture bird count and old slots BEFORE level up
        const birdCount = this.activeBirds().size;
        const oldSlots = this.treeData().slots.map(s => s.id);

        this.level.update(l => l + 1);
        required = this.xpRequired();

        // Migrate birds to new tree structure (Tree stage only)
        if (this.level() >= 17 && birdCount > 0) {
          const newSlots = this.treeData().slots;
          const currentFruits = this.activeFruits();

          // Find free slots (not occupied by fruits)
          const freeSlots = newSlots.filter(s => !currentFruits.has(s.id));

          // Migrate birds: take first N free slots where N = number of birds
          const newBirdSlots = freeSlots.slice(0, Math.min(birdCount, freeSlots.length));

          this.activeBirds.set(new Set(newBirdSlots.map(s => s.id)));
        }

        // Trigger Growth Animation
        this.isGrowing.set(true);
        setTimeout(() => this.isGrowing.set(false), 500);

        // Dynamic Spawn Chance based on Level
        // Base chance 60%, +4% per level.
        const spawnChance = 0.6 + (this.level() * 0.04);

        // Integer part = guaranteed spawns logic (simulated by loop assumption) 
        // e.g. 1.2 -> 1 guaranteed, 20% for 2nd
        const guaranteed = Math.floor(spawnChance);
        const fraction = spawnChance - guaranteed;

        let spawnCount = guaranteed + (Math.random() < fraction ? 1 : 0);

        // Ensure at least random chance works if < 1
        if (spawnCount === 0 && Math.random() < spawnChance) spawnCount = 1;

        for (let i = 0; i < spawnCount; i++) {
          this.spawnFruit();
        }
      }
      return newXp;
    });
  }
  reset() {
    this.level.set(1);
    this.experience.set(0);
    this.lifespan.set(300);
    this.isDead.set(false);
    this.activeFruits.set(new Set());
    this.gold.set(0);
    this.fertilizerLevel.set(0);
  }
}
