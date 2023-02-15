import { objectHash } from 'app/content/objects/objectHash';
import { playAreaSound } from 'app/musicController';
import { createAnimation, drawFrameAt } from 'app/utils/animations';

import {
    AreaInstance, DrawPriority, GameState, Frame, FrameAnimation, HitProperties, HitResult, SimpleObjectDefinition,
    ObjectInstance, ObjectStatus, Rect, TileBehaviors,
} from 'app/types';

const potFrame: Frame = createAnimation('gfx/tiles/movablepot.png', {w: 16, h: 18}).frames[0];

export const bellStyles = {
    bellA: {
        playSound(state: GameState, bell: Bell) {
            playAreaSound(state, bell.area, 'blockAttack');
        }
    }
}

export class Bell implements ObjectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors = {
        solid: true,
    };
    drawPriority: DrawPriority = 'sprites';
    definition: SimpleObjectDefinition;
    isObject = <const>true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    isNeutralTarget = true;
    animation: FrameAnimation = null;
    animationTime = 0;
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 32 };
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (hit.isBonk) {
            const style = bellStyles[this.definition.style] || bellStyles.bellA;
            style.playSound(state, this);
        }
        return {
            stopped: true,
        };
    }
    update(state: GameState) {
    }
    render(context, state: GameState) {
        let frame: Frame = potFrame;
        if (!frame) {
            debugger;
        }
        drawFrameAt(context, frame, { x: this.x, y: this.y });
    }
}
objectHash.bell = Bell;
