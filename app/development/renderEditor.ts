import { getLootFrame } from 'app/content/loot';
import { allTiles } from 'app/content/tiles';
import { editingState } from 'app/development/editingState';
import {
    getObjectFrame,
    renderObjectPreview,
    unselectObject,
} from 'app/development/objectEditor';
import { fixVariantPosition, unselectVariant } from 'app/development/variantEditor';
import { getSelectionBounds } from 'app/development/brushSelection';
import { renderZoneEditor } from 'app/development/zoneEditor';
import { KEY, isKeyboardKeyDown } from 'app/userInput';
import { translateContextForAreaAndCamera } from 'app/render/renderField';
import { drawFrame } from 'app/utils/animations';
import { createObjectInstance } from 'app/utils/createObjectInstance';
import { mapTile } from 'app/utils/mapTile';
import { isMouseDown, /*isMouseOverElement*/ } from 'app/utils/mouse';
import { getAreaMousePosition } from 'app/development/getAreaMousePosition';


export function renderEditor(context: CanvasRenderingContext2D, state: GameState): void {
    if (!editingState.isEditing) {
        return;
    }
    // Unselect objects that are no longer in the current area.
    if (editingState.selectedObject?.id && !state.areaInstance.definition.objects.find(o => o === editingState.selectedObject)) {
        unselectObject(editingState);
    }
    if (editingState.selectedVariantData?.id && !state.areaInstance.definition.variants?.find(o => o === editingState.selectedVariantData)) {
        unselectVariant(editingState);
    }
    renderEditorArea(context, state, state.areaInstance);
    if (state.nextAreaInstance) {
        renderEditorArea(context, state, state.nextAreaInstance);
    }
    renderZoneEditor(context, state, editingState);
}


