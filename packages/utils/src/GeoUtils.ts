import { NumberUtils } from './NumberUtils.js';

/**
 * Utility class for geographic calculations.
 */
export class GeoUtils {
    /**
     * Calculates the distance in kilometers between two geographic coordinates using the Haversine formula.
     * @param latitude1 The latitude of the first coordinate.
     * @param longitude1 The longitude of the first coordinate.
     * @param latitude2 The latitude of the second coordinate.
     * @param longitude2 The longitude of the second coordinate.
     * @returns The distance in kilometers.
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
     * @param deg The degrees to convert.
     * @returns The radians.
     */
    public static degToRad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}