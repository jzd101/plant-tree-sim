import { TreeEntity } from '../models';

export class CollisionSystem {
    // Tree "FOOTPRINT" radius for collision purposes (Pot size approx width=40, so r=25 safe)
    private static readonly TREE_RADIUS = 30;

    // Padding from screen edges (assume 400x500 standard view coords)
    private static readonly MIN_X = 50;
    private static readonly MAX_X = 350;
    private static readonly MIN_Y = 200; // Keep trees somewhat in lower half for perspective
    private static readonly MAX_Y = 400; // Keep space at bottom

    static findValidSpawnPosition(existingTrees: TreeEntity[], maxAttempts = 50): { x: number, y: number } | null {
        if (existingTrees.length === 0) {
            // First tree always center
            return { x: 200, y: 350 };
        }

        for (let i = 0; i < maxAttempts; i++) {
            const x = Math.floor(Math.random() * (this.MAX_X - this.MIN_X + 1)) + this.MIN_X;
            const y = Math.floor(Math.random() * (this.MAX_Y - this.MIN_Y + 1)) + this.MIN_Y;

            if (this.isValidPosition(x, y, existingTrees)) {
                return { x, y };
            }
        }

        return null; // No valid position found -> Game Over condition
    }

    private static isValidPosition(x: number, y: number, trees: TreeEntity[]): boolean {
        for (const tree of trees) {
            // Simple distance check
            const dx = x - tree.x;
            const dy = y - tree.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check against scaled radius
            const combinedRadius = this.TREE_RADIUS + (this.TREE_RADIUS * tree.scale);

            if (distance < combinedRadius * 0.8) { // Allow slight overlap (20%) for density
                return false;
            }
        }
        return true;
    }
}
