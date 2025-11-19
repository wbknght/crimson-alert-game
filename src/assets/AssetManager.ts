import { Assets } from 'pixi.js';
import type { AssetManifest } from './AssetManifest';

export class AssetManager {
    private manifest: AssetManifest;

    constructor(manifest: AssetManifest) {
        this.manifest = manifest;
    }

    public async loadAll(): Promise<void> {
        const bundles = this.manifest.assets.map(asset => ({
            alias: asset.id,
            src: asset.src,
            data: asset.metadata
        }));

        // In a real scenario, we might want to bundle these or load them in groups.
        // For now, we just add them to the Pixi Assets cache.
        for (const bundle of bundles) {
            Assets.add({ alias: bundle.alias, src: bundle.src, data: bundle.data });
        }

        // Load all added assets
        const loadPromises = bundles.map(b => Assets.load(b.alias));
        await Promise.all(loadPromises);

        console.log(`Loaded ${bundles.length} assets.`);
    }

    public get(id: string): any {
        return Assets.get(id);
    }
}
