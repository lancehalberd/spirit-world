import _ from 'lodash';

import { editingState } from 'app/development/tileEditor';
import { createCanvasAndContext } from 'app/dom';
import {
    CANVAS_HEIGHT, CANVAS_WIDTH,
} from 'app/gameConstants';

import { carryMap, directionMap } from 'app/utils/field';

import { AreaInstance, Clone, GameState } from 'app/types';

const lightingGranularity = 1;
const [lightingCanvas, lightingContext] = createCanvasAndContext(
    Math.ceil(CANVAS_WIDTH / lightingGranularity),
    Math.ceil(CANVAS_HEIGHT / lightingGranularity)
);
const gradient = lightingContext.createRadialGradient(0, 0, 16, 0, 0, 32);
gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

export function drawLightGradient(
    context: CanvasRenderingContext2D,
    {x, y}: {x: number, y: number},
    brightness: number, lightRadius: number
): void {
    const r = (lightRadius ?? 32) / lightingGranularity;
    context.save();
        context.fillStyle = gradient;
        context.translate(x / lightingGranularity, y / lightingGranularity);
        context.scale(r / 32, r / 32);
        context.globalAlpha = brightness;
        context.beginPath();
        context.arc(0, 0, 32, 0, 2 * Math.PI);
        context.fill();
    context.restore();
}

// This will cause alpha values to subtract
export function updateLightingCanvas(area: AreaInstance): void {
    if (!area.lightingCanvas) {
        [area.lightingCanvas, area.lightingContext] = createCanvasAndContext(
            Math.ceil(area.canvas.width / lightingGranularity),
            Math.ceil(area.canvas.height / lightingGranularity),
        );
    }
    const context = area.lightingContext;
    context.clearRect(0, 0, area.lightingCanvas.width, area.lightingCanvas.height);
    context.fillStyle = gradient;
    for (let y = 0; y < area.behaviorGrid?.length; y++) {
        for (let x = 0; x < area.behaviorGrid[y]?.length; x++) {
            if (area.behaviorGrid[y][x]?.brightness > 0) {
                const r = (area.behaviorGrid[y][x].lightRadius || 32) / lightingGranularity;
                context.save();
                    context.translate((x + 0.5) * 16 / lightingGranularity, (y + 0.5) * 16 / lightingGranularity);
                    context.scale(r / 32, r / 32);
                    context.globalAlpha = area.behaviorGrid[y][x].brightness;
                    context.beginPath();
                    context.arc(0, 0, 32, 0, 2 * Math.PI);
                    context.fill();
                context.restore();
            }
        }
    }
}

window['debugCanvas'] = (canvas: HTMLCanvasElement) => {
    document.body.append(canvas);
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.backgroundColor = 'blue';
}

