import { objectHash } from 'app/content/objects/objectHash';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { FRAME_LENGTH, isRandomizer } from 'app/gameConstants';
import { setScript } from 'app/scriptEvents';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import { isObjectInCurrentSection } from 'app/utils/sections';


export class Narration implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    definition: NarrationDefinition;
    drawPriority = <const>'foreground';
    isObject = <const>true;
    x: number;
    y: number;
    ignorePits = true;
    status: ObjectStatus = 'normal';
    trigger: NarrationDefinition['trigger'];
    time: number;
    previewColor = 'yellow';
    constructor(state: GameState, definition: NarrationDefinition) {
        this.definition = definition;
        this.trigger = definition.trigger || 'touch';
        this.x = definition.x;
        this.y = definition.y;
        if (isRandomizer || getObjectStatus(state, this.definition)) {
            this.status = 'gone';
        }
        this.time = 0;
    }
    isActive(state: GameState) {
        return this.status === 'gone';
    }
    onActivate(state: GameState) {
        if (this.status !== 'gone' && this.trigger === 'activate') {
            this.runScript(state);
        }
    }
    onEnterArea(state: GameState): void {
        if (this.status !== 'gone' && this.trigger === 'enterSection') {
            this.runScript(state);
        }
    }
    getHitbox(state?: GameState): Rect {
        return { x: this.x, y: this.y, w: this.definition.w, h: this.definition.h };
    }
    runScript(state: GameState): void {
        setScript(state, this.definition.message);
        saveObjectStatus(state, this.definition);
        this.status = 'gone';
    }
    update(state: GameState) {
        if (this.status === 'gone') {
            if (this.definition.specialBehaviorKey && !isRandomizer && isObjectInCurrentSection(state, this)) {
                const specialBehavior = specialBehaviorsHash[this.definition.specialBehaviorKey] as SpecialNarrationBehavior;
                specialBehavior?.update(state, this);
            }
            return;
        }
        // If the flag gets set for some reason, set this object to gone so it won't trigger.
        if (getObjectStatus(state, this.definition)) {
            this.status = 'gone';
        }
        // Narration competes with other scripts, so don't run it until other scripts are completed.
        // Revive this code if it seems necessary
        /*if (state.scriptEvents.queue.length || state.scriptEvents.activeEvents.length || state.messagePage) {
            return;
        }*/
        this.time += FRAME_LENGTH;
        if (this.time < this.definition.delay) {
            return;
        }
        if (this.trigger === 'touch') {
            // This 'knocked' check is a hack to prevent triggering narration while falling.
            if (state.hero.area === this.area && state.hero.action !== 'knocked' && state.hero.action !== 'jumpingDown'
                && state.hero.overlaps(this)
            ) {
                this.runScript(state);
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
    }
}
objectHash.narration = Narration;
