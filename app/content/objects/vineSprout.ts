import { objectHash } from 'app/content/objects/objectHash';
import { allTiles } from 'app/content/tiles';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { removeObjectFromArea } from 'app/utils/objects';
import { saveGame } from 'app/utils/saveGame';
import { resetTileBehavior } from 'app/utils/tileBehavior';

import {
    AreaInstance, AreaLayer, DrawPriority, FrameAnimation, GameState,
    ObjectInstance, ObjectStatus, Rect, SimpleObjectDefinition,
} from 'app/types';


const growFrameDuration = 4;
const sproutIdleAnimation = createAnimation('gfx/tiles/vinebase.png', {w: 16, h: 16}, {cols: 4, y: 0, duration: 12});
// There is an extra 10px white space in between the rows of this animation for some reason.
const sproutingAnimation = createAnimation('gfx/tiles/vinebase.png', {w: 16, h: 16}, {cols: 7, top: 26, duration: growFrameDuration});
const baseGrowAnimation = createAnimation('gfx/tiles/vines.png', {w: 16, h: 16}, {cols: 3, y: 0, duration: growFrameDuration});
const middleGrowAnimationA = createAnimation('gfx/tiles/vines.png', {w: 16, h: 16}, {cols: 5, y: 1, duration: growFrameDuration});
const middleGrowAnimationB = createAnimation('gfx/tiles/vines.png', {w: 16, h: 16}, {cols: 5, y: 2, duration: growFrameDuration});
const topGrowAnimation = createAnimation('gfx/tiles/vines.png', {w: 16, h: 16}, {cols: 5, y: 3, duration: growFrameDuration});
// Each grow animation overlaps the previous animation by exactly 1 frame.
const growOverlap = growFrameDuration * 1 * FRAME_LENGTH;

const baseVineTile = 165;
const middleVineTileA = 166;
const middleVineTileB = 167;
const topVineTile = 168;
function setTile(area: AreaInstance, layer: AreaLayer, tx: number, ty: number, tileIndex: number) {
    area.checkToRedrawTiles = true;
    layer.tiles[ty][tx] = allTiles[tileIndex];
    layer.originalTiles[ty][tx] = allTiles[tileIndex];
    if (area.tilesDrawn[ty]?.[tx]) {
        area.tilesDrawn[ty][tx] = false;
    }
    resetTileBehavior(area, {x: tx, y: ty});
}
function getTargetLayer(area: AreaInstance): AreaLayer {
    let targetLayer;
    for (const layer of area.layers) {
        if (layer.definition.key === 'foreground' || layer.definition.drawPriority === 'foreground') {
            break;
        }
        targetLayer = layer;
    }
    return targetLayer;
}
function growVine(this: void, area: AreaInstance, tx: number, ty: number): void {
    const targetLayer = getTargetLayer(area);
    setTile(area, targetLayer, tx, ty, baseVineTile);
    // Probably play a splash effect here.
    // Add a vine here.
    for (let i = 0; i < 32; i++) {
        const y = ty - 1 - i;
        if (y < 0) {
            break;
        }
        const targetBehavior = area?.behaviorGrid[y]?.[tx];
        if (!targetBehavior?.solid) {
            setTile(area, targetLayer, tx, y, topVineTile);
            break;
        }
        setTile(area, targetLayer, tx, y, i % 2 ? middleVineTileA : middleVineTileB);
    }
}

