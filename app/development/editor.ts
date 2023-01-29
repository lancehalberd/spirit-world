import { editingState } from 'app/development/editingState';
import { displayTileEditorPropertyPanel } from 'app/development/tileEditor';
import { hideAllPropertyPanels } from 'app/development/propertyPanel';
import { createObjectDefinition, combinedObjectTypes } from 'app/development/objectEditor';
import { enterLocation } from 'app/utils/enterLocation';

import { GameState, ObjectDefinition, ObjectType } from 'app/types';

export function toggleEditing(state: GameState) {
    state.scene = 'game';
    state.hero.z = 0;
    state.hero.actionTarget = null;
    editingState.isEditing = !editingState.isEditing;
    if (editingState.isEditing) {
        startEditing(state);
    } else {
        stopEditing(state);
    }
}
export function refreshEditor(state: GameState) {
    if (editingState.isEditing) {
        stopEditing(state);
        startEditing(state);
    }
}
function startEditing(state: GameState) {
    editingState.needsRefresh = false;
    if (!editingState.brush) {
        editingState.brush = {'none': {w: 1,h: 1,tiles: [[0]]}};
    }
    if (!editingState.selectedObject) {
        editingState.selectedObject = createObjectDefinition(state,
            {type: combinedObjectTypes[0]} as Partial<ObjectDefinition> & { type: ObjectType }
        );
    }
    displayTileEditorPropertyPanel();
    state.areaInstance.tilesDrawn = [];
    state.areaInstance.checkToRedrawTiles = true;
    // This was a drag+drop experiment for dialogue editing, but I'm not adding this to
    // the editor for now, it works better to just edit directly in the code for now.
    /*const div = document.createElement('div');
    div.innerHTML = 'DIALOGUE'
    const dragContainer = document.createElement('div');
    for (let i = 0; i < 5; i++) {
        const dragElement = document.createElement('div');
        dragElement.style.border = '1px solid #888';
        dragElement.style.padding = '2px';
        dragElement.style.marginBottom = '2px';
        dragElement.style.display = 'flex';
        const dragHandle = document.createElement('div');
        dragHandle.style.minHeight = '20px';
        dragHandle.style.width = '5px';
        dragHandle.style.borderLeft = '5px double #666';
        dragHandle.style.cursor = 'move';
        const dragContent = document.createElement('div');
        dragContent.style.flexGrow = '1';
        dragContent.innerHTML = `Element ${i}`;
        dragElement.appendChild(dragHandle);
        dragElement.appendChild(dragContent);
        dragContainer.appendChild(dragElement);
        let dragHelper: HTMLElement;
        let mouseOffset: number[];
        function onDrag(event: MouseEvent) {
            const [x, y] = getMousePosition();
            dragHelper.style.left = `${x - mouseOffset[0]}px`;
            dragHelper.style.top = `${y - mouseOffset[1]}px`;
            let after = false;
            for (const otherElement of dragContainer.children) {
                if (otherElement === dragElement) {
                    after = true;
                    continue;
                }
                if (isMouseOverElement(otherElement as HTMLElement)) {
                    after
                        ? otherElement.after(dragElement)
                        : otherElement.before(dragElement);
                    break;
                }
            }
        }
        function stopDrag(event: MouseEvent) {
            dragHandle.onmousemove = null;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
            dragHelper.remove();
            dragHelper = null;
            dragElement.style.opacity = '1';
        }
        dragHandle.onmousedown = (event: MouseEvent) => {
            event.preventDefault();
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            mouseOffset = getMousePosition(dragElement);
            dragHelper = dragElement.cloneNode(true) as HTMLElement;
            dragHelper.style.position = 'absolute';
            dragHelper.style.width = `${dragElement.clientWidth}px`;
            onDrag(event);
            document.body.append(dragHelper);
            dragElement.style.opacity = '0.5';
        }
    }
    div.appendChild(dragContainer);
    displayLeftPanel(div);*/
}

function stopEditing(state: GameState) {
    hideAllPropertyPanels();
    if (editingState.selectedLayerKey) {
        delete editingState.selectedLayerKey;
        enterLocation(state, state.location);
    }
    state.areaInstance.tilesDrawn = [];
    state.areaInstance.checkToRedrawTiles = true;
}
