import { renderIndicator } from 'app/content/objects/indicator';
import { objectHash } from 'app/content/objects/objectHash';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { playAreaSound } from 'app/musicController';
import { createAnimation, drawFrameContentAt } from 'app/utils/animations';
import { rectanglesOverlap } from 'app/utils/index';
import { getObjectStatus, saveObjectStatus} from 'app/utils/objects';
import { checkIfAllSwitchesAreActivated } from 'app/utils/switches';


const [
    upFrame,
    partialDownFrame,
    fullDownFrame,
] = createAnimation('gfx/objects/locked_tile_switch.png', {w: 32, h: 36, content: {x: 0, y: 4, w: 32, h: 32}}, {cols: 8, frameMap: [3, 4, 7]}).frames;

export class HeavyFloorSwitch implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    isObject = <const>true;
    isNeutralTarget = true;
    status: ObjectStatus = 'normal';
    x = this.definition.x;
    y = this.definition.y;
    wasDepressed = false;
    constructor(state: GameState, public definition: HeavyFloorSwitchDefinition) {
        this.status = this.getLogicalStatus(state);
    }
    getLogicalStatus(state: GameState): ObjectStatus {
        if (!this.definition.id) {
            return this.status;
        }
        if (getObjectStatus(state, this.definition) === !this.definition.isInverted) {
            return 'active';
        }
        return 'normal';
    }
    getHitbox(): Rect {
        return {x: this.x + 2, y: this.y + 2, w: 28, h: 28};
    }
    isDepressed(state: GameState): boolean {
        const hitbox = this.getHitbox();
        if (state.hero.z <= 0 && state.hero.area === this.area && rectanglesOverlap(state.hero.getFloorHitbox(), hitbox)) {
            return true;
        }
        for (const object of this.area.objects) {
            // Only solid objects with hitboxes can press switches.
            if (object === this || !(object.getFloorHitbox || object.getHitbox) || !(object.behaviors?.solid || object.canPressSwitches)) {
                continue;
            }
            const objectHitbox = object.getFloorHitbox?.() || object.getHitbox();
            if (!(object.z > 0) && rectanglesOverlap(objectHitbox, hitbox)) {
                return true;
            }
        }
        return false;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (hit.isStomp || (hit.isStaff && hit.isStaffValid && !hit.isBonk)) {
            this.onToggle(state);
        }
        return {};
    }
    onToggle(state: GameState): void {
        if (this.status === 'active') {
            return;
        }
        this.status = 'active';
        saveObjectStatus(state, this.definition, true);
        if (this.definition.id && (this.definition.saveStatus === 'forever' || this.definition.saveStatus === 'zone')) {
            // Refresh the area to update layer logic, for example drainging lava in the crater.
            state.areaInstance.needsLogicRefresh = true;
        }
        if (this.definition.specialBehaviorKey) {
            const specialBehavior = specialBehaviorsHash[this.definition.specialBehaviorKey] as SpecialSwitchBehavior;
            specialBehavior?.onActivate?.(state, this);
        }
        playAreaSound(state, this.area, 'switch');
        checkIfAllSwitchesAreActivated(state, this.area, this.definition);
    }

    update(state: GameState) {
        // This does nothing if the switch isn't assigned an ID.
        // This breaks the Flame Beast switches, and isn't used for anything, so I'm disabling this for now.
        // this.status = this.getLogicalStatus(state);
        // Switches with save status turned on stay depressed after they are stepped on.
        if (this.status === 'active') {
            return;
        }
        const isDepressed = this.isDepressed(state);
        // Make a small noise when the switch becomes partially depressed.
        if (this.wasDepressed !== isDepressed) {
            playAreaSound(state, this.area, 'smallSwitch');
        }
        this.wasDepressed = isDepressed;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status === 'active') {
            drawFrameContentAt(context, fullDownFrame, {x: this.x, y: this.y});
        } else if (this.wasDepressed) {
            drawFrameContentAt(context, partialDownFrame, {x: this.x, y: this.y});
        } else {
            drawFrameContentAt(context, upFrame, {x: this.x, y: this.y});
        }
        // Indicate that this object was invisible without true sight.
        if (this.definition.isInvisible && state.hero.savedData.passiveTools.trueSight) {
            renderIndicator(context, this.getHitbox(), state.fieldTime);
        }
    }
}
objectHash.heavyFloorSwitch = HeavyFloorSwitch;

class _HeavyFloorSwitch extends HeavyFloorSwitch {}
declare global {
    export interface HeavyFloorSwitch extends _HeavyFloorSwitch {}
}
