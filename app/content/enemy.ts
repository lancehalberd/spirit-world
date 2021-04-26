import _ from 'lodash';

import { AnimationEffect } from 'app/content/animationEffect';
import { EnemyArrow } from 'app/content/arrow';
import { dropItemFromTable, getLoot } from 'app/content/lootObject';
import { simpleLootTable, lifeLootTable, moneyLootTable } from 'app/content/lootTables';
import { addObjectToArea, getAreaSize } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { moveActor } from 'app/moveActor';
import { saveGame } from 'app/state';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap } from 'app/utils/field';
import { playSound } from 'app/utils/sounds';

import {
    Actor, ActorAnimations, AreaInstance, BossObjectDefinition, Clone, Direction, DrawPriority,
    EnemyObjectDefinition,
    Frame, FrameAnimation, FrameDimensions, GameState, Hero, LootTable, MovementProperties,
    ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';


export const enemyTypes = <const>[
    'arrowTurret', 'beetle', 'beetleHorned', 'beetleMini', 'beetleWinged', 'snake', 'wallLaser',
];
// Not intended for use in the editor.
const minionTypes = <const>['beetleBossWingedMinionDefinition'];
export const bossTypes = <const>['beetleBoss'];
export type EnemyType = typeof enemyTypes[number];
export type BossType = typeof bossTypes[number];
export type MinionType = typeof minionTypes[number];


export class Enemy implements Actor, ObjectInstance {
    type = 'enemy' as 'enemy';
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    definition: EnemyObjectDefinition | BossObjectDefinition;
    enemyDefinition: EnemyDefinition;
    currentAnimation: FrameAnimation;
    hasShadow: boolean = true;
    animationTime: number;
    alwaysReset: boolean = false;
    alwaysUpdate: boolean = false;
    d: Direction;
    spawnX: number;
    spawnY: number;
    x: number;
    y: number;
    z: number = 0;
    vx: number = 0;
    vy: number = 0;
    vz: number = 0;
    w: number;
    h: number;
    flying: boolean;
    life: number;
    speed: number;
    acceleration: number;
    aggroRadius: number;
    mode = 'choose';
    modeTime = 0;
    params: any;
    invulnerableFrames = 0;
    status: ObjectStatus = 'normal';
    scale: number = 1;
    constructor(state: GameState, definition: EnemyObjectDefinition | BossObjectDefinition) {
        this.definition = definition;
        this.enemyDefinition = enemyDefinitions[this.definition.enemyType] || enemyDefinitions.snake;
        this.d = definition.d || 'down';
        this.hasShadow = this.enemyDefinition.hasShadow ?? true;
        this.currentAnimation = this.enemyDefinition.animations.idle[this.d];
        this.animationTime = 0;
        this.spawnX = this.x = definition.x;
        this.spawnY = this.y = definition.y;
        const frame = this.getFrame();
        this.w = frame.content?.w ?? frame.w;
        this.h = frame.content?.h ?? frame.h;
        this.life = this.enemyDefinition.life ?? 1;
        this.speed = this.enemyDefinition.speed ?? 1;
        this.acceleration = this.enemyDefinition.acceleration ?? .1;
        this.aggroRadius = this.enemyDefinition.aggroRadius ?? 80;
        this.flying = this.enemyDefinition.flying;
        this.z = this.flying ? 12 : 0;
        this.scale = this.enemyDefinition.scale ?? 1;
        this.params = {
            ...(this.enemyDefinition.params || {}),
            ...(definition.params || {}),
        };
        if (definition.type === 'boss' && state.savedState.objectFlags[this.definition.id]) {
            this.status = 'gone';
        }
        this.alwaysReset = this.enemyDefinition.alwaysReset;
        this.drawPriority = this.flying ? 'foreground' : 'sprites';
    }
    getFrame(): Frame {
        return getFrame(this.currentAnimation, this.animationTime);
    }
    getHitbox(state: GameState): ShortRectangle {
        const frame = this.getFrame();
        return {
            x: this.x,
            y: this.y - this.z,
            w: (frame.content?.w ?? frame.w) * this.scale,
            h: (frame.content?.h ?? frame.h) * this.scale,
        };
    }
    isInCurrentSection(state: GameState): boolean {
        const { section } = getAreaSize(state);
        return !(this.x < section.x || this.x > section.x + section.w || this.y < section.y || this.y > section.y + section.h)
    }
    isFromCurrentSection(state: GameState): boolean {
        const { section } = getAreaSize(state);
        return !(this.spawnX < section.x || this.spawnX > section.x + section.w ||
                this.spawnY < section.y || this.spawnY > section.y + section.h)
    }
    setAnimation(type: string, d: Direction, time: number = 0) {
        const animationSet = this.enemyDefinition.animations[type] || this.enemyDefinition.animations.idle;
        this.currentAnimation = animationSet[d];
        this.animationTime = time;
    }
    setMode(mode: string) {
        this.mode = mode;
        this.modeTime = 0;
    }
    takeDamage(state: GameState, damage: number) {
        this.life -= damage;
        // This is actually the number of frames the enemy cannot damage the hero for.
        this.invulnerableFrames = 50;
        if (this.life <= 0) {
            this.showDeathAnimation(state);
        } else {
            playSound('enemyHit');
        }
    }
    showDeathAnimation(state: GameState) {
        const hitbox = this.getHitbox(state);
        const deathAnimation = new AnimationEffect({
            animation: enemyDeathAnimation,
            x: hitbox.x + hitbox.w / 2 - enemyDeathAnimation.frames[0].w / 2 * this.scale,
            y: hitbox.y + hitbox.h / 2 - enemyDeathAnimation.frames[0].h / 2 * this.scale,
            scale: this.scale,
        });
        playSound('enemyDeath');
        if (this.enemyDefinition.lootTable) {
            dropItemFromTable(state, this.area, this.enemyDefinition.lootTable,
                hitbox.x + hitbox.w / 2,
                hitbox.y + hitbox.h / 2
            );
        }
        addObjectToArea(state, this.area, deathAnimation);
        if (this.definition.type === 'boss') {
            // If the last boss is defeated kill all regular enemies.
            if (!this.area.objects.some(object => (object instanceof Enemy) && object.definition.type === 'boss' && object.life > 0)) {
                this.area.objects.forEach(object => (object instanceof Enemy) && object.life > 0 && object.takeDamage(state, object.life));
            }
            if (!state.savedState.objectFlags[this.definition.id]) {
                state.savedState.objectFlags[this.definition.id] = true;
                if (this.definition.lootType) {
                    getLoot(state, this.definition);
                }
                saveGame();
            }
        }
    }
    shouldReset(state: GameState) {
        return true;
    }
    shouldRespawn(state: GameState) {
        return this.alwaysReset;
    }
    update(state: GameState) {
        if (this.status === 'gone') {
            return;
        }
        if (!this.alwaysUpdate && !this.isFromCurrentSection(state)) {
            return;
        }
        if (this.enemyDefinition.update) {
            this.enemyDefinition.update(state, this);
        }
        this.modeTime += FRAME_LENGTH;
        this.animationTime += FRAME_LENGTH;
        if (this.invulnerableFrames > 0) {
            this.invulnerableFrames--;
        }
        // Checks if the enemy fell into a pit, for example
        checkForFloorEffects(state, this);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status === 'gone') {
            return;
        }
        const frame = this.getFrame();
        context.save();
            if (this.invulnerableFrames) {
                context.globalAlpha = 0.7 + 0.3 * Math.cos(2 * Math.PI * this.invulnerableFrames * 3 / 50);
            }
            if (this.d === 'right' && this.enemyDefinition.flipRight) {
                // Flip the frame when facing right. We may need an additional flag for this behavior
                // if we don't do it for all enemies on the right frames.
                const w = frame.content?.w ?? frame.w;
                context.translate((this.x | 0) + (frame?.content?.x || 0) + w / 2, 0);
                context.scale(-1, 1);
                drawFrame(context, frame, { ...frame,
                    x: - w / 2 - (frame?.content?.x || 0) * this.scale,
                    y: this.y - (frame?.content?.y || 0) * this.scale - this.z,
                    w: frame.w * this.scale,
                    h: frame.h * this.scale,
                });
            } else {
                drawFrame(context, frame, { ...frame,
                    x: this.x - (frame?.content?.x || 0) * this.scale,
                    y: this.y - (frame?.content?.y || 0) * this.scale - this.z,
                    w: frame.w * this.scale,
                    h: frame.h * this.scale,
                });
            }
            /*const hitbox = this.getHitbox(state);
            context.globalAlpha = 0.5;
            context.fillStyle = 'red';
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);*/
        context.restore();
    }
}

