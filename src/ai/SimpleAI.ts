import type { GameState } from '../engine/state/GameState';
import { ConstructionSystem } from '../gameplay/systems/ConstructionSystem';
import { Factions } from '../gameplay/rules/FactionData';
import { MovementSystem } from '../gameplay/systems/MovementSystem';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

interface AIConfig {
    checkInterval: number; // Ticks between updates
    waveSize: number;
    resourceMultiplier: number;
    aggression: number; // 0-1, chance to attack when ready
}

const DifficultyConfigs: Record<AIDifficulty, AIConfig> = {
    'easy': {
        checkInterval: 120, // Slow updates (every 6s)
        waveSize: 5,
        resourceMultiplier: 1.0,
        aggression: 0.5
    },
    'medium': {
        checkInterval: 60, // Normal updates (every 3s)
        waveSize: 8,
        resourceMultiplier: 1.2, // Slight cheat
        aggression: 0.8
    },
    'hard': {
        checkInterval: 30, // Fast updates (every 1.5s)
        waveSize: 12,
        resourceMultiplier: 1.5, // Big cheat
        aggression: 1.0
    }
};

export class SimpleAI {
    private playerId: string;
    private constructionSystem: ConstructionSystem;
    private movementSystem: MovementSystem;
    private difficulty: AIDifficulty;
    private config: AIConfig;

    private buildOrder: string[] = ['power_plant', 'barracks', 'refinery', 'power_plant', 'barracks', 'heavy_tank']; // Expanded build order
    private buildIndex: number = 0;
    private attackWaveSize: number;

    constructor(playerId: string, constructionSystem: ConstructionSystem, movementSystem: MovementSystem, difficulty: AIDifficulty = 'medium') {
        this.playerId = playerId;
        this.constructionSystem = constructionSystem;
        this.movementSystem = movementSystem;
        this.difficulty = difficulty;
        this.config = DifficultyConfigs[difficulty];
        this.attackWaveSize = this.config.waveSize;
    }

    public update(state: GameState, _dt: number) {
        // Throttle based on difficulty
        if (state.tick % this.config.checkInterval !== 0) return;

        this.manageEconomy(state);
        this.manageArmy(state);
    }

    private manageEconomy(state: GameState) {
        const player = state.players[this.playerId];
        if (!player) return;

        const faction = Factions[player.factionId];
        if (!faction) return;

        // Resource cheat (simple implementation: just add resources periodically if low)
        // Or better: multiply income. But we don't have income logic here yet (it's in ResourceSystem).
        // Let's just give a trickle for Hard AI if they are stuck?
        // Actually, let's apply the multiplier when spending? No, that makes things cheaper.
        // Let's simulate extra income.
        if (this.difficulty !== 'easy' && state.tick % 200 === 0) {
            player.resources += 50 * (this.config.resourceMultiplier - 1) * 10; // Bonus
        }

        // Build base
        if (this.buildIndex < this.buildOrder.length) {
            const buildingId = this.buildOrder[this.buildIndex];
            // Handle units in build order?
            // My buildOrder currently mixes buildings and units? 
            // The previous implementation assumed only buildings in buildOrder.
            // Let's check if it's a building.

            if (faction.buildings[buildingId]) {
                const def = faction.buildings[buildingId];
                if (def && player.resources >= def.cost) {
                    // Find a spot
                    const hq = Object.values(state.entities).find(e => e.ownerId === this.playerId && e.type === 'hq');
                    if (hq) {
                        // Spiral search for placement
                        let placed = false;
                        for (let r = 4; r < 15; r += 2) {
                            if (placed) break;
                            for (let i = 0; i < 8; i++) {
                                const angle = (Math.PI * 2 * i) / 8;
                                const pos = {
                                    x: Math.round(hq.position.x + Math.cos(angle) * r),
                                    y: Math.round(hq.position.y + Math.sin(angle) * r)
                                };
                                if (this.constructionSystem.build(state, this.playerId, buildingId, pos)) {
                                    this.buildIndex++;
                                    placed = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            } else {
                // It's a unit or something else, skip for now in this function
                // We handle units in manageArmy
                // But if it's in buildOrder, we should probably increment index if we build it?
                // Let's keep buildOrder for buildings only for this simple AI
                // and remove non-buildings from the list above or handle them.
                // I'll just skip non-buildings here.
                if (!faction.buildings[buildingId]) {
                    this.buildIndex++;
                }
            }
        }
    }

    private manageArmy(state: GameState) {
        const player = state.players[this.playerId];
        if (!player) return;

        const faction = Factions[player.factionId];
        if (!faction) return;

        // Train units
        // Simple logic: maintain army size
        const myUnits = Object.values(state.entities).filter(e => e.ownerId === this.playerId && (faction.units[e.type]));

        // Determine unit to build (random or fixed)
        const unitType = Math.random() > 0.5 ? Object.keys(faction.units)[0] : Object.keys(faction.units)[1];
        const unitDef = faction.units[unitType];

        if (unitDef && player.resources >= unitDef.cost) {
            // Find barracks
            const barracks = Object.values(state.entities).find(e => e.ownerId === this.playerId && e.type === 'barracks');
            if (barracks) {
                // Spawn unit (cheat for now, no queue time)
                // In real game, add to queue.
                // We need a way to spawn units properly.
                // Let's add a helper or just spawn it here.
                // We need to deduct cost.
                player.resources -= unitDef.cost;

                // Spawn near barracks
                const id = `ai_unit_${state.tick}_${Math.random()}`; // unique id
                state.entities[id] = {
                    id,
                    type: unitType,
                    ownerId: this.playerId,
                    position: { x: barracks.position.x + 2, y: barracks.position.y + 2 }, // Offset
                    width: unitDef.width,
                    height: unitDef.height,
                    health: unitDef.health,
                    maxHealth: unitDef.health,
                    assetId: unitDef.assetId,
                    speed: unitDef.speed,
                    damage: unitDef.damage,
                    range: unitDef.range,
                    vision: unitDef.vision
                };
            }
        }

        // Attack logic
        if (myUnits.length >= this.attackWaveSize) {
            if (Math.random() < this.config.aggression) {
                // Find enemy HQ
                const enemyHQ = Object.values(state.entities).find(e => e.ownerId !== this.playerId && e.type === 'hq');
                if (enemyHQ) {
                    myUnits.forEach(unit => {
                        this.movementSystem.setPath(unit, enemyHQ.position);
                    });
                    // Reset wave size to trigger next wave later? 
                    // Or just keep attacking. 
                    // Simple AI: Keep attacking.
                }
            }
        }
    }
}
