/**
 * NHL API Event Classes
 *
 * Provided as a convenience to support NHL event data out of the box.
 * Only includes events with location data that are useful for visualization.
 */

import type { HockeyEvent } from "../types";

/**
 * Period descriptor from NHL API
 */
export interface NHLPeriodDescriptor {
  number: number;
  periodType: "REG" | "OT" | "SO";
  maxRegulationPeriods: number;
}

/**
 * Base NHL API event - contains fields common to all events
 */
export abstract class NHLAPIEvent {
  eventId: number;
  periodDescriptor: NHLPeriodDescriptor;
  timeInPeriod: string;
  timeRemaining: string;
  situationCode: string;
  homeTeamDefendingSide: "left" | "right";
  typeCode: number;
  typeDescKey: string;
  sortOrder: number;

  constructor(data: Record<string, unknown>) {
    this.eventId = data.eventId as number;
    this.periodDescriptor = data.periodDescriptor as NHLPeriodDescriptor;
    this.timeInPeriod = data.timeInPeriod as string;
    this.timeRemaining = data.timeRemaining as string;
    this.situationCode = data.situationCode as string;
    this.homeTeamDefendingSide = data.homeTeamDefendingSide as "left" | "right";
    this.typeCode = data.typeCode as number;
    this.typeDescKey = data.typeDescKey as string;
    this.sortOrder = data.sortOrder as number;
  }

  /**
   * Check if this event has location data
   */
  abstract hasLocation(): boolean;

  /**
   * Convert to HockeyEvent format for the library
   */
  abstract toHockeyEvent(): HockeyEvent | null;
}

/**
 * Base class for events with location data
 */
export abstract class LocationEvent extends NHLAPIEvent {
  xCoord: number;
  yCoord: number;
  zoneCode: "D" | "N" | "O"; // Defensive, Neutral, Offensive
  eventOwnerTeamId: number;

  constructor(data: Record<string, unknown>) {
    super(data);
    const details = data.details as Record<string, unknown>;
    this.xCoord = details.xCoord as number;
    this.yCoord = details.yCoord as number;
    this.zoneCode = details.zoneCode as "D" | "N" | "O";
    this.eventOwnerTeamId = details.eventOwnerTeamId as number;
  }

  hasLocation(): boolean {
    return true;
  }

  /**
   * Get base hockey event data
   */
  protected getBaseHockeyEvent(): Partial<HockeyEvent> {
    return {
      id: this.eventId,
      coordinates: {
        x: this.xCoord,
        y: this.yCoord,
      },
      period: this.periodDescriptor.number,
      time: this.timeInPeriod,
    };
  }
}

/**
 * Shot on goal event (typeCode: 506)
 */
export class ShotEvent extends LocationEvent {
  shootingPlayerId: number;
  shotType: string;
  goalieInNetId?: number;

  constructor(data: Record<string, unknown>) {
    super(data);
    const details = data.details as Record<string, unknown>;
    this.shootingPlayerId = details.shootingPlayerId as number;
    this.shotType = details.shotType as string;
    this.goalieInNetId = details.goalieInNetId as number | undefined;
  }

  toHockeyEvent(): HockeyEvent {
    return {
      ...this.getBaseHockeyEvent(),
      type: "shot",
      eventType: this.shotType,
      playerId: this.shootingPlayerId,
      team: String(this.eventOwnerTeamId),
    } as HockeyEvent;
  }
}

/**
 * Goal event (typeCode: 505)
 */
export class GoalEvent extends LocationEvent {
  scoringPlayerId: number;
  assist1PlayerId?: number;
  assist2PlayerId?: number;
  shotType: string;
  goalieInNetId?: number;

  constructor(data: Record<string, unknown>) {
    super(data);
    const details = data.details as Record<string, unknown>;
    this.scoringPlayerId = details.scoringPlayerId as number;
    this.assist1PlayerId = details.assist1PlayerId as number | undefined;
    this.assist2PlayerId = details.assist2PlayerId as number | undefined;
    this.shotType = details.shotType as string;
    this.goalieInNetId = details.goalieInNetId as number | undefined;
  }

  toHockeyEvent(): HockeyEvent {
    return {
      ...this.getBaseHockeyEvent(),
      type: "goal",
      eventType: this.shotType,
      playerId: this.scoringPlayerId,
      team: String(this.eventOwnerTeamId),
    } as HockeyEvent;
  }
}

/**
 * Missed shot event (typeCode: 507)
 */
export class MissedShotEvent extends LocationEvent {
  shootingPlayerId: number;
  shotType: string;
  reason: string; // e.g., 'wide-left', 'over-net', 'hit-right-post'
  goalieInNetId?: number;

  constructor(data: Record<string, unknown>) {
    super(data);
    const details = data.details as Record<string, unknown>;
    this.shootingPlayerId = details.shootingPlayerId as number;
    this.shotType = details.shotType as string;
    this.reason = details.reason as string;
    this.goalieInNetId = details.goalieInNetId as number | undefined;
  }