const snakeGeometry = { w: 18, h: 18, content: { x: 1, y: 6, w: 16, h: 16} };
const leftSnakeAnimation: FrameAnimation = createAnimation('gfx/enemies/snek.png', snakeGeometry, { x: 0});
const downSnakeAnimation: FrameAnimation = createAnimation('gfx/enemies/snek.png', snakeGeometry, { x: 1});
const upSnakeAnimation: FrameAnimation = createAnimation('gfx/enemies/snek.png', snakeGeometry, { x: 2});
const snakeAnimations: ActorAnimations = {
    idle: {
        up: upSnakeAnimation,
        down: downSnakeAnimation,
        left: leftSnakeAnimation,
        right: leftSnakeAnimation,
    },
};
const beetleGeometry = { w: 18, h: 17, content: { x: 1, y: 4, w: 16, h: 16} };
const beetleDownAnimation: FrameAnimation = createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, { y: 0, cols: 4});
const beetleRightAnimation: FrameAnimation = createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, { y: 1, cols: 4});
const beetleUpAnimation: FrameAnimation = createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, { y: 2, cols: 4});
const beetleLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, { y: 4, cols: 4});
const beetleClimbAnimation: FrameAnimation = createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, { y: 3, cols: 4});

const beetleAnimations: ActorAnimations = {
    climbing: {
        up: beetleClimbAnimation,
        down: beetleClimbAnimation,
        left: beetleClimbAnimation,
        right: beetleClimbAnimation,
    },
    idle: {
        up: beetleUpAnimation,
        down: beetleDownAnimation,
        left: beetleLeftAnimation,
        right: beetleRightAnimation,
    },
};

