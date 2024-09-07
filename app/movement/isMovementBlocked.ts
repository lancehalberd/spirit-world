import { destroyTile } from 'app/utils/destroyTile';
import { tileHitAppliesToTarget } from 'app/utils/field';
import { isPixelInShortRect } from 'app/utils/index';
import { getObjectAndParts, getObjectBehaviors } from 'app/utils/objects';


export function isMovementBlocked(
    state: GameState,
    area: AreaInstance,
    behaviors: TileBehaviors,
    x: number, 
    y: number,
    isAbove: boolean,
    isUnder: boolean,
    movementProperties: MovementProperties
): false | {object?: ObjectInstance | EffectInstance} {
    for (const box of (movementProperties.blockedBoxes || [])) {
        if (isPixelInShortRect(x, y, box)) {
            return {};
        }
    }
    const actor = movementProperties.actor;
    const canMoveUnderLowCeilings = !(movementProperties.actor?.z > 3);
    const canMoveIntoEntranceTiles = movementProperties.canMoveIntoEntranceTiles;
    const canClimb = movementProperties.mustClimb || movementProperties.canClimb;
    // If we wanted to enforce movementProperties.maxHeight with a reasonable default relative to current ground height:
    // movementProperties.maxHeight = movementProperties.maxHeight ?? 6;
    // const currentHeight = actor?.groundHeight || 0;
    // (behaviors?.groundHeight - currentHeight) > movementProperties.maxHeight

    // Check for this before tiles so that objects on top of solid tiles can be pushed, such as doors.
    let walkableObject: ObjectInstance, blockingSolidObject: ObjectInstance, blockingPitObject: ObjectInstance;
    let blockingHit: HitProperties;
    for (const baseObject of area.objects) {
        for (const object of getObjectAndParts(state, baseObject)) {
            if (object.status === 'gone' || object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                continue;
            }
            if (movementProperties.excludedObjects?.has(object)) {
                continue;
            }
            const behaviors = getObjectBehaviors(state, object, x, y);
            const canClimbObject = behaviors?.climbable && canClimb;
            if (!movementProperties.canPassWalls && !canClimbObject && object.getHitbox && (behaviors?.solid || behaviors?.groundHeight > movementProperties.maxHeight)) {
                if (isPixelInShortRect(x, y, object.getHitbox())) {
                    // A player can be hit only when running into a solid object only if that object damages and it
                    // is the only solid object they are running into.
                    if (!blockingSolidObject && behaviors?.touchHit) {
                        blockingHit = behaviors?.touchHit;
                    }
                    blockingSolidObject = object;
                    blockingPitObject = null;
                    continue;
                }
            } /*else if (object.getHitbox && behaviors?.solidMap) {
                // Currently we don't support solidMap on objects. They can just apply this
                // to the tile map if necessary, otherwise, maybe we should add something like
                // getPixelBehavior(x: number, y: number): TileBehaviors to objects.
                const hitbox = object.getHitbox(state);
                let sx = (x - hitbox.x) | 0;
                let sy = (y - hitbox.y) | 0;
                if (tileBehavior.solidMap[sy] >> (15 - sx) & 1) {
                    return false;
                }
            }*/

            // Low ceiling objects block all movement if the actors z value is too high
            if (behaviors?.lowCeiling && !canMoveUnderLowCeilings) {
                if (isPixelInShortRect(x, y, object.getHitbox())) {
                    blockingHit = null;
                    return {};
                }
            }
            if (behaviors?.isEntrance && !canMoveIntoEntranceTiles) {
                if (isPixelInShortRect(x, y, object.getHitbox())) {
                    return {};
                }
            }
            if (object.getHitbox && behaviors?.pit && !movementProperties.canFall) {
                if (isPixelInShortRect(x, y, object.getHitbox())) {
                    blockingPitObject = object;
                    blockingSolidObject = null;
                    continue;
                }
            }
            // Objects defined with `isGround` can cover pits/solid tiles to allow
            // the player to walk over them, such as a stair case or ladder.
            if (object.getHitbox && (behaviors?.isGround || behaviors?.isNotSolid)
                // When movement requires climbing, objects aren't considered walkable unless they are climbable,
                // which is handled below.
                && !movementProperties.mustClimb
            ) {
                if (isPixelInShortRect(x, y, object.getHitbox())) {
                    walkableObject = object;
                    blockingPitObject = null;
                    blockingSolidObject = null;
                    blockingHit = null;
                    continue;
                }
            }
            // Climbable works similar to `isGround` but only if the movementProperties include `canClimb`.
            if (object.getHitbox && behaviors?.climbable) {
                if (isPixelInShortRect(x, y, object.getHitbox())) {
                    if (!canClimb) {
                        return {};
                    }
                    walkableObject = object;
                    blockingPitObject = null;
                    blockingSolidObject = null;
                    blockingHit = null;
                    continue;
                }
            }
            // Would need additional checks here for objects with water/lava/brittle behaviors.
        }
    }
    if (!walkableObject) {
        // Being above tiles doesn't ignore restrictions based on climbing.
        // This is because we expect climbing tiles to cross into ledge tiles frequently.
        if (!behaviors?.climbable && movementProperties.mustClimb) {
            return {};
        }
        if (behaviors?.climbable && !canClimb) {
            return {};
        }
        // Actors that cannot jump are not allowed to walk over the tips of ledges, except to climb down them if they can climb.
        if (isAbove && !movementProperties.canJump) {
            return {};
        }
        // Once a pixel is over the tip of a ledge, all collisions are ignored except for with very tall objects/tiles.
        if (isAbove && !behaviors?.isVeryTall) {
            return false;
        }
        // Prevent walking over ledges onto tiles that are marked very tall unless they are also marked as southern walls.
        if (isAbove && behaviors?.isVeryTall && !behaviors.isSouthernWall) {
            return {};
        }
        if (actor
            && (!movementProperties.canPassMediumWalls || !(behaviors?.low || behaviors?.midHeight))
            && behaviors?.solid
            && (
                behaviors?.touchHit
                && !behaviors.touchHit?.isGroundHit
                // tile touchHit always applies to
                && tileHitAppliesToTarget(state, behaviors.touchHit, movementProperties.actor)
            )
        ) {
            const mag = Math.sqrt(movementProperties.dx * movementProperties.dx + movementProperties.dy * movementProperties.dy)
            const { returnHit } = actor.onHit?.(state, { ...behaviors.touchHit, knockback: {
                vx: - 4 * movementProperties.dx / mag,
                vy: - 4 * movementProperties.dy / mag,
                vz: 2,
            }});
            // Apply reflected damage to enemies if they were the source of the `touchHit`.
            if (returnHit && behaviors.touchHit.source?.onHit) {
                behaviors.touchHit.source.onHit(state, returnHit);
            }
            if (behaviors.cuttable && behaviors.cuttable <= returnHit?.damage) {
                const tx = (x / 16) | 0, ty = (x / 16) | 0;
                for (const layer of actor.area.layers) {
                    const tile = layer.tiles[ty]?.[tx];
                    if (tile?.behaviors?.cuttable <= returnHit.damage) {
                        destroyTile(state, actor.area, { x: tx, y: ty, layerKey: layer.key });
                    }
                }
            }
            return {};
        }
    }
    // This was used to make actors not jump off of ledges when ground objects were over the ledge, but it
    // caused them to ignore ledges if they were touching ground objects at all, including ground objects
    // underneath ledges they were walking over.
    /*else if (actor) {
        // This should happen even if the actor is running into a solid object/pit that they cannot pass.
        actor.ignoreLedges = true;
    }*/
    if (blockingHit) {
        if (actor && tileHitAppliesToTarget(state, blockingHit, movementProperties.actor)) {
            const mag = Math.sqrt(movementProperties.dx * movementProperties.dx + movementProperties.dy * movementProperties.dy)
            const { returnHit } = actor.onHit?.(state, { ...blockingHit, knockback: {
                vx: - 4 * movementProperties.dx / mag,
                vy: - 4 * movementProperties.dy / mag,
                vz: 2,
            }});
            // Apply reflected damage to enemies if they were the source of the `touchHit`.
            if (returnHit && blockingHit.source?.onHit) {
                blockingHit.source.onHit(state, returnHit);
            }
            return {};
        }
    }
    if (blockingPitObject) {
        return {};
    }
    if (blockingSolidObject) {
        return { object: blockingSolidObject};
    }
    // A walkable object overrides all tile behaviors underneath it.
    if (walkableObject) {
        return false;
    }
    if (isUnder && !movementProperties.canCrossLedges) {
        return {};
    }
    if (behaviors?.groundHeight > movementProperties.maxHeight) {
        return {};
    }
    if (behaviors?.water && !(movementProperties.canSwim || movementProperties.mustSwim)) {
        return {};
    }
    if (!(behaviors?.water /*|| behaviors?.shallowWater*/) && movementProperties.mustSwim) {
        return {};
    }
    if (behaviors?.pit && !movementProperties.canFall) {
        return {};
    }
    if (behaviors?.pitMap && !movementProperties.canFall) {
        // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
        if (movementProperties.needsFullTile) {
            return {};
        }
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        if (behaviors.pitMap[y % 16] >> (15 - (x % 16)) & 1) {
            return {};
        }
    }
    if (behaviors?.lowCeiling && !canMoveUnderLowCeilings) {
        return {};
    }
    if (behaviors?.isEntrance && !canMoveIntoEntranceTiles) {
        return {};
    }
    // The second condition is a hack to prevent enemies from walking over pits.
    if ((behaviors?.pit || behaviors?.isBrittleGround) && !movementProperties.canFall) {
        return {};
    }
    // Since lava doesn't destroy enemies currently, if we allow them to move when canFall is true (such as the enemy is knocked)
    // they will get stuck in the lava, so don't do this unless they can be destroyed or enable canMoveInLava.
    //if (behaviors?.isLava && !(movementProperties.canFall || movementProperties.canMoveInLava)) {
    if (behaviors?.isLava && !movementProperties.canMoveInLava) {
        return {};
    }
    if (behaviors?.pitMap && !(movementProperties.canFall || movementProperties.canMoveInLava)) {
        // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
        if (movementProperties.needsFullTile) {
            return {};
        }
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        if (behaviors.isLavaMap[y % 16] >> (15 - (x % 16)) & 1) {
            return {};
        }
    }

    // Movement is blocked on non-climbable pixels for objects that must climb.
    if (!behaviors?.climbable && movementProperties.mustClimb) {
        return {};
    }
    // Climbing a tile allows you to ignore solid pixels on the tile.
    const canClimbTile = behaviors?.climbable && canClimb;

    // Moving over a tile when thrown allows you to ignore solid pixels on low to mid height tiles.
    const moveOverTile = movementProperties.canPassMediumWalls && (behaviors?.low || behaviors?.midHeight);
    const ignoreSolidPixels = movementProperties.canPassWalls || moveOverTile || canClimbTile;
    if (ignoreSolidPixels) {
        return false;
    }
    if (behaviors?.solid) {
        if (behaviors.pickupWeight <= movementProperties.crushingPower) {
            return false;
        }
        return {};
    }
    if (behaviors?.solidMap) {
        // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
        if (movementProperties.needsFullTile) {
            return {};
        }
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        if (behaviors.solidMap[y % 16] >> (15 - (x % 16)) & 1) {
            return {};
        }
    }
    return false;
}
