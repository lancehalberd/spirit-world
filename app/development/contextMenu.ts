import {createAreaInstance} from 'app/content/areas';
import {setSpawnLocation} from 'app/content/spawnLocations';
import {getMapOptions} from 'app/development/contextMenu/map';
import {getTestStateContextMenuOption} from 'app/development/contextMenu/setState';
import {contextMenuState, editingState} from 'app/development/editingState';
import {toggleEditing} from 'app/development/editor';
import {tagElement} from 'app/dom';
import {getCanvasScale} from 'app/development/getCanvasScale';
import {overworldKeys} from 'app/gameConstants';
import {checkToRedrawTiles, drawEntireFrame} from 'app/render/renderField';
import {getState} from 'app/state';
import {KEY, isKeyboardKeyDown} from 'app/userInput';
import {defeatAllEnemies} from 'app/utils/addKeyboardShortcuts';
import {createCanvasAndContext, mainCanvas} from 'app/utils/canvas';
import {getCompositeBehaviors} from 'app/utils/getBehaviors';
import {getElementRectangle, isPointInShortRect} from 'app/utils/index';
import {getMousePosition} from 'app/utils/mouse';
import {getObjectAndParts} from 'app/utils/objects';
import {setSaveSlot} from 'app/utils/saveGame';
import {saveSettings} from 'app/utils/saveSettings';
import {toggleAllSounds, updateSoundSettings} from 'app/utils/soundSettings';


export class ContextMenu {
    container: HTMLElement;
    domElement: HTMLElement;
    menuOptions: MenuOption[];
    displayedChildMenu: ContextMenu;
    hoveredOptionElement: HTMLElement;

    constructor(menuOptions: MenuOption[]) {
        this.menuOptions = menuOptions;
    }

    /**
        <div class="contextMenu">
            <div class="contextOption">
                Option 1
            </div>
            <div class="contextOption">
                Option 2
            </div>
        </div>
    */
    render(container: HTMLElement, x: number, y: number): void {
        //this.domElement = createContextMenuElement(this.menuOptions);
        this.container = container;
        this.domElement = tagElement('div', 'contextMenu');
        for (const option of this.menuOptions) {
            const label = option.getLabel ? option.getLabel() : (option.label || ' ');
            const optionElement = tagElement('div', 'contextOption', label);
            if (option.onSelect) {
                optionElement.onclick = function () {
                    option.onSelect();
                    hideContextMenu();
                }
            }
            optionElement.addEventListener('mouseover', event => {
                // Do nothing if this is the last element we hovered over.
                if (this.hoveredOptionElement === optionElement) {
                    return;
                }
                if (this.hoveredOptionElement) {
                    this.hoveredOptionElement.classList.remove('open');
                }
                this.hoveredOptionElement = optionElement;
                // If another child menu is being displayed, remove it when we hover
                // over a new element at this level.
                if (this.displayedChildMenu) {
                    this.displayedChildMenu.remove();
                }
                const children = option.getChildren ? option.getChildren() : [];
                if (children.length) {
                    this.hoveredOptionElement.classList.add('open');
                    this.displayedChildMenu = new ContextMenu(children);
                    const limits = getElementRectangle(mainCanvas, this.container);
                    const r = getElementRectangle(optionElement, this.container);
                    this.displayedChildMenu.render(this.container, r.x + r.w, r.y);
                    const r2 = getElementRectangle(this.displayedChildMenu.domElement, this.container);
                    // If the menu is too low, move it up.
                    const bottom = limits.y + limits.h;
                    if (r2.y + r2.h > bottom) {
                        this.displayedChildMenu.domElement.style.top = `${bottom - r2.h}px`;
                    }
                    // If the menu is too far to the right, display it entirely to the left
                    // of the parent element.
                    if (r2.x + r2.w > limits.x + limits.w) {
                        this.displayedChildMenu.domElement.style.left = `${r.x - r2.w}px`;
                    }
                }
            });
            this.domElement.append(optionElement);
        }

        this.container.append(this.domElement);
        this.domElement.style.left = `${x}px`;
        this.domElement.style.top = `${y}px`;
    }

    remove(): void {
        if (this.domElement) {
            this.domElement.remove();
            this.domElement = null;
            if (this.displayedChildMenu) {
                this.displayedChildMenu.remove();
            }
        }
    }
}

