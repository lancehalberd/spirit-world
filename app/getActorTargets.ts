import { Hero } from 'app/content/hero';
import { getTileBehaviors } from 'app/utils/field';
import { isPixelInShortRect } from 'app/utils/index';
import { canMoveDown } from 'app/movement/canMoveDown';
import { moveObject } from 'app/movement/moveObject';


export function getActorTargets(state: GameState, actor: Actor): {tiles: TileCoords[], objects: ObjectInstance[]} {
    const hitbox = actor.getHitbox();
    // ax/ay are an alternate point that get checked for a ledge. We have to check
    // for ledges on both the x/y and ax/ay tiles to see if a ledge is blocking grabbing.
    const checkPoints: Point[] = [];


    const tileSize = 16;
    const objects: ObjectInstance[] = []
    const tiles: TileCoords[] = []

    // Adds check points for a given direction provided there are no ledges in the way.

    if (actor.d === 'left') {
        let x = hitbox.x - 2;
        let y = hitbox.y + 3;
        checkPoints.push({x, y});
        y = hitbox.y + hitbox.h - 4;
        checkPoints.push({x, y});
    }
    if (actor.d === 'right') {
        let x = hitbox.x + hitbox.w + 1;
        let y = hitbox.y + 3;
        checkPoints.push({x, y});
        y = hitbox.y + hitbox.h - 4;
        checkPoints.push({x, y});
    }
    if (actor.d === 'up') {
        let x = hitbox.x + 3;
        let y = hitbox.y - 2;
        checkPoints.push({x, y});
        x = hitbox.x + hitbox.w - 4;
        checkPoints.push({x, y});
    }
    if (actor.d === 'down') {
        let x = hitbox.x + 3;
        let y = hitbox.y + hitbox.h + 1;
        checkPoints.push({x, y});
        x = hitbox.x + hitbox.w - 4;
        checkPoints.push({x, y});
    }

    const usedCheckPoints: Point[] = [];
    let cx = hitbox.x + hitbox.w / 2, cy = hitbox.y + hitbox.h / 2;
    for (const candidate of checkPoints) {
        let dx = cx - candidate.x;
        // These were tuned by hand to make sure you cannot grab across ledges.
        // I had the most problem grabbing things down and to the right.
        if (dx < 0) dx -= 4;
        else dx++
        let dy = cy - candidate.y;
        if (dy < 0) dy -= 4;
        else dy++
        const x = candidate.x - 3 * dx / Math.abs(dx);
        const y = candidate.y - 3 * dy / Math.abs(dy);
        const object: ObjectInstance = {
            isObject: true,
            area: actor.area,
            x,
            y,
            status: 'normal',
            // This needs to be at least 6x6 to not pass through diagonal ledges based on current movement logic.
            getHitbox() {
                return {x: this.x | 0, y: this.y | 0, w: 6, h: 6};
            },
            render() {

            }
        };
        moveObject(state, object, dx, dy, {canJump: false, canWiggle: true, canFall: true, canSwim: true, canPassWalls: true});
        const mx = object.x - x, my = object.y - y;
        if (mx === dx && my === dy) {
            // console.log(candidate.x, candidate.y, {x, y}, mx, my);
            usedCheckPoints.push(candidate);
            tiles.push({x: (candidate.x / tileSize) | 0, y: (candidate.y / tileSize) | 0})
        }
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
        for (const point of usedCheckPoints) {

            if (isPixelInShortRect(point.x, point.y, hitbox)) {
                objects.push(object);
            }
        }
    }

    return { objects, tiles };
}

export function getActorTargetsOld(state: GameState, actor: Actor): {tiles: TileCoords[], objects: ObjectInstance[]} {
    const hitbox = actor.getHitbox();
    // ax/ay are an alternate point that get checked for a ledge. We have to check
    // for ledges on both the x/y and ax/ay tiles to see if a ledge is blocking grabbing.
    const checkPoints: Point[] = [];

    if (actor.d === 'down') {
        const y = hitbox.y + hitbox.h + 1;
        for (const x of [hitbox.x + 3, hitbox.x + hitbox.w - 4]) {
            if (canMoveDown(
                state,
                actor.area,
                {x, y: y - 1, w: 1, h: hitbox.h},
                {canJump: true}
            )) {
                 checkPoints.push({x, y});
            }
        }
    }


    const tileSize = 16;
    const objects: ObjectInstance[] = []
    const tiles: TileCoords[] = []

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
    /*if (actor.d === 'down') {
        let x = hitbox.x + 3;
        let y = hitbox.y + hitbox.h + 1;
        addCheckPoint('down', {x, y, ax: x, ay: y - 8});
        x = hitbox.x + hitbox.w - 4;
        addCheckPoint('down', {x, y, ax: x, ay: y - 8});
    }*/

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
