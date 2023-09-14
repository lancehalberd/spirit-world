import { isMovementBlocked } from 'app/movement/isMovementBlocked';


export function canMoveUp(
    state: GameState,
    area: AreaInstance,
    hitbox: Rect,
    movementProperties: MovementProperties
): true | {wiggle?: 'left' | 'right', pushedObjects: (ObjectInstance | EffectInstance)[]} {
    const pushedObjects = new Set <(ObjectInstance | EffectInstance)>();

    // pixel aligned edges of the hitbox
    const T = hitbox.y | 0, L = hitbox.x | 0;
    // const B = T + hitbox.h | 0;
    const R = L + hitbox.w | 0;

    // coordinates of the bottom right anchor pixel.
    const ax = L + ((hitbox.w / 2) | 0);
    const ay = T + ((hitbox.h / 2) | 0);
    // tile coordinates of the bottom right anchor pixel.
    const atx = (ax / 16) | 0;
    const aty = (ay / 16) | 0;
    const anchorTileBehaviors = area?.behaviorGrid[aty]?.[atx];

    // Y value of the pixel we are attempting to move into.
    const y = T - 1;
    const ty = (y / 16) | 0;

    let leftBlock: number, rightBlock: number;
    let leftCheck: number = L + ((hitbox.w / 2) | 0) - 1;
    let rightCheck: number = leftCheck + 1;

    // The expected max needed is ~1.5x but we use 2x just to be safe.
    const maxLoops = 2 * (R - L);
    let i = 0;
    for (; i <= maxLoops; i++) {
        let x: number;
        let checkingLeft = true;
        if (leftBlock !== undefined && rightBlock !== undefined) {
            //console.log('Blocked', leftBlock, rightBlock);
            return { pushedObjects: [...pushedObjects] };
        }
        if (leftBlock !== undefined) {
            if (rightCheck - leftBlock > R - L) {
                //console.log('Blocked left open right', leftBlock, rightCheck);
                return { pushedObjects: [...pushedObjects], wiggle: 'right'};
            }
            x = rightCheck;
            rightCheck++;
            checkingLeft = false;
        } else if (rightBlock !== undefined) {
            if (rightBlock - leftCheck > R - L) {
                //console.log('Blocked right open left', leftCheck, rightBlock);
                return { pushedObjects: [...pushedObjects], wiggle: 'left'};
            }
            x = leftCheck;
            leftCheck--;
        } else if (leftCheck >= L) {
            // Continue checking left from the middle if we haven't hit a blocked pixel yet until we
            // scan the entire left side.
            x = leftCheck;
            leftCheck--;
        } else if (rightCheck <= R - 1) {
            // Continue checking right from the middle if we haven't hit a blocked pixel yet until we
            // scan the entire right side.
            x = rightCheck;
            rightCheck++;
            checkingLeft = false;
        } else {
            // No blocks on either side, can move directly up.
            //console.log('Open left and right', leftCheck, rightCheck);
            return true;
        }
        // This will be set true if the pixel should be "underneath" the high part of a ledge, that is,
        // the pixel is in the high side of a ledge, but the anchor is completely in the low part, meaning the character
        // is not on top of the ledge, but part of there hitbox is still in the high part.
        // Ideally this situation would not occur, but when it does, it prevents any movement that is not
        // explicitly opposite one of the ledge directions.
        let isUnder = false;
        // This will be set true if the pixel is floating over the low part of a ledge. That is, the pixel
        // is on the low side of an edge
        let isAbove = false;
        const tx = (x / 16) | 0;
        const pixelTileBehaviors = area?.behaviorGrid[ty]?.[tx];
        // The following code has many distinct end conditions that set the flags. This could be accomplished with a
        // function, but that would require a complicated return structure and might hurt performance, so we just
        // use this named code block and break out of it once we reach a determination for the flag state.
        DETERMINE_FLAGS: {
            // Anchor is in the column right of pixel and ledge is directly right of pixel.
            if (atx === tx + 1) {
                const rightOfPixelBehaviors = area?.behaviorGrid[ty]?.[tx + 1];
                if (rightOfPixelBehaviors?.ledges?.left === true || pixelTileBehaviors?.ledges?.right === false) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the column left of pixel and ledge is directly left of pixel.
            if (atx === tx - 1) {
                //console.log('Anchor in left column');
                const leftOfPixelBehaviors = area?.behaviorGrid[ty]?.[tx - 1];
                if (leftOfPixelBehaviors?.ledges?.right === true || pixelTileBehaviors?.ledges?.left === false) {
                    //console.log('Pixel is above', {leftOfPixelBehaviors, pixelTileBehaviors});
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the row below the pixel and the ledge is directly down of the pixel.
            if (aty === ty + 1) {
                const downOfPixelBehaviors = area?.behaviorGrid[ty + 1]?.[tx];
                // anchor and tile are aligned in the same column.
                if (pixelTileBehaviors?.ledges?.down === false || downOfPixelBehaviors?.ledges?.up === true) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the tile down left of the pixel.
            if (aty === ty + 1 && atx === tx - 1) {
                const rightOfAnchorBehaviors = area?.behaviorGrid[aty]?.[atx + 1];
                const upOfAnchorBehaviors = area?.behaviorGrid[aty - 1]?.[atx];
                if ((rightOfAnchorBehaviors?.ledges?.left === false || anchorTileBehaviors?.ledges?.right === true)
                    && (upOfAnchorBehaviors?.ledges?.down === false || anchorTileBehaviors?.ledges?.up === true)
                ) {
                    //console.log('Is above a top right corner.');
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the tile down right of the pixel.
            if (aty === ty + 1 && atx === tx + 1) {
                const leftOfAnchorBehaviors = area?.behaviorGrid[aty]?.[atx - 1];
                const upOfAnchorBehaviors = area?.behaviorGrid[aty - 1]?.[atx];
                if ((leftOfAnchorBehaviors?.ledges?.right === false || anchorTileBehaviors?.ledges?.left === true)
                    && (upOfAnchorBehaviors?.ledges?.down === false || anchorTileBehaviors?.ledges?.up === true)
                ) {
                    //console.log('Is above a top left corner.');
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal upright in the pixel tile.
            if (pixelTileBehaviors?.diagonalLedge === 'upright') {
                // The ledge boundary is y - x = N.
                const N = 16 * (ty - tx);
                // If the anchor is downleft of the boundary, and the pixel is upright.
                if (ay - ax > N && y - x < N) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal upright in either the tile left or down from the pixel tile.
            const leftOfPixelBehaviors = area?.behaviorGrid[ty]?.[tx - 1];
            const downOfPixelBehaviors = area?.behaviorGrid[ty + 1]?.[tx];
            if (leftOfPixelBehaviors?.diagonalLedge === 'upright' || downOfPixelBehaviors?.diagonalLedge === 'upright') {
                // The ledge boundary is y - x = N.
                const N = 16 * (ty + 1 - tx);
                // If the anchor is downleft of the boundary, and the pixel is upright.
                if (ay - ax > N && y - x < N) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal upleft in the pixel tile.
            if (pixelTileBehaviors?.diagonalLedge === 'upleft') {
                // The ledge boundary is y + x = N.
                const N = 15 + 16 * (ty + tx);
                // If the anchor is downright of the boundary, and the pixel is upleft.
                if (ay + ax > N && y + x < N) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal upright in either the tile left or down from the pixel tile.
            const rightOfPixelBehaviors = area?.behaviorGrid[ty]?.[tx + 1];
            if (rightOfPixelBehaviors?.diagonalLedge === 'upleft' || downOfPixelBehaviors?.diagonalLedge === 'upleft') {
                // The ledge boundary is y + x = N.
                const N = 15 + 16 * (ty + 1 + tx);
                // If the anchor is downright of the boundary, and the pixel is upleft.
                if (ay + ax > N && y + x < N) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }

            // These cases prevent `isUnder` from being set but do not set `isOver`.
            // Anchor is in the row below the pixel and ledge is directly above the pixel.
            if (atx === tx + 1) {
                const leftOfAnchorBehaviors = area?.behaviorGrid[aty]?.[atx - 1];
                if (leftOfAnchorBehaviors?.ledges?.right === false || anchorTileBehaviors?.ledges?.left === true) {
                    if (pixelTileBehaviors.diagonalLedge) {
                        isAbove = true;
                    }
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the row above the pixel and ledge is directly below the pixel.
            if (atx === tx - 1) {
                const rightOfAnchorBehaviors = area?.behaviorGrid[atx + 1]?.[atx];
                if (rightOfAnchorBehaviors?.ledges?.left === false || anchorTileBehaviors?.ledges?.right === true) {
                    if (pixelTileBehaviors.diagonalLedge) {
                        isAbove = true;
                    }
                    break DETERMINE_FLAGS;
                }
            }

            // Anchor is in the column right of pixel and ledge is directly right of pixel.
            if (atx === tx + 1) {
                const rightOfPixelBehaviors = area?.behaviorGrid[ty]?.[tx + 1];
                if (rightOfPixelBehaviors?.ledges?.left === false || pixelTileBehaviors?.ledges?.right === true) {
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the column left of pixel and ledge is directly left of pixel.
            if (atx === tx - 1) {
                //console.log('Anchor in left column');
                const leftOfPixelBehaviors = area?.behaviorGrid[ty]?.[tx - 1];
                if (leftOfPixelBehaviors?.ledges?.right === false || pixelTileBehaviors?.ledges?.left === true) {
                    //console.log('Pixel is below.', {leftOfPixelBehaviors, pixelTileBehaviors});
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the row below the pixel and the ledge is directly down of the pixel.
            if (aty === ty + 1) {
                const downOfPixelBehaviors = area?.behaviorGrid[ty + 1]?.[tx];
                // anchor and tile are aligned in the same column.
                if (pixelTileBehaviors?.ledges?.down === true || downOfPixelBehaviors?.ledges?.up === false) {
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the tile down left of the pixel.
            if (aty === ty + 1 && atx === tx - 1) {
                const rightOfAnchorBehaviors = area?.behaviorGrid[aty]?.[atx + 1];
                const upOfAnchorBehaviors = area?.behaviorGrid[aty - 1]?.[atx];
                if ((rightOfAnchorBehaviors?.ledges?.left === true || anchorTileBehaviors?.ledges?.right === false)
                    && (upOfAnchorBehaviors?.ledges?.down === true || anchorTileBehaviors?.ledges?.up === false)
                ) {
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the tile down right of the pixel.
            if (aty === ty + 1 && atx === tx + 1) {
                const leftOfAnchorBehaviors = area?.behaviorGrid[aty]?.[atx + 1];
                const upOfAnchorBehaviors = area?.behaviorGrid[aty - 1]?.[atx];
                if ((leftOfAnchorBehaviors?.ledges?.right === true || anchorTileBehaviors?.ledges?.left === false)
                    && (upOfAnchorBehaviors?.ledges?.down === true || anchorTileBehaviors?.ledges?.up === false)
                ) {
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal downleft in the pixel tile.
            if (pixelTileBehaviors?.diagonalLedge === 'downleft') {
                // The ledge boundary is y - x = N.
                const N = 16 * (ty - tx);
                // If the anchor is downleft of the boundary, and the pixel is upright.
                if (ay - ax > N && y - x < N) {
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal downright in the pixel tile.
            if (pixelTileBehaviors?.diagonalLedge === 'downright') {
                // The ledge boundary is y + x = N.
                const N = 15 + 16 * (ty + tx);
                // If the anchor is downright of the boundary, and the pixel is upleft.
                if (ay + ax > N && y + x < N) {
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
        }

        let blocked = false;
        const result = isMovementBlocked(state, area, pixelTileBehaviors, x, y, isAbove, isUnder, movementProperties);
        if (result) {
            blocked = true;
            if (result.object) {
                pushedObjects.add(result.object);
            }
        }
        if (blocked) {
            if (!movementProperties.canWiggle) {
                return { pushedObjects: [...pushedObjects] };
            }
            if (checkingLeft) {
                leftBlock = x;
            } else {
                rightBlock = x;
            }
        }
        //console.log(x, isAbove, isUnder);
    }
    if (i >= maxLoops) {
        console.log('canMoveUp: did not finish movement checks');
    }

    return true;
}