const beetleMiniGeometry = { w: 10, h: 10 };
const beetleMiniDownAnimation: FrameAnimation = createAnimation('gfx/enemies/smallbeetle.png', beetleMiniGeometry, { x: 0, cols: 2});
const beetleMiniRightAnimation: FrameAnimation = createAnimation('gfx/enemies/smallbeetle.png', beetleMiniGeometry, { x: 2, cols: 2});
const beetleMiniUpAnimation: FrameAnimation = createAnimation('gfx/enemies/smallbeetle.png', beetleMiniGeometry, { x: 4, cols: 2});
const beetleMiniLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/smallbeetle.png', beetleMiniGeometry, { x: 7, cols: 2});
const beetleMiniAnimations: ActorAnimations = {
    idle: {
        up: beetleMiniUpAnimation,
        down: beetleMiniDownAnimation,
        left: beetleMiniLeftAnimation,
        right: beetleMiniRightAnimation,
    },
};

const beetleHornedGeometry = { w: 22, h: 18, content: { x: 3, y: 4, w: 16, h: 16} };
const beetleHornedDownAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 0, cols: 4});
const beetleHornedRightAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 2, cols: 4});
const beetleHornedUpAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 4, cols: 4});
const beetleHornedLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 6, cols: 4});
const beetleHornedChargeDownAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 1, cols: 4});
const beetleHornedChargeRightAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 3, cols: 4});
const beetleHornedChargeUpAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 5, cols: 4});
const beetleHornedChargeLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 7, cols: 4});

const beetleHornedAnimations: ActorAnimations = {
    idle: {
        up: beetleHornedUpAnimation,
        down: beetleHornedDownAnimation,
        left: beetleHornedLeftAnimation,
        right: beetleHornedRightAnimation,
    },
    attack: {
        up: beetleHornedChargeUpAnimation,
        down: beetleHornedChargeDownAnimation,
        left: beetleHornedChargeLeftAnimation,
        right: beetleHornedChargeRightAnimation,
    }
};

