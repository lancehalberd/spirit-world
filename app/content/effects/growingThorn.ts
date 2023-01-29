import { FRAME_LENGTH } from 'app/gameConstants';
import { removeEffectFromArea } from 'app/utils/effects';
import { coverTile, hitTargets } from 'app/utils/field';

import {
    AreaInstance, EffectInstance,
    Frame, GameState,
} from 'app/types';

const thornsTilesIndex = 5;

interface Props {
    x?: number
    y?: number,
    damage?: number,
    delay?: number,
}

export class GrowingThorn implements EffectInstance, Props {
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    frame: Frame;
    damage: number;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    vx: number;
    vy: number;
    w: number = 16;
    h: number = 16;
    delay: number;
    animationTime = 0;
    constructor({x = 0, y = 0, damage = 2, delay = 800}: Props) {
        this.x -= this.w / 2;
        this.y -= this.h / 2;
        this.x = ((x / 16) | 0) * 16;
        this.y = ((y / 16) | 0) * 16;
        this.delay = delay;
        this.damage = damage;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= this.delay) {
            // Grow thorns at this location if possible.
            const tx = (this.x / 16) | 0;
            const ty = (this.y / 16) | 0;
            if (coverTile(state, this.area, tx, ty, thornsTilesIndex)) {
            /*const behavior = this.area.behaviorGrid?.[ty]?.[tx];
            // Don't grow thorns over pits/walls
            if (!behavior?.solid && !behavior?.pit) {
                let topLayer: AreaLayer = this.area.layers[0];
                for (const layer of this.area.layers) {
                    if (layer.definition.drawPriority !== 'foreground') {
                        topLayer = layer;
                    } else {
                        break;
                    }
                }
                topLayer.tiles[ty][tx] = {
                    ...allTiles[5],
                    behaviors: {
                        ...allTiles[5].behaviors,
                    },
                };
                if (this.area.tilesDrawn[ty]?.[tx]) {
                    this.area.tilesDrawn[ty][tx] = false;
                }
                this.area.checkToRedrawTiles = true;
                resetTileBehavior(this.area, {x: tx, y: ty});*/
                hitTargets(state, this.area, {
                    damage: this.damage,
                    hitbox: this,
                    knockAwayFrom: {x: this.x + this.w / 2, y: this.y + this.h / 2},
                    hitAllies: true,
                });
            }
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a warning indicator on the ground.
        context.save();
            context.globalAlpha *= (0.5 + Math.min(0.3, 0.3 * this.animationTime / this.delay));
            context.fillStyle = 'black';
            const r = 4 + 8 * Math.min(1, 1.25 * this.animationTime / this.delay);
            context.beginPath();
            context.arc(this.x + this.w / 2, this.y + this.h / 2, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
}