export function getContextMenu(): MenuOption[] {
    const state = getState()
    // Special context menu for editing map sections when the map is shown with the editor enabled.
    if (state.paused && state.showMap && editingState.isEditing && !overworldKeys.includes(state.location.zoneKey)) {
        const selectedSections = overworldKeys.includes(state.areaSection?.mapId)
            ? [state.areaSection.index] : editingState.selectedSections;
        if (selectedSections.length) {
            return getMapOptions(state, selectedSections);
        }
    }
    const options = [
        getAssistanceMenuOption(),
        getSettingsMenuOption(),
        getTestStateContextMenuOption(),
        ...getSaveOptions(state),
        {
            label: editingState.isEditing ? 'Stop Map Editor' : 'Start Map Editor',
            onSelect() {
                toggleEditing(getState());
            }
        },
    ];
    if (editingState.isEditing) {
        options.push({
            label: 'Log Tile Behaviors',
            onSelect() {
                const state = getState();
                const sx = Math.floor((state.camera.x + lastContextClick[0]) / 16);
                const sy = Math.floor((state.camera.y + lastContextClick[1]) / 16);
                console.log(state.areaInstance.behaviorGrid?.[sy]?.[sx]);
            }
        });
        options.push({
            label: 'Log Pixel Behavior',
            onSelect() {
                const state = getState();
                const point = {
                    x: state.camera.x + lastContextClick[0],
                    y: state.camera.y + lastContextClick[1],
                };
                console.log(point);
                console.log(getCompositeBehaviors(state, state.areaInstance, point, state.nextAreaInstance));
            }
        });
        options.push({
            label: 'Log Tiles',
            onSelect() {
                const state = getState();
                const tx = Math.floor((state.camera.x + lastContextClick[0]) / 16);
                const ty = Math.floor((state.camera.y + lastContextClick[1]) / 16);
                console.log(tx, ty);
                for (const layer of state.areaInstance.layers) {
                    console.log(layer.key, layer.tiles[ty][tx]);
                    if (layer.maskTiles?.[ty]?.[tx]) {
                        console.log(layer.key + '-mask', layer.maskTiles[ty]?.[tx]);
                    }
                }
            }
        });
        options.push({
            label: 'Log Object',
            onSelect() {
                const state = getState();
                const x = (state.camera.x + lastContextClick[0]);
                const y = (state.camera.y + lastContextClick[1]);
                for (const object of state.areaInstance.objects) {
                    if (isPointInShortRect(x, y, object.getHitbox())) {
                        console.log(object);
                    }
                }
            }
        });
        options.push({
            label: 'Get Floor Image',
            onSelect() {
                renderCurrentFloor(state);
            }
        });
    }

    return options;
}


function getSaveOptions(state: GameState): MenuOption[] {
    const options:MenuOption[] = [
        {
            label: 'Save To...',
            getChildren() {
                return [0, 1, 2].map(index => {
                    return {
                        // Indicate what the current save slot is.
                        label: `Slot ${index + 1}` + (index === state.savedGameIndex ? ' (Current)' : ''),
                        onSelect() {
                            setSaveSlot(getState(), index);
                        }
                    }
                });
            }


        },
    ];
    // This option is only valid when using an actual save slot, otherwise it will be ignored.
    if (state.savedGameIndex >= 0) {
        options.push({
            label: 'Save Location',
            onSelect() {
                const state = getState();
                setSpawnLocation(state, {...state.location, d: state.hero.d});
            }
        });
    }
    return options;
}

function getAssistanceMenuOption(): MenuOption {
    return {
        getLabel() {
            return 'Assistance...';
        },
        getChildren() {
            return [
                {
                    label: 'Full Life',
                    onSelect() {
                        const state = getState();
                        state.hero.life = state.hero.savedData.maxLife;
                    }
                },
                {
                    label: 'More Life',
                    onSelect() {
                        const state = getState();
                        state.hero.savedData.maxLife++;
                        state.hero.life = state.hero.savedData.maxLife;
                    }
                },
                {
                    label: 'Low Life',
                    onSelect() {
                        const state = getState();
                        state.hero.life = 0.25;
                        state.hero.savedData.ironSkinLife = 0;
                    }
                },
                {
                    label: '200 Jade',
                    onSelect() {
                        const state = getState();
                        state.hero.savedData.money += 200;
                    }
                },
                {
                    label: 'Defeat Monsters',
                    onSelect() {
                        defeatAllEnemies();
                    }
                },
            ];
        }
    }
}

function getSettingsMenuOption(): MenuOption {
    const state = getState();
    const isMusicMuted = (state.settings.muteAllSounds || state.settings.muteMusic);
    const areSoundsMuted = (state.settings.muteAllSounds || state.settings.muteSounds);
    return {
        getLabel() {
            return 'Settings...';
        },
        getChildren() {
            return [
                {
                    label: state.settings.muteAllSounds ? 'Unmute All' : 'Mute All',
                    onSelect() {
                        toggleAllSounds(state);
                    }
                },
                {
                    label: isMusicMuted ? 'Unmute Music' : 'Mute Music',
                    onSelect() {
                        if (isMusicMuted) {
                            state.settings.muteAllSounds = false;
                            state.settings.muteMusic = false;
                            state.settings.muteSounds = areSoundsMuted;
                        } else {
                            state.settings.muteMusic = true;
                        }
                        updateSoundSettings(state);
                        saveSettings(state);
                    }
                },
                {
                    label: areSoundsMuted ? 'Unmute Sounds' : 'Mute Sounds',
                    onSelect() {
                        if (areSoundsMuted) {
                            state.settings.muteAllSounds = false;
                            state.settings.muteSounds = false;
                            state.settings.muteMusic = isMusicMuted;
                        } else {
                            state.settings.muteSounds = true;
                        }
                        updateSoundSettings(state);
                        saveSettings(state);
                    }
                },
            ];
        }
    }
}

