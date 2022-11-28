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

    // coordinates of the bottom right anchor pixel.
    const ax = L + ((hitbox.w / 2) | 0);
    const ay = T + ((hitbox.h / 2) | 0);
    // sub pixel of the bottom right anchor pixel.
    const asx = ax % 16;
    const asy = ay % 16;
    // tile coordinates of the bottom right anchor pixel.
    const atx = (ax / 16) | 0;
    const aty = (ay / 16) | 0;
    const anchorTileBehaviors = area?.behaviorGrid[aty]?.[atx];

    // Y value of the pixel we are attempting to move into.
    const y = T - 1;
    // sub y value of the pixel we are attempting to move into.
    const sy = y % 16;


    for (let x = L; x < R; x++) {
        const sx = x % 16;
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
        const pixelTileBehaviors = area?.behaviorGrid[ty]?.[tx];
        // The following code has many distinct end conditions that set the flags. This could be accomplished with a
        // function, but that would require a complicated return structure and might hurt performance, so we just
        // use this named code block and break out of it once we reach a determination for the flag state.
        DETERMINE_FLAGS: {
            // If a vertical tile boundary is between this pixel and the anchor, and the pixel is on the left side.
            if (x < ax && sx > asx) {
                if (pixelTileBehaviors?.ledges.right === false || anchorTileBehaviors?.ledges.left === true) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // If a vertical tile boundary is between this pixel and the anchor, and the pixel is on the right side.
            if (x > ax && sx < asx) {
                if (pixelTileBehaviors?.ledges.right === true || anchorTileBehaviors?.ledges.left === false) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // If a horizontal tile boundary is between the pixel and the anchor, and the pixel is on top.
            if (y < ay && sy > asy) {
                if (pixelTileBehaviors?.ledges.down === false || anchorTileBehaviors?.ledges.up === true) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
                // If a vertical tile boundary is between this pixel and the anchor, and the pixel is on the left side.
                if (x < ax && sx > asx) {
                    const rightOfAnchorBehaviors = area?.behaviorGrid[aty]?.[atx + 1];
                    const upOfAnchorBehaviors = area?.behaviorGrid[aty - 1]?.[atx];
                    if ((rightOfAnchorBehaviors?.ledges.right === false || anchorTileBehaviors?.ledges.left === true)
                        && (upOfAnchorBehaviors?.ledges.down === false || anchorTileBehaviors?.ledges.up === true)
                    ) {
                        isAbove = true;
                        break DETERMINE_FLAGS;
                    }
                }
                // If a vertical tile boundary is between this pixel and the anchor, and the pixel is on the right side.
                if (x > ax && sx < asx) {
                    if (pixelTileBehaviors?.ledges.right === true || anchorTileBehaviors?.ledges.left === false) {
                        isAbove = true;
                        break DETERMINE_FLAGS;
                    }
                }
            }


            // If suby is 0, we need to consider properties of the tile above, which we are attempting to move into.
            /*if (sy === 0) {
                const nextTileBehaviors = area?.behaviorGrid[ty - 1]?.[tx];
                // These two set equivalent behaviors at this edge.
                if (thisTileBehaviors?.ledges?.up === true || nextTileBehaviors?.ledges?.down === false) {
                    isHigh = isAbove = true;
                    break DETERMINE_FLAGS;
                }
                if (thisTileBehaviors?.ledges?.up === false || nextTileBehaviors?.ledges?.down === true) {
                    isLow = isUnder = true;
                    break DETERMINE_FLAGS;
                }
                if (nextTileBehaviors?.diagonalLedge === 'upleft') {

                }

            }*/
        }
    }

    return true;
}
