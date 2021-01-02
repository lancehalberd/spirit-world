import { damageActor } from 'app/updateActor';
import { isPointInShortRect } from 'app/utils/index';

import { Actor, Direction, GameState } from 'app/types';

export function moveActor(state: GameState, actor: Actor, dx: number, dy: number) {
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
            movedX = moveActorInDirection(state, actor, sx, (sx < 0) ? 'left' : 'right', !dy);
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
            movedY = moveActorInDirection(state, actor, sy, (sy < 0) ? 'up' : 'down', !dx);
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
function moveActorInDirection(state: GameState, actor: Actor, amount: number, direction: Direction, wiggle: boolean = false) {
    let ax = actor.x, ay = actor.y;
    if (direction === 'up' || direction === 'down') {
        ay += amount;
    } else {
        ax += amount;
    }
    const palette = state.areaInstance.palette;
    const tileSize = palette.w;

    let leftColumn = Math.floor(ax / tileSize);
    let rightColumn = Math.floor((ax + actor.w - 1) / tileSize);
    let topRow = Math.floor(ay / tileSize);
    let bottomRow = Math.floor((ay + actor.h - 1) / tileSize);


    // When moving vertically, we only care about the row we are moving into.
    if (direction === 'up') bottomRow = topRow;
    else if (direction === 'down') topRow = bottomRow;
    else if (direction === 'left') rightColumn = leftColumn;
    else if (direction === 'right') leftColumn = rightColumn;

    // const tiles = state.areaInstance.layers[0].grid.tiles;
    const behaviorGrid = state.areaInstance.behaviorGrid;
    let blocked = false;
    const openCoords = [];
    for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            const behaviors = behaviorGrid?.[row]?.[column];
            // This will happen when the player moves off the edge of the screen.
            if (!behaviors) {
                openCoords.push({x: column, y: row});
                continue;
            }
            if (behaviors.solid && behaviors.damage > 0) {
                damageActor(state, actor, behaviors.damage);
            }
            if (behaviors.solid) {
                blocked = true;
            } else {
                openCoords.push({x: column, y: row});
            }
        }
    }

    const checkPoints: {x: number, y: number}[] = [];
    if (direction === 'left') {
        checkPoints.push({x: ax, y: ay + 1});
        checkPoints.push({x: ax, y: ay + actor.h - 1});
    }
    if (direction === 'right') {
        checkPoints.push({x: ax + actor.w - 1, y: ay + 1});
        checkPoints.push({x: ax + actor.w - 1, y: ay + actor.h - 1});
    }
    if (direction === 'up') {
        checkPoints.push({x: ax + 1, y: ay});
        checkPoints.push({x: ax + actor.w - 1, y: ay});
    }
    if (direction === 'down') {
        checkPoints.push({x: ax + 1, y: ay + actor.h});
        checkPoints.push({x: ax + actor.w - 1, y: ay + actor.h});
    }
    for (const solidObject of state.areaInstance.objects.filter(o => o.getHitBox && o.behaviors?.solid)) {
        const hitBox = solidObject.getHitBox(state);
        for (const point of checkPoints) {
            if (isPointInShortRect(point.x, point.y, hitBox)) {
                blocked = true;
                // TODO: wiggling is based only on being blocked by tiles, so we disable it when
                // blocked by a non-tile object.
                wiggle = false;
                break;
            }
        }
    }
    if (blocked) {
        // If this is true, wiggle the character up to Npx to get around corners.
        // This makes it much smoother to try and get into pixel perfect gaps.
        if (wiggle) {
            const wiggleAmount = 7;
            for (const coords of openCoords) {
                if (direction === 'up' || direction === 'down') {
                    if (coords.x === leftColumn && coords.x === Math.floor((ax + actor.w - 1 - wiggleAmount) / tileSize)) {
                        return moveActorInDirection(state, actor, -0.5, 'left',  false);
                    }
                    if (coords.x === rightColumn && coords.x === Math.floor((ax + wiggleAmount) / tileSize)) {
                        return moveActorInDirection(state, actor, 0.5, 'right',  false);
                    }
                }
                if (direction === 'left' || direction === 'right') {
                    if (coords.y === topRow && coords.y === Math.floor((ay + actor.h - 1 - wiggleAmount) / tileSize)) {
                        return moveActorInDirection(state, actor, -0.5, 'up',  false);
                    }
                    if (coords.y === bottomRow && coords.y === Math.floor((ay + wiggleAmount) / tileSize)) {
                        return moveActorInDirection(state, actor, 0.5, 'down',  false);
                    }
                }
            }
        }
        return false;
    }
    actor.x = ax;
    actor.y = ay;
    return true;
}
export function checkForFloorDamage(state: GameState, actor: Actor) {
    const palette = state.areaInstance.palette;
    const tileSize = palette.w;

    let leftColumn = Math.floor((actor.x + 4) / tileSize);
    let rightColumn = Math.floor((actor.x + actor.w - 5) / tileSize);
    let topRow = Math.floor((actor.y + 4) / tileSize);
    let bottomRow = Math.floor((actor.y + actor.h - 5) / tileSize);

    const behaviorGrid = state.areaInstance.behaviorGrid;
    for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            const behaviors = behaviorGrid?.[row]?.[column];
            // This will happen when the player moves off the edge of the screen.
            if (!behaviors) {
                continue;
            }
            if (behaviors.damage > 0) {
                damageActor(state, actor, behaviors.damage);
            }
        }
    }
}