export function showContextMenu(this: void, menu: MenuOption[], x: number, y: number): void {
    hideContextMenu();
    const container = document.body;
    contextMenuState.contextMenu = new ContextMenu(menu);
    contextMenuState.contextMenu.render(container, x, y);
    const limits = getElementRectangle(mainCanvas, container);
    const r = getElementRectangle(contextMenuState.contextMenu.domElement, container);
    const bottom = limits.y + limits.h;
    const right = limits.x + limits.w;
    if (r.y + r.h > bottom) {
        contextMenuState.contextMenu.domElement.style.top = `${bottom - r.h}px`;
    }
    // If the menu is too far to the right, display it entirely to the left
    // of the parent element.
    if (r.x + r.w > right) {
        contextMenuState.contextMenu.domElement.style.left = `${right - r.w}px`;
    }
}

export function hideContextMenu(): void {
    if (contextMenuState.contextMenu) {
        contextMenuState.contextMenu.remove();
        contextMenuState.contextMenu = null;
    }
}

let lastContextClick: number[];

export function addContextMenuListeners(): void {
    document.addEventListener('mouseup', function (event) {
        if (event.which !== 1) {
            return;
        }
        if (!(event.target as HTMLElement).closest('.contextMenu')) {
            hideContextMenu();
        }
    });

    mainCanvas.addEventListener('contextmenu', function (event) {
        if (isKeyboardKeyDown(KEY.SHIFT)) {
            return;
        }
        event.preventDefault();
        const [x, y] = getMousePosition();
        lastContextClick = getMousePosition(mainCanvas, getCanvasScale());
        const menu = getContextMenu();
        showContextMenu(menu, x, y);
    });
}

class _ContextMenu extends ContextMenu {}
declare global {
    export interface ContextMenu extends _ContextMenu {}
}


const drawPriorities: DrawPriority[] = ['background', 'sprites', 'foreground'];
function renderCurrentFloor(state: GameState): void {
    const isEditing = editingState.isEditing;
    // Temporarily disable editing to turn off special rendering for editing.
    editingState.isEditing = false;
    const areaSize = state.zone.areaSize ?? {w: 32, h: 32};
    const floor = state.zone.floors[state.location.floor];
    const grid = state.location.isSpiritWorld ? floor.spiritGrid : floor.grid;
    const [canvas, context] = createCanvasAndContext(16 * areaSize.w * grid[0].length, 16 * areaSize.h * grid.length);

    const areas: AreaInstance[] = [];
    for (let row = 0; row < grid.length; row++) {
        for (let column = 0; column < grid[row].length; column++) {
            const areaInstance = createAreaInstance(state, {
                ...state.location,
                areaGridCoords: {x: column, y: row},
            });
            checkToRedrawTiles(areaInstance);
            drawEntireFrame(state, areaInstance, 0);
            areas.push(areaInstance);
        }
    }
    for (const drawPriority of drawPriorities) {
        for (const area of areas) {
            renderMapLayer(context, state, area,
                {
                    x: area.location.areaGridCoords.x * 16 * areaSize.w, w: 16 * areaSize.w,
                    y: area.location.areaGridCoords.y * 16 * areaSize.h, h: 16 * areaSize.h
                },  {x: 0, y: 0, w: areaSize.w * 16, h: areaSize.h * 16}, drawPriority
            );
        }
    }
    window.debugCanvas(canvas, 0.5);

    editingState.isEditing = isEditing;
}
export function renderMapLayer(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, target: Rect, source: Rect, drawPriority: DrawPriority): void {
    if (drawPriority === 'background') {
        context.drawImage(area.backgroundFrames[0].canvas,
            source.x, source.y, source.w, source.h,
            target.x, target.y, target.w, target.h,
        );
    }
    if (drawPriority === 'foreground' && area.foregroundFrames[0]) {
        context.drawImage(area.foregroundFrames[0].canvas,
            source.x, source.y, source.w, source.h,
            target.x, target.y, target.w, target.h,
        );
    }
    renderMapObjects(context, state, area, target, source, drawPriority);
}

export function renderMapObjects(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, target: Rect, source: Rect, drawPriority: DrawPriority) {
    // Draw additional objects that we want to show on the map.
    context.save();
        context.translate(target.x, target.y);
        for (const object of area.objects) {
            context.save();
                context.translate(-source.x, -source.y);
                const objectAndParts = getObjectAndParts(state, object)
                for(const part of objectAndParts) {
                    if (drawPriority === 'background') {
                        part.renderShadow?.(context, state);
                    }
                    if ((part.getDrawPriority?.(state) || part.drawPriority) === drawPriority) {
                        part.render(context, state);
                    }
                    if (drawPriority === 'foreground') {
                        part.renderForeground?.(context, state);
                    }
                }
            context.restore();
        }
    context.restore();
}
