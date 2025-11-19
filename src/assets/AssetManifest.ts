export interface AssetDefinition {
    id: string;
    src: string; // Path relative to public/ or assets/
    type: 'image' | 'spritesheet' | 'json';
    metadata?: {
        scale?: number;
        anchor?: { x: number; y: number };
        frameWidth?: number;
        frameHeight?: number;
        animations?: Record<string, number[]>; // Animation name -> frame indices
    };
}

export interface AssetManifest {
    assets: AssetDefinition[];
}

// Default manifest with placeholders
export const defaultManifest: AssetManifest = {
    assets: [
        {
            id: 'unit_rifleman',
            src: 'assets/placeholders/rifleman.svg',
            type: 'image',
            metadata: { scale: 1, anchor: { x: 0.5, y: 0.5 } }
        },
        {
            id: 'unit_tank',
            src: 'assets/placeholders/tank.svg',
            type: 'image',
            metadata: { scale: 1, anchor: { x: 0.5, y: 0.5 } }
        },
        {
            id: 'building_hq',
            src: 'assets/placeholders/hq.svg',
            type: 'image',
            metadata: { scale: 1, anchor: { x: 0.5, y: 0.5 } }
        },
        {
            id: 'terrain_grass',
            src: 'assets/placeholders/grass.svg',
            type: 'image',
        },
        {
            id: 'projectile',
            src: 'assets/placeholders/projectile.svg',
            type: 'image',
            metadata: { anchor: { x: 0.5, y: 0.5 } }
        }
    ]
};
