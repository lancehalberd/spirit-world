import _ from 'lodash';

import { damageActor } from 'app/updateActor';
import { getSolidObstaclesOrPits, isPointOpen } from 'app/utils/field';

import { Actor, Direction, GameState, Hero } from 'app/types';

export function moveActor(state: GameState, actor: Actor, dx: number, dy: number, push: boolean = false) {
    let sx = dx;
    if (sx < -1 || sx > 1) {
        sx /= Math.abs(sx);
    }
    let sy = dy;
    if (sy < -1 || sy > 1) {
        sy /= Math.abs(sy);
    }
    let mx = 0, my = 0;
    let s = 0;
    while (s < 100) {
        let movedX = false, movedY = false;
        if (sx) {
            movedX = moveActorInDirection(state, actor, sx, (sx < 0) ? 'left' : 'right', !dy, push);
            if (movedX) {
                mx += sx;
                if (sx > -1 && sx < 1) {
                    sx = 0;
                } else {
                    const delta = Math.abs(dx - mx);
                    if (delta < 1) {
                        sx *= delta;
                    }
                }
            }
        }
        if (sy) {
            movedY = moveActorInDirection(state, actor, sy, (sy < 0) ? 'up' : 'down', !dx, push);
            if (movedY) {
                my += sy;
                if (sy > -1 && sy < 1) {
                    sy = 0;
                } else {
                    const delta = Math.abs(dy - my);
                    if (delta < 1) {
                        sy *= delta;
                    }
                }
            }
        }
        if (!movedX && !movedY) {
            return mx !== 0 || my !== 0;
        }
    }
    if (s >= 100) {
        console.error('infinite loop');
    }
    return true;
}
function moveActorInDirection(
    state: GameState,
    actor: Actor,
    amount: number,
    direction: Direction,
    wiggle: boolean = false,
    push: boolean = false,
) {
    let ax = actor.x, ay = actor.y;
    if (direction === 'up' || direction === 'down') {
        ay += amount;
    } else {
        ax += amount;
    }

    let checkPoints: {x: number, y: number}[];
    // When moving vertically, we only care about the row we are moving into.
    if (direction === 'up') {
        checkPoints = [{x: ax, y: ay}, {x: ax + 7, y: ay}];
        if (actor.w > 8) {
            checkPoints = [...checkPoints, {x: ax + 8, y: ay}, {x: ax + 15, y: ay}];
        }
    } else if (direction === 'down') {
        checkPoints = [{x: ax, y: ay + actor.h - 1}, {x: ax + 7, y: ay + actor.h - 1}];
        if (actor.w > 8) {
            checkPoints = [...checkPoints, {x: ax + 8, y: ay + actor.h - 1}, {x: ax + 15, y: ay + actor.h - 1}];
        }
    } else if (direction === 'left') {
        checkPoints = [{x: ax, y: ay}, {x: ax, y: ay + 7}];
        if (actor.h > 8) {
            checkPoints = [...checkPoints, {x: ax, y: ay + 8}, {x: ax, y: ay + 15}];
        }
    } else if (direction === 'right') {
        checkPoints = [{x: ax + actor.w - 1, y: ay}, {x: ax + actor.w - 1, y: ay + 7}];
        if (actor.h > 8) {
            checkPoints = [...checkPoints, {x: ax + actor.w - 1, y: ay + 8}, {x: ax + actor.w - 1, y: ay + 15}];
        }
    }

    // const tiles = state.areaInstance.layers[0].grid.tiles;
    const behaviorGrid = state.areaInstance.behaviorGrid;
    let blockedByTile = false;
    let blockedByObject = false;
    let pushedObjects = [];
    for (const point of checkPoints) {
        const {tiles, objects} = getSolidObstaclesOrPits(state, point);
        for (const tile of tiles) {
            const behaviors = behaviorGrid?.[tile.y]?.[tile.x];
            if (!behaviors) {
                continue;
            }
            if (behaviors.solid && behaviors.damage > 0) {
                damageActor(state, actor, behaviors.damage);
            }
            // The second condition is a hack to prevent enemies from walking over pits.
            if (behaviors.solid || (behaviors.pit && !push)) {
                blockedByTile = true;
            }
        }
        for (const object of objects) {
            blockedByObject = true;
            if (push) {
                pushedObjects.push(object);
            }
        }
    }
    pushedObjects = _.uniq(pushedObjects);

    if (!blockedByTile && pushedObjects.length === 1) {
        if (pushedObjects[0].onPush) {
            pushedObjects[0].onPush(state, direction);
        }
    } else if (pushedObjects.length >= 1) {
        for (const object of pushedObjects) {
            const hitbox = object.getHitbox(state);
            if (Math.abs(ax - hitbox.x) < 8
                || Math.abs(ax + actor.w - hitbox.x - hitbox.w) < 8
                || Math.abs(ay - hitbox.y) < 8
                || Math.abs(ay + actor.h - hitbox.y - hitbox.h) < 8
            ) {
                if (object.onPush) {
                    object.onPush(state, direction);
                }
            }
        }
    }
    if (blockedByTile || blockedByObject) {
        // If this is true, wiggle the character up to Npx to get around corners.
        // This makes it much smoother to try and get into pixel perfect gaps.
        if (!wiggle) {
            return false;
        }
        function wiggleLeft(y: number) {
            for (let l = ax - 1; l >= ax - 8; l--) {
                let open = true;
                for (let x = l; x < l + actor.w; x += 8) {
                    if (!isPointOpen(state, {x, y})) {
                        open = false;
                        break;
                    }
                }
                if (open) {
                    return moveActorInDirection(state, actor, -0.5, 'left',  false);
                }
            }
        }
        function wiggleRight(y: number) {
            for (let l = ax + 1; l <= ax + 8; l++) {
                let open = true;
                for (let x = l; x < l + actor.w; x += 8) {
                    if (!isPointOpen(state, {x, y})) {
                        open = false;
                        break;
                    }
                }
                if (open) {
                    return moveActorInDirection(state, actor, 0.5, 'right',  false);
                }
            }
        }
        function wiggleUp(x: number) {
            for (let t = ay - 1; t >= ay - 8; t--) {
                let open = true;
                for (let y = t; y < t + actor.h; y += 8) {
                    if (!isPointOpen(state, {x, y})) {
                        open = false;
                        break;
                    }
                }
                if (open) {
                    return moveActorInDirection(state, actor, -0.5, 'up',  false);
                }
            }
        }
        function wiggleDown(x: number) {
            for (let t = ay + 1; t <= ay + 8; t++) {
                let open = true;
                for (let y = t; y < t + actor.h; y += 8) {
                    if (!isPointOpen(state, {x, y})) {
                        open = false;
                        break;
                    }
                }
                if (open) {
                    return moveActorInDirection(state, actor, 0.5, 'down',  false);
                }
            }
        }
        if (direction === 'up') {
            if (wiggleLeft(ay)) {
                return true;
            }
            if (wiggleRight(ay)) {
                return true;
            }
        } else if (direction === 'down') {
            if (wiggleLeft(ay + actor.h - 1)) {
                return true;
            }
            if (wiggleRight(ay + actor.h - 1)) {
                return true;
            }
        } else if (direction === 'left') {
            if (wiggleUp(ax)) {
                return true;
            }
            if (wiggleDown(ax)) {
                return true;
            }
        } else if (direction === 'right') {
            if (wiggleUp(ax + actor.w - 1)) {
                return true;
            }
            if (wiggleDown(ax + actor.w - 1)) {
                return true;
            }
        }
        return false;
    }
    actor.x = ax;
    actor.y = ay;
    return true;
}
export function checkForFloorDamage(state: GameState, hero: Hero) {
    const palette = state.areaInstance.palette;
    const tileSize = palette.w;

    let leftColumn = Math.floor((hero.x + 4) / tileSize);
    let rightColumn = Math.floor((hero.x + hero.w - 5) / tileSize);
    let topRow = Math.floor((hero.y + 4) / tileSize);
    let bottomRow = Math.floor((hero.y + hero.h - 5) / tileSize);

    const behaviorGrid = state.areaInstance.behaviorGrid;
    let fallingLeft = false, fallingRight = false, fallingUp = false, fallingDown = false;
    for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            const behaviors = behaviorGrid?.[row]?.[column];
            // This will happen when the player moves off the edge of the screen.
            if (!behaviors) {
                continue;
            }
            if (behaviors.damage > 0) {
                damageActor(state, hero, behaviors.damage);
            }
            if (behaviors.pit && hero.action !== 'roll') {
                if (hero.x - column * 16 > 4) {
                    fallingLeft = true;
                    hero.x -= 0.1;
                } else if (hero.x - column * 16 < -4) {
                    fallingRight = true;
                    hero.x += 0.1;
                } else {
                    fallingLeft = fallingRight = true;
                }
                if (hero.y - row * 16 > 4) {
                    fallingUp = true;
                    hero.y -= 0.1;
                } else if (hero.y - row * 16 < -4) {
                    fallingDown = true;
                    hero.y += 0.1;
                } else {
                    fallingUp = fallingDown = true;
                }
            }
        }
    }
    if (fallingUp && fallingDown && fallingLeft && fallingRight) {
        const wasClone = !!state.hero.clones.length;
        damageActor(state, hero, 1, null, true);
        if (!wasClone) {
            state.hero.x = state.hero.safeX;
            state.hero.y = state.hero.safeY;
        }
    }
}
