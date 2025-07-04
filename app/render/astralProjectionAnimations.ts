import {getCloneMovementDeltas} from 'app/userInput';
import {heroSpiritAnimations} from 'app/render/heroAnimations';
import {getFrame} from 'app/utils/animations';
import {directionMap, getCardinalDirection} from 'app/utils/direction';

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
