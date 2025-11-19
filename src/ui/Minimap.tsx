import React, { useEffect, useRef } from 'react';
import type { MapData } from '../maps/MapData';
import type { GameState } from '../engine/state/GameState';

interface MinimapProps {
    map: MapData;
    gameState: GameState;
    playerId: string;
    cameraX?: number; // Optional for now, can add camera tracking later
    cameraY?: number;
}

export const Minimap: React.FC<MinimapProps> = ({ map, gameState, playerId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate scale
        const scaleX = canvas.width / map.width;
        const scaleY = canvas.height / map.height;

        // Draw Map Tiles (Fog of War aware)
        const player = gameState.players[playerId];
        if (!player) return;

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const index = y * map.width + x;
                const isExplored = player.explored[index];
                const isVisible = player.visible[index];

                if (!isExplored) continue;

                const tile = map.tiles[index];
                let color = '#000';

                if (tile.type === 'water') color = '#0000AA';
                else if (tile.type === 'rock') color = '#555555';
                else color = '#228B22'; // Grass

                // Dim if explored but not visible
                if (!isVisible) {
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.5;
                } else {
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 1.0;
                }

                ctx.fillRect(x * scaleX, y * scaleY, scaleX, scaleY);
            }
        }
        ctx.globalAlpha = 1.0;

        // Draw Entities
        Object.values(gameState.entities).forEach(entity => {
            // Only draw if visible to player (or if it's their own)
            // We can check visibility via tile visibility
            const tx = Math.floor(entity.position.x);
            const ty = Math.floor(entity.position.y);
            const index = ty * map.width + tx;

            if (index >= 0 && index < player.visible.length && (player.visible[index] || entity.ownerId === playerId)) {
                const owner = gameState.players[entity.ownerId];
                ctx.fillStyle = owner ? '#' + owner.color.toString(16).padStart(6, '0') : '#FFF';

                // Draw a slightly larger dot for buildings
                const size = (entity.width > 1) ? 3 : 2;
                ctx.fillRect(entity.position.x * scaleX - size / 2, entity.position.y * scaleY - size / 2, size, size);
            }
        });

    }, [map, gameState, playerId]); // Re-render when state changes (throttled by parent update)

    return (
        <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            border: '2px solid #444',
            backgroundColor: '#000',
            zIndex: 100
        }}>
            <canvas
                ref={canvasRef}
                width={200}
                height={200}
                style={{ display: 'block' }}
            />
        </div>
    );
};
