# Using NHL API Shot Data

Fetch data for a specific NHL game, map player IDs to names using roster data, and plot all shot events on an interactive rink.

We will use the `NHLDataManager` class, which simplifies working with the NHL API by handling:

- **Data Fetching:** pulling live play-by-play data
- **Coordinate Normalization:** automatically flipping coordinates so teams always shoot towards the same end per period
- **Roster Lookup:** automatically parsing player names from game data

## Complete Example

<ClientOnly>
  <Demo title="NHL Game Visualization (Local Data)">
    <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 20px;">
      <div id="game-info" style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="color: #666;">Loading local game data...</div>
      </div>
      <div id="nhl-game-demo" style="width: 100%; display: flex; justify-content: center;"></div>
    </div>
  </Demo>
</ClientOnly>

```typescript
import {
  Rink,
  NHLDataManager,
  colorByTeam,
  scaleRadiusByProperty,
} from "d3-hockey";

// 1. Initialize the Rink
const rink = new Rink("#nhl-game-demo");

async function renderGame() {
  try {
    // 2. Initialize Manager with a specific Game ID
    // Game 2022020195: EDM at WSH
    const manager = await NHLDataManager.fromGameId("2022020195", {
      flipCoordinates: true, // Standardize direction of play
      flipOddPeriods: false, // Keep periods consistent
    });

    // 3. Get Shot Events
    // Transform the data to include team abbreviations and names
    const shotEvents = manager
      .getAllEvents({ shotsOnly: true })
      .map((event) => ({
        ...event,
        // Helper to add team abbreviation since the API gives us IDs
        teamAbbrev:
          event.team === String(manager.homeTeam.id)
            ? manager.homeTeam.abbrev
            : manager.awayTeam.abbrev,
        // Helper to lookup player name
        playerName:
          manager.getPlayerName(event.playerId as number) || "Unknown Player",
      }))
      // Sorting to render goals last so they appear on top of other shots
      .sort((a, b) => {
        if (a.type === "goal") return 1;
        if (b.type === "goal") return -1;
        return 0;
      });

    // 4. Update Info Text
    document.getElementById("game-info")!.innerHTML = `
      <strong>${manager.awayTeam.name}</strong> vs 
      <strong>${manager.homeTeam.name}</strong><br>
      ${shotEvents.length} Total Shots
    `;

    // 5. Render Rink with Data
    rink.render().addEvents(shotEvents, {
      id: "game-shots",

      // Dynamic Symbol based on Event Type
      symbol: (d) => {
        if (d.type === "goal") return "star";
        if (d.type === "blocked-shot" || d.type === "missed-shot")
          return "cross";
        return "circle"; // shots on goal
      },

      // Size based on Event Type
      radius: (d) => (d.type === "goal" ? 8 : 5),

      // Color by Team (using secondary team colors)
      color: colorByTeam("teamAbbrev", { colorType: "secondary" }),

      // Detailed Tooltip
      tooltip: (d) => `
        <div style="font-family: sans-serif; line-height: 1.5; min-width: 150px;">
          <div style="border-bottom: 1px solid #444; padding-bottom: 4px; margin-bottom: 4px;">
            <strong>${d.playerName}</strong> <span style="color:#aaa">(${d.teamAbbrev})</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="text-transform: capitalize;">${d.type?.replace(/-/g, " ")}</span>
            <strong>P${d.period} - ${d.time}</strong>
          </div>
          <div style="color: #bbb; font-size: 0.9em; margin-top: 2px;">
            Loc: (${d.coordinates.x.toFixed(0)}, ${d.coordinates.y.toFixed(0)})
          </div>
        </div>
      `,

      // Add a stroke to make overlapping points clearer
      stroke: "#000000",
      strokeWidth: 1,
      opacity: 0.65,
    });
  } catch (error) {
    console.error("Failed to load game data:", error);
    document.getElementById("game-info")!.innerText =
      "Error loading game data.";
  }
}

renderGame();
```

