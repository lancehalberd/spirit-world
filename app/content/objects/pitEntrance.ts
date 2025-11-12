import {renderIndicator} from 'app/content/objects/indicator';
import {objectHash} from 'app/content/objects/objectHash';
import {playAreaSound} from 'app/musicController';
import {CANVAS_HEIGHT} from 'app/gameConstants';
import {createAnimation, drawFrame} from 'app/utils/animations';
import {requireFrame} from 'app/utils/packedImages';
import {enterZoneByTarget} from 'app/utils/enterZoneByTarget';
import {getTileBehaviors} from 'app/utils/getBehaviors';
import {isObjectInsideTarget, isPixelInShortRect, pad} from 'app/utils/index';
import {getObjectStatus} from 'app/utils/objects';


const pitFrame = createAnimation('gfx/tiles/cavePits.png', {w: 16, h: 16}, {left: 16, top: 48}).frames[0];
const crystalPitFrame = createAnimation('gfx/tiles/crystalPits.png', {w: 16, h: 16}, {left: 16, top: 48}).frames[0];
const futuristicPitFrame = createAnimation('gfx/tiles/futuristic.png', {w: 32, h: 32}, {left: 576, top: 16}).frames[0];
const naturalPitFrame = createAnimation('gfx/tiles/cavePits.png', {w: 32, h: 32}, {left: 16, top: 16}).frames[0];
const naturalCrystalPitFrame = createAnimation('gfx/tiles/crystalPits.png', {w: 32, h: 32}, {left: 16, top: 16}).frames[0];
const smoothCrystalPitFrame = createAnimation('gfx/tiles/crystalPits.png', {w: 32, h: 32}, {left: 16, top: 80}).frames[0];
const vanaraPitFrame = requireFrame('gfx/tiles/vanara.png', {x: 80, y: 16, w: 32, h: 32});

interface PitStyle {
    frame: Frame
    getHitbox: (pit: PitEntrance) => Rect
    getPitbox?: (pit: PitEntrance) => Rect
}

export const pitStyles: {[key: string]: PitStyle} = {
    default: {
        frame: naturalPitFrame,
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 32, h: 32};
        },
        getPitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y + 10, w: 32, h: 22};
        }
    },
    futuristic: {
        frame: futuristicPitFrame,
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 32, h: 32};
        },
        getPitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y + 10, w: 32, h: 22};
        }
    },
    crystal: {
        frame: naturalCrystalPitFrame,
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 32, h: 32};
        },
        getPitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y + 16, w: 32, h: 16};
        }
    },
    smoothCrystal: {
        frame: smoothCrystalPitFrame,
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 32, h: 32};
        },
        getPitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y + 16, w: 32, h: 16};
        }
    },
    singleTile: {
        frame: pitFrame,
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 16, h: 16};
        }
    },
    smallCrystal: {
        frame: crystalPitFrame,
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 16, h: 16};
        }
    },
    vanara: {
        frame: vanaraPitFrame,
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 32, h: 32};
        },
        getPitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y + 16, w: 32, h: 16};
        }
    },
};

export class PitEntrance implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: EntranceDefinition = null;
    isObject = <const>true;
    x: number;
    ignorePits = true;
    y: number;
    status: ObjectStatus = 'normal';
    style: string;
    wasUnderObject: boolean;
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = this.definition.status;
        this.style = this.definition.style || 'default';
        if (getObjectStatus(state, this.definition)) {
            this.status = 'normal';
        }
    }
    getHitbox(): Rect {
        return (pitStyles[this.style] || pitStyles.default).getHitbox(this);
    }
    getBehaviors(state: GameState, x?: number, y?: number): TileBehaviors {
        if (this.status !== 'normal' || this.isUnderObject(state)) {
            return {};
        }
        const pitStyle = pitStyles[this.style] || pitStyles.default;
        const hitbox = this.getHitbox();
        const isSingleTilePit = hitbox.w <= 16 && hitbox.h <= 16;
        const pitbox = pitStyle.getPitbox?.(this) || hitbox;
        if (!isPixelInShortRect(x, y, pitbox)) {
            return {pit: true, pitWall: true, isSingleTilePit};
        }
        return {pit: true, isSingleTilePit};
    }
    isUnderObject(state: GameState): boolean {
        // Only single tile pits can be hidden under a tile currently.
        if (!this.area || this.getHitbox().w > 16) {
            return false;
        }
        const {tileBehavior} = getTileBehaviors(state, this.area, {x: this.x + 8, y: this.y + 8});
        return tileBehavior.solid === true || tileBehavior.covered || tileBehavior.isBrittleGround;
    }
    update(state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        if (this.isUnderObject(state)) {
            this.wasUnderObject = true;
            return;
        } else if (this.wasUnderObject) {
            this.wasUnderObject = false;
            // Play the secret chime when this pit is first discovered if it is actually an entrance.
            if (this.definition.targetZone, this.definition.targetObjectId) {
                playAreaSound(state, this.area, 'secretChime');
            }
        }
        const hero = state.hero;
        const hitbox = this.getHitbox();
        if (this.area === hero.area && hero.z <= 0 && hero.action !== 'roll' && hero.action !== 'preparingSomersault'
            && isObjectInsideTarget(hero.getMovementHitbox(), pad(hitbox, 4))
        ) {
            if (hero.action === 'fallen') {
                enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, {
                    skipObject: this.definition,
                    callback: onEnterZoneFromPit,
                });
            } else if (hero.action !== 'falling') {
                hero.fallIntoPit(state);
            }
            // Move the hero fall animation towards the center of the pit if it is too close to the
            // edges to improve the look of the animation.
            const pitStyle = pitStyles[this.style] || pitStyles.default;
            const pitbox = pitStyle.getPitbox?.(this) || hitbox;
            const heroBox = hero.getMovementHitbox();
            if (pitbox && !isObjectInsideTarget(heroBox, pitbox)) {
                if (heroBox.x < pitbox.x && heroBox.x + heroBox.w <= pitbox.x + pitbox.w - 1) {
                    hero.x++;
                }
                if (heroBox.x + heroBox.w > pitbox.x + pitbox.w && heroBox.x >= pitbox.x + 1) {
                    hero.x--;
                }
                if (heroBox.y < pitbox.y && heroBox.y + heroBox.h <= pitbox.y + pitbox.h - 1) {
                    hero.y++;
                }
                if (heroBox.y + heroBox.h > pitbox.y + pitbox.h && heroBox.y >= pitbox.y + 1) {
                    hero.y--;
                }
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const pitStyle = pitStyles[this.style] || pitStyles.default;
        if (this.status !== 'normal' || this.isUnderObject(state)) {
            if (state.hero.savedData.passiveTools.trueSight) {
                renderIndicator(context, this.getHitbox(), state.fieldTime);
            }
            return;
        }
        drawFrame(context, pitStyle.frame, this.getHitbox());
    }
}
objectHash.pitEntrance = PitEntrance;

function onEnterZoneFromPit(state: GameState): void {
    const hero = state.hero;
    hero.action = 'knocked';
    hero.animationTime = 0;
    hero.z = CANVAS_HEIGHT;
    hero.vx = hero.vy = 0;
    hero.vz = -1;
    hero.safeD = hero.d;
    hero.safeX = hero.x;
    hero.safeY = hero.y;
}
