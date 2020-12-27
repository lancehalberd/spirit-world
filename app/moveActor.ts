import { Actor, Direction, GameState } from 'app/types';

export function moveActor(state: GameState, actor: Actor, dx: number, dy: number) {
    const sx = dx < 0 ? -1 : 1;
    const sy = dy < 0 ? -1 : 1;
    let mx = 0, my = 0;
    let s = 0;
    while (s < 100) {
        let movedX = false, movedY = false;
        if (mx !== dx) {
            movedX = moveActorInDirection(state, actor, sx, (sx < 0) ? 'left' : 'right');
            if (movedX) {
                mx += sx;
            }
        }
        if (my !== dy) {
            movedY = moveActorInDirection(state, actor, sy, (sy < 0) ? 'up' : 'down');
            if (movedY) {
                my += sy;
            }
        }
        if (!movedX && !movedY) {
            return false;
        }
    }
    if (s >= 100) {
        console.error('infinite loop');
    }
    return true;
}
function moveActorInDirection(state: GameState, actor: Actor, amount: number, direction: Direction) {
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
    for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            const behaviors = behaviorGrid?.[row]?.[column];
            // This will happen when the player moves off the edge of the screen.
            if (!behaviors) {
                continue;
            }
            if (behaviors.solid && behaviors.damage > 0) {
                damageActor(state, actor, behaviors.damage);
            }
            if (behaviors.solid) {
                return false;
            }
        }
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

function damageActor(state: GameState, actor: Actor, damage: number) {
    if (actor.action === 'roll' || actor.invulnerableFrames > 0) {
        return;
    }
    actor.life -= damage;
    actor.invulnerableFrames = 50;
}
