import { paletteHash } from 'app/content/tiles/paletteHash';
import { addNewTile, allTiles, generateTileHash, generateTileHashMap } from 'app/content/tiles';
import { tagElement } from 'app/dom';
import { KEY, isKeyboardKeyDown } from 'app/userInput';
import { drawFrame } from 'app/utils/animations';
import { createCanvas } from 'app/utils/canvas';
import { getMousePosition, isMouseDown } from 'app/utils/mouse';


const panelsByClass: {[key: string]: HTMLElement} = {};
// We may need to split these by class and reset them when rendering properties again.
const propertiesById: {[key: string]: EditorProperty<any>} = {};

export function displayPanel(h: 'left' | 'right', v: 'top' | 'bottom',content?: HTMLElement): HTMLElement {
    const panelClass = `pp-container ${h}-container ${v}-container`;
    hidePropertyPanel(panelClass);
    const newPanel = tagElement('div', panelClass);
    if (content) {
        newPanel.append(content);
    }
    panelsByClass[panelClass] = newPanel;
    document.body.append(newPanel);
    return newPanel;
}

export function displayPropertyPanel(properties: PanelRows, h: 'left' | 'right', v: 'top' | 'bottom'): void {
    renderPropertyRows(displayPanel(h, v), properties);
}

export function renderPropertyRows(container: HTMLElement, properties: PanelRows): void {
    for (const property of properties) {
        if (Array.isArray(property)) {
            container.append(renderPropertyRow(property));
        } else {
            container.append(renderPropertyRow([property]));
        }
    }
    container.addEventListener('change', (event: InputEvent) => {
        const input = (event.target as HTMLElement).closest('input')
            || (event.target as HTMLElement).closest('textarea')
            || (event.target as HTMLElement).closest('select');
        const property = input && propertiesById[input.name];
        if (property) {
            if (isStringProperty(property) && property.onChange) {
                // If there is a validation error, onChange will return
                // the value to set the input to.
                const newValue = property.onChange(input.value.trim());
                if (typeof newValue === 'string') {
                    input.value = newValue;
                } else if (newValue) {
                    input.value = newValue.value;
                }
            } else if (isNumberProperty(property) && property.onChange) {
                // If there is a validation error, onChange will return
                // the value to set the input to.
                const newValue = property.onChange(parseInt(input.value, 10));
                if (newValue) {
                    input.value = `${newValue}`;
                }
            } else if (isBooleanProperty(property) && property.onChange) {
                property.onChange((input as HTMLInputElement).checked);
            } else if (isStringArrayProperty(property)) {
                property.value.push(input.value);
                // The value gets added to the tags UI, so we don't keep it
                // selected in the select. Also, the value will be removed from
                // the select options.
                input.value = '';
                property.onChange(property.value);
            }
        }
        input.blur();
    });
    container.addEventListener('click', (event: InputEvent) => {
        const button = (event.target as HTMLElement).closest('button');
        if (button) {
            const property = propertiesById[button.name];
            if (isButtonProperty(property)) {
                property.onClick();
            }
        }
        const tag = (event.target as HTMLElement).closest('.pp-tag');
        if (tag) {
            const container = tag.closest('.pp-tag-container') as HTMLElement;
            const property = container && propertiesById[container.getAttribute('name')];
            if (isStringArrayProperty(property)) {
                const value = tag.textContent.trim();
                const index = property.value.indexOf(value);
                if (index >= 0) {
                    property.value.splice(index, 1);
                    property.onChange(property.value);
                }
            }
        }
    });
}

export function hideAllPropertyPanels() {
    Object.keys(panelsByClass).forEach(hidePropertyPanel);
}
export function hidePropertyPanel(panelClass: string) {
    const panel = panelsByClass[panelClass];
    if (!panel) {
        return;
    }
    // Set this to null before removing, otherwise if there is an on blur handle that also
    // triggers hidePropertyPanel, it will try to remove the element twice.
    delete panelsByClass[panelClass];
    panel.remove();
}

function renderPropertyRow(row: PropertyRow): HTMLElement {
    const div = tagElement('div', 'pp-row');
    for (const property of row) {
        const element = renderProperty(property);
        if (typeof element === 'string') {
            div.innerHTML += element;
        } else {
            div.append(element);
        }
    }
    return div;
}

