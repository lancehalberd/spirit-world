import { allSections, dungeonMaps } from 'app/content/sections';
import { setSpawnLocation } from 'app/content/spawnLocations';
import { zones } from 'app/content/zones/zoneHash';
import { getSpawnLocationContextMenuOption, getTestStateContextMenuOption } from 'app/development/contextMenu/setState';
import { contextMenuState, editingState } from 'app/development/editingState';
import { toggleEditing } from 'app/development/editor';
import { tagElement } from 'app/dom';
import { CANVAS_SCALE } from 'app/gameConstants';
import { KEY, isKeyboardKeyDown } from 'app/userInput';
import { showMessage } from 'app/scriptEvents';
import { getState } from 'app/state';
import { mainCanvas } from 'app/utils/canvas';
import { defeatAllEnemies } from 'app/utils/addKeyboardShortcuts';
import { getElementRectangle } from 'app/utils/index';
import { getMousePosition } from 'app/utils/mouse';
import { updateSoundSettings } from 'app/utils/sounds';

import { AreaSection, GameState, MenuOption } from 'app/types';


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
    if (state.paused && state.showMap && editingState.isEditing && editingState.selectedSections.length) {
        const areAllSectionsHidden = editingState.selectedSections.every(index => allSections[index].section.hideMap);
        let mapIds = Object.keys(dungeonMaps);
        if (!['overworld', 'sky', 'underwater'].includes(state.areaSection.definition.mapId)) {
            mapIds = [state.areaSection.definition.mapId, ...mapIds.filter(mapId => mapId !== state.areaSection.definition.mapId)];
        }
        return [
            {
                label: 'setMapId',
                getChildren() {
                    return [
                        ...['overworld', 'sky', 'underwater'].map( zoneId => {
                            const entranceIds = [];
                            const zone = zones[zoneId];
                            for (let floor = 0; floor < zone.floors.length; floor++) {
                                for( const areaGrid of [zone.floors[floor].spiritGrid, zone.floors[floor].grid]){
                                    for (let y = 0; y < areaGrid.length; y++) {
                                        for (let x = 0; x < areaGrid[y].length; x++) {
                                            const area = areaGrid[y][x];
                                            for (const object of (area?.objects || [])) {
                                                if (object.type === 'door' || object.type === 'teleporter' || object.type === 'pitEntrance') {
                                                    entranceIds.push(object.id);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            return {
                                label: zoneId,
                                getChildren() {
                                    return [
                                        ...entranceIds.map( entranceId => {
                                            return {
                                                label: entranceId,
                                                onSelect() {
                                                    updateMapSections(state, editingState.selectedSections, {mapId: zoneId, entranceId});
                                                }
                                            };
                                        })
                                    ];
                                }
                            };
                        }),
                        {
                            label: '+New',
                            onSelect() {
                                const mapId = window.prompt('Enter the new map id');
                                if (!mapId) {
                                    return;
                                }
                                updateMapSections(state, editingState.selectedSections, {mapId, floorId: '1F'});
                            }
                        },
                        ...mapIds.map(mapId => {
                            return {
                                label: mapId,
                                getChildren() {
                                    return [
                                        ...Object.keys(dungeonMaps[mapId].floors).map( floorId => {
                                            return {
                                                label: floorId,
                                                onSelect() {
                                                    updateMapSections(state, editingState.selectedSections, {mapId, floorId});
                                                }
                                            };
                                        }),
                                        {
                                            label: '+New',
                                            onSelect() {
                                                const floorId = window.prompt('Enter the new floor id');
                                                if (!floorId) {
                                                    return;
                                                }
                                                updateMapSections(state, editingState.selectedSections, {mapId, floorId});
                                            }
                                        },
                                    ];
                                },
                            }
                        }),
                    ];
                }
            },
            {
                label: areAllSectionsHidden ? 'Show' : 'Hide',
                onSelect() {
                    for (const sectionIndex of editingState.selectedSections) {
                        if (areAllSectionsHidden) {
                            delete allSections[sectionIndex].section.hideMap;
                        } else {
                            allSections[sectionIndex].section.hideMap = true;
                        }
                    }
                    state.map.needsRefresh = true;
                }
            }
        ];
    }
    const options = [
        getSpawnLocationContextMenuOption(),
        getAssistanceMenuOption(),
        getSettingsMenuOption(),
        getTestStateContextMenuOption(),
        {
            label: 'Save Location',
            onSelect() {
                const state = getState();
                setSpawnLocation(state, state.location);
            }
        },
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
    }

    return options;
}

function updateMapSections(state: GameState, sections: number[], data: Partial<AreaSection>): void {
    for (const sectionIndex of sections) {
        const section = allSections[sectionIndex].section;
        const index = dungeonMaps[section.mapId]?.floors[section.floorId]?.sections?.indexOf(sectionIndex);
        const oldMapId = section.mapId, oldFloorId = section.floorId;
        if (index >= 0) {
            dungeonMaps[section.mapId].floors[section.floorId].sections.splice(index, 1);
        }
        section.mapId = data.mapId;
        section.floorId = data.floorId;
        section.entranceId = data.entranceId;
        // Add the section to the new map, if it is a dungeon map (as opposed to an overworld map).
        if (!data.entranceId) {
            dungeonMaps[section.mapId] = dungeonMaps[section.mapId] || {floors: {}};
            dungeonMaps[section.mapId].floors[section.floorId] = dungeonMaps[section.mapId]?.floors[section.floorId] || {sections: []};
            dungeonMaps[section.mapId].floors[section.floorId].sections.push(sectionIndex);
            if (dungeonMaps[oldMapId]?.floors[oldFloorId]?.sections.length === 0) {
                delete dungeonMaps[oldMapId]?.floors[oldFloorId];
            }
        }
    }
    state.map.needsRefresh = true;
    editingState.selectedSections = [];
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
                        state.hero.life = state.hero.maxLife;
                    }
                },
                {
                    label: 'More Life',
                    onSelect() {
                        const state = getState();
                        state.hero.maxLife++;
                        state.hero.life = state.hero.maxLife;
                    }
                },
                {
                    label: 'Low Life',
                    onSelect() {
                        const state = getState();
                        state.hero.life = 0.25;
                        state.hero.ironSkinLife = 0;
                    }
                },
                {
                    label: '200 Jade',
                    onSelect() {
                        const state = getState();
                        state.hero.money += 200;
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
                        state.settings.muteAllSounds = !state.settings.muteAllSounds;
                        state.settings.muteMusic = false;
                        state.settings.muteSounds = false;
                        updateSoundSettings(state);
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
                    }
                },
                {
                    label: 'Show Controls',
                    onSelect() {
                        showMessage(state, `
                            [B_DPAD] Movement
                            [-] [B_PASSIVE] Interact
                            [-] [B_WEAPON] Weapon
                            [-] [B_TOOL] Tools
                            [-] [B_ROLL] Roll
                            [-] [B_MEDITATE] Meditate
                            [-] [B_MENU] Menu
                            [-] [B_MAP] Map
                            [-] [B_PREVIOUS_ELEMENT] Prev Element
                            [-] [B_NEXT_ELEMENT] Next Element
                        `);
                    }
                },
                {
                    label: state.renderMagicCooldown ? 'Hide Cooldown Bar' : 'Show Cooldown Bar',
                    onSelect() {
                        state.renderMagicCooldown = !state.renderMagicCooldown;
                    }
                }
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
        lastContextClick = getMousePosition(mainCanvas, CANVAS_SCALE);
        const menu = getContextMenu();
        showContextMenu(menu, x, y);
    });
}
