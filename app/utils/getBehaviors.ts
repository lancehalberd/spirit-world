import { isPixelInShortRect } from 'app/utils/index';
import { getFieldInstanceAndParts, getObjectBehaviors } from 'app/utils/objects';

export function getCompositeBehaviors(
    state: GameState,
    area: AreaInstance,
    {x, y}: Point,
    nextArea: AreaInstance = null,
    ingoreObject: ObjectInstance | EffectInstance = null
): TileBehaviors {
    let tileBehavior: TileBehaviors = {}
    const allObjects = [
        ...area.objects,
        ...area.effects,
        ...(nextArea?.objects || []),
        ...(nextArea?.effects || []),
    ]
    tileBehavior.groundHeight = 0;
    let lastSolidBehavior: TileBehaviors, lastClimbableBehavior: TileBehaviors;
    for (const baseObject of allObjects) {
        for (const entity of getFieldInstanceAndParts(state, baseObject)) {
            if (entity === ingoreObject) {
                continue;
            }
            const behaviors = getObjectBehaviors(state, entity, x, y);
            if (!behaviors) {
                continue;
            }
            // Currently we evaluate behaviors in the default object order, but we should instead
            // evaluate them in the order they are drawn so the objects that appear on top visually
            // override the objects underneath.
            const groundHeight = behaviors.groundHeight || 0;
            // For non-solid objects, only the behaviors with the highest ground matter.
            if (groundHeight > tileBehavior.groundHeight) {
                tileBehavior = behaviors;
            } else if (groundHeight >= tileBehavior.groundHeight) {
                // TODO: Rather than combine these, we should probably only apply the behavior
                // from the object that is drawn on top (which the player would see at this pixel).
                tileBehavior = {
                    ...tileBehavior,
                    ...behaviors
                };
                if (behaviors.isGround || behaviors.isNotSolid) {
                    tileBehavior.solid = false;
                    // isGround overrides any previous solid behavior.
                    lastSolidBehavior = null;
                }
            }
            if (behaviors.climbable) {
                lastClimbableBehavior = behaviors;
            }
            if (behaviors.solid) {
                lastSolidBehavior = behaviors;
            }
        }
    }
    if (lastClimbableBehavior) {
        return lastClimbableBehavior;
    }
    if (lastSolidBehavior) {
        return lastSolidBehavior;
    }

    // Ignore tile behaviors behind objects that are marked as isGround or have positive groundHeight.
    if (tileBehavior.groundHeight > 0 || tileBehavior.isGround) {
        return tileBehavior;
    }
    delete tileBehavior.groundHeight;
    return {
        ...getTileBehaviors(state, area, {x, y}, nextArea).tileBehavior,
        ...tileBehavior,
    };
}

export function getTileBehaviors(
    state: GameState,
    area: AreaInstance,
    {x, y}: Point,
    nextArea: AreaInstance = null,
): {tileBehavior: TileBehaviors, tx: number, ty: number} {
    let tx = Math.floor(x / 16);
    let ty = Math.floor(y / 16);
    let definedBehavior = area?.behaviorGrid[ty]?.[tx];
    if (!definedBehavior && nextArea) {
        tx = Math.floor((x - nextArea.cameraOffset.x) / 16);
        ty = Math.floor((y - nextArea.cameraOffset.y) / 16);
        definedBehavior = nextArea?.behaviorGrid[ty]?.[tx];
    }
    const tileBehavior = {...(definedBehavior || {})};
    if (!state.areaSection || tx < state.areaSection.x || tx >= state.areaSection.x + state.areaSection.w
        || ty < state.areaSection.y || ty >= state.areaSection.y + state.areaSection.h) {
        // Tiles are not considered out of bounds during screen transitions.
        tileBehavior.outOfBounds = !nextArea && !state.nextAreaSection;
    }
    // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
    if (!tileBehavior.solid && tileBehavior.solidMap) {
        const sy = (y | 0) % 16;
        const sx = (x | 0) % 16;
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        tileBehavior.solid = !!(tileBehavior.solidMap[sy] >> (15 - sx) & 1);
    }
    if (!tileBehavior.isLava && tileBehavior.isLavaMap) {
        const sy = (y | 0) % 16;
        const sx = (x | 0) % 16;
        // console.log(tileBehavior.isLavaMap, y, x, sy, sx, tileBehavior.isLavaMap[sy] >> (15 - sx));
        tileBehavior.isLava = !!(tileBehavior.isLavaMap[sy] >> (15 - sx) & 1);
    }
    if (!tileBehavior.pit && tileBehavior.pitMap) {
        const sy = (y | 0) % 16;
        const sx = (x | 0) % 16;
        // console.log(tileBehavior.pitMap, y, x, sy, sx, tileBehavior.pitMap[sy] >> (15 - sx));
        tileBehavior.pit = !!(tileBehavior.pitMap[sy] >> (15 - sx) & 1);
    }
    return { tileBehavior, tx, ty };
}



