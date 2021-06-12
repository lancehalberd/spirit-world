import { addObjectToArea, removeObjectFromArea } from 'app/content/areas';
import { createCanvasAndContext } from 'app/dom';
import { FRAME_LENGTH } from 'app/gameConstants';
import { showMessage } from 'app/render/renderMessage';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { getState, saveGame } from 'app/state';
import { createAnimation, drawFrame, drawFrameAt, getFrameHitBox } from 'app/utils/animations';
import { requireImage } from 'app/utils/images';
import { rectanglesOverlap } from 'app/utils/index';
import { playSound } from 'app/utils/sounds';

import {
    ActiveTool, AreaInstance, BossObjectDefinition, DialogueLootDefinition,
    DungeonInventory, Frame, FrameDimensions, GameState, LootObjectDefinition,
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
        addObjectToArea(state, area, drop);
        drop.x -= (drop.frame.content?.w || drop.frame.w) / 2;
        drop.y -= (drop.frame.content?.h || drop.frame.h) / 2;
    }
}

export class LootGetAnimation implements ObjectInstance {
    definition = null;
    loot: LootObjectDefinition | BossObjectDefinition | DialogueLootDefinition;
    animationTime: number = 0;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus = 'normal';
    constructor(loot: LootObjectDefinition | BossObjectDefinition | DialogueLootDefinition) {
        this.loot = loot;
        const state = getState();
        const frame = getLootFrame(loot);
        const hero = state.hero.activeClone || state.hero;
        if (loot.type === 'bigChest') {
            this.x = loot.x + chestOpenedFrame.w - frame.w / 2;
            this.y = loot.y + 16;
        } else if (loot.type === 'chest') {
            this.x = loot.x + chestOpenedFrame.w / 2 - frame.w / 2;
            this.y = loot.y + 8;
        } else {
            this.x = hero.x + hero.w / 2 - frame.w / 2;
            this.y = hero.y - 4;
        }
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

const equipBootsMessage = '{|}Press {B_MENU} to open your menu.'
    + '{|}Select boots and press {B_WEAPON} to equip them.'
    + '{|}Press {B_WEAPON} again to unequip them.';

const equipElementMessage = '{|}Press {B_PREVIOUS_ELEMENT}/{B_NEXT_ELEMENT} to switch elements.'
    + '{|}The equipped element will be applied any time you charge an attack.';

function showLootMessage(state: GameState, lootType: LootType, lootLevel?: number, lootAmount?: number): void {
    switch (lootType) {
        case 'ironBoots':
            return showMessage(state, 'You found Iron Boots!' + equipBootsMessage
                + '{|}Use the Iron Boots to explore under water but watch your breath!'
                + '{|}Iron boots slow you down but keep you from slipping and being knocked back.');
        case 'bigKey':
            return showMessage(state, 'You found a special key!'
                + '{|}This key can open all the special locks in this area!');
        case 'smallKey':
            if (!state.savedState.objectFlags.readSmallKeyMessage) {
                state.savedState.objectFlags.readSmallKeyMessage = true;
                return showMessage(state, 'You found a small key!'
                    + '{|}Use it to unlock one locked door.');
            }
            return;
        case 'peachOfImmortality':
            if (!state.hero.passiveTools.catEyes) {
                return showMessage(state, `You ate a Golden Peach!
                    {|} Your health has increased and you feel a strange energy...{catEyes}`);
            }
            return showMessage(state, `You ate a Golden Peach!
                {|} Your maximum health has increased!`);
        case 'peachOfImmortalityPiece':
            if (state.hero.peachQuarters === 1) {
                return showMessage(state, 'You found a golden peach slice!{|}Find three more to increase your health!');
            }
            if (state.hero.peachQuarters === 2) {
                return showMessage(state, 'You found a golden peach slice!{|}Find two more to increase your health!');
            }
            if (state.hero.peachQuarters === 3) {
                return showMessage(state, 'You found a golden peach slice!{|}Find one more to increase your health!');
            }
            // Finding the 4th slice grants a full peach of immortality.
            return showMessage(state, 'You found a golden peach slice!{peachOfImmortality}');
        case 'charge':
            if (state.hero.passiveTools.charge === 1) {
                return showMessage(state, `You have learned to Channel Spirit Energy!
                    {|}Press and hold {B_WEAPON} to channel your Spirit Energy into the Chakram,
                    then release it to unleash a powerful attack!
                    {|}Press and hold {B_TOOL} to channel your Spirit Energy into your Tools to make them more powerful.
                    {|}You can even hold {B_PASSIVE} when picking up an object to channel Spirit Energy into them!
                `);
            }
            if (state.hero.passiveTools.charge === 2) {
                return showMessage(state, `You have learned to Overcharge objects!
                    {|}Unleash even more powerful attacks by charging your Chakram and Tools further.`);
            }
            return;
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
                    + '{|}This technique rapidly drains your Spirit Energy!'
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
                + '{|}This strange energy allows you to see much better in the dark.'
                + '{|}Using cat eyes consumes spirit energy, stand still to recover.'
            );
        case 'spiritSight':
            return showMessage(state, 'You have been blessed with Spirit Sight!'
                + '{|}Hold {B_PASSIVE} to gaze into the Spirit World.'
                + '{|}If an object is in both the Material World and Spirit World,'
                + '{|}see what happens if you change it in the Material World!');
        case 'astralProjection':
            return showMessage(state, 'You have found the Summoner\'s Circlet!'
                + '{|}Hold {B_PASSIVE} to gaze into the Spirit World.'
                + '{|}While looking into the Spirit World, use {B_UP} to move your Astral Body.'
                + '{|}Your Astral Body can touch the Spirit World.'
                + '{|}In your Astral Body, press {B_WEAPON} to grab or pickup objects.');
        case 'teleportation':
            return showMessage(state, 'You have learned Teleportation!'
                + '{|}Move your Astral Body away from you in the Sprit World'
                + '{|}Press {B_TOOL} to teleport your Real Body to your Astral Body.'
                + '{|}Teleportation consumes spirit energy, stand still to recover'
                + '{|}Use teleportation to move past obstacles in the Real World.');
        case 'fire':
            return showMessage(state, 'You have received the Fire Element!'
                + equipElementMessage
                + '{|}Fire can be used to light torches and melt ice.');
        case 'ice':
            return showMessage(state, 'You have received the Ice Element!'
                + equipElementMessage
                + '{|}Ice can be used to freeze objects and enemies.');
        case 'lightning':
            return showMessage(state, 'You have received the Lightning Element!'
                + equipElementMessage
                + '{|}Lightning stuns enemies and activates some objects.');
        case 'fireBlessing':
            return showMessage(state, 'You have received the Blessing of Fire!'
                + 'Burning hot rooms will no longer damage you.');
        case 'waterBlessing':
            return showMessage(state, 'You have received the Blessing of Water!'
                + 'Being underwater will no longer drain your spirit energy or damage you.');
        case 'bow':
            if (state.hero.activeTools.bow === 1) {
                return showMessage(state, 'You found the Bow!' + equipToolMessage
                    + '{|}Press {B_TOOL} to shoot a magic arrow.'
                    + '{|}Use the bow to hit distant enemies and objects.');
            }
            return;
        case 'money':
            return showMessage(state, `You found ${lootAmount || 1} Jade!`);
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
        if (rectanglesOverlap(hero, getFrameHitBox(this.frame, this))) {
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
        drawFrameAt(context, this.frame, { x: this.x, y: this.y });
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
            x: this.x - (frame.w - (this.frame.content?.w || this.frame.w)) / 2,
            y: this.y - (frame.h - (this.frame.content?.h || this.frame.h)),
        });
    }
}

