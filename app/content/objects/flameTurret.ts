import { flameHeartAnimations } from 'app/content/bosses/flameBeast';
import { Flame } from 'app/content/effects/flame';
import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { drawFrame,getFrame } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import { getAreaSize } from 'app/utils/getAreaSize';
import { rectanglesOverlap } from 'app/utils/index';
import {
    AreaInstance, DrawPriority, GameState, ObjectInstance, ObjectStatus,
    SimpleObjectDefinition, TileBehaviors,
} from 'app/types';

export class FlameTurret implements ObjectInstance {
    behaviors: TileBehaviors = {
        solid: true,
        midHeight: true,
    };
    area: AreaInstance;
    definition: SimpleObjectDefinition;
    drawPriority: DrawPriority = 'sprites';
    isObject = <const>true;
    x: number;
    y: number;
    w: number = 16;
    h: number = 16;
    animationTime: number = 0;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status;
        this.animationTime = 0;
    }
    getHitbox() {
        return this;
    }
    onActivate(state: GameState) {
        if (this.status !== 'normal') {
            this.status = 'normal';
        }
    }
    onDeactivate(state: GameState) {
        if (this.status !== 'off') {
            this.status = 'off';
        }
    }
    isFromCurrentSection(state: GameState): boolean {
        return rectanglesOverlap(getAreaSize(state).section, this.getHitbox());
    }
    update(state: GameState) {
        if (!this.isFromCurrentSection(state)) {
            // Reset this so that the turret has to warm up again any time
            // the player leaves and returns to the section it is in.
            this.animationTime = 0;
            return;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime % 200 === 0) {
            const hitbox = this.getHitbox();
            const count = 2;
            for (let i = 0; i < count; i++) {
                const theta = this.animationTime / 1000 + i * 2 * Math.PI / count;
                const dx = Math.cos(theta);
                const dy = Math.sin(theta);
                const flame = new Flame({
                    x: hitbox.x + hitbox.w / 2 + 4 * dx,
                    y: hitbox.y + hitbox.h / 2 + 4 * dy,
                    vx: 3 * dx,
                    vy: 3 * dy,
                    ttl: Math.min(800, 100 + this.animationTime),
                    damage: 4,
                });
                flame.x -= flame.w / 2;
                flame.y -= flame.h / 2;
                addEffectToArea(state, this.area, flame);
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const frame = getFrame(flameHeartAnimations.idle.down, this.animationTime);
        drawFrame(context, frame, this.getHitbox());
    }
}
objectHash.flameTurret = FlameTurret;
