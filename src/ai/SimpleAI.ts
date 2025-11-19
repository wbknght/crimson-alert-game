import type { GameState } from '../engine/state/GameState';
import { ConstructionSystem } from '../gameplay/systems/ConstructionSystem';
import { BuildingDefinitions } from '../gameplay/rules/BuildingRules';
import { MovementSystem } from '../gameplay/systems/MovementSystem';

export class SimpleAI {
    private playerId: string;
    private constructionSystem: ConstructionSystem;
    private movementSystem: MovementSystem;
    private buildOrder: string[] = ['power_plant', 'barracks', 'refinery'];
    private buildIndex: number = 0;
    // private lastActionTime: number = 0; // Unused
    private attackWaveSize: number = 3;

    constructor(playerId: string, constructionSystem: ConstructionSystem, movementSystem: MovementSystem) {
        this.playerId = playerId;
        this.constructionSystem = constructionSystem;
        this.movementSystem = movementSystem;
    }

    public update(state: GameState, _dt: number) {
        // Simple throttle
        if (state.tick % 60 !== 0) return; // Check every 3 seconds approx (assuming 20 ticks/sec)

        this.manageEconomy(state);
        this.manageArmy(state);
    }

    private manageEconomy(state: GameState) {
        const player = state.players[this.playerId];
        if (!player) return;

        // Build base
        if (this.buildIndex < this.buildOrder.length) {
            const buildingId = this.buildOrder[this.buildIndex];
            const def = BuildingDefinitions[buildingId];

            if (player.resources >= def.cost) {
                // Find a spot
                // Very simple placement: just find a spot near HQ
                // For prototype, hardcode positions or simple scan
                const hq = Object.values(state.entities).find(e => e.ownerId === this.playerId && e.type === 'hq');
                if (hq) {
                    // Try to build in a grid around HQ
                    // This is very dumb placement
                    const offsets = [
                        { x: 4, y: 0 }, { x: -4, y: 0 }, { x: 0, y: 4 }, { x: 0, y: -4 },
                        { x: 4, y: 4 }, { x: -4, y: -4 }, { x: 4, y: -4 }, { x: -4, y: 4 }
                    ];

                    for (const offset of offsets) {
                        const pos = { x: hq.position.x + offset.x, y: hq.position.y + offset.y };
                        if (this.constructionSystem.build(state, this.playerId, buildingId, pos)) {
                            this.buildIndex++;
                            break;
                        }
                    }
                }
            }
        }
    }

    private manageArmy(state: GameState) {
        // Train units if we have barracks
        // For now, we don't have a 'ProductionSystem' for units, so let's just cheat/spawn them if we have barracks
        // In a real game, we'd queue them in the barracks.

        const barracks = Object.values(state.entities).find(e => e.ownerId === this.playerId && e.type === 'barracks');
        const player = state.players[this.playerId];

        if (barracks && player.resources >= 100) { // Rifleman cost
            // Cheat spawn unit
            // TODO: Use ProductionSystem
            // For prototype:
            // Check if we have enough units
            const myUnits = Object.values(state.entities).filter(e => e.ownerId === this.playerId && e.type === 'rifleman');

            if (myUnits.length < 10) {
                // Spawn one
                // player.resources -= 100; // Cost
                // Spawn logic... (needs access to state entities, which we have)
                // But we should probably use a system.
                // Let's skip unit training for this exact step and focus on the structure.
                // Or assume ConstructionSystem can build units too? No.
            }

            // Attack logic
            if (myUnits.length >= this.attackWaveSize) {
                // Find enemy HQ
                const enemyHQ = Object.values(state.entities).find(e => e.ownerId !== this.playerId && e.type === 'hq');
                if (enemyHQ) {
                    myUnits.forEach(unit => {
                        this.movementSystem.setPath(unit, enemyHQ.position);
                    });
                }
            }
        }
    }
}
