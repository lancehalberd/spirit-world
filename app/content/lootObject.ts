import { removeObjectFromArea } from 'app/content/areas';
import { createCanvasAndContext } from 'app/dom';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getState, saveGame, updateHeroMagicStats } from 'app/state';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { requireImage } from 'app/utils/images';
import { rectanglesOverlap } from 'app/utils/index';

import {
    ActiveTool, Frame, GameState, LootObjectDefinition,
    LootType, ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';

export class LootGetAnimation implements ObjectInstance {
    definition = null;
    loot: LootObject | ChestObject;
    animationTime: number = 0;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus = 'normal';
    constructor(loot: LootObject | ChestObject) {
        this.loot = loot;
        const state = getState();
        const frame = lootFrames[this.loot.definition.lootType] || lootFrames.unknown;
        const hero = state.hero.activeClone || state.hero;
        this.x = (loot.definition.type === 'chest' ? loot.x + chestOpenedFrame.w / 2 : hero.x + hero.w / 2) - frame.w / 2;
        this.y = (loot.definition.type === 'chest' ? loot.y + 8 : hero.y - 4);
        this.z = 8;
    }
    update(state: GameState) {
        if (this.z < 20) {
            this.z += 0.5;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime > 1000) {
            removeObjectFromArea(state, state.areaInstance, this);
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
    status: ObjectStatus;
    constructor(definition: LootObjectDefinition) {
        this.definition = definition;
        this.frame = lootFrames[definition.lootType] || lootFrames.unknown;
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status || 'normal';
    }
    update(state: GameState) {
        if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            return;
        }
        if (state.savedState.collectedItems[this.definition.id]) {
            return;
        }
        const hero = state.hero.activeClone || state.hero;
        if (rectanglesOverlap(hero, {...this.frame, x: this.x, y: this.y})) {
            const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
            onPickup(state, this);
            hero.action = 'getItem';
            hero.actionFrame = 0;
            state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this), 1, new LootGetAnimation(this));
            state.savedState.collectedItems[this.definition.id] = true;
            saveGame();
        }
    }
    render(context, state: GameState) {
        if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            return;
        }
        if (this.definition.id !== 'drop' && state.savedState.collectedItems[this.definition.id]) {
            return;
        }
        drawFrame(context, this.frame, { ...this.frame, x: this.x, y: this.y });
    }
}

// Simple loot drop doesn't show the loot animation when collected.
export class LootDropObject extends LootObject {
    update(state: GameState) {
        if (rectanglesOverlap(state.hero.activeClone || state.hero, {...this.frame, x: this.x, y: this.y})) {
            const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
            onPickup(state, this);
            removeObjectFromArea(state, state.areaInstance, this);
        }
    }
}


const [/*smallPeach*/, fullPeachFrame, /*threeQuartersPeach*/, /*halfPeach*/, /*quarterPeach*/, peachPieceFrame] =
    createAnimation('gfx/hud/peaches.png', {w: 18, h: 18}, {cols: 3, rows: 2}).frames;

const [weaponFrame] = createAnimation('gfx/chakram1.png', {w: 16, h: 16}, {x: 9}).frames;

const smallPeachFrame = {image: requireImage('gfx/hud/peaches.png'), x: 4, y: 3, w: 12, h: 12 };

const [chestClosedFrame, chestOpenedFrame] = createAnimation('gfx/tiles/chest.png',
    {w: 18, h: 20, content: {x: 1, y: 4, w: 16, h: 16}}, {cols: 2}
).frames;

