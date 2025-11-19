import { Container, Sprite, Application, Graphics } from 'pixi.js';
import type { MapData } from '../../maps/MapData';
import type { GameState } from '../state/GameState';
import { AssetManager } from '../../assets/AssetManager';

export class WorldRenderer {
    private app: Application;
    private mapContainer: Container;
    private entityContainer: Container;
    private assetManager: AssetManager;
    private map: MapData | null = null;

    constructor(app: Application, assetManager: AssetManager) {
        this.app = app;
        this.assetManager = assetManager;

        this.mapContainer = new Container();
        this.entityContainer = new Container();

        this.app.stage.addChild(this.mapContainer);
        this.app.stage.addChild(this.entityContainer);
    }

    public setMap(map: MapData) {
        this.map = map;
        this.renderMapStatic();
    }

    private renderMapStatic() {
        if (!this.map) return;

        this.mapContainer.removeChildren();

        const TILE_SIZE = 64; // Should probably be in a config

        for (const tile of this.map.tiles) {
            const texture = this.assetManager.get('terrain_grass'); // Use grass for everything for now
            if (texture) {
                const sprite = new Sprite(texture);
                sprite.x = tile.x * TILE_SIZE;
                sprite.y = tile.y * TILE_SIZE;
                sprite.width = TILE_SIZE;
                sprite.height = TILE_SIZE;
                this.mapContainer.addChild(sprite);
            }
        }
    }

    public render(state: GameState, _alpha: number) {
        // Render entities
        this.entityContainer.removeChildren();

        const TILE_SIZE = 64;
        const player = state.players['player_1']; // Render for player 1

        // Render Fog (simple overlay)
        // We can use a Graphics object for fog
        // Or just tint tiles? 
        // Let's use a Graphics overlay on top of map but below entities? 
        // No, fog covers entities too if not visible.
        // Actually, we should hide entities if not visible.

        // 1. Render Entities (only if visible)
        Object.values(state.entities).forEach(entity => {
            // Check visibility
            if (player && player.visible) {
                const cx = Math.round(entity.position.x);
                const cy = Math.round(entity.position.y);
                const idx = cy * this.map!.width + cx;
                if (!player.visible[idx]) {
                    // If it's our own unit, we always see it? 
                    // Usually yes, but strictly FoW says we see what our units see.
                    // If unit is ours, it provides vision, so it should be visible.
                    // But if it's an enemy unit in fog, we skip.
                    if (entity.ownerId !== 'player_1') return;
                }
            }

            let textureId = entity.assetId || 'unit_rifleman';
            // Fallback for legacy types if assetId not set (though it should be now)
            if (!entity.assetId) {
                if (entity.type === 'tank') textureId = 'unit_tank';
                if (entity.type === 'hq') textureId = 'building_hq';
            }

            const texture = this.assetManager.get(textureId);
            if (texture) {
                const sprite = new Sprite(texture);
                // Simple interpolation could happen here using alpha
                sprite.x = entity.position.x * TILE_SIZE;
                sprite.y = entity.position.y * TILE_SIZE;
                sprite.anchor.set(0.5);
                this.entityContainer.addChild(sprite);
            }
        });

        // 2. Render Fog Overlay
        // We need a fog container on top of everything
        // For prototype, let's just draw black rectangles for unexplored and semi-transparent for explored-but-hidden
        // This is slow for many tiles. A single Graphics object with many rects is better.
        // Or a tilemap.
        // Let's use a single Graphics object.
        // Note: This should be optimized later.

        // We need to add a fog container if not exists
        if (!this.fogGraphics) {
            this.fogGraphics = new Graphics();
            this.app.stage.addChild(this.fogGraphics);
        }

        this.fogGraphics.clear();
        if (player && player.explored && player.visible) {
            for (let y = 0; y < this.map!.height; y++) {
                for (let x = 0; x < this.map!.width; x++) {
                    const idx = y * this.map!.width + x;
                    const isExplored = player.explored[idx];
                    const isVisible = player.visible[idx];

                    if (!isExplored) {
                        this.fogGraphics.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        this.fogGraphics.fill({ color: 0x000000, alpha: 1 });
                    } else if (!isVisible) {
                        this.fogGraphics.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        this.fogGraphics.fill({ color: 0x000000, alpha: 0.5 });
                    }
                }
            }
        }
    }

    private fogGraphics: Graphics | null = null;
}
