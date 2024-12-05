import { addDustBurst, addReviveBurst } from 'app/content/effects/animationEffect';
import {
    fixSpawnLocationOnLoad,
} from 'app/content/spawnLocations';
import {
    FRAME_LENGTH, GAME_KEY,
} from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import {showTitleScene} from 'app/scenes/title/showTitleScene';
import {
    isGameKeyDown,
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { returnToSpawnLocation } from 'app/utils/returnToSpawnLocation'
import { saveGame } from 'app/utils/saveGame';

export function updateDefeated(state: GameState) {
    if (!isGameKeyDown(state, GAME_KEY.WEAPON)) {
        // Uncomment to inspect the defeat animation.
        //return;
    }
    state.defeatState.time += FRAME_LENGTH;
    for (const effect of state.areaInstance.effects) {
        if (effect.drawPriority === 'background-special' || effect.drawPriority === 'foreground-special') {
            effect.update?.(state);
        }
    }
    if (state.defeatState.time === 1000) {
        const hitbox = state.hero.getHitbox();
        addDustBurst(state, state.areaInstance,
            hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, state.hero.z);
    }
    // Add 0.5s pause afer showing menu before taking input so that players don't accidentally take action.
    // This also gives them a bit to see the "Hang in there!" message before their life starts refilling
    // when they have a revive available.
    if (state.defeatState.time < 2000) {
        return;
    }
    if (state.hero.savedData.hasRevive) {
        state.defeatState.reviving = true;
        state.hero.savedData.hasRevive = false;
        state.hero.frozenDuration = 0;
        state.hero.burnDuration = 0;
    }
    if (state.defeatState.reviving) {
        // Show a burst of particles right before the MC gets up
        // and starts regaining life.
        if (state.defeatState.time === 2400) {
            const hitbox = state.hero.getHitbox();
            addReviveBurst(state, state.areaInstance,
                hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, state.hero.z);
        }
        if (state.defeatState.time < 2500) {
            return;
        }
        // This is a hack to make the reviveTime advance even though the fieldTime is paused while
        // reviving.
        state.reviveTime -= FRAME_LENGTH;
        if (state.defeatState.time % 200 === 0) {
            state.hero.life = Math.min(state.hero.savedData.maxLife, state.hero.life + 0.5);
            if (state.hero.life === state.hero.savedData.maxLife) {
                state.defeatState.defeated = false;
                saveGame(state);
            }
            state.hero.displayLife = state.hero.life;
            playAreaSound(state, state.areaInstance, 'heart');
        }
        return;
    }
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuIndex = (state.menuIndex + 1) % 2;
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % 2;
    } else if (wasConfirmKeyPressed(state)) {
        if (state.menuIndex === 0) {
            fixSpawnLocationOnLoad(state);
            returnToSpawnLocation(state);
            state.paused = false;
        } else if (state.menuIndex === 1) {
            showTitleScene(state);
            state.paused = false;
        }
    }
}
