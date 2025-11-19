export type UpdateCallback = (dt: number) => void;
export type RenderCallback = (alpha: number) => void;

export class GameLoop {
    private lastTime: number = 0;
    private accumulator: number = 0;
    // private readonly tickRate: number; // Unused for now
    private readonly step: number;
    private running: boolean = false;
    private animationFrameId: number | null = null;

    private onUpdate: UpdateCallback;
    private onRender: RenderCallback;

    constructor(onUpdate: UpdateCallback, onRender: RenderCallback, tickRate: number = 20) {
        this.onUpdate = onUpdate;
        this.onRender = onRender;
        // this.tickRate = tickRate;
        this.step = 1000 / tickRate;
    }

    public start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.loop(this.lastTime);
    }

    public stop() {
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private loop = (currentTime: number) => {
        if (!this.running) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Clamp deltaTime to avoid spiral of death if the tab is inactive
        const safeDelta = Math.min(deltaTime, 250);

        this.accumulator += safeDelta;

        while (this.accumulator >= this.step) {
            this.onUpdate(this.step);
            this.accumulator -= this.step;
        }

        // Alpha for interpolation (0.0 to 1.0)
        const alpha = this.accumulator / this.step;
        this.onRender(alpha);

        this.animationFrameId = requestAnimationFrame(this.loop);
    };
}
