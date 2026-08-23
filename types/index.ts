import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId | string;
  name: string;
  email: string;
  image?: string;
  activeSeasons?: number[];
  npc?: boolean;
}

export interface Game {
  _id?: ObjectId | string;
  season: number;
  week: number;
  startTime: string | Date;
  awayFavorite: boolean;
  spread: number;
  homeScore?: number;
  awayScore?: number;
  playedStatus?: string;
  userChoices?: UserChoice[];
}

export interface UserChoice {
  _id?: ObjectId | string;
  gameId: ObjectId | string;
  userId: string;
  choice: 'ff' | 'uu' | 'uf'; // favorite favorite, underdog underdog, underdog favorite, etc.
  selectionTime: string | Date;
}

export interface WeekConfig {
  _id?: ObjectId | string;
  week: number;
  season: number;
}
