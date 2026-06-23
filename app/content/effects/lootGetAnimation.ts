import {getLootFrame, showLootMessage} from 'app/content/loot';
import {lootEffects} from 'app/content/lootEffects';
import {FRAME_LENGTH} from 'app/gameConstants';
import {getMappedLootData} from 'app/randomizer/utils';
import {drawFrame} from 'app/utils/animations';
import {addEffectToArea, removeEffectFromArea} from 'app/utils/effects';
import {getLootLevel} from 'app/utils/loot';
import {saveGame} from 'app/utils/saveGame';
import {playSound} from 'app/utils/sounds';

export class LootGetAnimation implements EffectInstance {
    definition: LootObjectDefinition = null;
    behaviors = {
        solid: true,
        brightness: 1,
        lightRadius: 16,
    };
    frame: Frame;
    loot: AnyLootDefinition;
    lootLevel: number;
    animationTime: number = 0;
    isEffect = <const>true;
    x: number;
    y: number;
    z: number;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, loot: AnyLootDefinition) {
        this.loot = loot;
        // The frame and loot level need to be calculated in the constructor before the loot effect is
        // applied, which would cause progressive loot to show the wrong frame/message.
        this.frame = getLootFrame(state, loot);
        this.lootLevel = getLootLevel(state, this.loot);
        if (loot.type === 'bigChest') {
            this.x = loot.x + 16 - this.frame.w / 2;
            this.y = loot.y + 16;
        } else if (loot.type === 'chest') {
            this.x = loot.x + 8 - this.frame.w / 2;
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
                const audioInstance = playSound('smallSuccessChime');
                if (!audioInstance) {
                    console.log(this);
                    debugger;
                }
            } else {
                const audioInstance = playSound('bigSuccessChime');
                if (!audioInstance) {
                    console.log(this);
                    debugger;
                }
            }
        }
        if (this.animationTime === 1000) {
            // Calculate the loot level immediately so that the
            showLootMessage(state, this.loot);
        } else if (this.animationTime > 1000) {
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const frame = this.frame;
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - this.z });
    }
    alternateRender(context: CanvasRenderingContext2D, state: GameState) {
        const frame = this.frame;
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - this.z });
    }
}

export function getLoot(this: void, state: GameState, definition: AnyLootDefinition): void {
    definition = getActualLootDefinition(state, definition);
    if (!definition.lootType || definition.lootType === 'empty') {
        return;
    }
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

type AnyLootDefinition = LootObjectDefinition | BossObjectDefinition | DialogueLootDefinition;
export function getActualLootDefinition(this: void, state: GameState, definition: AnyLootDefinition): AnyLootDefinition {
    const lootData = getMappedLootData(state.randomizerState, definition);
    if (lootData.lootType === 'spiritPower') {
        if (!state.hero.savedData.passiveTools.spiritSight) {
            return {
                ...definition,
                ...lootData,
                lootType: 'spiritSight',
            };
        } else if (!state.hero.savedData.passiveTools.astralProjection) {
            return {
                ...definition,
                ...lootData,
                lootType: 'astralProjection',
            };
        }
        return {
            ...definition,
            ...lootData,
            lootType: 'teleportation',
        };
    }
    if (lootData.lootType === 'secondChance' && state.hero.savedData.hasRevive) {
        return {
            ...definition,
            ...lootData,
            lootType: 'money',
            lootAmount: 50,
        };
    }
    return {
        ...definition,
        ...lootData,
    };
}
