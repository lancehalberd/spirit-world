import { getObjectBehaviors } from 'app/content/objects';
import { isPixelInShortRect } from 'app/utils/index';

import { AreaInstance, EffectInstance, GameState, MovementProperties, ObjectInstance, TileBehaviors } from 'app/types';

export function isMovementBlocked(
    state: GameState,
    area: AreaInstance,
    behaviors: TileBehaviors,
    x: number, 
    y: number,
    isAbove: boolean,
    movementProperties: MovementProperties
): false | {object?: ObjectInstance | EffectInstance} {
    if (isAbove && !behaviors?.isVeryTall) {
        return false;
    }
    if (isAbove) {
        console.log('very tall?', behaviors);
    }
    const canClimbTile = behaviors?.climbable && movementProperties.canClimb;
    if (behaviors?.solid && !canClimbTile) {
        return {};
    }
    if (behaviors?.solidMap && !canClimbTile) {
        // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
        if (movementProperties.needsFullTile) {
            return {};
        }
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        if (behaviors.solidMap[y % 16] >> (15 - (x % 16)) & 1) {
            return {};
        }
    }
    if (behaviors?.water && !movementProperties.canSwim) {
        return {};
    }
    if (behaviors?.pit && !movementProperties.canFall) {
        return {};
    }

    for (const object of area.objects) {
        if (object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
            continue;
        }
        if (movementProperties.excludedObjects?.has(object)) {
            continue;
        }
        const behaviors = getObjectBehaviors(state, object);
        if (object.getHitbox && behaviors?.solid) {
            if (isPixelInShortRect(x, y, object.getHitbox(state))) {
                return { object };
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
    }
}
