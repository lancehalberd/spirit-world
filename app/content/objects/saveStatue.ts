import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { setSpawnLocation } from 'app/content/spawnLocations';
import { isRandomizer } from 'app/gameConstants';
import { showMessage } from 'app/scriptEvents';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { selectDialogueOption } from 'app/utils/dialogue';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import { FRAME_LENGTH } from 'app/gameConstants';


const geometry = {w: 32, h: 48};
const [saveStatue] = createAnimation('gfx/tiles/savepoint.png', geometry).frames;


export class SaveStatue implements ObjectInstance {
    area: AreaInstance;
    definition: SimpleObjectDefinition;
    drawPriority: 'sprites' = 'sprites';
    behaviors = {
        solid: true,
    };
    isObject = <const>true;
    linkedObject: SaveStatue;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    isNeutralTarget = true;
    time = 0;
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x + 4, y: this.y, w: 24, h: 16 };
    }
    onGrab(state: GameState, direction: Direction, hero: Hero) {
        // Don't take actions that would start new scripts while running scripts.
        if (state.scriptEvents.activeEvents.length || state.scriptEvents.queue.length) {
            return
        }
        if (this.status !== 'normal') {
            return;
        }
        if (hero.isAstralProjection) {
            return;
        }
        // Remove the grab action since the hero is interacting with the statue, not grabbing it.
        hero.action = null;
        setSpawnLocation(state, {
            ...state.location,
            x: this.x + 8,
            y: this.y + 16,
        });
        state.hero.life = state.hero.maxLife;
        if (state.hero.magicRegen > 0 && (!this.area.isCorrosive || state.hero.passiveTools.waterBlessing)) {
            state.hero.magic = state.hero.maxMagic;
            state.hero.magicRegenCooldown = 0;
        }
        if (getObjectStatus(state, this.definition)) {
            if (!state.hero.hasRevive) {
                showMessage(state, '{@saveStatue.reviveChoice}');
            } else {
                showMessage(state, `You will return here if defeated.`);
            }
        } else if (isRandomizer) {
            showMessage(state, '{@saveStatue.randomizer}');
            saveObjectStatus(state, this.definition, true);
        } else {
            // The save statue only shows one set of dialog per area and only
            // the first time you interact with it.
            const dialogueOption = selectDialogueOption(state, 'saveStatue');
            showMessage(state, dialogueOption.text[0]);
            saveObjectStatus(state, this.definition, true);
        }
    }
    update(state: GameState) {
        this.time += FRAME_LENGTH;
        // The statue sparkles if you haven't used it yet.
        if (this.time % 100 === 0 && !getObjectStatus(state, this.definition)) {
            addSparkleAnimation(state, this.area, this.getHitbox(state), {});
        }
    }
    render(context, state: GameState) {
        const frame = saveStatue;
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - 32 });
    }
}
objectHash.saveStatue = SaveStatue;
