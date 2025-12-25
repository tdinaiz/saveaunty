
export enum AuntyState {
  CALM = 'CALM',
  WORRIED = 'WORRIED',
  HAPPY = 'HAPPY',
  HARMED = 'HARMED'
}

export enum ThreatType {
  BEES = 'BEES'
}

export enum InteractionType {
  DRAW = 'DRAW'
}

export interface Point {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  type: 'platform' | 'crate' | 'spikes' | 'water';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface Threat {
  id: string;
  type: ThreatType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  active: boolean;
  impact?: number; // Added to track visual impact duration
}

export interface Level {
  id: number;
  title: string;
  auntyPos: Point;
  hivePos: Point;
  interaction: InteractionType;
  objects: GameObject[];
  threats: Threat[];
  maxInk?: number;
  hasBalloon?: boolean;
}

export enum GameStatus {
  READY = 'READY',
  PLAYING = 'PLAYING',
  WON = 'WON',
  FAILED = 'FAILED'
}
