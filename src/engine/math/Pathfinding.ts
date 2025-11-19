import { type MapData, getTile } from '../../maps/MapData';
import type { Vector2 } from '../state/GameState';

interface Node {
    x: number;
    y: number;
    f: number;
    g: number;
    h: number;
    parent: Node | null;
}

export class Pathfinding {
    private map: MapData;

    constructor(map: MapData) {
        this.map = map;
    }

    public findPath(start: Vector2, end: Vector2): Vector2[] {
        // Simple A* implementation
        const startTile = getTile(this.map, start.x, start.y);
        const endTile = getTile(this.map, end.x, end.y);

        if (!startTile || !endTile || !endTile.walkable) {
            return [];
        }

        const openList: Node[] = [];
        const closedList: Set<string> = new Set();

        const startNode: Node = {
            x: start.x,
            y: start.y,
            f: 0,
            g: 0,
            h: 0,
            parent: null
        };

        openList.push(startNode);

        while (openList.length > 0) {
            // Sort by f (lowest first)
            openList.sort((a, b) => a.f - b.f);
            const currentNode = openList.shift()!;

            if (currentNode.x === end.x && currentNode.y === end.y) {
                // Path found
                const path: Vector2[] = [];
                let curr: Node | null = currentNode;
                while (curr) {
                    path.push({ x: curr.x, y: curr.y });
                    curr = curr.parent;
                }
                return path.reverse();
            }

            closedList.add(`${currentNode.x},${currentNode.y}`);

            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (closedList.has(`${neighbor.x},${neighbor.y}`)) continue;

                const gScore = currentNode.g + 1; // Cost is always 1 for grid
                const hScore = Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y); // Manhattan distance
                const fScore = gScore + hScore;

                const existingNode = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);
                if (existingNode) {
                    if (gScore < existingNode.g) {
                        existingNode.g = gScore;
                        existingNode.f = fScore;
                        existingNode.parent = currentNode;
                    }
                } else {
                    openList.push({
                        x: neighbor.x,
                        y: neighbor.y,
                        f: fScore,
                        g: gScore,
                        h: hScore,
                        parent: currentNode
                    });
                }
            }
        }

        return []; // No path found
    }

    private getNeighbors(node: Node): { x: number; y: number }[] {
        const dirs = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];

        const neighbors: { x: number; y: number }[] = [];
        for (const dir of dirs) {
            const nx = node.x + dir.x;
            const ny = node.y + dir.y;
            const tile = getTile(this.map, nx, ny);
            if (tile && tile.walkable) {
                neighbors.push({ x: nx, y: ny });
            }
        }
        return neighbors;
    }
}
