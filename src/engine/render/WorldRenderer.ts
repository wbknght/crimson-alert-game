import { Container, Sprite, Application } from 'pixi.js';
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
        // For now, just clear and redraw (inefficient but simple for prototype)
        // In future: pool sprites and update positions
        this.entityContainer.removeChildren();

        const TILE_SIZE = 64;

        Object.values(state.entities).forEach(entity => {
            let textureId = 'unit_rifleman'; // Default
            if (entity.type === 'tank') textureId = 'unit_tank';
            if (entity.type === 'hq') textureId = 'building_hq';

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
    }
}