// For now stringArray is the only supported type of array prop.
// We might be able to support other types if we check the type of the option values.
function isStringArrayProperty(property: EditorProperty<any>): property is EditorArrayProperty<string> {
    return Array.isArray((property as EditorArrayProperty<any>)?.['value']);
}
// The value will always be type string, but the array of values may have type {value: string, label: string} for displaying options.
function isStringProperty(property: EditorProperty<any>): property is EditorSingleProperty<string | {value: string, label: string}> {
    return typeof((property as EditorSingleProperty<any>)?.['value']) === 'string';
}
function isNumberProperty(property: EditorProperty<any>): property is EditorSingleProperty<number> {
    return typeof((property as EditorSingleProperty<any>)?.['value']) === 'number';
}
function isBooleanProperty(property: EditorProperty<any>): property is EditorSingleProperty<boolean> {
    return typeof((property as EditorSingleProperty<any>)?.['value']) === 'boolean';
}
function isButtonProperty(property: EditorProperty<any>): property is EditorButtonProperty {
    return !!(property as EditorButtonProperty)?.['onClick'];
}
function isPaletteProperty(property: EditorProperty<any>): property is EditorPaletteProperty {
    return !!(property as EditorPaletteProperty)?.['palette'];
}
function isSourcePaletteProperty(property: EditorProperty<any>): property is EditorSourcePaletteProperty {
    return !!(property as EditorSourcePaletteProperty)?.['sourcePalette'];
}

const paletteCanvas = createCanvas(100, 100);
paletteCanvas.style.border = '1px solid black';
paletteCanvas.draggable = false;
paletteCanvas.style.transformOrigin = '0 0';
const paletteContext = paletteCanvas.getContext('2d');
paletteContext.imageSmoothingEnabled = false;

const brushCanvas = createCanvas(100, 100);
brushCanvas.style.border = '1px solid black';
const brushContext = brushCanvas.getContext('2d');
brushContext.imageSmoothingEnabled = false;
export function updateBrushCanvas(selectedTiles: {[key: string]: TileGridDefinition}): void {
    // TODO: Make this light grey 5px checkers to indicate transparent areas.
    brushContext.fillStyle = 'blue';
    brushContext.fillRect(0, 0, brushCanvas.width, brushCanvas.height);
    // Draw all the non-foreground layers first
    for (const grid of Object.values(selectedTiles)) {
        if (grid.drawPriority !== 'foreground') {
            drawBrushCanvasLayer(grid);
        }
    }
    // Draw the foreground layers last.
    for (const grid of Object.values(selectedTiles)) {
        if (grid.drawPriority === 'foreground') {
            drawBrushCanvasLayer(grid);
        }
    }
}
function drawBrushCanvasLayer(selectedTiles: TileGridDefinition): void {
    const brushWidth = selectedTiles.w * 16;
    const brushHeight = selectedTiles.h * 16;
    const scale = Math.min(brushCanvas.width / brushWidth, brushCanvas.height / brushHeight);
    brushContext.save();
    {
        // Center the brush in the canvas?
        brushContext.translate(
            (brushCanvas.width - brushWidth * scale) / 2,
            (brushCanvas.height - brushHeight * scale) / 2,
        );
        brushContext.scale(scale, scale);
        for (let tx = 0; tx < selectedTiles.w; tx++) {
            for (let ty = 0; ty < selectedTiles.h; ty++) {
                const tile = allTiles[selectedTiles.tiles[ty]?.[tx]];
                if (!tile) {
                    drawX(brushContext, tx * 16, ty * 16);
                    continue;
                }
                const target = {x: tx * 16, y: ty * 16, w: 16, h: 16};
                if (tile.behaviors?.maskFrame) {
                    drawFrame(brushContext, tile.behaviors.maskFrame, target);
                }
                if (tile.behaviors?.render) {
                    tile.behaviors?.render(brushContext, tile, target, 0);
                } else {
                    drawFrame(brushContext, tile.frame, target);
                }
            }
        }
    }
    brushContext.restore();
}

