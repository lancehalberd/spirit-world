import { renderIndicator } from 'app/content/objects/indicator';
import { objectHash } from 'app/content/objects/objectHash';
import { editingState } from 'app/development/editingState';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import {
    renderAreaObjectsBeforeHero,
    renderAreaObjectsAfterHero,
    renderForegroundObjects,
} from 'app/render/renderField';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { getBackgroundFrame } from 'app/utils/area';
import { createCanvasAndContext, drawCanvas } from 'app/utils/canvas';
import { enterLocation } from 'app/utils/enterLocation';
import { enterZoneByTarget } from 'app/utils/enterZoneByTarget';
import { getTileBehaviorsAndObstacles } from 'app/utils/field';
import { isObjectInsideTarget, pad } from 'app/utils/index';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import { getVectorToTarget } from 'app/utils/target';



const floorAnimation = createAnimation('gfx/tiles/spirit_regeneration_bottom.png', {w: 16, h: 32}, {x: 0, cols: 4, duration: 5})

export class Teleporter implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    definition: EntranceDefinition = null;
    x: number;
    y: number;
    active: boolean = false;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    disabledTime = 0;
    isObject = <const>true;
    linkedObject: Teleporter;
    wasUnderObject: boolean;
    actualRadius: number = 0;
    disabledUntilHeroLeaves = false;
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = getObjectStatus(state, definition) ? 'normal' : this.definition.status;
    }
    changeStatus(state: GameState, status: ObjectStatus) {
        this.status = status;
        if (this.status === 'normal') {
            saveObjectStatus(state, this.definition);
        }
        if (this.linkedObject && this.linkedObject.status !== status) {
            const linkedId = this.linkedObject.definition.id;
            // Do not activate a linked teleporter if it has an explicit
            // distinct ID.
            if (linkedId || linkedId !== this.definition.id) {
                return;
            }
            // TODO: We may also need to check if the linked object has special logic preventing its
            // display and also not change its status if that logic is still false.
            // I don't think this currently applies to anything, so I'll do this later if necessary.
            this.linkedObject.changeStatus(state, status);
        }
    }
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    getRenderBox(state: GameState): Rect {
        const size = ((this.actualRadius / 2) | 0) * 2;
        return {
            x: this.x + 8 - size / 2,
            y: this.y + 8 - size / 2,
            w: size,
            h: size,
        };
    }
    getTargetRadius(state: GameState): number {
        if (state.hero.area !== this.area) {
            return 0;
        }
        const { mag } = getVectorToTarget(state, this, state.hero);
        let size = Math.min(128, Math.max(0, 128 * 32 * 32 / mag / mag));
        size = ((size / 2) | 0) * 2;
        return size;
    }
    isUnderObject(state: GameState): boolean {
        if (!this.area) {
            return false;
        }
        const heroAndClones = new Set([state.hero, ...(state.hero.clones || [])]);
        const {tileBehavior} = getTileBehaviorsAndObstacles(state, this.area, {x: this.x + 8, y: this.y + 8}, heroAndClones);
        return tileBehavior.solid;
    }

    isHeroInPortal(state: GameState) {
        return isObjectInsideTarget(state.hero, pad(this.getHitbox(), 9));
    }

    update(state: GameState) {
        if (this.disabledUntilHeroLeaves) {
            if (!this.isHeroInPortal(state)) {
                this.disabledUntilHeroLeaves = false;
            }
            return;
        }
        if (this.status !== 'normal' && state.hero.actionTarget !== this) {
            if (state.savedState.objectFlags[this.definition.id]) {
                this.changeStatus(state, 'normal');
            }
            return;
        }
        if (!state.hero.savedData.passiveTools.spiritSight && !state.hero.savedData.passiveTools.trueSight) {
            return;
        }
        if (this.isUnderObject(state)) {
            this.wasUnderObject = true;
            return;
        } else if (this.wasUnderObject) {
            this.wasUnderObject = false;
            playAreaSound(state, this.area, 'secretChime');
        }
        const targetRadius = this.getTargetRadius(state);
        if (this.actualRadius < targetRadius) {
            this.actualRadius = Math.min(targetRadius, this.actualRadius + 4);
        } else if (this.actualRadius > targetRadius) {
            this.actualRadius = Math.max(targetRadius, this.actualRadius - 8);
        }
        this.animationTime += FRAME_LENGTH;
        const hero = state.hero;
        if (this.disabledTime > 0) {
            this.disabledTime -= FRAME_LENGTH;
            return;
        }
        if (hero.actionTarget === this || this.area !== hero.area || !this.isHeroInPortal(state)) {
            return;
        }
        if (hero.justRespawned) {
            this.disabledUntilHeroLeaves = true;
            return;
        }
        if (!this.definition.targetZone) {
            enterLocation(state, {
                ...state.location,
                x: hero.x,
                y: hero.y,
                d: hero.d,
                isSpiritWorld: !state.location.isSpiritWorld,
            }, false, () => {
                if (this.linkedObject) {
                    this.linkedObject.disabledUntilHeroLeaves = true;
                }
            });
        } else {
            enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, this.definition, false);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal' && !editingState.isEditing) {
            if (state.hero.savedData.passiveTools.trueSight) {
                renderIndicator(context, this.getHitbox(), state.fieldTime);
            }
            return;
        }
        if (this.isUnderObject(state) && !editingState.isEditing) {
            if (state.hero.savedData.passiveTools.trueSight) {
                renderIndicator(context, this.getHitbox(), state.fieldTime);
            }
            return;
        }
        if (!this.definition.targetZone || !this.definition.targetObjectId) {
            return;
        }
        if (!state.hero.savedData.passiveTools.spiritSight && !state.hero.savedData.passiveTools.trueSight) {
            return;
        }
        const gradient = context.createLinearGradient(0, 0, 0, 16);
        gradient.addColorStop(0.2 + 0.1 * Math.cos(this.animationTime / 400), 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.8 + 0.1 * Math.cos(this.animationTime / 400), 'rgba(255, 255, 255, 0.7)');
        context.save();
        context.fillStyle = gradient;
        context.translate(this.x, this.y);
        context.fillRect(0, 0, 16, 16);
        context.restore();
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal' && !editingState.isEditing) {
            return;
        }
        if (this.isUnderObject(state) && !editingState.isEditing) {
            return;
        }
        if (this.definition.targetZone && this.definition.targetObjectId) {
            return;
        }
        if (!state.hero.savedData.passiveTools.spiritSight && !state.hero.savedData.passiveTools.trueSight) {
            return;
        }
        const hitbox = this.getRenderBox(state);
        updateSpiritCanvas(state, hitbox);
        drawCanvas(context, spiritCanvas,
            {x: 0, y: 0, w: hitbox.w, h: hitbox.h},
            hitbox
        );

        context.save();
        context.globalAlpha *= 0.7;
            const frame = getFrame(floorAnimation, this.animationTime);
            drawFrame(context, frame, {...frame, x: this.x, y: this.y - 16});
        context.restore();
    }
}

