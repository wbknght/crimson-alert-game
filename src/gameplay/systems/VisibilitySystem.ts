import type { GameState } from '../../engine/state/GameState';
import type { MapData } from '../../maps/MapData';
import { Factions } from '../rules/FactionData';

export class VisibilitySystem {
    private map: MapData;

    constructor(map: MapData) {
        this.map = map;
    }

    public update(state: GameState) {
        // Reset visibility for all players
        // (In a real game, we might only update dirty regions or use a more efficient structure)
        for (const playerId in state.players) {
            const player = state.players[playerId];

            // Initialize arrays if missing (e.g. first tick)
            if (!player.explored || player.explored.length !== this.map.width * this.map.height) {
                player.explored = new Array(this.map.width * this.map.height).fill(false);
            }
            if (!player.visible || player.visible.length !== this.map.width * this.map.height) {
                player.visible = new Array(this.map.width * this.map.height).fill(false);
            }

            // Clear current visibility
            player.visible.fill(false);
        }

        // Calculate visibility
        Object.values(state.entities).forEach(entity => {
            const player = state.players[entity.ownerId];
            if (!player) return; // Neutral or invalid owner

            const faction = Factions[player.factionId];
            if (!faction) return;

            // Get vision range
            let visionRange = 5; // Default
            const stats = faction.units[entity.type] || faction.buildings[entity.type];
            if (stats) {
                visionRange = stats.vision;
            } else if (entity.type === 'projectile') {
                visionRange = 2; // Projectiles have small vision
            }

            // Rasterize circle
            const cx = Math.round(entity.position.x);
            const cy = Math.round(entity.position.y);
            const r = visionRange;
            const r2 = r * r;

            for (let y = cy - r; y <= cy + r; y++) {
                for (let x = cx - r; x <= cx + r; x++) {
                    if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
                        const dx = x - cx;
                        const dy = y - cy;
                        if (dx * dx + dy * dy <= r2) {
                            const idx = y * this.map.width + x;
                            player.visible[idx] = true;
                            player.explored[idx] = true;
                        }
                    }
                }
            }
        });
    }
}