export function getLoot(this: void, state: GameState, definition: LootObjectDefinition | BossObjectDefinition | DialogueLootDefinition): void {
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
        if (this.area === state.areaInstance && rectanglesOverlap(state.hero.activeClone || state.hero, getFrameHitBox(this.frame, this))) {
            const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
            onPickup(state, this.definition);
            if (this.definition.lootType === 'money') {
                playSound('getMoney');
            }
            removeObjectFromArea(state, this);
        }
    }
}


const [/*smallPeach*/, /*fullPeachFrame*/, /*threeQuartersPeach*/, /*halfPeach*/, /*quarterPeach*/, peachPieceFrame] =
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
        if (this.isOpen(state)) {
            this.status = 'normal';
        }
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    isOpen(state: GameState): boolean {
        return (state.savedState.objectFlags[this.definition.id] || this.definition.lootType === 'empty');
    }
    onGrab(state: GameState) {
        // You can only open a chest from the bottom.
        const hero = state.hero.activeClone || state.hero;
        if (hero.d === 'up' && !this.isOpen(state)) {
            state.savedState.objectFlags[this.definition.id] = true;
            if (this.linkedObject) {
                state.savedState.objectFlags[this.linkedObject.definition.id] = true;
            }
            getLoot(state, this.definition);
        }
    }
    render(context, state: GameState) {
        if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            return;
        }
        if (this.isOpen(state)) {
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

export class BigChest extends ChestObject implements ObjectInstance {
    area: AreaInstance;
    definition: LootObjectDefinition;
    drawPriority: 'sprites' = 'sprites';
    behaviors = {
        solid: true,
        brightness: 1,
        lightRadius: 24,
    };
    frame: Frame;
    linkedObject: BigChest;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus;
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 32, h: 32 };
    }
    onGrab(state: GameState) {
        // You can only open a chest from the bottom.
        const hero = state.hero.activeClone || state.hero;
        if (hero.d !== 'up' || this.isOpen(state)) {
            return;
        }
        if (!state.savedState.dungeonInventories[state.location.zoneKey]?.bigKey) {
            showMessage(state, 'You need a special key to open this chest.');
            return;
        }
        state.savedState.objectFlags[this.definition.id] = true;
        if (this.linkedObject) {
            state.savedState.objectFlags[this.linkedObject.definition.id] = true;
        }
        getLoot(state, this.definition);
    }
    render(context, state: GameState) {
        if (this.isOpen(state)) {
            drawFrame(context, chestOpenedFrame, {
                x: this.x - chestOpenedFrame.content.x, y: this.y - chestOpenedFrame.content.y,
                w: chestOpenedFrame.w * 2, h: chestOpenedFrame.h * 2,
            });
        } else {
            drawFrame(context, chestClosedFrame, {
                x: this.x - chestClosedFrame.content.x, y: this.y - chestClosedFrame.content.y,
                w: chestClosedFrame.w * 2, h: chestClosedFrame.h * 2,
            });
        }
    }
}

