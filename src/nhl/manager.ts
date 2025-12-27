import type { HockeyEvent } from "../types";
import type { NHLPlayByPlayResponse, NHLPlayerInfo } from "./types";
import { parseNHLPlayByPlay, type ParseOptions } from "./parser";
import { flipCoordinatesByPeriod } from "../utils/coordinate-utils";
import { getTeamColors, type TeamColors } from "../utils/color-utils";

export interface FetchOptions {
  baseUrl?: string;
  flipCoordinates?: boolean;
  flipOddPeriods?: boolean;
}

/**
 * Team-specific data from NHL manager
 */
export interface TeamData {
  id: number;
  abbrev: string;
  name: string;
  colors: TeamColors;
  events: HockeyEvent[];
}

/**
 * NHL Data Manager
 * Main class for convenient NHL data handling
 */
export class NHLDataManager {
  private rawResponse: NHLPlayByPlayResponse;
  private playerRoster: Map<number, NHLPlayerInfo> = new Map();
  private options: Required<FetchOptions>;

  public readonly gameId: string;
  public readonly homeTeam: TeamData;
  public readonly awayTeam: TeamData;

  private constructor(
    gameId: string,
    response: NHLPlayByPlayResponse,
    options: FetchOptions = {},
  ) {
    this.gameId = gameId;
    this.rawResponse = response;
    this.options = {
      baseUrl: options.baseUrl || "https://api-web.nhle.com/v1",
      flipCoordinates: options.flipCoordinates ?? true,
      flipOddPeriods: options.flipOddPeriods ?? false,
    };

    this.populateRosterFromResponse(response);
    const allEvents = parseNHLPlayByPlay(response);
    const homeEvents = allEvents.filter(
      (e) => e.team === String(response.homeTeam.id),
    );
    const awayEvents = allEvents.filter(
      (e) => e.team === String(response.awayTeam.id),
    );

    // Flip coordinates if requested
    const homeEventsProcessed = this.options.flipCoordinates
      ? this.flipEventCoordinates(homeEvents)
      : homeEvents;
    const awayEventsProcessed = this.options.flipCoordinates
      ? this.flipEventCoordinates(awayEvents)
      : awayEvents;

    // Setup home team data
    const homeTeamColors = getTeamColors(response.homeTeam.abbrev);
    this.homeTeam = {
      id: response.homeTeam.id,
      abbrev: response.homeTeam.abbrev,
      name: response.homeTeam.commonName.default,
      colors: homeTeamColors || {
        primary: "#000000",
        secondary: "#FFFFFF",
        accent: "#808080",
      },
      events: homeEventsProcessed,
    };

    // Setup away team data
    const awayTeamColors = getTeamColors(response.awayTeam.abbrev);
    this.awayTeam = {
      id: response.awayTeam.id,
      abbrev: response.awayTeam.abbrev,
      name: response.awayTeam.commonName.default,
      colors: awayTeamColors || {
        primary: "#000000",
        secondary: "#FFFFFF",
        accent: "#808080",
      },
      events: awayEventsProcessed,
    };
  }

  /**
   * Helper to populate the roster map from the play-by-play response
   */
  private populateRosterFromResponse(response: NHLPlayByPlayResponse) {
    if (response.rosterSpots && Array.isArray(response.rosterSpots)) {
      response.rosterSpots.forEach((player) => {
        this.playerRoster.set(player.playerId, player);
      });
    }
  }

  /**
   * Create NHLDataManager from a game ID
   * Fetches data from NHL API automatically
   *
   * @param gameId - NHL game ID (e.g., '2025020214')
   * @param options - Fetch options
   */
  static async fromGameId(
    gameId: string,
    options: FetchOptions = {},
  ): Promise<NHLDataManager> {
    const baseUrl = options.baseUrl || "https://api-web.nhle.com/v1";
    const url = `${baseUrl}/gamecenter/${gameId}/play-by-play`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch NHL game data: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as NHLPlayByPlayResponse;
    return new NHLDataManager(gameId, data, options);
  }

