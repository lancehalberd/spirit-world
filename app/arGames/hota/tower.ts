import {BasicBullet} from 'app/arGames/hota/bullets';
import {Minion} from 'app/arGames/hota/minion';
import {addUnitToLane, drawUnitLifebar, rowHeight, updateTarget} from 'app/arGames/hota/utils';
import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, getFrame, drawFrameCenteredAtPoint} from 'app/utils/animations';
import {modifiableStat} from 'app/utils/modifiableStat';

const coilAnimation = createAnimation('gfx/objects/coils.png', {w: 16, h: 16, content: {x: 4, y: 10, w: 8, h: 4}}, {cols: 2, duration: 10});
interface TowerProps extends Point {
    life?: number
    isEnemy?: boolean
    lane: HotaLane
}
export class Tower implements BaseBattleUnit {
    unitType = 'tower' as const;
    lane = this.props.lane;
    stats: HotaStats = {
        maxLife: modifiableStat(200, 1),
        damage: modifiableStat(40, 1),
        attacksPerSecond: modifiableStat(1, 0),
        range: modifiableStat(48, 0),
        movementSpeed: modifiableStat(0, 0),
    };
    modifiers: HotaStatModifierEffect[] = [];
    // Stored as a multiple of maxLife so that it will automatically scale as maxLife changes.
    life = 1;
    isEnemy = this.props.isEnemy ?? false;
    dx = this.isEnemy ? -1 : 1;
    x = this.props.x;
    y = this.props.y;
    radius = 12;
    hitHeight = 8;
    animationTime = 0;
    minions: Minion[] = [];
    minionCooldown = 1000;
    maxMinions = 4;
    target?: BattleObject;
    done = false;
    attackCooldown = 0;
    constructor(public props: TowerProps) {}
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
        if (this.life <= 0) {
            this.lane.winner = this.isEnemy ? 'player' : 'enemy';
            this.lane.winTime = gameState.sceneTime;
        }
    }
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        if (this.life <= 0) {
            this.done = true;
            return;
        }
        this.animationTime += FRAME_LENGTH;
        this.minions = this.minions.filter(minion => minion.life > 0);
        if (this.minionCooldown > 0) {
            this.minionCooldown -= FRAME_LENGTH;
        } else if (this.minions.length <= this.maxMinions - 2) {
            for (let i = 0; i < 2; i++) {
                const minion = new Minion({
                    lane: this.lane,
                    x: this.x + this.dx * 16,
                    y: this.y - rowHeight / 2 + rowHeight / 4 + rowHeight / 2 * i,
                    isEnemy: this.isEnemy,
                });
                this.minions.push(minion);
                addUnitToLane(state, gameState, savedState, this.lane, minion);
            }
            this.minionCooldown = 6000;
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
                    y: this.y - 20,
                    target: this.target,
                    hit: {damage: this.stats.damage()},
                    innerColor: '#FF0',
                    outerColor: '#880',
                });
                this.lane.effects.push(attack);
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState): void {
        if (this.life <= 0) {
            // TODO: Render destroyed tower.
            return;
        }
        const frame = getFrame(coilAnimation, this.animationTime);
        context.save();
            context.translate(this.x, this.y);
            context.scale(2, 2);
            drawFrameCenteredAtPoint(context, frame, {x: 0, y: 0});
        context.restore();
        drawUnitLifebar(context, gameState, this, -10);
        //context.fillStyle = 'red';
        //context.fillRect(this.x - 1, this.y - 1, 2, 2);
    }
}
