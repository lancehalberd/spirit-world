import { destroyTile, getAreaSize, removeObjectFromArea } from 'app/content/areas';
import { Enemy } from 'app/content/enemy';
import { createCanvasAndContext } from 'app/dom';
import { getTilesInRectangle } from 'app/getActorTargets';
import { damageActor } from 'app/updateActor';
import { drawFrame } from 'app/utils/animations';
import { getDirection } from 'app/utils/field';
import { rectanglesOverlap } from 'app/utils/index';

import { Direction, Frame, GameState, ObjectInstance, ObjectStatus, ShortRectangle } from 'app/types';

const [arrowCanvas, arrowContext] = createCanvasAndContext(4, 12);
arrowContext.fillStyle = 'white';
arrowContext.fillRect(1, 0, 2, 2);
arrowContext.fillRect(0, 2, 4, 2);
arrowContext.fillStyle = 'brown';
arrowContext.fillRect(1, 2, 2, 8);
arrowContext.fillStyle = 'red';
arrowContext.fillRect(0, 8, 1, 4);
arrowContext.fillRect(3, 8, 1, 4);
const arrowFrame = {image: arrowCanvas, x: 0, y: 0, w: arrowCanvas.width, h: arrowCanvas.height};

interface Props {
    x?: number
    y?: number,
    vx?: number,
    vy?: number,
    damage?: number,
    direction: Direction,
}

export class Arrow implements ObjectInstance {
    definition = null;
    frame: Frame;
    damage: number;
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    hitTargets: Set<any>;
    direction: Direction;
    stuckFrames: number = 0;
    status: ObjectStatus = 'normal';
    constructor({x = 0, y = 0, vx = 0, vy = 0, direction, damage = 1}: Props) {
        this.frame = arrowFrame;
        this.x = x | 0;
        this.y = y | 0;
        this.vx = vx;
        this.vy = vy;
        this.direction = direction;
        this.damage = damage;
        const hitbox = this.getRotatedHitbox();
        this.w = hitbox.w;
        this.h = hitbox.h;
        this.x -= this.w / 2 ;
        this.y -= this.h / 2 ;
        this.hitTargets = new Set();
    }
    getRotatedHitbox(): ShortRectangle {
        if (this.direction === 'up' || this.direction === 'down') {
            return {...this.frame, x: this.x, y: this.y };
        }
        //adjusts y alignment of arrow fired horizontally to appear more central to the character
        this.y += 6;
        return { x: this.x, y: this.y, w: this.frame.h, h: this.frame.w };
    }
    update(state: GameState) {
        if (this.stuckFrames > 0) {
            if (this.stuckFrames++ > 15) {
                removeObjectFromArea(state, this);
            }
            return;
        }
        this.x += this.vx;
        this.y += this.vy;
            const { section } = getAreaSize(state);
        if (this.x + this.w <= section.x || this.y + this.h <= section.y
            || this.x >= section.x + section.w || this.y  >= section.y + section.h
        ) {
            removeObjectFromArea(state, this);
            return;
        }
        for (const object of state.areaInstance.objects) {
            if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                continue;
            }
            if (object instanceof Enemy) {
                if (!this.hitTargets.has(object) && rectanglesOverlap(object, this)) {
                    this.hitTargets.add(object);
                    damageActor(state, object, this.damage);
                    this.stuckFrames = 1;
                    return;
                }
            }
            if (object.getHitbox && object.behaviors?.solid) {
                const hitbox = object.getHitbox(state);
                if (!this.hitTargets.has(object) && rectanglesOverlap(hitbox, this)) {
                    this.hitTargets.add(object);
                    const direction = getDirection(hitbox.x - this.x + 8 * this.vx, hitbox.y - this.y + 8 * this.vy);
                    object.onHit?.(state, direction);
                    if (!object.behaviors?.low){
                        this.stuckFrames = 1;
                        return;
                    }
                }
            }
        }
        for (const target of getTilesInRectangle(state, this)) {
            const area = state.areaInstance;
            const behavior = area.behaviorGrid?.[target.y]?.[target.x];
            const bowLevel = state.hero.activeTools.bow;
            if (behavior?.cuttable <= bowLevel && !behavior?.low) {
                // We need to find the specific cuttable layers that can be destroyed.
                for (const layer of state.areaInstance.layers) {
                    const palette = layer.palette;
                    const tile = layer.tiles[target.y][target.x];
                    const behavior = palette.behaviors[`${tile.x}x${tile.y}`];
                    if (behavior?.cuttable <= bowLevel) {
                        destroyTile(state, state.areaInstance, {...target, layerKey: layer.key});
                    }
                }
            } else if ((behavior?.cuttable > bowLevel || behavior?.solid) && !behavior?.low) {
                this.stuckFrames = 1;
            }
        }
    }
    render(context, state: GameState) {
        //context.fillStyle = 'blue';
        //context.fillRect(this.x, this.y, 4, 4);
        let rotation = 0;
        if (this.direction === 'left') {
            rotation = -Math.PI / 2;
        } else if (this.direction === 'down') {
            rotation = Math.PI;
        } else if (this.direction === 'right') {
            rotation = Math.PI / 2;
        }
        context.save();
            context.translate(this.x + this.w / 2, this.y + this.h / 2);
            context.rotate(rotation);
            drawFrame(context, this.frame, { ...this.frame, x: -this.frame.w / 2, y: -this.frame.h / 2 });
        context.restore();
    }
}
