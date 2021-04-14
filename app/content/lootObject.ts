import { addObjectToArea, removeObjectFromArea } from 'app/content/areas';
import { createCanvasAndContext } from 'app/dom';
import { FRAME_LENGTH } from 'app/gameConstants';
import { showMessage } from 'app/render/renderMessage';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { getState, saveGame } from 'app/state';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { requireImage } from 'app/utils/images';
import { rectanglesOverlap } from 'app/utils/index';
import { playSound } from 'app/utils/sounds';

import {
    ActiveTool, AreaInstance, BossObjectDefinition, Frame, GameState, LootObjectDefinition,
    LootTable, LootType, ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';


function rollItem(table: LootTable) {
    const roll = Math.random() * table.totalWeight;
    let i = 0;
    while (roll > table.thresholds[i]) i++;
    return table.loot[i];
}

export function dropItemFromTable(state: GameState, area: AreaInstance, lootTable: LootTable, x: number, y: number) {
    const item = rollItem(lootTable);
    if (item) {
        const drop = new LootDropObject({
            id: 'drop',
            type: 'loot',
            lootType: item.type,
            lootAmount: item.amount || 1,
            x,
            y,
            status: 'normal'
        });
        addObjectToArea(state, state.areaInstance, drop);
        drop.x -= drop.frame.w / 2;
        drop.y -= drop.frame.h / 2;
    }
}

export class LootGetAnimation implements ObjectInstance {
    definition = null;
    loot: LootObjectDefinition | BossObjectDefinition;
    animationTime: number = 0;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus = 'normal';
    constructor(loot: LootObjectDefinition | BossObjectDefinition) {
        this.loot = loot;
        const state = getState();
        const frame = getLootFrame(loot);
        const hero = state.hero.activeClone || state.hero;
        this.x = (loot.type === 'chest' ? loot.x + chestOpenedFrame.w / 2 : hero.x + hero.w / 2) - frame.w / 2;
        this.y = (loot.type === 'chest' ? loot.y + 8 : hero.y - 4);
        this.z = 8;
    }
    update(state: GameState) {
        if (this.z < 20) {
            this.z += 0.5;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime === 1000) {
            showLootMessage(state, this.loot.lootType, this.loot.lootLevel, this.loot.lootAmount);
        } else if (this.animationTime > 1000) {
            removeObjectFromArea(state, this);
        }
    }
    render(context, state: GameState) {
        const frame = getLootFrame(this.loot);
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - this.z });
    }
}

const equipToolMessage = '{|}Press {B_MENU} to open your menu.'
    + '{|}Select a tool and press {B_TOOL} to assign it.';

function showLootMessage(state: GameState, lootType: LootType, lootLevel?: number, lootAmount?: number): void {
    switch (lootType) {
        case 'weapon':
            if (state.hero.weapon === 1) {
                return showMessage(state, 'You found the Chakram! {|} Press {B_WEAPON} to throw the Chakram.'
                    + '{|}Use it to defeat enemies or destroy some obstacles.');
            }
            return;
        case 'bow':
            if (state.hero.activeTools.bow === 1) {
                return showMessage(state, 'You found the Bow!' + equipToolMessage
                    + '{|}Press {B_TOOL} to shoot a magic arrow.'
                    + '{|}Use the bow to hit distant enemies and objects.');
            }
            return;
        case 'clone':
            if (state.hero.activeTools.clone === 1) {
                return showMessage(state, 'You learned the Clone Techique!' + equipToolMessage
                    + '{|}Press {B_TOOL} to create a clone or switch between clones.'
                    + '{|}Hold {B_TOOL} to control all clones at once!'
                    + '{|}Hold {B_PASSIVE} to make a clone explode!');
            }
            return;
        case 'invisibility':
            if (state.hero.activeTools.invisibility === 1) {
                return showMessage(state, 'You learned the Invisibility Technique!' + equipToolMessage
                    + '{|}Press {B_TOOL} to become invisible and immune to most damage.'
                    + '{|}This rapidly drains your Spirit Energy!'
                    + '{|}Press {B_TOOL} again to become visible again and recover.');
            }
            return;
        case 'staff':
            if (state.hero.activeTools.staff === 1) {
                return showMessage(state, 'You have obtained the Tree Staff!' + equipToolMessage
                    + '{|}Press {B_TOOL} to summon the staff and slam it to the ground.'
                    + '{|}You can use the staff as a weapon and a bridge!'
                    + '{|}Press {B_TOOL} again to summon the staff back to you.');
            }
            return;
        case 'gloves':
            return showMessage(state, 'You found magical bracers! {|} Now you can lift heavier objects.'
                + '{|}Face an object and use {B_PASSIVE} to try to lift it.');
        case 'roll':
            return showMessage(state, 'You learned the Mist Roll Technique!'
                + '{|}Press {B_PASSIVE} while moving to do a quick roll.'
                + '{|}You can avoid most damage while rolling and cross small gaps.'
            );
        case 'catEyes':
            return showMessage(state, 'You have been blessed with Cat Eyes!'
                + '{|}You can see much better in the dark now!'
                + '{|}Using cat eyes consumes spirit energy, stand still to recover.'
            );
        case 'spiritSight':
            return showMessage(state, 'You have been blessed with Spirit Sight!'
                + '{|}Hold {B_PASSIVE} to gaze into the Spirit World.'
                + '{|}If an object is in both the Material World and Spirit World,'
                + '{|}see what happens if you change it in the Material World!');
        case 'fire':
        case 'ice':
        case 'lightning':
            return showMessage(state, 'You found a new element!'
                + '{|}Press {B_PREV_ELEMENT}/{B_NEXT_ELEMENT} to switch elements.'
                + '{|}Changing your element has no effect for now.');
        case 'money':
            return showMessage(state, `You found ${lootAmount || 1} coins!`);
    }
}

