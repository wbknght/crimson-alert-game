import type { GameState, Entity, Vector2 } from '../../engine/state/GameState';
import { Factions } from '../rules/FactionData';
import { v4 as uuidv4 } from 'uuid';

export class CombatSystem {

    public update(state: GameState, dt: number) {
        this.handleAttacks(state, dt);
        this.handleProjectiles(state, dt);
        this.cleanupDeadEntities(state);
    }

    private handleAttacks(state: GameState, _dt: number) {
        // For each entity that can attack
        Object.values(state.entities).forEach(entity => {
            if (entity.type === 'projectile') return;

            const faction = Factions[state.players[entity.ownerId]?.factionId];
            if (!faction) return;

            // Get stats
            // We need to know the unit type ID from the entity. 
            // Currently entity.type IS the unit ID (e.g. 'trooper', 'hq').
            // But for buildings it might be 'hq'.
            const unitStats = faction.units[entity.type] || faction.buildings[entity.type];
            if (!unitStats || !unitStats.damage) return;

            // Cooldown
            if (!entity.cooldown) entity.cooldown = 0;
            if (entity.cooldown > 0) {
                entity.cooldown--;
                return;
            }

            // Find target
            // Simple check: closest enemy in range
            let bestTarget: Entity | null = null;
            let minDistSq = unitStats.range * unitStats.range;

            Object.values(state.entities).forEach(target => {
                if (target.ownerId === entity.ownerId || target.ownerId === 'neutral' || target.type === 'projectile') return;

                const distSq = this.distSq(entity.position, target.position);
                if (distSq <= minDistSq) {
                    minDistSq = distSq;
                    bestTarget = target;
                }
            });

            if (bestTarget) {
                // Fire!
                this.fireProjectile(state, entity, bestTarget, unitStats.damage);
                entity.cooldown = unitStats.fireRate;
            }
        });
    }

    private fireProjectile(state: GameState, source: Entity, target: Entity, damage: number) {
        const id = uuidv4();
        state.entities[id] = {
            id,
            type: 'projectile',
            ownerId: source.ownerId,
            position: { ...source.position },
            targetId: target.id,
            damage: damage,
            speed: 0.5, // Projectile speed
            width: 0.5,
            height: 0.5,
            assetId: 'projectile'
        };
    }

    private handleProjectiles(state: GameState, _dt: number) {
        Object.values(state.entities).forEach(proj => {
            if (proj.type !== 'projectile') return;

            const target = state.entities[proj.targetId!];
            if (!target) {
                // Target dead/gone, remove projectile
                delete state.entities[proj.id];
                return;
            }

            // Move towards target
            const dx = target.position.x - proj.position.x;
            const dy = target.position.y - proj.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < (proj.speed || 0.5)) {
                // Hit!
                this.applyDamage(state, target, proj.damage || 0);
                delete state.entities[proj.id];
            } else {
                // Move
                const moveDist = proj.speed || 0.5;
                proj.position.x += (dx / dist) * moveDist;
                proj.position.y += (dy / dist) * moveDist;
            }
        });
    }

    private applyDamage(state: GameState, target: Entity, damage: number) {
        if (target.health !== undefined) {
            target.health -= damage;
        }
    }

    private cleanupDeadEntities(state: GameState) {
        Object.keys(state.entities).forEach(id => {
            const entity = state.entities[id];
            if (entity.health !== undefined && entity.health <= 0) {
                delete state.entities[id];
            }
        });
    }

    private distSq(p1: Vector2, p2: Vector2): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return dx * dx + dy * dy;
    }
}
