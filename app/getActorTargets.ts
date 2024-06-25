import { Hero } from 'app/content/hero';
import { isPixelInShortRect } from 'app/utils/index';
import { getObjectBehaviors, getObjectAndParts } from 'app/utils/objects';
import { moveObject } from 'app/movement/moveObject';


const tileSize = 16;
export function getActorTargets(state: GameState, actor: Actor): {tiles: TileCoords[], objects: ObjectInstance[]} {
    const hitbox = actor.getHitbox();
    const cx = hitbox.x + hitbox.w / 2, cy = hitbox.y + hitbox.h / 2;
    const checkPoints: Point[] = [];
    const usedCheckPoints: Point[] = [];
    const tilePoints: Point[] = [];
    const objects: ObjectInstance[] = [];
    const tiles: TileCoords[] = [];

    if (actor.d === 'left') {
        let x = hitbox.x - 2;
        let y = hitbox.y + 3;
        checkPoints.push({x, y});
        y = hitbox.y + hitbox.h - 4;
        checkPoints.push({x, y});
        checkPoints.push({x, y: cy});
    }
    if (actor.d === 'right') {
        let x = hitbox.x + hitbox.w + 1;
        let y = hitbox.y + 3;
        checkPoints.push({x, y});
        y = hitbox.y + hitbox.h - 4;
        checkPoints.push({x, y});
        checkPoints.push({x, y: cy});
    }
    if (actor.d === 'up') {
        let x = hitbox.x + 3;
        let y = hitbox.y - 2;
        checkPoints.push({x, y});
        x = hitbox.x + hitbox.w - 4;
        checkPoints.push({x, y});
        checkPoints.push({x: cx, y});
    }
    if (actor.d === 'down') {
        let x = hitbox.x + 3;
        let y = hitbox.y + hitbox.h + 1;
        checkPoints.push({x, y});
        x = hitbox.x + hitbox.w - 4;
        checkPoints.push({x, y});
        checkPoints.push({x: cx, y});
    }

    // Only use check points that don't have a ledge between them and the actor.
    // We determine this by making a fake object with a corner at the check point and
    // see if it can move back to the player without crossing a ledge.
    // This allows us to reuse the ledge detection logic in the movement code, which
    // is complicated to extract or reproduce.
    for (const candidate of checkPoints) {
        let dx = cx - candidate.x;
        // These were tuned by hand to make sure you cannot grab across ledges.
        // I had the most problem grabbing things down and to the right.
        if (dx < 0) dx -= 4;
        else if (dx > 0) dx++
        let dy = cy - candidate.y;
        if (dy < 0) dy -= 4;
        else if (dy > 0) dy++
        const x = candidate.x - (dx ? (3 * dx / Math.abs(dx)) : 0);
        const y = candidate.y - (dy ? (3 * dy / Math.abs(dy)) : 0);
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
            render() {}
        };
        moveObject(state, object, dx, dy, {canJump: false, canWiggle: true, canFall: true, canSwim: true, canPassWalls: true});
        const mx = object.x - x, my = object.y - y;
        if (mx === dx && my === dy) {
            // console.log(candidate.x, candidate.y, {x, y}, mx, my);
            usedCheckPoints.push(candidate);
            tilePoints.push(candidate);

        }
    }

    for (const baseObject of actor.area.objects) {
        for (const object of getObjectAndParts(state, baseObject).filter(o => o.getHitbox)) {
            if (object.status === 'gone' || object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                continue;
            }
            // thrown clones are not interactive or solid.
            if (object instanceof Hero && object.action === 'thrown') {
                continue;
            }
            const hitbox = object.getHitbox();
            let added = false;
            for (const point of usedCheckPoints) {
                if (isPixelInShortRect(point.x, point.y, hitbox)) {
                    // Only add the object to the objects array once.
                    if (!added) {
                        objects.push(object);
                        added = true;
                    }
                    // Ignore any tiles underneath an object marked with isGround
                    let tileIndex = tilePoints.indexOf(point);
                    if (tileIndex >= 0 && getObjectBehaviors(state, object, point.x, point.y)?.isGround) {
                        tilePoints.splice(tileIndex, 1);
                    }
                }
            }
        }
    }
    for (const point of tilePoints) {
        tiles.push({x: (point.x / tileSize) | 0, y: (point.y / tileSize) | 0})
    }

    return { objects, tiles };
}
