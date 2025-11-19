export interface BuildingDefinition {
    id: string;
    name: string;
    cost: number;
    buildTime: number;
    width: number;
    height: number;
    prerequisites: string[];
}

export const BuildingDefinitions: Record<string, BuildingDefinition> = {
    'hq': {
        id: 'hq',
        name: 'Headquarters',
        cost: 0,
        buildTime: 0,
        width: 3,
        height: 3,
        prerequisites: []
    },
    'power_plant': {
        id: 'power_plant',
        name: 'Power Plant',
        cost: 300,
        buildTime: 5,
        width: 2,
        height: 2,
        prerequisites: ['hq']
    },
    'barracks': {
        id: 'barracks',
        name: 'Barracks',
        cost: 500,
        buildTime: 10,
        width: 3,
        height: 2,
        prerequisites: ['power_plant']
    },
    'refinery': {
        id: 'refinery',
        name: 'Ore Refinery',
        cost: 1000,
        buildTime: 15,
        width: 3,
        height: 3,
        prerequisites: ['power_plant']
    }
};
