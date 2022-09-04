import { createCanvasAndContext } from 'app/dom';
import { addObjectToArea, removeObjectFromArea } from 'app/content/areas';
import { getObjectStatus, saveObjectStatus } from 'app/content/objects';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, drawFrameAt, getFrame } from 'app/utils/animations';
import { coverTile, getTileBehaviorsAndObstacles } from 'app/utils/field';
import { boxesIntersect } from 'app/utils/index';
import {
    AreaInstance, DrawPriority, FrameWithPattern, GameState,
    ObjectInstance, ObjectStatus, BeadCascadeDefinition, SimpleObjectDefinition,
    Rect,
} from 'app/types';

const crystalBeadsBasePattern = createAnimation('gfx/effects/beadcascadeunder.png', {w: 16, h: 16},
    {cols: 8, duration: 3});
const crystalBeadsBottomAnimation = createAnimation('gfx/effects/beadcascadeunder.png', {w: 16, h: 16},
    {y: 1, cols: 8, duration: 3});
const crystalBeadsBaseOverPattern = createAnimation('gfx/effects/beadcascadeover.png', {w: 16, h: 16},
    {x: 1, cols: 7, duration: 2});
const crystalBeadsBottomOverAnimation = createAnimation('gfx/effects/beadcascadeover.png', {w: 16, h: 16},
    {x: 1, y: 1, cols: 7, duration: 2});

function findBeadCutoff(this: void, state: GameState, area: AreaInstance, x: number, sy: number): number {
    for (let y = Math.floor(sy / 16) * 16 + 8; y < 512; y += 16) {
        const { objects } = getTileBehaviorsAndObstacles(
            state, area, {x: x + 8, y},
            null, null, object => {
                if (object.definition?.type !== 'beadGrate') {
                    return false;
                }
                const grate = object as BeadGrate;
                return (grate.status === 'normal' && grate.animationTime >= grateOpenAnimation.duration / 2) ||
                    (grate.status === 'closed' && grate.animationTime <= grateCloseAnimation.duration / 2);
            }
        );
        if (objects.length) {
            return objects[0].y + 8;
        }
    }
    return 512;
}

const beadTileIndex = 1135;

export class BeadCascade implements ObjectInstance {
    area: AreaInstance;
    definition: BeadCascadeDefinition;
    drawPriority: DrawPriority = 'background';
    ignorePits = true;
    x: number;
    y: number;
    w: number = 32;
    h: number = 16;
    isObject = <const>true;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    constructor(state: GameState, definition: BeadCascadeDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = this.definition.status;
        if (getObjectStatus(state, this.definition)) {
            this.status = 'normal';
        }
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        // Extend the flow to its cutoff point if the cascade is on when it is added to a screen.
        if (this.status === 'normal') {
            const cutoff = findBeadCutoff(state, this.area, this.x, this.y);
            const newSection = new BeadSection({ w: this.w, x: this.x, y: this.y, h: cutoff - this.y });
            addObjectToArea(state, this.area, newSection);
        }
    }
    getHitbox(state: GameState) {
        return this;
    }
    onActivate(state: GameState) {
        this.status = 'normal';
        this.animationTime = 0;
    }
    onDeactivate(state: GameState) {
        this.status = 'hidden';
        this.animationTime = 0;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.status !== 'normal') {
            if (this.definition.offInterval && this.animationTime >= this.definition.offInterval) {
                this.onActivate(state);
            }
            return;
        }
        if (this.definition.onInterval && this.animationTime >= this.definition.onInterval) {
            this.onDeactivate(state);
        }
        const { objects } = getTileBehaviorsAndObstacles(
            state, this.area, {x: this.x + 8, y: this.y + 2},
            null, null, object => object instanceof BeadSection
        );
        if (!objects.length) {
            const newSection = new BeadSection({ w: this.w, x: this.x, y: this.y, h: 4 });
            addObjectToArea(state, this.area, newSection);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Nothing to render, this object just produces the BeadSections
    }
}


const grateOpenAnimation = createAnimation('gfx/effects/crystalgrate.png', {w: 16, h: 16},
    {cols: 7, duration: 6}, {loop: false});
