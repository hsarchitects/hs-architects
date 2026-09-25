"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

/**
 * An interactive, monochrome map of the studio's location.
 *
 * Leaflet is loaded lazily inside the effect rather than imported at module
 * scope: it touches `window` on import, so pulling it in eagerly would break
 * the server render of this page.
 */

/** Studio coordinates. Change these to move the map and the marker together. */
const OFFICE: [number, number] = [18.970195454205992, 72.81473701654551];

/**
 * 13 frames roughly 9km across the square — the same extent the page had
 * before it became interactive. `detectRetina` on the tile layer then pulls
 * zoom-14 tiles and draws them at half size on a high-DPI screen, so the
 * framing stays put while the detail doubles.
 */
const DEFAULT_ZOOM = 13;
const MIN_ZOOM = 10;
const MAX_ZOOM = 18;

/**
 * Esri's dark canvas: no API key, no watermark, and label-free, which is the
 * look the design asks for. Note the {z}/{y}/{x} order — ArcGIS puts row
 * before column, the opposite of the usual XYZ convention.
 */
const TILE_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";

/**
 * Tone curve for the basemap, as control points mapping input luminance
 * (0-255) to output (0-1).
 *
 * The tiles draw water at ~35, land at ~71 and roads at ~88-111. Those three
 * need to land on black, dark grey and white respectively — which is not a
 * straight line, so CSS brightness/contrast can't express it: any linear ramp
 * steep enough to separate the roads from the land also crushes the land into
 * the water and loses the coastline. An SVG feComponentTransfer table can
 * bend wherever we like, so the water flattens to black while the land keeps
 * just enough lift to read as a distinct silhouette against it.
 */
const TONE_CURVE: readonly (readonly [number, number])[] = [
  [0, 0],
  [44, 0], // water — flat black
  [56, 0.03],
  [66, 0.075],
  [74, 0.09], // land — dark, but clearly not the sea
  [82, 0.13],
  [90, 0.5], // minor roads climb away from the land tone
  [98, 0.8],
  [106, 1], // major roads — white
  [255, 1],
];

/** Samples the curve into the equally-spaced table feComponentTransfer wants. */
function toneTableValues(steps = 64) {
  return Array.from({ length: steps }, (_, index) => {
    const input = (index / (steps - 1)) * 255;
    let i = 0;
    while (i < TONE_CURVE.length - 2 && TONE_CURVE[i + 1][0] < input) i += 1;
    const [x0, y0] = TONE_CURVE[i];
    const [x1, y1] = TONE_CURVE[i + 1];
    const t = x1 === x0 ? 0 : (input - x0) / (x1 - x0);
    // Fixed precision so the server and client emit the same string.
    return (y0 + (y1 - y0) * Math.min(1, Math.max(0, t))).toFixed(4);
  }).join(" ");
}

const TONE_FILTER_ID = "hs-map-tone";

export function OfficeMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    let wheelTarget: HTMLElement | undefined;
    let onWheel: ((event: WheelEvent) => void) | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        center: OFFICE,
        zoom: DEFAULT_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        // Wheel handling is bespoke (see below) so the page keeps its scroll;
        // dragging is off on touch for the same reason.
        scrollWheelZoom: false,
        dragging: !L.Browser.mobile,
        attributionControl: false,
      });

      L.tileLayer(TILE_URL, {
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        detectRetina: true,
      }).addTo(map);

      L.marker(OFFICE, {
        keyboard: false,
        icon: L.divIcon({
          className: "office-map__marker",
          html: '<span class="office-map__dot"></span>',
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
      }).addTo(map);

      /*
       * Plain wheel scrolling belongs to the page — a map that swallows it
       * traps the reader. A pinch gesture, though, is unambiguous, and both
       * trackpads and browser zoom report it as a wheel event with ctrlKey
       * set, so that's the one we act on. Buttons, double-click and touch
       * pinch cover every other way in.
       */
      const element = map.getContainer();
      let accumulated = 0;

      onWheel = (event: WheelEvent) => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        if (!map) return;

        // Pinches fire a stream of small deltas; step only once per notch so
        // the zoom doesn't race away.
        accumulated += event.deltaY;
        if (Math.abs(accumulated) < 24) return;

        const rect = element.getBoundingClientRect();
        const anchor = map.containerPointToLatLng([
          event.clientX - rect.left,
          event.clientY - rect.top,
        ]);
        map.setZoomAround(anchor, map.getZoom() - Math.sign(accumulated));
        accumulated = 0;
      };

      element.addEventListener("wheel", onWheel, { passive: false });
      wheelTarget = element;
    })();

    return () => {
      cancelled = true;
      if (wheelTarget && onWheel) {
        wheelTarget.removeEventListener("wheel", onWheel);
      }
      map?.remove();
    };
  }, []);

  return (
    <figure className="m-0">
      {/* sRGB interpolation matters: filters default to linearRGB, which
          would shift every one of these tones. */}
      <svg aria-hidden="true" focusable="false" className="absolute h-0 w-0">
        <filter id={TONE_FILTER_ID} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={toneTableValues()} />
            <feFuncG type="table" tableValues={toneTableValues()} />
            <feFuncB type="table" tableValues={toneTableValues()} />
          </feComponentTransfer>
        </filter>
      </svg>

      <div
        ref={containerRef}
        role="application"
        aria-label="Map of the studio's location"
        className="office-map aspect-square w-full bg-black"
      />

      <figcaption className="mt-2 text-[0.65rem] text-stone-400">
        Esri, HERE, Garmin, © OpenStreetMap contributors
      </figcaption>
    </figure>
  );
}
