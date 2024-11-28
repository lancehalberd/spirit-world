import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import { createAnimation, drawFrameContentAt, getFrame } from 'app/utils/animations';


const bellAnimation: FrameAnimation = createAnimation('gfx/objects/bell.png', {w: 16, h: 32, content: {x: 0, y: 16, w: 16, h:16}}, {cols: 8, y: 0});
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
    },
    bellC5: {
        playSound(state: GameState, bell: Bell) {
            playAreaSound(state, bell.area, 'bellC5');
        }
    },
    bellD5: {
        playSound(state: GameState, bell: Bell) {
            playAreaSound(state, bell.area, 'bellD5');
        }
    },
    bellE5: {
        playSound(state: GameState, bell: Bell) {
            playAreaSound(state, bell.area, 'bellE5');
        }
    },
};

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
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (hit.isBonk) {
            const style = bellStyles[this.definition.style as keyof typeof bellStyles] || bellStyles.bellA4;
            style.playSound(state, this);
            this.animationTime = 0;
        } else {
            playAreaSound(state, this.area, 'blockAttack');
        }
        return {
            stopped: true,
        };
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        let frame: Frame = bellFrame;
        if (this.animationTime < bellAnimation.duration * 2) {
            frame = getFrame(bellAnimation, this.animationTime);
        }
        if (!frame) {
            debugger;
        }
        drawFrameContentAt(context, frame, { x: this.x, y: this.y });
    }
}
objectHash.bell = Bell;