function drawX(context: CanvasRenderingContext2D, x: number, y: number) {
    context.strokeStyle = 'red';
    context.beginPath();
    context.moveTo(x + 2, y + 2);
    context.lineTo(x + 14, y + 14);
    context.moveTo(x + 14, y + 2);
    context.lineTo(x + 2, y + 14);
    context.stroke();
}

// TODO: only return HTMLElements from this function
function renderProperty(property: EditorProperty<any> | HTMLElement | string): string | HTMLElement {
    if (typeof(property) === 'string') {
        return `<span class="pp-property">${property}</span>`;
    }
    if (property instanceof HTMLElement) {
        const span = tagElement('span', 'pp-property');
        span.append(property);
        return span;
    }
    if (isPaletteProperty(property)) {
        propertiesById[property.id || property.name] = property;
        const containerDiv = tagElement('div', 'pp-property');
        const palette = property.palette;
        paletteCanvas.width = palette[0].length * 16;
        paletteCanvas.height = palette.length * 16;
        const scale = 1;//Math.min(1, 1024 / paletteCanvas.height);

        for (let i = 0; i < palette.length; i++) {
            for (let j = 0; j < palette[i].length; j++) {
                const tile = allTiles[palette[i][j]];
                if (!tile) {
                    drawX(paletteContext, j * 16, i * 16);
                    continue;
                }
                const target = {x: 16 * j, y: 16 * i, w: 16, h: 16};
                if (tile.behaviors?.maskFrame) {
                    drawFrame(paletteContext, tile.behaviors.maskFrame, target);
                }
                if (tile.behaviors?.render) {
                    tile.behaviors?.render(paletteContext, tile, target, 0);
                } else {
                    drawFrame(paletteContext, tile.frame,target );
                }
            }
        }

        const selectTile = () => {
            let [x, y] = getMousePosition(paletteCanvas, scale);
            const ty = Math.floor(y / 16);
            const tx = Math.floor(x / 16);
            property.onChange({
                w: 1, h: 1,
                tiles: [[palette[ty]?.[tx]]],
            });
        }
        let dragX: number, dragY: number;
        const updateBrushSelection = (x: number, y: number): void => {
            const tx1 = Math.floor(dragX / 16);
            const ty1 = Math.floor(dragY / 16);
            const tx2 = Math.floor(x / 16);
            const ty2 = Math.floor(y / 16);
            const L = Math.max(0, Math.min(tx1, tx2));
            const R = Math.min(paletteCanvas.width / 16 - 1, Math.max(tx1, tx2));
            const T = Math.max(0, Math.min(ty1, ty2));
            const B = Math.min(paletteCanvas.height / 16 - 1, Math.max(ty1, ty2));
            const brush: TileGridDefinition = {
                w: R - L + 1,
                h: B - T + 1,
                tiles: [],
            }
            for (let y = 0; y < brush.h; y++) {
                brush.tiles[y] = [];
                for (let x = 0; x < brush.w; x++) {
                    brush.tiles[y][x] = palette[T + y][L + x];
                }
            }
            property.onChange(brush);
        }
        // Prevent dragging ghost preview of the image around.

        paletteCanvas.onmousedown = (e) => {
            if (isKeyboardKeyDown(KEY.SHIFT)) {
                [dragX, dragY] = getMousePosition(paletteCanvas, scale);
                updateBrushSelection(dragX, dragY);
            } else {
                selectTile();
            }
        }
        paletteCanvas.onmousemove = () => {
            if (isMouseDown()) {
                if (isKeyboardKeyDown(KEY.SHIFT)) {
                    const [x, y] = getMousePosition(paletteCanvas, scale);
                    updateBrushSelection(x, y);
                } else {
                    selectTile();
                }
            }
        }
        paletteCanvas.style.transform = `scale(${scale})`;
        // The scale transform interacts poorly directly inside a flex display, so we add
        // a div with the correct width wrapping the palette.
        const paletteDiv = tagElement('div');
        paletteDiv.style.width = '400px';
        paletteDiv.style.height = `${Math.min(300, 20 + paletteCanvas.height * scale)}px`;
        paletteDiv.style.textAlign = 'center';
        paletteDiv.style.marginBottom = '10px';
        paletteDiv.style.overflowY = 'auto';
        paletteDiv.append(paletteCanvas);

        containerDiv.style.display = 'flex';
        containerDiv.style.flexDirection = 'column';
        containerDiv.style.alignItems = 'center';
        containerDiv.append(paletteDiv);
        containerDiv.append(brushCanvas);
        return containerDiv;
    } else if (isSourcePaletteProperty(property)) {
        propertiesById[property.id || property.name] = property;
        const containerDiv = tagElement('div', 'pp-property');
        const frame = {
            image: property.sourcePalette.source.image,
            x: 0,
            y: 0,
            w: property.sourcePalette.source.image.width,
            h: property.sourcePalette.source.image.height,
        };
        paletteCanvas.width = frame.w;
        paletteCanvas.height = frame.h;
        const scale = Math.min(1, 1024 / paletteCanvas.height, 400 / paletteCanvas.width);
        // Remember to only use arrow functions inside of if blocks.
        const refreshPaletteCanvas = () => {
            paletteContext.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height)
            paletteContext.save();
                paletteContext.globalAlpha *= 0.4;
                drawFrame(paletteContext, frame, {...frame, x: 0,y: 0});
            paletteContext.restore();

            paletteContext.fillStyle = 'red';
            const tiles = property.sourcePalette.tiles;
            for (let i = 0; i < tiles.length; i++) {
                const tile = allTiles[tiles[i]];
                drawFrame(paletteContext, tile.frame, { x: tile.frame.x, y: tile.frame.y, w: 16, h: 16});
                paletteContext.fillRect(tile.frame.x + 6, tile.frame.y + 6, 4, 4);
            }
        };
        refreshPaletteCanvas();

        const getOrImportTile = (x: number, y: number): FullTile => {
            const gx = x / 16, gy = y / 16;
            property.sourcePalette.grid[gy] = property.sourcePalette.grid[gy] || [];
            if (property.sourcePalette.grid[gy][gx] >= 0) {
                return allTiles[property.sourcePalette.grid[gy][gx]];
            }
            const tileHashMap = generateTileHashMap();
            const frame = {
                image: property.sourcePalette.source.image,
                x, y, w: 16, h: 16
            }
            const hashKey = generateTileHash({ frame });
            let tile = tileHashMap[hashKey]
            if (!tile) {
                tile = addNewTile(frame);
                // Add the new tile to the sourcePalette definition
                property.sourcePalette.tiles.push(tile.index);
                // Add the new tile to the "everything" palette.
                let py = (tile.index / 16) | 0;
                let px = tile.index % 16;
                paletteHash.everything[py] = paletteHash.everything[py] || [];
                paletteHash.everything[py][px] = tile.index;
                refreshPaletteCanvas();
            }
            property.sourcePalette.grid[gy][gx] = tile?.index || 0;
            return tile;
        }

        const selectTile = () => {
            let [x, y] = getMousePosition(paletteCanvas, scale);
            x = ((x / 16) | 0) * 16;
            y = ((y / 16) | 0) * 16;
            const tile = getOrImportTile(x, y);
            property.onChange({
                w: 1, h: 1,
                tiles: [[tile?.index || 0]],
            });
        }
        let dragX: number, dragY: number;
        const updateBrushSelection = (x: number, y: number): void => {
            const tx1 = Math.floor(dragX / 16);
            const ty1 = Math.floor(dragY / 16);
            const tx2 = Math.floor(x / 16);
            const ty2 = Math.floor(y / 16);
            const L = Math.max(0, Math.min(tx1, tx2));
            const R = Math.min(paletteCanvas.width / 16 - 1, Math.max(tx1, tx2));
            const T = Math.max(0, Math.min(ty1, ty2));
            const B = Math.min(paletteCanvas.height / 16 - 1, Math.max(ty1, ty2));
            const brush: TileGridDefinition = {
                w: R - L + 1,
                h: B - T + 1,
                tiles: [],
            }
            for (let y = 0; y < brush.h; y++) {
                brush.tiles[y] = [];
                for (let x = 0; x < brush.w; x++) {
                    brush.tiles[y][x] = getOrImportTile((L + x) * 16, (T + y) * 16)?.index || 0;
                }
            }
            property.onChange(brush);
        }
        paletteCanvas.onmousedown = (e) => {
            if (isKeyboardKeyDown(KEY.SHIFT)) {
                [dragX, dragY] = getMousePosition(paletteCanvas, scale);
                updateBrushSelection(dragX, dragY);
            } else {
                selectTile();
            }
        }
        paletteCanvas.onmousemove = () => {
            if (isMouseDown()) {
                if (isKeyboardKeyDown(KEY.SHIFT)) {
                    const [x, y] = getMousePosition(paletteCanvas, scale);
                    updateBrushSelection(x, y);
                } else {
                    selectTile();
                }
            }
        }
        paletteCanvas.style.transform = `scale(${scale})`;
        containerDiv.style.display = 'flex';
        containerDiv.style.flexDirection = 'column';
        containerDiv.style.alignItems = 'center';
        // The scale transform interacts poorly directly inside a flex display, so we add
        // a div with the correct width wrapping the palette.
        const paletteDiv = tagElement('div');
        paletteDiv.style.width = '400px';
        paletteDiv.style.height = `${Math.min(300, 20 + paletteCanvas.height * scale)}px`;
        paletteDiv.style.textAlign = 'center';
        paletteDiv.style.marginBottom = '10px';
        paletteDiv.style.overflowY = 'auto';
        paletteDiv.append(paletteCanvas);
        containerDiv.append(paletteDiv);
        containerDiv.append(brushCanvas);
        return containerDiv;
    } else if (isButtonProperty(property)) {
        propertiesById[property.id || property.name] = property;
        return `<span class="pp-property"><button name="${property.id || property.name}">${property.name}</button></span>`;
    } else if (property.onChange) {
        propertiesById[property.id || property.name] = property;
        if (isStringProperty(property)) {
            if (property.values) {
                return `<span class="pp-property">${property.name}
                    <select name="${property.id || property.name}" size="${property.selectSize || 1}">`
                    + property.values.map(val => {
                        let value: string, label: string;
                        if (typeof val !== 'string') {
                            value = val.value;
                            label = val.label;
                        } else {
                            value = label = val;
                        }
                        return `
                            <option ${value === property.value ? 'selected' : ''} value="${value}">
                                ${label}
                            </option>`
                    })
                    + '</select></span>';
            }
            if (property.multiline) {
                return `<span class="pp-property">${property.name} <textarea rows="5" cols="30" name="${property.id || property.name}">${property.value}</textarea></span>`;
            }
            return `<span class="pp-property">${property.name} <input value="${property.value}" name="${property.id || property.name}" /></span>`;
        } else if (isNumberProperty(property)) {
            if (property.values) {
                return `<span class="pp-property">${property.name}
                    <select name="${property.id || property.name}" size="${property.selectSize || 1}">`
                    + property.values.map(val => `
                        <option ${val === property.value ? 'selected' : ''}>
                            ${val}
                        </option>`)
                    + '</select></span>';
            }
            return `<span class="pp-property">
                ${property.name}
                <input type="number"
                    name="${property.id || property.name}"
                    class="${property.inputClass || ''}"
                    value="${property.value}"  />
                </span>`;
        } else if (isBooleanProperty(property)) {
            return `<span class="pp-property">
                        ${property.name}
                        <input type="checkbox" ${property.value ? 'checked' : ''} name="${property.id || property.name}" />
                    </span>`;
        } else if (isStringArrayProperty(property)) {
            const options = property.values.filter(v => !property.value.includes(v));
            const selectedContainer = property.value.length ? `
                <div class="pp-tag-container" name="${property.id || property.name}">
                    ${property.value.map(v => `<span class="pp-tag">${v} </span>`).join('')}
                </div>
                ` : '';

            return `<span class="pp-property">
                        <div>
                            ${property.name} <select name="${property.id || property.name}" ${!options.length ? 'disabled' : ''}>
                                <option disabled selected value> -- Add -- </option>
                                ${options.map(val => `<option>${val}</option>`)}
                            </select>
                        </div>
                        ${selectedContainer}
                    </span>`;
        }
    } else {
        return `<span class="pp-property">${property.name}: ${property.value}</span>`;
    }
}
