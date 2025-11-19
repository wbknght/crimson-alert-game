export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: string;
  ownerId: string;
  position: Vector2;
  // We can add more dynamic components here later (health, state, etc.)
  [key: string]: any;
}

export interface Player {
  id: string;
  factionId: string; // New field
  color: number; // Hex color
  resources: number;
}

export interface GameState {
  tick: number;
  entities: Record<string, Entity>;
  players: Record<string, Player>;
  // Map dimensions or reference could go here
}

export const createInitialState = (): GameState => ({
  tick: 0,
  entities: {},
  players: {},
});
