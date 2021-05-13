import { removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { damageActor } from 'app/updateActor';

import {
    AreaInstance, AstralProjection, Clone, Frame, GameState,
    ObjectInstance, ObjectStatus, ShortRectangle
} from 'app/types';


interface Props {
    x: number,
    y: number,
    damage?: number,
    radius?: number,
}

const EXPANSION_TIME = 200;
const PERSIST_TIME = 800;

export class FrostBlast implements ObjectInstance, Props {
    area: AreaInstance = null;
    definition = null;
    frame: Frame;
    damage: number;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    vx: number;
    vy: number;
    w: number = 12;
    h: number = 12;
    ignorePits = true;
    radius: number;
    animationTime = 0;
    status: ObjectStatus = 'normal';
    speed = 0;
    constructor({x, y, damage = 2, radius = 32}: Props) {
        this.radius = radius
        this.damage = damage;
        this.x = x;
        this.y = y;
    }
    checkForHits(state: GameState) {
        const r = this.radius * Math.min(1, this.animationTime / EXPANSION_TIME);
        const inRange = (rect: ShortRectangle): boolean => {
            // Fudge a little by pretending the target is an oval.
            const r2 = (r + rect.w / 2) * (r + rect.h / 2);
            const dx = rect.x + rect.w / 2 - this.x;
            const dy = rect.y + rect.h / 2 - this.y;
            return dx * dx + dy * dy < r2;
        }
        for (const object of this.area.objects) {
            if (!(object instanceof Clone) && !(object instanceof AstralProjection)) {
                continue;
            }
            if (inRange(object)) {
                damageActor(state, object, this.damage);
            }
        }
        if (state.hero.area === this.area && inRange(state.hero)) {
            damageActor(state, state.hero, this.damage);
        }
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= EXPANSION_TIME + PERSIST_TIME) {
            removeObjectFromArea(state, this);
        } else {
            this.checkForHits(state);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a transparent orb growing in the air
        context.save();
            context.globalAlpha = 0.6;
            context.beginPath();
            context.fillStyle = 'white'
            const r = this.radius * Math.min(1, this.animationTime / EXPANSION_TIME);
            context.arc(this.x + this.w / 2, this.y + this.h / 2 - this.z, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
}
