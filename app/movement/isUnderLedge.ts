
// Returns true if the given movement hitbox is considered to be in an invalid position "under a ledge"
// attempting to match the same logic that prevents moving under ledges in the general movement code.
// The basic idea is that a player is under a ledge if the majority of their anchor points are on the
// low side of the ledge, but any of there hitbox remains on the high side of the ledge.
// In practice to match movement we test this code to make sure:
// If the player can move to the position from the low side of the ledge, they aren't under (because their hitbox isn't on the other side of the ledge)
// If the player can move towards the highside of the ledge without being forced to jump off the ledge.
// If either of these is true, then the box is not considered under a ledge and the position is valid in terms of ledge intersections.
export function isUnderLedge(
    state: GameState,
    area: AreaInstance,
    hitbox: Rect
): boolean {
    const T = hitbox.y | 0, L = hitbox.x | 0;
    const B = T + (hitbox.h | 0) - 1, R = L + (hitbox.w | 0) - 1;
    const left = (hitbox.x / 16) | 0, top = (hitbox.y / 16) | 0;
    const right = ((hitbox.x + hitbox.w - 1) / 16) | 0, bottom = ((hitbox.y + hitbox.h - 1) / 16) | 0;
    // coordinates of the bottom right anchor pixel.
    const ax = L + ((hitbox.w / 2) | 0);
    const ay = T + ((hitbox.h / 2) | 0);
    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            const behaviors = area?.behaviorGrid[ty]?.[tx];
            if (!behaviors?.ledges && !behaviors?.diagonalLedge) {
                continue;
            }
            if (behaviors?.ledges?.left === true && ax <= 16 * tx) {
                return true;
            }
            if (behaviors?.ledges?.left === false && ax >= 16 * tx) {
                return true;
            }
            if (behaviors?.ledges?.right === true && ax >= 16 * (tx + 1)) {
                return true;
            }
            if (behaviors?.ledges?.right === false && ax <= 16 * (tx + 1)) {
                return true;
            }
            if (behaviors?.ledges?.up === true && ay <= 16 * ty) {
                return true;
            }
            if (behaviors?.ledges?.up === false && ay >= 16 * ty) {
                return true;
            }
            if (behaviors?.ledges?.down === true && ay >= 16 * (ty + 1)) {
                return true;
            }
            if (behaviors?.ledges?.down === false && ay <= 16 * (ty + 1)) {
                return true;
            }
            if (behaviors?.diagonalLedge === 'upleft') {
                // The ledge boundary is y + x = N.
                const N = 15 + 16 * (ty + tx);
                // We are under the ledge if the anchor is upleft but the bottom right corner of the hitbox is downright.
                if (ay + ax <= N + 1 && B + R > N) {
                    return true;
                }
            }
            if (behaviors?.diagonalLedge === 'upright') {
                // The ledge boundary is y + x = N.
                const N = 16 * (ty - tx);
                // We are under the ledge if the anchor is upright but the bottom left corner of the hitbox is downleft.
                if (ay - ax <= N && B - L > N) {
                    return true;
                }
            }
            if (behaviors?.diagonalLedge === 'downleft') {
                // The ledge boundary is y + x = N.
                const N = 16 * (ty - tx);
                // We are under the ledge if the anchor is downleft but the top right corner of the hitbox is upright.
                if (ay - ax >= N && T - R < N) {
                    return true;
                }
            }
            if (behaviors?.diagonalLedge === 'downright') {
                // The ledge boundary is y + x = N.
                const N = 15 + 16 * (ty + tx);
                // We are under the ledge if the anchor is downright but the top left corner of the hitbox is upleft.
                if (ay + ax >= N + 1 && T + L < N) {
                    return true;
                }
            }
        }
    }

    return false;
}
