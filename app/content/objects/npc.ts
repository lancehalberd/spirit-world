import { objectHash } from 'app/content/objects/objectHash';
import {
    dronDirectionalAnimations, sentryBotAnimations,
    rivalAnimations, snakeAnimations,
    omniAnimation,
} from 'app/content/enemyAnimations';
import { elementalFlameAnimation, elementalFrostAnimation, elementalStormAnimation } from 'app/content/enemies/elemental';
import { FRAME_LENGTH } from 'app/gameConstants';
import { heroAnimations } from 'app/render/heroAnimations';
import { heroSpiritAnimations } from 'app/render/heroAnimations';
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
import { lightningBeastAnimations } from 'app/content/npcs/npcAnimations'
import { shadowFrame, smallShadowFrame } from 'app/renderActor';
import { showMessage } from 'app/scriptEvents';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { isDialogueHeard, selectDialogueOption, setDialogueHeard } from 'app/utils/dialogue';
import { directionMap, rotateDirection } from 'app/utils/direction';
import { sample } from 'app/utils/index';
import { moveNPC } from 'app/utils/npc';

const [
    speechBubble,
    yellowQuest, /*redQuest*/, /*greenQuest*/, blueQuest,
    /*yellowHint*/, /*redHint*/, greenHint, /*blueHint*/,
    /*blackQuest*/,
    speechDots,
] = createAnimation('gfx/npcs/dialoguebubble.png', {w: 12, h: 12}, {cols: 11}).frames;


interface NPCStyleDefinition {
    animations: ActorAnimations
    scale?: number
    shadowOffset?: number
    flipRight?: boolean
    z?: number
    alternateRender?: (context: CanvasRenderingContext2D, state: GameState, npc: NPC) => void
}

function renderVanaraSpirit(this: void, context: CanvasRenderingContext2D, state: GameState, npc: NPC): void {
    const animationStyle = npcStyles[npc.definition.style];
    const scale = animationStyle.scale || 1;
    const animationSet = heroSpiritAnimations[npc.currentAnimationKey] || heroSpiritAnimations.idle;
    const frame = getFrame(animationSet[npc.d], npc.animationTime);
    context.save();
        context.globalAlpha *= 0.2;
        drawFrame(context, frame, { ...frame,
            x: npc.x - (frame?.content?.x || 0) * scale,
            y: npc.y - (frame?.content?.y || 0) * scale - npc.z,
            w: frame.w * scale,
            h: frame.h * scale,
        });
    context.restore();
}

