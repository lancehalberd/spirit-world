import {addTextCue} from 'app/content/effects/textCue';
import {Enemy} from 'app/content/enemy';
import {getDistanceToPoint, moveActorTowardsLocation} from 'app/movement/moveActor';
import {getCardinalDirection} from 'app/utils/direction';
import {getCardinalDirectionToTarget} from 'app/utils/target';

export function isFlameBeastEncounter(state: GameState, area: AreaInstance) {
    for (const enemy of area.alternateArea.enemies) {
        if (enemy.definition.enemyType === 'flameHeart' || enemy.definition.enemyType === 'flameBeast') {
            return true;
        }
    }
    return false;
}

export function updateJadeChampionFlameBeast(state: GameState, jadeChampion: JadeChampion) {
    if (jadeChampion.mode !== 'choose') {
        return;
    }
    const flameBeast = jadeChampion.area.alternateArea.objects.find(
        target => target instanceof Enemy
        && target.definition.enemyType === 'flameBeast'
    ) as Enemy;
    const isLavaDrainedOrDraining = state.savedState.objectFlags.craterLava4 || state.savedState.objectFlags.craterLava4Objects;
    if (flameBeast?.mode === 'hidden' && !isLavaDrainedOrDraining) {
        if (jadeChampion.modeTime % 10000 === 5000) {
            addTextCue(state, `Hit the switch when you're ready to face the Beast.`, 3000, 0);
        }
        return;
    }
    if (jadeChampion.currentAnimationKey === 'idle') {
        addTextCue(state, `Careful! I can feel it underneath us.`, 3000, 1);
        // TODO: control jadeChampion with a "isSwordDrawn boolean".
        jadeChampion.changeToAnimation('idleSword');
    }
    if (flameBeast.mode === 'regenerating' && flameBeast.modeTime >= 2000 && flameBeast.modeTime <= 3000) {
        if (jadeChampion.regenerationHints === 0) {
            if (addTextCue(state, 'The beast is drawing energy from the heart to recover!', 3000, 1)) {
                jadeChampion.regenerationHints++;
            }
        } else {
            addTextCue(state, 'Attack the heart while the beast is recovering!', 3000, 1);
        }
    }
    if (jadeChampion.potions > 0 && state.hero.life < 1 * state.hero.savedData.maxLife / 3 || state.hero.life < 4) {
        jadeChampion.setMode('usePotion');
        addTextCue(state, 'Drink jadeChampion to recover!', 3000, 1);
        jadeChampion.d = getCardinalDirectionToTarget(jadeChampion, state.hero);
        jadeChampion.changeToAnimation('cast', 'idleSword');
        return;
    }
    if (flameBeast.mode === 'attackUntilDamaged' || flameBeast.mode === 'protect') {
        // The flame beast attacks when it is near the platform, so move the Champion to attack it any time
        // it enters jadeChampion mode.
        const hitbox = flameBeast.getHitbox();
        // Calculate delta from center of area to the flame beast.
        const cx = jadeChampion.area.w * 16 / 2, cy = jadeChampion.area.h * 16 / 2;
        const dx = hitbox.x + hitbox.w / 2 - cx;
        const dy = hitbox.y + hitbox.h / 2 - cy;
        const mag = Math.sqrt(dx*dx+dy*dy);
        const targetPosition = {
            x: cx + dx * 48 / mag,
            y: cy + dy * 48 / mag,
        };
        // Move the Champion towards the target location for attacking the beast.
        // TODO: use a thrust attack as soon as the Champion is close enough to close the distance.
        if (!jadeChampion.moveTowardsLocation(state, targetPosition)) {
            jadeChampion.d = getCardinalDirection(dx, dy, jadeChampion.d);
            jadeChampion.setMode('slash');
        }
        return;
    }
    // Give the player a hint to go to the material world if they stay too long in the Spirit World while
    // an orb is protecting the heart and the flame Beast is regenerating.
    // If the lava is filled, give the hero a hint about draining the lava.
   /* if (
        flameBeast.mode === 'regenerate'
        && jadeChampion.area !== state.hero.area
        && isOrbProtectingHeart(state, jadeChampion.area.alternateArea)
        && jadeChampion.modeTime % 10000 === 4000
    ) {
        addTextCue(state, 'There is something in the Spirit World protecting the heart!', 3000, 1);
    }*/
    const cx = jadeChampion.area.w * 16 / 2, cy = jadeChampion.area.h * 16 / 2;
    const theta = Math.PI * (Math.cos(state.fieldTime / 2000) + 1) / 2;
    const idlePosition = {
        x: cx + 56 * Math.cos(theta),
        y: cy + 8 + 32 * Math.abs(Math.sin(theta)),
    };
    const distance = getDistanceToPoint(state, jadeChampion, idlePosition);
    if (distance > 30 ||
        (distance > 1 && jadeChampion.currentAnimationKey ==='moveSword')
    ) {
        moveActorTowardsLocation(state, jadeChampion, idlePosition, 2);
        jadeChampion.changeToAnimation('moveSword');
    } else {
        jadeChampion.d = 'up';
        jadeChampion.changeToAnimation('idleSword');
    }
}
