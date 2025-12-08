/* eslint-disable  @typescript-eslint/no-explicit-any */

/**
 * NHL API Type Definitions
 *
 * Comprehensive type definitions for the NHL API v1
 * Based on api-web.nhle.com endpoints
 */

/**
 * Period descriptor from NHL API
 */
export interface PeriodDescriptor {
  number: number;
  periodType: "REG" | "OT" | "SO";
  maxRegulationPeriods: number;
}

/**
 * Team information from NHL API
 */
export interface NHLTeamInfo {
  id: number;
  commonName: { default: string };
  abbrev: string;
  placeName: { default: string };
  score?: number;
  sog?: number;
  logo?: string;
}

/**
 * Player information from roster endpoint
 */
export interface NHLPlayerInfo {
  playerId: number;
  firstName: { default: string; [key: string]: string };
  lastName: { default: string; [key: string]: string };
  playerSlug: string;
}

/**
 * Base NHL API event structure
 * Common fields present in all events
 */
export interface NHLBaseEvent {
  eventId: number;
  periodDescriptor: PeriodDescriptor;
  timeInPeriod: string;
  timeRemaining: string;
  situationCode: string;
  homeTeamDefendingSide: "left" | "right";
  typeCode: number;
  typeDescKey: string;
  sortOrder: number;
  details?: any;
}

/**
 * Event details with location information
 */
export interface EventDetailsWithLocation {
  xCoord: number;
  yCoord: number;
  zoneCode: "D" | "N" | "O"; // Defensive, Neutral, Offensive
  eventOwnerTeamId: number;
}

/**
 * Shot on goal event
 * typeDescKey: "shot-on-goal"
 * typeCode: 506
 */
export interface ShotOnGoalEvent extends NHLBaseEvent {
  typeDescKey: "shot-on-goal";
  details: EventDetailsWithLocation & {
    shootingPlayerId: number;
    shotType: string;
    goalieInNetId?: number;
  };
}

/**
 * Missed shot event
 * typeDescKey: "missed-shot"
 * typeCode: 507
 */
export interface MissedShotEvent extends NHLBaseEvent {
  typeDescKey: "missed-shot";
  details: EventDetailsWithLocation & {
    shootingPlayerId: number;
    shotType: string;
    reason: string; // e.g., 'wide-left', 'over-net', 'hit-right-post'
    goalieInNetId?: number;
  };
}

/**
 * Blocked shot event
 * typeDescKey: "blocked-shot"
 * typeCode: 508
 */
export interface BlockedShotEvent extends NHLBaseEvent {
  typeDescKey: "blocked-shot";
  details: EventDetailsWithLocation & {
    shootingPlayerId: number;
    blockingPlayerId: number;
    reason?: string;
  };
}

/**
 * Goal event
 * typeDescKey: "goal"
 * typeCode: 505
 */
export interface GoalEvent extends NHLBaseEvent {
  typeDescKey: "goal";
  details: EventDetailsWithLocation & {
    scoringPlayerId: number;
    assist1PlayerId?: number;
    assist2PlayerId?: number;
    shotType: string;
    goalieInNetId?: number;
  };
}

/**
 * Hit event
 * typeDescKey: "hit"
 * typeCode: 503
 */
export interface HitEvent extends NHLBaseEvent {
  typeDescKey: "hit";
  details: EventDetailsWithLocation & {
    hittingPlayerId: number;
    hitteePlayerId: number;
  };
}

/**
 * Giveaway event
 * typeDescKey: "giveaway"
 * typeCode: 504
 */
export interface GiveawayEvent extends NHLBaseEvent {
  typeDescKey: "giveaway";
  details: EventDetailsWithLocation & {
    playerId: number;
  };
}

/**
 * Takeaway event
 * typeDescKey: "takeaway"
 * typeCode: 505
 */
export interface TakeawayEvent extends NHLBaseEvent {
  typeDescKey: "takeaway";
  details: EventDetailsWithLocation & {
    playerId: number;
  };
}

/**
 * Penalty event
 * typeDescKey: "penalty"
 * typeCode: 509
 */
