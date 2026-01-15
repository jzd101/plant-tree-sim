import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { vi } from 'vitest';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should start at Level 1', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.level()).toBe(1);
    expect(app.experience()).toBe(0);
    expect(app.stage()).toContain('Seed');
  });

  it('should gain XP and level up', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Level 1 requires 100 XP
    // Till Soil gives 80 XP
    app.tillSoil();
    expect(app.experience()).toBe(80);
    expect(app.level()).toBe(1);

    // Till again -> 160 XP total -> -100 XP for Lvl 1 -> 60 XP remaining, Level 2
    app.tillSoil();
    expect(app.level()).toBe(2);
    expect(app.experience()).toBe(60);
  });

  it('should decrease lifespan over time and die', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    const initialLife = app.lifespan();

    // Advance 10s
    vi.advanceTimersByTime(10000);
    expect(app.lifespan()).toBe(initialLife - 10);

    // Kill it (advance remaining time)
    vi.advanceTimersByTime((initialLife - 10) * 1000);
    expect(app.lifespan()).toBe(0);
    expect(app.isDead()).toBe(true);

    vi.useRealTimers();
  });

  it('should prevent actions when dead', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.isDead.set(true);

    app.waterPlant();
    expect(app.experience()).toBe(0);

    app.tillSoil();
    expect(app.experience()).toBe(0);
  });

  it('should reset game state', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.level.set(5);
    app.isDead.set(true);

    app.reset();

    expect(app.level()).toBe(1);
    expect(app.isDead()).toBe(false);
    expect(app.lifespan()).toBe(300);
  });

  it('should generate visual paths based on level', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Level 1: Seed
    app.level.set(1);
    const seedPaths = app.visualPaths();
    expect(seedPaths.length).toBeGreaterThan(0);
    expect(seedPaths[0].fill).toBe('#8B4513'); // Brown seed

    // Level 5: Tree
    app.level.set(5);
    const treePaths = app.visualPaths();
    expect(treePaths.length).toBeGreaterThan(5); // Should have branches

    // Dead
    app.isDead.set(true);
    const deadPaths = app.visualPaths();
    expect(deadPaths.length).toBeGreaterThan(0);
    // Should use dead colors
    expect(deadPaths[0].stroke).toBe('#4B5563');
  });

  it('should handle Golden Fruit economy', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.level.set(5);

    // Verify spawn on level up
    const initialFruits = app.activeFruits().size;
    // Force level up
    app.gainExperience(app.xpRequired() + 10);

    // Should have spawned a fruit
    expect(app.activeFruits().size).toBeGreaterThan(initialFruits);
    const fruitId = Array.from(app.activeFruits())[0];

    // Harvest
    app.harvestFruit(fruitId);
    expect(app.activeFruits().size).toBe(0);
    expect(app.gold()).toBe(1);

    // Buy Upgrade
    app.gold.set(5);
    app.buyAutoFertilizer();
    expect(app.gold()).toBe(0);
    expect(app.fertilizerLevel()).toBe(1);

    // Auto XP (Advance time manually or check logic)
    // We can't easily wait 1s in sync test without fakeAsync, 
    // but we can verify the logic in constructor adds XP if we could simulate interval
  });

  it('should handle Pan and Zoom interactions', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Initial State
    expect(app.viewPos()).toEqual({ x: 0, y: 0 });
    expect(app.zoomLevel()).toBe(1.0);

    // Test Pan (Drag)
    // 1. Mouse Down at 100, 100
    app.onMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
    // 2. Mouse Move to 150, 150 (Moved Right/Down by 50px)
    // Logic: viewPos += delta / zoom. 
    // viewPos.x += 50 / 1 = 50.
    app.onMouseMove({ clientX: 150, clientY: 150 } as MouseEvent);
    expect(app.viewPos()).toEqual({ x: 50, y: 50 });

    // 3. Mouse Up
    app.onMouseUp();
    // 4. Move after up should not change pos
    app.onMouseMove({ clientX: 200, clientY: 200 } as MouseEvent);
    expect(app.viewPos()).toEqual({ x: 50, y: 50 });

    // Test Zoom
    // Wheel deltaY -100 (Scroll Up -> Zoom In)
    // Delta logic: -(-100) * 0.001 = 0.1
    // New Zoom: 1.0 + 0.1 = 1.1
    app.onWheel({ deltaY: -100, preventDefault: () => { } } as WheelEvent);
    expect(app.zoomLevel()).toBeCloseTo(1.1);

    // Reset
    app.resetView();
    expect(app.viewPos()).toEqual({ x: 0, y: 0 });
    expect(app.zoomLevel()).toBe(1.0);
  });
});