const maxPortalWidth = 128, maxPortalHeight = 128;

const [spiritCanvas, spiritContext] = createCanvasAndContext(maxPortalWidth, maxPortalHeight);
let isRenderingSpiritCanvas = false;

//let spiritCanvasRadius: number;
function updateSpiritCanvas(state: GameState, hitbox: Rect): void {
    // Prevent recursively running this function.
    if (isRenderingSpiritCanvas) {
        return;
    }
    isRenderingSpiritCanvas = true;
    const spiritAlpha = 1;
    const x = hitbox.w / 2;
    const y = hitbox.h / 2
    const area = state.alternateAreaInstance;
    spiritContext.save();
        spiritContext.clearRect(0, 0, spiritCanvas.width, spiritCanvas.height);
        const gradient = spiritContext.createRadialGradient(x, y, 0, x, y, hitbox.w / 2);
        gradient.addColorStop(0.1, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spiritContext.fillStyle = 'white';
        spiritContext.globalAlpha = spiritAlpha;
        spiritContext.fillStyle = gradient;
        spiritContext.beginPath();
        spiritContext.arc(x, y, hitbox.w / 2, 0, 2 * Math.PI);
        spiritContext.fill();
        spiritContext.globalAlpha = 1;
        spiritContext.globalCompositeOperation = 'source-atop';
        spiritContext.translate(
            -(hitbox.x) | 0,
            -(hitbox.y) | 0
        );
        /*spiritContext.drawImage(
            area.canvas,
            hitbox.x, hitbox.y, hitbox.w, hitbox.h,
            hitbox.x, hitbox.y, hitbox.w, hitbox.h,
        );*/
        drawCanvas(spiritContext, getBackgroundFrame(state, area).canvas,
            hitbox,
            hitbox
        );
        for (const object of area.objectsToRender) {
            if (object.drawPriority === 'background' || object.getDrawPriority?.(state) === 'background') {
                object.render?.(spiritContext, state);
            }
        }
        renderAreaObjectsBeforeHero(spiritContext, state, area, true);
        renderAreaObjectsAfterHero(spiritContext, state, area, true);
        if (area?.foregroundCanvas) {
            /*spiritContext.drawImage(
                area.foregroundCanvas,
                hitbox.x, hitbox.y, hitbox.w, hitbox.h,
                hitbox.x, hitbox.y, hitbox.w, hitbox.h,
            );*/
            drawCanvas(spiritContext, area.foregroundCanvas,
                hitbox,
                hitbox
            );
        }
        renderForegroundObjects(spiritContext, state, area, true);
    spiritContext.restore();
    if (state.zone.surfaceKey && !area.definition.isSpiritWorld) {
        spiritContext.save();
            spiritContext.globalCompositeOperation = 'source-atop';
            spiritContext.globalAlpha = 0.6;
            spiritContext.fillStyle = 'blue';
            spiritContext.fillRect(0, 0, spiritCanvas.width, spiritCanvas.height);
        spiritContext.restore();
    }
    isRenderingSpiritCanvas = false;
}
objectHash.teleporter = Teleporter;
