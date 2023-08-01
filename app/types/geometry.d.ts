
type Point = [number, number];
type Coords = [number, number];

interface FullRectangle {
    left: number
    top: number
    width: number
    height: number
    right?: number
    bottom?: number
}

interface Rect {
    x: number
    y: number
    w: number
    h: number
    z?: number
    zd?: number
}
