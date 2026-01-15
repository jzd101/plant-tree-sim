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

  it('should start at Level 1 with Seed Stage', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.level()).toBe(1);
    expect(app.experience()).toBe(0);
    expect(app.stage()).toContain('Seed');
  });

  it('should gain XP and level up to Sprout', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Lvl 1 -> 2 (100xp), 2 -> 3 (200xp), 3 -> 4 (300xp) = Need 600xp to reach Lvl 4 (Sprout)
    // Actually gainExperience loops:
    // Lvl 1 needed: 100. Gift 1000.
    // Lvl 1 -> 2. Rem: 900.
    // Lvl 2 needed: 200. Rem: 700.
    // Lvl 3 needed: 300. Rem: 400.
    // Lvl 4 needed: 400. Rem: 0.
    // Result: Level 5?

    app.gainExperience(1000);

    expect(app.level()).toBeGreaterThan(3);
    expect(app.stage()).toContain('Sprout');
  });

  it('should handle Till Soil cooldown', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    const initialXP = app.experience();

    // First Till: Success
    app.tillSoil();
    expect(app.experience()).toBe(initialXP + 80);
    expect(app.lastTillTime()).toBeGreaterThan(0);

    // Immediate Second Till: Fail (Cooldown)
    const xpAfterFirst = app.experience();
    app.tillSoil();
    expect(app.experience()).toBe(xpAfterFirst);
  });

  it('should buy Instant Fertilizer', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.gold.set(5);
    const initialXP = app.experience();

    // Cost 3, Gives 500 XP. Starts at Level 1 (Req 100), Level 2 (Req 200).
    // 500 -> Lv 1 -> 2 (400 rem) -> Lv 2 -> 3 (200 rem).
    app.buyInstantFertilizer();

    expect(app.gold()).toBe(2); // 5 - 3 = 2
    expect(app.level()).toBe(3);
    expect(app.experience()).toBe(200);
  });

  it('should reset game state', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.level.set(5);
    app.gold.set(10);
    app.reset();

    expect(app.level()).toBe(1);
    expect(app.gold()).toBe(0);
  });

  it('should generate correct visual stages', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Seed (Lvl 1)
    app.level.set(1);
    const seedPaths = app.visualPaths();
    expect(seedPaths.length).toBeGreaterThan(0);
    expect(seedPaths[0].fill).toBe('#8B4513');

    // Sprout (Lvl 5)
    app.level.set(5);
    const sproutPaths = app.visualPaths();
    expect(sproutPaths[0].stroke).toBe('#4ADE80'); // Green stem

    // Sapling (Lvl 10)
    app.level.set(10);
    const saplingPaths = app.visualPaths();
    expect(saplingPaths.length).toBeGreaterThan(2);

    // Tree (Lvl 20)
    app.level.set(20);
    const treePaths = app.visualPaths();
    expect(treePaths.length).toBeGreaterThan(5);
  });

  it('should handle Pan and Zoom interactions', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.onMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
    app.onMouseMove({ clientX: 150, clientY: 150 } as MouseEvent);
    expect(app.viewPos()).toEqual({ x: 50, y: 50 });

    app.onWheel({ deltaY: -100, preventDefault: () => { } } as WheelEvent);
    expect(app.zoomLevel()).toBeCloseTo(1.1);
  });
});
