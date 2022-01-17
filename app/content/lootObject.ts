import { addEffectToArea, addObjectToArea, enterLocation, refreshAreaLogic, removeEffectFromArea, removeObjectFromArea } from 'app/content/areas';
import { getObjectStatus } from 'app/content/objects';
import { createCanvasAndContext } from 'app/dom';
import { CANVAS_WIDTH, CANVAS_HEIGHT, FRAME_LENGTH } from 'app/gameConstants';
import { showMessage } from 'app/render/renderMessage';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { getState, saveGame } from 'app/state';
import { createAnimation, drawFrame, drawFrameAt, getFrameHitBox } from 'app/utils/animations';
import { requireImage } from 'app/utils/images';
import { rectanglesOverlap } from 'app/utils/index';
import { playSound } from 'app/musicController';

import {
    ActiveTool, AreaInstance, BossObjectDefinition, DialogueLootDefinition,
    DungeonInventory, Frame, FrameDimensions, GameState, LootObjectDefinition,
    LootTable, LootType, ObjectInstance, ObjectStatus, Rect, TileBehaviors,
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
        const drop = new LootDropObject(state, {
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
    frame: Frame;
    loot: LootObjectDefinition | BossObjectDefinition | DialogueLootDefinition;
    animationTime: number = 0;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus = 'normal';
    constructor(loot: LootObjectDefinition | BossObjectDefinition | DialogueLootDefinition) {
        this.loot = loot;
        const state = getState();
        this.frame = getLootFrame(state, loot);
        const hero = state.hero.activeClone || state.hero;
        if (loot.type === 'bigChest') {
            this.x = loot.x + chestOpenedFrame.w - this.frame.w / 2;
            this.y = loot.y + 16;
        } else if (loot.type === 'chest') {
            this.x = loot.x + chestOpenedFrame.w / 2 - this.frame.w / 2;
            this.y = loot.y + 8;
        } else {
            this.x = hero.x + hero.w / 2 - this.frame.w / 2;
            this.y = hero.y - 4;
        }
        this.z = 8;
    }
    update(state: GameState) {
        if (this.z < 20) {
            this.z += 0.5;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime === 100) {
            if (this.loot.lootType === 'empty' || this.loot.lootType === 'unknown') {

            } else if (this.loot.lootType === 'peachOfImmortalityPiece' || this.loot.lootType === 'money'
                || this.loot.lootType === 'smallKey' || this.loot.lootType === 'map' || this.loot.lootType === 'peach'
            ) {
                playSound('smallSuccessChime');
            } else {
                playSound('bigSuccessChime');
            }
        }
        if (this.animationTime === 1000) {
            showLootMessage(state, this.loot.lootType, this.loot.lootLevel, this.loot.lootAmount);
        } else if (this.animationTime > 1000) {
            removeEffectFromArea(state, this);
        }
    }
    render(context, state: GameState) {
        const frame = this.frame;
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - this.z });
    }
}

const equipToolMessage = '{|}Press [B_MENU] to open your menu.'
    + '{|}Select a tool and press [B_TOOL] to assign it.';

const equipBootsMessage = '{|}Press [B_MENU] to open your menu.'
    + '{|}Select boots and press [B_WEAPON] to equip them.'
    + '{|}Press [B_WEAPON] again to unequip them.';

function getEquipElementMessage(state: GameState) {
    if (state.isUsingKeyboard) {
        return '{|}Press [B_MENU] to open your menu.'
            + '{|}Select an element and press [B_WEAPON] to equip it.'
            + '{|}Press [B_WEAPON] again to unequip the element.'
            + '{|}The equipped element will be applied any time you charge an attack.';
    }
    return '{|}Press [B_PREVIOUS_ELEMENT]/[B_NEXT_ELEMENT] to switch elements.'
        + '{|}The equipped element will be applied any time you charge an attack.';
}

