export type TileType = 'grass' | 'water' | 'dirt';

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

export const createTrainingMap = (width: number, height: number): MapData => {
    const tiles: Tile[] = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            tiles.push({
                x,
                y,
                type: 'grass',
                walkable: true,
                buildable: true,
            });
        }
    }

    // Add some resources (simple logic: near start positions)
    // We don't add entities here, just the map data. 
    // But wait, resources are entities in our design?
    // Yes, usually. Or they can be tile properties.
    // Let's assume they are entities spawned by the game init based on map data.
    // So MapData should probably have 'resourceNodes' or similar.
    // For now, let's just return the grid and start positions.

    return {
        width,
        height,
        tiles,
        startPositions: [{ x: 2, y: 2 }, { x: width - 3, y: height - 3 }],
    };
};
