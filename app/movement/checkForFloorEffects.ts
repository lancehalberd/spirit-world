import { destroyTile } from 'app/utils/destroyTile';
import { directionMap } from 'app/utils/direction';
import { boxesIntersect } from 'app/utils/index';


export function checkForFloorEffects(state: GameState, hero: Hero) {
    if (!hero.area) {
        return;
    }
    hero.groundHeight = 0;
    const hitbox = hero.getFloorHitbox();
    for (const baseObject of [...hero.area.objects, ...hero.area.effects]) {
        for (const entity of [baseObject, ...(baseObject.getParts?.(state) || [])]) {
            if (!entity.getHitbox){
                continue;
            }
            const behaviors = entity.getBehaviors?.(state) || entity.behaviors;
            if (!(behaviors?.groundHeight > hero.groundHeight)) {
                continue;
            }
            // The padding here needs to match any used for other interactions with this object,
            // in particular, movingPlatform padding should match this.
            if (boxesIntersect(entity.getHitbox(state), hitbox)) {
                hero.groundHeight = behaviors?.groundHeight;
            }
        }
    }
    hero.z = Math.max(hero.z, hero.groundHeight);
    const tileSize = 16;

    // This was using the exact four corners of the player earlier, but this made it easy for the player to walk
    /*const leftColumn = Math.floor(hero.x / tileSize);
    const rightColumn = Math.floor((hero.x + hero.w - 1) / tileSize);
    const topRow = Math.floor(hero.y / tileSize);
    const bottomRow = Math.floor((hero.y + hero.h - 1) / tileSize);*/
    /*const leftColumn = Math.floor((hero.x + 2) / tileSize);
    const rightColumn = Math.floor((hero.x + hero.w - 3) / tileSize);
    const topRow = Math.floor((hero.y + 2) / tileSize);
    const bottomRow = Math.floor((hero.y + hero.h - 3) / tileSize);*/
    const leftColumn = Math.floor(hitbox.x / tileSize);
    const rightColumn = Math.floor((hitbox.x + hitbox.w - 1) / tileSize);
    const topRow = Math.floor(hitbox.y / tileSize);
    const bottomRow = Math.floor((hitbox.y + hitbox.h - 1) / tileSize);


    const behaviorGrid = hero.area.behaviorGrid;
    // We don't want a player to be able to walk in between pits without falling, so the character is forced to fall
    // any time all four corners are over pits.
    hero.wading = hero.z <= 0;
    hero.swimming = hero.action !== 'roll' && hero.action !== 'preparingSomersault' && hero.z <= 0;
    const bootsAreSlippery = hero.savedData.equippedBoots === 'cloudBoots';
    // Here is assumed to be slipping until we determine a reason that they are not.
    hero.slipping = true;
    if (hero.isAstralProjection
        || (hero.isInvisible && hero.savedData.equippedBoots !== 'cloudBoots')
        || hero.savedData.equippedBoots === 'ironBoots'
        || (hero.savedData.equippedBoots === 'leatherBoots' && hero.savedData.equipment.leatherBoots > 1)
    ) {
        hero.slipping = false;
    }
    let fallingTopLeft = false, fallingTopRight = false, fallingBottomLeft = false, fallingBottomRight = false;
    let startClimbing = false;
    // Apply floor effects from objects/effects.
    for (const baseObject of [...hero.area.objects, ...hero.area.effects]) {
        for (const entity of [baseObject, ...(baseObject.getParts?.(state) || [])]) {
            if (!entity.getHitbox){
                continue;
            }
            const behaviors = entity.getBehaviors?.(state) || entity.behaviors;
            if (!behaviors) {
                continue;
            }
            if ((behaviors.groundHeight || 0) >= hero.z) {
                if (!behaviors.slippery && !bootsAreSlippery && boxesIntersect(entity.getHitbox(state), hitbox)) {
                    hero.slipping = false;
                }
            }
            if (behaviors.climbable && boxesIntersect(entity.getHitbox(state), hitbox)) {
                startClimbing = true;
            }
        }
    }
    hero.canFloat = true;
    hero.isOverClouds = false;
    const {w, h} = state.zone.areaSize ?? {w: 32, h: 32};
    for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            let behaviors = behaviorGrid[row]?.[column];
            let actualRow = row;
            let actualColumn = column;
            // During screen transitions, the row/column will be out of bounds for the current screen,
            // so we need to wrap them and work against the next screen.
            if (row < 0 || row >= h || column < 0 || column >= w) {
                if (!state.nextAreaInstance) {
                    continue;
                }
                actualRow = (row + h) % h;
                actualColumn = (column + w) % w;
                behaviors = state.nextAreaInstance.behaviorGrid[actualRow]?.[actualColumn];
            }
            // Default behavior is open solid ground.
            if (!behaviors) {
                if (!bootsAreSlippery) {
                    hero.slipping = false;
                }
                hero.swimming = false;
                hero.wading = false;
                continue;
            }
            if (behaviors.groundHeight > hero.groundHeight) {
                hero.groundHeight = behaviors.groundHeight;
            }
            if (behaviors?.isBrittleGround && hero.z <= 0 && hero.action !== 'roll') {
                for (const layer of hero.area.layers) {
                    const tile = layer.tiles[actualRow]?.[actualColumn];
                    if (tile?.behaviors?.isBrittleGround) {
                        destroyTile(state, hero.area, {x: actualColumn, y: actualRow, layerKey: layer.key});
                    }
                }
            }
            if (behaviors.climbable) {
                // Originally this code just sart `startClimbing = true` with no checks, but there is an ugly edge case where you
                // could start climbing down while off of the tile enough that you wouldn't wiggle to line up with the ladder.
                // This change will cause you to just jump down the ledge rather than start climbing if your alignment with the
                // climbable tile is too far to fix by wiggling

                // Don't start climbing when the climbable tile is too far to the left or right of the character.
                if (column * 16 - hero.x <= 8 && hero.x - column * 16 <= 8) {
                    startClimbing = true;
                }
            }
            if (behaviors.touchHit && hero.onHit) {
                if (!behaviors.touchHit.isGroundHit || hero.z <= 0) {
                    const { returnHit } = hero.onHit(state, behaviors.touchHit);

                    if (behaviors.cuttable && behaviors.cuttable <= returnHit?.damage) {
                        for (const layer of hero.area.layers) {
                            const tile = layer.tiles[actualRow]?.[actualColumn];
                            if (tile?.behaviors?.cuttable <= returnHit.damage) {
                                destroyTile(state, hero.area, { x: actualColumn, y: actualRow, layerKey: layer.key });
                            }
                        }
                    }
                }
            }
            if (!behaviors.water || behaviors.solid) {
                hero.swimming = false;
            }
            // Don't slip if on any non-slippery ground unless wearing cloud boots.
            if (!bootsAreSlippery && !behaviors.slippery
                && !behaviors.pit  && !behaviors.water  && !behaviors.shallowWater && !behaviors.solid
            ) {
                hero.slipping = false;
            }
            // Clouds boots are not slippery when walking on clouds.
            if (behaviors.cloudGround && hero.savedData.equippedBoots === 'cloudBoots') {
                hero.slipping = false;
            }
            if (behaviors.cloudGround) {
                hero.isOverClouds = true;
            }
            if (!behaviors.shallowWater && !behaviors.water) {
                hero.wading = false;
            }
            // Cloud boots allow you to stand on, but not float over liquids.
            if (behaviors.isLava || behaviors.cloudGround || behaviors.water || behaviors.shallowWater) {
                hero.canFloat = false;
            }
            if (behaviors.isLava && hero.z <= 0) {
                const lavaProof = hero.savedData.equippedBoots === 'ironBoots' && hero.savedData.equipment.ironBoots >= 2;
                if (!lavaProof) {
                    hero.onHit(state, { damage: 4, element: 'fire' });
                }
            }
            // Lava is like a pit for the sake of cloud walking boots sinking over them, but it damages
            // like normal damaging ground rather than a pit. This was done because there were many instances
            // it was difficult to reset the player's position when transition screens over lava.
            if (behaviors.pit || (behaviors.cloudGround && hero.savedData.equippedBoots !== 'cloudBoots')) {
                const tileIsUp = row < bottomRow;
                const tileIsDown = row > topRow;
                const tileIsLeft = column < rightColumn;
                const tileIsRight = column > leftColumn;
                if (tileIsUp) {
                    if (tileIsLeft) {
                        fallingTopLeft = true;
                    } else if (tileIsRight) {
                        fallingTopRight = true;
                    } else {
                        fallingTopLeft = fallingTopRight = true;
                    }
                } else if (tileIsDown) {
                    if (tileIsLeft) {
                        fallingBottomLeft = true;
                    } else if (tileIsRight) {
                        fallingBottomRight = true;
                    } else {
                        fallingBottomLeft = fallingBottomRight = true;
                    }
                } else {
                    if (tileIsLeft) {
                        fallingTopLeft = fallingBottomLeft = true;
                    } else if (tileIsRight) {
                        fallingTopRight = fallingBottomRight = true;
                    } else {
                        fallingTopLeft = fallingTopRight = fallingBottomLeft = fallingBottomRight = true;
                    }
                }
            }
        }
    }
    // Being invisible allows you to walk on water unless you are wearing iron boots.
    if (hero.swimming && (hero.savedData.equippedBoots === 'cloudBoots' || (hero.isInvisible && hero.savedData.equippedBoots === 'leatherBoots'))) {
        hero.swimming = false;
        hero.wading = true;
    }
    if (startClimbing) {
        hero.action = 'climbing';
    } else if (!startClimbing && hero.action === 'climbing') {
        hero.action = null;
    }
    hero.isTouchingPit = fallingTopLeft || fallingTopRight || fallingBottomLeft || fallingBottomRight;
    hero.isOverPit = fallingTopLeft && fallingTopRight && fallingBottomLeft && fallingBottomRight;
    if (hero.isOverPit) {
        const canFly = hero.savedData.equippedBoots === 'cloudBoots' && hero.savedData.equipment.cloudBoots >= 2;
        if (!canFly) {
            hero.canFloat = false;
        }
    }
    if (hero.isOverPit && !state.nextAreaSection && !state.nextAreaInstance) {
        if (hero.z <= 0 && hero.action !== 'roll') {
            let behaviors = behaviorGrid[Math.round(hero.y / tileSize)]?.[Math.round(hero.x / tileSize)];
            //if (behaviors?.cloudGround && hero.savedData.equippedBoots === 'cloudBoots') {
            if (hero.isOverClouds && hero.savedData.equippedBoots === 'cloudBoots') {
                // Do nothing.
            } else {
                hero.throwHeldObject(state);
                // Unfreeze on falling into a pit.
                hero.frozenDuration = 0;
                hero.heldChakram?.throw(state);
                hero.action = 'falling';
                //hero.isOverClouds = !!behaviors?.cloudGround && !behaviors.diagonalLedge;
                hero.x = Math.round(hero.x / tileSize) * tileSize;
                hero.y = Math.round(hero.y / tileSize) * tileSize;
                if (behaviors?.cloudGround) {
                    hero.y -= 4;
                    // This will play the cloud poof animation over the hero as they fall.
                    hero.isOverClouds = true;
                    if (behaviors?.diagonalLedge) {
                        hero.x -= directionMap[behaviors?.diagonalLedge][0] * 12;
                        hero.y -= directionMap[behaviors?.diagonalLedge][1] * 12;
                    }
                    if (behaviors?.ledges?.up) {
                        hero.y += 8;
                    }
                    if (behaviors?.ledges?.down) {
                        hero.y -= 8;
                    }
                    if (behaviors?.ledges?.left) {
                        hero.x += 8;
                    }
                    if (behaviors?.ledges?.right) {
                        hero.x -= 8;
                    }
                } else {
                    hero.isOverClouds = false;
                }
                hero.animationTime = 0;
            }
        }
    }
    // Cannot be slipping while swimming/wading/climbing.
    if (hero.swimming || (hero.wading && !bootsAreSlippery) || hero.action === 'climbing') {
        hero.slipping = false;
    }
    // This code used to make players slip into pits they were standing near, but it has some
    // technical issues with slipping through ledges, and it is kind of annoying anyway, so it
    // is just disabled now. If we want to add it back either:
    // reduce the threshold for this behavior so that it cannot apply across ledges (because you would)
    // have to go over the ledge to trigger it)
    // or actually check if there is a ledge between the pit and the anchor and ignore it if so (this is a bit hard).
    // Either way, this should actually run the movement logic so this can't drag a player through walls/ledges.
    /* else if (hero.z <= 0 && hero.action !== 'roll') {
        if (fallingTopLeft && fallingTopRight) {
            hero.y -= 0.1;
        }
        if (fallingTopLeft && fallingBottomLeft) {
            hero.x -= 0.1;
        }
        if (fallingBottomRight && fallingBottomLeft) {
            hero.y += 0.1;
        }
        if (fallingBottomRight && fallingTopRight) {
            hero.x += 0.1;
        }
    }*/
}
