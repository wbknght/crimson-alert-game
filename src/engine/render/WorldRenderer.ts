import { Container, Sprite, Application, Graphics } from 'pixi.js';
import type { MapData } from '../../maps/MapData';
import type { GameState, Vector2 } from '../state/GameState';
import { AssetManager } from '../../assets/AssetManager';
import { GameConfig } from '../config';

export class WorldRenderer {
    private app: Application;
    private mapContainer: Container;
    private entityContainer: Container;
    private assetManager: AssetManager;
    private fogGraphics: Graphics;
    private entitySprites: Map<string, Sprite> = new Map();
    private map: MapData | null = null;

    public cameraOffset: Vector2 = { x: 0, y: 0 };

    constructor(app: Application, assetManager: AssetManager) {
        this.app = app;
        this.assetManager = assetManager;

        this.mapContainer = new Container();
        this.entityContainer = new Container();
        this.entityContainer.sortableChildren = true; // Enable z-sorting
        this.fogGraphics = new Graphics();

        this.app.stage.addChild(this.mapContainer);
        this.app.stage.addChild(this.entityContainer);
        this.app.stage.addChild(this.fogGraphics);
    }

    public setMap(map: MapData) {
        this.map = map;
        this.renderMapStatic();
    }

    private renderMapStatic() {
        if (!this.map) return;

        this.mapContainer.removeChildren();

        // We don't need to set positions here if render() overwrites them, 
        // but we create sprites here.
        for (const tile of this.map.tiles) {
            let textureId = 'terrain_grass';
            if (tile.type === 'water') textureId = 'terrain_water';
            if (tile.type === 'rock') textureId = 'terrain_rock';

            const texture = this.assetManager.get(textureId);
            if (texture) {
                const sprite = new Sprite(texture);
                // Initial positions will be overwritten by render()
                this.mapContainer.addChild(sprite);
            }
        }
    }

    public render(state: GameState, _alpha: number, selectedEntityIds: string[] = [], cursorGridPos: Vector2 | null = null) {
        if (!this.map) return;

        const { TILE_WIDTH, TILE_HEIGHT, DEFAULT_OFFSET_Y } = GameConfig;
        const OFFSET_X = this.app.screen.width / 2;
        const OFFSET_Y = DEFAULT_OFFSET_Y;

        const isoToScreen = (x: number, y: number) => {
            return {
                x: (x - y) * TILE_WIDTH / 2 + OFFSET_X + this.cameraOffset.x,
                y: (x + y) * TILE_HEIGHT / 2 + OFFSET_Y + this.cameraOffset.y
            };
        };

        // 1. Render Map Tiles
        let tileIndex = 0;
        for (const tile of this.map.tiles) {
            if (tileIndex >= this.mapContainer.children.length) break;
            const sprite = this.mapContainer.children[tileIndex] as Sprite;

            const screenPos = isoToScreen(tile.x, tile.y);
            sprite.x = screenPos.x;
            sprite.y = screenPos.y;
            sprite.width = TILE_WIDTH; // Ensure size is correct
            sprite.height = TILE_HEIGHT;

            tileIndex++;
        }

        // 2. Render Entities
        const sortedEntities = Object.values(state.entities).sort((a, b) => {
            return (a.position.x + a.position.y) - (b.position.x + b.position.y);
        });

        const currentEntityIds = new Set<string>();
        const player = state.players['player_1'];

        for (const entity of sortedEntities) {
            // Fog of War Check
            let isVisible = true;
            if (player && this.map) {
                const tx = Math.floor(entity.position.x);
                const ty = Math.floor(entity.position.y);
                const index = ty * this.map.width + tx;

                if (index >= 0 && index < player.visible.length && !player.visible[index]) {
                    if (entity.ownerId !== 'player_1') {
                        isVisible = false;
                    }
                }
            }

            if (!isVisible) {
                if (this.entitySprites.has(entity.id)) {
                    const sprite = this.entitySprites.get(entity.id)!;
                    this.entityContainer.removeChild(sprite);
                    this.entitySprites.delete(entity.id);
                }
                continue;
            }

            currentEntityIds.add(entity.id);
            let sprite = this.entitySprites.get(entity.id);

            if (!sprite) {
                const textureId = entity.assetId || (entity.type === 'hq' ? 'building_hq' : 'unit_tank');
                const texture = this.assetManager.get(textureId) || this.assetManager.get('unit_tank');

                if (texture) {
                    sprite = new Sprite(texture);
                    sprite.anchor.set(0.5, 0.8);
                    this.entityContainer.addChild(sprite);
                    this.entitySprites.set(entity.id, sprite);
                }
            }

            if (sprite) {
                const screenPos = isoToScreen(entity.position.x, entity.position.y);
                sprite.x = screenPos.x;
                sprite.y = screenPos.y;
                // Z-Index for depth sorting
                sprite.zIndex = (entity.position.x + entity.position.y) * 10;

                if (selectedEntityIds.includes(entity.id)) {
                    sprite.tint = 0x00ff00; // Green tint for selection
                } else {
                    sprite.tint = 0xffffff; // Reset tint
                }
            }
        }

        // Cleanup removed entities
        for (const [id, sprite] of this.entitySprites) {
            if (!currentEntityIds.has(id)) {
                this.entityContainer.removeChild(sprite);
                this.entitySprites.delete(id);
            }
        }

        // 3. Render Fog of War
        this.fogGraphics.clear();
        if (player && this.map) {
            for (let y = 0; y < this.map.height; y++) {
                for (let x = 0; x < this.map.width; x++) {
                    const index = y * this.map.width + x;
                    const isExplored = player.explored[index];
                    const isVisible = player.visible[index];

                    if (isVisible) continue;

                    const screenPos = isoToScreen(x, y);

                    this.fogGraphics.moveTo(screenPos.x, screenPos.y);
                    this.fogGraphics.lineTo(screenPos.x + TILE_WIDTH / 2, screenPos.y + TILE_HEIGHT / 2);
                    this.fogGraphics.lineTo(screenPos.x, screenPos.y + TILE_HEIGHT);
                    this.fogGraphics.lineTo(screenPos.x - TILE_WIDTH / 2, screenPos.y + TILE_HEIGHT / 2);
                    this.fogGraphics.closePath();

                    if (!isExplored) {
                        this.fogGraphics.fill({ color: 0x000000, alpha: 1.0 });
                    } else {
                        this.fogGraphics.fill({ color: 0x000000, alpha: 0.5 });
                    }
                }
            }
        }
    }

}