const beetleWingedGeometry = { w: 22, h: 18, content: { x: 3, y: 4, w: 16, h: 16} };
const beetleWingedAnimation: FrameAnimation = createAnimation('gfx/enemies/flyingbeetle.png', beetleWingedGeometry, { cols: 4});
const beetleWingedAnimations: ActorAnimations = {
    idle: {
        up: beetleWingedAnimation,
        down: beetleWingedAnimation,
        left: beetleWingedAnimation,
        right: beetleWingedAnimation,
    },
};

interface EnemyDefinition {
    alwaysReset?: boolean,
    animations: ActorAnimations,
    aggroRadius?: number,
    flipRight?: boolean,
    flying?: boolean,
    hasShadow?: boolean,
    life?: number,
    lootTable: LootTable,
    params?: any,
    speed?: number,
    acceleration?: number,
    scale?: number,
    touchDamage: number,
    update: (state: GameState, enemy: Enemy) => void,
}

export const enemyDefinitions: {[key in EnemyType | BossType | MinionType]: EnemyDefinition} = {
    arrowTurret: {
        animations: beetleAnimations, life: 4, touchDamage: 1, update: spinAndShoot,
        lootTable: simpleLootTable,
    },
    snake: {
        animations: snakeAnimations, life: 2, touchDamage: 1, update: paceRandomly, flipRight: true,
        lootTable: simpleLootTable,
    },
    beetle: {
        animations: beetleAnimations, acceleration: 0.05, life: 2, touchDamage: 1, update: scurryAndChase,
        lootTable: simpleLootTable,
    },
    beetleBoss: {
        // Reset the boss to its starting position if you leave the arena.
        alwaysReset: true,
        animations: beetleWingedAnimations, flying: true, scale: 4,
        acceleration: 0.5, speed: 2,
        life: 16, touchDamage: 1, update: updateBeetleBoss,
        lootTable: null,
    },
    beetleBossWingedMinionDefinition: {
        // Despawn these if you leave the boss arena.
        alwaysReset: true,
        animations: beetleWingedAnimations,
        flying: true, acceleration: 0.5, speed: 3,
        life: 1, touchDamage: 1, update: flyBy,
        lootTable: lifeLootTable,
    },
    beetleHorned: {
        animations: beetleHornedAnimations, life: 3, touchDamage: 1, update: paceAndCharge,
        lootTable: moneyLootTable,
    },
    beetleMini: {
        animations: beetleMiniAnimations,
        acceleration: 0.01,
        speed: 0.8,
        hasShadow: false, life: 1, touchDamage: 1, update: scurryRandomly,
        lootTable: lifeLootTable,
    },
    beetleWinged: {
        animations: beetleWingedAnimations,
        flying: true, acceleration: 0.1, aggroRadius: 112,
        life: 1, touchDamage: 1, update: scurryAndChase,
        lootTable: simpleLootTable,
    },
    wallLaser: {
        animations: snakeAnimations, life: 1, touchDamage: 1, update: updateWallLaser, flipRight: true,
        lootTable: simpleLootTable, params: { alwaysShoot: false },
    },
};


function spinAndShoot(state: GameState, enemy: Enemy): void {
    if (typeof enemy.params.currentTheta === 'undefined') {
        enemy.params.lastTheta = enemy.params.currentTheta = Math.floor(Math.random() * 2) * Math.PI / 4;
    }
    if (enemy.mode === 'shoot') {
        if (enemy.modeTime === 100) {
            for (let i = 0; i < 4; i++) {
                const hitbox = enemy.getHitbox(state);
                const dx = Math.cos(enemy.params.currentTheta + i * Math.PI / 2);
                const dy = Math.sin(enemy.params.currentTheta + i * Math.PI / 2);
                const arrow = new EnemyArrow({
                    x: hitbox.x + hitbox.w / 2 + hitbox.w / 2 * dx,
                    y: hitbox.y + hitbox.h / 2 + hitbox.h / 2 * dy,
                    vx: 4 * dx,
                    vy: 4 * dy,
                });
                addObjectToArea(state, state.areaInstance, arrow);
            }
        }
        if (enemy.modeTime >= 500) {
            enemy.setMode('spin');
        }
    } else {
        enemy.params.currentTheta = enemy.params.lastTheta + Math.PI / 4 * enemy.modeTime / 1000;
        if (enemy.modeTime >= 500) {
            enemy.params.lastTheta = enemy.params.currentTheta = (enemy.params.lastTheta + Math.PI / 4) % (2 * Math.PI);
            enemy.setMode('shoot');
        }
    }
}

