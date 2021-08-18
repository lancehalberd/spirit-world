//import { resetTileBehavior } from 'app/content/areas';
//import { allTiles } from 'app/content/tiles';
import { FRAME_LENGTH } from 'app/gameConstants';
import { saveGame } from 'app/state';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, GameState, HitProperties, HitResult, ObjectInstance,
    ObjectStatus, SimpleObjectDefinition, Rect, TileBehaviors,
} from 'app/types';

export class Torch implements ObjectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors = {
        solid: true,
        low: true,
    };
    drawPriority: 'sprites' = 'sprites';
    definition: SimpleObjectDefinition = null;
    isNeutralTarget = true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    appliedFireToTiles = false;
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.behaviors = {...this.behaviors};
        this.x = definition.x;
        this.y = definition.y;
        this.status = this.definition.status;
        if (this.definition.id && state.savedState.objectFlags[this.definition.id]) {
            this.status = 'active';
        }
        if (this.status === 'active') {
            this.behaviors.element = 'fire';
        }
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (this.status === 'active' && hit.element === 'ice') {
            this.status = 'normal';
            this.behaviors.element = null;
            this.appliedFireToTiles = false;
        } else if (this.status === 'normal' && hit.element === 'fire') {
            this.status = 'active';
            this.behaviors.element = 'fire';
        }
        return { hit: true, pierced: true, setElement: this.behaviors.element };
    }
    onActivate(state: GameState) {
        this.status = 'active';
        this.behaviors.element = 'fire';
    }
    applyFireToTiles(state: GameState) {
        hitTargets(state, this.area, {
            element: 'fire',
            hitCircle: {
                x: this.x + 8,
                y: this.y + 8,
                r: 36,
            },
            hitTiles: true,
        });
        /*const tx = (this.x / 16) | 0, ty = (this.y / 16) | 0;
        for(let dy = -2; dy <= 2; dy++) {
            for(let dx = -2; dx <= 2; dx++) {
                if (dx * dx + dy * dy >= 8) continue;
                let changed = false;
                for (const layer of this.area.layers) {
                    const tile = layer.tiles?.[ty+dy]?.[tx + dx];
                    const fireTile = tile?.behaviors?.elementTiles?.fire;
                    if (typeof fireTile !== 'undefined') {
                        layer.tiles[ty + dy][tx + dx] = layer.originalTiles[ty + dy][tx + dx] = allTiles[fireTile];
                        changed = true;
                    }
                }
                if (changed) {
                    this.area.checkToRedrawTiles = true;
                    if (this.area.tilesDrawn?.[ty + dy]?.[tx + dx]) {
                        this.area.tilesDrawn[ty + dy][tx + dx] = false;
                    }
                    resetTileBehavior(this.area, {x: tx + dx, y: ty + dy});
                }
            }
        }*/
        this.appliedFireToTiles = true;
    }
    update(state: GameState) {
        if (this.area && this.status === 'active' && !this.appliedFireToTiles) {
            if (this.definition.saveStatus && this.definition.id && !state.savedState.objectFlags[this.definition.id]) {
                state.savedState.objectFlags[this.definition.id] = true;
                saveGame();
            }
            this.applyFireToTiles(state);
        }
        this.animationTime += FRAME_LENGTH;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal' && this.status !== 'active') {
            return;
        }
        context.beginPath();
        context.rect(this.x, this.y, 16, 16);
        context.fillStyle = 'black';
        context.strokeStyle = '#888';
        context.fill();
        context.stroke();
        if (this.status === 'active') {
            context.fillStyle = 'red';
            context.save();
                context.globalAlpha *= 0.6;
                context.fillRect(this.x, this.y, 16, 16);
            context.restore();
            context.beginPath();
            context.arc(
                this.x + 8,
                this.y + 8 - 5 + 1 * Math.cos(this.animationTime / 120),
                6, 0, 2 * Math.PI
            );
            context.fill();
        }
    }
}
