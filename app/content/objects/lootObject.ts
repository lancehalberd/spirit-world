import { addEffectToArea, addObjectToArea, refreshAreaLogic, removeEffectFromArea, removeObjectFromArea } from 'app/content/areas';
import { lootEffects, getLootFrame, getLootShadowFrame, showLootMessage } from 'app/content/loot';
import { getObjectStatus } from 'app/content/objects';
import { editingState } from 'app/development/tileEditor';
import { CANVAS_WIDTH, CANVAS_HEIGHT, FRAME_LENGTH } from 'app/gameConstants';
import { showMessage } from 'app/render/renderMessage';
import { getState, saveGame } from 'app/state';
import { createAnimation, drawFrame, drawFrameAt, getFrameHitBox } from 'app/utils/animations';
import { rectanglesOverlap } from 'app/utils/index';
import { playSound } from 'app/musicController';
import { drawText } from 'app/utils/simpleWhiteFont';

import {
    AreaInstance, BossObjectDefinition, DialogueLootDefinition, Direction,
    EffectInstance, Frame, GameState, Hero, LootObjectDefinition,
    LootTable, ObjectInstance, ObjectStatus, Rect, TileBehaviors,
} from 'app/types';

/*const [coin] =
    createAnimation('gfx/hud/money.png', {w: 16, h: 16}, {x: 9}).frames;*/

type AnyLootDefinition = LootObjectDefinition | BossObjectDefinition | DialogueLootDefinition;

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

