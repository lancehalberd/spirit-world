import { removeObjectFromArea } from 'app/content/areas';
import { createCanvasAndContext } from 'app/dom';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getState } from 'app/state';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { rectanglesOverlap } from 'app/utils/index';

import { Frame, GameState, LootObjectDefinition, LootType, ObjectInstance, ShortRectangle } from 'app/types';

export class LootGetAnimation implements ObjectInstance {
    definition = null;
    loot: LootObject | ChestObject;
    animationTime: number = 0;
    x: number;
    y: number;
    z: number;
    constructor(loot: LootObject | ChestObject) {
        this.loot = loot;
        const state = getState();
        const frame = lootFrames[this.loot.definition.lootType] || lootFrames.unknown;
        this.x = (loot.definition.type === 'chest' ? loot.x + chestOpenedFrame.w / 2 : state.hero.x + state.hero.w / 2) - frame.w / 2;
        this.y = (loot.definition.type === 'chest' ? loot.y + 8 : state.hero.y - 4);
        this.z = 8;
    }
    update(state: GameState) {
        if (this.z < 20) {
            this.z += 0.5;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime > 1000) {
            removeObjectFromArea(state.areaInstance, this);
        }
    }
    render(context, state: GameState) {
        const frame = lootFrames[this.loot.definition.lootType] || lootFrames.unknown;
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - this.z });
    }
}

export class LootObject implements ObjectInstance {
    definition: LootObjectDefinition;
    drawPriority: 'background' = 'background';
    frame: Frame;
    x: number;
    y: number;
    z: number;
    constructor(definition: LootObjectDefinition) {
        this.definition = definition;
        this.frame = lootFrames[definition.lootType] || lootFrames.unknown;
        this.x = definition.x;
        this.y = definition.y;
    }
    update(state: GameState) {
        if (state.savedState.collectedItems[this.definition.id]) {
            return;
        }
        if (rectanglesOverlap(state.hero, {...this.frame, x: this.x, y: this.y})) {
            const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
            onPickup(state, this);
            state.hero.action = 'getItem';
            state.hero.actionFrame = 0;
            state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this), 1, new LootGetAnimation(this));
            state.savedState.collectedItems[this.definition.id] = true;
        }
    }
    render(context, state: GameState) {
        if (this.definition.id !== 'drop' && state.savedState.collectedItems[this.definition.id]) {
            return;
        }
        drawFrame(context, this.frame, { ...this.frame, x: this.x, y: this.y });
    }
}

// Simple loot drop doesn't show the loot animation when collected.
export class LootDropObject extends LootObject {
    update(state: GameState) {
        if (rectanglesOverlap(state.hero, {...this.frame, x: this.x, y: this.y})) {
            const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
            onPickup(state, this);
            state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this), 1);
        }
    }
}

const chestSheet = createAnimation('gfx/zeldaChest.png', {w: 32, h: 16}).frames[0];
export const chestClosedFrame = {image: chestSheet.image, x: 0, y: 0, w: 16, h: 16};
export const chestOpenedFrame = {image: chestSheet.image, x: 16, y: 0, w: 16, h: 16};

export class ChestObject implements ObjectInstance {
    definition: LootObjectDefinition;
    drawPriority: 'background' = 'background';
    behaviors = {
        solid: true,
    };
    frame: Frame;
    x: number;
    y: number;
    z: number;
    constructor(definition: LootObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { ...chestOpenedFrame, x: this.x, y: this.y };
    }
    onGrab(state: GameState) {
        // You can only open a chest from the bottom.
        if (state.hero.d === 'up' && !state.savedState.collectedItems[this.definition.id]) {
            state.hero.action = 'getItem';
            state.hero.actionFrame = 0;
            const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
            onPickup(state, this);
            state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this) + 1, 0, new LootGetAnimation(this));
            state.savedState.collectedItems[this.definition.id] = true;
        }
    }
    update(state: GameState) {

    }
    render(context, state: GameState) {
        if (state.savedState.collectedItems[this.definition.id]) {
            drawFrame(context, chestOpenedFrame, { ...chestOpenedFrame, x: this.x, y: this.y });
        } else {
            drawFrame(context, chestClosedFrame, { ...chestClosedFrame, x: this.x, y: this.y });
        }
    }
}

function createLootFrame(color: string, letter: string, size: number = 10): Frame {
    const [toolCanvas, toolContext] = createCanvasAndContext(size, size);
    toolContext.fillStyle = color;
    toolContext.fillRect(0, 0, size, size);
    toolContext.fillStyle = 'white';
    toolContext.textBaseline = 'middle';
    toolContext.textAlign = 'center';
    toolContext.fillText(letter, size / 2, size / 2);
    return {image: toolCanvas, x: 0, y: 0, w: toolCanvas.width, h: toolCanvas.height};
}

export const lootFrames: Partial<{[key in LootType]: Frame}> = {
    catEyes: createLootFrame('red', 'E'),
    trueSight: createLootFrame('red', 'T'),
    weapon: createLootFrame('red', 'W'),
    gloves: createLootFrame('blue', 'G'),
    roll: createLootFrame('green', 'R'),
    peach: createLootFrame('orange', 'o', 6),
    peachOfImmortality: createLootFrame('orange', 'P', 16),
    peachOfImmortalityPiece: createLootFrame('orange', 'p', 8),
    unknown: createLootFrame('black', '?'),
}

export const lootEffects:Partial<{[key in LootType]: (state: GameState, loot: ChestObject | LootObject) => void}> = {
    unknown: (state: GameState, loot: ChestObject | LootObject) => {
        if (['weapon', 'bow', 'staff', 'clone', 'invisibility'].includes(loot.definition.lootType)) {
            state.hero.activeTools[loot.definition.lootType]++;
        } else if ([
            'gloves', 'roll', 'cloudSomersalt', 'charge', 'nimbusCloud', 'catEyes', 'spiritSight',
            'trueSight', 'astralProjection', 'telekinesis', 'ironSkin', 'goldMail', 'phoenixCrown',
            'waterBlessing', 'fireBlessing'
        ].includes(loot.definition.lootType)) {
            state.hero.passiveTools[loot.definition.lootType]++;
        } else if (loot.definition.lootType === 'money') {
            state.hero.money += (loot.definition.amount || 1);
        } else if (loot.definition.lootType === 'arrows') {
            state.hero.arrows += (loot.definition.amount || 1);
        } else {
            console.error('Unhandled loot type:', loot.definition.lootType);
        }
    },
    peach: (state: GameState, loot: ChestObject | LootObject) => {
        state.hero.life = Math.min(state.hero.life + 1, state.hero.maxLife);
    },
    peachOfImmortality: (state: GameState, loot: ChestObject | LootObject) => {
        state.hero.maxLife++;
        state.hero.life++;
    },
    peachOfImmortalityPiece: (state: GameState, loot: ChestObject | LootObject) => {
        state.hero.peachQuarters++;
        if (state.hero.peachQuarters >= 4) {
            state.hero.peachQuarters -= 4;
            state.hero.maxLife++;
            state.hero.life = state.hero.maxLife;
        }
    },
    roll: (state: GameState, loot: ChestObject | LootObject) => {
        if (!state.hero.passiveTools.roll) {
            state.hero.passiveTools.roll = 1;
            if (state.hero.magicRegen === 0) {
                state.hero.magicRegen = 4;
            }
        }
    },
    weapon: (state: GameState, loot: ChestObject | LootObject) => {
        state.hero.activeTools.weapon++;
        state.hero.chakrams++;
    },
}
