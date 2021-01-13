import { addParticleAnimations } from 'app/content/animationEffect';
import { destroyTile, getAreaSize, removeObjectFromArea } from 'app/content/areas';
import { Enemy } from 'app/content/enemy';
import { createCanvasAndContext } from 'app/dom';
import { getTilesInRectangle } from 'app/getActorTargets';
import { damageActor } from 'app/updateActor';
import { drawFrame } from 'app/utils/animations';
import { getDirection } from 'app/utils/field';
import { isPointInShortRect, rectanglesOverlap } from 'app/utils/index';

import { Frame, GameState, Hero, ObjectInstance, ObjectStatus } from 'app/types';

const CHAKRAM_RADIUS = 6;
const [chakramCanvas, chakramContext] = createCanvasAndContext(2 * CHAKRAM_RADIUS, 2 * CHAKRAM_RADIUS);
chakramContext.fillStyle = 'orange';
chakramContext.arc(CHAKRAM_RADIUS, CHAKRAM_RADIUS, CHAKRAM_RADIUS, 0, 2 * Math.PI);
chakramContext.fill();
const chakramFrame = {image: chakramCanvas, x: 0, y: 0, w: chakramCanvas.width, h: chakramCanvas.height};

interface Props {
    x?: number
    y?: number,
    vx?: number,
    vy?: number,
    damage?: number,
    returnSpeed?: number,
    source: Hero,
}

export class ThrownChakram implements ObjectInstance {
    definition = null;
    type = 'thrownChakram' as 'thrownChakram';
    frame: Frame;
    outFrames: number;
    damage: number;
    speed: number;
    returnSpeed: number;
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    hitTargets: Set<any>;
    status: ObjectStatus = 'normal';
    source: Hero;
    constructor({x = 0, y = 0, vx = 0, vy = 0, damage = 1, returnSpeed = 4, source}: Props) {
        this.frame = chakramFrame;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.speed = Math.sqrt(vx * vx + vy * vy);
        this.returnSpeed = returnSpeed;
        this.w = this.frame.w;
        this.h = this.frame.h
        this.outFrames = 10;
        this.hitTargets = new Set();
        this.source = source;
    }
    update(state: GameState) {
        // Chakram returns to the hero if the clone it was thrown from no longer exists.
        if (state.areaInstance.objects.indexOf(this.source) < 0) {
            this.source = state.hero;
        }
        if (this.outFrames > 0) {
            this.x += this.vx;
            this.y += this.vy;
            this.outFrames--;
            const { section } = getAreaSize(state);
            if (this.x <= section.x || this.y <= section.y
                || this.x + this.w >= section.x + section.w || this.y + this.h >= section.y + section.h
            ) {
                this.outFrames = 0;
            }
        } else {
            const dx = (this.source.x + this.source.w / 2) - (this.x + this.w / 2);
            const dy = (this.source.y - 2 + this.source.h / 2) - (this.y + this.h / 2);
            const m = Math.sqrt(dx * dx + dy * dy);
            this.vx = this.returnSpeed * dx / m;
            this.vy = this.returnSpeed * dy / m;
            this.x += this.vx;
            this.y += this.vy;
            if (isPointInShortRect(this.source.x + this.source.w / 2, this.source.y + this.source.h / 2, this)) {
                removeObjectFromArea(state, state.areaInstance, this);
                return;
            }
        }
        for (const object of state.areaInstance.objects) {
            if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                continue;
            }
            if (object instanceof Enemy) {
                if (!this.hitTargets.has(object) && rectanglesOverlap(object, this)) {
                    damageActor(state, object, this.damage);
                    this.hitTargets.add(object);
                    this.outFrames = 0;
                }
            }
            // Only hit objects on the way out to prevent accidentally dragging objects towards the player.
            if (this.outFrames > 0) {
                if (object.getHitbox && object.onHit) {
                    const hitbox = object.getHitbox(state);
                    if (rectanglesOverlap(hitbox, this)) {
                        const direction = getDirection(hitbox.x - this.x + 8 * this.vx, hitbox.y - this.y + 8 * this.vy);
                        object.onHit(state, direction);
                        this.hitTargets.add(object);
                        this.outFrames = 0;
                    }
                }
            }
        }
        for (const target of getTilesInRectangle(state, this)) {
            const area = state.areaInstance;
            const behavior = area.behaviorGrid?.[target.y]?.[target.x];
            if (behavior?.cuttable <= state.hero.weapon) {
                // We need to find the specific cuttable layers that can be destroyed.
                for (const layer of state.areaInstance.layers) {
                    const palette = layer.palette;
                    const tile = layer.definition.grid.tiles[target.y][target.x];
                    const behavior = palette.behaviors[`${tile.x}x${tile.y}`];
                    if (behavior?.cuttable <= state.hero.weapon) {
                        destroyTile(state, {...target, layerKey: layer.key});
                        addParticleAnimations(state, target.x * 16, target.y * 16, 2, behavior.particles);
                    }
                }
            } else if (behavior?.cuttable > state.hero.weapon || (behavior?.solid && !behavior?.low)) {
                this.outFrames = 0;
            }
        }
    }
    render(context, state: GameState) {
        drawFrame(context, this.frame, { ...this.frame, x: this.x, y: this.y });
    }
}
