import { Hero } from 'app/content/hero';
import { getTileBehaviors } from 'app/utils/field';
import { isPixelInShortRect } from 'app/utils/index';

export function getActorTargets(state: GameState, actor: Actor): {tiles: TileCoords[], objects: ObjectInstance[]} {
    const tileSize = 16;
    const objects: ObjectInstance[] = []
    const tiles: TileCoords[] = []
    const hitbox = actor.getHitbox();

    // ax/ay are an alternate point that get checked for a ledge. We have to check
    // for ledges on both the x/y and ax/ay tiles to see if a ledge is blocking grabbing.
    const checkPoints: {x: number, y: number, ax: number, ay: number}[] = [];
    // Adds check points for a given direction provided there are no ledges in the way.
    function addCheckPoint(d: Direction, point: {x: number, y: number, ax: number, ay: number}) {
        let behaviors = getTileBehaviors(state, actor.area, {x: point.x, y: point.y}).tileBehavior;
        // Cannot have opposite ledge of the tile we are facing into.
        if (d === 'left' && behaviors?.ledges?.right !== undefined) {
            return;
        }
        if (d === 'right' && behaviors?.ledges?.left !== undefined) {
            return;
        }
        if (d === 'up' && behaviors?.ledges?.down !== undefined) {
            return;
        }
        if (d === 'down' && behaviors?.ledges?.up !== undefined) {
            return;
        }
        behaviors = getTileBehaviors(state, actor.area, {x: point.ax, y: point.ay}).tileBehavior;
        // Cannot have the same ledge of the tile we are facing out of.
        if (d === 'left' && behaviors?.ledges?.left !== undefined) {
            return;
        }
        if (d === 'right' && behaviors?.ledges?.right !== undefined) {
            return;
        }
        if (d === 'up' && behaviors?.ledges?.up !== undefined) {
            return;
        }
        if (d === 'down' && behaviors?.ledges?.down !== undefined) {
            return;
        }
        checkPoints.push(point);
    }
    if (actor.d === 'left') {
        let x = hitbox.x - 2;
        let y = hitbox.y + 3;
        addCheckPoint('left', {x, y, ax: x + 8, ay: y});
        y = hitbox.y + hitbox.h - 4;
        addCheckPoint('left', {x, y, ax: x + 8, ay: y});
    }
    if (actor.d === 'right') {
        let x = hitbox.x + hitbox.w + 1;
        let y = hitbox.y + 3;
        addCheckPoint('right', {x, y, ax: x - 8, ay: y});
        y = hitbox.y + hitbox.h - 4;
        addCheckPoint('right', {x, y, ax: x - 8, ay: y});
    }
    if (actor.d === 'up') {
        let x = hitbox.x + 3;
        let y = hitbox.y - 2;
        addCheckPoint('up', {x, y, ax: x, ay: y + 8});
        x = hitbox.x + hitbox.w - 4;
        addCheckPoint('up', {x, y, ax: x, ay: y + 8});
    }
    if (actor.d === 'down') {
        let x = hitbox.x + 3;
        let y = hitbox.y + hitbox.h + 1;
        addCheckPoint('down', {x, y, ax: x, ay: y - 8});
        x = hitbox.x + hitbox.w - 4;
        addCheckPoint('down', {x, y, ax: x, ay: y - 8});
    }

    for (const object of actor.area.objects.filter(o => o.getHitbox)) {
        if (object.status === 'gone' || object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
            continue;
        }
        // thrown clones are not interactive or solid.
        if (object instanceof Hero && object.action === 'thrown') {
            continue;
        }
        const hitbox = object.getHitbox(state);
        for (const point of checkPoints) {

            if (isPixelInShortRect(point.x, point.y, hitbox)) {
                objects.push(object);
            }
        }
    }

    if (actor.d === 'left' || actor.d === 'right') {
        const column = Math.floor((actor.d === 'left' ? (actor.x - 2) : (actor.x + actor.w + 2)) / tileSize);
        const top = Math.floor(actor.y / tileSize);
        const bottom = Math.floor((actor.y + actor.h - 1) / tileSize);
        // TODO: Repeat this 3 more times below
        if ((actor.d === 'left'
             && actor.area.behaviorGrid[top]?.[column]?.ledges?.right === undefined
             && actor.area.behaviorGrid[top]?.[column + 1]?.ledges?.left === undefined)
            || (actor.d === 'right'
             && actor.area.behaviorGrid[top]?.[column]?.ledges?.left === undefined
             && actor.area.behaviorGrid[top]?.[column - 1]?.ledges?.right === undefined)
        ) {
            if (top === bottom
                || (actor.d === 'left'
                     && actor.area.behaviorGrid[top]?.[column + 1]?.ledges?.down !== false
                     && actor.area.behaviorGrid[bottom]?.[column + 1]?.ledges?.up !== true
                     )
                || (actor.d === 'right'
                     && actor.area.behaviorGrid[top]?.[column - 1]?.ledges?.down !== false
                     && actor.area.behaviorGrid[bottom]?.[column - 1]?.ledges?.up !== true
                     )
            ) {
                tiles.push({x: column, y: top});
            }
        }
        if (top !== bottom) {
            if ((actor.d === 'left'
                 && actor.area.behaviorGrid[bottom]?.[column]?.ledges?.right === undefined
                 && actor.area.behaviorGrid[bottom]?.[column + 1]?.ledges?.left === undefined
                 && actor.area.behaviorGrid[top]?.[column + 1]?.ledges?.down !== true
                 && actor.area.behaviorGrid[bottom]?.[column + 1]?.ledges?.up !== false
                 )
                || (actor.d === 'right'
                 && actor.area.behaviorGrid[bottom]?.[column]?.ledges?.left === undefined
                 && actor.area.behaviorGrid[bottom]?.[column - 1]?.ledges?.right === undefined
                 && actor.area.behaviorGrid[top]?.[column - 1]?.ledges?.down !== true
                 && actor.area.behaviorGrid[bottom]?.[column - 1]?.ledges?.up !== false
                 )
            ) {
                tiles.push({x: column, y: bottom});
            }
        }
    } else if (actor.d === 'up' || actor.d === 'down') {
        const row = Math.floor((actor.d === 'up' ? (actor.y - 2) : (actor.y + actor.h + 2)) / tileSize);
        const left = Math.floor((actor.x) / tileSize);
        const right = Math.floor((actor.x + actor.w - 1) / tileSize);
        if ((actor.d === 'up'
             && actor.area.behaviorGrid[row]?.[left]?.ledges?.down === undefined
             && actor.area.behaviorGrid[row + 1]?.[left]?.ledges?.up === undefined)
            || (actor.d === 'down'
             && actor.area.behaviorGrid[row]?.[left]?.ledges?.up === undefined
             && actor.area.behaviorGrid[row - 1]?.[left]?.ledges?.down === undefined)
        ) {
            if (left === right
                || (actor.d === 'up'
                     && actor.area.behaviorGrid[row + 1]?.[left]?.ledges?.right !== false
                     && actor.area.behaviorGrid[row +1]?.[right]?.ledges?.left !== true
                     )
                || (actor.d === 'down'
                     && actor.area.behaviorGrid[row -1]?.[left]?.ledges?.right !== false
                     && actor.area.behaviorGrid[row -1]?.[right]?.ledges?.left !== true
                     )
            ) {
                tiles.push({x: left, y: row});
            }
        }
        if (left !== right) {
            if ((actor.d === 'up'
                 && actor.area.behaviorGrid[row]?.[right]?.ledges?.down === undefined
                 && actor.area.behaviorGrid[row + 1]?.[right]?.ledges?.up === undefined
                 && actor.area.behaviorGrid[row + 1]?.[left]?.ledges?.right !== true
                 && actor.area.behaviorGrid[row + 1]?.[right]?.ledges?.left !== false
                 )
                || (actor.d === 'down'
                 && actor.area.behaviorGrid[row]?.[right]?.ledges?.up === undefined
                 && actor.area.behaviorGrid[row - 1]?.[right]?.ledges?.down === undefined
                 && actor.area.behaviorGrid[row - 1]?.[left]?.ledges?.right !== true
                 && actor.area.behaviorGrid[row - 1]?.[right]?.ledges?.left !== false
                 )
            ) {
                tiles.push({x: right, y: row});
            }
        }
    }

    return { objects, tiles };
}
