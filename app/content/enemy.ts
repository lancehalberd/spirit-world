import _ from 'lodash';

import { getAreaSize } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { moveActor } from 'app/moveActor';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap } from 'app/utils/field';

import {
    Actor, ActorAnimations, Direction, EnemyType, EnemyObjectDefinition,
    Frame, FrameAnimation, GameState, ObjectInstance,ObjectStatus,
} from 'app/types';

export class Enemy implements Actor, ObjectInstance {
    type = 'enemy' as 'enemy';
    drawPriority: 'sprites' = 'sprites';
    definition: EnemyObjectDefinition;
    enemyDefinition: EnemyDefinition;
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
    life: number;
    mode = 'choose';
    modeTime = 0;
    invulnerableFrames = 0;
    status: ObjectStatus = 'normal';
    constructor(definition: EnemyObjectDefinition) {
        this.definition = definition;
        this.enemyDefinition = enemyDefinitions[this.definition.enemyType] || enemyDefinitions.snake;
        this.d = definition.d || 'down';
        this.currentAnimation = this.enemyDefinition.animations.idle[this.d];
        this.animationTime = 0;
        this.x = definition.x;
        this.y = definition.y;
        this.z = 0;
        const frame = this.getFrame();
        this.w = frame?.content.w || frame.w;
        this.h = frame?.content.h || frame.h;
        this.life = this.enemyDefinition.life;
    }
    getFrame(): Frame {
        return getFrame(this.currentAnimation, this.animationTime);
    }
    isInCurrentSection(state: GameState): boolean {
        const { section } = getAreaSize(state);
        return !(this.x < section.x || this.x > section.x + section.w || this.y < section.y || this.y > section.y + section.h)
    }
    setMode(mode: string) {
        this.mode = mode;
        this.modeTime = 0;
    }
    update(state: GameState) {
        if (!this.isInCurrentSection(state)) {
            return;
        }
        if (this.enemyDefinition.update) {
            this.enemyDefinition.update(state, this);
        }
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
                drawFrame(context, frame, { ...frame, x: - w / 2, y: this.y - (frame?.content?.y || 0) });
            } else {
                drawFrame(context, frame, { ...frame, x: this.x - (frame?.content?.x || 0), y: this.y - (frame?.content?.y || 0) });
            }
        context.restore();
    }
}

const snakeGeometry = { w: 18, h: 18, content: { x: 1, y: 6, w: 16, h: 16} };
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

interface EnemyDefinition {
    animations: ActorAnimations,
    life: number,
    touchDamage: number,
    update: (state: GameState, enemy: Enemy) => void,
}

export const enemyDefinitions: {[key in EnemyType]: EnemyDefinition} = {
    snake: {animations: snakeAnimations, life: 2, touchDamage: 1, update: paceRandomly},
}

function paceRandomly(state: GameState, enemy: Enemy) {
    if (enemy.mode === 'choose' && enemy.modeTime > 200) {
        enemy.setMode('walk');
        enemy.d = _.sample(['up', 'down', 'left', 'right']);
        enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    }
    if (enemy.mode === 'walk') {
        if (enemy.modeTime >= 200) {
            const { section } = getAreaSize(state);
            // Don't allow the enemy to move off the edge of the current section.
            if (enemy.d === 'left' && enemy.x < section.x + 16
                || enemy.d === 'right' && enemy.x + enemy.w > section.x + section.w - 16
                || enemy.d === 'up' && enemy.y < section.y + 16
                || enemy.d === 'down' && enemy.y + enemy.h > section.y + section.h - 16
            ) {
                enemy.setMode('choose');
                enemy.modeTime = 200;
            } else if (!moveActor(state, enemy, directionMap[enemy.d][0], directionMap[enemy.d][1])) {
                enemy.setMode('choose');
                enemy.modeTime = 200;
            }
        }
        if (enemy.modeTime > 700 && Math.random() < (enemy.modeTime - 700) / 3000) {
            enemy.setMode('choose');
        }
    }
}
