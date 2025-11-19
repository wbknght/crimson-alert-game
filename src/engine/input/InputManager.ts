import { Application } from 'pixi.js';
import type { Vector2 } from '../state/GameState';

export type InputCommandType = 'SELECT' | 'MOVE' | 'BUILD';

export interface InputCommand {
    type: InputCommandType;
    payload: any;
}

export class InputManager {
    private app: Application;
    private commandQueue: InputCommand[] = [];
    private tileSize: number = 64; // Config?

    constructor(app: Application) {
        this.app = app;
        this.setupListeners();
    }

    private setupListeners() {
        const canvas = this.app.canvas;

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const gridPos = this.screenToGrid(x, y);

            if (e.button === 0) { // Left Click
                this.commandQueue.push({
                    type: 'SELECT',
                    payload: { position: gridPos }
                });
            } else if (e.button === 2) { // Right Click
                e.preventDefault();
                this.commandQueue.push({
                    type: 'MOVE',
                    payload: { position: gridPos }
                });
            }
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    private screenToGrid(screenX: number, screenY: number): Vector2 {
        return {
            x: Math.floor(screenX / this.tileSize),
            y: Math.floor(screenY / this.tileSize)
        };
    }

    public getCommands(): InputCommand[] {
        const commands = [...this.commandQueue];
        this.commandQueue = [];
        return commands;
    }
}
