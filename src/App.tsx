import React, { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { AssetManager } from './assets/AssetManager';
import { defaultManifest } from './assets/AssetManifest';
import { GameLoop } from './engine/loop/GameLoop';
import { WorldRenderer } from './engine/render/WorldRenderer';
import { createInitialState, type Vector2 } from './engine/state/GameState';
import { createTrainingMap } from './maps/MapData';
import { InputManager } from './engine/input/InputManager';
import { MovementSystem } from './gameplay/systems/MovementSystem';
import { ConstructionSystem } from './gameplay/systems/ConstructionSystem';
import { ResourceSystem } from './gameplay/systems/ResourceSystem';
import { CombatSystem } from './gameplay/systems/CombatSystem';
import { VisibilitySystem } from './gameplay/systems/VisibilitySystem';
import { SimpleAI } from './ai/SimpleAI';
import { Sidebar } from './ui/Sidebar';
import { MainMenu } from './ui/MainMenu';
import { create4PlayerMap, create6PlayerMap, create8PlayerMap, type MapData } from './maps/MapData';
import { Minimap } from './ui/Minimap';

const App: React.FC = () => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const [resources, setResources] = useState(1000);
  const [gameState, setGameState] = useState<any>(null); // Store game state for UI
  const gameLoopRef = useRef<GameLoop | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const appRef = useRef<Application | null>(null);
  const pendingBuildRef = useRef<{ buildingId: string } | null>(null);
  const gameInstanceRef = useRef<{ startBuild: (buildingId: string) => void } | null>(null);
  const mapRef = useRef<MapData | null>(null); // Ref to store the map data

  // Camera State
  const cameraOffsetRef = useRef<Vector2>({ x: 0, y: 0 });

  const startGame = (mapType: string, difficulty: string) => {
    // Initialize App
    const app = new Application();

    app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1099bb
    }).then(() => {
      if (pixiContainerRef.current) {
        pixiContainerRef.current.appendChild(app.canvas);
      }
      appRef.current = app;

      // Initialize Assets
      const assetManager = new AssetManager(defaultManifest);
      assetManager.loadAll().then(() => {
        // Initialize Renderer
        const renderer = new WorldRenderer(app, assetManager);

        // Initialize Map
        let map: MapData;
        switch (mapType) {
          case '4player': map = create4PlayerMap(); break;
          case '6player': map = create6PlayerMap(); break;
          case '8player': map = create8PlayerMap(); break;
          default: map = createTrainingMap(); break;
        }
        renderer.setMap(map);
        mapRef.current = map; // Store map in ref

        const state = createInitialState();

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
        state.entities['p1_hq'] = {
          id: 'p1_hq',
          type: 'hq',
          ownerId: 'player_1',
          position: { ...p1Start },
          width: 3,
          height: 3,
          health: 2000,
          maxHealth: 2000,
          assetId: 'building_hq'
        };
        state.entities['p1_harvester'] = {
          id: 'p1_harvester',
          type: 'harvester',
          ownerId: 'player_1',
          position: { x: p1Start.x + 4, y: p1Start.y },
          width: 1,
          height: 1,
          health: 500,
          maxHealth: 500,
          assetId: 'unit_tank'
        };

        // Player 2 (AI)
        const p2Start = map.startPositions[1];
        state.entities['p2_hq'] = {
          id: 'p2_hq',
          type: 'hq',
          ownerId: 'player_2',
          position: { ...p2Start },
          width: 3,
          height: 3,
          health: 2000,
          maxHealth: 2000,
          assetId: 'building_hq'
        };

        // Initialize Systems
        const inputManager = new InputManager(app);

        // Provide camera offset to InputManager
        inputManager.getCameraOffset = () => cameraOffsetRef.current;

        const movementSystem = new MovementSystem(map);
        const constructionSystem = new ConstructionSystem(map);
        const resourceSystem = new ResourceSystem(movementSystem);
        const combatSystem = new CombatSystem();
        const visibilitySystem = new VisibilitySystem(map);
        const aiController = new SimpleAI('player_2', constructionSystem, movementSystem, difficulty as any);

        // Local selection state (client-side only)
        let selectedEntityIds: string[] = [];

        inputManager.onSelect = (cmd: any) => {
          console.log(`[App] onSelect: ${JSON.stringify(cmd)}`);
          const clickedEntity = Object.values(state.entities).find(e => {
            const dx = Math.abs(e.position.x - cmd.position.x);
            const dy = Math.abs(e.position.y - cmd.position.y);
            const within = dx <= 0.5 && dy <= 0.5; // tolerance for isometric click
            if (within) console.log(`[App] Hit Entity (tolerant): ${e.id} at ${e.position.x},${e.position.y}`);
            return within;
          });

          if (clickedEntity && clickedEntity.ownerId === 'player_1') {
            selectedEntityIds = [clickedEntity.id];
            console.log('Selected:', clickedEntity.id);
          } else if (!clickedEntity) {
            selectedEntityIds = [];
            console.log('Deselected all');
          }
        };

        inputManager.onMove = (cmd: any) => {
          console.log(`[App] onMove: ${JSON.stringify(cmd)}`);
          selectedEntityIds.forEach(id => {
            const entity = state.entities[id];
            if (entity) {
              movementSystem.setPath(entity, cmd.position);
            }
          });
        };

        // Expose build function
        gameInstanceRef.current = {
          startBuild: (buildingId: string) => {
            pendingBuildRef.current = { buildingId };
          }
        };

        // Handle building placement click via intercepting onSelect
        const originalOnSelect = inputManager.onSelect;
        inputManager.onSelect = (cmd: any) => {
          if (pendingBuildRef.current) {
            if (constructionSystem.build(state, 'player_1', pendingBuildRef.current.buildingId, cmd.position)) {
              // Resources are deducted inside constructionSystem.build
              pendingBuildRef.current = null;
            } else {
              console.log("Cannot build there");
            }
          } else {
            if (originalOnSelect) originalOnSelect(cmd);
          }
        };

        // Cursor state
        let cursorGridPos: Vector2 | null = null;
        inputManager.onHover = (cmd: any) => {
          cursorGridPos = cmd.position;
        };

        // Game Loop
        const loop = new GameLoop((dt) => {
          // ... (camera logic)

          // ... (inputs)

          // ... (systems)

          state.tick++;
          if (state.tick % 10 === 0) {
            setResources(state.players['player_1'].resources);
            setGameState({ ...state });
          }
        }, (alpha) => {
          renderer.render(state, alpha, selectedEntityIds, cursorGridPos);
        });

        gameLoopRef.current = loop;
        loop.start();
      });
    });

    setGameStarted(true);
  };

  useEffect(() => {
    return () => {
      gameLoopRef.current?.stop();
      appRef.current?.destroy(true, { children: true, texture: true });
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {!gameStarted && <MainMenu onStartGame={startGame} />}
      <div ref={pixiContainerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />
      {gameStarted && (
        <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <Sidebar
              resources={resources}
              factionId="crimson"
              onBuild={(buildingId) => {
                if (gameInstanceRef.current) {
                  gameInstanceRef.current.startBuild(buildingId);
                }
              }}
            />
          </div>
          {gameState && mapRef.current && (
            <div style={{ pointerEvents: 'auto' }}>
              <Minimap
                map={mapRef.current}
                gameState={gameState}
                playerId="player_1"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
