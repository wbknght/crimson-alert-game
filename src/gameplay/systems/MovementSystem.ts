import type { GameState, Vector2 } from '../../engine/state/GameState';
import { Pathfinding } from '../../engine/math/Pathfinding';
import type { MapData } from '../../maps/MapData';

export class MovementSystem {
    private pathfinding: Pathfinding;

    constructor(map: MapData) {
        this.pathfinding = new Pathfinding(map);
    }

    public update(state: GameState, dt: number) {
        // In a real ECS, we would iterate over entities with 'MovementComponent'
        // For now, we check all entities
        Object.values(state.entities).forEach(entity => {
            if (entity.path && entity.path.length > 0) {
                this.moveEntity(entity, dt);
            }
        });
    }

    public setPath(entity: any, target: Vector2) {
        const path = this.pathfinding.findPath(entity.position, target);
        if (path.length > 0) {
            // Remove first node if it's the current position
            if (path[0].x === entity.position.x && path[0].y === entity.position.y) {
                path.shift();
            }
            entity.path = path;
            entity.targetPosition = path[0]; // Next step
            entity.moveProgress = 0; // 0 to 1 progress to next tile
        }
    }

    private moveEntity(entity: any, dt: number) {
        if (!entity.targetPosition) {
            if (entity.path.length > 0) {
                entity.targetPosition = entity.path.shift();
                entity.moveProgress = 0;
            } else {
                return; // Done
            }
        }

        const speed = 0.005 * dt; // Speed in tiles per ms (approx)
        entity.moveProgress += speed;

        if (entity.moveProgress >= 1) {
            // Reached tile
            entity.position = entity.targetPosition;
            entity.moveProgress = 0;

            if (entity.path.length > 0) {
                entity.targetPosition = entity.path.shift();
            } else {
                entity.targetPosition = null;
                entity.path = null;
            }
        } else {
            // Interpolate for rendering (optional, but here we just update logical position if we want smooth movement in logic, 
            // but for grid based, we usually keep logical pos at tile center and use visual pos for rendering.
            // For this prototype, let's just keep logical pos as integer grid coords and handle smooth render in renderer?
            // OR, let's make position float in GameState?
            // The GameState interface defined position as Vector2 (x,y).
            // Let's assume x,y are floats in the state for smooth movement.

            // const startX = entity.position.x; // Unused
            // Actually, better to keep 'gridPosition' and 'visualPosition' separate or just use float position.
            // Let's use float position for the entity.

            // Wait, if I update entity.position every tick, the pathfinding needs to know which tile it's in.
            // Math.round(entity.position.x)

            // Let's do simple linear interpolation towards target
            const dx = entity.targetPosition.x - entity.position.x;
            const dy = entity.targetPosition.y - entity.position.y;

            // Move towards target
            // We already have moveProgress, but that assumes we snap.
            // Let's just move by speed vector.

            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= speed) {
                entity.position = entity.targetPosition;
                // Next waypoint
                if (entity.path.length > 0) {
                    entity.targetPosition = entity.path.shift();
                } else {
                    entity.targetPosition = null;
                    entity.path = null;
                }
            } else {
                const moveX = (dx / dist) * speed;
                const moveY = (dy / dist) * speed;
                entity.position.x += moveX;
                entity.position.y += moveY;
            }
        }
    }
}