function updateWallLaser(state: GameState, enemy: Enemy): void {
    function shoot() {
        const hitbox = enemy.getHitbox(state);
        const dx = directionMap[enemy.d][0];
        const dy = directionMap[enemy.d][1];
        const arrow = new EnemyArrow({
            x: hitbox.x + hitbox.w / 2 + hitbox.w / 2 * dx,
            y: hitbox.y + hitbox.h / 2 + hitbox.h / 2 * dy,
            vx: 4 * dx,
            vy: 4 * dy,
        });
        addObjectToArea(state, state.areaInstance, arrow);
    }
    if (enemy.params.alwaysShoot) {
        if (enemy.modeTime % 300 === FRAME_LENGTH) {
            shoot();
        }
        return;
    }
    if (enemy.mode === 'shoot') {
        const {hero} = getLineOfSightTargetAndDirection(state, enemy, enemy.d, true);
        if (!hero && enemy.modeTime > 1200) {
            enemy.setMode('wait');
        } else if (enemy.modeTime % 300 === FRAME_LENGTH) {
            shoot();
        }
    } else if (enemy.mode === 'charge') {
        if (enemy.modeTime >= 500) {
            enemy.setMode('shoot');
        }
    } else {
        const {hero} = getLineOfSightTargetAndDirection(state, enemy, enemy.d, true);
        if (hero) {
            enemy.setMode('charge');
        }
    }
}

function updateBeetleBoss(state: GameState, enemy: Enemy): void {
    const hitbox = enemy.getHitbox(state);
    const { section } = getAreaSize(state);
    enemy.alwaysUpdate = true;
    if (enemy.life <= 8) {
        enemy.speed = enemyDefinitions.beetleBoss.speed + 1;
    }
    if (enemy.mode === 'choose' && enemy.modeTime > 500) {
        enemy.vx = enemy.vy = 0;
        if (enemy.life > 8) {
            if (Math.random() < 0.3) {
                enemy.setMode('circle');
            } else if (Math.random() < 0.5) {
                const vector = getVectorToNearbyHero(state, enemy, 32 * 32);
                if (vector) {
                    enemy.setMode('rush');
                    enemy.vx = vector.x;
                    enemy.vy = vector.y;
                }
            } else {
                enemy.setMode('summon');
                enemy.params.summonTheta = Math.random() * 2 * Math.PI;
            }
        } else {
            if (Math.random() < 0.25) {
                enemy.setMode('circle');
            } else if (Math.random() < 0.25) {
                const vector = getVectorToNearbyHero(state, enemy, 32 * 32);
                if (vector) {
                    enemy.setMode('rush');
                    enemy.vx = vector.x;
                    enemy.vy = vector.y;
                }
            } else {
                enemy.setMode('summon');
                enemy.params.summonTheta = Math.random() * 2 * Math.PI;
            }
        }
    } else if (enemy.mode === 'circle') {
        // In theory the enemy circles the center of the area moving clockwise.
        accelerateInDirection(state, enemy, {
            x: section.y + section.h / 2 - (hitbox.y + hitbox.h / 2),
            y: (hitbox.x + hitbox.w / 2) - (section.x + section.w / 2),
        });
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        if (enemy.modeTime > 10000 / enemy.speed) {
            enemy.setMode('return');
        }
    } else if (enemy.mode === 'return') {
        if (moveTo(state, enemy, section.x + section.w / 2, section.y + 16 + hitbox.h / 2) === 0) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'summon') {
        if (enemy.modeTime === 500 || enemy.modeTime === 1000 || enemy.modeTime === 1500) {
            const theta = enemy.params.summonTheta + 2 * Math.PI * enemy.modeTime / 500 / 3;
            const minion = new Enemy(state, {
                type: 'enemy',
                id: '' + Math.random(),
                status: 'normal',
                enemyType: 'beetleBossWingedMinionDefinition',
                x: section.x + section.w / 2 + (section.w / 2 + 32) * Math.cos(theta),
                y: section.y + section.h / 2 + (section.h / 2 + 32) * Math.sin(theta),
            });
            const vector = getVectorToNearbyHero(state, minion, 1000);
            if (vector) {
                minion.vx = minion.speed * vector.x;
                minion.vy = minion.speed * vector.y;
                // Since the minion is spawnd from off screen, we need to set this flag to
                // allow it to update. (monsters spawned offscreen do not update by default)
                minion.alwaysUpdate = true;
                addObjectToArea(state, enemy.area, minion);
            } else {
                console.log('could not find nearby hero to target');
            }
        }
        if (enemy.modeTime > 3000) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'rush') {
        // Just accelerate in the direction the boss chose when it entered this mode.
        accelerateInDirection(state, enemy, {x: enemy.vx, y: enemy.vy});
        if (enemy.modeTime <= 1000) {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
        }
        if (enemy.modeTime >= 1500) {
            if (enemy.life > 8 || Math.random() < 0.5) {
                enemy.setMode('return');
            } else {
                const vector = getVectorToNearbyHero(state, enemy, 32 * 32);
                if (vector) {
                    enemy.setMode('rush');
                    enemy.vx = vector.x;
                    enemy.vy = vector.y;
                } else {
                    enemy.setMode('return');
                }
            }
        }
    }
}

