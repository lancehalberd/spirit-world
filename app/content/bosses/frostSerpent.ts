import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    paceAndCharge,
    throwIceGrenadeAtLocation,
} from 'app/content/enemies';
import { snakeAnimations } from 'app/content/enemyAnimations';
import { createAnimation } from 'app/utils/animations';


import { Enemy, GameState } from 'app/types';


const peachAnimation = createAnimation('gfx/hud/icons.png', {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}, {x: 3});
const peachAnimations = {
    idle: {
        up: peachAnimation,
        down: peachAnimation,
        left: peachAnimation,
        right: peachAnimation,
    }
}

enemyDefinitions.frostHeart = {
    animations: peachAnimations, life: 16, scale: 3, touchDamage: 1, update: updateFrostHeart, params:{
        chargeLevel: 0,
        shieldLife: 8,
    },
    render: renderIceShield,
};
enemyDefinitions.frostSerpent = {
    animations: snakeAnimations, life: 16, scale: 3, touchDamage: 2, update: paceAndCharge, flipRight: true,
};

function updateFrostHeart(this: void, state: GameState, enemy: Enemy): void {
    // The frost heart does nothing when attacking it from under the water.
    if (enemy.area.underwater) {
        enemy.shielded = false;
        return;
    }
    enemy.shielded = enemy.params.shieldLife > 0;
    let chargeRate = 20;
    if (enemy.life < 16) chargeRate += 10;
    if (enemy.life < 10) chargeRate += 10;
    if (enemy.life < 8) chargeRate += 20;
    enemy.params.chargeLevel = (enemy.params.chargeLevel || 0) + chargeRate;
    if (enemy.params.chargeLevel >= 4000) {
        if (enemy.params.chargeLevel >= 4000 + chargeRate * chargeRate / 20) {
            enemy.params.chargeLevel = 0;
        }
        const theta = 2 * Math.PI * Math.random();
        throwIceGrenadeAtLocation(state, enemy, {
            tx: state.hero.x + state.hero.w / 2 + 16 * Math.cos(theta),
            ty: state.hero.y + state.hero.h / 2 + 16 * Math.sin(theta),
        });
    }
}


function renderIceShield(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    if (enemy.area.underwater || enemy.params.shieldLife <= 0) {
        return;
    }
    const hitbox = enemy.getHitbox(state);
    context.save();
        context.globalAlpha = 0.5;
        context.fillStyle = enemy.params.shieldColor ?? '#888';
        context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
    context.restore();
}



