import type { GameState, Entity } from '../../engine/state/GameState';
import { MovementSystem } from './MovementSystem';
// import type { MapData } from '../../maps/MapData';

export class ResourceSystem {
    private movementSystem: MovementSystem;

    constructor(movementSystem: MovementSystem) {
        this.movementSystem = movementSystem;
    }

    public update(state: GameState, dt: number) {
        Object.values(state.entities).forEach(entity => {
            if (entity.type === 'harvester') {
                this.updateHarvester(entity, state, dt);
            }
        });
    }

    private updateHarvester(harvester: Entity, state: GameState, dt: number) {
        // Simple State Machine
        // States: 'idle', 'moving_to_resource', 'harvesting', 'moving_to_refinery', 'unloading'

        const harvesterState = harvester.state || 'idle';

        if (harvesterState === 'idle') {
            // Find nearest resource
            const resource = this.findNearestResource(harvester, state);
            if (resource) {
                harvester.targetResourceId = resource.id;
                harvester.state = 'moving_to_resource';
                this.movementSystem.setPath(harvester, resource.position);
            }
        } else if (harvesterState === 'moving_to_resource') {
            if (!harvester.path && !harvester.targetPosition) {
                // Arrived
                harvester.state = 'harvesting';
                harvester.harvestTimer = 0;
            }
        } else if (harvesterState === 'harvesting') {
            harvester.harvestTimer = (harvester.harvestTimer || 0) + dt;
            if (harvester.harvestTimer > 2000) { // 2 seconds to harvest
                harvester.payload = (harvester.payload || 0) + 500;
                harvester.state = 'moving_to_refinery';

                // Find nearest refinery
                const refinery = this.findNearestRefinery(harvester, state);
                if (refinery) {
                    this.movementSystem.setPath(harvester, refinery.position);
                } else {
                    // No refinery, go idle or stay here
                    harvester.state = 'idle';
                }
            }
        } else if (harvesterState === 'moving_to_refinery') {
            if (!harvester.path && !harvester.targetPosition) {
                // Arrived
                harvester.state = 'unloading';
                harvester.unloadTimer = 0;
            }
        } else if (harvesterState === 'unloading') {
            harvester.unloadTimer = (harvester.unloadTimer || 0) + dt;
            if (harvester.unloadTimer > 1000) { // 1 second to unload
                // Add to player resources
                const player = state.players[harvester.ownerId];
                if (player) {
                    player.resources += harvester.payload || 0;
                }
                harvester.payload = 0;
                harvester.state = 'idle';
            }
        }
    }

    private findNearestResource(entity: Entity, state: GameState): Entity | null {
        let nearest: Entity | null = null;
        let minDist = Infinity;

        Object.values(state.entities).forEach(e => {
            if (e.type === 'resource_ore') {
                const dist = Math.abs(e.position.x - entity.position.x) + Math.abs(e.position.y - entity.position.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = e;
                }
            }
        });
        return nearest;
    }

    private findNearestRefinery(entity: Entity, state: GameState): Entity | null {
        let nearest: Entity | null = null;
        let minDist = Infinity;

        Object.values(state.entities).forEach(e => {
            if (e.type === 'refinery' && e.ownerId === entity.ownerId) {
                const dist = Math.abs(e.position.x - entity.position.x) + Math.abs(e.position.y - entity.position.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = e;
                }
            }
        });
        return nearest;
    }
}
