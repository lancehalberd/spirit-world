import { sample } from 'lodash';

import { selectDialogueOption } from 'app/content/dialogue';
import { snakeAnimations } from 'app/content/enemyAnimations';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getSectionBoundingBox, moveActor } from 'app/moveActor';
import { heroAnimations } from 'app/render/heroAnimations';
import {
    galAnimations, gal2Animations,
    guyAnimations, guy2Animations,
    momAnimations, paleMonkAnimations,
    midMonkAnimations, darkMonkAnimations,
    vanaraBlackAnimations, vanaraBlueAnimations,
    vanaraBrownAnimations, vanaraGoldAnimations,
    vanaraGrayAnimations, vanaraPurpleAnimations,
    vanaraRedAnimations, zoroAnimations,
} from 'app/render/npcAnimations';
import { shadowFrame, smallShadowFrame } from 'app/renderActor';
import { showMessage } from 'app/scriptEvents';
import { drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, getDirection, rotateDirection } from 'app/utils/direction';

import {
    Actor, ActorAnimations, AreaInstance, GameState, DialogueOption, Direction,
    Frame, FrameAnimation, Hero, MovementProperties, NPCDefinition,
    ObjectInstance, ObjectStatus, Rect,
} from 'app/types';

interface NPCStyleDefinition {
    animations: ActorAnimations
    scale?: number
    shadowOffset?: number
    flipRight?: boolean
}

