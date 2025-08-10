import {BasicBullet} from 'app/arGames/hota/bullets';
import {drawUnitLifebar, updateTarget} from 'app/arGames/hota/utils';
import {beetleMiniAnimations} from 'app/content/enemyAnimations';
import {FRAME_LENGTH} from 'app/gameConstants';
import {getFrame, drawFrameCenteredAtPoint} from 'app/utils/animations';
import {modifiableStat} from 'app/utils/modifiableStat';

interface MinionProps extends Point {
    isEnemy?: boolean
    lane: HotaLane
}
export class Minion implements BaseBattleUnit {
    unitType = 'minion' as const;
    lane = this.props.lane;
    stats: HotaStats = {
        maxLife: modifiableStat(50, 1),
        damage: modifiableStat(10, 1),
        attacksPerSecond: modifiableStat(1, 0),
        range: modifiableStat(32, 0),
        movementSpeed: modifiableStat(16, 0),
    };
    modifiers: HotaStatModifierEffect[] = [];
    life = 1;
    isEnemy = this.props.isEnemy ?? false;
    dx = this.isEnemy ? -1 : 1;
    x = this.props.x;
    y = this.props.y;
    radius = 8;
    animationTime = 0;
    target?: BattleObject;
    attackCooldown = 0;
    attackHeight = 3;
    hitHeight = 2;
    done = false;
    constructor(public props: MinionProps) {}
    getLife() {
        return this.life * this.getMaxLife();
    }
    getMaxLife() {
        return this.stats.maxLife();
    }
    getRange() {
        return this.stats.range();
    }
    onHit(state: GameState, gameState: HotaState, savedState: HotaSavedState, hit: HotaHitProperties): void {
        this.life -= hit.damage / this.getMaxLife();
    }
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        if (this.life <= 0) {
            this.done = true;
            return;
        }
        if (this.lane.winner) {
            return;
        }
        this.animationTime += FRAME_LENGTH;
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
                    y: this.y - this.attackHeight,
                    target: this.target,
                    hit: {damage: this.stats.damage()},
                });
                this.lane.effects.push(attack);
            }
        } else {
            // Continue moving
            this.x += this.dx * this.stats.movementSpeed() / FRAME_LENGTH;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        const frame = getFrame(beetleMiniAnimations.idle.left, this.animationTime);
        context.save();
            context.translate(this.x, this.y);
            context.scale(-this.dx, 1);
            drawFrameCenteredAtPoint(context, frame, {x: 0, y: -4});
        context.restore();
        drawUnitLifebar(context, gameState, this, -10);
        context.fillStyle = 'red';
        context.fillRect(this.x - 1, this.y - 1, 2, 2);
    }
}
