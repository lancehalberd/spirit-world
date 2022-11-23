import { uniq } from 'lodash';

import { destroyTile, getAreaSize } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import {
    directionMap,
    getTileBehaviorsAndObstacles,
    isPointOpen,
    tileHitAppliesToTarget,
} from 'app/utils/field';
import { boxesIntersect } from 'app/utils/index';

import { AreaInstance, GameState, MovementProperties, Rect } from 'app/types';

export function canMoveUp(
    state: GameState,
    area: AreaInstance,
    hitbox: Rect,
    movementProperties: MovementProperties
): boolean {
    const {
        canPush = false,
        canFall = false,
        canSwim = false,
        canClimb = false,
        canJump = false,
        canWiggle = true,
        canPassMediumWalls = false,
    } = movementProperties;

    // pixel aligned edges of the hitbox
    const T = hitbox.y | 0, L = hitbox.x | 0;
    const B = T + hitbox.h, R = L + hitbox.w;

    // pixel columns for the anchor points
    const AR = L + ((hitbox.w / 2) | 0)
    const AL = AR - 1;
    // pixel rows for the anchor points
    const AB = T + ((hitbox.h / 2) | 0)
    const AT = AB - 1;

    const y = T; // We only check the top row of pixels when moving up.
    const sy = y % 16;


    for (let x = L; x < R; x++) {
        // This will be set true if there is a ledge and this pixel is currently on the low side.
        let isLow = false;
        // This will be set true if there is a ledge and this pixel is onthe high side.
        let isHigh = false;
        // This will be set true if the pixel should be "underneath" the high part of a ledge, that is,
        // the pixel is in the high side of a ledge, but the anchor is completely in the low part, meaning the character
        // is not on top of the ledge, but part of there hitbox is still in the high part.
        // Ideally this situation would not occur, but when it does, it prevents any movement that is not
        // explicitly opposite one of the ledge directions.
        let isUnder = false;
        // This will be set true if the pixel is floating over the low part of a ledge. That is, the pixel
        // is on the low side of an edge
        let isAbove = false;
        const ty = (y / 16) | 0;
        const tx = (x / 16) | 0;
        const thisTileBehaviors = area?.behaviorGrid[ty]?.[tx];
        // If suby is 0, we need to consider properties of the tile above, which we are attempting to move into.
        if (sy === 0) {
            const nextTileBehaviors = area?.behaviorGrid[ty - 1]?.[tx];
            if ()

        }
    }

    return true;
}