function moveTo(state: GameState, enemy: Enemy, tx: number, ty: number): number {
    const hitbox = enemy.getHitbox(state);
    const dx = tx - (hitbox.x + hitbox.w / 2), dy = ty - (hitbox.y + hitbox.h / 2);
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > enemy.speed) {
        moveEnemy(state, enemy, enemy.speed * dx / mag, enemy.speed * dy / mag, {});
        return mag - enemy.speed;
    }
    moveEnemy(state, enemy, dx, dy, {});
    return 0;
}

//
function flyBy(state: GameState, enemy: Enemy): void {
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;
    const { section } = getAreaSize(state);
    // Remove the enemy once it has moved off the screen entirely.
    if ((enemy.vx < 0 && enemy.x + enemy.w < section.x - 16)
        || (enemy.vx > 0 && enemy.x > section.x + section.w + 16)
        || (enemy.vy < 0 && enemy.y + enemy.h < section.y - 16)
        || (enemy.vy > 0 && enemy.y > section.y + section.h + 16)
    ) {
        // The main control loop will remove enemies with this status and then
        // check if anything should trigger if all enemies are defeated.
        enemy.status = 'gone';
    }
}

// The enemy choose a vector and accelerates in that direction for a bit.
// The enemy slides a bit since it doesn't immediately move in the desired direction.
const maxScurryTime = 4000;
const minScurryTime = 1000;
function scurryRandomly(state: GameState, enemy: Enemy) {
    if (enemy.mode === 'choose' && enemy.modeTime > 200) {
        enemy.params.theta = 2 * Math.PI * Math.random();
        enemy.setMode('scurry');
        enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    }
    let tvx = 0, tvy = 0;
    if (enemy.mode === 'scurry') {
        tvx = enemy.speed * Math.cos(enemy.params.theta);
        tvy = enemy.speed * Math.sin(enemy.params.theta);
        if (enemy.modeTime > minScurryTime &&
            Math.random() < (enemy.modeTime - minScurryTime) / (maxScurryTime - minScurryTime)
        ) {
            enemy.setMode('choose');
        }
    }
    const ax = tvx - enemy.vx;
    const ay = tvy - enemy.vy;
    accelerateInDirection(state, enemy, {x: ax, y: ay});
    moveEnemy(state, enemy, enemy.vx, enemy.vy, {});
}

function accelerateInDirection(state: GameState, enemy: Enemy, a: {x: number, y: number}): void {
    let mag = Math.sqrt(a.x * a.x + a.y * a.y);
    if (mag) {
        enemy.vx = enemy.vx + enemy.acceleration * a.x / mag;
        enemy.vy = enemy.vy + enemy.acceleration * a.y / mag;
        mag = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
        if (mag > enemy.speed) {
            enemy.vx = enemy.speed * enemy.vx / mag;
            enemy.vy = enemy.speed * enemy.vy / mag;
        }
    }
}