export class LootGetAnimation implements EffectInstance {
    definition = null;
    behaviors = {
        solid: true,
        brightness: 1,
        lightRadius: 16,
    };
    frame: Frame;
    loot: AnyLootDefinition;
    animationTime: number = 0;
    isEffect = <const>true;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus = 'normal';
    constructor(loot: AnyLootDefinition) {
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
    getHitbox(state: GameState) {
        return { x: this.x, y: this.y - this.z, w: 16, h: 16};
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


export class LootObject implements ObjectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors;
    definition: LootObjectDefinition;
    drawPriority: 'sprites' = 'sprites';
    frame: Frame;
    isObject = <const>true;
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
        if (this.definition.id && getObjectStatus(state, this.definition)) {
            this.status = 'gone';
        }
        this.behaviors = { brightness: 0, lightRadius: 0 };
    }
    getHitbox(state: GameState) {
        return getFrameHitBox(this.frame, this);
    }
    update(state: GameState) {
        if (this.definition.id && state.savedState.objectFlags[this.definition.id]) {
            this.status = 'gone';
            return;
        }
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
        if (this.area === hero.area && rectanglesOverlap(hero, getFrameHitBox(this.frame, this))) {
            removeObjectFromArea(state, this);
            if (this.definition.id && this.definition.id !== 'drop') {
                state.savedState.objectFlags[this.definition.id] = true;
                getLoot(state, this.definition);
            } else {
                const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
                onPickup(state, this.definition);
                if (this.definition.lootType === 'money') {
                    playSound('getMoney');
                }
                removeObjectFromArea(state, this);
            }
        }
    }
    render(context, state: GameState) {
        if (this.status === 'hidden' || this.status === 'hiddenEnemy'
            || this.status === 'hiddenSwitch' || this.status === 'gone'
        ) {
            return;
        }
        if (!editingState.isEditing && this.definition.lootType === 'empty') {
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
        if (this.definition.lootType === 'empty') {
            return;
        }
        const frame = getLootShadowFrame(this.definition);
        drawFrame(context, frame, { ...frame,
            x: this.x - (frame.w - (this.frame.content?.w || this.frame.w)) / 2,
            y: this.y - (frame.h - (this.frame.content?.h || this.frame.h)),
        });
    }
}

function getActualLootDefinition(this: void, state: GameState, definition: AnyLootDefinition): AnyLootDefinition {
    if (definition.lootType === 'spiritPower') {
        if (!state.hero.passiveTools.spiritSight) {
            return {
                ...definition,
                lootType: 'spiritSight',
            };
        } else if (!state.hero.passiveTools.astralProjection) {
            return {
                ...definition,
                lootType: 'astralProjection',
            };
        }
        return {
            ...definition,
            lootType: 'teleportation',
        };
    }
    if (definition.lootType === 'secondChance' && state.hero.hasRevive) {
        return {
            ...definition,
            lootType: 'money',
            lootAmount: 50,
        };
    }
    return definition;
}

export function getLoot(this: void, state: GameState, definition: AnyLootDefinition): void {
    definition = getActualLootDefinition(state, definition);
    const onPickup = lootEffects[definition.lootType] || lootEffects.unknown;
    const hero = state.hero.activeClone || state.hero;
    hero.action = 'getItem';
    const lootAnimation = new LootGetAnimation(definition);
    // Apply the pickup after creating the loot animation so that it uses the correct graphic for progressive items.
    onPickup(state, definition);
    addEffectToArea(state, hero.area, lootAnimation);
    hero.area.priorityObjects.push([lootAnimation]);
    // Hack to prevent the game from looking like it is freezing when you obtain the tower staff.
    const fastRefresh = definition.lootType === 'staff';
    // Refresh the area so that the guardian NPC moves to the correct location now that the boss is defeated.
    refreshAreaLogic(state, state.areaInstance, fastRefresh);
    refreshAreaLogic(state, state.alternateAreaInstance, fastRefresh);
    saveGame();
}

// Simple loot drop doesn't show the loot animation when collected.
export class LootDropObject extends LootObject {
    alwaysReset = true;
    isObject = <const>true;
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
    isObject = <const>true;
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
        // Surpisingly, this prevents the Astral Projection from opening chests,
        // because the hero always faces south when meditating.
        if (!this.definition.id || hero.d !== 'up') {
            return;
        }
        state.hero.action = null;
        if (this.isOpen(state)) {
            if (state.savedState.objectFlags[this.definition.id] && this.definition.lootType !== 'empty') {
                showMessage(state, 'You already opened this chest.');
            } else {
                showMessage(state, 'Looks like somebody already opened this chest.');
            }
            return;
        }
        state.savedState.objectFlags[this.definition.id] = true;
        if (this.linkedObject?.definition?.id) {
            state.savedState.objectFlags[this.linkedObject.definition.id] = true;
        }
        getLoot(state, this.definition);
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
        if (hero.d !== 'up') {
            return;
        }
        state.hero.action = null;
        if (this.isOpen(state)) {
            if (state.savedState.objectFlags[this.definition.id] && this.definition.lootType !== 'empty') {
                showMessage(state, 'You already opened this chest.');
            } else {
                showMessage(state, 'Looks like somebody already opened this chest.');
            }
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


export class ShopObject extends LootObject implements ObjectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors;
    definition: LootObjectDefinition;
    drawPriority: 'sprites' = 'sprites';
    frame: Frame;
    isObject = <const>true;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus;
    price: number;
    time = 0;
    constructor(state: GameState, definition: LootObjectDefinition) {
        super(state, definition);
        this.price = definition.price || 100;
        this.behaviors.solid = true;
    }
    onGrab(state: GameState, d: Direction, hero: Hero) {
        const mainHero = state.hero.activeClone || state.hero;
        if (hero !== mainHero) {
            return;
        }
        state.hero.action = null;
        if (state.hero.money < this.price) {
            showMessage(state, 'You need more Jade for this one.');
            return;
        }
        state.hero.money -= this.price;
        removeObjectFromArea(state, this);
        state.savedState.objectFlags[this.definition.id] = true;
        getLoot(state, this.definition);
    }
    update(state: GameState) {
        if (state.savedState.objectFlags[this.definition.id]) {
            this.status = 'gone';
            return;
        }
        this.time += FRAME_LENGTH;
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
    }
    render(context, state: GameState) {
        if (this.status === 'hidden' || this.status === 'hiddenEnemy'
            || this.status === 'hiddenSwitch' || this.status === 'gone'
        ) {
            return;
        }
        if (!editingState.isEditing && this.definition.lootType === 'empty') {
            return;
        }
        drawFrameAt(context, this.frame, { x: this.x, y: this.y });
        const hitbox = this.getHitbox(state);
        /*drawFrameCenteredAt(context, coin, {
            x: hitbox.x + hitbox.w / 2 - coin.w / 2,
            y: hitbox.y + hitbox.h,
            w: coin.w, h: 16
        });*/
        drawText(context, `${this.price}`,
            hitbox.x + hitbox. w / 2, hitbox.y + hitbox.h + 2, {
            textBaseline: 'top',
            textAlign: 'center',
            size: 16,
        });
    }
}
