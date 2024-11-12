import { Hero } from 'app/content/hero';
import { getCloneMovementDeltas } from 'app/userInput';
import { renderCarriedTile } from 'app/renderActor';
import { heroSpiritAnimations } from 'app/render/heroAnimations';
import { drawFrameAt, getFrame } from 'app/utils/animations';
import { directionMap, getCardinalDirection } from 'app/utils/direction';



let lastPullAnimation: AnimationSet = null;
export function getSpiritFrame(state: GameState, hero: Hero): Frame {
    let animations: ActorAnimations['idle'];
    switch (hero.action) {
        // Grabbing currently covers animations for pulling/pushing objects that are grabbed.
        case 'grabbing':
            const [dx, dy] = directionMap[hero.d];
            const oppositeDirection = getCardinalDirection(-dx, -dy);
            const [kdx, kdy] = getCloneMovementDeltas(state, hero);
            if (hero.grabObject?.pullingHeroDirection === oppositeDirection) {
                lastPullAnimation = heroSpiritAnimations.pull;
                return getFrame(lastPullAnimation[hero.d], hero.animationTime);
            } else if (hero.grabObject?.pullingHeroDirection) {
                lastPullAnimation = heroSpiritAnimations.push;
                return getFrame(lastPullAnimation[hero.d], hero.animationTime);
            } else if (kdx * dx < 0 || kdy * dy < 0) {
                // If the player is not moving but pulling away from the direction they are grabbing,
                // show the pull animation to suggest the player is *trying* to pull the object they
                // are grabbing even though it won't move.
                animations = heroSpiritAnimations.pull;
                return getFrame(animations[hero.d], hero.animationTime);
            }
            // If the player continously pushes/pulls there is one frame that isn't set correctly,
            // so we use this to play that last animation for an extra frame.
            if (lastPullAnimation) {
                const frame = getFrame(lastPullAnimation[hero.d], hero.animationTime);
                lastPullAnimation = null;
                return frame;
            }
            animations = heroSpiritAnimations.grab;
            break;
        case 'pushing':
            animations = heroSpiritAnimations.push;
            break;
        case 'walking':
            animations = heroSpiritAnimations.move;
            break;
        default:
            animations = heroSpiritAnimations.idle;
    }
    return getFrame(animations[hero.d], hero.animationTime);
}

export class AstralProjection extends Hero {
    constructor(state: GameState, hero: Hero) {
        super();
        this.isAstralProjection = true;
        this.isAirborn = true;
        this.life = state.hero.magic;
        this.x = hero.x;
        this.y = hero.y;
        this.w = hero.w;
        this.h = hero.h;
        this.d = hero.d;
        this.invulnerableFrames = 0;
        this.savedData = {...hero.savedData};
        this.savedData.leftTool = this.savedData.rightTool = null;
        this.z = 4;
    }
    render(this: Hero, context: CanvasRenderingContext2D, state: GameState): void {
        const hero = this;
        const frame = getSpiritFrame(state, hero);
        context.save();
            context.globalAlpha *= 0.7;
            if (state.hero.magic <= 10 || this.invulnerableFrames > 0) {
                // Spirit flashes when teleportation will end meditation by bringing magic under 10.
                context.globalAlpha *= ((this.animationTime % 200 < 100) ? 0.2 : 0.4);
            } else if (state.hero.magic < state.hero.maxMagic / 2) {
                context.globalAlpha *= 0.7 * 2 * state.hero.magic / state.hero.maxMagic;
            }
            drawFrameAt(context, frame, { x: hero.x, y: hero.y });
        context.restore();
        if (hero.pickUpTile) {
            renderCarriedTile(context, state, hero);
        }
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (this.invulnerableFrames > 0) {
            return {};
        }
        if (hit.damage) {
            // Astral projection damage is applied to the magic meter at 5x effectiveness.
            state.hero.spendMagic(Math.max(10, hit.damage * 5));
            // Astral projection has fewer invulnerability frames since it can't be killed
            // and magic regenerates automatically.
            this.invulnerableFrames = 20;
        }
        if (hit.knockback) {
            this.throwHeldObject(state);
            this.action = 'knocked';
            this.animationTime = 0;
            this.vx = hit.knockback.vx;
            this.vy = hit.knockback.vy;
            this.vz = hit.knockback.vz;
        }
        return {
            hit: true,
            pierced: true,
        }
    }
}