export const npcStyles = {
    giantSnake: {
        animations: snakeAnimations,
        scale: 3,
        shadowOffset: 2,
        flipRight: true,
    } as NPCStyleDefinition,
    bigSpirit: {
        animations: sentryBotAnimations,
        shadowOffset: 2,
    } as NPCStyleDefinition,
    smallSpirit: {
        animations: dronDirectionalAnimations,
        z: 6,
    } as NPCStyleDefinition,
    flameSpirit: {
        animations: {idle: omniAnimation(elementalFlameAnimation)},
        z: 6,
        scale: 2,
    } as NPCStyleDefinition,
    frostSpirit: {
        animations: {idle: omniAnimation(elementalFrostAnimation)},
        z: 6,
        scale: 2,
    } as NPCStyleDefinition,
    stormSpirit: {
        animations: {idle: omniAnimation(elementalStormAnimation)},
        z: 6,
        scale: 2,
    } as NPCStyleDefinition,
    sleepingLightningBeast: {
        animations: lightningBeastAnimations,
        shadowOffset: -20,
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
        animations: rivalAnimations,
        shadowOffset: 1,
        alternateRender: renderVanaraSpirit,
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
        alternateRender: renderVanaraSpirit,
    } as NPCStyleDefinition,
    vanaraBlack: {
        animations: vanaraBlackAnimations,
        shadowOffset: 1,
        alternateRender: renderVanaraSpirit,
    } as NPCStyleDefinition,
    vanaraBlue: {
        animations: vanaraBlueAnimations,
        shadowOffset: 1,
        alternateRender: renderVanaraSpirit,
    } as NPCStyleDefinition,
    vanaraBrown: {
        animations: vanaraBrownAnimations,
        shadowOffset: 1,
        alternateRender: renderVanaraSpirit,
    } as NPCStyleDefinition,
    vanaraGold: {
        animations: vanaraGoldAnimations,
        shadowOffset: 1,
        alternateRender: renderVanaraSpirit,
    } as NPCStyleDefinition,
    vanaraGray: {
        animations: vanaraGrayAnimations,
        shadowOffset: 1,
        alternateRender: renderVanaraSpirit,
    } as NPCStyleDefinition,
    vanaraPurple: {
        animations: vanaraPurpleAnimations,
        shadowOffset: 1,
        alternateRender: renderVanaraSpirit,
    } as NPCStyleDefinition,
    vanaraRed: {
        animations: vanaraRedAnimations,
        shadowOffset: 1,
        alternateRender: renderVanaraSpirit,
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
    doesNotFall = true;
    flying = false;
    life = 1;
    vx = 0;
    vy = 0
    vz = 0;
    z = 0;
    w = 16;
    h = 16;
    groundHeight = 0;
    currentAnimationKey: string;
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
    constructor(state: GameState, definition: NPCDefinition) {
        this.definition = definition;
        this.d = definition.d || 'down';
        this.x = definition.x;
        this.y = definition.y;
        const animationStyle = npcStyles[this.definition.style];
        this.currentAnimation = animationStyle.animations.idle[this.d];
        this.z = animationStyle.z || 0;
        this.params = {};
    }
    getFrame(): Frame {
        return getFrame(this.currentAnimation, this.animationTime);
    }
    getHitbox(): Rect {
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
        const dialogue = this.getNextDialogue(state);
        if (!dialogue) {
            return;
        }
        this.showMessage = true;
        // Face the player while talking.
        this.d = rotateDirection(hero.d, 2);
        this.changeToAnimation('still');
        // Remove the grab action since the hero is talking to the NPC, not grabbing it.
        hero.action = null;
    }
    changeToAnimation(type: string) {
        this.currentAnimationKey = type;
        const animationStyle = npcStyles[this.definition.style];
        const animationSet = animationStyle.animations[type] || animationStyle.animations.idle;
        const targetAnimation = animationSet[this.d];
        if (this.currentAnimation !== targetAnimation) {
            this.currentAnimation = targetAnimation;
            this.animationTime = 0;
        }
    }
    setAnimation(type: string, d: Direction, time: number = 0) {
        this.currentAnimationKey = type;
        const animationStyle = npcStyles[this.definition.style];
        const animationSet = animationStyle.animations[type] || animationStyle.animations.idle;
        this.currentAnimation = animationSet[d];
        this.animationTime = time;
    }
    setMode(mode: string) {
        this.mode = mode;
        this.modeTime = 0;
    }
    getNextDialogue(state: GameState, advanceIndex = false): Dialogue|undefined {
        if (!this.definition.dialogueKey) {
            // custom dialogue is not used on the astral projection.
            if (state.hero.astralProjection) {
                return;
            }
            return {
                text: this.definition.dialogue ?? '...',
                dialogueIndex: this.definition.dialogueIndex ?? -1,
                dialogueType: this.definition.dialogueType,
            };
        }
        const dialogueOption = selectDialogueOption(state, this.definition.dialogueKey);
        if (!dialogueOption) {
            return;
        }
        if (dialogueOption !== this.lastDialogueOption) {
            this.dialogueIndex = 0;
        }
        this.lastDialogueOption = dialogueOption;
        const dialogue = dialogueOption.text[this.dialogueIndex];
        // This flag should only be set when we actually show this dialogue to the player.
        if (advanceIndex) {
            this.dialogueIndex++;
            if (this.dialogueIndex >= dialogueOption.text.length) {
                this.dialogueIndex = dialogueOption.repeatIndex ?? this.dialogueIndex - 1;
            }
        }
        return dialogue;
    }
    update(state: GameState) {
        if (this.showMessage) {
            this.showMessage = false;
            const dialogue = this.getNextDialogue(state, true);
            if (dialogue) {
                showMessage(state, dialogue.text);
                if (dialogue.dialogueIndex >= 0) {
                    setDialogueHeard(state, dialogue.dialogueIndex);
                }
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
            const w = (frame.content?.w ?? frame.w) * scale;
            context.save();
                context.translate((this.x | 0) + (frame?.content?.x || 0) * scale + w / 2, 0);
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
        // Dialogue indicators should not be drawn while script events are running since they are
        // distracting during cut scenes, and you cannot usually interract with NPCs while events are running.
        if (!state.scriptEvents.activeEvents?.length && !state.scriptEvents.queue?.length) {
            const dialogue = this.getNextDialogue(state);
            if (dialogue) {
                context.save();
                    if (dialogue.dialogueType === 'reminder' || isDialogueHeard(state, dialogue.dialogueIndex)) {
                        context.globalAlpha *= 0.5;
                    }
                    const w = (frame.content?.w ?? frame.w) * scale;
                    const x = this.x + w / 2, y = this.y - (frame?.content?.y || 0) * scale - this.z - 12;
                    drawFrame(context, speechBubble, {...speechBubble, x, y });
                    if (dialogue.dialogueType === 'quest') {
                        drawFrame(context, yellowQuest, {...yellowQuest, x, y });
                    } else if (dialogue.dialogueType === 'subquest') {
                        drawFrame(context, blueQuest, {...blueQuest, x, y });
                    } else if (dialogue.dialogueType === 'hint' || dialogue.dialogueType === 'reminder') {
                        drawFrame(context, blueQuest, {...greenHint, x, y });
                    } else {
                        drawFrame(context, speechDots, {...speechDots, x, y });
                    }
                context.restore();
            }
        }
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        const animationStyle = npcStyles[this.definition.style];
        const npcScale = animationStyle.scale || 1;
        const frame = this.z >= 4 ? smallShadowFrame : shadowFrame;
        const hitbox = this.getHitbox();
        const shadowScale = Math.round(hitbox.w / shadowFrame.w);
        const target = {
            x: hitbox.x + (hitbox.w - frame.w * shadowScale) / 2,
            y: hitbox.y + hitbox.h - frame.h * shadowScale + (animationStyle.shadowOffset || 0) * npcScale, // - 3 * enemy.scale,
            w: frame.w * shadowScale,
            h: frame.h * shadowScale,
        };
        drawFrame(context, frame, target);
    }
    alternateRender(context: CanvasRenderingContext2D, state: GameState) {
        const animationStyle = npcStyles[this.definition.style];
        animationStyle.alternateRender?.(context, state, this);
    }
}
objectHash.npc = NPC;

class _NPC extends NPC {}
declare global {
    export type NPCStyle = keyof typeof npcStyles;
    export type NPCBehavior = keyof typeof npcBehaviors;
    export interface NPC extends _NPC {}
}