function renderEditorArea(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    if (state.paused) {
        return;
    }
    const [x, y] = getAreaMousePosition();
    context.save();
        translateContextForAreaAndCamera(context, state, area);
        context.globalAlpha = 0.6;
        for (const object of area.definition.objects) {
            const instance = createObjectInstance(state, object);
            context.save();
                context.globalAlpha *= 0.3;
                context.fillStyle = instance.previewColor || 'blue';
                const hitbox = instance.getEditorHitbox?.(state)
                    || instance.getHitbox?.(state)
                    || {x: instance.x, y: instance.y, w: 16, h: 16};
                context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
            context.restore();
            if (instance.renderPreview) {
                //instance.renderPreview(context, instance.getHitbox(state));
                instance.renderPreview(context);
            } else {
                instance.area = area;
                instance.status = 'normal';
                instance.render(context, state);
            }
            // drawFrame(context, frame, {...frame, x: object.x - (frame.content?.x || 0), y: object.y - (frame.content?.y || 0)});
            // While editing, draw the loot inside the chest/boss on top as well.
            if (object.type === 'bigChest' || object.type === 'chest' || object.type === 'boss') {
                const frame = getLootFrame(state, object);
                drawFrame(context, frame, {...frame, x: object.x - (frame.content?.x || 0), y: object.y - (frame.content?.y || 0)});
            }
        }
        for (const variantData of (area.definition.variants || [])) {
            context.save();
                context.globalAlpha *= 0.3;
                context.fillStyle = 'pink';
                context.fillRect(variantData.x, variantData.y, variantData.w, variantData.h);
            context.restore();
        }
        // Tool previews are only drawn for the current area.
        if (area === state.areaInstance) {
            if (editingState.tool === 'tileChunk') {
                const w = 16, h = 16;
                let x1 = x, y1 = y;
                if (isMouseDown() && editingState.dragOffset) {
                    x1 = editingState.dragOffset.x;
                    y1 = editingState.dragOffset.y;
                }
                const {L, R, T, B} = getSelectionBounds(state, x1, y1, x, y);
                context.lineWidth = 2;
                context.strokeStyle = 'white';
                context.strokeRect(L * w, T * h, (R - L + 1) * w, (B - T + 1) * h);
            }
            if (editingState.tool === 'variant') {
                context.lineWidth = 2;
                context.strokeStyle = 'white';
                const variantData = editingState.selectedVariantData;
                variantData.x = x + state.camera.x;
                variantData.y = y + state.camera.y;
                fixVariantPosition(variantData);
                context.strokeRect(
                    variantData.x,
                    variantData.y,
                    variantData.w || 48,
                    variantData.h || 48
                );
            }
            if (editingState.tool === 'brush') {
                const w = 16, h = 16;
                if (isKeyboardKeyDown(KEY.SHIFT)) {
                    let x1 = x, y1 = y;
                    if (isMouseDown() && editingState.dragOffset) {
                        x1 = editingState.dragOffset.x;
                        y1 = editingState.dragOffset.y;
                    }
                    const {L, R, T, B} = getSelectionBounds(state, x1, y1, x, y);
                    context.lineWidth = 2;
                    context.strokeStyle = 'white';
                    context.strokeRect(L * w, T * h, (R - L + 1) * w, (B - T + 1) * h);
                } else {
                    const firstBrushGrid = Object.values(editingState.brush)[0];
                    // Erase existing layers so we can draw an accurate preview.
                    const rectangle = {
                        x: Math.floor((state.camera.x + x + 8) / w - firstBrushGrid.w / 2),
                        y: Math.floor((state.camera.y + y + 8) / h - firstBrushGrid.h / 2),
                        w: firstBrushGrid.w,
                        h: firstBrushGrid.h,
                    };
                    context.clearRect(rectangle.x * 16, rectangle.y * 16, rectangle.w * 16, rectangle.h * 16);

                    // Create the combined set of layer + brush keys for building the preview.
                    const allLayerKeys = state.areaInstance.layers.map(l => l.key);
                    // Include extra layer keys. Eventually painting will add extra layers if they are on the brush.
                    for (let key in editingState.brush) {
                        if (key !== 'none' && !allLayerKeys.includes(key)) {
                            allLayerKeys.push(key);
                        }
                    }
                    // If the default brush layer is used and no layer is selected, add all the default layer keys.
                    if (editingState.brush.none && !editingState.selectedLayerKey) {
                        if (!allLayerKeys.includes('floor')) {
                            allLayerKeys.push('floor');
                        }
                        if (!allLayerKeys.includes('field')) {
                            allLayerKeys.push('field');
                        }
                        if (!allLayerKeys.includes('foreground')) {
                            allLayerKeys.push('foreground');
                        }
                    }
                    const selectedLayer = state.areaInstance.definition.layers.find(l => l.key === editingState.selectedLayerKey);
                    // Draw background layers, then foreground layers.
                    for (const priorityToDraw of ['background', 'foreground']) {
                        for (const layerKey of allLayerKeys) {
                            const currentLayer = state.areaInstance.definition.layers.find(l => l.key === layerKey);
                            const parentLayer = state.areaInstance.definition.parentDefinition?.layers?.find(l => l.key === layerKey);
                            let brush: TileGridDefinition = null, defaultBrush: TileGridDefinition = null;
                            if (currentLayer && currentLayer === selectedLayer) {
                                brush = editingState.brush[layerKey] || editingState.brush.none;
                            } else {
                                brush = editingState.brush[layerKey];
                                // Default brush is only used when no layers are selected.
                                if (!selectedLayer) {
                                    defaultBrush = editingState.brush.none;
                                }
                            }
                            if (selectedLayer && currentLayer !== selectedLayer) {
                                context.globalAlpha = 0.5;
                            } else {
                                if (currentLayer?.visibilityOverride === 'fade') {
                                    context.globalAlpha = 0.3;
                                } else {
                                    context.globalAlpha = 1;
                                }
                            }
                            let drawPriority = currentLayer?.drawPriority || brush?.drawPriority || (layerKey === 'foreground' ? 'foreground' : 'background');
                            if (drawPriority === priorityToDraw) {
                                drawBrushLayerPreview(
                                    context,
                                    state,
                                    layerKey,
                                    currentLayer,
                                    parentLayer,
                                    brush,
                                    defaultBrush,
                                    rectangle,
                                );
                            }
                        }
                    }
                }
            }
            context.globalAlpha = 0.6;
            if (editingState.tool === 'select' && state.areaInstance.definition.objects.includes(editingState.selectedObject)) {
                const instance = createObjectInstance(state, editingState.selectedObject);
                let target: Rect;
                if (instance.getEditorHitbox) {
                    target = instance.getEditorHitbox(state);
                } else if(instance.getHitbox) {
                    target = instance.getHitbox(state);
                } else {
                    const frame = getObjectFrame(editingState.selectedObject);
                    target = {
                        x: editingState.selectedObject.x + (frame.content?.x || 0) - 1,
                        y: editingState.selectedObject.y + (frame.content?.y || 0) - 1,
                        w: (frame.content?.w || frame.w) + 2,
                        h: (frame.content?.h || frame.h) + 2,
                    };
                }
                context.fillStyle = 'white';
                context.fillRect(target.x, target.y, target.w, target.h);
            }
            const variantData = editingState.selectedVariantData;
            if (editingState.selectedVariantData && state.areaInstance.definition.variants?.includes(variantData)) {
                context.lineWidth = 2;
                context.strokeStyle = 'white';
                context.strokeRect(variantData.x, variantData.y, variantData.w, variantData.h);
            }
            if (['object', 'enemy', 'boss'].includes(editingState.tool)) {
                renderObjectPreview(context, state, editingState, x, y);
            }
        }
    context.restore();
}

