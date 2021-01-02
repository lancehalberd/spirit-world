import _ from 'lodash';

import { FRAME_LENGTH } from 'app/gameConstants';
import { moveActor } from 'app/moveActor';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap } from 'app/utils/field';

import { Actor, ActorAnimations, Direction, EnemyObjectDefinition, Frame, FrameAnimation, GameState } from 'app/types';


interface Props {
    animations?: ActorAnimations,
    d?: Direction;
    x?: number
    y?: number,
    life?: number,
    touchDamage?: number,
}

export class Enemy implements Actor {
    type = 'enemy' as 'enemy';
    definition: EnemyObjectDefinition;
    animations: ActorAnimations;
    currentAnimation: FrameAnimation;
    animationTime: number;
    d: Direction;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    w: number;
    h: number;
    touchDamage: number;
    life: number;
    mode = 'choose';
    modeTime = 0;
    invulnerableFrames = 0;
    constructor({animations, d = 'down', life = 1, touchDamage = 0.5, x = 0, y = 0 }: Props) {
        this.animations = animations;
        this.d = d;
        this.currentAnimation = this.animations.idle[this.d];
        this.animationTime = 0;
        this.x = x;
        this.y = y;
        this.z = 0;
        const frame = this.getFrame();
        this.w = frame?.content.w || frame.w;
        this.h = frame?.content.h || frame.h;
        this.life = life;
        this.touchDamage = touchDamage;
    }
    getFrame(): Frame {
        return getFrame(this.currentAnimation, this.animationTime);
    }
    setMode(mode: string) {
        this.mode = mode;
        this.modeTime = 0;
    }
    update(state: GameState) {
        this.modeTime += FRAME_LENGTH;
        this.animationTime += FRAME_LENGTH;
        if (this.invulnerableFrames > 0) {
            this.invulnerableFrames--;
        }
    }
    render(context, state: GameState) {
        const frame = this.getFrame();
        context.save();
            if (this.invulnerableFrames) {
                context.globalAlpha = 0.7 + 0.3 * Math.cos(2 * Math.PI * this.invulnerableFrames * 3 / 50);
            }
            if (this.d === 'right') {
                // Flip the frame when facing right. We may need an additional flag for this behavior
                // if we don't do it for all enemies on the right frames.
                const w = (frame.content ? frame.content.w : frame.w);
                context.translate(this.x + (frame?.content?.x || 0) + w / 2, 0);
                context.scale(-1, 1);
                drawFrame(context, frame, { ...frame, x: - w / 2, y: this.y });
            } else {
                drawFrame(context, frame, { ...frame, x: this.x, y: this.y });
            }
        context.restore();
    }
}

const snakeGeometry = { w: 18, h: 18, content: { x: 1, y: 1, w: 16, h: 16} };
const leftSnakeAnimation: FrameAnimation = createAnimation('gfx/enemies/snek.png', snakeGeometry, { x: 0});
const downSnakeAnimation: FrameAnimation = createAnimation('gfx/enemies/snek.png', snakeGeometry, { x: 1});
const upSnakeAnimation: FrameAnimation = createAnimation('gfx/enemies/snek.png', snakeGeometry, { x: 2});
const snakeAnimations: ActorAnimations = {
    idle: {
        up: upSnakeAnimation,
        down: downSnakeAnimation,
        left: leftSnakeAnimation,
        right: leftSnakeAnimation,
    },
};


export class Snake extends Enemy {
    constructor({d = 'down', x = 0, y = 0 }: Props) {
        super({animations: snakeAnimations, d, x, y, life: 2, touchDamage: 1});
    }
    update(state: GameState) {
        if (this.mode === 'choose' && this.modeTime > 200) {
            this.setMode('walk');
            this.d = _.sample(['up', 'down', 'left', 'right']);
            this.currentAnimation = this.animations.idle[this.d];
        }
        if (this.mode === 'walk') {
            if (this.modeTime >= 200) {
                if (!moveActor(state, this, directionMap[this.d][0], directionMap[this.d][1])) {
                    this.setMode('choose');
                    this.modeTime = 200;
                }
            }
            if (this.modeTime > 700 && Math.random() < (this.modeTime - 700) / 3000) {
                this.setMode('choose');
            }
        }
        super.update(state);
    }
}

