
const anchors = [
    {dx: 0, dy: 0, vx: -1, vy: -1},
    {dx: 1, dy: 0, vx: 1, vy: -1},
    {dx: 0, dy: 1, vx: -1, vy: 1},
    {dx: 1, dy: 1, vx: 1, vy: 1},
]

export function getJumpVector(
    state: GameState,
    area: AreaInstance,
    hitbox: Rect,): number[] {
    const sum = [0, 0];

    // pixel aligned edges of the hitbox
    const T = hitbox.y | 0, L = hitbox.x | 0;

    // coordinates of the top left anchor point
    const ax = L + ((hitbox.w / 2) | 0) - 1;
    const ay = T + ((hitbox.h / 2) | 0) - 1;

    for (const anchor of anchors) {
        const x = ax + anchor.dx, y = ay + anchor.dy;
        const tx = (x / 16) | 0, ty = (y / 16) | 0;
        const sx = x % 16, sy = y % 16;
        const behaviors = area?.behaviorGrid[ty]?.[tx];
        let isLow = false;
        DETERMINE_FLAGS: {
            if (sy === 0 && y === ay + 1) {
                const upBehaviors = area?.behaviorGrid[ty - 1]?.[tx];
                if (upBehaviors?.ledges?.down === true || behaviors?.ledges?.up === false) {
                    isLow = true;
                    break DETERMINE_FLAGS;
                }
            }
            if (sy === 15 && y === ay) {
                const downBehaviors = area?.behaviorGrid[ty + 1]?.[tx];
                if (downBehaviors?.ledges?.up === true || behaviors?.ledges?.down === false) {
                    isLow = true;
                    break DETERMINE_FLAGS;
                }
            }
            if (sx === 0 && x === ax + 1) {
                const leftBehaviors = area?.behaviorGrid[ty]?.[tx - 1];
                if (leftBehaviors?.ledges?.right === true || behaviors?.ledges?.left === false) {
                    isLow = true;
                    break DETERMINE_FLAGS;
                }
            }
            if (sx === 15 && x === ax) {
                const rightBehaviors = area?.behaviorGrid[ty]?.[tx + 1];
                if (rightBehaviors?.ledges?.left === true || behaviors?.ledges?.right === false) {
                    isLow = true;
                    break DETERMINE_FLAGS;
                }
            }
            // For diagonals we only have to check if they are exactly on the mid line
            if ((x === ax && y === ay && behaviors?.diagonalLedge === 'upleft')
                || (x === ax + 1 && y === ay + 1 && behaviors?.diagonalLedge === 'downright')
            ) {
                if (sx + sy === 15) {
                    isLow = true;
                    break DETERMINE_FLAGS;
                }
            }
            if ((x === ax && y === ay + 1 && behaviors?.diagonalLedge === 'downleft')
                || (x === ax + 1 && y === ay && behaviors?.diagonalLedge === 'upright')
            ) {
                if (sx === sy) {
                    isLow = true;
                    break DETERMINE_FLAGS;
                }
            }
        }
        if (isLow) {
            sum[0] += anchor.vx;
            sum[1] += anchor.vy;
        }
    }


    const mag = Math.sqrt(sum[0] * sum[0] + sum[1] * sum[1]);
    if (mag) {
        // console.log(sum);
        return [sum[0] / mag, sum[1] / mag];
    }
    return sum;
}
