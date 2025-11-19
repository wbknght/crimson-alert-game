export type UnitType = 'infantry' | 'vehicle' | 'aircraft' | 'building';

export interface UnitStats {
    id: string;
    name: string;
    type: UnitType;
    cost: number;
    buildTime: number; // in ticks
    health: number;
    speed: number; // tiles per tick (approx)
    range: number; // tiles
    damage: number;
    fireRate: number; // ticks between shots
    width: number;
    height: number;
    assetId: string;
}

export interface FactionData {
    id: string;
    name: string;
    color: number;
    units: Record<string, UnitStats>;
    buildings: Record<string, UnitStats>; // Buildings are just static units effectively
}

// Faction A: "Crimson Guard" (Heavy, slow, powerful)
export const FactionCrimson: FactionData = {
    id: 'crimson',
    name: 'Crimson Guard',
    color: 0xff0000,
    units: {
        'trooper': {
            id: 'trooper',
            name: 'Shock Trooper',
            type: 'infantry',
            cost: 150,
            buildTime: 100,
            health: 120,
            speed: 0.04,
            range: 4,
            damage: 15,
            fireRate: 30,
            width: 1,
            height: 1,
            assetId: 'unit_rifleman' // Placeholder
        },
        'heavy_tank': {
            id: 'heavy_tank',
            name: 'Mammoth Tank',
            type: 'vehicle',
            cost: 900,
            buildTime: 400,
            health: 800,
            speed: 0.03,
            range: 6,
            damage: 60,
            fireRate: 60,
            width: 1,
            height: 1,
            assetId: 'unit_tank'
        }
    },
    buildings: {
        'hq': {
            id: 'hq',
            name: 'Headquarters',
            type: 'building',
            cost: 0,
            buildTime: 0,
            health: 2000,
            speed: 0,
            range: 0,
            damage: 0,
            fireRate: 0,
            width: 3,
            height: 3,
            assetId: 'building_hq'
        },
        // Add more...
    }
};

// Faction B: "Liberty Corps" (Fast, cheap, versatile)
export const FactionLiberty: FactionData = {
    id: 'liberty',
    name: 'Liberty Corps',
    color: 0x0000ff,
    units: {
        'ranger': {
            id: 'ranger',
            name: 'Ranger',
            type: 'infantry',
            cost: 100,
            buildTime: 80,
            health: 80,
            speed: 0.06,
            range: 5,
            damage: 10,
            fireRate: 20,
            width: 1,
            height: 1,
            assetId: 'unit_rifleman' // Placeholder
        },
        'light_tank': {
            id: 'light_tank',
            name: 'Mirage Tank',
            type: 'vehicle',
            cost: 700,
            buildTime: 300,
            health: 500,
            speed: 0.05,
            range: 5,
            damage: 40,
            fireRate: 40,
            width: 1,
            height: 1,
            assetId: 'unit_tank'
        }
    },
    buildings: {
        'hq': {
            id: 'hq',
            name: 'Headquarters',
            type: 'building',
            cost: 0,
            buildTime: 0,
            health: 1500,
            speed: 0,
            range: 0,
            damage: 0,
            fireRate: 0,
            width: 3,
            height: 3,
            assetId: 'building_hq'
        }
    }
};

export const Factions: Record<string, FactionData> = {
    'crimson': FactionCrimson,
    'liberty': FactionLiberty
};
