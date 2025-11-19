import {Blast} from 'app/content/effects/blast';
import {growingThornsAbility} from 'app/content/enemyAbilities/growingThorns';
import {Enemy} from 'app/content/enemy';
import {stationaryChargedLightningBoltAbility} from 'app/content/enemyAbilities/lightningBolt';
import {fastVolcanoAbility, volcanoAbility} from 'app/content/enemyAbilities/volcano';
import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {iceGrenadeAbility, seedBombAbility} from 'app/content/enemyAbilities/grenade';
import {addEffectToArea} from 'app/utils/effects';
import {getVectorToNearbyTarget} from 'app/utils/target';
import {omniAnimation} from 'app/content/enemyAnimations';
import {createAnimation} from 'app/utils/animations';
import {addObjectToArea} from 'app/utils/objects';

const plantGeometry: FrameDimensions = { w: 48, h: 32, content: {x: 12, y: 16, w: 24, h: 12} };

function createPlantAnimations(source: string): ActorAnimations {
    return {
        idle: omniAnimation(createAnimation(source, plantGeometry, { x: 0, cols: 1, duration: 10})),
        prepare: omniAnimation(createAnimation(source, plantGeometry, { x: 1, cols: 1, duration: 20})),
        attack: omniAnimation(createAnimation(source, plantGeometry,  { x: 2, cols: 1, duration: 15})),
        growThorns: omniAnimation(createAnimation(source, plantGeometry, { x: 1, cols: 2, duration: 10})),
    };
}

const plantAnimations = createPlantAnimations('gfx/enemies/plant.png');
const plantFlameAnimations = createPlantAnimations('gfx/enemies/plantFlame.png')
const plantFrostAnimations = createPlantAnimations('gfx/enemies/plantFrost.png')
const plantStormAnimations = createPlantAnimations('gfx/enemies/plantStorm.png')

type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;
export const dischargeAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('prepare');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.changeToAnimation('attack');
        const hitbox = enemy.getHitbox(state);
        const blast = new Blast({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            damage: 2,
            element: 'lightning',
            tellDuration: 800,
            expansionDuration: 100,
            persistDuration: 200,
            radius: 80,
            boundSource: enemy,
            source: enemy,
        });
        addEffectToArea(state, enemy.area, blast);
    },
    cooldown: 3000,
    initialCooldown: 1000,
    charges: 1,
    initialCharges: 0,
    prepTime: 200,
    recoverTime: 200,
};

export const spawnBeetleAbility: EnemyAbility<boolean> = {
    // This skill will only be used when there is no nearby target.
    getTarget(this: void, state: GameState, enemy: Enemy): boolean {
        return !getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: boolean) {
        enemy.changeToAnimation('prepare');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: boolean): void {
        enemy.changeToAnimation('attack');
        const hitbox = enemy.getHitbox();
        const flyingBeetle = new Enemy(state, {
            status: 'normal',
            type: 'enemy',
            enemyType: 'beetleWinged',
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
        });
        const beetleHitbox = flyingBeetle.getHitbox();
        flyingBeetle.x -= beetleHitbox.w / 2;
        flyingBeetle.y -= beetleHitbox.h;
        flyingBeetle.z = enemy.z + 8;
        flyingBeetle.vz = 4;
        addObjectToArea(state, enemy.area, flyingBeetle);
    },
    // This skill has a very long cooldown
    cooldown: 30000,
    initialCooldown: 10000,
    charges: 1,
    initialCharges: 0,
    prepTime: 400,
    recoverTime: 200,
    // When multiple plants are on screen, they will not use the summon ability
    // collectively more than once every 10 seconds. This can be reduce on
    // harder difficulties.
    globalCooldown: 10000,
};


const basePlantDefinition: Partial<EnemyDefinition<any>> = {
    alwaysReset: true,
    speed: 0.7,
    aggroRadius: 112,
    tileBehaviors: {solid: true, touchHit: {damage: 1, source: null}},
    // Before changing this, consider the plant is used in Cocoon as an enemy
    // that will be defeated by rolling over it with a rollingBall twice and we
    // don't want to make this too tedious.
    life: 4,
    touchDamage: 1,
    canBeKnockedBack: false,
    update(state: GameState, enemy: Enemy): void {
        if (!enemy.activeAbility) {
            enemy.changeToAnimation('idle');
            enemy.useRandomAbility(state);
        }
    },
};


const plantSeedBombAbility = {
    ...seedBombAbility,
    prepTime: plantAnimations.prepare.down.duration,
    recoverTime: plantAnimations.attack.down.duration,
};
enemyDefinitions.plant = {
    ...basePlantDefinition,
    naturalDifficultyRating: 1,
    abilities: [plantSeedBombAbility, spawnBeetleAbility],
    animations: plantAnimations,
    elementalMultipliers: {'fire': 1.5},
    hybrids: {
        'elementalFlame': 'plantFlame',
        'elementalFrost': 'plantFrost',
        'elementalStorm': 'plantStorm',
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        if (hit.isThrownObject && hit.damage < enemy.life) {
            enemy.useAbiltyFromDefinition(state, spawnBeetleAbility, true);
        }
        return enemy.defaultOnHit(state, hit);
    },
    initialize(state: GameState, enemy: Enemy) {
        if (enemy.difficulty > this.naturalDifficultyRating) {
            enemy.gainAbility(growingThornsAbility);
        }
    },
};

enemyDefinitions.plantFlame = {
    ...basePlantDefinition,
    naturalDifficultyRating: 2,
    abilities: [volcanoAbility],
    animations: plantFlameAnimations,
    elementalMultipliers: {'ice': 2},
    immunities: ['fire'],
    initialize(state: GameState, enemy: Enemy) {
        if (enemy.difficulty > this.naturalDifficultyRating) {
            enemy.abilities = [];
            enemy.gainAbility(fastVolcanoAbility);
        }
    },
};


const plantFrostIceGrenadeAbility = {
    ...iceGrenadeAbility,
    prepTime: plantFrostAnimations.prepare.down.duration,
    recoverTime: plantFrostAnimations.attack.down.duration,
};
enemyDefinitions.plantFrost = {
    ...basePlantDefinition,
    naturalDifficultyRating: 2,
    abilities: [plantFrostIceGrenadeAbility],
    animations: plantFrostAnimations,
    elementalMultipliers: {'fire': 2},
    immunities: ['ice'],
    aggroRadius: 112,
    initialize(state: GameState, enemy: Enemy) {
        if (enemy.difficulty > this.naturalDifficultyRating) {
            enemy.abilities = [];
            enemy.gainAbility({
                ...plantFrostIceGrenadeAbility,
                initialCooldown: plantFrostIceGrenadeAbility.initialCooldown / 2,
                cooldown: plantFrostIceGrenadeAbility.cooldown / 4,
            });
        }
    },
};

enemyDefinitions.plantStorm = {
    ...basePlantDefinition,
    naturalDifficultyRating: 2,
    abilities: [dischargeAbility],
    animations: plantStormAnimations,
    elementalMultipliers: {'fire': 1.5, 'ice': 1.5},
    immunities: ['lightning'],
    aggroRadius: 128,
    initialize(state: GameState, enemy: Enemy) {
        if (enemy.difficulty > this.naturalDifficultyRating) {
            enemy.gainAbility(stationaryChargedLightningBoltAbility);
        }
    },
};