export class LootObject implements ObjectInstance {
    area: AreaInstance;
    definition: LootObjectDefinition;
    drawPriority: 'sprites' = 'sprites';
    frame: Frame;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus;
    constructor(definition: LootObjectDefinition) {
        this.definition = definition;
        this.frame = getLootFrame(definition);
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status || 'normal';
    }
    update(state: GameState) {
        if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            return;
        }
        if (state.savedState.objectFlags[this.definition.id]) {
            return;
        }
        const hero = state.hero.activeClone || state.hero;
        if (rectanglesOverlap(hero, {...this.frame, x: this.x, y: this.y})) {
            removeObjectFromArea(state, this);
            state.savedState.objectFlags[this.definition.id] = true;
            getLoot(state, this.definition);
        }
    }
    render(context, state: GameState) {
        if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            return;
        }
        if (this.definition.id !== 'drop' && state.savedState.objectFlags[this.definition.id]) {
            return;
        }
        drawFrame(context, this.frame, { ...this.frame, x: this.x, y: this.y });
    }
    renderShadow(context, state: GameState) {
        if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            return;
        }
        if (this.definition.id !== 'drop' && state.savedState.objectFlags[this.definition.id]) {
            return;
        }
        const frame = getLootShadowFrame(this.definition);
        drawFrame(context, frame, { ...frame,
            x: this.x - (frame.w - this.frame.w) / 2,
            y: this.y - (frame.h - this.frame.h),
        });
    }
}

export function getLoot(this: void, state: GameState, definition: LootObjectDefinition | BossObjectDefinition): void {
    const onPickup = lootEffects[definition.lootType] || lootEffects.unknown;
    onPickup(state, definition);
    const hero = state.hero.activeClone || state.hero;
    hero.action = 'getItem';
    const lootAnimation = new LootGetAnimation(definition);
    addObjectToArea(state, hero.area, lootAnimation);
    hero.area.priorityObjects.push([lootAnimation]);
    saveGame();
}

