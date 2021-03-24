import { removeObjectFromArea, resetTileBehavior } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getTileBehaviorsAndObstacles } from 'app/utils/field';

import { AreaInstance, GameState, ObjectInstance, ObjectStatus } from 'app/types';


interface Props {
    x?: number
    y?: number,
}

export function growVine(this: void, area: AreaInstance, tx: number, ty: number): void {
    area.checkToRedrawTiles = true;
    for (const layer of area.layers) {
        const palette = layer.palette;
        const tile = layer.tiles[ty][tx];
        const behavior = palette.behaviors[`${tile.x}x${tile.y}`];
        if (behavior?.growTiles) {
            // Probably play a splash effect here.
            // Add a vine here.
            for (let i = 0; i < 32; i++) {
                const y = ty - 1 - i;
                if (y < 0) {
                    break;
                }
                const targetBehavior = area?.behaviorGrid[y]?.[tx];
                if (!targetBehavior?.solid) {
                    break;
                }
                const growTile = behavior.growTiles[i % behavior.growTiles.length];
                layer.tiles[y][tx] = growTile;
                layer.originalTiles[y][tx] = growTile;
                if (area.tilesDrawn[y]?.[tx]) {
                    area.tilesDrawn[y][tx] = false;
                }
                resetTileBehavior(area, {x: tx, y});
            }
        }
    }
}

export class PouredWaterEffect implements ObjectInstance {
    area: AreaInstance;
    definition = null;
    animationTime: number;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor({x = 0, y = 0 }: Props) {
        this.animationTime = 0;
        this.x = x;
        this.y = y;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        this.y += 4;
        const { tileBehavior, tx, ty } = getTileBehaviorsAndObstacles(state, this.area, {x: this.x, y: this.y});
        if (tileBehavior.growTiles) {
            removeObjectFromArea(state, this);
            growVine(this.area, tx, ty);
        } else if (!tileBehavior.solid) {
            removeObjectFromArea(state, this);
            // Probably play a splash effect here.
        } else if (this.y > 32 * 16) {
            // Destroy the water if it drops of the bottom of the screen.
            removeObjectFromArea(state, this);
        }
    }
    render(context, state: GameState) {
        context.beginPath();
        context.fillStyle = '#AAAAFF';
        context.arc(this.x, this.y, 4, 0, 2 * Math.PI);
        context.fill();
    }
}

