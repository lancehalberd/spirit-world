import {getConnectedSurfaceArea, getConnectedUnderwaterArea} from 'app/content/areas';
import {Hero} from 'app/content/hero';
import {editingState} from 'app/development/editingState';
import {
    CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH,
} from 'app/gameConstants';
import {heroCarryAnimations} from 'app/render/heroAnimations';
import {createCanvasAndContext, drawCanvas} from 'app/utils/canvas';
import {carryMap, directionMap} from 'app/utils/direction';
import {clamp} from 'app/utils/index';
import {getObjectBehaviors, getObjectAndParts} from 'app/utils/objects';


const lightingGranularity = 1;
const [lightingCanvas, lightingContext] = createCanvasAndContext(
    Math.ceil(CANVAS_WIDTH / lightingGranularity),
    Math.ceil(CANVAS_HEIGHT / lightingGranularity)
);
const tileLightGradient = lightingContext.createRadialGradient(0, 0, 16, 0, 0, 32);
tileLightGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
tileLightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

const objectLightGradient = lightingContext.createRadialGradient(0, 0, 8, 0, 0, 32);
objectLightGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
objectLightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

const heroLightGradient = lightingContext.createRadialGradient(0, 0, 8, 0, 0, 32);
heroLightGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
heroLightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');


const waterSurfaceGranularity = 2;

const surfaceLightIntensity = 0.3;
export function updateWaterSurfaceCanvas(state: GameState, baseArea: AreaInstance): void {
    let underwaterArea: AreaInstance, surfaceArea: AreaInstance;
    if (state.transitionState?.type === 'diving' && state.transitionState?.nextAreaInstance) {
        underwaterArea = state.transitionState.nextAreaInstance;
        surfaceArea = state.areaInstance;
    } else if (state.transitionState?.type === 'surfacing' && state.transitionState?.nextAreaInstance) {
        underwaterArea = state.areaInstance;
        surfaceArea = state.transitionState.nextAreaInstance;
    } else {
        underwaterArea = getConnectedUnderwaterArea(state, baseArea) || baseArea;
        surfaceArea = getConnectedSurfaceArea(state, baseArea) || baseArea;
    }
    if (!surfaceArea || !underwaterArea || underwaterArea === surfaceArea) {
        return;
    }
    if (!underwaterArea.waterSurfaceCanvas) {
        [underwaterArea.waterSurfaceCanvas, underwaterArea.waterSurfaceContext] = createCanvasAndContext(
            Math.ceil(underwaterArea.w * 16 / waterSurfaceGranularity),
            Math.ceil(underwaterArea.h * 16 / waterSurfaceGranularity)
        );
    }
    //const size = 16 / waterSurfaceGranularity;
    const context = underwaterArea.waterSurfaceContext;
    const gradient = underwaterArea.waterSurfaceContext.createLinearGradient(0, -24, 0, 8);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, `rgba(255, 255, 255, ${surfaceLightIntensity})`);
    context.save();
        context.clearRect(0, 0, underwaterArea.waterSurfaceCanvas.width, underwaterArea.waterSurfaceCanvas.height);
        for (let y = 0; y < surfaceArea.behaviorGrid?.length; y++) {
            for (let x = 0; x < surfaceArea.behaviorGrid[y]?.length; x++) {
                if (surfaceArea.behaviorGrid[y][x]?.water
                    && !surfaceArea.behaviorGrid[y][x]?.solid
                ) {
                    if (y <= 0 || (surfaceArea.behaviorGrid[y - 1][x]?.water && !surfaceArea.behaviorGrid[y -1][x]?.solid)) {
                        context.fillStyle = `rgba(255, 255, 255, ${surfaceLightIntensity})`;
                        context.save();
                            context.translate((x + 0.5) * 16 / waterSurfaceGranularity, (y + 0.5) * 16 / waterSurfaceGranularity);
                            context.scale(1 / waterSurfaceGranularity, 1 / waterSurfaceGranularity);
                            context.fillRect(-8, -8, 16, 16);
                        context.restore();
                    } else {
                        context.fillStyle = gradient;
                        context.save();
                            context.translate((x + 0.5) * 16 / waterSurfaceGranularity, (y + 0.5) * 16 / waterSurfaceGranularity);
                            context.scale(1 / waterSurfaceGranularity, 1 / waterSurfaceGranularity);
                            context.fillRect(-8, -24, 16, 32);
                        context.restore();
                    }
                }
            }
        }
    context.restore();
}

