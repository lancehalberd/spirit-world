import {addDustBurst, addReviveBurst} from 'app/content/effects/animationEffect';
import {CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {showDefeatedMenuScene} from 'app/scenes/defeated/showDefeatedScene';
import {translateContextForAreaAndCamera} from 'app/scenes/field/renderField';
import {sceneHash} from 'app/scenes/sceneHash';
import {isGameKeyDown} from 'app/userInput';
import {clamp} from 'app/utils/index';
import {saveGame} from 'app/utils/saveGame';
import {drawText} from 'app/utils/simpleWhiteFont';
import {playSound} from 'app/utils/sounds';

export class DefeatedScene implements GameScene {
    sceneType = 'defeated';
    blocksInput = true;
    blocksUpdates = true;
    time = 0;
    reviving = false;
    update(state: GameState) {
        if (!isGameKeyDown(state, GAME_KEY.WEAPON)) {
            // Uncomment to inspect the defeat animation.
            //return;
        }
        this.time += FRAME_LENGTH;
        for (const effect of state.areaInstance.effects) {
            if (effect.drawPriority === 'background-special' || effect.drawPriority === 'foreground-special') {
                effect.update?.(state);
            }
        }
        if (this.time === 1000) {
            const hitbox = state.hero.getHitbox();
            addDustBurst(state, state.areaInstance,
                hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, state.hero.z);
        }
        // Add 0.5s pause afer showing menu before taking input so that players don't accidentally take action.
        // This also gives them a bit to see the "Hang in there!" message before their life starts refilling
        // when they have a revive available.
        if (this.time < 2000) {
            return;
        }
        if (this.reviving) {
            // Show a burst of particles right before the MC gets up
            // and starts regaining life.
            if (this.time === 2400) {
                const hitbox = state.hero.getHitbox();
                addReviveBurst(state, state.areaInstance,
                    hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, state.hero.z);
            }
            if (this.time < 2500) {
                return;
            }
            // This is a hack to make the reviveTime advance even though the fieldTime is paused while
            // reviving. `reviveTime` is used for displaying the frame for the animation at the top of
            // the spirit bar that represents whether the player has a revive. It plays in reverse
            // when the hero consumes the revive here.
            state.reviveTime -= FRAME_LENGTH;
            if (this.time % 200 === 0) {
                state.hero.life = Math.min(state.hero.savedData.maxLife, state.hero.life + 0.5);
                if (state.hero.life === state.hero.savedData.maxLife) {
                    state.sceneStack.pop();
                    // Give the hero 1 second of iframes after reviving.
                    state.hero.invulnerableFrames = 50;
                    saveGame(state);
                }
                state.hero.displayLife = state.hero.life;
                playSound('heart');
            }
            // This value is designed to make the magic increase smoothly in lock step with the life.
            // It matches the life exactly when defeatTime % 200 === 0, and then interpolates linearly over the 200ms, matching the
            // same 0.5 life per 200ms that the life increases discretely.
            const smoothMagicValue = state.hero.maxMagic * (state.hero.life + 0.5 * (this.time % 200) / 200) / state.hero.savedData.maxLife;
            state.hero.magic = clamp(smoothMagicValue, state.hero.magic, state.hero.maxMagic);
        } else if (state.hero.savedData.hasRevive) {
            this.reviving = true;
            state.hero.savedData.hasRevive = false;
            state.hero.frozenDuration = 0;
            state.hero.burnDuration = 0;
        } else {
            showDefeatedMenuScene(state);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        context.save();
            if (this.reviving) {
                context.globalAlpha *= 0.7 * (1 - state.hero.life / state.hero.savedData.maxLife);
            } else {
                context.globalAlpha *= (state.hero.savedData.hasRevive ? 0.7 : 1) * Math.min(1, this.time / 1000);
            }
            context.fillStyle = '#000';
            context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.restore();
        context.save();
            // render the hero + special effects on top of the dark background.
            translateContextForAreaAndCamera(context, state, state.areaInstance);
            for (const effect of state.areaInstance.objectsToRender) {
                if (effect.drawPriority === 'background-special') {
                    effect.render?.(context, state);
                }
            }
            state.hero.render(context, state);
            for (const effect of state.areaInstance.objectsToRender) {
                if (effect.drawPriority === 'foreground-special') {
                    effect.render?.(context, state);
                }
            }
        context.restore();

        if (this.reviving) {
            context.save();
                const missingLife = state.hero.savedData.maxLife - state.hero.life;
                if (missingLife < 3) {
                    context.globalAlpha *= missingLife / 3;
                }
                drawText(context, 'HANG IN THERE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 32, {
                    textBaseline: 'middle',
                    textAlign: 'center',
                    size: 16,
                });
            context.restore();
        }
    }
}

sceneHash.defeated = new DefeatedScene();