  /**
   * Create NHLDataManager from pre-fetched NHL API response
   * Useful if you already have the data or want to mock data
   *
   * @param response - NHL API play-by-play response
   * @param gameId - Optional game ID for reference
   * @param options - Processing options
   */
  static fromResponse(
    response: NHLPlayByPlayResponse,
    gameId?: string,
    options: FetchOptions = {},
  ): NHLDataManager {
    return new NHLDataManager(gameId || String(response.id), response, options);
  }

  /**
   * Get player name from player ID
   */
  getPlayerName(playerId: number): string | null {
    const player = this.playerRoster.get(playerId);
    if (!player) return null;

    return `${player.firstName.default} ${player.lastName.default}`;
  }

  /**
   * Flip event coordinates by period
   */
  private flipEventCoordinates(events: HockeyEvent[]): HockeyEvent[] {
    return events.map((event) => {
      if (!event.period) return event;

      const flippedCoords = flipCoordinatesByPeriod(
        event.coordinates,
        event.period,
        this.options.flipOddPeriods,
      );

      return {
        ...event,
        coordinates: flippedCoords,
      };
    });
  }

  /**
   * Get home team events with optional filtering
   */
  getHomeTeamEvents(options?: ParseOptions): HockeyEvent[] {
    return this.filterEvents(this.homeTeam.events, options);
  }

  /**
   * Get away team events with optional filtering
   */
  getAwayTeamEvents(options?: ParseOptions): HockeyEvent[] {
    return this.filterEvents(this.awayTeam.events, options);
  }

  /**
   * Get all events with optional filtering
   */
  getAllEvents(options?: ParseOptions): HockeyEvent[] {
    const allEvents = [...this.homeTeam.events, ...this.awayTeam.events];
    return this.filterEvents(allEvents, options);
  }

  /**
   * Filter events based on options
   */
  private filterEvents(
    events: HockeyEvent[],
    options?: ParseOptions,
  ): HockeyEvent[] {
    if (!options) return events;

    let filtered = [...events];

    // Filter by event types
    if (options.eventTypes && options.eventTypes.length > 0) {
      filtered = filtered.filter((e) => options.eventTypes!.includes(e.type!));
    }

    // Filter by periods
    if (options.periods && options.periods.length > 0) {
      filtered = filtered.filter((e) =>
        e.period ? options.periods!.includes(e.period) : false,
      );
    }

    // Filter to shots only
    if (options.shotsOnly) {
      filtered = filtered.filter(
        (e) =>
          e.type === "shot-on-goal" ||
          e.type === "goal" ||
          e.type === "missed-shot" ||
          e.type === "blocked-shot",
      );
    }

    return filtered;
  }

  /**
   * Get events by period
   */
  getEventsByPeriod(period: number): {
    home: HockeyEvent[];
    away: HockeyEvent[];
    all: HockeyEvent[];
  } {
    const homeEvents = this.homeTeam.events.filter((e) => e.period === period);
    const awayEvents = this.awayTeam.events.filter((e) => e.period === period);

    return {
      home: homeEvents,
      away: awayEvents,
      all: [...homeEvents, ...awayEvents],
    };
  }

  /**
   * Get game summary statistics
   */
  getGameSummary(): {
    gameId: string;
    homeTeam: { name: string; abbrev: string; eventCount: number };
    awayTeam: { name: string; abbrev: string; eventCount: number };
    totalEvents: number;
  } {
    return {
      gameId: this.gameId,
      homeTeam: {
        name: this.homeTeam.name,
        abbrev: this.homeTeam.abbrev,
        eventCount: this.homeTeam.events.length,
      },
      awayTeam: {
        name: this.awayTeam.name,
        abbrev: this.awayTeam.abbrev,
        eventCount: this.awayTeam.events.length,
      },
      totalEvents: this.homeTeam.events.length + this.awayTeam.events.length,
    };
  }

  /**
   * Get raw NHL API response (advanced usage)
   */
  getRawResponse(): NHLPlayByPlayResponse {
    return this.rawResponse;
  }

  /**
   * Convenience getters for team colors
   */
  get homeTeamColors(): TeamColors {
    return this.homeTeam.colors;
  }

  get awayTeamColors(): TeamColors {
    return this.awayTeam.colors;
  }
}
