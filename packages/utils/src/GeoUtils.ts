import { NumberUtils } from './NumberUtils.js';

/**
 * Utility class for geographic calculations.
 */
export class GeoUtils {
    /**
     * Calculates the distance in kilometers between two geographic coordinates using the Haversine formula.
     * The result is rounded to 4 decimal places for precision.
     * @param latitude1 The latitude of the first coordinate in degrees (-90 to 90).
     * @param longitude1 The longitude of the first coordinate in degrees (-180 to 180).
     * @param latitude2 The latitude of the second coordinate in degrees (-90 to 90).
     * @param longitude2 The longitude of the second coordinate in degrees (-180 to 180).
     * @returns The great-circle distance between the two points in kilometers, rounded to 4 decimal places.
     * @example
     * // Distance between New York and London
     * GeoUtils.calculateKmBetweenCoordinates(40.7128, -74.0060, 51.5074, -0.1278) // returns ~5570.2224 km
     * 
     * // Distance between same point
     * GeoUtils.calculateKmBetweenCoordinates(0, 0, 0, 0) // returns 0
     */
    public static calculateKmBetweenCoordinates(latitude1: number, longitude1: number, latitude2: number, longitude2: number): number {
        const R = 6371; // Radius of the Earth in kilometers
        const dLatitude = GeoUtils.degToRad(latitude2 - latitude1);
        const dLongitude = GeoUtils.degToRad(longitude2 - longitude1);
        const a = 
            Math.sin(dLatitude / 2) * Math.sin(dLatitude / 2) +
            Math.cos(GeoUtils.degToRad(latitude1)) * Math.cos(GeoUtils.degToRad(latitude2)) * 
            Math.sin(dLongitude / 2) * Math.sin(dLongitude / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return NumberUtils.round(R * c, 4);
    }

    /**
     * Converts degrees to radians.
     * @param deg The angle in degrees to convert.
     * @returns The angle in radians.
     * @example
     * GeoUtils.degToRad(0) // returns 0
     * GeoUtils.degToRad(180) // returns Math.PI (approximately 3.14159)
     * GeoUtils.degToRad(90) // returns Math.PI / 2 (approximately 1.5708)
     */
    public static degToRad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}