import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { getVectorToNearbyTarget, throwIceGrenadeAtLocation } from 'app/content/enemies';
import { createAnimation } from 'app/utils/animations';

import { Enemy, EnemyAbility, GameState } from 'app/types';


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
    animations: treeAnimations, life: 100, scale: 2, touchDamage: 4, update: updateVoidTree,
    aggroRadius: 1000,
    abilities: [iceGrenadeAbility],
    // void tree is immune to all damage types until one of the hearts is destroyed.
    immunities: ['ice', 'fire', 'lightning', null],
};

function updateVoidTree(this: void, state: GameState, enemy: Enemy): void {
    enemy.useRandomAbility(state);
}