export function drawLightGradient(
    context: CanvasRenderingContext2D,
    {x, y}: {x: number, y: number},
    brightness: number, lightRadius: number, lightGradient: CanvasGradient
): void {
    const r = (lightRadius ?? 32) / lightingGranularity;
    context.save();
        context.fillStyle = lightGradient;
        context.translate(x / lightingGranularity, y / lightingGranularity);
        context.scale(r / 32, r / 32);
        context.globalAlpha = brightness;
        context.beginPath();
        context.arc(0, 0, 32, 0, 2 * Math.PI);
        context.fill();
    context.restore();
}

export function drawColorLightGradient(
    context: CanvasRenderingContext2D,
    state: GameState,
    {x, y, brightness, radius, color, colorIntensity}: LightSource
): void {
    const r = (radius ?? 32) / lightingGranularity;
    context.save();
        const gradient = context.createRadialGradient(0, 0, 16, 0, 0, 32);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`);
        //gradient.addColorStop(0.7, 'rgba(255, 0, 0, 0.5)');
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        context.fillStyle = gradient;
        context.translate(x / lightingGranularity, y / lightingGranularity);
        context.scale(r / 32, r / 32);
        context.globalAlpha *= (colorIntensity ?? brightness) * (0.5 + 0.5 * state.fadeLevel);
        context.beginPath();
        context.arc(0, 0, 32, 0, 2 * Math.PI);
        context.fill();
    context.restore();
}

// This will cause alpha values to subtract
// This is slow on Firefox(and possibly other browsers), so try not to set darkness on areas with lots of tiles with brightness like
// the grass filled areas in the Peach Cave.
export function updateLightingCanvas(area: AreaInstance): void {
    if (!area.lightingCanvas) {
        [area.lightingCanvas, area.lightingContext] = createCanvasAndContext(
            Math.ceil(area.w * 16 / lightingGranularity),
            Math.ceil(area.h * 16 / lightingGranularity),
        );
    }
    const context = area.lightingContext;
    context.clearRect(0, 0, area.lightingCanvas.width, area.lightingCanvas.height);
    context.fillStyle = objectLightGradient;
    for (let y = 0; y < area.behaviorGrid?.length; y++) {
        for (let x = 0; x < area.behaviorGrid[y]?.length; x++) {
            if (area.behaviorGrid[y][x]?.brightness > 0) {
                const r = (area.behaviorGrid[y][x].lightRadius || 32) / lightingGranularity;
                context.save();
                    context.translate((x + 0.5) * 16 / lightingGranularity, (y + 0.5) * 16 / lightingGranularity);
                    context.scale(r / 32, r / 32);
                    context.globalAlpha = area.behaviorGrid[y][x].brightness;
                    // This looks the same, but it is unclear which version is more efficient.
                    // context.fillRect(-32, -32, 64, 64);
                    context.beginPath();
                    context.arc(0, 0, 32, 0, 2 * Math.PI);
                    context.fill();
                context.restore();
            }
        }
    }
}

export function renderSurfaceLighting(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, nextAreaInstance?: AreaInstance) {
    if (state.surfaceAreaInstance && !area.waterSurfaceCanvas) {
        updateWaterSurfaceCanvas(state, area);
    }
    if (!area.waterSurfaceCanvas) {
        return;
    }
    context.save();
        context.globalAlpha = clamp(0.8 + 0.2 * Math.cos(state.fieldTime / 500), 0, 1);
        context.drawImage(area.waterSurfaceCanvas,
            (state.camera.x - area.cameraOffset.x) / waterSurfaceGranularity,
            (state.camera.y - area.cameraOffset.y) / waterSurfaceGranularity,
            CANVAS_WIDTH / waterSurfaceGranularity, CANVAS_HEIGHT / waterSurfaceGranularity,
            0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
        );
        if (nextAreaInstance) {
            if (state.surfaceAreaInstance && !nextAreaInstance.waterSurfaceCanvas) {
                updateWaterSurfaceCanvas(state, nextAreaInstance);
            }
            if (nextAreaInstance.waterSurfaceCanvas) {
                context.drawImage(nextAreaInstance.waterSurfaceCanvas,
                    (state.camera.x - nextAreaInstance.cameraOffset.x) / waterSurfaceGranularity,
                    (state.camera.y - nextAreaInstance.cameraOffset.y) / waterSurfaceGranularity,
                    CANVAS_WIDTH / waterSurfaceGranularity, CANVAS_HEIGHT / waterSurfaceGranularity,
                    0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
                );
            }
        }
    context.restore();
}

export function renderAreaLighting(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, nextArea: AreaInstance = null): void {
    if (!(state.fadeLevel > 0) || editingState.isEditing) {
        renderLightColors(context, state, area, nextArea);
        return;
    }
    lightingContext.clearRect(0, 0, lightingCanvas.width, lightingCanvas.height);
    // Start with a uniform shading based on the ambient light level.
    lightingContext.globalCompositeOperation = 'source-over';
    lightingContext.globalAlpha = state.fadeLevel;
    lightingContext.fillStyle = 'black';
    lightingContext.fillRect(0, 0, lightingCanvas.width, lightingCanvas.height);
    lightingContext.fillStyle = objectLightGradient;

    // Next add lighting effects from the background.
    lightingContext.globalCompositeOperation = 'destination-out';
    if (area?.lightingCanvas) {
        const source = {
            x: Math.floor((state.camera.x - area.cameraOffset.x) / lightingGranularity),
            y: Math.floor((state.camera.y - area.cameraOffset.y) / lightingGranularity),
            w: lightingCanvas.width,
            h: lightingCanvas.height,
        }
        const target = {
            x: 0,
            y: 0,
            w: lightingCanvas.width,
            h: lightingCanvas.height,
        }
        drawCanvas(lightingContext, area.lightingCanvas, source, target);
    }
    if (nextArea?.lightingCanvas) {
        const source = {
            x: Math.floor((state.camera.x - nextArea.cameraOffset.x) / lightingGranularity),
            y: Math.floor((state.camera.y - nextArea.cameraOffset.y) / lightingGranularity),
            w: lightingCanvas.width,
            h: lightingCanvas.height,
        }
        const target = {
            x: 0,
            y: 0,
            w: lightingCanvas.width,
            h: lightingCanvas.height,
        }
        drawCanvas(lightingContext, nextArea.lightingCanvas, source, target);
    }
    // Next add light from the player's light radius.
    const hero = state.hero;
    const d = hero.action !== 'climbing' ? hero.d : 'up';
    drawLightGradient(lightingContext,
        {
            x: hero.x + hero.w / 2 + 12 * directionMap[d][0]
                - state.camera.x + area.cameraOffset.x,
            y: hero.y - hero.z + hero.h / 2 + 12 * directionMap[d][1]
                - state.camera.y + area.cameraOffset.y
        },
        1, Math.max(0, state.hero.lightRadius + Math.sin(state.fieldTime / 200)),
        heroLightGradient,
    );
    if (hero.pickUpTile) {
        const behaviors = hero.pickUpTile.behaviors;
        if (behaviors?.brightness) {
            const offset = carryMap[hero.d][Math.min(hero.pickUpFrame, carryMap[hero.d].length - 1)];

            let yBounce = 0;
            const grabAnimation = heroCarryAnimations.grab[hero.d];
            if (hero.pickUpFrame >= grabAnimation.frames.length * grabAnimation.frameDuration && hero.action === 'walking') {
                // The arms of the MC are higher for 2 frames, then lower for 2 frames, etc.
                const bounceDuration = 2 * heroCarryAnimations.move.up.frameDuration * FRAME_LENGTH;
                const frameIndex = (hero.animationTime / bounceDuration) | 0;
                if (frameIndex % 2 === 1) {
                    yBounce += 1;
                }
            }

            drawLightGradient(lightingContext,
                {
                    x: hero.x + offset.x + 8 - state.camera.x + area.cameraOffset.x,
                    y: hero.y + offset.y + 8 - state.camera.y + area.cameraOffset.y + yBounce,
                },
                behaviors.brightness, behaviors.lightRadius, tileLightGradient
            );
        }
    }
    lightingContext.save();
        lightingContext.translate(
            Math.floor((area.cameraOffset.x - state.camera.x) / lightingGranularity),
            Math.floor((area.cameraOffset.y - state.camera.y) / lightingGranularity)
        )
        for (const baseObject of area.objects) {
            for (const object of getObjectAndParts(state, baseObject).filter(o => o.getHitbox || o.getLightSources)) {
                if (object.status === 'gone' || object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                    continue;
                }
                if (object.getLightSources) {
                    const lightSources = object.getLightSources?.(state);
                    for (const lightSource of lightSources) {
                        drawLightGradient(lightingContext,
                            lightSource,
                            lightSource.brightness, lightSource.radius, objectLightGradient
                        );
                    }
                    continue;
                }

                const behaviors = getObjectBehaviors(state, object);
                if (object.getHitbox && behaviors?.brightness) {
                    const hitbox = object.getHitbox(state);
                    drawLightGradient(lightingContext,
                        {
                            x: hitbox.x + hitbox.w / 2,
                            y: hitbox.y + hitbox.h / 2,
                        },
                        behaviors.brightness, behaviors.lightRadius, objectLightGradient
                    );
                }
                if (object instanceof Hero) {
                    if (object.pickUpTile) {
                        const behaviors = object.pickUpTile.behaviors;
                        if (behaviors?.brightness) {
                            const offset = carryMap[object.d][Math.min(object.pickUpFrame, carryMap[object.d].length - 1)];
                            drawLightGradient(lightingContext,
                                {
                                    x: object.x + offset.x + 8 - state.camera.x + area.cameraOffset.x,
                                    y: object.y + offset.y + 8 - state.camera.y + area.cameraOffset.y,
                                },
                                behaviors.brightness, behaviors.lightRadius, tileLightGradient
                            );
                        }
                    }
                }
            }
        }
        for (const effect of area.effects) {
            if (effect.status === 'gone') {
                continue;
            }
            if (effect.getLightSources) {
                const lightSources = effect.getLightSources?.(state);
                for (const lightSource of lightSources) {
                    drawLightGradient(lightingContext,
                        lightSource,
                        lightSource.brightness, lightSource.radius, objectLightGradient
                    );
                }
                continue;
            }
            const behaviors = getObjectBehaviors(state, effect);
            if (effect.getHitbox && behaviors?.brightness) {
                const hitbox = effect.getHitbox(state);
                drawLightGradient(lightingContext,
                    {
                        x: hitbox.x + hitbox.w / 2,
                        y: hitbox.y + hitbox.h / 2,
                    },
                    behaviors.brightness, behaviors.lightRadius, objectLightGradient
                );
            }
        }
    lightingContext.restore();
    if (nextArea) {
        lightingContext.save();
        lightingContext.translate(
            Math.floor((nextArea.cameraOffset.x - state.camera.x) / lightingGranularity),
            Math.floor((nextArea.cameraOffset.y - state.camera.y) / lightingGranularity)
        )
        for (const baseObject of nextArea.objects) {
            for (const object of getObjectAndParts(state, baseObject).filter(o => o.getHitbox || o.getLightSources)) {
                if (object.status === 'gone' || object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                    continue;
                }
                if (object.getLightSources) {
                    const lightSources = object.getLightSources?.(state);
                    for (const lightSource of lightSources) {
                        drawLightGradient(lightingContext,
                            lightSource,
                            lightSource.brightness, lightSource.radius, objectLightGradient
                        );
                    }
                    continue;
                }
                const behaviors = getObjectBehaviors(state, object);
                if (object.getHitbox && behaviors?.brightness) {
                    const hitbox = object.getHitbox(state);
                    drawLightGradient(lightingContext,
                        {
                            x: hitbox.x + hitbox.w / 2,
                            y: hitbox.y + hitbox.h / 2,
                        },
                        behaviors.brightness, behaviors.lightRadius, objectLightGradient
                    );
                }
            }
        }
        lightingContext.restore();
    }
    // Finally draw the result on top of the field.
    context.drawImage(lightingCanvas,
        0, 0, lightingCanvas.width, lightingCanvas.height,
        0, 0, lightingCanvas.width * lightingGranularity, lightingCanvas.height * lightingGranularity,
    );
    renderLightColors(context, state, area, nextArea);
}

function renderLightColors(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, nextArea: AreaInstance = null): void {
    context.save();
        context.translate(
            Math.floor((area.cameraOffset.x - state.camera.x) / lightingGranularity),
            Math.floor((area.cameraOffset.y - state.camera.y) / lightingGranularity)
        )
        for (const baseObject of area.objects) {
            for (const object of getObjectAndParts(state, baseObject).filter(o => o.getHitbox || o.getLightSources)) {
                if (object.status === 'gone' || object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                    continue;
                }
                if (object.getLightSources) {
                    const lightSources = object.getLightSources(state);
                    for (const lightSource of lightSources) {
                        if (lightSource.color) {
                            drawColorLightGradient(context, state, lightSource);
                        }
                    }
                    continue;
                }

                const behaviors = getObjectBehaviors(state, object);
                if (object.getHitbox && behaviors?.lightRadius && behaviors?.lightColor) {
                    const hitbox = object.getHitbox(state);
                    drawColorLightGradient(context, state,
                        {
                            x: hitbox.x + hitbox.w / 2,
                            y: hitbox.y + hitbox.h / 2,
                            brightness: behaviors.brightness,
                            radius: behaviors.lightRadius,
                            color: behaviors?.lightColor,
                        }
                    );
                }
                if (object instanceof Hero) {
                    if (object.pickUpTile) {
                        const behaviors = object.pickUpTile.behaviors;
                        if (behaviors?.lightColor && behaviors?.lightRadius) {
                            const offset = carryMap[object.d][Math.min(object.pickUpFrame, carryMap[object.d].length - 1)];
                            drawColorLightGradient(context, state,
                                {
                                    x: object.x + offset.x + 8 - state.camera.x + area.cameraOffset.x,
                                    y: object.y + offset.y + 8 - state.camera.y + area.cameraOffset.y,
                                    brightness: behaviors.brightness,
                                    radius: behaviors.lightRadius,
                                    color: behaviors?.lightColor,
                                }
                            );
                        }
                    }
                }
            }
        }
        for (const effect of area.effects) {
            if (effect.status === 'gone') {
                continue;
            }
            if (effect.getLightSources) {
                const lightSources = effect.getLightSources?.(state);
                for (const lightSource of lightSources) {
                    if (lightSource.color) {
                        drawColorLightGradient(context, state, lightSource);
                    }
                }
                continue;
            }
            const behaviors = getObjectBehaviors(state, effect);
            if (effect.getHitbox && behaviors?.lightRadius && behaviors?.lightColor) {
                const hitbox = effect.getHitbox(state);
                drawColorLightGradient(context, state,
                    {
                        x: hitbox.x + hitbox.w / 2,
                        y: hitbox.y + hitbox.h / 2,
                        brightness: behaviors.brightness,
                        radius: behaviors.lightRadius,
                        color: behaviors?.lightColor,
                    }
                );
            }
        }
    context.restore();
    if (nextArea) {
        context.save();
        context.translate(
            Math.floor((nextArea.cameraOffset.x - state.camera.x) / lightingGranularity),
            Math.floor((nextArea.cameraOffset.y - state.camera.y) / lightingGranularity)
        )
        for (const baseObject of nextArea.objects) {
            for (const object of getObjectAndParts(state, baseObject).filter(o => o.getHitbox || o.getLightSources)) {
                if (object.status === 'gone' || object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                    continue;
                }
                if (object.getLightSources) {
                    const lightSources = object.getLightSources?.(state);
                    for (const lightSource of lightSources) {
                        if (lightSource.color) {
                            drawColorLightGradient(context, state, lightSource);
                        }
                    }
                    continue;
                }
                const behaviors = getObjectBehaviors(state, object);
                if (object.getHitbox && behaviors?.lightRadius && behaviors?.lightColor) {
                    const hitbox = object.getHitbox(state);
                    drawColorLightGradient(context, state,
                        {
                            x: hitbox.x + hitbox.w / 2,
                            y: hitbox.y + hitbox.h / 2,
                            brightness: behaviors.brightness,
                            radius: behaviors.lightRadius,
                            color: behaviors?.lightColor,
                        }
                    );
                }
            }
        }
        context.restore();
    }
}
