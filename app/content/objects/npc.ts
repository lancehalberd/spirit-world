import _ from 'lodash';

import { getAreaSize } from 'app/content/areas';
import { selectDialogueOption } from 'app/content/dialogue';
import { FRAME_LENGTH } from 'app/gameConstants';
import { moveActor } from 'app/moveActor';
import { heroAnimations } from 'app/render/heroAnimations';
import { showMessage } from 'app/render/renderMessage';
import { drawFrameAt, getFrame } from 'app/utils/animations';
import { directionMap, rotateDirection } from 'app/utils/field';

import {
    Actor, AreaInstance, GameState, DialogueOption, Direction, Hero, MovementProperties, NPCDefinition,
    ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';

export const npcStyles = {
    vanara: heroAnimations,
};

export const npcBehaviors = {
    none(state: GameState, npc: NPC) {
        // Always update to face original direction.
        npc.d = npc.definition.d || 'down';
    },
    random(state: GameState, npc: NPC) {
        if (npc.mode === 'choose' && npc.modeTime > 200) {
            npc.setMode('walk');
            npc.d = _.sample(['up', 'down', 'left', 'right']);
        }
        if (npc.mode === 'walk') {
            if (!moveNPC(state, npc, npc.speed * directionMap[npc.d][0], npc.speed * directionMap[npc.d][1], {})) {
                npc.setMode('choose');
            }
            if (npc.modeTime > 2000 && Math.random() < (npc.modeTime - 700) / 3000) {
                npc.setMode('choose');
            }
        }
    }
}

function moveNPC(state, npc: NPC, dx, dy, movementProperties: MovementProperties): boolean {
    const { section } = getAreaSize(state);
    // Don't allow the enemy to move towards the outer edges of the screen.
    if ((dx < 0 && npc.x + dx < section.x + 16)
        || (dx > 0 && npc.x + dx + npc.w > section.x + section.w - 16)
        || (dy < 0 && npc.y < section.y + 16)
        || (dy > 0 && npc.y + npc.h > section.y + section.h - 16)
    ) {
        return false;
    }
    if (npc.flying) {
        npc.x += dx;
        npc.y += dy;
        return true;
    }
    const { mx, my } = moveActor(state, npc, dx, dy, movementProperties);
    return mx !== 0 || my !== 0;
}

export type NPCStyle = keyof typeof npcStyles;
export type NPCBehavior = keyof typeof npcBehaviors;

export class NPC implements Actor, ObjectInstance  {
    area: AreaInstance;
    d: Direction;
    definition: NPCDefinition;
    drawPriority: 'sprites' = 'sprites';
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
        this.params = {};
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onGrab(state: GameState, direction: Direction, hero: Hero) {
        this.showMessage = true;
        // Face the player while talking.
        this.d = rotateDirection(hero.d, 2);
        // Remove the grab action since the hero is talking to the NPC, not grabbing it.
        hero.action = null;
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
            showMessage(state, dialogueOption.text[this.dialogueIndex], dialogueOption.progressFlag);
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
        const animations = this.mode === 'choose' ? animationStyle.idle : animationStyle.move || animationStyle.idle;
        const frame = getFrame(animations[this.d], this.animationTime);
        drawFrameAt(context, frame, this);
    }
}
