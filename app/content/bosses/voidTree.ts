import { flameHeartAnimations } from 'app/content/bosses/flameBeast';
import { frostHeartAnimations } from 'app/content/bosses/frostBeast';
import { stormHeartAnimations } from 'app/content/bosses/stormBeast';

import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { getVectorToNearbyTarget, throwIceGrenadeAtLocation } from 'app/content/enemies';
import { createCanvasAndContext } from 'app/dom';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { allImagesLoaded } from 'app/utils/images';

import { Enemy, EnemyAbility, GameState } from 'app/types';


const stoneGeometry = {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}};
export const [neutralElement] = createAnimation('gfx/hud/elementhud.png', stoneGeometry, {x: 4}).frames;
const [stoneHeartCanvas, stoneHeartContext] = createCanvasAndContext(neutralElement.w * 4, neutralElement.h * 2);
const createFlameAnimation = async () => {
    await allImagesLoaded();
    drawFrame(stoneHeartContext, neutralElement, {x: 0, y: 0, w: neutralElement.w * 2, h: neutralElement.h * 2});
    stoneHeartContext.save();
        stoneHeartContext.translate((neutralElement.w + neutralElement.content.x + neutralElement.content.w / 2) * 2, 0);
        stoneHeartContext.scale(-1, 1);
        drawFrame(stoneHeartContext, neutralElement, {
            x: 2* (-neutralElement.content.w / 2 - neutralElement.content.x), y: 0,
            w: neutralElement.w * 2, h: neutralElement.h * 2
        });
    stoneHeartContext.restore();
    drawFrame(stoneHeartContext, neutralElement, {...neutralElement, x: 0, y: 2});
    drawFrame(stoneHeartContext, neutralElement, {...neutralElement, x: neutralElement.w, y: 0});
    drawFrame(stoneHeartContext, neutralElement, {...neutralElement, x: 2 * neutralElement.w, y: 0});
    drawFrame(stoneHeartContext, neutralElement, {...neutralElement, x: 3 * neutralElement.w, y: 2});
}
createFlameAnimation();
const stoneHeartAnimation = createAnimation(stoneHeartCanvas, {w: 40, h: 40, content: {x: 4, y: 4, w: 32, h: 32}}, {cols: 2});

export const stoneHeartAnimations = {
    idle: {
        up: stoneHeartAnimation,
        down: stoneHeartAnimation,
        left: stoneHeartAnimation,
        right: stoneHeartAnimation,
    },
};


const treeAnimation = createAnimation('gfx/tiles/knobbytrees.png', {w: 96, h: 64, content: {x: 24, y: 24, w: 48, h: 40}}, {left: 64});
const treeAnimations = {
    idle: {
        up: treeAnimation,
        down: treeAnimation,
        left: treeAnimation,
        right: treeAnimation,
    },
};

type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const iceGrenadeAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        const hitbox = target.target.getHitbox();
        throwIceGrenadeAtLocation(state, enemy, {tx: hitbox.x + hitbox.w / 2, ty: hitbox.y + hitbox.h / 2});
    },
    cooldown: 4000,
    initialCharges: 0,
    charges: 3,
    chargesRecovered: 3,
    prepTime: 400,
    recoverTime: 400,
};

enemyDefinitions.voidTree = {
    animations: treeAnimations, life: 128, scale: 2, touchDamage: 4, update: updateVoidTree,
    aggroRadius: 256,
    abilities: [],
    // void tree is immune to all damage types until one of the hearts is destroyed.
    immunities: ['ice', 'fire', 'lightning', null],
};

enemyDefinitions.voidStone = {
    animations: stoneHeartAnimations, life: 64, scale: 2, touchDamage: 4, update: updateVoidHeart,
    aggroRadius: 144,
    abilities: [],
};

enemyDefinitions.voidFlame = {
    animations: flameHeartAnimations, life: 64, scale: 2, touchDamage: 4, update: updateVoidHeart,
    aggroRadius: 144,
    abilities: [],
    immunities: ['fire'],
    elementalMultipliers: {'ice': 2, 'lightning': 1.5},
};

enemyDefinitions.voidFrost = {
    animations: frostHeartAnimations, life: 64, scale: 2, touchDamage: 4, update: updateVoidHeart,
    aggroRadius: 144,
    abilities: [iceGrenadeAbility],
    immunities: ['ice'],
    elementalMultipliers: {'fire': 2, 'lightning': 1.5},
};

enemyDefinitions.voidStorm = {
    animations: stormHeartAnimations, life: 64, scale: 2, touchDamage: 4, update: updateVoidHeart,
    aggroRadius: 144,
    abilities: [],
    immunities: ['lightning'],
    elementalMultipliers: {'ice': 1.5, 'fire': 1.5},
};

function updateVoidTree(this: void, state: GameState, enemy: Enemy): void {
    enemy.useRandomAbility(state);
}


function updateVoidHeart(this: void, state: GameState, enemy: Enemy): void {
    enemy.useRandomAbility(state);
}
