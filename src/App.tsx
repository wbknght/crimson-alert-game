import React, { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { AssetManager } from './assets/AssetManager';
import { defaultManifest } from './assets/AssetManifest';
import { GameLoop } from './engine/loop/GameLoop';
import { WorldRenderer } from './engine/render/WorldRenderer';
import { createInitialState } from './engine/state/GameState';
import { createTrainingMap } from './maps/MapData';
import { InputManager } from './engine/input/InputManager';
import { MovementSystem } from './gameplay/systems/MovementSystem';
import { ConstructionSystem } from './gameplay/systems/ConstructionSystem';
import { ResourceSystem } from './gameplay/systems/ResourceSystem';
import { CombatSystem } from './gameplay/systems/CombatSystem';
import { VisibilitySystem } from './gameplay/systems/VisibilitySystem';
import { SimpleAI } from './ai/SimpleAI';
import { Sidebar } from './ui/Sidebar';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState(1000);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const appRef = useRef<Application | null>(null);
  const pendingBuildRef = useRef<string | null>(null);
  const gameInstanceRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      if (!canvasRef.current) return;

      // Initialize PixiJS App
      const app = new Application();
      await app.init({
        canvas: canvasRef.current,
        width: 800,
        height: 600,
        backgroundColor: 0x1099bb,
      });
      appRef.current = app;

      // Initialize Assets
      const assetManager = new AssetManager(defaultManifest);
      await assetManager.loadAll();

      // Initialize Renderer
      const renderer = new WorldRenderer(app, assetManager);

      // Initialize State & Map
      const map = createTrainingMap(30, 30); // Changed map creation
      renderer.setMap(map);

      const state = createInitialState();

      // Setup Players
      // Setup Players
      state.players['player_1'] = {
        id: 'player_1',
        factionId: 'crimson',
        color: 0xff0000,
        resources: 1000,
        explored: [],
        visible: []
      };
      state.players['player_2'] = {
        id: 'player_2',
        factionId: 'liberty',
        color: 0x0000ff,
        resources: 1000,
        explored: [],
        visible: []
      };

      // Spawn Initial Units/Buildings
      // Player 1 (Human)
      const p1Start = map.startPositions[0];
      state.entities['p1_hq'] = { id: 'p1_hq', type: 'hq', ownerId: 'player_1', position: { ...p1Start }, width: 3, height: 3, health: 1000, maxHealth: 1000 };
      state.entities['p1_harvester'] = { id: 'p1_harvester', type: 'harvester', ownerId: 'player_1', position: { x: p1Start.x + 4, y: p1Start.y }, health: 100, maxHealth: 100 };

      // Player 2 (AI)
      const p2Start = map.startPositions[1];
      state.entities['p2_hq'] = { id: 'p2_hq', type: 'hq', ownerId: 'player_2', position: { ...p2Start }, width: 3, height: 3, health: 1000, maxHealth: 1000 };

      // Spawn Resources
      state.entities['ore_1'] = { id: 'ore_1', type: 'resource_ore', ownerId: 'neutral', position: { x: p1Start.x + 6, y: p1Start.y }, amount: 10000 };
      state.entities['ore_2'] = { id: 'ore_2', type: 'resource_ore', ownerId: 'neutral', position: { x: p2Start.x - 6, y: p2Start.y }, amount: 10000 };

      // Initialize Systems
      const inputManager = new InputManager(app);
      const movementSystem = new MovementSystem(map);
      const constructionSystem = new ConstructionSystem(map);
      const resourceSystem = new ResourceSystem(movementSystem);
      const combatSystem = new CombatSystem();
      const visibilitySystem = new VisibilitySystem(map);
      const aiController = new SimpleAI('player_2', constructionSystem, movementSystem);

      // Local selection state (client-side only)
      let selectedEntityIds: string[] = [];
      // pendingBuild is now managed by pendingBuildRef

      // Initialize Game Loop
      const loop = new GameLoop(
        (dt) => {
          // Process Inputs
          const commands = inputManager.getCommands();
          for (const cmd of commands) {
            if (cmd.type === 'SELECT') {
              if (pendingBuildRef.current) {
                // Build at location
                const { x, y } = cmd.payload.position;
                // Try to build
                if (constructionSystem.build(state, 'player_1', pendingBuildRef.current, { x, y })) {
                  pendingBuildRef.current = null;
                  // Force UI update (hacky for prototype)
                  setResources(state.players['player_1'].resources);
                }
              } else {
                // Simple point selection
                const { x, y } = cmd.payload.position;
                selectedEntityIds = [];
                Object.values(state.entities).forEach(entity => {
                  // Simple hit test (assuming 1x1 tile size for now)
                  if (Math.round(entity.position.x) === x && Math.round(entity.position.y) === y) {
                    selectedEntityIds.push(entity.id);
                    console.log('Selected:', entity.id);
                  }
                });
              }
            } else if (cmd.type === 'MOVE') {
              const target = cmd.payload.position;
              selectedEntityIds.forEach(id => {
                const entity = state.entities[id];
                if (entity && entity.ownerId === 'player_1') { // Only move own units
                  movementSystem.setPath(entity, target);
                }
              });
              pendingBuildRef.current = null; // Cancel build
            }
          }

          // Update Systems
          movementSystem.update(state, dt);
          resourceSystem.update(state, dt);
          combatSystem.update(state, dt);
          visibilitySystem.update(state);
          aiController.update(state, dt);

          state.tick++;

          // Sync UI state occasionally
          if (state.tick % 10 === 0) {
            setResources(state.players['player_1']?.resources || 0);
          }
        },
        (alpha) => {
          renderer.render(state, alpha);
        }
      );

      gameLoopRef.current = loop;
      setLoading(false);
      loop.start();

      // Expose game interaction methods
      gameInstanceRef.current = {
        startBuild: (buildingId: string) => {
          pendingBuildRef.current = buildingId;
          console.log(`Pending build set to: ${buildingId}`);
        },
        // Add other methods as needed
      };
    };

    init();

    return () => {
      gameLoopRef.current?.stop();
      appRef.current?.destroy(true, { children: true, texture: true });
    };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#333' }}>
      <Sidebar factionId="crimson" resources={resources} onBuild={(id) => gameInstanceRef.current?.startBuild(id)} />
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && <div style={{ color: 'white', position: 'absolute', top: 10, left: 10 }}>Loading Assets...</div>}
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default App;
