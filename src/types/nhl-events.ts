/**
 * NHL API Event Type Definitions
 * Based on the actual NHL play-by-play API structure
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
 * Base event structure that all NHL events share
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
}

/**
 * Base event details with coordinates
 * Only events with locations extend this
 */
export interface EventDetailsWithLocation {
  xCoord: number;
  yCoord: number;
  zoneCode: "O" | "D" | "N"; // Offensive, Defensive, Neutral
  eventOwnerTeamId: number;
}

/**
 * Shot-on-goal event
 * typeDescKey: "shot-on-goal"
 * typeCode: 506
 */
export interface ShotOnGoalEvent extends NHLBaseEvent {
  typeDescKey: "shot-on-goal";
  details: EventDetailsWithLocation & {
    shotType: string;
    shootingPlayerId: number;
    goalieInNetId: number;
    awaySOG?: number;
    homeSOG?: number;
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
    reason: string;
    shotType: string;
    shootingPlayerId: number;
    goalieInNetId: number;
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
    blockingPlayerId: number;
    shootingPlayerId: number;
    reason: string;
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
    shotType: string;
    scoringPlayerId: number;
    scoringPlayerTotal: number;
    assist1PlayerId?: number;
    assist1PlayerTotal?: number;
    assist2PlayerId?: number;
    assist2PlayerTotal?: number;
    goalieInNetId: number;
    awayScore: number;
    homeScore: number;
    strength?: string;
    highlightClip?: number;
    highlightClipSharingUrl?: string;
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
 * Events without coordinates
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