  toHockeyEvent(): HockeyEvent {
    return {
      ...this.getBaseHockeyEvent(),
      type: "missed-shot",
      eventType: this.shotType,
      playerId: this.shootingPlayerId,
      team: String(this.eventOwnerTeamId),
    } as HockeyEvent;
  }
}

/**
 * Blocked shot event (typeCode: 508)
 */
export class BlockedShotEvent extends LocationEvent {
  shootingPlayerId: number;
  blockingPlayerId: number;

  constructor(data: Record<string, unknown>) {
    super(data);
    const details = data.details as Record<string, unknown>;
    this.shootingPlayerId = details.shootingPlayerId as number;
    this.blockingPlayerId = details.blockingPlayerId as number;
  }

  toHockeyEvent(): HockeyEvent {
    return {
      ...this.getBaseHockeyEvent(),
      type: "blocked-shot",
      playerId: this.shootingPlayerId,
      team: String(this.eventOwnerTeamId),
    } as HockeyEvent;
  }
}

/**
 * Hit event (typeCode: 503)
 */
export class HitEvent extends LocationEvent {
  hittingPlayerId: number;
  hitteePlayerId: number;

  constructor(data: Record<string, unknown>) {
    super(data);
    const details = data.details as Record<string, unknown>;
    this.hittingPlayerId = details.hittingPlayerId as number;
    this.hitteePlayerId = details.hitteePlayerId as number;
  }

  toHockeyEvent(): HockeyEvent {
    return {
      ...this.getBaseHockeyEvent(),
      type: "hit",
      playerId: this.hittingPlayerId,
      team: String(this.eventOwnerTeamId),
    } as HockeyEvent;
  }
}

/**
 * Giveaway event (typeCode: 504)
 */
export class GiveawayEvent extends LocationEvent {
  playerId: number;

  constructor(data: Record<string, unknown>) {
    super(data);
    const details = data.details as Record<string, unknown>;
    this.playerId = details.playerId as number;
  }

  toHockeyEvent(): HockeyEvent {
    return {
      ...this.getBaseHockeyEvent(),
      type: "giveaway",
      playerId: this.playerId,
      team: String(this.eventOwnerTeamId),
    } as HockeyEvent;
  }
}

/**
 * Takeaway event (typeCode: 509)
 */
export class TakeawayEvent extends LocationEvent {
  playerId: number;

  constructor(data: Record<string, unknown>) {
    super(data);
    const details = data.details as Record<string, unknown>;
    this.playerId = details.playerId as number;
  }

  toHockeyEvent(): HockeyEvent {
    return {
      ...this.getBaseHockeyEvent(),
      type: "takeaway",
      playerId: this.playerId,
      team: String(this.eventOwnerTeamId),
    } as HockeyEvent;
  }
}

/**
 * Common event type codes
 */
export const RELEVANT_EVENT_TYPE_CODES = {
  HIT: 503,
  GIVEAWAY: 504,
  GOAL: 505,
  SHOT: 506,
  MISSED_SHOT: 507,
  BLOCKED_SHOT: 508,
  TAKEAWAY: 509,
} as const;

/**
 * Parse raw NHL API event data into typed event classes
 */
export function parseNHLAPIEvent(
  data: Record<string, unknown>,
): NHLAPIEvent | null {
  const typeCode = data.typeCode as number;

  // Only parse events we care about
  switch (typeCode) {
    case RELEVANT_EVENT_TYPE_CODES.SHOT:
      return new ShotEvent(data);
    case RELEVANT_EVENT_TYPE_CODES.GOAL:
      return new GoalEvent(data);
    case RELEVANT_EVENT_TYPE_CODES.MISSED_SHOT:
      return new MissedShotEvent(data);
    case RELEVANT_EVENT_TYPE_CODES.BLOCKED_SHOT:
      return new BlockedShotEvent(data);
    case RELEVANT_EVENT_TYPE_CODES.HIT:
      return new HitEvent(data);
    case RELEVANT_EVENT_TYPE_CODES.GIVEAWAY:
      return new GiveawayEvent(data);
    case RELEVANT_EVENT_TYPE_CODES.TAKEAWAY:
      return new TakeawayEvent(data);
    default:
      // Ignore other events (faceoffs, stoppages, period starts, etc.)
      return null;
  }
}

/**
 * Parse an array of NHL API events and convert to HockeyEvent format
 */
export function parseNHLAPIEvents(
  apiData: Array<Record<string, unknown>>,
): HockeyEvent[] {
  return apiData
    .map(parseNHLAPIEvent)
    .filter((event): event is NHLAPIEvent => event !== null)
    .map((event) => event.toHockeyEvent())
    .filter((event): event is HockeyEvent => event !== null);
}

/**
 * Parse NHL API play-by-play response
 */
export interface NHLAPIPlayByPlayResponse {
  plays: Array<Record<string, unknown>>;
  // Other fields can be ignored for now
  [key: string]: unknown;
}

/**
 * Extract and parse events from full NHL API response
 */
export function extractNHLAPIEvents(
  apiResponse: NHLAPIPlayByPlayResponse,
): HockeyEvent[] {
  return parseNHLAPIEvents(apiResponse.plays);
}
