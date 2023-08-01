import { palettes, sourcePalettes } from 'app/content/palettes';
import { editingState } from 'app/development/editingState';
import { getObjectTypeProperties } from 'app/development/objectEditor';
import {
    renderPropertyRows, updateBrushCanvas,
} from 'app/development/propertyPanel';
import { TabContainer } from 'app/development/tabContainer';
import { getState } from 'app/state';

import { readImageFromFile } from 'app/utils/index';



const toolTabContainer = new TabContainer<EditorToolType>('brush', [
    {
        key: 'select',
        label: '↖',
        render(container: HTMLElement) {
            renderPropertyRows(container, getObjectPaletteProperties());
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
    }
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

function getBrushPaletteProperties(): PanelRows {
    const state = getState();
    let rows: PanelRows = [];
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
        values: [...Object.keys(palettes), ...Object.keys(sourcePalettes)],
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
    if (palettes[editingState.paletteKey]) {
        rows.push({
            name: 'brush',
            value: editingState.brush,
            palette: palettes[editingState.paletteKey],
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
