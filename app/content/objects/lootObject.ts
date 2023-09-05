import { renderIndicator } from 'app/content/objects/indicator';
import { objectHash } from 'app/content/objects/objectHash';
import { getLootFrame, getLootShadowFrame, showLootMessage } from 'app/content/loot';
import { lootEffects } from 'app/content/lootEffects';
import { editingState } from 'app/development/editingState';
import { CANVAS_WIDTH, CANVAS_HEIGHT, FRAME_LENGTH } from 'app/gameConstants';
import { playSound } from 'app/musicController';
import { showMessage } from 'app/scriptEvents';
import { createAnimation, drawFrame, drawFrameAt, getFrameHitBox } from 'app/utils/animations';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { pad, boxesIntersect } from 'app/utils/index';
import { setObjectFlag } from 'app/utils/objectFlags';
import { addObjectToArea, getObjectStatus, removeObjectFromArea } from 'app/utils/objects';
import { drawText } from 'app/utils/simpleWhiteFont';
import { saveGame } from 'app/utils/saveGame';


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
        const theta = 2 * Math.PI * Math.random();
        const vx = Math.cos(theta), vy = Math.sin(theta);
        const drop = new LootDropObject(state, {
            id: 'drop',
            type: 'loot',
            lootType: item.type,
            lootAmount: item.amount || 1,
            x,
            y,
            vx: vx / 2,
            vy: vy / 2,
            vz: 2,
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
    constructor(state: GameState, loot: AnyLootDefinition) {
        this.loot = loot;
        this.frame = getLootFrame(state, loot);
        if (loot.type === 'bigChest') {
            this.x = loot.x + chestOpenedFrame.w - this.frame.w / 2;
            this.y = loot.y + 16;
        } else if (loot.type === 'chest') {
            this.x = loot.x + chestOpenedFrame.w / 2 - this.frame.w / 2;
            this.y = loot.y + 8;
        } else {
            this.x = state.hero.x + state.hero.w / 2 - this.frame.w / 2;
            this.y = state.hero.y - 4;
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
                playSound(state, 'smallSuccessChime');
            } else {
                playSound(state, 'bigSuccessChime');
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
    z: number = 0;
    groundHeight = 0;
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
    getHitbox(state?: GameState) {
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
        if (this.area === state.hero.area && state.hero.overlaps(this)) {
            removeObjectFromArea(state, this);
            if (this.definition.id && this.definition.id !== 'drop') {
                state.savedState.objectFlags[this.definition.id] = true;
                getLoot(state, this.definition);
            } else {
                const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
                onPickup(state, this.definition);
                if (this.definition.lootType === 'money') {
                    playSound(state, 'getMoney');
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
        drawFrameAt(context, this.frame, { x: this.x, y: this.y - this.z });
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
        if (!state.hero.savedData.passiveTools.spiritSight) {
            return {
                ...definition,
                lootType: 'spiritSight',
            };
        } else if (!state.hero.savedData.passiveTools.astralProjection) {
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
    if (definition.lootType === 'secondChance' && state.hero.savedData.hasRevive) {
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
    state.hero.action = 'getItem';
    const lootAnimation = new LootGetAnimation(state, definition);
    // Apply the pickup after creating the loot animation so that it uses the correct graphic for progressive items.
    onPickup(state, definition);
    addEffectToArea(state, state.hero.area, lootAnimation);
    state.hero.area.priorityObjects.push([lootAnimation]);
    // Refresh the area in case acquiring the item has change the logic of the area.
    state.areaInstance.needsLogicRefresh = true;
    saveGame(state);
}

// Simple loot drop doesn't show the loot animation when collected.
interface LootDropDefinition extends LootObjectDefinition {
    vx?: number
    vy?: number
    vz?: number
    z?: number
}

export class LootDropObject extends LootObject {
    vx: number;
    vy: number;
    vz: number;
    animationTime = 0;
    constructor(state: GameState, definition: LootDropDefinition) {
        super(state, definition);
        this.vx = definition.vx || 0;
        this.vy = definition.vy || 0;
        this.vz = definition.vz || 0;
        this.z = definition.z || 0;
    }
    alwaysReset = true;
    isObject = <const>true;
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.z > (this.groundHeight || 0) || this.vz > 0) {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            this.vz -= 0.3;
            if (this.z <= 0) {
                this.z = 0;
                this.vz = 0;
            }
        } else if (this.area === state.hero.area) {
            const bigHitbox = pad(this.getHitbox(), 2);
            for (const hero of [state.hero, ...state.hero.clones]) {
                if (hero.overlaps(bigHitbox)
                    || (this.animationTime >= 400 && state.hero.thrownChakrams.some(chakram => boxesIntersect(chakram, bigHitbox)))
                ) {
                    const onPickup = lootEffects[this.definition.lootType] || lootEffects.unknown;
                    onPickup(state, this.definition);
                    if (this.definition.lootType === 'money') {
                        playSound(state, 'getMoney');
                    }
                    removeObjectFromArea(state, this);
                    break;
                }
            }
        }
    }
}



const [chestClosedFrame, chestOpenedFrame] = createAnimation('gfx/objects/chest.png',
    {w: 18, h: 20, content: {x: 1, y: 4, w: 16, h: 16}}, {cols: 2}
).frames;


const [largeChestClosedFrame, largeChestOpenedFrame] = createAnimation('gfx/objects/chest2.png',
    {w: 36, h: 40, content: {x: 2, y: 8, w: 32, h: 32}}, {cols: 2}
).frames;

export class ChestObject implements ObjectInstance {
    area: AreaInstance;
    definition: LootObjectDefinition;
    drawPriority: 'sprites' = 'sprites';
    behaviors: TileBehaviors = {
        solid: true,
        brightness: 0.5,
        lightRadius: 12,
        midHeight: true,
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
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    isOpen(state: GameState): boolean {
        return (!!state.savedState.objectFlags[this.definition.id] || this.definition.lootType === 'empty');
    }
    onGrab(state: GameState) {
        // You can only open a chest from the bottom.
        // Surpisingly, this prevents the Astral Projection from opening chests,
        // because the hero always faces south when meditating.
        if (!this.definition.id || state.hero.d !== 'up') {
            return;
        }
        // The hero cannot open chests that they cannot see.
        if (this.definition.isInvisible && !state.hero.savedData.passiveTools.trueSight) {
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
        state.map.needsRefresh = true;
    }
    update(state: GameState) {
        // Make sure empty chests are recorded as opened for the randomizer, since some logic
        // depends on whether a chest was opened yet (cocoon small key chest, for example).
        if (this.definition.id && !state.savedState.objectFlags[this.definition.id] && this.isOpen(state)) {
            if (this.x + 16 > state.camera.x && this.x < state.camera.x + CANVAS_WIDTH
                && this.y + 16 > state.camera.y && this.y < state.camera.y + CANVAS_HEIGHT
                && this.definition.lootType === 'empty'
            ) {
                setObjectFlag(state, this.definition.id);
                saveGame(state);
            }
        }
    }
    render(context, state: GameState) {
        if (this.status === 'hidden' || this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            if (state.hero.savedData.passiveTools.trueSight) {
                renderIndicator(context, this.getHitbox(), state.fieldTime);
            }
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
        if (this.definition.isInvisible && state.hero.savedData.passiveTools.trueSight) {
            renderIndicator(context, this.getHitbox(), state.fieldTime);
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
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 32, h: 32 };
    }
    onGrab(state: GameState) {
        // You can only open a chest from the bottom.
        if (state.hero.d !== 'up') {
            return;
        }
        // The hero cannot open chests that they cannot see.
        if (this.definition.isInvisible && !state.hero.savedData.passiveTools.trueSight) {
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
        if (!state.savedState.dungeonInventories[state.location.logicalZoneKey]?.bigKey) {
            showMessage(state, 'You need a special key to open this chest.');
            return;
        }
        if (this.definition.id && !state.savedState.objectFlags[this.definition.id]) {
            state.savedState.objectFlags[this.definition.id] = true;
            if (this.linkedObject?.definition?.id) {
                state.savedState.objectFlags[this.linkedObject.definition.id] = true;
            }
            getLoot(state, this.definition);
            state.map.needsRefresh = true;
        }
    }
    render(context, state: GameState) {
        if (this.isOpen(state)) {
            drawFrameAt(context, largeChestOpenedFrame, {x: this.x, y: this.y});
        } else {
            drawFrameAt(context, largeChestClosedFrame, {x: this.x, y: this.y});
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
    z: number = 0;
    status: ObjectStatus;
    price: number;
    time = 0;
    constructor(state: GameState, definition: LootObjectDefinition) {
        super(state, definition);
        this.price = definition.price || 100;
        this.behaviors.solid = true;
    }
    onGrab(state: GameState, d: Direction, hero: Hero) {
        if (hero !== state.hero) {
            return;
        }
        // The hero cannot purchase items that they cannot see.
        if (this.definition.isInvisible && !state.hero.savedData.passiveTools.trueSight) {
            return;
        }
        state.hero.action = null;
        if (state.hero.savedData.money < this.price) {
            showMessage(state, 'You need more Jade for this one.');
            return;
        }
        state.hero.savedData.money -= this.price;
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

objectHash.bigChest = BigChest;
objectHash.chest = ChestObject;
objectHash.loot = LootObject
objectHash.shopItem = ShopObject;
