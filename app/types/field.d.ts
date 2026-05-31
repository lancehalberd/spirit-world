
type CardinalDirection = 'up' | 'down' | 'left' | 'right';
type DiagonalDirection = 'upleft' | 'upright' | 'downleft' | 'downright';
type Direction = CardinalDirection | DiagonalDirection;

interface ScreenShake {
    dx: number
    dy: number
    startTime: number
    endTime?: number
    // This can be set to help removing a specific screen shake later.
    id?: string
}