function showLootMessage(state: GameState, lootType: LootType, lootLevel?: number, lootAmount?: number): void {
    // Skip instructions during the randomizer.
    if (state.randomizer?.seed) {
        if (lootType === 'peachOfImmortalityPiece' && state.hero.peachQuarters === 0) {
            showMessage(state, '{item:peachOfImmortality}');
            return;
        }
        if (lootType === 'peachOfImmortality' && !state.hero.passiveTools.catEyes) {
            showMessage(state, '{item:catEyes}');
            return;
        }
        return;
    }
    if (lootType === 'spiritPower') {
        // showLootMessage is run after the upgrade is already applied, so we check what the highest level
        // spirit power the user has and show that message.
        if (state.hero.passiveTools.teleportation) {
            lootType = 'teleportation';
        } else if (state.hero.passiveTools.astralProjection) {
            lootType = 'astralProjection';
        } else {
            lootType = 'spiritSight';
        }
    }
    switch (lootType) {
        case 'cloudBoots':
            return showMessage(state, 'You found Cloud Boots!' + equipBootsMessage
                + '{|}Use the Cloud Boots to glide over dangerous ground and even walk in the clouds!'
                + '{|}Cloud Boots allow you to move faster but with less control.');
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
                    {|} Your health has increased and you feel a strange energy...{wait:200}{item:catEyes}`);
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
            return showMessage(state, 'You found a golden peach slice!{item:peachOfImmortality}');
        case 'charge':
            if (state.hero.passiveTools.charge === 1) {
                return showMessage(state, `You have learned to Channel Spirit Energy!
                    {|}Press and hold [B_WEAPON] to channel your Spirit Energy into the Chakram,
                    then release it to unleash a powerful attack!
                    {|}Press and hold [B_TOOL] to channel your Spirit Energy into your Tools to make them more powerful.
                    {|}You can even hold [B_PASSIVE] when picking up an object to channel Spirit Energy into them!
                `);
            }
            if (state.hero.passiveTools.charge === 2) {
                return showMessage(state, `You have learned to Overcharge objects!
                    {|}Unleash even more powerful attacks by charging your Chakram and Tools further.`);
            }
            return;
        case 'weapon':
            if (state.hero.weapon === 1) {
                return showMessage(state, 'You found the Chakram! {|} Press [B_WEAPON] to throw the Chakram.'
                    + '{|}Use it to defeat enemies or destroy some obstacles.');
            }
            return;
        case 'bow':
            if (state.hero.activeTools.bow === 1) {
                return showMessage(state, 'You found the Bow!' + equipToolMessage
                    + '{|}Press [B_TOOL] to shoot a magic arrow.'
                    + '{|}Use the bow to hit distant enemies and objects.');
            }
            return;
        case 'clone':
            if (state.hero.activeTools.clone === 1) {
                return showMessage(state, 'You learned the Clone Techique!' + equipToolMessage
                    + '{|}Press [B_TOOL] to create a clone or switch between clones.'
                    + '{|}Hold [B_TOOL] to control all clones at once!'
                    + '{|}Hold [B_MEDITATE] to make a clone explode!');
            }
            return;
        case 'cloak':
            if (state.hero.activeTools.cloak === 1) {
                return showMessage(state, 'You have obtained the Spirit Cloak!' + equipToolMessage
                    + '{|}Press [B_TOOL] to create a Spirit Barrier around you.'
                    + '{|}The barrier will damage enemies and reflect projectiles at the cost of your Spirit Energy!'
                    + '{|}Your Spirit Energy will regenerate more slowly while the barrier is on,'
                    + '{|}and the barrier will fail if you run out of Spirit Energy.'
                    + '{|}Press [B_TOOL] again to deactivate the barrier.');
            }
            if (state.hero.activeTools.cloak === 2) {
                return showMessage(state, 'You have obtained the Invisibility Cloak!' + equipToolMessage
                    + '{|}Now your Spirit Barrier will also make you invisible.'
                    + '{|}Invisibility makes you undetectable and allows you to pass through traps!');
            }
            return;
        case 'staff':
            if (state.hero.activeTools.staff === 2) {
                // Refresh the location to hide the tower.
                enterLocation(state, state.location);
                return showMessage(state, 'You have obtained the Tower Staff!!');
            }
            if (state.hero.activeTools.staff === 1) {
                return showMessage(state, 'You have obtained the Tree Staff!' + equipToolMessage
                    + '{|}Press [B_TOOL] to summon the staff and slam it to the ground.'
                    + '{|}You can use the staff as a weapon and a bridge!'
                    + '{|}Press [B_TOOL] again to summon the staff back to you.');
            }
            return;
        case 'gloves':
            return showMessage(state, 'You found magical bracers! {|} Now you can lift heavier objects.'
                + '{|}Face an object and use [B_PASSIVE] to try to lift it.');
        case 'roll':
            return showMessage(state, 'You learned the Mist Roll Technique!'
                + '{|}Press [B_ROLL] to do a quick roll forward.'
                + '{|}You can avoid most damage while rolling and cross small gaps.'
            );
        case 'catEyes':
            return showMessage(state, 'You have been blessed with Cat Eyes!'
                + '{|}This strange energy allows you to see much better in the dark.'
                + '{|}Using cat eyes consumes spirit energy, stand still to recover.'
            );
        case 'spiritSight':
            return showMessage(state, 'You have been blessed with Spirit Sight!'
                + '{|}Hold [B_MEDITATE] to gaze into the Spirit World.'
                + '{|}If an object is in both the Material World and Spirit World,'
                + '{|}see what happens if you change it in the Material World!');
        case 'astralProjection':
            return showMessage(state, 'You have found the Summoner\'s Circlet!'
                + '{|}Hold [B_MEDITATE] to gaze into the Spirit World.'
                + '{|}While looking into the Spirit World, use [B_UP] to move your Astral Body.'
                + '{|}Your Astral Body can touch the Spirit World.'
                + '{|}In your Astral Body, press [B_PASSIVE] to grab or pickup objects.');
        case 'teleportation':
            return showMessage(state, 'You have learned Teleportation!'
                + '{|}Move your Astral Body away from you in the Sprit World'
                + '{|}Press [B_TOOL] to teleport your Real Body to your Astral Body.'
                + '{|}Teleportation consumes spirit energy, stand still to recover'
                + '{|}Use teleportation to move past obstacles in the Real World.');
        case 'fire':
            return showMessage(state, 'You have received the Fire Element!'
                + getEquipElementMessage(state)
                + '{|}Fire can be used to light torches and melt ice.');
        case 'ice':
            return showMessage(state, 'You have received the Ice Element!'
                + getEquipElementMessage(state)
                + '{|}Ice can be used to freeze objects and enemies.');
        case 'lightning':
            return showMessage(state, 'You have received the Lightning Element!'
                + getEquipElementMessage(state)
                + '{|}Lightning stuns enemies and activates some objects.');
        case 'fireBlessing':
            return showMessage(state, 'You have absorbed a Cooling Spirit!'
                + '{|}Burning hot rooms will no longer damage you.'
                + '{|}You will also take half damage from fire.');
        case 'waterBlessing':
            return showMessage(state, 'You have received the Blessing of Water!'
                + '{|}Being underwater will no longer drain your spirit energy or damage you.'
                + '{|}You will also take half damage from ice.');
        case 'bow':
            if (state.hero.activeTools.bow === 1) {
                return showMessage(state, 'You found the Bow!' + equipToolMessage
                    + '{|}Press [B_TOOL] to shoot a magic arrow.'
                    + '{|}Use the bow to hit distant enemies and objects.');
            }
            return;
        case 'money':
            return showMessage(state, `You found ${lootAmount || 1} Jade!`);
    }
}

export class LootObject implements ObjectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors;
    definition: LootObjectDefinition;
    drawPriority: 'sprites' = 'sprites';
    frame: Frame;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus;
    time = 0;
    constructor(state: GameState, definition: LootObjectDefinition) {
        this.definition = definition;
        this.frame = getLootFrame(state, definition);
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status || 'normal';
        if (getObjectStatus(state, this.definition)) {
            this.status = 'gone';
        }
        this.behaviors = { brightness: 0, lightRadius: 0 };
    }
    getHitbox(state: GameState) {
        return getFrameHitBox(this.frame, this);
    }
    update(state: GameState) {
        this.time += FRAME_LENGTH;
        this.behaviors.brightness = Math.min(1, this.time / 2000);
        this.behaviors.lightRadius = 24 * Math.min(1, this.time / 1000) + 2 * Math.sin(this.time / 500);
        if (this.status === 'hidden' || this.status === 'hiddenEnemy'
            || this.status === 'hiddenSwitch' || this.status === 'gone'
        ) {
            return;
        }
        if (this.x + 16 > state.camera.x && this.x < state.camera.x + CANVAS_WIDTH
            && this.y + 16 > state.camera.y && this.y < state.camera.y + CANVAS_HEIGHT
            && this.definition.lootType === 'empty'
        ) {
            state.savedState.objectFlags[this.definition.id] = true;
            this.status = 'gone';
            return;
        }
        const hero = state.hero.activeClone || state.hero;
        if (rectanglesOverlap(hero, getFrameHitBox(this.frame, this))) {
            removeObjectFromArea(state, this);
            if (this.definition.id && this.definition.id !== 'drop') {
                state.savedState.objectFlags[this.definition.id] = true;
            }
            getLoot(state, this.definition);
        }
    }
    render(context, state: GameState) {
        if (this.status === 'hidden' || this.status === 'hiddenEnemy'
            || this.status === 'hiddenSwitch' || this.status === 'gone'
        ) {
            return;
        }
        drawFrameAt(context, this.frame, { x: this.x, y: this.y });
    }
    renderShadow(context, state: GameState) {
        if (this.status === 'hidden' || this.status === 'hiddenEnemy'
            || this.status === 'hiddenSwitch' || this.status === 'gone'
        ) {
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
    const hero = state.hero.activeClone || state.hero;
    hero.action = 'getItem';
    const lootAnimation = new LootGetAnimation(definition);
    // Apply the pickup after creating the loot animation so that it uses the correct graphic for progressive items.
    onPickup(state, definition);
    addEffectToArea(state, hero.area, lootAnimation);
    hero.area.priorityObjects.push([lootAnimation]);
    // Refresh the area so that the guardian NPC moves to the correct location now that the boss is defeated.
    refreshAreaLogic(state, state.areaInstance);
    refreshAreaLogic(state, state.alternateAreaInstance);
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
            // Make sure empty chese are recorded as opened for the randomizer, since some logic
            // depends on whether a chest was opened yet (cocoon small key chest, for example).
            /*if (this.definition.id && !state.savedState.objectFlags[this.definition.id]) {
                state.savedState.objectFlags[this.definition.id] = true;
                saveGame();
            }*/
        }
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    isOpen(state: GameState): boolean {
        return (!!state.savedState.objectFlags[this.definition.id] || this.definition.lootType === 'empty');
    }
    onGrab(state: GameState) {
        // You can only open a chest from the bottom.
        const hero = state.hero.activeClone || state.hero;
        if (this.definition.id && hero.d === 'up' && !this.isOpen(state)) {
            state.savedState.objectFlags[this.definition.id] = true;
            if (this.linkedObject?.definition?.id) {
                state.savedState.objectFlags[this.linkedObject.definition.id] = true;
            }
            getLoot(state, this.definition);
        }
    }
    update(state: GameState) {
        // Make sure empty chese are recorded as opened for the randomizer, since some logic
        // depends on whether a chest was opened yet (cocoon small key chest, for example).
        if (this.definition.id && !state.savedState.objectFlags[this.definition.id] && this.isOpen(state)) {
            if (this.x + 16 > state.camera.x && this.x < state.camera.x + CANVAS_WIDTH
                && this.y + 16 > state.camera.y && this.y < state.camera.y + CANVAS_HEIGHT
                && this.definition.lootType === 'empty'
            ) {
                state.savedState.objectFlags[this.definition.id] = true;
                // Refresh the area so that the guardian NPC moves to the correct location now that the boss is defeated.
                refreshAreaLogic(state, state.areaInstance);
                refreshAreaLogic(state, state.alternateAreaInstance);
                saveGame();
            }
        }
    }
    render(context, state: GameState) {
        if (this.status === 'hidden' || this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
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
    getHitbox(state: GameState): Rect {
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
        if (this.definition.id && !state.savedState.objectFlags[this.definition.id]) {
            state.savedState.objectFlags[this.definition.id] = true;
            if (this.linkedObject?.definition?.id) {
                state.savedState.objectFlags[this.linkedObject.definition.id] = true;
            }
            getLoot(state, this.definition);
        }
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
    /*invisibilityFrame*/,
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

const [spiritCloak] = createAnimation('gfx/hud/cloak1.png',
    {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}
).frames;
const [invisibilityCloak] = createAnimation('gfx/hud/cloak2.png',
    {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}
).frames;


const lootFrames: {[key in string]: Frame} = {
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
    invisibilityCloak,
    spiritCloak,
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
export function getLootFrame(state: GameState, {lootType, lootLevel, lootAmount}:
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
    if (lootType === 'spiritPower') {
        if (!state.hero.passiveTools.spiritSight) {
            return lootFrames.spiritSight;
        }
        if (!state.hero.passiveTools.astralProjection) {
            return lootFrames.astralProjection;
        }
        return lootFrames.teleportation;
    }
    if (lootType === 'cloak') {
        if (lootLevel === 1 || (lootLevel === 0 && !state.hero.activeTools.cloak)){
            return lootFrames.spiritCloak;
        }
        return lootFrames.invisibilityCloak;
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
    // Negative number indicates losing loot, and currently is just for setting down the Tower Staff.
    if (loot.lootLevel < 0) {
        return Math.max(0, currentLevel + loot.lootLevel);
    }
    // Non-progressive upgrades specify the exact level of the item. Lower level items will be ignored
    // if the player already possesses a better version.
    if (loot.lootLevel) {
        //console.log(loot.lootType, 'max', currentLevel, loot.lootLevel);
        return Math.max(currentLevel, loot.lootLevel);
    }
    //console.log(loot.lootType, 'increment', currentLevel);
    return currentLevel + 1;
}

function getDungeonInventory(state: GameState): DungeonInventory {
    return state.savedState.dungeonInventories[state.location.zoneKey] || {
        bigKey: false,
        map: false,
        smallKeys: 0,
    };
}
function updateDungeonInventory(state: GameState, inventory: DungeonInventory, save: boolean = true): void {
    state.savedState.dungeonInventories[state.location.zoneKey] = inventory;
    if (save) {
        saveGame();
    }
}

export const lootEffects:Partial<{[key in LootType]: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition | DialogueLootDefinition, simulate?: boolean) => void}> = {
    unknown: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        if (loot.lootType === 'weapon') {
            state.hero.weapon = applyUpgrade(state.hero.weapon, loot);
        } else if (['bow', 'staff', 'clone', 'cloak'].includes(loot.lootType)) {
            if (!state.hero.leftTool && state.hero.rightTool !== loot.lootType) {
                state.hero.leftTool = loot.lootType as ActiveTool;
            } else if (!state.hero.rightTool && state.hero.leftTool !== loot.lootType) {
                state.hero.rightTool = loot.lootType as ActiveTool;
            }
            //console.log(loot.lootType, state.hero.activeTools[loot.lootType]);
            state.hero.activeTools[loot.lootType] = applyUpgrade(state.hero.activeTools[loot.lootType], loot);
            //console.log('->', loot.lootType, state.hero.activeTools[loot.lootType]);
        } else if ([
            'gloves', 'roll', 'charge', 'nimbusCloud', 'catEyes', 'spiritSight',
            'trueSight', 'astralProjection', 'teleportation', 'ironSkin', 'goldMail', 'phoenixCrown',
            'waterBlessing', 'fireBlessing'
        ].includes(loot.lootType)) {
            //console.log(loot.lootType, state.hero.passiveTools[loot.lootType]);
            state.hero.passiveTools[loot.lootType] = applyUpgrade(state.hero.passiveTools[loot.lootType], loot);
            //console.log('->', loot.lootType, state.hero.passiveTools[loot.lootType]);
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
    bigKey: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        const inventory = getDungeonInventory(state);
        inventory.bigKey = true;
        updateDungeonInventory(state, inventory, false);
    },
    map: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        const inventory = getDungeonInventory(state);
        inventory.map = true;
        updateDungeonInventory(state, inventory, false);
    },
    smallKey: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        const inventory = getDungeonInventory(state);
        inventory.smallKeys++;
        updateDungeonInventory(state, inventory, false);
    },
    peach: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        state.hero.life = Math.min(state.hero.life + 1, state.hero.maxLife);
    },
    peachOfImmortality: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        state.hero.maxLife++;
        state.hero.life = state.hero.maxLife;
    },
    peachOfImmortalityPiece: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        state.hero.peachQuarters++;
        if (state.hero.peachQuarters >= 4) {
            state.hero.peachQuarters -= 4;
            if (simulate) {
                state.hero.maxLife++;
            }
            // You will gain the full peach from the dialogue effect.
        }
    },
    spiritPower: (state: GameState, loot: LootObjectDefinition | BossObjectDefinition, simulate: boolean = false) => {
        if (loot.lootType === 'spiritPower') {
            if (!state.hero.passiveTools.spiritSight) {
                state.hero.passiveTools.spiritSight = 1;
            } else if (!state.hero.passiveTools.astralProjection) {
                state.hero.passiveTools.astralProjection = 1;
            } else {
                state.hero.passiveTools.teleportation = 1;
            }
        }
    }
}
