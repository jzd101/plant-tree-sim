export interface Biome {
    id: string;
    name: string;
    colors: {
        background: string; // Tailwind class or hex
        pot: string;
        stem: string;
        leafPrimary: string;
        leafSecondary: string;
        trunk: string;
    };
    modifiers: {
        growthSpeed: number; // Multiplier, 1.0 is standard
        branchComplexity: number; // Multiplier for depth
        isCosmic?: boolean; // Special flag for space logic
    };
}

export interface TreeEntity {
    id: string;
    biomeId: string;
    x: number;
    y: number; // Bottom center position
    scale: number;
    paths: any[]; // The finalized SVG paths (baked)
    slots: any[]; // Final slots (fruits/birds baked in?) or ignored for legacy
    score: number;
}

export interface ActiveTreeState {
    level: number;
    experience: number;
    startTime: number;
    x: number;
    y: number;
    scale: number;
}
