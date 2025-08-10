import { isMovementBlocked } from 'app/movement/isMovementBlocked';


export function canMoveLeft(
    state: GameState,
    area: AreaInstance,
    hitbox: Rect,
    movementProperties: MovementProperties
): true | {wiggle?: 'up' | 'down', pushedObjects: (ObjectInstance | EffectInstance)[]} {
    if (!area) {
        return {pushedObjects: []};
    }
    const pushedObjects = new Set <(ObjectInstance | EffectInstance)>();

    // pixel aligned edges of the hitbox
    const T = hitbox.y | 0, L = hitbox.x | 0;
    const B = T + hitbox.h | 0;
    //const R = L + hitbox.w | 0;

    // coordinates of the bottom right anchor pixel.
    const ax = L + ((hitbox.w / 2) | 0);
    const ay = T + ((hitbox.h / 2) | 0);
    // tile coordinates of the bottom right anchor pixel.
    const atx = (ax / 16) | 0;
    const aty = (ay / 16) | 0;
    const anchorTileBehaviors = area.behaviorGrid[aty]?.[atx];

    // X value of the pixel we are attempting to move into.
    const x = L - 1;
    const tx = (x / 16) | 0;

    let minBlock: number, maxBlock: number;
    let minCheck: number = T + ((hitbox.h / 2) | 0) - 1;
    let maxCheck: number = minCheck + 1;

    // The expected max needed is ~1.5x but we use 2x just to be safe.
    const maxLoops = 2 * (B - T);
    let i = 0;
    for (; i <= maxLoops; i++) {
        let y: number;
        let checkingLeft = true;
        if (minBlock !== undefined && maxBlock !== undefined) {
            //console.log('Blocked', minBlock, maxBlock);
            return { pushedObjects: [...pushedObjects] };
        }
        if (minBlock !== undefined) {
            if (maxCheck - minBlock > B - T) {
                //console.log('Blocked left open down', minBlock, maxCheck);
                return { pushedObjects: [...pushedObjects], wiggle: 'down' };
            }
            y = maxCheck;
            maxCheck++;
            checkingLeft = false;
        } else if (maxBlock !== undefined) {
            if (maxBlock - minCheck > B - T) {
                //console.log('Blocked right open up', minCheck, maxBlock);
                return { pushedObjects: [...pushedObjects], wiggle: 'up' };
            }
            y = minCheck;
            minCheck--;
        } else if (minCheck >= T) {
            // Continue checking left from the middle if we haven't hit a blocked pixel yet until we
            // scan the entire left side.
            y = minCheck;
            minCheck--;
        } else if (maxCheck <= B - 1) {
            // Continue checking right from the middle if we haven't hit a blocked pixel yet until we
            // scan the entire right side.
            y = maxCheck;
            maxCheck++;
            checkingLeft = false;
        } else {
            // No blocks on either side, can move directly up.
            //console.log('Open left and right', minCheck, maxCheck);
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
        const ty = (y / 16) | 0;
        const tileBehaviors = area.behaviorGrid[ty]?.[tx];
        // The following code has many distinct end conditions that set the flags. This could be accomplished with a
        // function, but that would require a complicated return structure and might hurt performance, so we just
        // use this named code block and break out of it once we reach a determination for the flag state.
        DETERMINE_FLAGS: {
            // Anchor is in the row below the pixel and ledge is directly above the pixel.
            if (aty === ty + 1) {
                const downOfPixelBehaviors = area.behaviorGrid[ty + 1]?.[tx];
                if (downOfPixelBehaviors?.ledges?.up === true || tileBehaviors?.ledges?.down === false) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the row above the pixel and ledge is directly below the pixel.
            if (aty === ty - 1) {
                //console.log('Anchor in left column');
                const upOfPixelBehaviors = area.behaviorGrid[ty - 1]?.[tx];
                if (upOfPixelBehaviors?.ledges?.down === true || tileBehaviors?.ledges?.up === false) {
                    //console.log('Pixel is above', {leftOfPixelBehaviors, tileBehaviors});
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the column right of the pixel and the ledge is directly left of the pixel.
            if (atx === tx + 1) {
                const rightOfPixelBehaviors = area.behaviorGrid[ty]?.[tx + 1];
                // anchor and tile are aligned in the same column.
                if (tileBehaviors?.ledges?.right === false || rightOfPixelBehaviors?.ledges?.left === true) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the tile up right of the pixel.
            if (atx === tx + 1 && aty === ty - 1) {
                const downOfAnchorBehaviors = area.behaviorGrid[aty + 1]?.[atx];
                const leftOfAnchorBehaviors = area.behaviorGrid[aty]?.[atx - 1];
                if ((downOfAnchorBehaviors?.ledges?.up === false || anchorTileBehaviors?.ledges?.down === true)
                    && (leftOfAnchorBehaviors?.ledges?.right === false || anchorTileBehaviors?.ledges?.left === true)
                ) {
                    //console.log('Is above a bottom left corner.');
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the tile down right of the pixel.
            if (aty === ty + 1 && atx === tx + 1) {
                const leftOfAnchorBehaviors = area.behaviorGrid[aty]?.[atx - 1];
                const upOfAnchorBehaviors = area.behaviorGrid[aty - 1]?.[atx];
                if ((leftOfAnchorBehaviors?.ledges?.right === false || anchorTileBehaviors?.ledges?.left === true)
                    && (upOfAnchorBehaviors?.ledges?.down === false || anchorTileBehaviors?.ledges?.up === true)
                ) {
                    //console.log('Is above a top left corner.');
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal downleft in the pixel tile.
            if (tileBehaviors?.diagonalLedge === 'downleft') {
                // The ledge boundary is y - x = N.
                const N = 16 * (ty - tx);
                // If the anchor is upright of the boundary, and the pixel is downleft.
                if (ay - ax < N && y - x > N) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal downleft in either the tile right or up from the pixel tile.
            const upOfPixelBehaviors = area.behaviorGrid[ty - 1]?.[tx];
            const rightOfPixelBehaviors = area.behaviorGrid[ty]?.[tx + 1];
            if (upOfPixelBehaviors?.diagonalLedge === 'downleft' || rightOfPixelBehaviors?.diagonalLedge === 'downleft') {
                // The ledge boundary is y - x = N.
                const N = 16 * (ty - 1 - tx);
                // If the anchor is upright of the boundary, and the pixel is downleft.
                if (ay - ax < N && y - x > N) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal upleft in the pixel tile.
            if (tileBehaviors?.diagonalLedge === 'upleft') {
                // The ledge boundary is y + x = N.
                const N = 15 + 16 * (ty + tx);
                // If the anchor is downright of the boundary, and the pixel is upleft.
                if (ay + ax > N && y + x < N) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal upleft in either the tile right or down from the pixel tile.
            const downOfPixelBehaviors = area.behaviorGrid[ty + 1]?.[tx];
            if (rightOfPixelBehaviors?.diagonalLedge === 'upleft' || downOfPixelBehaviors?.diagonalLedge === 'upleft') {
                // The ledge boundary is y + x = N.
                const N = 15 + 16 * (ty + 1 + tx);
                // If the anchor is downright of the boundary, and the pixel is upleft.
                // Subtracting 2 here simulates using the top left anchor point instead of the bottom right anchor point.
                // This prevents the player from being considered "above" when they are moving completely adjacent
                // to a diagonal ledge.
                if (ay + ax - 2 > N && y + x < N) {
                    isAbove = true;
                    break DETERMINE_FLAGS;
                }
            }

            // These cases prevent `isUnder` from being set but do not set `isOver`.
            // Anchor is in the row below the pixel and ledge is directly above the pixel.
            if (aty === ty + 1) {
                const upOfAnchorBehaviors = area.behaviorGrid[aty - 1]?.[atx];
                if (upOfAnchorBehaviors?.ledges?.down === false || anchorTileBehaviors?.ledges?.up === true) {
                    if (tileBehaviors?.diagonalLedge) {
                        isAbove = true;
                    }
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the row above the pixel and ledge is directly below the pixel.
            if (aty === ty - 1) {
                const downOfAnchorBehaviors = area.behaviorGrid[aty + 1]?.[atx];
                if (downOfAnchorBehaviors?.ledges?.up === false || anchorTileBehaviors?.ledges?.down === true) {
                    if (tileBehaviors?.diagonalLedge) {
                        isAbove = true;
                    }
                    break DETERMINE_FLAGS;
                }
            }

            // Anchor is in the row below the pixel and ledge is directly above the pixel.
            if (aty === ty + 1) {
                const downOfPixelBehaviors = area.behaviorGrid[ty + 1]?.[tx];
                if (downOfPixelBehaviors?.ledges?.up === false || tileBehaviors?.ledges?.down === true) {
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the row above the pixel and ledge is directly below the pixel.
            if (aty === ty - 1) {
                //console.log('Anchor in left column');
                const upOfPixelBehaviors = area.behaviorGrid[ty - 1]?.[tx];
                if (upOfPixelBehaviors?.ledges?.down === false || tileBehaviors?.ledges?.up === true) {
                    //console.log('Pixel is above', {leftOfPixelBehaviors, tileBehaviors});
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the column right of the pixel and the ledge is directly left of the pixel.
            if (atx === tx + 1) {
                const rightOfPixelBehaviors = area.behaviorGrid[ty]?.[tx + 1];
                // anchor and tile are aligned in the same column.
                if (tileBehaviors?.ledges?.right === true || rightOfPixelBehaviors?.ledges?.left === false) {
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the tile up right of the pixel.
            if (atx === tx + 1 && aty === ty - 1) {
                const downOfAnchorBehaviors = area.behaviorGrid[aty + 1]?.[atx];
                const leftOfAnchorBehaviors = area.behaviorGrid[aty]?.[atx - 1];
                if ((downOfAnchorBehaviors?.ledges?.up === true || anchorTileBehaviors?.ledges?.down === false)
                    && (leftOfAnchorBehaviors?.ledges?.right === true || anchorTileBehaviors?.ledges?.left === false)
                ) {
                    //console.log('Is above a bottom left corner.');
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // Anchor is in the tile down right of the pixel.
            if (aty === ty + 1 && atx === tx + 1) {
                const leftOfAnchorBehaviors = area.behaviorGrid[aty]?.[atx - 1];
                const upOfAnchorBehaviors = area.behaviorGrid[aty - 1]?.[atx];
                if ((leftOfAnchorBehaviors?.ledges?.right === true || anchorTileBehaviors?.ledges?.left === false)
                    && (upOfAnchorBehaviors?.ledges?.down === true || anchorTileBehaviors?.ledges?.up === false)
                ) {
                    //console.log('Is above a top left corner.');
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal upright in the pixel tile.
            if (tileBehaviors?.diagonalLedge === 'upright') {
                // The ledge boundary is y - x = N.
                const N = 16 * (ty - tx);
                // If the anchor is upright of the boundary, and the pixel is downleft.
                if (ay - ax < N && y - x > N) {
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
            // There is a diagonal downleft in the pixel tile.
            if (tileBehaviors?.diagonalLedge === 'downright') {
                // The ledge boundary is y + x = N.
                const N = 15 + 16 * (ty + tx);
                // If the anchor is downright of the boundary, and the pixel is downleft.
                if (ay + ax > N && y + x < N) {
                    isUnder = true;
                    break DETERMINE_FLAGS;
                }
            }
        }

        let blocked = false;
        const result = isMovementBlocked(state, area, tileBehaviors, x, y, isAbove, isUnder, movementProperties, 'left');
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
                minBlock = y;
            } else {
                maxBlock = y;
            }
        }
        //console.log(x, isAbove, isUnder);
    }
    if (i >= maxLoops) {
        console.log('canMoveLeft: did not finish movement checks');
    }

    return true;
}
