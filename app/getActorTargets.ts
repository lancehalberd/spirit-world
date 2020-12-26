import { Actor, GameState, Tile } from 'app/types';

export function getActorTargets(state: GameState, actor: Actor): Tile[] {
    const palette = state.areaInstance.palette;
    const tileSize = palette.w;

    if (actor.d === 'left' || actor.d === 'right') {
        const column = Math.floor((actor.d === 'left' ? (actor.x - 2) : (actor.x + actor.w + 2)) / tileSize);
        const top = Math.floor((actor.y + tileSize / 2 - 2) / tileSize);
        const bottom = Math.floor((actor.y + actor.h - tileSize / 2 + 2) / tileSize);
        if (top === bottom) {
            return [{x: column, y: top}];
        }
        return [{x: column, y: top}, {x: column, y: bottom}];
    }

    if (actor.d === 'up' || actor.d === 'down') {
        const row = Math.floor((actor.d === 'up' ? (actor.y - 2) : (actor.y + actor.h + 2)) / tileSize);
        const left = Math.floor((actor.x + tileSize / 2 - 2) / tileSize);
        const right = Math.floor((actor.x + actor.w - tileSize / 2 + 2) / tileSize);
        if (left === right) {
            return [{x: left, y: row}];
        }
        return [{x: left, y: row}, {x: right, y: row}];
    }

    return [];
}