function scurryAndChase(state: GameState, enemy: Enemy) {
    const chaseVector = getVectorToNearbyHero(state, enemy, enemy.aggroRadius);
    if (chaseVector) {
        accelerateInDirection(state, enemy, chaseVector);
        moveEnemy(state, enemy, enemy.vx, enemy.vy, {});
    } else {
        scurryRandomly(state, enemy);
    }
}

function paceAndCharge(state: GameState, enemy: Enemy) {
    if (enemy.mode === 'knocked') {
        enemy.animationTime = 0;
        enemy.z += enemy.vz;
        enemy.vz -= 0.5;
        moveEnemy(state, enemy, enemy.vx, enemy.vy, {canFall: true});
        if (enemy.z < 0) {
            enemy.z = 0;
            enemy.setMode('stunned');
        }
    } else if (enemy.mode === 'stunned') {
        enemy.animationTime = 0;
        if (enemy.modeTime > 500) {
            enemy.setMode('choose');
            enemy.setAnimation('idle', enemy.d);
        }
    } else if (enemy.mode !== 'charge') {
        const {d, hero} = getLineOfSightTargetAndDirection(state, enemy);
        if (hero) {
            enemy.d = d;
            enemy.setMode('charge');
            enemy.setAnimation('attack', enemy.d);
        } else {
            paceRandomly(state, enemy);
        }
    } else if (enemy.mode === 'charge') {
        if (enemy.modeTime < 400) {
            enemy.animationTime = 0;
            return;
        }
        if (!moveEnemy(state, enemy, 3 * enemy.speed * directionMap[enemy.d][0], 3 * enemy.speed * directionMap[enemy.d][1], {canFall: true})) {
            enemy.setMode('knocked');
            enemy.vx = -enemy.speed * directionMap[enemy.d][0];
            enemy.vy = -enemy.speed * directionMap[enemy.d][1];
            enemy.vz = 4;
        }
    }
}

function getVectorToNearbyHero(state: GameState, enemy: Enemy, radius: number): {x: number, y: number} {
    const hitbox = enemy.getHitbox(state);
    for (const hero of [state.hero, ...state.hero.clones]) {
        const dx = (hero.x + hero.w / 2) - (hitbox.x + hitbox.w / 2);
        const dy = (hero.y + hero.h / 2) - (hitbox.y + hitbox.h / 2);
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag <= radius) {
            return {x: dx / mag, y: dy / mag};
        }
    }
    return null;
}

function getLineOfSightTargetAndDirection(state: GameState, enemy: Enemy, direction: Direction = null, projectile: boolean = false): {d: Direction, hero: Hero} {
    const hitbox = enemy.getHitbox(state);
    for (const hero of [state.hero, ...state.hero.clones]) {
        if (hitbox.x < hero.x + hero.w && hitbox.x + hitbox.w > hero.x && (direction !== 'left' && direction !== 'right')) {
            if ((hero.y < hitbox.y && direction === 'down') || (hero.y > hitbox.y && direction === 'up')) {
                continue
            }
            const x = Math.floor(hitbox.x / 16);
            const y1 = Math.floor(hero.y / 16), y2 = Math.floor(hitbox.y / 16);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            let blocked = false;
            for (let y = minY; y <= maxY; y++) {
                const tileBehavior = {...(enemy.area?.behaviorGrid[y]?.[x] || {})};
                if (tileBehavior.solid || (!projectile && (tileBehavior.pit || tileBehavior.water))) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) {
                return {
                    d: hero.y < hitbox.y ? 'up' : 'down',
                    hero,
                };
            }
        }
        if (hitbox.y < hero.y + hero.h && hitbox.y + hitbox.h > hero.y && (direction !== 'up' && direction !== 'down')) {
            if ((hero.x < hitbox.x && direction === 'right') || (hero.x > hitbox.x && direction === 'left')) {
                continue
            }
            const y = Math.floor(hitbox.y / 16);
            const x1 = Math.floor(hero.x / 16), x2 = Math.floor(hitbox.x / 16);
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            let blocked = false;
            for (let x = minX; x <= maxX; x++) {
                const tileBehavior = {...(enemy.area?.behaviorGrid[y]?.[x] || {})};
                if (tileBehavior.solid || (!projectile && (tileBehavior.pit || tileBehavior.water))) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) {
                return {
                    d: hero.x < hitbox.x ? 'left' : 'right',
                    hero,
                };
            }
        }
    }
    return {d: null, hero: null};
}