export class ChestObject implements ObjectInstance {
    definition: LootObjectDefinition;
    drawPriority: 'sprites' = 'sprites';
    behaviors = {
        solid: true,
    };
    frame: Frame;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus;
    constructor(state: GameState, definition: LootObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status || 'normal';
        // Chests that have been opened are always revealed.
        if (state.savedState.collectedItems[this.definition.id]) {
            this.status = 'normal';
        }
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onGrab(state: GameState) {
        // You can only open a chest from the bottom.
        const hero = state.hero.activeClone || state.hero;
        if (hero.d === 'up' && !state.savedState.collectedItems[this.definition.id]) {
            hero.action = 'getItem';
            hero.actionFrame = 0;
            const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
            onPickup(state, this);
            state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this) + 1, 0, new LootGetAnimation(this));
            state.savedState.collectedItems[this.definition.id] = true;
            saveGame();
        }
    }
    update(state: GameState) {
        if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            return;
        }
    }
    render(context, state: GameState) {
        if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            return;
        }
        if (state.savedState.collectedItems[this.definition.id]) {
            drawFrame(context, chestOpenedFrame, {
                ...chestOpenedFrame, x: this.x - chestOpenedFrame.content.x, y: this.y - chestOpenedFrame.content.y
            });
        } else {
            drawFrame(context, chestClosedFrame, {
                ...chestClosedFrame, x: this.x - chestClosedFrame.content.x, y: this.y - chestClosedFrame.content.y
            });
        }
    }
}

function createLootFrame(color: string, letter: string, size: number = 16): Frame {
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
    bow: createLootFrame('red', 'B'),
    catEyes: createLootFrame('blue', 'E'),
    clone: createLootFrame('red', 'C'),
    invisibility: createLootFrame('red', 'I'),
    trueSight: createLootFrame('blue', 'T'),
    gloves: createLootFrame('blue', 'G'),
    roll: createLootFrame('green', 'R'),
    staff: createLootFrame('red', 'S'),
    peach: smallPeachFrame,
    peachOfImmortality: fullPeachFrame,
    peachOfImmortalityPiece: peachPieceFrame,
    unknown: createLootFrame('black', '?'),
    weapon: weaponFrame,
}

export function applyUpgrade(currentLevel: number, loot: LootObjectDefinition): number {
    // Non-progressive upgrades specify the exact level of the item. Lower level items will be ignored
    // if the player already possesses a better version.
    if (loot.level) {
        return Math.max(currentLevel, loot.level);
    }
    return currentLevel + 1;
}

export const lootEffects:Partial<{[key in LootType]: (state: GameState, loot: ChestObject | LootObject) => void}> = {
    unknown: (state: GameState, loot: ChestObject | LootObject) => {
        if (loot.definition.lootType === 'weapon') {
            state.hero.weapon = applyUpgrade(state.hero.weapon, loot.definition);
        } else if (['bow', 'staff', 'clone', 'invisibility'].includes(loot.definition.lootType)) {
            if (!state.hero.leftTool) {
                state.hero.leftTool = loot.definition.lootType as ActiveTool;
            } else if (!state.hero.rightTool) {
                state.hero.rightTool = loot.definition.lootType as ActiveTool;
            }
            state.hero.activeTools[loot.definition.lootType] = applyUpgrade(state.hero.activeTools[loot.definition.lootType], loot.definition);
        } else if ([
            'gloves', 'roll', 'charge', 'nimbusCloud', 'catEyes', 'spiritSight',
            'trueSight', 'astralProjection', 'telekinesis', 'ironSkin', 'goldMail', 'phoenixCrown',
            'waterBlessing', 'fireBlessing'
        ].includes(loot.definition.lootType)) {
            state.hero.passiveTools[loot.definition.lootType] = applyUpgrade(state.hero.passiveTools[loot.definition.lootType], loot.definition);
        } else if ([
            'fire', 'lightning', 'ice'
        ].includes(loot.definition.lootType)) {
            state.hero.elements[loot.definition.lootType] = applyUpgrade(state.hero.elements[loot.definition.lootType], loot.definition);
        }  else if ([
            'cloudBoots', 'ironBoots'
        ].includes(loot.definition.lootType)) {
            state.hero.equipment[loot.definition.lootType] = applyUpgrade(state.hero.equipment[loot.definition.lootType], loot.definition);
        } else if (loot.definition.lootType === 'money') {
            state.hero.money += (loot.definition.amount || 1);
        } else {
            console.error('Unhandled loot type:', loot.definition.lootType);
        }
        updateHeroMagicStats(state);
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
}