const grateCloseAnimation = createAnimation('gfx/effects/crystalgrate.png', {w: 16, h: 16},
    {cols: 7, duration: 6, frameMap: [6, 5, 4, 3, 2, 1, 0]}, {loop: false});



export class BeadGrate implements ObjectInstance {
    area: AreaInstance;
    definition: SimpleObjectDefinition;
    drawPriority: DrawPriority = 'background';
    isObject = <const>true;
    x: number;
    y: number;
    w: number = 32;
    h: number = 16;
    animationTime: number = 0;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status;
        if (getObjectStatus(state, this.definition)) {
            this.status = 'normal';
        }
        this.animationTime = 1000;
    }
    getHitbox(state: GameState) {
        return this;
    }
    onActivate(state: GameState) {
        if (this.status !== 'normal') {
            this.status = 'normal';
            this.animationTime = 0;
        }
    }
    onDeactivate(state: GameState) {
        if (this.status !== 'closed') {
            this.status = 'closed';
            this.animationTime = 0;
        }
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.status === 'normal') {
            saveObjectStatus(state, this.definition, true);
        } else {
            saveObjectStatus(state, this.definition, false);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const animation = this.status === 'normal' ? grateOpenAnimation : grateCloseAnimation;
        let frame = getFrame(animation, this.animationTime);
        drawFrame(context, frame, {...frame, x: this.x, y: this.y});
        drawFrame(context, frame, {...frame, x: this.x + 16, y: this.y});
        /*context.beginPath();
        context.moveTo(this.x + 4, this.y + 4);
        context.lineTo(this.x + this.w - 4, this.y + 4);
        context.moveTo(this.x + 4, this.y + 8);
        context.lineTo(this.x + this.w - 4, this.y + 8);
        context.moveTo(this.x + 4, this.y + this.h - 4);
        context.lineTo(this.x + this.w - 4, this.y + this.h - 4);
        context.strokeStyle = this.status === 'hidden' ? 'grey' : 'black';
        context.lineWidth = 2;
        context.stroke();*/
    }
}