// The enemy pauses to choose a random direction, then moves in that direction for a bit and repeats.
// If the enemy encounters an obstacle, it will change directions more quickly.
function paceRandomly(state: GameState, enemy: Enemy) {
    if (enemy.mode === 'choose' && enemy.modeTime > 200) {
        enemy.setMode('walk');
        enemy.d = _.sample(['up', 'down', 'left', 'right']);
        enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    }
    if (enemy.mode === 'walk') {
        if (enemy.modeTime >= 200) {
            if (!moveEnemy(state, enemy, enemy.speed * directionMap[enemy.d][0], enemy.speed * directionMap[enemy.d][1], {})) {
                enemy.setMode('choose');
                enemy.modeTime = 200;
            }
        }
        if (enemy.modeTime > 700 && Math.random() < (enemy.modeTime - 700) / 3000) {
            enemy.setMode('choose');
        }
    }
}

function moveEnemy(state, enemy, dx, dy, movementProperties: MovementProperties): boolean {

    const { section } = getAreaSize(state);
    if (!movementProperties.excludedObjects) {
        movementProperties.excludedObjects = new Set();
    }
    movementProperties.excludedObjects.add(state.hero);
    for (const clone of enemy.area.objects.filter(object => object instanceof Clone)) {
        movementProperties.excludedObjects.add(clone);
    }
    // Don't allow the enemy to move towards the outer edges of the screen.
    if ((dx < 0 && enemy.x + dx < section.x + 16)
        || (dx > 0 && enemy.x + dx + enemy.w > section.x + section.w - 16)
        || (dy < 0 && enemy.y < section.y + 16)
        || (dy > 0 && enemy.y + enemy.h > section.y + section.h - 16)
    ) {
        return false;
    }
    if (enemy.flying) {
        enemy.x += dx;
        enemy.y += dy;
        return true;
    }
    return moveActor(state, enemy, dx, dy, movementProperties);
}


const fallGeometry: FrameDimensions = {w: 24, h: 24};
export const enemyFallAnimation: FrameAnimation = createAnimation('gfx/effects/enemyfall.png', fallGeometry, { cols: 10, duration: 4}, { loop: false });

const enemyDeathGeometry: FrameDimensions = {w: 20, h: 20};
export const enemyDeathAnimation: FrameAnimation = createAnimation('gfx/effects/enemydeath.png', enemyDeathGeometry, { cols: 9, duration: 4}, { loop: false });


export function checkForFloorEffects(state: GameState, enemy: Enemy) {
    const palette = enemy.area.palette;
    const behaviorGrid = enemy.area.behaviorGrid;
    const tileSize = palette.w;

    const hitbox = enemy.getHitbox(state);
    let leftColumn = Math.floor((hitbox.x + 6) / tileSize);
    let rightColumn = Math.floor((hitbox.x + hitbox.w - 7) / tileSize);
    let topRow = Math.floor((hitbox.y + 6) / tileSize);
    let bottomRow = Math.floor((hitbox.y + hitbox.h - 7) / tileSize);

    for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            const behaviors = behaviorGrid?.[row]?.[column];
            // This will happen when the player moves off the edge of the screen.
            if (!behaviors) {
                //startSwimming = false;
                continue;
            }
            /*if (behaviors.climbable) {
                startClimbing = true;
            }
            if (!behaviors.water) {
                startSwimming = false;
            }*/
            if (behaviors.pit && enemy.z <= 0 && !enemy.flying) {
                const pitAnimation = new AnimationEffect({
                    animation: enemyFallAnimation,
                    x: column * 16 - 4, y: row * 16 - 4,
                });
                addObjectToArea(state, enemy.area, pitAnimation);
                enemy.status = 'gone';
                return;
            }
        }
    }
}
