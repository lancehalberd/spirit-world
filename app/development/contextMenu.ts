import { getSpawnLocationContextMenuOption, getTestStateContextMenuOption } from 'app/development/contextMenu/setState';
import { editingState } from 'app/development/editingState';
import { toggleEditing } from 'app/development/editor';
import { tagElement } from 'app/dom';
import { KEY, isKeyboardKeyDown } from 'app/userInput';
import { showMessage } from 'app/scriptEvents';
import { getState } from 'app/state';
import { mainCanvas } from 'app/utils/canvas';
import { defeatAllEnemies } from 'app/utils/addKeyboardShortcuts';
import { getElementRectangle } from 'app/utils/index';
import { getMousePosition } from 'app/utils/mouse';
import { updateSoundSettings } from 'app/utils/sounds';

import { MenuOption } from 'app/types';

interface ContextMenuState {
    contextMenu: ContextMenu,
}
const contextMenuState: ContextMenuState = {
    contextMenu: null,
}

class ContextMenu {
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
    return [
        getSpawnLocationContextMenuOption(),
        getAssistanceMenuOption(),
        getSettingsMenuOption(),
        getTestStateContextMenuOption(),
        {
            label: editingState.isEditing ? 'Stop Map Editor' : 'Start Map Editor',
            onSelect() {
                toggleEditing(getState());
            }
        },
    ];
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
        const menu = getContextMenu();
        showContextMenu(menu, x, y);
    });
}
