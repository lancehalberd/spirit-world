import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';


const bellAnimation: FrameAnimation = createAnimation('gfx/objects/bell.png', {w: 16, h: 32}, {cols: 8, y: 0});
const bellFrame: Frame = bellAnimation.frames[0];

export const bellStyles = {
    bellA4: {
        playSound(state: GameState, bell: Bell) {
            playAreaSound(state, bell.area, 'bellA4');
        }
    },
    bellB4: {
        playSound(state: GameState, bell: Bell) {
            playAreaSound(state, bell.area, 'bellB4');
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
    animationTime = bellAnimation.duration * 2;
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
            const style = bellStyles[this.definition.style] || bellStyles.bellA4;
            style.playSound(state, this);
            this.animationTime = 0;
        }
        return {
            stopped: true,
        };
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
    }
    render(context, state: GameState) {
        let frame: Frame = bellFrame;
        if (this.animationTime < bellAnimation.duration * 2) {
            frame = getFrame(bellAnimation, this.animationTime);
        }
        if (!frame) {
            debugger;
        }
        drawFrameAt(context, frame, { x: this.x, y: this.y });
    }
}
objectHash.bell = Bell;