interface BeadSectionProps {
    x?: number
    y?: number
    w?: number
    h?: number
}
export class BeadSection implements ObjectInstance {
    area: AreaInstance;
    definition = null;
    animationTime: number;
    drawPriority: DrawPriority = 'background';
    isObject = <const>true;
    h: number;
    w: number = 32;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    hasHit = false;
    speed = 4;
    // The y value this section spawned at.
    spawnY
    constructor({w = 32, h = 4, x = 0, y = 0 }: BeadSectionProps) {
        this.animationTime = 0;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.spawnY = y;
    }
    getHitbox(state: GameState) {
        return this;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        const { objects } = getTileBehaviorsAndObstacles(
            state, this.area, {x: this.x + 8, y: this.y},
            null, null, object => object.definition?.type === 'beadCascade' && object.status === 'normal'
        );
        const isGrowing = (objects.length > 0);
        if (isGrowing) {
            this.h += this.speed;
        } else {
            this.y += this.speed;
        }
        // Check for drains starting from near the top, but skip the first tile.
        const cutoff = findBeadCutoff(state, this.area, this.x, Math.max(this.y, this.spawnY + 16));
        if (cutoff < this.y + this.h) {
            const remainingHeight = this.y + this.h - cutoff;
            if (remainingHeight >= 3 * this.speed) {
                const newSection = new BeadSection({ w: this.w, x: this.x, y: cutoff, h: remainingHeight });
                // Increase the animation time based on how far down the new section is from
                // the start of the current section.
                //newSection.animationTime = this.animationTime
                //    - 1000 * (cutoff - this.y) / 128;
                addObjectToArea(state, this.area, newSection);
            }
            this.h = cutoff - this.y;
        }
        // When the bead flow drains away it leaves behind a layer of beads on the ground.
        if (!isGrowing) {
            const ty = (this.y / 16) | 0, tx = (this.x / 16) | 0;
            if (ty < ((cutoff / 16) | 0) && ty > this.spawnY / 16) {
                // This code assumes bead sections are always 32 pixels wide.
                coverTile(state, this.area, tx, ty, beadTileIndex);
                coverTile(state, this.area, tx + 1, ty, beadTileIndex);
            }
        }
        // Check if the bottom of the screen.
        if (this.y + this.h >= 32 * 16) {
            this.h = 32 * 16 - this.y;
        }
        // Remove this object if it is shorted than the minimum height.
        if (this.h < this.speed && !isGrowing) {
            removeObjectFromArea(state, this);
        }
        // If touching center of player, pull player in and push them south.
        const hero = state.hero.activeClone || state.hero;
        if (hero.area === this.area) {
            const touchingHero = boxesIntersect(hero, this.getHitbox(state))
                && hero.action !== 'roll' && hero.z <= 4
                && hero.y + hero.h < this.y + this.h + 4
                && !hero.equipedGear?.ironBoots;
            if (hero.actionTarget === this && !touchingHero) {
                hero.actionTarget = null;
                hero.actionDx = 0;
                hero.actionDy = 0;
                // Make the hero lose controll briefly on exiting the flow.
                hero.vx = 0;
                hero.vy = 1;
                hero.vz = 2;
                // Use 'knockedHard` so that the player can transition to the next screen if necessary.
                hero.action = 'knockedHard';
                hero.swimming = false;
                hero.isControlledByObject = false;
                hero.safeD = hero.d;
                hero.safeX = hero.x;
                hero.safeY = hero.y;
            } else if (!hero.actionTarget && touchingHero) {
                hero.throwHeldObject(state);
                hero.actionTarget = this;
                hero.action = null;
                hero.actionDx = 0;
                hero.actionDy = 0;
            }
            if (hero.actionTarget === this) {
                hero.isControlledByObject = true;
                hero.swimming = true;
                if (hero.x < this.x) {
                    hero.x++;
                    hero.y += 0.75;
                    hero.actionDy = 0.75;
                    hero.d = 'left';
                } else if (hero.x + hero.w > this.x + this.w) {
                    hero.x--;
                    hero.y += 0.75;
                    hero.actionDy = 0.75;
                    hero.d = 'right';
                } else {
                    const speed = state.nextAreaInstance ? 0.75 : 4;
                    hero.y += speed;
                    hero.actionDy = speed;
                    hero.d = 'up';
                }
            }
        }
    }
    render(context, state: GameState) {
        drawCascade(context, this.getHitbox(state), this.animationTime);
    }
}

function drawCascade(context: CanvasRenderingContext2D, r: Rect, time: number) {
    if (r.h > 16) {
        const baseFrame: FrameWithPattern = getFrame(crystalBeadsBasePattern, time);
        const overFrame: FrameWithPattern = getFrame(crystalBeadsBaseOverPattern, time * 1.2);
        let offsetX = 0, offsetY = 0, alpha = 1, h = r.h + 4;
        for (const frame of [baseFrame, overFrame]) {
            if (!frame) {
                debugger;
            }
            if (!frame.pattern ) {
                const [patternCanvas, patternContext] = createCanvasAndContext(frame.w, frame.h);
                drawFrameAt(patternContext, frame, {x: 0, y: 0});
                frame.pattern = context.createPattern(patternCanvas, 'repeat');
            }
            context.save();
                context.globalAlpha *= Math.min(1, alpha);
                context.translate(offsetX, offsetY);
                context.fillStyle = frame.pattern;
                context.fillRect(r.x, r.y - offsetY, r.w, h - 16);
            context.restore();
            h += 4;
        }
    }
    const baseFrame: FrameWithPattern = getFrame(crystalBeadsBottomAnimation, time);
    const overFrame: FrameWithPattern = getFrame(crystalBeadsBottomOverAnimation, time);
    let h = r.h + 4;
    for (const frame of [baseFrame, overFrame]) {
        for (let x = r.x; r.x + r.w - x > 0; x += frame.w) {
            const w = Math.min(frame.w, r.x + r.w - x);
            drawFrame(context, {...frame, w}, {x, y: r.y + h - 16, w, h: 16});
        }
        h += 4;
    }
}
