import { Application } from 'pixi.js';
import type { Vector2 } from '../state/GameState';
import { GameConfig } from '../config';

export type InputCommandType = 'SELECT' | 'MOVE' | 'BUILD';

export interface InputCommand {
    type: InputCommandType;
    payload: any;
}

export class InputManager {
    private app: Application;
    private commandQueue: InputCommand[] = [];
    private keys: Set<string> = new Set();

    public onSelect?: (cmd: any) => void;
    public onMove?: (cmd: any) => void;
    public onHover?: (cmd: any) => void;

    // Callback to get current camera offset from the main game loop/state
    public getCameraOffset: () => Vector2 = () => ({ x: 0, y: 0 });

    constructor(app: Application) {
        this.app = app;
        this.setupListeners();
    }

    private setupListeners() {
        const canvas = this.app.canvas;

        // Mouse Listeners
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const gridPos = this.screenToGrid(x, y);
            console.log(`[InputManager] MouseDown: Screen(${x}, ${y}) -> Grid(${gridPos.x}, ${gridPos.y}) Button: ${e.button}`);

            if (e.button === 0) { // Left Click
                this.commandQueue.push({
                    type: 'SELECT',
                    payload: { position: gridPos }
                });
                if (this.onSelect) this.onSelect({ position: gridPos });
            } else if (e.button === 2) { // Right Click
                e.preventDefault();
                this.commandQueue.push({
                    type: 'MOVE',
                    payload: { position: gridPos }
                });
                if (this.onMove) this.onMove({ position: gridPos });
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const gridPos = this.screenToGrid(x, y);
            if (this.onHover) this.onHover({ position: gridPos });
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard Listeners
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
    }

    public getCameraMoveDir(): Vector2 {
        const dir = { x: 0, y: 0 };
        if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dir.y += 1; // Up moves map down (camera up) -> offset increases? 
        // Wait, if camera moves UP, the world moves DOWN on screen.
        // Offset is usually added to world coordinates to get screen coordinates.
        // Screen = World + Offset.
        // If we want to see "higher" world coordinates (North), we need to move the view "Up".
        // Actually, let's define Camera Position vs Camera Offset.
        // Usually Offset = -CameraPosition + ScreenCenter.
        // Let's just return the direction the USER wants to move the VIEW.
        // W = View moves North (Up).

        if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dir.y += 1;
        if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dir.y -= 1;
        if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dir.x += 1;
        if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dir.x -= 1;

        // Normalize if needed, but for simple movement it's fine.
        return dir;
    }

    private screenToGrid(screenX: number, screenY: number): Vector2 {
        const { TILE_WIDTH, TILE_HEIGHT, DEFAULT_OFFSET_Y } = GameConfig;

        // Get dynamic offset
        const cameraOffset = this.getCameraOffset();

        // The offset used in rendering is:
        // screen_x = (map_x - map_y) * TILE_WIDTH / 2 + OFFSET_X + cameraOffset.x
        // screen_y = (map_x + map_y) * TILE_HEIGHT / 2 + OFFSET_Y + cameraOffset.y

        // We need to reverse this.
        // adjX = screenX - OFFSET_X - cameraOffset.x
        // adjY = screenY - OFFSET_Y - cameraOffset.y

        const OFFSET_X = this.app.screen.width / 2; // This is dynamic based on screen size

        const adjX = screenX - OFFSET_X - cameraOffset.x;
        const adjY = screenY - DEFAULT_OFFSET_Y - cameraOffset.y;

        // map_x = (adjY / (TILE_HEIGHT/2) + adjX / (TILE_WIDTH/2)) / 2
        // map_y = (adjY / (TILE_HEIGHT/2) - adjX / (TILE_WIDTH/2)) / 2

        const mapX = (adjY / (TILE_HEIGHT / 2) + adjX / (TILE_WIDTH / 2)) / 2;
        const mapY = (adjY / (TILE_HEIGHT / 2) - adjX / (TILE_WIDTH / 2)) / 2;

        return {
            x: Math.floor(mapX),
            y: Math.floor(mapY)
        };
    }

    public getCommands(): InputCommand[] {
        const commands = [...this.commandQueue];
        this.commandQueue = [];
        return commands;
    }
}
