import {BasicBullet} from 'app/arGames/hota/bullets';
import {addModifierEffectsToField, removeModifierEffectsFromField} from 'app/arGames/hota/modifiers';
import {drawUnitLifebar, updateTarget} from 'app/arGames/hota/utils';
import {FRAME_LENGTH} from 'app/gameConstants';
import {getFrame, drawFrameCenteredAtPoint} from 'app/utils/animations';
import {modifiableStat} from 'app/utils/modifiableStat';

interface HotaHeroProps extends Point {
    isEnemy?: boolean
    lane: HotaLane
    definition: HotaHeroDefinition
    mode: HotaHeroMode;
}
export class HotaHero implements BaseBattleUnit {
    unitType = 'hero' as const;
    definition = this.props.definition;
    animations = this.definition.animations;
    mode = this.props.mode;
    lane = this.props.lane;
    auras = this.definition.auras.map((definition) => createModifierEffect(this, definition));
    stats: HotaStats = {
        maxLife: modifiableStat(100, 1),
        damage: modifiableStat(this.definition.damage, 1),
        attacksPerSecond: modifiableStat(this.definition.attacksPerSecond, 0),
        range: modifiableStat(this.definition.range, 0),
        movementSpeed: modifiableStat(this.definition.movementSpeed, 0),
    };
    modifiers: HotaStatModifierEffect[] = [];
    life = 1;
    isEnemy = this.props.isEnemy ?? false;
    dx = this.isEnemy ? -1 : 1;
    x = this.props.x;
    y = this.props.y;
    radius = 8;
    hitHeight = 8;
    animationTime = 0;
    target?: BattleObject;
    attackCooldown = 0;
    done = false;
    constructor(public props: HotaHeroProps) {}
    getLife() {
        return this.life * this.getMaxLife();
    }
    getMaxLife() {
        return this.stats.maxLife();
    }
    getRange() {
        return this.stats.range();
    }
    onEnter(state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        if (this.auras) {
            addModifierEffectsToField(state, gameState, savedState, this, this.auras);
        }
    }
    onLeave(state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        if (this.auras) {
            removeModifierEffectsFromField(state, gameState, savedState, this, this.auras);
        }
    }
    onHit(state: GameState, gameState: HotaState, savedState: HotaSavedState, hit: HotaHitProperties): void {
        this.life -= hit.damage / this.getMaxLife();
    }
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        if (this.life <= 0) {
            if (!this.done) {
                this.done = true;
                this.onLeave(state, gameState, savedState);
            }
            return;
        }
        if (this.lane.winner) {
            return;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.mode === 'support') {
            // const unitsAhead = this.lane.objects.filter(o => o.isEnemy === this.isEnemy && )
        }
        updateTarget(this, this.lane.objects.filter(o => o.isEnemy !== this.isEnemy));
        if (this.attackCooldown > 0) {
            this.attackCooldown -= FRAME_LENGTH;
        }
        if (this.target) {
            const attacksPerSecond = this.stats.attacksPerSecond();
            if (this.attackCooldown <= 0 && attacksPerSecond > 0) {
                this.attackCooldown = 1000 / attacksPerSecond;
                const attack = new BasicBullet({
                    x: this.x + this.dx * this.radius,
                    y: this.y - 10,
                    target: this.target,
                    hit: {damage: this.stats.damage()},
                });
                this.lane.effects.push(attack);
            }
        } else {
            // Continue moving
            if (this.mode !== 'guard') {
                this.x += this.dx * this.stats.movementSpeed() / FRAME_LENGTH;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        const frame = getFrame(this.animations.idle.left, this.animationTime);
        context.save();
            context.translate(this.x, this.y);
            context.scale(-this.dx, 1);
            drawFrameCenteredAtPoint(context, frame, {x: 0, y: -4});
        context.restore();
        drawUnitLifebar(context, gameState, this, -10);
        //context.fillStyle = 'red';
        //context.fillRect(this.x - 1, this.y - 1, 2, 2);
    }
}

function createModifierEffect(source: BattleObject, definition: HotaStatModifierEffectDefinition): HotaStatModifierEffect {
    const effect: HotaStatModifierEffect = {
        modifiers: definition.modifiers,
        effectsTowers: definition.effectsTowers,
        effectsHeroes: definition.effectsHeroes,
        effectsMinions: definition.effectsMinions,
    };
    if (definition.scope === 'lane') {
        effect.lane = source.lane;
    }
    if (definition.isEnemy === true) {
        effect.isEnemy = !source.isEnemy;
    } else if (definition.isEnemy === false) {
        effect.isEnemy = !!source.isEnemy;
    }
    return effect;
}
