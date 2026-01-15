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
  readonly lifespan = signal(300); // 5 minutes (300 seconds)
  readonly isDead = signal(false);

  // Computed State
  readonly stage = computed(() => {
    if (this.isDead()) return 'Dead 💀';
    const lvl = this.level();
    if (lvl >= 20) return 'Ancient Tree 🌳';
    if (lvl >= 10) return 'Big Tree 🌳';
    if (lvl >= 5) return 'Tree 🌳';
    if (lvl >= 3) return 'Sapling 🌿';
    if (lvl >= 2) return 'Sprout 🌱';
    return 'Seed 🌰';
  });

  // Calculate XP needed for next level: Level * 100
  readonly xpRequired = computed(() => this.level() * 100);

  // Economy State
  readonly gold = signal(0);
  readonly fertilizerLevel = signal(0);
  readonly activeFruits = signal<Set<string>>(new Set());

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
    if (this.isDead()) {
      return { paths: this.generateTree(this.level(), true).paths, slots: [] };
    }
    const lvl = this.level();
    if (lvl === 1) return { paths: this.generateSeed(), slots: [] };
    if (lvl < 5) return { paths: this.generateSprout(lvl), slots: [] };

    return this.generateTree(lvl, false);
  });

  // Extract just the paths for rendering
  readonly visualPaths = computed(() => this.treeData().paths);

  // Filter active fruits for rendering
  readonly renderedFruits = computed(() => {
    const slots = this.treeData().slots;
    const active = this.activeFruits();
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

  private generateSeed() {
    return [
      { d: 'M100,150 Q100,150 100,150', type: 'seed', stroke: '#8B4513', fill: '#8B4513', width: 0 }, // Placeholder
      // Real seed: Ellipse center at 100,180
      { isCircle: true, cx: 100, cy: 180, rx: 10, ry: 12, fill: '#8B4513' }
    ];
  }

  private generateSprout(lvl: number) {
    const height = 20 + (lvl * 10);
    const paths = [];

    // Stem
    paths.push({
      d: `M100,200 Q105,${200 - height / 2} 100,${200 - height}`,
      stroke: '#4ADE80',
      width: 4,
      fill: 'none'
    });

    // Leaves
    if (lvl >= 2) {
      paths.push({
        d: `M100,${200 - height} Q80,${200 - height - 10} 70,${200 - height + 5} Q90,${200 - height} 100,${200 - height}`,
        fill: '#4ADE80',
        stroke: 'none'
      });
    }
    if (lvl >= 3) {
      paths.push({
        d: `M100,${200 - height} Q120,${200 - height - 10} 130,${200 - height + 5} Q110,${200 - height} 100,${200 - height}`,
        fill: '#4ADE80',
        stroke: 'none'
      });
    }

    return paths;
  }

  private generateTree(lvl: number, isDead: boolean) {
    const paths: any[] = [];
    const slots: any[] = []; // Potential spawn points for fruits
    const maxDepth = Math.min(Math.floor(lvl / 2) + 2, 8); // Cap depth for performance
    const trunkColor = isDead ? '#4B5563' : '#8B4513';

    // Varied green shades for leaves
    const leafColors = ['#22C55E', '#16A34A', '#15803D', '#4ADE80', '#86EFAC'];
    const getLeafColor = (seed: number) => leafColors[Math.floor(Math.abs(seed * 100)) % leafColors.length];

    // Seed random generator to keep tree stable between renders 
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Helper to generate a leaf path
    const getLeafPath = (x: number, y: number, angle: number, scale: number) => {
      // Leaf shape: simple quadratic bezier curves
      // Rotated by angle
      const rad = angle * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // Relative points for a leaf shape (pointing right)
      // 0,0 -> 10, -5 -> 20, 0 -> 10, 5 -> 0,0
      const len = 12 * scale;
      const width = 6 * scale;

      const transform = (dx: number, dy: number) => {
        return `${x + dx * cos - dy * sin},${y + dx * sin + dy * cos}`;
      };

      const p0 = transform(0, 0);
      const p1 = transform(len * 0.5, -width);
      const p2 = transform(len, 0);
      const p3 = transform(len * 0.5, width);

      return `M${p0} Q${p1} ${p2} Q${p3} ${p0}`;
    };

    const drawBranch = (x: number, y: number, angle: number, length: number, depth: number, width: number, pathId: string) => {
      const endX = x + Math.cos(angle * Math.PI / 180) * length;
      const endY = y + Math.sin(angle * Math.PI / 180) * length;

      // Control point for subtle curve
      const curveStrength = length * 0.2;
      const curveAngle = angle + (pseudoRandom(x * y) > 0.5 ? 90 : -90);
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
        const hasTwig = pseudoRandom(x + y + depth) > 0.4;
        if (hasTwig) {
          const twigDir = (pseudoRandom(x) > 0.5 ? 1 : -1);
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
            d: getLeafPath(teX, teY, twigAngle, 0.6),
            fill: getLeafColor(teX + teY),
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
        const spread = 25 + (pseudoRandom(depth) * 10);
        drawBranch(endX, endY, angle - spread, length * 0.85, depth - 1, width * 0.7, pathId + 'L');
        drawBranch(endX, endY, angle + spread, length * 0.85, depth - 1, width * 0.7, pathId + 'R');
      } else if (!isDead) {
        // Tips: Lush Leaf Cluster
        const baseLeafColor = getLeafColor(endX);

        // Main leaf at tip
        paths.push({
          d: getLeafPath(endX, endY, angle, 1.0),
          fill: baseLeafColor,
          stroke: 'none'
        });

        // Side leaves for specific lush look
        const r1 = pseudoRandom(endX);
        const r2 = pseudoRandom(endY);

        // Add 1-2 extra leaves based on level
        if (lvl > 2) {
          paths.push({
            d: getLeafPath(endX, endY, angle - 45, 0.8),
            fill: getLeafColor(endX + 1),
            stroke: 'none'
          });
        }
        if (lvl > 5 && r1 > 0.3) {
          paths.push({
            d: getLeafPath(endX, endY, angle + 45, 0.8),
            fill: getLeafColor(endX + 2),
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
    return { paths, slots };
  }

  constructor() {
    // Decrease lifespan over time
    setInterval(() => {
      if (this.isDead()) return;

      this.lifespan.update(t => {
        const newTime = Math.max(t - 1, 0);
        if (newTime === 0) {
          this.isDead.set(true);
          this.activeFruits.set(new Set()); // Clear fruits on death
        }
        return newTime;
      });

      // Auto-Fertilizer Effect (Passive EXP)
      if (this.fertilizerLevel() > 0) {
        const xpGain = this.fertilizerLevel() * 1000 / 60; // 50exp/min -> ~0.83 exp/sec per level
        this.gainExperience(Math.ceil(xpGain)); // Ceil to ensure at least 1
      }

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

  buyAutoFertilizer() {
    if (this.gold() >= 5) {
      this.gold.update(g => g - 5);
      this.fertilizerLevel.update(l => l + 1);
    }
  }

  // Actions
  waterPlant() {
    if (this.isDead()) return;
    this.gainExperience(20);
  }

  fertilize() {
    if (this.isDead()) return;
    this.gainExperience(1000);
  }

  tillSoil() {
    if (this.isDead()) return;
    this.gainExperience(80);
  }

  gainExperience(amount: number) {
    this.experience.update(xp => {
      let newXp = xp + amount;
      let required = this.xpRequired();

      // Level up loop
      while (newXp >= required) {
        newXp -= required;
        this.level.update(l => l + 1);
        required = this.xpRequired();

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
