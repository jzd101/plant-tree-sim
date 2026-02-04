import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Biome, TreeEntity, ActiveTreeState } from './models';
import { BiomeGenerator } from './logic/biome-generator';
import { CollisionSystem } from './logic/collision-system';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Game State Signals
  readonly biomeStage = signal(0); // 0 = First Biome
  readonly totalScore = signal(0);
  readonly isGameOver = signal(false);

  // Entities
  readonly legacyTrees = signal<TreeEntity[]>([]);

  // Active Tree State (The one currently growing)
  readonly activeTree = signal<ActiveTreeState>({
    level: 1,
    experience: 0,
    startTime: Date.now(),
    x: 200, // Default Center
    y: 350,
    scale: 1.0
  });

  // Derived Values
  readonly currentBiome = computed(() => BiomeGenerator.getBiome(this.biomeStage()));

  // Game Actions Support
  readonly lastTillTime = signal(0);
  readonly now = signal(Date.now());
  readonly lastActionCritical = signal(false); // UI Trigger

  // Economy (Simplified Scope: Gold is global score multiplier or simple resource)
  readonly gold = signal(0); // We can keep gold for shop items maybe?
  readonly activeFruits = signal<Set<string>>(new Set());
  readonly activeBirds = signal<Set<string>>(new Set());

  // View State
  readonly viewPos = signal({ x: 0, y: 0 });
  readonly zoomLevel = signal(1.0);
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };

  readonly viewBox = computed(() => {
    const w = 400 / this.zoomLevel();
    const h = 500 / this.zoomLevel();
    const x = -this.viewPos().x - (w / 2) + 200; // Center on screen
    const y = -this.viewPos().y - (h / 2) + 250;
    return `${x} ${y} ${w} ${h}`;
  });

  // --- Tree Generation Logic ---

  readonly treeData = computed(() => {
    const state = this.activeTree();
    const biome = this.currentBiome();

    // Inject Biome colors into generation
    return this.generateTreeVisuals(state.level, biome, state.x, state.y, state.scale);
  });

  // Pre-calculated stats
  readonly xpRequired = computed(() => this.activeTree().level * 100);
  readonly stageLabel = computed(() => {
    const lvl = this.activeTree().level;
    if (lvl <= 3) return `Seed Stage ${lvl}`;
    if (lvl <= 8) return `Sprout Stage ${lvl - 3}`;
    if (lvl <= 16) return `Sapling Stage ${lvl - 8}`;
    return `Mature Tree`;
  });

  // Filter Active Interactables
  readonly renderedFruits = computed(() => {
    const slots = this.treeData().slots;
    const active = this.activeFruits();
    return slots.filter(slot => active.has(slot.id));
  });

  constructor() {
    setInterval(() => {
      this.now.set(Date.now());
      // Reset crit flag automatically after short delay for UI
      if (this.lastActionCritical()) {
        setTimeout(() => this.lastActionCritical.set(false), 2000);
      }
    }, 1000);
  }

  // --- ACTIONS ---

  // Wildcard State
  readonly growthMultiplier = signal(1); // Global growth multiplier
  readonly wildcardCooldowns = signal<Map<string, number>>(new Map()); // Item ID -> Timestamp
  readonly lastWildcardEffect = signal<{ text: string, color: string } | null>(null);

  // --- ACTIONS ---

  waterPlant() {
    this.processAction(80);
  }

  tillSoil() {
    const now = Date.now();
    if (now - this.lastTillTime() < 60000) return;
    this.lastTillTime.set(now);
    this.processAction(80);
    // Requested Feature: 2x Growth for 5 seconds
    this.applyGrowthBuff(2, 5000, "Fresh Soil! (2x Speed)", "text-amber-500");
  }

  // Unified action handler for crit logic
  private processAction(baseXp: number) {
    const isCrit = Math.random() < 0.2; // 20% Chance
    this.lastActionCritical.set(isCrit);

    const multiplier = isCrit ? 5 : 1; // 5x XP on Crit
    this.gainExperience(baseXp * multiplier);

    if (isCrit) {
      this.totalScore.update(s => s + 100);
    }
  }

  harvestFruit(id: string) {
    if (!this.activeFruits().has(id)) return;
    this.activeFruits.update(set => {
      const newSet = new Set(set);
      newSet.delete(id);
      return newSet;
    });
    this.gold.update(g => g + 1);
    this.totalScore.update(s => s + 50); // Action score
  }

  // --- WILDCARD ITEMS ---

  useWildcard(itemId: string) {
    const now = Date.now();

    // Check Cooldown
    const cooldowns = this.wildcardCooldowns();
    if (cooldowns.has(itemId) && cooldowns.get(itemId)! > now) return;

    // Item Config
    let cost = 0;
    if (itemId === 'mystery_potion') cost = 500;
    else if (itemId === 'chaos_seed') cost = 1500;

    // Check Cost
    if (this.totalScore() < cost) {
      this.showEffectText("Not Enough Score!", "text-red-500");
      return;
    }

    // Pay Cost
    this.totalScore.update(s => s - cost);

    // Apply Effect
    this.applyWildcardEffect(itemId);

    // Set Random Cooldown (1s - 600s) -> 1000ms to 600000ms
    const cdDuration = Math.floor(Math.random() * 599000) + 1000;
    const readyTime = now + cdDuration;

    this.wildcardCooldowns.update(map => {
      const newMap = new Map(map);
      newMap.set(itemId, readyTime);
      return newMap;
    });
  }

  private applyWildcardEffect(itemId: string) {
    const roll = Math.random();

    if (itemId === 'mystery_potion') {
      // Tier 1: Good chance of minor buffs, small chance of bad
      if (roll < 0.1) {
        // 10% Bad: Drought (0.5x Growth for 20s)
        this.applyGrowthBuff(0.5, 20000, "Drought! (0.5x Growth)", "text-gray-500");
      } else if (roll < 0.6) {
        // 50% Good: Growth Boost (2x for 30s)
        this.applyGrowthBuff(2, 30000, "Growth Boost! (2x Speed)", "text-green-400");
      } else if (roll < 0.9) {
        // 30% Great: Super Growth (5x for 15s)
        this.applyGrowthBuff(5, 15000, "Super Growth! (5x Speed)", "text-blue-400");
      } else {
        // 10% Amazing: Instant Level Up
        this.gainExperience(this.xpRequired() - this.activeTree().experience);
        this.showEffectText("Instant Level Up!", "text-yellow-400");
      }
    }
    else if (itemId === 'chaos_seed') {
      // Tier 2: High Risk, High Reward
      // 40% CATASTROPHE (Requested change)
      if (roll < 0.4) {
        // 40% Tree Dies
        this.killActiveTree();
        this.showEffectText("CATASTROPHE! Tree Died.", "text-red-600");
      } else if (roll < 0.6) {
        // 20% Bad: Score Penalty (0.4 to 0.6)
        this.totalScore.update(s => Math.max(0, s - 1000));
        this.showEffectText("Lost 1000 Score!", "text-red-400");
      } else if (roll < 0.9) {
        // 30% Amazing: Mega Growth (10x for 60s) (0.6 to 0.9)
        this.applyGrowthBuff(10, 60000, "MEGA GROWTH! (10x Speed)", "text-purple-400");
      } else {
        // 10% Legendary: Instant Maturity (0.9 to 1.0)
        this.activeTree.update(s => ({ ...s, level: 20, experience: 0 }));
        this.completeTree();
        this.showEffectText("INSTANT MATURITY!", "text-amber-400");
      }
    }
  }

  private applyGrowthBuff(multiplier: number, duration: number, label: string, color: string) {
    this.growthMultiplier.set(multiplier);
    this.showEffectText(label, color);
    setTimeout(() => {
      this.growthMultiplier.set(1); // Reset
    }, duration);
  }

  private showEffectText(text: string, color: string) {
    this.lastWildcardEffect.set({ text, color });
    setTimeout(() => this.lastWildcardEffect.set(null), 3000);
  }

  private killActiveTree() {
    // Reset current tree to level 1, keep position/biome
    this.activeTree.update(t => ({
      ...t,
      level: 1,
      experience: 0,
      startTime: Date.now()
    }));
  }

  // --- CORE GAME LOOP ---

  gainExperience(amount: number) {
    if (this.isGameOver()) return;

    // Apply Multiplier
    const finalAmount = amount * this.growthMultiplier();

    this.activeTree.update(state => {
      let newXp = state.experience + finalAmount;
      let newLevel = state.level;
      let req = newLevel * 100;

      while (newXp >= req) {
        newXp -= req;
        newLevel++;
        req = newLevel * 100;

        // Spawn Logic
        if (newLevel >= 4) this.trySpawnFruit(newLevel);
      }

      return { ...state, experience: newXp, level: newLevel };
    });

    // CHECK MATURITY (e.g., Level 20)
    if (this.activeTree().level >= 20) {
      this.completeTree();
    }
  }

  completeTree() {
    // 1. Calculate Score based on speed
    const durationSeconds = (Date.now() - this.activeTree().startTime) / 1000;
    // Base 5000 - (10 pts per second), min 1000
    const timeBonus = Math.max(1000, 5000 - (durationSeconds * 10));

    const treeScore = Math.floor(timeBonus + (this.activeTree().level * 50));
    this.totalScore.update(s => s + treeScore);

    // 2. Bake Current Tree to Legacy
    const bakedTree: TreeEntity = {
      id: `tree-${Date.now()}`,
      biomeId: this.currentBiome().id,
      x: this.activeTree().x,
      y: this.activeTree().y,
      scale: this.activeTree().scale,
      paths: this.treeData().paths, // Use the computed paths
      slots: [],
      score: treeScore
    };

    this.legacyTrees.update(trees => [...trees, bakedTree]);

    // 3. Increment Biome
    this.biomeStage.update(s => s + 1);

    // 4. Try Spawn New
    const newPos = CollisionSystem.findValidSpawnPosition(this.legacyTrees());

    if (newPos) {
      // RESET for New Tree
      this.activeTree.set({
        level: 1,
        experience: 0,
        startTime: Date.now(),
        x: newPos.x,
        y: newPos.y,
        // Scale: 0.7 to 1.3 (Wider variance)
        scale: 0.7 + (Math.random() * 0.6)
      });
      // Clear Interactables
      this.activeFruits.set(new Set());
      this.activeBirds.set(new Set());
    } else {
      // GAME OVER
      this.isGameOver.set(true);
    }
  }

  restartGame() {
    this.biomeStage.set(0);
    this.totalScore.set(0);
    this.legacyTrees.set([]);
    this.isGameOver.set(false);
    this.activeTree.set({
      level: 1,
      experience: 0,
      startTime: Date.now(),
      x: 200,
      y: 350,
      scale: 1.0
    });
    this.activeFruits.set(new Set());
    this.activeBirds.set(new Set());
  }

  // --- HELPERS ---

  private trySpawnFruit(level: number) {
    const slots = this.treeData().slots;
    if (slots.length === 0) return;
    if (this.activeFruits().size > 5) return;

    if (Math.random() < 0.3) {
      const free = slots.filter(s => !this.activeFruits().has(s.id));
      if (free.length > 0) {
        const pick = free[Math.floor(Math.random() * free.length)];
        this.activeFruits.update(s => {
          const next = new Set(s);
          next.add(pick.id);
          return next;
        });
      }
    }
  }

  // --- GENERATION (Adapted to accept x, y, biome, scale) ---

  private generateTreeVisuals(level: number, biome: Biome, tx: number, ty: number, scale: number = 1) {
    const paths: any[] = [];
    const slots: any[] = [];

    // Helper to transform local coords to tree position
    // ...

    // Pot
    if (level <= 3) {
      // Seed - Apply Scale
      // Local Pot: M80,200...
      // Shift by (tx - 100, ty - 200) around center?
      // Simplified: Just draw standard pot at scale
      // Pot is small, scale effect is negligible or simple

      const s = scale;
      // Let's rely on tx,ty being center bottom.
      // Pot drawing was hardcoded. Let's fix pot drawing relative to tx,ty.

      const potW = 40 * s;
      const potH = 40 * s;

      paths.push({
        d: `M${tx - potW / 2},${ty} L${tx + potW / 2},${ty} L${tx + potW / 4},${ty + potH} L${tx - potW / 4},${ty + potH} Z`,
        fill: biome.colors.pot, stroke: biome.colors.trunk, width: 2 * s, type: 'pot'
      });
      paths.push({
        isCircle: true, cx: tx, cy: ty + (15 * s), r: 6 * s, fill: biome.colors.trunk
      });
      return { paths, slots };
    }

    // For Sprout/Sapling/Tree simplify to one generator for brevity in this refactor
    // Pass visual params
    return this.generateRecursiveTree(level, biome, tx, ty, scale);
  }

  // Unified Recursive Generator
  private generateRecursiveTree(lvl: number, biome: Biome, tx: number, ty: number, scale: number) {
    const paths: any[] = [];
    const slots: any[] = [];

    const seed = lvl * tx; // Unique seed per position
    const growthMod = biome.modifiers.growthSpeed;

    // Base Height increases with level + Scale
    const maxH = (lvl * 12 * growthMod) * scale;
    const startW = Math.min(20, lvl * 1.5) * scale;

    const drawInfo = { count: 0 };

    const branch = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
      drawInfo.count++;
      if (len < 5 * scale || w < 0.5 * scale) return;

      const endX = x + Math.cos(ang * Math.PI / 180) * len;
      const endY = y + Math.sin(ang * Math.PI / 180) * len;

      // Curve: Add organic sway based on depth/randomness
      const sway = ((Math.sin(depth * 0.5) * 20) + (Math.random() * 10 - 5)) * scale;
      const cpX = (x + endX) / 2 + sway;
      const cpY = (y + endY) / 2;

      paths.push({
        d: `M${x},${y} Q${cpX},${cpY} ${endX},${endY}`,
        stroke: w > 3 * scale ? biome.colors.trunk : biome.colors.stem,
        width: w,
        fill: 'none'
      });

      // Leaves / Fruit
      if (len < 20 * scale || (lvl > 10 && len < 40 * scale && Math.random() > 0.6)) {
        // Tip
        paths.push({
          d: this.getLeafPath(endX, endY, ang, 1 * scale), // Pass scale to leaf
          fill: Math.random() > 0.5 ? biome.colors.leafPrimary : biome.colors.leafSecondary,
          stroke: 'none'
        });

        if (Math.random() < 0.1) {
          slots.push({ id: `slot-${Math.floor(endX)}-${Math.floor(endY)}`, cx: endX, cy: endY });
        }
      }

      // Split Logic
      // Cap complexity based on (Level * Biome Modifier)
      // Decrement 'depth' (which in this context acts as 'remaining energy')
      // Original request: "Not just one direction"

      if (depth > 0) {
        const subLen = len * 0.75;
        const subW = w * 0.7;

        // Branch count: 1 to 3 based on randomness & biome
        let branchCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 branches normally
        if (biome.modifiers.branchComplexity > 1.2) branchCount = 3;

        // Spread: Randomize the full arc of the split
        const maxSpread = 50 + (Math.random() * 20); // 50-70 degrees spread
        const startAngle = ang - (maxSpread / 2);
        const angleStep = maxSpread / (branchCount - 1 || 1);

        for (let i = 0; i < branchCount; i++) {
          // Jitter the angle slightly
          const targetAng = startAngle + (angleStep * i) + (Math.random() * 10 - 5);
          branch(endX, endY, targetAng, subLen, subW, depth - 1);
        }
      }
    };

    // START
    // Roots
    paths.push({
      d: `M${tx - (20 * scale)},${ty} Q${tx},${ty + (20 * scale)} ${tx + (20 * scale)},${ty}`,
      fill: 'none', stroke: biome.colors.trunk, width: 4 * scale
    });

    // Initial call
    // Depth roughly correlates to Level, but capped.
    const maxDepth = Math.min(8, 2 + Math.floor(lvl / 3));
    branch(tx, ty, -90, (40 + (lvl * 5)) * scale, startW, maxDepth);

    return { paths, slots };
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

  // --- Interaction ---
  onMouseDown(e: MouseEvent) { this.isDragging = true; this.dragStart = { x: e.clientX, y: e.clientY }; }
  onMouseUp() { this.isDragging = false; }
  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.viewPos.update(p => ({ x: p.x + dx / this.zoomLevel(), y: p.y + dy / this.zoomLevel() }));
  }
  onWheel(e: WheelEvent) {
    e.preventDefault();
    const d = -e.deltaY * 0.001;
    this.zoomLevel.update(z => Math.max(0.2, Math.min(4, z + d)));
  }
  resetView() {
    this.viewPos.set({ x: 0, y: 0 });
    this.zoomLevel.set(1.0);
  }
}
