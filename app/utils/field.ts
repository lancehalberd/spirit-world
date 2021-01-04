import { Direction } from 'app/types';

export const directionMap = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
};

export function getDirection(dx: number, dy: number): Direction {
    console.log(dx, dy)
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx < 0 ? 'left' : 'right';
    }
    return dy < 0 ? 'up' : 'down';
}
