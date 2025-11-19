import type { GameState, Vector2 } from '../../engine/state/GameState';
import type { MapData } from '../../maps/MapData';
import { Factions } from '../rules/FactionData';
import { v4 as uuidv4 } from 'uuid';

export class ConstructionSystem {
    private map: MapData;

    constructor(map: MapData) {
        this.map = map;
    }

    public canBuild(state: GameState, playerId: string, buildingId: string, position: Vector2): boolean {
        const player = state.players[playerId];
        if (!player) return false;

        const faction = Factions[player.factionId];
        if (!faction) return false;

        const def = faction.buildings[buildingId];
        if (!def) return false;

        // Check resources
        if (player.resources < def.cost) return false;

        // Check bounds
        if (position.x < 0 || position.y < 0 ||
            position.x + def.width > this.map.width ||
            position.y + def.height > this.map.height) {
            return false;
        }

        // Check collisions with other entities
        for (const entity of Object.values(state.entities)) {
            const ex = Math.round(entity.position.x);
            const ey = Math.round(entity.position.y);

            // Simple collision check (assuming 1x1 for entity unless specified)
            // Ideally we check entity.width/height too
            const eWidth = entity.width || 1;
            const eHeight = entity.height || 1;

            // Check overlap of two rectangles
            if (ex < position.x + def.width &&
                ex + eWidth > position.x &&
                ey < position.y + def.height &&
                ey + eHeight > position.y) {
                return false;
            }
        }

        return true;
    }

    public build(state: GameState, playerId: string, buildingId: string, position: Vector2): boolean {
        if (!this.canBuild(state, playerId, buildingId, position)) return false;

        const player = state.players[playerId];
        const faction = Factions[player.factionId];
        const def = faction.buildings[buildingId];

        // Deduct resources
        player.resources -= def.cost;

        // Create Entity
        const id = uuidv4();
        state.entities[id] = {
            id,
            type: buildingId, // This might need to be unique per faction if IDs collide, but we scoped them in FactionData? No, keys are 'hq', 'barracks'.
            // We should probably store 'unitTypeId' and 'factionId' on entity?
            // Or just rely on owner's faction.
            // Let's store basic stats on entity for now to avoid lookups every frame?
            // Or just 'type' is enough if we look up via owner.
            ownerId: playerId,
            position: { ...position },
            width: def.width,
            height: def.height,
            health: def.health,
            maxHealth: def.health
        };

        return true;
    }
}
