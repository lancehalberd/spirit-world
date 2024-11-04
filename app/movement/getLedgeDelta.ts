
// Given a start and end point, attempts to compute the delta in number of up ledges crossed to travel from start to end.
// Roughly, if this returns > 0 then start point is below the end point, < 0 start point is above the end point
// and = 0 then start point and end point are on the same line.
// This is probably inaccurate for segments that cross many tiles as it adjusts the delta for the convex set of tiles
// that complete contains the segment, many of which contain edges that the path does not necessarily cross.
// For segments that are less than 16px in either dimension, it should be fairly accurate.
// The magnitude of the result is not very useful as ledges that are functionally a single ledge split across
// multiple tiles may all be counted resulting in larger magnitudes than intuitively expected.
export function getLedgeDelta(
    state: GameState,
    area: AreaInstance,
    start: Point,
    end: Point
): number {
    const T = Math.min(start.y, end.y) | 0, L = Math.min(start.x, end.x)  | 0;
    const B = Math.max(start.y, end.y) | 0, R = Math.max(start.x, end.x) | 0;
    const left = (L / 16) | 0, top = (T / 16) | 0;
    const right = (R / 16) | 0, bottom = (B / 16) | 0;
    let delta = 0;
    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            const behaviors = area?.behaviorGrid[ty]?.[tx];
            if (!behaviors?.ledges && !behaviors?.diagonalLedge) {
                continue;
            }
            //console.log(tx, ty, behaviors.ledges, behaviors.diagonalLedge);
            if (behaviors?.ledges?.left === true && start.x < 16 * tx && end.x >= 16 * tx) {
                delta++;
                continue;
            }
            if (behaviors?.ledges?.left === true && end.x < 16 * tx && start.x >= 16 * tx) {
                delta--;
                continue;
            }
            if (behaviors?.ledges?.left === false && start.x < 16 * tx && end.x >= 16 * tx) {
                delta--;
                continue;
            }
            if (behaviors?.ledges?.left === false && end.x < 16 * tx && start.x >= 16 * tx) {
                delta++;
                continue;
            }
            if (behaviors?.ledges?.right === true && start.x >= 16 * (tx + 1) && end.x < 16 * (tx + 1)) {
                delta++;
                continue;
            }
            if (behaviors?.ledges?.right === true && end.x >= 16 * (tx + 1) && start.x < 16 * (tx + 1)) {
                delta--;
                continue;
            }
            if (behaviors?.ledges?.right === false && start.x >= 16 * (tx + 1) && end.x < 16 * (tx + 1)) {
                delta--;
                continue;
            }
            if (behaviors?.ledges?.right === false && end.x >= 16 * (tx + 1) && start.x < 16 * (tx + 1)) {
                delta++;
                continue;
            }
            if (behaviors?.ledges?.up === true && start.y < 16 * ty && end.y >= 16 * ty) {
                delta++;
                continue;
            }
            if (behaviors?.ledges?.up === true && end.y < 16 * ty && start.y >= 16 * ty) {
                delta--;
                continue;
            }
            if (behaviors?.ledges?.up === true && start.y < 16 * ty && end.y >= 16 * ty) {
                delta--;
                continue;
            }
            if (behaviors?.ledges?.up === true && end.y < 16 * ty && start.y >= 16 * ty) {
                delta++
                continue;
            }
            if (behaviors?.ledges?.down === true && start.y >= 16 * (ty + 1) && end.y < 16 * (ty + 1)) {
                delta++;
                continue;
            }
            if (behaviors?.ledges?.down === true && end.y >= 16 * (ty + 1) && start.y < 16 * (ty + 1)) {
                delta--;
                continue;
            }
            if (behaviors?.ledges?.down === false && start.y >= 16 * (ty + 1) && end.y < 16 * (ty + 1)) {
                delta--;
                continue;
            }
            if (behaviors?.ledges?.down === false && end.y >= 16 * (ty + 1) && start.y < 16 * (ty + 1)) {
                delta++;
                continue;
            }
            if (behaviors?.diagonalLedge === 'upleft') {
                // The ledge boundary is y + x = N.
                const N = 15 + 16 * (ty + tx);
                // We are under the ledge if the start is upleft but the end corner of the hitbox is downright.
                if (start.y + start.x <= N + 1 && end.y + end.x > N) {
                    delta++;
                    continue;
                }
                if (end.y + end.x <= N + 1 && start.y + start.x > N) {
                    delta--
                    continue;
                }
            }
            if (behaviors?.diagonalLedge === 'upright') {
                // The ledge boundary is y + x = N.
                const N = 16 * (ty - tx);
                // We are under the ledge if the start is upright but the end corner of the hitbox is downleft.
                if (start.y - start.x <= N && end.y - end.x > N) {
                    delta++;
                    continue;
                }
                if (end.y - end.x <= N && start.y - start.x > N) {
                    delta--
                    continue;
                }
            }
            if (behaviors?.diagonalLedge === 'downleft') {
                // The ledge boundary is y + x = N.
                const N = 16 * (ty - tx);
                // We are under the ledge if the start is downleft but the end corner of the hitbox is upright.
                if (start.y - start.x >= N && end.y - end.x < N) {
                    delta++;
                    continue;
                }
                if (end.y - end.x >= N && start.y - start.x < N) {
                    delta--;
                    continue;
                }
            }
            if (behaviors?.diagonalLedge === 'downright') {
                // The ledge boundary is y + x = N.
                const N = 15 + 16 * (ty + tx);
                // We are under the ledge if the start is downright but end corner of the hitbox is upleft.
                if (start.y + start.x >= N + 1 && end.y + end.x < N) {
                    delta++;
                    continue;
                }
                if (end.y + end.x >= N + 1 && start.y + start.x < N) {
                    delta--;
                    continue;
                }
            }
        }
    }

    return delta;
}
window['getLedgeDelta'] = getLedgeDelta;

export function updateProjectileHeight(this: void, state: GameState, area: AreaInstance, isHigh: boolean, oldAnchorPoint: Point, anchorPoint: Point): boolean {
    const ledgeDelta = getLedgeDelta(state, area, oldAnchorPoint, anchorPoint);
    // console.log(ledgeDelta, oldAnchorPoint, anchorPoint);
    if (isHigh) {
        if (ledgeDelta > 0) {
            return false;
        }
    } else {
        if (ledgeDelta < 0) {
            return true;
        }
    }
    return isHigh;
}