export interface PenaltyEvent extends NHLBaseEvent {
  typeDescKey: "penalty";
  details: EventDetailsWithLocation & {
    committedByPlayerId: number;
    drawnByPlayerId?: number;
    descKey: string;
    duration: number;
    typeCode: string;
  };
}

/**
 * Union type of events with coordinates
 */
export type NHLEventWithLocation =
  | ShotOnGoalEvent
  | MissedShotEvent
  | BlockedShotEvent
  | GoalEvent
  | HitEvent
  | GiveawayEvent
  | TakeawayEvent
  | PenaltyEvent;

/**
 * Events without coordinates (not typically used for visualization)
 */
export type NHLEventWithoutLocation = NHLBaseEvent & {
  typeDescKey:
    | "faceoff"
    | "period-start"
    | "period-end"
    | "game-end"
    | "stoppage"
    | "icing"
    | "offside"
    | "shootout-complete"
    | "delayed-penalty"
    | "goalie-pulled"
    | "challenge";
  details?: Record<string, unknown>;
};

/**
 * Any NHL API event
 */
export type NHLEvent = NHLEventWithLocation | NHLEventWithoutLocation;

/**
 * NHL API play-by-play response structure
 */
export interface NHLPlayByPlayResponse {
  id: number;
  season: number;
  gameType: number;
  gameDate: string;
  venue: { default: string };
  awayTeam: NHLTeamInfo;
  homeTeam: NHLTeamInfo;
  plays: NHLEvent[];
  [key: string]: unknown;
}

/**
 * NHL API player endpoint response
 */
export interface NHLPlayerResponse {
  playerId: number;
  firstName: { default: string; [key: string]: string };
  lastName: { default: string; [key: string]: string };
  currentTeamRoster?: NHLPlayerInfo[];
  [key: string]: unknown;
}

/**
 * Event type codes from NHL API
 */
export const NHL_EVENT_TYPE_CODES = {
  HIT: 503,
  GIVEAWAY: 504,
  GOAL: 505,
  SHOT_ON_GOAL: 506,
  MISSED_SHOT: 507,
  BLOCKED_SHOT: 508,
  PENALTY: 509,
  TAKEAWAY: 505, // Note: Same as goal in some API versions
} as const;

/**
 * Type guard to check if an event has location data
 */
export function hasLocation(event: NHLEvent): event is NHLEventWithLocation {
  return (
    event.details !== undefined &&
    "xCoord" in event.details &&
    "yCoord" in event.details &&
    typeof event.details.xCoord === "number" &&
    typeof event.details.yCoord === "number"
  );
}

/**
 * Type guards for specific event types
 */
export function isGoal(event: NHLEvent): event is GoalEvent {
  return event.typeDescKey === "goal";
}

export function isShotOnGoal(event: NHLEvent): event is ShotOnGoalEvent {
  return event.typeDescKey === "shot-on-goal";
}

export function isMissedShot(event: NHLEvent): event is MissedShotEvent {
  return event.typeDescKey === "missed-shot";
}

export function isBlockedShot(event: NHLEvent): event is BlockedShotEvent {
  return event.typeDescKey === "blocked-shot";
}

export function isHit(event: NHLEvent): event is HitEvent {
  return event.typeDescKey === "hit";
}

export function isGiveaway(event: NHLEvent): event is GiveawayEvent {
  return event.typeDescKey === "giveaway";
}

export function isTakeaway(event: NHLEvent): event is TakeawayEvent {
  return event.typeDescKey === "takeaway";
}

export function isPenalty(event: NHLEvent): event is PenaltyEvent {
  return event.typeDescKey === "penalty";
}

/**
 * Helper to check if an event is a shot-related event
 */
export function isShotEvent(
  event: NHLEvent,
): event is ShotOnGoalEvent | MissedShotEvent | BlockedShotEvent | GoalEvent {
  return (
    event.typeDescKey === "shot-on-goal" ||
    event.typeDescKey === "missed-shot" ||
    event.typeDescKey === "blocked-shot" ||
    event.typeDescKey === "goal"
  );
}