// Simple loot drop doesn't show the loot animation when collected.
export class LootDropObject extends LootObject {
    alwaysReset = true;
    update(state: GameState) {
        if (rectanglesOverlap(state.hero.activeClone || state.hero, {...this.frame, x: this.x, y: this.y})) {
            const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
            onPickup(state, this.definition);
            if (this.definition.lootType === 'money') {
                playSound('getMoney');
            }
            removeObjectFromArea(state, this);
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
    area: AreaInstance;
    definition: LootObjectDefinition;
    drawPriority: 'sprites' = 'sprites';
    behaviors = {
        solid: true,
        brightness: 0.5,
        lightRadius: 12,
    };
    frame: Frame;
    linkedObject: ChestObject;
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
        if (state.savedState.objectFlags[this.definition.id]) {
            this.status = 'normal';
        }
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onGrab(state: GameState) {
        // You can only open a chest from the bottom.
        const hero = state.hero.activeClone || state.hero;
        if (hero.d === 'up' && !state.savedState.objectFlags[this.definition.id]) {
            state.savedState.objectFlags[this.definition.id] = true;
            if (this.linkedObject) {
                state.savedState.objectFlags[this.linkedObject.definition.id] = true;
            }
            getLoot(state, this.definition);
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
        if (state.savedState.objectFlags[this.definition.id]) {
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

const lootFrames: Partial<{[key in LootType]: Frame}> = {
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
    spiritSight: createLootFrame('blue', 'SE'),
    unknown: createLootFrame('black', '?'),
    weapon: weaponFrame,
};


const [
    smallShadow, bigShadow,
    /*smallLightHalf*/, /*smallDarkHalf*/,
    lightOrb, darkOrb,
    /* smallWhole*/,
    lightHalf, darkHalf, wholeCoin
] =
    createAnimation('gfx/hud/money.png', {w: 16, h: 16}, {cols: 10}).frames;
export function getLootFrame({lootType, lootLevel, lootAmount}:
    {lootType: LootType, lootLevel?: number, lootAmount?: number}
): Frame {
    if (lootType === 'money') {
        if (!lootAmount || lootAmount === 1) {
            return lightOrb;
        }
        if (lootAmount === 5) {
            return darkOrb;
        }
        if (lootAmount === 10) {
            return lightHalf;
        }
        if (lootAmount === 20) {
            return darkHalf;
        }
        return wholeCoin;
    }
    return lootFrames[lootType] || lootFrames.unknown;
}
function getLootShadowFrame({lootType, lootLevel, lootAmount}:
    {lootType: LootType, lootLevel?: number, lootAmount?: number}
): Frame {
    if (lootType === 'money') {
        if (!lootAmount || lootAmount <= 5) {
            return smallShadow;
        }
        return bigShadow;
    }
    if (lootType === 'peach') {
        return smallShadow;
    }
    return bigShadow;
}

export function applyUpgrade(currentLevel: number, loot: LootObjectDefinition | BossObjectDefinition): number {
    // Non-progressive upgrades specify the exact level of the item. Lower level items will be ignored
    // if the player already possesses a better version.
    if (loot.lootLevel) {
        return Math.max(currentLevel, loot.lootLevel);
    }
    return currentLevel + 1;
}

export const lootEffects:Partial<{[key in LootType]: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => void}> = {
    unknown: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => {
        if (loot.lootType === 'weapon') {
            state.hero.weapon = applyUpgrade(state.hero.weapon, loot);
        } else if (['bow', 'staff', 'clone', 'invisibility'].includes(loot.lootType)) {
            if (!state.hero.leftTool) {
                state.hero.leftTool = loot.lootType as ActiveTool;
            } else if (!state.hero.rightTool) {
                state.hero.rightTool = loot.lootType as ActiveTool;
            }
            state.hero.activeTools[loot.lootType] = applyUpgrade(state.hero.activeTools[loot.lootType], loot);
        } else if ([
            'gloves', 'roll', 'charge', 'nimbusCloud', 'catEyes', 'spiritSight',
            'trueSight', 'astralProjection', 'telekinesis', 'ironSkin', 'goldMail', 'phoenixCrown',
            'waterBlessing', 'fireBlessing'
        ].includes(loot.lootType)) {
            state.hero.passiveTools[loot.lootType] = applyUpgrade(state.hero.passiveTools[loot.lootType], loot);
        } else if ([
            'fire', 'lightning', 'ice'
        ].includes(loot.lootType)) {
            state.hero.elements[loot.lootType] = applyUpgrade(state.hero.elements[loot.lootType], loot);
        }  else if ([
            'cloudBoots', 'ironBoots'
        ].includes(loot.lootType)) {
            state.hero.equipment[loot.lootType] = applyUpgrade(state.hero.equipment[loot.lootType], loot);
        } else if (loot.lootType === 'money') {
            state.hero.money += (loot.lootAmount || 1);
        } else {
            console.error('Unhandled loot type:', loot.lootType);
        }
        updateHeroMagicStats(state);
    },
    peach: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => {
        state.hero.life = Math.min(state.hero.life + 1, state.hero.maxLife);
    },
    peachOfImmortality: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => {
        state.hero.maxLife++;
        state.hero.life++;
    },
    peachOfImmortalityPiece: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => {
        state.hero.peachQuarters++;
        if (state.hero.peachQuarters >= 4) {
            state.hero.peachQuarters -= 4;
            state.hero.maxLife++;
            state.hero.life = state.hero.maxLife;
        }
    },
}
