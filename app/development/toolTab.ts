import { sourcePalettes } from 'app/content/tiles/palettes';
import { paletteHash } from 'app/content/tiles/paletteHash';
import { editingState } from 'app/development/editingState';
import {getObjectTypeProperties, isObjectSelected, unselectObject} from 'app/development/objectEditor';
import {getVariantTypeSelector, isVariantSelected} from 'app/development/variantEditor';
import {
    renderPropertyRows, updateBrushCanvas,
} from 'app/development/propertyPanel';
import { TabContainer } from 'app/development/tabContainer';
import { getState } from 'app/state';

import { readImageFromFile } from 'app/utils/index';
import { chunkGenerators } from 'app/generator/tileChunkGenerators';


const toolTabContainer = new TabContainer<EditorToolType>('brush', [
    {
        key: 'select',
        label: '↖',
        render(container: HTMLElement) {
            const state = getState();
            if (isVariantSelected(state, editingState)) {
                renderPropertyRows(container, getVariantTypeSelector());
            } else if (isObjectSelected(state, editingState)) {
                renderPropertyRows(container, getObjectPaletteProperties());
            } else {
                renderPropertyRows(container, ['Click an object to select it.']);
            }
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'brush',
        label: '🖌',
        render(container: HTMLElement) {
            renderPropertyRows(container, getBrushPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'tileChunk',
        label: '⋮⋮⋮',
        render(container: HTMLElement) {
            renderPropertyRows(container, getTileChunkProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'replace',
        label: '▧',
        render(container: HTMLElement) {
            renderPropertyRows(container, getBrushPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'variant',
        label: 'V',
        render(container: HTMLElement) {
            renderPropertyRows(container, getVariantTypeSelector());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
        onSelect() {
            unselectObject(editingState, editingState.selectedVariantData);
        }
    },
    {
        key: 'object',
        label: 'object',
        render(container: HTMLElement) {
            renderPropertyRows(container, getObjectPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'enemy',
        label: 'enemy',
        render(container: HTMLElement) {
            renderPropertyRows(container, getObjectPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'boss',
        label: 'boss',
        render(container: HTMLElement) {
            renderPropertyRows(container, getObjectPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
], (selectedKey) => {
    editingState.previousTool = editingState.tool;
    editingState.tool = selectedKey;
    editingState.selectedObject = {
        ...editingState.selectedObject,
        id: null,
    };
    // Always switch back to default saveStatus when switching tool type.
    delete editingState.selectedObject.saveStatus;
    editingState.needsRefresh = true;
});

export function setEditingTool(toolType: EditorToolType) {
    toolTabContainer.showTab(toolType);
}

export function renderToolTabContainer(): HTMLElement {
    toolTabContainer.render();
    return toolTabContainer.element;
}

function getObjectPaletteProperties(): PanelRows {
    return getObjectTypeProperties();
}

function getTileChunkProperties(): PanelRows {
    let rows: PanelRows = [];
    rows.push({
        id: 'tileChunkStyle',
        name: 'style',
        value:editingState.tileChunkKey || Object.keys(chunkGenerators)[0],
        values: Object.keys(chunkGenerators),
        onChange(tileChunkKey: string) {
            editingState.tileChunkKey = tileChunkKey;
        }
    });

    return rows;
}

function getBrushPaletteProperties(): PanelRows {
    const state = getState();
    let rows: PanelRows = [];
    editingState.paletteKey = editingState.paletteKey || Object.keys(paletteHash)[0];
    switch (editingState.tool) {
        case 'replace':
            rows.push({
                name: 'percent',
                value: editingState.replacePercentage,
                onChange(percent: number) {
                    editingState.replacePercentage = Math.max(0, Math.min(100, percent));
                    return editingState.replacePercentage;
                }
            });
            break;
        default:
            break;
    }
    rows.push([{
        name: 'palette',
        value: editingState.paletteKey,
        values: [...Object.keys(paletteHash), ...Object.keys(sourcePalettes)],
        onChange(key: string) {
            editingState.paletteKey = key;
            state.areaInstance.tilesDrawn = [];
            state.areaInstance.checkToRedrawTiles = true;
            editingState.needsRefresh = true;
        },
    },{
        name: 'Add Source',
        async onClick() {
            const { image, fileName } = await readImageFromFile();
            sourcePalettes[fileName] = {
                source: {
                    image,
                    x: 0, y: 0, w: image.width, h: image.height,
                },
                tiles: [],
                grid: [],
            };
            editingState.paletteKey = fileName;
            state.areaInstance.tilesDrawn = [];
            state.areaInstance.checkToRedrawTiles = true;
            editingState.needsRefresh = true;
        },
    }]);
    if (paletteHash[editingState.paletteKey]) {
        rows.push({
            name: 'brush',
            value: editingState.brush,
            palette: paletteHash[editingState.paletteKey],
            onChange(tiles: TileGridDefinition) {
                editingState.brush = {'none': tiles};
                updateBrushCanvas(editingState.brush);
                if (editingState.tool !== 'brush' && editingState.tool !== 'replace') {
                    setEditingTool('brush');
                }
            }
        });
    } else if (sourcePalettes[editingState.paletteKey]) {
        rows.push({
            name: 'brush',
            value: editingState.brush,
            sourcePalette: sourcePalettes[editingState.paletteKey],
            onChange(tiles: TileGridDefinition) {
                editingState.brush = {'none': tiles};
                updateBrushCanvas(editingState.brush);
                if (editingState.tool !== 'brush' && editingState.tool !== 'replace') {
                    setEditingTool('brush');
                }
            }
        });
    }
    return rows;
}
