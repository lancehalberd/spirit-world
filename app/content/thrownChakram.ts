import { destroyTile, getAreaSize } from 'app/content/areas';
import { Enemy } from 'app/content/enemy';
import { createCanvasAndContext } from 'app/dom';
import { getTilesInRectangle } from 'app/getActorTargets';
import { damageActor } from 'app/updateActor';
import { drawFrame } from 'app/utils/animations';
import { isPointInShortRect, rectanglesOverlap } from 'app/utils/index';

import { Frame, GameState } from 'app/types';


const [chakramCanvas, chakramContext] = createCanvasAndContext(10, 10);
chakramContext.fillStyle = 'orange';
chakramContext.arc(5, 5, 5, 0, 2 * Math.PI);
chakramContext.fill();
const chakramFrame = {image: chakramCanvas, x: 0, y: 0, w: chakramCanvas.width, h: chakramCanvas.height};

interface Props {
    x?: number
    y?: number,
    vx?: number,
    vy?: number,
    damage?: number,
    returnSpeed?: number,
}

export class ThrownChakram {
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
    constructor({x = 0, y = 0, vx = 0, vy = 0, damage = 1, returnSpeed = 4}: Props) {
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
    }
    update(state: GameState) {
        if (this.outFrames > 0) {
            this.x += this.vx;
            this.y += this.vy;
            this.outFrames--;
            const { w, h } = getAreaSize(state);
            if (this.x <= 0 || this.y <= 0 || this.x + this.w >= w || this.y + this.h >= h) {
                this.outFrames = 0;
            }
        } else {
            const dx = (state.hero.x + state.hero.w / 2) - (this.x + this.w / 2);
            const dy = (state.hero.y + state.hero.h / 2) - (this.y + this.h / 2);
            const m = Math.sqrt(dx * dx + dy * dy);
            this.x += this.returnSpeed * dx / m;
            this.y += this.returnSpeed * dy / m;
            if (isPointInShortRect(state.hero.x + state.hero.w / 2, state.hero.y + state.hero.h / 2, this)) {
                state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this), 1);
                state.hero.chakrams++;
            }
        }
        for (const enemy of state.areaInstance.objects) {
            if (!(enemy instanceof Enemy)) {
                continue;
            }
            if (!this.hitTargets.has(enemy) && rectanglesOverlap(enemy, this)) {
                damageActor(state, enemy, this.damage);
                this.hitTargets.add(enemy);
                this.outFrames = 0;
            }
        }
        for (const target of getTilesInRectangle(state, this)) {
            const area = state.areaInstance;
            const behavior = area.behaviorGrid?.[target.y]?.[target.x];
            if (behavior?.cuttable <= state.hero.activeTools.weapon) {
                destroyTile(state, target);
            } else if (behavior?.cuttable > state.hero.activeTools.weapon) {
                this.outFrames = 0;
            }
        }
    }
    render(context, state: GameState) {
        drawFrame(context, this.frame, { ...this.frame, x: this.x, y: this.y });
    }
}
