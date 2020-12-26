import { createCanvas, tagElement } from 'app/dom';
import { drawFrame } from 'app/utils/animations';
import { getMousePosition, isMouseDown } from 'app/utils/mouse';

import {
    EditorArrayProperty, EditorButtonProperty, EditorPaletteProperty, EditorProperty, EditorSingleProperty,
    PropertyRow, TileGrid,
} from 'app/types';

let propertyPanelElement = null;
let propertiesByName: {[key: string]: EditorProperty<any>} = {};


export function displayPropertyPanel(properties: (EditorProperty<any> | PropertyRow | string)[]): void {
    hidePropertyPanel();
    propertiesByName = {};
    propertyPanelElement = tagElement('div', 'pp-container');
    for (const property of properties) {
        if (Array.isArray(property)) {
            propertyPanelElement.append(renderPropertyRow(property));
        } else {
            propertyPanelElement.append(renderPropertyRow([property]));
        }
    }
    propertyPanelElement.addEventListener('change', (event: InputEvent) => {
        const input = (event.target as HTMLElement).closest('input')
            || (event.target as HTMLElement).closest('select');
        const property = input && propertiesByName[input.name];
        if (property) {
            if (isStringProperty(property) && property.onChange) {
                // If there is a validation error, onChange will return
                // the value to set the input to.
                const newValue = property.onChange(input.value.trim());
                if (newValue) {
                    input.value = newValue;
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
    });
    propertyPanelElement.addEventListener('click', (event: InputEvent) => {
        const button = (event.target as HTMLElement).closest('button');
        if (button) {
            const property = propertiesByName[button.name];
            if (isButtonProperty(property)) {
                property.onClick();
            }
        }
        const tag = (event.target as HTMLElement).closest('.pp-tag');
        if (tag) {
            const container = tag.closest('.pp-tag-container') as HTMLElement;
            const property = container && propertiesByName[container.getAttribute('name')];
            if (isStringArrayProperty(property)) {
                const value = tag.textContent;
                const index = property.value.indexOf(value);
                if (index >= 0) {
                    property.value.splice(index, 1);
                    property.onChange(property.value);
                }
            }
        }
    });
    document.body.append(propertyPanelElement);
}

export function hidePropertyPanel() {
    if (propertyPanelElement) {
        const temp = propertyPanelElement;
        // Set this to null before removing, otherwise if there is an on blur handle that also
        // triggers hidePropertyPanel, it will try to remove the element twice.
        propertyPanelElement = null;
        temp.remove();
    }
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
    return Array.isArray(property?.['value']);
}
function isStringProperty(property: EditorProperty<any>): property is EditorSingleProperty<string> {
    return typeof(property?.['value']) === 'string';
}
function isNumberProperty(property: EditorProperty<any>): property is EditorSingleProperty<number> {
    return typeof(property?.['value']) === 'number';
}
function isBooleanProperty(property: EditorProperty<any>): property is EditorSingleProperty<boolean> {
    return typeof(property?.['value']) === 'boolean';
}
function isButtonProperty(property: EditorProperty<any>): property is EditorButtonProperty {
    return !!property?.['onClick'];
}
function isPaletteProperty(property: EditorProperty<any>): property is EditorPaletteProperty {
    return !!property?.['palette'];
}

const brushCanvas = createCanvas(100, 100);
brushCanvas.style.border = '1px solid black';
const brushContext = brushCanvas.getContext('2d');
brushContext
export function updateBrushCanvas(selectedTiles: TileGrid): void {
    const brushWidth = selectedTiles.w * selectedTiles.palette.w;
    const brushHeight = selectedTiles.h * selectedTiles.palette.h;
    const scale = Math.min(brushCanvas.width / brushWidth, brushCanvas.height / brushHeight);
    // TODO: Make this light grey 5px checkers to indicate transparent areas.
    brushContext.fillStyle = 'blue';
    brushContext.fillRect(0, 0, brushCanvas.width, brushCanvas.height);
    brushContext.save();
    {
        // Center the brush in the canvas?
        brushContext.translate(
            (brushCanvas.width - brushWidth * scale) / 2,
            (brushCanvas.height - brushHeight * scale) / 2,
        );
        brushContext.scale(scale, scale);
        const image = selectedTiles.palette.source.image;
        const w = selectedTiles.palette.w;
        const h = selectedTiles.palette.h;
        for (let tx = 0; tx < selectedTiles.w; tx++) {
            for (let ty = 0; ty < selectedTiles.h; ty++) {
                const tile = selectedTiles.tiles[ty]?.[tx];
                if (!tile) {
                    continue;
                }
                const frame = {
                    image, w, h,
                    x: selectedTiles.palette.source.x + w * tile.x,
                    y: selectedTiles.palette.source.y + h * tile.y,
                };
                drawFrame(brushContext, frame, {w, h, x: tx * w, y: ty * h});
            }
        }
    }
    brushContext.restore();
}

// TODO: only return HTMLElements from this function
function renderProperty(property: EditorProperty<any> | string): string | HTMLElement {
    if (typeof(property) === 'string') {
        return `<span class="pp-property">${property}</span>`;
    }
    if (isPaletteProperty(property)) {
        propertiesByName[property.name] = property;
        const span = tagElement('span', 'pp-property');
        const image = property.palette.source.image;

        const selectTile = () => {
            let [x, y] = getMousePosition(image, Math.min(1, 400 / property.palette.source.h));
            const tx = Math.floor(x / property.palette.w);
            const ty = Math.floor(y / property.palette.h);
            property.onChange({
                palette: property.palette, w: 1, h: 1,
                tiles: [[{x: tx, y: ty}]],
            });
        }
        // Prevent dragging ghost preview of the image around.
        image.draggable = false;
        image.onclick = (e) => {
            selectTile();
        }
        image.onmousemove = () => {
            if (isMouseDown()) {
                selectTile();
            }
        }
        image.style.maxHeight = '400px';
        span.style.display = 'flex';
        span.style.flexDirection = 'column';
        span.style.alignItems = 'center';
        span.append(property.palette.source.image);
        span.append(brushCanvas);
        return span;
    } else if (isButtonProperty(property)) {
        propertiesByName[property.name] = property;
        return `<span class="pp-property"><button name="${property.name}">${property.name}</button></span>`;
    } else if (property.onChange) {
        propertiesByName[property.name] = property;
        if (isStringProperty(property)) {
            if (property.values) {
                return `<span class="pp-property">${property.name} <select name="${property.name}">`
                    + property.values.map(val => `
                        <option ${val === property.value ? 'selected' : ''}>
                            ${val}
                        </option>`)
                    + '</select></span>';
            }
            return `<span class="pp-property">${property.name} <input value="${property.value}" name="${property.name}" /></span>`;
        } else if (isNumberProperty(property)) {
            if (property.values) {
                return `<span class="pp-property">${property.name} <select name="${property.name}">`
                    + property.values.map(val => `
                        <option ${val === property.value ? 'selected' : ''}>
                            ${val}
                        </option>`)
                    + '</select></span>';
            }
            return `<span class="pp-property">${property.name} <input type="number" value="${property.value}" name="${property.name}" /></span>`;
        } else if (isBooleanProperty(property)) {
            return `<span class="pp-property">
                        ${property.name}
                        <input type="checkbox" ${property.value ? 'checked' : ''} name="${property.name}" />
                    </span>`;
        } else if (isStringArrayProperty(property)) {
            const options = property.values.filter(v => !property.value.includes(v));
            const selectedContainer = property.value.length ? `
                <div class="pp-tag-container" name="${property.name}">
                    ${property.value.map(v => `<span class="pp-tag">${v}</span>`).join('')}
                </div>
                ` : '';

            return `<span class="pp-property">
                        <div>
                            ${property.name} <select name="${property.name}" ${!options.length ? 'disabled' : ''}>
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
