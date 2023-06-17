
type CardinalDirection = 'N' | 'S' | 'W' | 'E';
type Direction = 'up' | 'down' | 'left' | 'right' | 'upleft' | 'upright' | 'downleft' | 'downright';

interface ScreenShake {
    dx: number
    dy: number
    startTime: number
    endTime?: number
    // This can be set to help removing a specific screen shake later.
    id?: string
}