export class VineSprout implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: SimpleObjectDefinition = null;
    isObject = <const>true;
    growing = false;
    sprouting = false;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    growingTime = 0;
    growingY: number;
    growingFrameTime: number;
    growingAnimationA: FrameAnimation;
    growingAnimationB: FrameAnimation;
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        if (state.savedState.objectFlags[this.definition.id]) {
            growVine(this.area, (this.x / 16) | 0, (this.y / 16) | 0);
            removeObjectFromArea(state, this);
        }
    }
    grow(state: GameState) {
        state.savedState.objectFlags[this.definition.id] = true;
        playAreaSound(state, this.area, 'secretChime');
        saveGame(state);
        this.sprouting = true;
        this.animationTime = 0;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.sprouting) {
            if (this.animationTime >= sproutingAnimation.duration) {
                this.animationTime = 0;
                this.sprouting = false;
                this.growing = true;
                this.growingY = (this.y / 16) | 0;
                this.growingFrameTime = this.growingTime = 0;
                this.growingAnimationA = baseGrowAnimation;
                this.growingAnimationB = middleGrowAnimationA;
            }
        } else if (this.growing) {
            this.growingTime += FRAME_LENGTH;
            // As each portion of the vine growing animation finishes, add the actual vine tiles to the map.
            const tx = (this.x / 16) | 0;
            const ty = (this.y / 16) | 0;
            this.growingY = ty;
            this.growingAnimationA = baseGrowAnimation;
            this.growingAnimationB = middleGrowAnimationA;
            this.growingFrameTime = this.growingTime;

            let remainingTime = this.growingTime - baseGrowAnimation.duration;
            if (remainingTime < 0) {
                return;
            }
            if (remainingTime === 0) {
                setTile(this.area, getTargetLayer(this.area), tx, ty, baseVineTile);
            }
            remainingTime += growOverlap;
            for (let i = 0; i < 32; i++) {
                const y = ty - 1 - i;
                this.growingY = y;
                if (remainingTime > 0) {
                    this.growingFrameTime = remainingTime;
                } else {
                    return;
                }
                if (y < 0) {
                    removeObjectFromArea(state, this);
                    return;
                }
                const targetBehavior = this.area?.behaviorGrid[y]?.[tx];
                if (!targetBehavior?.solid) {
                    remainingTime = remainingTime - topGrowAnimation.duration;
                    this.growingAnimationA = topGrowAnimation;
                    this.growingAnimationB = null;
                    if (remainingTime < 0) {
                        break;
                    }
                    if (remainingTime === 0) {
                        setTile(this.area, getTargetLayer(this.area), tx, y, topVineTile);
                        removeObjectFromArea(state, this);
                        return;
                    }
                    remainingTime += growOverlap;
                } else {
                    const animation = (i % 2) ? middleGrowAnimationA : middleGrowAnimationB;
                    this.growingAnimationA = (i % 2) ? middleGrowAnimationA : middleGrowAnimationB;
                    this.growingAnimationB = (i % 2) ? middleGrowAnimationB : middleGrowAnimationA;
                    remainingTime = remainingTime - animation.duration;
                    if (remainingTime < 0) {
                        return;
                    }
                    if (remainingTime === 0) {
                        setTile(this.area, getTargetLayer(this.area), tx, y, i % 2 ? middleVineTileA : middleVineTileB);
                    }
                    remainingTime += growOverlap;
                }
            }
        }
    }
    render(context, state: GameState) {
        if (this.sprouting) {
            const frame = getFrame(sproutingAnimation, this.animationTime);
            // Offset where this is drawn so that it matches where the vine will grow.
            drawFrame(context, frame, { ...frame, x: this.x, y: this.y - 11 });
        } else if (this.growing) {
            let frame = getFrame(this.growingAnimationA, this.growingFrameTime);
            drawFrame(context, frame, { ...frame, x: this.x, y: this.growingY * 16 });
            const frameBTime = this.growingFrameTime - (this.growingAnimationA.duration - growOverlap);
            if (this.growingAnimationB && frameBTime >= 0) {
                frame = getFrame(this.growingAnimationB, frameBTime);
                drawFrame(context, frame, { ...frame, x: this.x, y: (this.growingY - 1) * 16 });
            }
        } else {
            const frame = getFrame(sproutIdleAnimation, this.animationTime);
            // Offset where this is drawn so that it matches where the vine will grow.
            drawFrame(context, frame, { ...frame, x: this.x, y: this.y - 11 });
        }
    }
}
objectHash.vineSprout = VineSprout;
