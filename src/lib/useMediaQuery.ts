import { useState, useEffect } from "react";
import { MEDIA_QUERIES } from "./constants";

/**
 * Custom hook that returns true if the media query matches.
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // SSR safe: default to false on server
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event handler
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (modern API)
    mediaQuery.addEventListener("change", handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}

/**
 * Preset breakpoint hooks for convenience
 * These use the standardized MEDIA_QUERIES from constants
 */
export function useIsMobile() {
  return useMediaQuery(MEDIA_QUERIES.MOBILE);
}

export function useIsTablet() {
  return useMediaQuery(MEDIA_QUERIES.TABLET);
}

export function useIsDesktop() {
  return useMediaQuery(MEDIA_QUERIES.DESKTOP);
}

export function useIsLargeDesktop() {
  return useMediaQuery(MEDIA_QUERIES.LARGE);
}
