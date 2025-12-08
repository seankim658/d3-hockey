import type { HockeyEvent } from "../types";
import type {
  NHLEvent,
  NHLEventWithLocation,
  NHLPlayByPlayResponse,
} from "./types";
import {
  hasLocation,
  isGoal,
  isShotOnGoal,
  isMissedShot,
  isBlockedShot,
  isHit,
  isGiveaway,
  isTakeaway,
  isPenalty,
} from "./types";

/**
 * Convert a single NHL event with location to HockeyEvent format
 */
export function nhlEventToHockeyEvent(
  event: NHLEventWithLocation,
): HockeyEvent {
  const baseEvent: Partial<HockeyEvent> = {
    id: event.eventId,
    coordinates: {
      x: event.details.xCoord,
      y: event.details.yCoord,
    },
    period: event.periodDescriptor.number,
    time: event.timeInPeriod,
    team: String(event.details.eventOwnerTeamId),
  };

  // Add event-specific details
  if (isShotOnGoal(event)) {
    return {
      ...baseEvent,
      type: "shot-on-goal",
      eventType: event.details.shotType,
      playerId: event.details.shootingPlayerId,
      goalieId: event.details.goalieInNetId,
    } as HockeyEvent;
  }

  if (isGoal(event)) {
    return {
      ...baseEvent,
      type: "goal",
      eventType: event.details.shotType,
      playerId: event.details.scoringPlayerId,
      assist1PlayerId: event.details.assist1PlayerId,
      assist2PlayerId: event.details.assist2PlayerId,
      goalieId: event.details.goalieInNetId,
    } as HockeyEvent;
  }

  if (isMissedShot(event)) {
    return {
      ...baseEvent,
      type: "missed-shot",
      eventType: event.details.shotType,
      playerId: event.details.shootingPlayerId,
      reason: event.details.reason,
      goalieId: event.details.goalieInNetId,
    } as HockeyEvent;
  }

  if (isBlockedShot(event)) {
    return {
      ...baseEvent,
      type: "blocked-shot",
      playerId: event.details.shootingPlayerId,
      blockingPlayerId: event.details.blockingPlayerId,
    } as HockeyEvent;
  }

  if (isHit(event)) {
    return {
      ...baseEvent,
      type: "hit",
      playerId: event.details.hittingPlayerId,
      hitteePlayerId: event.details.hitteePlayerId,
    } as HockeyEvent;
  }

  if (isGiveaway(event)) {
    return {
      ...baseEvent,
      type: "giveaway",
      playerId: event.details.playerId,
    } as HockeyEvent;
  }

  if (isTakeaway(event)) {
    return {
      ...baseEvent,
      type: "takeaway",
      playerId: event.details.playerId,
    } as HockeyEvent;
  }

  if (isPenalty(event)) {
    return {
      ...baseEvent,
      type: "penalty",
      playerId: event.details.committedByPlayerId,
      drawnByPlayerId: event.details.drawnByPlayerId,
      penaltyDescKey: event.details.descKey,
      penaltyDuration: event.details.duration,
    } as HockeyEvent;
  }

  // Fallback for unknown event types
  return {
    ...baseEvent,
    type: "unknown",
  } as HockeyEvent;
}

/**
 * Parse an array of NHL events into HockeyEvent format
 * Automatically filters out events without location data
 */
export function parseNHLEvents(events: NHLEvent[]): HockeyEvent[] {
  return events
    .filter(hasLocation)
    .map(nhlEventToHockeyEvent)
    .filter((event): event is HockeyEvent => event !== null);
}

/**
 * Parse NHL API play-by-play response into HockeyEvent array
 */
export function parseNHLPlayByPlay(
  response: NHLPlayByPlayResponse,
): HockeyEvent[] {
  return parseNHLEvents(response.plays);
}

/**
 * Filter options for NHL event parsing
 */
export interface ParseOptions {
  /** Filter by team ID */
  teamId?: number;
  /** Filter by event types */
  eventTypes?: string[];
  /** Filter by period(s) */
  periods?: number[];
  /** Only include shot events (goals, shots, missed shots, blocked shots) */
  shotsOnly?: boolean;
}

/**
 * Parse NHL events with filtering options
 */
export function parseNHLEventsWithFilter(
  events: NHLEvent[],
  options: ParseOptions = {},
): HockeyEvent[] {
  let filteredEvents = events.filter(hasLocation);

  // Filter by team
  if (options.teamId !== undefined) {
    filteredEvents = filteredEvents.filter(
      (event) => event.details.eventOwnerTeamId === options.teamId,
    );
  }

  // Filter by event types
  if (options.eventTypes && options.eventTypes.length > 0) {
    filteredEvents = filteredEvents.filter((event) =>
      options.eventTypes!.includes(event.typeDescKey),
    );
  }

  // Filter by periods
  if (options.periods && options.periods.length > 0) {
    filteredEvents = filteredEvents.filter((event) =>
      options.periods!.includes(event.periodDescriptor.number),
    );
  }

  // Filter to shots only
  if (options.shotsOnly) {
    filteredEvents = filteredEvents.filter(
      (event) =>
        event.typeDescKey === "shot-on-goal" ||
        event.typeDescKey === "goal" ||
        event.typeDescKey === "missed-shot" ||
        event.typeDescKey === "blocked-shot",
    );
  }

  return filteredEvents.map(nhlEventToHockeyEvent);
}

/**
 * Parse and separate events by team from play-by-play response
 */
export function parseNHLEventsByTeam(response: NHLPlayByPlayResponse): {
  homeTeam: HockeyEvent[];
  awayTeam: HockeyEvent[];
  homeTeamInfo: { id: number; abbrev: string; name: string };
  awayTeamInfo: { id: number; abbrev: string; name: string };
} {
  const homeTeamId = response.homeTeam.id;
  const awayTeamId = response.awayTeam.id;

  const homeTeam = parseNHLEventsWithFilter(response.plays, {
    teamId: homeTeamId,
  });

  const awayTeam = parseNHLEventsWithFilter(response.plays, {
    teamId: awayTeamId,
  });

  return {
    homeTeam,
    awayTeam,
    homeTeamInfo: {
      id: homeTeamId,
      abbrev: response.homeTeam.abbrev,
      name: response.homeTeam.commonName.default,
    },
    awayTeamInfo: {
      id: awayTeamId,
      abbrev: response.awayTeam.abbrev,
      name: response.awayTeam.commonName.default,
    },
  };
}