function drawBrushLayerPreview(
    context: CanvasRenderingContext2D,
    state: GameState,
    // The key of the layer being drawn, needed in case the actual layer does not exist.
    layerKey: string,
    layer: AreaLayerDefinition | null,
    parentLayer: AreaLayerDefinition | null,
    brush: TileGridDefinition | null,
    defaultBrush: TileGridDefinition | null,
    rectangle: Rect,
): void {
    const areaSize = state.zone.areaSize ?? {w: 32, h: 32};
    const w = 16, h = 16;
    for (let y = 0; y < rectangle.h; y++) {
        const ty = rectangle.y + y;
        if (ty < 0 || ty >= areaSize.h) continue;
        for (let x = 0; x < rectangle.w; x++) {
            const tx = rectangle.x + x;
            if (tx < 0 || tx >= areaSize.w) continue;
            let tile: FullTile|undefined|null = null;
            // The brush is used if it is defined.
            if (brush) {
                tile = allTiles[brush.tiles[y]?.[x]];
            } else if (defaultBrush) {
                // If no brush is defined, check if the default brush applies, otherwise use the existing
                // layer tile if present.
                const defaultTile = allTiles[defaultBrush.tiles[y]?.[x]];
                const defaultLayer = defaultTile ? (defaultTile.behaviors?.defaultLayer ?? 'floor') : 'field';
                if (defaultLayer === layerKey) {
                    tile = defaultTile;
                } else if (layer) {
                    tile = allTiles[layer.grid.tiles[ty]?.[tx]];
                }
            }else if (layer) {
                // If there is no brush or default brush just use the existing layer tile if present
                tile = allTiles[layer.grid.tiles[ty]?.[tx]];
            }
            if (!tile && parentLayer) {
                const parentTile = allTiles[parentLayer.grid?.tiles[ty]?.[tx]];
                tile = mapTile(parentTile);
            }
            if (tile) {
                context.save();
                if (tile.behaviors?.editorTransparency) {
                    context.globalAlpha *= tile.behaviors.editorTransparency;
                }
                if (tile.behaviors?.render) {
                    tile.behaviors.render(context, tile, {x: tx * w, y: ty * h, w, h}, 0);
                } else {
                    drawFrame(context, tile.frame, {x: tx * w, y: ty * h, w, h});
                }
                context.restore();
            }
        }
    }
}