export function getTileBehaviorsAndObstacles(
    state: GameState,
    area: AreaInstance,
    {x, y}: Tile,
    excludedObjects: Set<any> = null,
    nextArea: AreaInstance = null,
    objectTest: (object: EffectInstance | ObjectInstance) => boolean = null,
    direction?: Direction,
): {tileBehavior: TileBehaviors, tx: number, ty: number, objects: ObjectInstance[]} {
    const objects: ObjectInstance[] = [];
    let tx = (x / 16) | 0;
    let ty = (y / 16) | 0;
    let definedBehavior = area?.behaviorGrid[ty]?.[tx];
    if (!definedBehavior && nextArea) {
        tx = ((x - nextArea.cameraOffset.x) / 16) | 0;
        ty = ((y - nextArea.cameraOffset.y) / 16) | 0;
        definedBehavior = nextArea?.behaviorGrid[ty]?.[tx];
    }
    const tileBehavior = {...(definedBehavior || {})};
    if (!state.areaSection || tx < state.areaSection.x || tx >= state.areaSection.x + state.areaSection.w
        || ty < state.areaSection.y || ty >= state.areaSection.y + state.areaSection.h) {
        tileBehavior.outOfBounds = true;
    }
    const sy = (y | 0) % 16;
    const sx = (x | 0) % 16;
    // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
    if (!tileBehavior.solid && tileBehavior.solidMap) {
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        tileBehavior.solid = !!(tileBehavior.solidMap[sy] >> (15 - sx) & 1);
    }
    for (const object of area.objects) {
        if (object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch'
            || object.status === 'gone'
        ) {
            continue;
        }
        if (excludedObjects?.has(object)) {
            continue;
        }
        const behaviors = getObjectBehaviors(state, object);
        if (object.getHitbox && (object.onPush || behaviors?.solid || behaviors?.pit || objectTest)) {
            const hitbox = object.getHitbox(state);
            if (isPixelInShortRect(x | 0, y | 0,
                { x: hitbox.x | 0, y: hitbox.y | 0, w: hitbox.w | 0, h: hitbox.h | 0 }
            )) {
                // If objectTest is defined, only include objects that match it.
                if (objectTest) {
                    if (objectTest(object)) {
                        objects.push(object);
                    }
                    continue;
                }
                objects.push(object);
                if (behaviors?.pit) {
                    tileBehavior.pit = true;
                }
                if (behaviors?.solid) {
                    if (!tileBehavior.solid) {
                        // Set solid height behaviors if this is thirst solid object.
                        if (behaviors.low) {
                            tileBehavior.low = true;
                        } else if (behaviors.midHeight) {
                            tileBehavior.midHeight = true;
                        }
                        tileBehavior.solid = true;
                    } else {
                        // Increase the height of solid tiles as necessary.
                        if (tileBehavior.low && !behaviors.low) {
                            tileBehavior.low = false;
                            tileBehavior.midHeight = true;
                        }
                        if (tileBehavior.midHeight && !behaviors.midHeight) {
                            tileBehavior.midHeight = false;
                        }
                    }
                }
                if (behaviors?.touchHit) {
                    // Don't apply touchHit from enemies during iframes when they shouldn't damage the hero.
                    if (!(object.isEnemyTarget) || !((object as Enemy).invulnerableFrames > 0)) {
                        tileBehavior.touchHit = {...behaviors.touchHit};
                        if (object.isEnemyTarget) {
                            tileBehavior.touchHit.source = (object as Enemy);
                        }
                    }
                }
            }
        }
    }
    if (state.hero.area === area && !excludedObjects?.has(state.hero)) {
        if (isPixelInShortRect(x | 0, y | 0,
            { x: state.hero.x | 0, y: state.hero.y | 0, w: state.hero.w | 0, h: state.hero.h | 0 }
        )) {
            if (!objectTest || objectTest(state.hero)) {
                objects.push(state.hero);
            }
            tileBehavior.solid = true;
        }
    }
    // Edge behaviors only apply to specific lines in the tiles.
    if (tileBehavior.ledges) {
        // Copy this so we don't edit the source behavior.
        tileBehavior.ledges = {...tileBehavior.ledges};
        if (tileBehavior.ledges?.up && sy !== 0) {
            delete tileBehavior.ledges.up;
        }
        if (tileBehavior.ledges?.down && sy !== 15) {
            delete tileBehavior.ledges.down;
        }
        if (tileBehavior.ledges?.left && sx !== 0) {
            delete tileBehavior.ledges.left;
        }
        if (tileBehavior.ledges?.right && sx !== 15) {
            delete tileBehavior.ledges.right;
        }
    }
    // If the actor is at the edge of a tile moving into the next tile,
    // Check if the tile they are currently moving out of has an edge in the direction of the movement.
    if (sy === 15 && direction === 'up') {
        if (area?.behaviorGrid[ty + 1]?.[tx]?.ledges?.up) {
            tileBehavior.ledges = tileBehavior.ledges || {};
            tileBehavior.ledges.up = true;
        }
    }
    if (sy === 0 && direction === 'down') {
        if (area?.behaviorGrid[ty - 1]?.[tx]?.ledges?.down) {
            tileBehavior.ledges = tileBehavior.ledges || {};
            tileBehavior.ledges.down = true;
        }
    }
    if (sx === 15 && direction === 'left') {
        if (area?.behaviorGrid[ty]?.[tx + 1]?.ledges?.left) {
            tileBehavior.ledges = tileBehavior.ledges || {};
            tileBehavior.ledges.left = true;
        }
    }
    if (sx === 0 && direction === 'right') {
        if (area?.behaviorGrid[ty]?.[tx - 1]?.ledges?.right) {
            tileBehavior.ledges = tileBehavior.ledges || {};
            tileBehavior.ledges.right = true;
        }
    }
    return { tileBehavior, tx, ty, objects };
}