## Step-by-Step Breakdown

1. **Fetching Data with `NHLDataManager`**

The `NHLDataManager.fromGameId()` method handles fetching the play-by-play data and parses it into a usable format.

```typescript
const manager = await NHLDataManager.fromGameId("2022020195");
```

2. **Data Transformation and Sorting**

We map over the events to inject derived properties (like player name and team abbreviations). We also sort the array to ensure specific events (like goals) are rendered last so they appear on top of overlapping events.

```typescript
.sort((a, b) => {
  if (a.type === "goal") return 1; // Move goals to the end (top)
  return 0;
});
```

3. **Customizing the Visualization**

We use the configuration object to style the chart. Note the use of `colorType: "secondary"` in `colorByTeam`, this is useful when both teams have similar primary colors (e.g., Washington and Edmonton both use Navy Blue, so we switch to Red vs Orange).

```typescript
color: colorByTeam("teamAbbrev", { colorType: "secondary" });
```

<script setup> 

import { onMounted } from 'vue'
import { withBase } from 'vitepress'

onMounted(async () => {

  const { Rink, NHLDataManager, colorByTeam } = await import('d3-hockey');

  const container = document.getElementById('nhl-game-demo');
  if (!container) return;

  const rink = new Rink(container);
  
  try { 
    const response = await fetch(withBase('/data/game-2022020195.json'));
    if (!response.ok) {
      throw new Error(`Failed to load local data: ${response.statusText}`);
    }
    const gameData = await response.json();
  
    const manager = NHLDataManager.fromResponse(gameData, "2022020195", { 
        flipCoordinates: true 
    });
    
    // Transform and sort data
    const shotEvents = manager.getAllEvents({ shotsOnly: true })
      .map(event => ({
        ...event,
        teamAbbrev: event.team === String(manager.homeTeam.id) 
          ? manager.homeTeam.abbrev 
          : manager.awayTeam.abbrev,
        playerName: manager.getPlayerName(event.playerId) || "Unknown Player"
    })).sort((a, b) => {
      if (a.type === "goal") return 1;
      if (b.type === "goal") return -1;
      return 0;
    });
    
    const infoEl = document.getElementById("game-info");
    if (infoEl) {
        infoEl.innerHTML = `
            <strong>${manager.awayTeam.name}</strong> vs 
            <strong>${manager.homeTeam.name}</strong><br>
            Nov 7 2022<br>
            ${shotEvents.length} Total Shot Events
        `;
    }
    
    rink.render().addEvents(shotEvents, {
      id: "game-shots",
      symbol: (d) => {
        if (d.type === "goal") return "star";
        if (d.type === "blocked-shot" || d.type === "missed-shot") return "cross";
        return "circle";
      },
      radius: (d) => d.type === "goal" ? 8 : 5,
      color: colorByTeam("teamAbbrev", { colorType: "secondary" }),
      tooltip: (d) => `
        <div style="font-family: sans-serif; line-height: 1.5; min-width: 150px;">
          <div style="border-bottom: 1px solid #444; padding-bottom: 4px; margin-bottom: 4px;">
            <strong>${d.playerName}</strong> <span style="color:#aaa">(${d.teamAbbrev})</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="text-transform: capitalize;">${d.type?.replace(/-/g, " ")}</span>
            <strong>P${d.period} - ${d.time}</strong>
          </div>
          <div style="color: #bbb; font-size: 0.9em; margin-top: 2px;">
            Loc: (${d.coordinates.x.toFixed(0)}, ${d.coordinates.y.toFixed(0)})
          </div>
        </div>
      `,
      stroke: "#000000",
      strokeWidth: 1,
      opacity: 0.65
    });
  } catch (e) { 
    console.error(e); 
    const infoEl = document.getElementById("game-info"); 
    if(infoEl) infoEl.innerText = "Could not load NHL data (CORS or API issue)."; 
  } 
}) 

</script>
