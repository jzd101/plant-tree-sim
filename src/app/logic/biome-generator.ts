import { Biome } from '../models';

export class BiomeGenerator {
    private static biomes: Biome[] = [
        {
            id: 'plains',
            name: 'Green Plains',
            colors: {
                background: 'bg-biome-plains',
                pot: '#A0522D',
                stem: '#4ADE80',
                leafPrimary: '#4ADE80',
                leafSecondary: '#22C55E',
                trunk: '#8B4513'
            },
            modifiers: { growthSpeed: 1.0, branchComplexity: 1.0 }
        },
        {
            id: 'desert',
            name: 'Arid Desert',
            colors: {
                background: 'bg-biome-desert',
                pot: '#9A3412', // Red Clay
                stem: '#84CC16', // Lime (Cactus-y)
                leafPrimary: '#84CC16',
                leafSecondary: '#65A30D',
                trunk: '#A16207' // Sandy Brown
            },
            modifiers: { growthSpeed: 0.8, branchComplexity: 0.8 }
        },
        {
            id: 'mud',
            name: 'Swampy Mudlands',
            colors: {
                background: 'bg-biome-mud',
                pot: '#44403C', // Dark Stone
                stem: '#57534E',
                leafPrimary: '#3F6212', // Dark Olive
                leafSecondary: '#365314',
                trunk: '#292524'
            },
            modifiers: { growthSpeed: 0.9, branchComplexity: 1.2 }
        },
        {
            id: 'forest',
            name: 'Deep Forest',
            colors: {
                background: 'bg-biome-forest',
                pot: '#3F2C22',
                stem: '#166534',
                leafPrimary: '#15803D',
                leafSecondary: '#14532D',
                trunk: '#3E2723'
            },
            modifiers: { growthSpeed: 1.1, branchComplexity: 1.3 }
        },
        {
            id: 'underwater',
            name: 'Abyssal Depths',
            colors: {
                background: 'bg-biome-underwater',
                pot: '#1E3A8A', // Blue stone
                stem: '#06B6D4', // Cyan glowing
                leafPrimary: '#22D3EE',
                leafSecondary: '#0891B2',
                trunk: '#0E7490'
            },
            modifiers: { growthSpeed: 0.7, branchComplexity: 1.5 }
        },
        {
            id: 'lava',
            name: 'Volcanic Crags',
            colors: {
                background: 'bg-biome-lava',
                pot: '#450a0a',
                stem: '#EF4444',
                leafPrimary: '#F87171',
                leafSecondary: '#B91C1C',
                trunk: '#7F1D1D'
            },
            modifiers: { growthSpeed: 1.5, branchComplexity: 0.9 }
        },
        {
            id: 'space',
            name: 'Cosmic Void',
            colors: {
                background: 'bg-biome-space',
                pot: '#C084FC', // Violet
                stem: '#E879F9', // Pink Neon
                leafPrimary: '#C084FC',
                leafSecondary: '#A855F7',
                trunk: '#6B21A8'
            },
            modifiers: { growthSpeed: 2.0, branchComplexity: 1.5, isCosmic: true }
        }
    ];

    static getBiome(stageIndex: number): Biome {
        // Loop through biomes
        const index = stageIndex % this.biomes.length;
        return this.biomes[index];
    }
}
