
const root2over2 = Math.sqrt(2) / 2;

export const directionMap = {
    upleft: [-root2over2, -root2over2],
    up: [0, -1],
    upright: [root2over2, -root2over2],
    downleft: [-root2over2, root2over2],
    down: [0, 1],
    downright: [root2over2, root2over2],
    left: [-1, 0],
    right: [1, 0],
};

export const directionToRadiansMap = {
    upleft: -3 * Math.PI / 4,
    up: -Math.PI / 2,
    upright: -Math.PI / 4,
    downleft: 3 * Math.PI / 4,
    down: Math.PI / 2,
    downright: Math.PI / 4,
    left: Math.PI,
    right: 0,
};

export const directionToLeftRotationsFromRight = {
    right: 0,
    upright: 1,
    up: 2,
    upleft: 3,
    left: 4,
    downleft: 5,
    down: 6,
    downright: 7,
}
export const leftRotationsFromRightToDirection = Object.keys(directionToLeftRotationsFromRight) as Direction[];

// leftRotations is in 90 degree rotations to the left and can accept half rotations for 45 degrees.
export function rotateDirection(d: Direction, leftRotations: number): Direction {
    leftRotations = Math.round(leftRotations * 2);
    // Calculates a new rotation in the range of 0-7.
    const newRotation = ((directionToLeftRotationsFromRight[d] + leftRotations) % 8 + 8) % 8;
    return leftRotationsFromRightToDirection[newRotation];
}

// leftRotations is in 90 degree rotations to the left and can accept half rotations for 45 degrees.
export function rotateCardinalDirection(d: CardinalDirection, leftRotations: number): CardinalDirection {
    leftRotations = Math.round(leftRotations * 2);
    // Calculates a new rotation in the range of 0-7.
    const newRotation = ((directionToLeftRotationsFromRight[d] + leftRotations) % 8 + 8) % 8;
    return leftRotationsFromRightToDirection[newRotation] as CardinalDirection;
}


// 15, 4, 4,
// This is a map of offsets used to animate an object being picked up by the player, and is designed for use with a
// 16x16 tile.
// Originally values before adding new carrying animations, consistent y offset at end of animations.
/*export const carryMap = {
    'right': [{x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 9, y: -13}, {x: 7, y: -16}, {x: 0, y: -17}],
    'left': [{x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -9, y: -13}, {x: -7, y: -16}, {x: 0, y: -17}],
    'down': [{x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: -4}, {x: 0, y: -9}, {x: 0, y: -17}],
    'up': [{x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -16}, {x: 0, y: -17}, {x: 0, y: -17}],
};*/
// New values to match new carrying animations, final y offset is a bit different depending on direction.
export const carryMap = {
    'right': [{x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 9, y: -13}, {x: 7, y: -16}, {x: 0, y: -17}],
    'left': [{x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -9, y: -13}, {x: -7, y: -16}, {x: 0, y: -17}],
    //'right': [{x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 9, y: -12}, {x: 7, y: -15}, {x: 0, y: -16}],
    //'left': [{x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -9, y: -12}, {x: -7, y: -15}, {x: 0, y: -16}],
    'down': [{x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: -4}, {x: 0, y: -9}, {x: 0, y: -17}],
    //'down': [{x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: -3}, {x: 0, y: -7}, {x: 0, y: -13}],
    'up': [{x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -16}, {x: 0, y: -17}, {x: 0, y: -17}],
};

export function getCardinalDirection(dx: number, dy: number, defaultDirection: CardinalDirection = null): CardinalDirection {
    if (Math.abs(dy) < 0.2) {
        dy = 0;
    }
    if (Math.abs(dx) < 0.2) {
        dx = 0;
    }
    if (defaultDirection && !dy && !dx) {
        return defaultDirection;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx < 0 ? 'left' : 'right';
    }
    return dy < 0 ? 'up' : 'down';
}

export function getDirection(dx: number, dy: number, includeDiagonals = false, defaultDirection: Direction = null): Direction {
    if (Math.abs(dy) < 0.2) {
        dy = 0;
    }
    if (Math.abs(dx) < 0.2) {
        dx = 0;
    }
    if (defaultDirection && !dy && !dx) {
        return defaultDirection;
    }
    if (includeDiagonals) {
        const r = Math.abs(dx) / (Math.abs(dy) + .000001);
        if (r >= 2) {
            return dx < 0 ? 'left' : 'right';
        }
        if (r <= 1 / 2) {
            return dy < 0 ? 'up' : 'down';
        }
        if (dy < 0) {
            return dx < 0 ? 'upleft' : 'upright';
        }
        return dx < 0 ? 'downleft' : 'downright';
    }
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx < 0 ? 'left' : 'right';
    }
    return dy < 0 ? 'up' : 'down';
}
