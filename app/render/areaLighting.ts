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

export function renderAreaLighting(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, nextArea: AreaInstance = null): void {
    const targetFadeLevel = Math.max(area.definition.dark || 0, nextArea?.definition.dark || 0) / 100;
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
        if (area?.lightingCanvas) {
            lightingContext.drawImage(area.lightingCanvas,
                Math.floor((state.camera.x - area.cameraOffset.x) / lightingGranularity),
                Math.floor((state.camera.y - area.cameraOffset.y) / lightingGranularity),
                lightingCanvas.width, lightingCanvas.height,
                0, 0, lightingCanvas.width, lightingCanvas.height,
            );
        }
        if (nextArea?.lightingCanvas) {
            lightingContext.drawImage(nextArea.lightingCanvas,
                Math.floor((state.camera.x - nextArea.cameraOffset.x) / lightingGranularity),
                Math.floor((state.camera.y - nextArea.cameraOffset.y) / lightingGranularity),
                lightingCanvas.width, lightingCanvas.height,
                0, 0, lightingCanvas.width, lightingCanvas.height,
            );
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
            1, state.hero.lightRadius
        );
        if (hero.pickUpTile) {
            const behaviors = hero.pickUpTile.behaviors;
            if (behaviors?.brightness) {
                const offset = carryMap[hero.d][Math.min(hero.pickUpFrame, carryMap[hero.d].length - 1)];
                drawLightGradient(lightingContext,
                    {
                        x: hero.x + offset.x + 8 - state.camera.x + area.cameraOffset.x,
                        y: hero.y + offset.y + 8 - state.camera.y + area.cameraOffset.y,
                    },
                    behaviors.brightness, behaviors.lightRadius
                );
            }
        }
        lightingContext.save();
            lightingContext.translate(
                Math.floor((area.cameraOffset.x - state.camera.x) / lightingGranularity),
                Math.floor((area.cameraOffset.y - state.camera.y) / lightingGranularity)
            )
            for (const object of area.objects) {
                if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                    continue;
                }
                if (object.getHitbox && object.behaviors?.brightness) {
                    const hitbox = object.getHitbox(state);
                    drawLightGradient(lightingContext,
                        {
                            x: hitbox.x + hitbox.w / 2,
                            y: hitbox.y + hitbox.h / 2,
                        },
                        object.behaviors.brightness, object.behaviors.lightRadius
                    );
                }
                if (object instanceof Clone) {
                    if (object.pickUpTile) {
                        const behaviors = object.pickUpTile.behaviors;
                        if (behaviors?.brightness) {
                            const offset = carryMap[object.d][Math.min(object.pickUpFrame, carryMap[object.d].length - 1)];
                            drawLightGradient(lightingContext,
                                {
                                    x: object.x + offset.x + 8 - state.camera.x + area.cameraOffset.x,
                                    y: object.y + offset.y + 8 - state.camera.y + area.cameraOffset.y,
                                },
                                behaviors.brightness, behaviors.lightRadius
                            );
                        }
                    }
                }
            }
        lightingContext.restore();
        if (nextArea) {
            lightingContext.save();
            lightingContext.translate(
                Math.floor((nextArea.cameraOffset.x - state.camera.x) / lightingGranularity),
                Math.floor((nextArea.cameraOffset.y - state.camera.y) / lightingGranularity)
            )
            for (const object of nextArea.objects || []) {
                if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                    continue;
                }
                if (object.getHitbox && object.behaviors?.brightness) {
                    const hitbox = object.getHitbox(state);
                    drawLightGradient(lightingContext,
                        {
                            x: hitbox.x + hitbox.w / 2,
                            y: hitbox.y + hitbox.h / 2,
                        },
                        object.behaviors.brightness, object.behaviors.lightRadius
                    );
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