function createLootFrame(color: string, letter: string): Frame {
    const size = 16;
    const [toolCanvas, toolContext] = createCanvasAndContext(size, size);
    toolContext.fillStyle = color;
    toolContext.fillRect(0, 0, size, size);
    toolContext.fillStyle = 'white';
    toolContext.textBaseline = 'middle';
    toolContext.textAlign = 'center';
    toolContext.fillText(letter, size / 2, size / 2);
    return {image: toolCanvas, x: 0, y: 0, w: toolCanvas.width, h: toolCanvas.height};
}

export const [
    /*fullPeachFrame*/, goldPeachFrame,
    keyOutlineFrame, bigKeyOutlineFrame,
    bowOutlineFrame, mistScrollFrame,
    spiritSightFrame,
    catEyes,
    twoCloneFrame, threeCloneFrame, /* fourCloneFrame */,
    invisibilityFrame,
    /* bracelet */, gloveFrame,
    normalBoots, ironBoots, cloudBoots,
    circlet, phoenixCrown,
    teleportFrame, /* teleportFrame2 */,
    treeStaff, towerStaff,
] = createAnimation('gfx/hud/icons.png',
    {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}, {cols: 23}
).frames;
export const [
    /* container */, fireElement, iceElement, lightningElement, neutralElement, /* elementShine */
] = createAnimation('gfx/hud/elementhud.png',
    {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}}, {cols: 6}
).frames;


