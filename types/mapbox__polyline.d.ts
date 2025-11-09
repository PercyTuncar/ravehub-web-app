/**
 * Type definitions for @mapbox/polyline
 * https://github.com/mapbox/polyline
 */

declare module '@mapbox/polyline' {
  interface Polyline {
    /**
     * Decode a polyline string into an array of coordinates
     * @param encoded - The encoded polyline string
     * @param precision - The precision factor (default: 5)
     * @returns Array of coordinate pairs [latitude, longitude]
     */
    decode(encoded: string, precision?: number): Array<[number, number]>;

    /**
     * Encode an array of coordinates into a polyline string
     * @param coordinates - Array of coordinate pairs [latitude, longitude]
     * @param precision - The precision factor (default: 5)
     * @returns Encoded polyline string
     */
    encode(coordinates: Array<[number, number]>, precision?: number): string;
  }

  const polyline: Polyline;
  export default polyline;
}

