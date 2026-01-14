import * as d3 from "d3";

/**
 * Shared tooltip element for all layers
 * Uses singleton pattern to avoid creating multiple tooltips
 */
let sharedTooltip: d3.Selection<
  HTMLDivElement,
  unknown,
  HTMLElement,
  unknown
> | null = null;

/**
 * Get or create the shared tooltip element
 */
export function getSharedTooltip(): d3.Selection<
  HTMLDivElement,
  unknown,
  HTMLElement,
  unknown
> {
  const node = sharedTooltip?.node();
  if (node && document.body.contains(node)) {
    return sharedTooltip!;
  }

  if (sharedTooltip) {
    sharedTooltip.remove();
    sharedTooltip = null;
  }

  sharedTooltip = d3
    .select<HTMLElement, unknown>("body")
    .append("div")
    .attr("class", "d3-hockey-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "rgba(0, 0, 0, 0.85)")
    .style("color", "#fff")
    .style("padding", "8px 12px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)");

  return sharedTooltip;
}

/**
 * Show tooltip with content at mouse position
 */
export function showTooltip(event: MouseEvent, content: string): void {
  const tooltip = getSharedTooltip();
  tooltip
    .html(content)
    .style("visibility", "visible")
    .style("top", `${event.pageY - 10}px`)
    .style("left", `${event.pageX + 10}px`);
}

/**
 * Update tooltip position (for mousemove)
 */
export function moveTooltip(event: MouseEvent): void {
  const tooltip = getSharedTooltip();
  tooltip
    .style("top", `${event.pageY - 10}px`)
    .style("left", `${event.pageX + 10}px`);
}

/**
 * Hide the tooltip
 */
export function hideTooltip(): void {
  const tooltip = getSharedTooltip();
  tooltip.style("visibility", "hidden");
}

/**
 * Destroy the shared tooltip element
 * Call this when unmounting your visualization to clean up the DOM
 */
export function destroyTooltip(): void {
  if (sharedTooltip) {
    sharedTooltip.remove();
    sharedTooltip = null;
  }
}
