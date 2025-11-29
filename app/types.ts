export type MovementSpeed = 'standard' | 'fast' | 'veryFast';

export interface ModSettings {
  damageMultiplier: number;
  movementSpeed: MovementSpeed;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  position: Vector2D;
  health: number;
  maxHealth: number;
  team: 'player' | 'enemy';
  type: 'player' | 'bot' | 'enemy';
}

export interface Bot extends Entity {
  type: 'bot';
  target: Entity | null;
  state: 'idle' | 'moving' | 'attacking' | 'covering' | 'following';
  velocity: Vector2D;
  lastAbilityUse: number;
  coverPosition: Vector2D | null;
}

export interface Enemy extends Entity {
  type: 'enemy';
  velocity: Vector2D;
}

export interface Player extends Entity {
  type: 'player';
}

export interface GameState {
  player: Player;
  bots: Bot[];
  enemies: Enemy[];
  time: number;
}