const lootFrames: Partial<{[key in LootType]: Frame}> = {
    smallKey: keyOutlineFrame,
    fire: fireElement,
    ice: iceElement,
    lightning: lightningElement,
    // Summoner's Circlet.
    astralProjection: circlet,
    phoenixCrown: phoenixCrown,
    bigKey: bigKeyOutlineFrame,
    bow: bowOutlineFrame,
    catEyes: catEyes,
    charge: neutralElement,
    clone: twoCloneFrame,
    invisibility: invisibilityFrame,
    trueSight: createLootFrame('blue', 'TS'),
    gloves: gloveFrame,
    roll: mistScrollFrame,
    staff: treeStaff,
    peach: smallPeachFrame,
    peachOfImmortality: goldPeachFrame,
    peachOfImmortalityPiece: peachPieceFrame,
    // Spirit Eyes
    spiritSight: spiritSightFrame,
    teleportation: teleportFrame,
    unknown: createLootFrame('black', '?'),
    empty: createLootFrame('grey', '--'),
    ironBoots: ironBoots,
    cloudBoots: cloudBoots,
    fireBlessing: createLootFrame('red', 'Fir'),
    waterBlessing: createLootFrame('blue', 'Wat'),
    weapon: weaponFrame,
};

const smallMoneyGeometry: FrameDimensions = {w: 16, h: 16, content:{ x: 4, y: 8, w: 8, h: 8}};
const largeMoneyGeometry: FrameDimensions = {w: 16, h: 16, content:{ x: 2, y: 4, w: 12, h: 12}};
const [
    smallShadow, bigShadow,
    /*smallLightHalf*/, /*smallDarkHalf*/,
    lightOrb, darkOrb,
    /* smallWhole*/,
] = createAnimation('gfx/hud/money.png', smallMoneyGeometry, {cols: 7}).frames;
const [
    lightHalf, darkHalf, wholeCoin
] = createAnimation('gfx/hud/money.png', largeMoneyGeometry, {x: 7, cols: 3}).frames;
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

function getDungeonInventory(state: GameState): DungeonInventory {
    return state.savedState.dungeonInventories[state.location.zoneKey] || {
        bigKey: false,
        map: false,
        smallKeys: 0,
    };
}
function updateDungeonInventory(state: GameState, inventory: DungeonInventory): void {
    state.savedState.dungeonInventories[state.location.zoneKey] = inventory;
    saveGame();
}

export const lootEffects:Partial<{[key in LootType]: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition | DialogueLootDefinition) => void}> = {
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
            'trueSight', 'astralProjection', 'teleportation', 'ironSkin', 'goldMail', 'phoenixCrown',
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
    bigKey: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => {
        const inventory = getDungeonInventory(state);
        inventory.bigKey = true;
        updateDungeonInventory(state, inventory);
    },
    map: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => {
        const inventory = getDungeonInventory(state);
        inventory.map = true;
        updateDungeonInventory(state, inventory);
    },
    smallKey: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => {
        const inventory = getDungeonInventory(state);
        inventory.smallKeys++;
        updateDungeonInventory(state, inventory);
    },
    peach: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => {
        state.hero.life = Math.min(state.hero.life + 1, state.hero.maxLife);
    },
    peachOfImmortality: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => {
        state.hero.maxLife++;
        state.hero.life = state.hero.maxLife;
    },
    peachOfImmortalityPiece: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition) => {
        state.hero.peachQuarters++;
        if (state.hero.peachQuarters >= 4) {
            state.hero.peachQuarters -= 4;
            // You will gain the full peach from the dialogue effect.
        }
    },
}