export const npcStyles = {
    giantSnake: {
        animations: snakeAnimations,
        scale: 3,
        shadowOffset: -3,
        flipRight: true,
    } as NPCStyleDefinition,
    gal: {
        animations: galAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    gal2: {
        animations: gal2Animations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    guy: {
        animations: guyAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    guy2: {
        animations: guy2Animations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    mom: {
        animations: momAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    rival: {
        animations: vanaraBlackAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    paleMonk: {
        animations: paleMonkAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    midMonk: {
        animations: midMonkAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    darkMonk: {
        animations: darkMonkAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    vanara: {
        animations: heroAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    vanaraBlack: {
        animations: vanaraBlackAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    vanaraBlue: {
        animations: vanaraBlueAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    vanaraBrown: {
        animations: vanaraBrownAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    vanaraGold: {
        animations: vanaraGoldAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    vanaraGray: {
        animations: vanaraGrayAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    vanaraPurple: {
        animations: vanaraPurpleAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    vanaraRed: {
        animations: vanaraRedAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
    zoro: {
        animations: zoroAnimations,
        shadowOffset: 1,
    } as NPCStyleDefinition,
};

export const npcBehaviors = {
    none() {
        // Do nothing for this behavior.
    },
    face(state: GameState, npc: NPC) {
        // Always update to face original direction.
        npc.d = npc.definition.d || 'down';
        npc.changeToAnimation('still');
    },
    random(state: GameState, npc: NPC) {
        if (npc.mode === 'choose' && npc.modeTime > 200) {
            npc.changeToAnimation('still');
            if (Math.random() < 0.2) {
                npc.setMode('rest');
            } else {
                npc.setMode('walk');
                npc.d = sample(['up', 'down', 'left', 'right']);
            }
        }
        if (npc.mode === 'walk') {
            npc.changeToAnimation('move');
            if (!moveNPC(state, npc, npc.speed * directionMap[npc.d][0], npc.speed * directionMap[npc.d][1], {})) {
                npc.setMode('choose');
            }
            if (npc.modeTime > 2000 && Math.random() < (npc.modeTime - 700) / 3000) {
                npc.setMode('choose');
            }
        }
        if (npc.mode === 'rest') {
            npc.changeToAnimation('still');
            if (Math.random() < 0.01) {
                npc.setMode('idleAnimation');
            }
            if (npc.modeTime > 1000) {
                npc.setMode('choose');
            }
        }
        if (npc.mode === 'idleAnimation') {
            npc.changeToAnimation('idle');
            if (npc.animationTime >= npc.currentAnimation.duration) {
                npc.setMode('choose');
            }
        }
    },
    idle(state: GameState, npc: NPC) {
        const { animations } = npcStyles[npc.definition.style];
        const stillSet = animations.still || animations.idle;
        if (npc.currentAnimation === stillSet[npc.d]) {
            const defaultDirection = npc.definition.d || 'down';
            if (npc.d !== defaultDirection) {
                npc.d = defaultDirection;
                npc.changeToAnimation('still');
            }
            if (Math.random() < (npc.animationTime - 3000) / 7000) {
                npc.setAnimation('idle', npc.d);
            }
        } else {
            if (npc.animationTime >= npc.currentAnimation.duration) {
                npc.setAnimation('still', npc.d);
            }
        }
    }
}

function moveNPC(state, npc: NPC, dx, dy, movementProperties: MovementProperties): boolean {
    movementProperties.boundingBox = movementProperties.boundingBox ?? getSectionBoundingBox(state, npc, 16);
    // By default, don't allow the enemy to move towards the outer edges of the screen.
    if (npc.flying) {
        npc.x += dx;
        npc.y += dy;
        return true;
    }
    const { mx, my } = moveActor(state, npc, dx, dy, movementProperties);
    return mx !== 0 || my !== 0;
}

export function moveNPCToTargetLocation(
    state: GameState,
    npc: NPC, tx: number, ty: number,
    animationStyle?: string
): number {
    const hitbox = npc.getHitbox(state);
    const dx = tx - (hitbox.x + hitbox.w / 2), dy = ty - (hitbox.y + hitbox.h / 2);
    if (animationStyle) {
        npc.d = getDirection(dx, dy);
        npc.changeToAnimation(animationStyle)
    }
    //enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > npc.speed) {
        moveNPC(state, npc, npc.speed * dx / mag, npc.speed * dy / mag, {});
        return mag - npc.speed;
    }
    moveNPC(state, npc, dx, dy, {});
    return 0;
}

export type NPCStyle = keyof typeof npcStyles;
export type NPCBehavior = keyof typeof npcBehaviors;

export class NPC implements Actor, ObjectInstance  {
    area: AreaInstance;
    d: Direction;
    definition: NPCDefinition;
    drawPriority: 'sprites' = 'sprites';
    isObject = <const>true;
    behaviors = {
        solid: true,
    };
    x: number;
    y: number;
    flying = false;
    life = 1;
    vx = 0;
    vy = 0
    vz = 0;
    z = 0;
    w = 16;
    h = 16;
    groundHeight = 0;
    currentAnimation: FrameAnimation;
    animationTime = 0;
    mode = 'choose';
    modeTime = 0;
    speed = 1;
    status: ObjectStatus = 'normal';
    params: any;
    showMessage = false;
    dialogueIndex = 0;
    lastDialogueOption: DialogueOption;
    constructor(definition: NPCDefinition) {
        this.definition = definition;
        this.d = definition.d || 'down';
        this.x = definition.x;
        this.y = definition.y;
        const animationStyle = npcStyles[this.definition.style];
        this.currentAnimation = animationStyle.animations.idle[this.d];
        this.params = {};
    }
    getFrame(): Frame {
        return getFrame(this.currentAnimation, this.animationTime);
    }
    getHitbox(state: GameState): Rect {
        const frame = this.getFrame();
        const animationStyle = npcStyles[this.definition.style];
        const scale = animationStyle.scale || 1;
        return {
            x: this.x,
            y: this.y,
            w: (frame.content?.w || frame.w) * scale,
            h: (frame.content?.h || frame.h) * scale,
        };
    }
    onGrab(state: GameState, direction: Direction, hero: Hero) {
        this.showMessage = true;
        // Face the player while talking.
        this.d = rotateDirection(hero.d, 2);
        this.changeToAnimation('still');
        // Remove the grab action since the hero is talking to the NPC, not grabbing it.
        hero.action = null;
    }
    changeToAnimation(type: string) {
        const animationStyle = npcStyles[this.definition.style];
        const animationSet = animationStyle.animations[type] || animationStyle.animations.idle;
        const targetAnimation = animationSet[this.d];
        if (this.currentAnimation !== targetAnimation) {
            this.currentAnimation = targetAnimation;
            this.animationTime = 0;
        }
    }
    setAnimation(type: string, d: Direction, time: number = 0) {
        const animationStyle = npcStyles[this.definition.style];
        const animationSet = animationStyle.animations[type] || animationStyle.animations.idle;
        this.currentAnimation = animationSet[d];
        this.animationTime = time;
    }
    setMode(mode: string) {
        this.mode = mode;
        this.modeTime = 0;
    }
    update(state: GameState) {
        if (this.showMessage) {
            this.showMessage = false;
            if (!this.definition.dialogueKey) {
                // This text is shown if custom dialogue is set for an NPC but not defined.
                showMessage(state, this.definition.dialogue ?? '...');
                return;
            }
            const dialogueOption = selectDialogueOption(state, this.definition.dialogueKey);
            if (!dialogueOption) {
                // This text is shown if there was no valid dialogue option.
                showMessage(state, '???');
                return;
            }
            if (dialogueOption !== this.lastDialogueOption) {
                this.dialogueIndex = 0;
            }
            this.lastDialogueOption = dialogueOption;
            // Need to track if the dialogue option changed here so that we can reset index if it changes.
            showMessage(state, dialogueOption.text[this.dialogueIndex]);
            this.dialogueIndex++;
            if (this.dialogueIndex >= dialogueOption.text.length) {
                this.dialogueIndex = dialogueOption.repeatIndex ?? this.dialogueIndex - 1;
            }
            return;
        }
        npcBehaviors[this.definition.behavior]?.(state, this);
        this.animationTime += FRAME_LENGTH;
        this.modeTime += FRAME_LENGTH;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const animationStyle = npcStyles[this.definition.style];
        const frame = this.getFrame();
        const scale = animationStyle.scale || 1;
        if (this.d === 'right' && animationStyle.flipRight) {
            // Flip the frame when facing right. We may need an additional flag for this behavior
            // if we don't do it for all enemies on the right frames.
            const w = frame.content?.w ?? frame.w;
            context.save();
                context.translate((this.x | 0) + ((frame?.content?.x || 0) + w / 2) * scale, 0);
                context.scale(-1, 1);
                drawFrame(context, frame, { ...frame,
                    x: - w / 2 - (frame?.content?.x || 0) * scale,
                    y: this.y - (frame?.content?.y || 0) * scale - this.z,
                    w: frame.w * scale,
                    h: frame.h * scale,
                });
            context.restore();
        } else {
            drawFrame(context, frame, { ...frame,
                x: this.x - (frame?.content?.x || 0) * scale,
                y: this.y - (frame?.content?.y || 0) * scale - this.z,
                w: frame.w * scale,
                h: frame.h * scale,
            });
        }
        //drawFrameAt(context, frame, this);
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        const animationStyle = npcStyles[this.definition.style];
        const scale = animationStyle.scale || 1;
        const frame = this.z >= 4 ? smallShadowFrame : shadowFrame;
        drawFrame(context, frame, { ...frame,
            x: this.x + (this.w - shadowFrame.w) * scale / 2,
            y: this.y + animationStyle.shadowOffset * scale,
            w: frame.w * scale,
            h: frame.h * scale,
        });
    }
}