export function renderAreaLighting(context: CanvasRenderingContext2D, state: GameState): void {
    const targetFadeLevel = Math.max(state.areaInstance.definition.dark || 0, state.nextAreaInstance?.definition.dark || 0) / 100;
    if (state.fadeLevel < targetFadeLevel) {
        state.fadeLevel = Math.min(state.fadeLevel + 0.05, targetFadeLevel);
    } else if (state.fadeLevel > targetFadeLevel){
        state.fadeLevel = Math.max(state.fadeLevel - 0.05, targetFadeLevel);
    }
    if (state.fadeLevel > 0 && !editingState.isEditing) {
        lightingContext.clearRect(0, 0, lightingCanvas.width, lightingCanvas.height);
        // Start with a uniform shading based on the ambient light level.
        lightingContext.globalCompositeOperation = 'source-over';
        lightingContext.globalAlpha = state.fadeLevel;
        lightingContext.fillStyle = 'black';
        lightingContext.fillRect(0, 0, lightingCanvas.width, lightingCanvas.height);
        lightingContext.fillStyle = gradient;

        // Next add lighting effects from the background.
        lightingContext.globalCompositeOperation = 'destination-out';
        if (state.areaInstance?.lightingCanvas) {
            lightingContext.drawImage(state.areaInstance.lightingCanvas,
                Math.floor((state.camera.x - state.areaInstance.cameraOffset.x) / lightingGranularity),
                Math.floor((state.camera.y - state.areaInstance.cameraOffset.y) / lightingGranularity),
                lightingCanvas.width, lightingCanvas.height,
                0, 0, lightingCanvas.width, lightingCanvas.height,
            );
        }
        if (state.nextAreaInstance?.lightingCanvas) {
            lightingContext.drawImage(state.nextAreaInstance.lightingCanvas,
                Math.floor((state.camera.x - state.nextAreaInstance.cameraOffset.x) / lightingGranularity),
                Math.floor((state.camera.y - state.nextAreaInstance.cameraOffset.y) / lightingGranularity),
                lightingCanvas.width, lightingCanvas.height,
                0, 0, lightingCanvas.width, lightingCanvas.height,
            );
        }
        // Next add light from the player's light radius.
        const hero = state.hero;
        drawLightGradient(lightingContext,
            {
                x: hero.x + hero.w / 2 + 12 * directionMap[hero.d][0]
                    - state.camera.x + state.areaInstance.cameraOffset.x,
                y: hero.y - hero.z + hero.h / 2 + 12 * directionMap[hero.d][1]
                    - state.camera.y + state.areaInstance.cameraOffset.y
            },
            1, state.hero.lightRadius
        );
        /*lightingContext.save();
            const r = state.hero.lightRadius / lightingGranularity;
            const x = hero.x + hero.w / 2 + 12 * directionMap[hero.d][0]
                - state.camera.x + state.areaInstance.cameraOffset.x;
            const y = hero.y + hero.h / 2 + 12 * directionMap[hero.d][1]
                - state.camera.y + state.areaInstance.cameraOffset.y
            lightingContext.translate(
                Math.floor(x / lightingGranularity),
                Math.floor(y / lightingGranularity)
            );
            lightingContext.scale(r / 32, r / 32);
            lightingContext.beginPath();
            lightingContext.arc(0, 0, 32, 0, 2 * Math.PI);
            lightingContext.fill();*/
            // 1/2 of the radius is fully lit.
            /*lightingContext.globalAlpha = 1;
            lightingContext.beginPath();
            lightingContext.arc(0, 0, r / 2, 0, 2 * Math.PI);
            lightingContext.fill();
            // 1/4th of the radius is well lit.
            lightingContext.globalAlpha = 0.4;
            lightingContext.beginPath();
            lightingContext.arc(0, 0, 3 * r / 4, 0, 2 * Math.PI);
            lightingContext.fill();
            // 1/4th fo the radius is poorly lit.
            lightingContext.globalAlpha = 0.2;
            lightingContext.beginPath();
            lightingContext.arc(0, 0, r, 0, 2 * Math.PI);
            lightingContext.fill();
        lightingContext.restore();*/
        if (hero.pickUpTile) {
            const tile = hero.pickUpTile;
            const layer = _.find(state.areaInstance.layers, { key: tile.layerKey});
            const palette = layer.palette;
            const behaviors = palette.behaviors[`${tile.x}x${tile.y}`];
            if (behaviors?.brightness) {
                const offset = carryMap[hero.d][Math.min(hero.pickUpFrame, carryMap[hero.d].length - 1)];
                drawLightGradient(lightingContext,
                    {
                        x: hero.x + offset.x + 8 - state.camera.x + state.areaInstance.cameraOffset.x,
                        y: hero.y + offset.y + 8 - state.camera.y + state.areaInstance.cameraOffset.y,
                    },
                    behaviors.brightness, behaviors.lightRadius
                );
                /*
                const r = (behaviors.lightRadius || 32) / lightingGranularity;
                lightingContext.save();
                // This assumes the tile is 16x16.
                lightingContext.translate(
                    (hero.x + offset.x + 8) / lightingGranularity,
                    (hero.y + offset.y + 8) / lightingGranularity
                );
                lightingContext.scale(r / 32, r / 32);
                lightingContext.globalAlpha = behaviors.brightness;
                lightingContext.beginPath();
                lightingContext.arc(0, 0, 32, 0, 2 * Math.PI);
                lightingContext.fill();
                lightingContext.restore();*/
            }
        }
        lightingContext.save();
            lightingContext.translate(
                Math.floor((state.areaInstance.cameraOffset.x - state.camera.x) / lightingGranularity),
                Math.floor((state.areaInstance.cameraOffset.y - state.camera.y) / lightingGranularity)
            )
            for (const object of state.areaInstance.objects) {
                if (object.getHitbox && object.behaviors?.brightness) {
                    // Hard lighting
                    /*const r = object.behaviors.lightRadius || 32;
                    lightingContext.globalAlpha = object.behaviors.brightness;
                    lightingContext.beginPath();
                    const hitbox = object.getHitbox(state);
                    lightingContext.arc(
                        (hitbox.x + hitbox.w / 2) / lightingGranularity, (hitbox.y + hitbox.h / 2) / lightingGranularity,
                        r / lightingGranularity, 0, 2 * Math.PI, true
                    );
                    lightingContext.fill();*/

                    // Gradient lighting
                    const r = (object.behaviors.lightRadius || 32) / lightingGranularity;
                    const hitbox = object.getHitbox(state);
                    lightingContext.save();
                    lightingContext.translate(
                        (hitbox.x + hitbox.w / 2) / lightingGranularity,
                        (hitbox.y + hitbox.h / 2) / lightingGranularity
                    );
                    lightingContext.scale(r / 32, r / 32);
                    lightingContext.globalAlpha = object.behaviors.brightness;
                    lightingContext.beginPath();
                    lightingContext.arc(0, 0, 32, 0, 2 * Math.PI);
                    lightingContext.fill();
                    lightingContext.restore();
                }
                if (object instanceof Clone) {
                    if (object.pickUpTile) {
                        const tile = object.pickUpTile;
                        const layer = _.find(state.areaInstance.layers, { key: tile.layerKey});
                        const palette = layer.palette;
                        const behaviors = palette.behaviors[`${tile.x}x${tile.y}`];
                        if (behaviors?.brightness) {
                            const offset = carryMap[object.d][Math.min(object.pickUpFrame, carryMap[object.d].length - 1)];
                            drawLightGradient(lightingContext,
                                {
                                    x: object.x + offset.x + 8 - state.camera.x + state.areaInstance.cameraOffset.x,
                                    y: object.y + offset.y + 8 - state.camera.y + state.areaInstance.cameraOffset.y,
                                },
                                behaviors.brightness, behaviors.lightRadius
                            );
                        }
                    }
                }
            }
        lightingContext.restore();
        if (state.nextAreaInstance) {
            lightingContext.save();
            lightingContext.translate(
                Math.floor((state.nextAreaInstance.cameraOffset.x - state.camera.x) / lightingGranularity),
                Math.floor((state.nextAreaInstance.cameraOffset.y - state.camera.y) / lightingGranularity)
            )
            for (const object of state.nextAreaInstance.objects || []) {
                if (object.getHitbox && object.behaviors?.brightness) {
                    // Hard lighting
                    /*const r = object.behaviors.lightRadius || 32;
                    lightingContext.globalAlpha = object.behaviors.brightness;
                    lightingContext.beginPath();
                    const hitbox = object.getHitbox(state);
                    lightingContext.arc(
                        (hitbox.x + hitbox.w / 2) / lightingGranularity, (hitbox.y + hitbox.h / 2) / lightingGranularity,
                        r / lightingGranularity, 0, 2 * Math.PI, true
                    );
                    lightingContext.fill();*/

                    // Gradient lighting.
                    const r = (object.behaviors.lightRadius || 32) / lightingGranularity;
                    const hitbox = object.getHitbox(state);
                    lightingContext.save();
                    lightingContext.translate(
                        (hitbox.x + hitbox.w / 2) / lightingGranularity,
                        (hitbox.y + hitbox.h / 2) / lightingGranularity
                    );
                    lightingContext.scale(r / 32, r / 32);
                    lightingContext.globalAlpha = object.behaviors.brightness;
                    lightingContext.beginPath();
                    lightingContext.arc(0, 0, 32, 0, 2 * Math.PI);
                    lightingContext.fill();
                    lightingContext.restore();
                }
            }
            lightingContext.restore();
        }

        // Finally draw the result on top of the field.
        context.drawImage(lightingCanvas,
            0, 0, lightingCanvas.width, lightingCanvas.height,
            0, 0, lightingCanvas.width * lightingGranularity, lightingCanvas.height * lightingGranularity,
        );
    }
}

