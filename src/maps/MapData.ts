export type TileType = 'grass' | 'water' | 'rock';

export interface Tile {
    x: number;
    y: number;
    type: TileType;
    walkable: boolean;
    buildable: boolean;
}

export interface MapData {
    width: number;
    height: number;
    tiles: Tile[]; // Flat array, accessed by y * width + x
    startPositions: { x: number; y: number }[];
}

export const getTile = (map: MapData, x: number, y: number): Tile | null => {
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) return null;
    return map.tiles[y * map.width + x];
};

// Helper function for internal map generation that operates on a flat array
const getTileFromFlatArray = (tiles: Tile[], width: number, x: number, y: number): Tile | null => {
    // Assuming x and y are within bounds for this internal helper
    return tiles[y * width + x];
};

export function createTrainingMap(): MapData {
    const width = 40;
    const height = 40;
    const tiles: Tile[] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            tiles.push({
                x,
                y,
                type: 'grass',
                walkable: true,
                buildable: true
            });
        }
    }

    // Add some obstacles
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const tile = getTileFromFlatArray(tiles, width, x, y);
        if (tile) {
            tile.type = 'rock';
            tile.walkable = false;
            tile.buildable = false;
        }
    }

    return {
        width,
        height,
        tiles,
        startPositions: [
            { x: 5, y: 5 },
            { x: 35, y: 35 }
        ]
    };
}

export function create4PlayerMap(): MapData {
    const width = 64;
    const height = 64;
    const tiles: Tile[] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            tiles.push({
                x,
                y,
                type: 'grass',
                walkable: true,
                buildable: true
            });
        }
    }

    // Add a central lake
    const cx = width / 2;
    const cy = height / 2;
    const lakeRadius = 8;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - cx;
            const dy = y - cy;
            if (dx * dx + dy * dy < lakeRadius * lakeRadius) {
                const tile = getTileFromFlatArray(tiles, width, x, y);
                if (tile) {
                    tile.type = 'water';
                    tile.walkable = false;
                    tile.buildable = false;
                }
            }
        }
    }

    // Add scattered rocks
    for (let i = 0; i < 200; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        // Avoid start positions
        if ((x < 10 && y < 10) || (x > width - 10 && y < 10) || (x < 10 && y > height - 10) || (x > width - 10 && y > height - 10)) continue;

        const tile = getTileFromFlatArray(tiles, width, x, y);
        if (tile) {
            tile.type = 'rock';
            tile.walkable = false;
            tile.buildable = false;
        }
    }

    return {
        width,
        height,
        tiles,
        startPositions: [
            { x: 5, y: 5 },             // Top-Left
            { x: width - 6, y: 5 },     // Top-Right
            { x: 5, y: height - 6 },    // Bottom-Left
            { x: width - 6, y: height - 6 } // Bottom-Right
        ]
    };
}

export function create6PlayerMap(): MapData {
    const width = 80;
    const height = 80;
    const tiles: Tile[] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            tiles.push({
                x,
                y,
                type: 'grass',
                walkable: true,
                buildable: true
            });
        }
    }

    // River crossing
    for (let x = 0; x < width; x++) {
        const y = Math.floor(height / 2 + Math.sin(x / 5) * 3);
        const tile = getTileFromFlatArray(tiles, width, x, y);
        if (tile) {
            tile.type = 'water';
            tile.walkable = false;
            tile.buildable = false;
        }
        // Make river wider
        const tile2 = getTileFromFlatArray(tiles, width, x, y + 1);
        if (tile2) {
            tile2.type = 'water';
            tile2.walkable = false;
            tile2.buildable = false;
        }
    }

    // Bridges (crossings)
    const bridges = [20, 60];
    bridges.forEach(bx => {
        for (let y = height / 2 - 5; y < height / 2 + 5; y++) {
            const tile = getTileFromFlatArray(tiles, width, bx, y);
            if (tile) {
                tile.type = 'grass';
                tile.walkable = true;
                tile.buildable = true;
            }
            const tile2 = getTileFromFlatArray(tiles, width, bx + 1, y);
            if (tile2) {
                tile2.type = 'grass';
                tile2.walkable = true;
                tile2.buildable = true;
            }
        }
    });

    return {
        width,
        height,
        tiles,
        startPositions: [
            { x: 5, y: 5 },
            { x: width / 2, y: 5 },
            { x: width - 6, y: 5 },
            { x: 5, y: height - 6 },
            { x: width / 2, y: height - 6 },
            { x: width - 6, y: height - 6 }
        ]
    };
}

export function create8PlayerMap(): MapData {
    const width = 96;
    const height = 96;
    const tiles: Tile[] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            tiles.push({
                x,
                y,
                type: 'grass',
                walkable: true,
                buildable: true
            });
        }
    }

    // Random lakes
    for (let i = 0; i < 10; i++) {
        const cx = Math.floor(Math.random() * width);
        const cy = Math.floor(Math.random() * height);
        const r = Math.floor(Math.random() * 5) + 2;

        for (let y = cy - r; y <= cy + r; y++) {
            for (let x = cx - r; x <= cx + r; x++) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const dx = x - cx;
                    const dy = y - cy;
                    if (dx * dx + dy * dy <= r * r) {
                        const tile = getTileFromFlatArray(tiles, width, x, y);
                        if (tile) {
                            tile.type = 'water';
                            tile.walkable = false;
                            tile.buildable = false;
                        }
                    }
                }
            }
        }
    }

    return {
        width,
        height,
        tiles,
        startPositions: [
            { x: 5, y: 5 },
            { x: width / 2, y: 5 },
            { x: width - 6, y: 5 },
            { x: 5, y: height / 2 },
            { x: width - 6, y: height / 2 },
            { x: 5, y: height - 6 },
            { x: width / 2, y: height - 6 },
            { x: width - 6, y: height - 6 }
        ]
    };
}
