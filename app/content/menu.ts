import {showHint} from 'app/content/hints';
import {getLootFrame, getLootHelpMessage, getLootName, lootFrames, neutralElement} from 'app/content/loot';
import {isRandomizer} from 'app/gameConstants';
import {showMapScene} from 'app/scenes/map/showMapScene';
import {showMessage} from 'app/scriptEvents';
import {createAnimation, drawFrameCenteredAt} from 'app/utils/animations';
import {fillRect, pad} from 'app/utils/index';
import {isActiveTool, isEquipment, isMagicElement, isPassiveTool} from 'app/utils/loot';
import {setEquippedBoots, setEquippedElement, setLeftTool, setRightTool} from 'app/utils/menu';
import {characterMap} from 'app/utils/simpleWhiteFont';
import {drawARFont} from 'app/arGames/arFont';
import {requireFrame} from 'app/utils/packedImages';



export const frameSize = 24;
export const elementGeometry: Rect = {
    x: 0, y: 0,
    w: frameSize, h: frameSize,
};

const emptyMenuElement: MenuElement = {
    ...elementGeometry,
    getLabel: () => '',
    isVisible: () => false,
    render() {

    },
    onSelect() {
        return false;
    },
};

export const [optionFrame, speakerFrame, speakerSoundFrame] = createAnimation('gfx/hud/options.png', {w: 24, h: 24}).frames;
export const yellowFrame = createAnimation('gfx/hud/toprighttemp1.png', {w: 24, h: 24}).frames[0];
export const blueFrame = createAnimation('gfx/hud/toprighttemp2.png', {w: 24, h: 24}).frames[0];
export const cursorFrame = createAnimation('gfx/hud/cursortemp.png', {w: 24, h: 24}).frames[0];
export const mapFrame = lootFrames.map;
export const [keyFrame, bigKeyFrame] = createAnimation('gfx/hud/icons.png',
    {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}}, {x: 2, cols: 2}
).frames;

const [/*small peach*/, /* full peach */, threeQuartersPeach, halfPeach, quarterPeach] =
    createAnimation('gfx/hud/peaches.png', {w: 18, h: 18}, {cols: 3, rows: 2}).frames;
const fullPeachFrame = requireFrame('gfx/hud/peaches.png', {x: 54, y: 0, w: 20, h: 20});
export const peachMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: (state: GameState) => 'Peach Pieces',
    isVisible: (state: GameState) => state.hero.savedData.collectibleTotals.peachOfImmortalityPiece > 0,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, fullPeachFrame, this);
        if (state.hero.savedData.collectibles.peachOfImmortalityPiece === 3) {
            drawFrameCenteredAt(context, threeQuartersPeach, this);
        } else if (state.hero.savedData.collectibles.peachOfImmortalityPiece === 2) {
            drawFrameCenteredAt(context, halfPeach, this);
        } else if (state.hero.savedData.collectibles.peachOfImmortalityPiece === 1) {
            drawFrameCenteredAt(context, quarterPeach, this);
        }
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, 'Collect 4 Peach Pieces to increase your life total.');
        return true;
    },
    onUpgrade(state: GameState, toolIndex?: number) {
        state.hero.savedData.collectibles.peachOfImmortalityPiece++;
        if (state.hero.savedData.collectibles.peachOfImmortalityPiece >= 4) {
            state.hero.savedData.collectibles.peachOfImmortalityPiece = 0;
            state.hero.savedData.maxLife++;
        }
        return true;
    },
};

const neutralElementMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Neutral',
    isVisible: (state: GameState) => !!(
        state.hero.savedData.elements.fire ||
        state.hero.savedData.elements.ice ||
        state.hero.savedData.elements.lightning
    ),
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, neutralElement, this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        setEquippedElement(state, null);
        return false;
    },
};

export const nimbusCloudMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: (state: GameState) => getLootName(state, {lootType: 'nimbusCloud'}),
    isVisible: (state: GameState) => !!(state.hero.savedData.passiveTools.nimbusCloud),
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'nimbusCloud'}), this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, '{@nimbusCloud.chooseDestination}');
        return true;
    },
    onUpgrade(state: GameState) {
        state.hero.savedData.passiveTools.nimbusCloud = (state.hero.savedData.passiveTools.nimbusCloud + 1) % 2;
    }
};

export const arDeviceMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: (state: GameState) => getLootName(state, {lootType: 'arDevice'}),
    isVisible: (state: GameState) => !!(state.hero.savedData.passiveTools.arDevice),
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'arDevice', lootLevel: state.hero.savedData.passiveTools.arDevice}), this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        // TODO
        return true;
    },
    onUpgrade(state: GameState) {
        state.hero.savedData.passiveTools.arDevice = (state.hero.savedData.passiveTools.arDevice + 1) % 4;
    }
};

const chakramMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Chakram',
    isVisible: (state: GameState) => !!(state.hero.savedData.weapon & 1),
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'weapon', lootLevel: 1}), this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, getLootHelpMessage(state, {lootType: 'weapon', lootLevel: 1}));
        return true;
    },
    onUpgrade(state: GameState) {
        if ((state.hero.savedData.weapon & 1) === 0) {
            state.hero.savedData.weapon += 1;
        } else if (!state.hero.savedData.weaponUpgrades.normalDamage) {
            state.hero.savedData.weaponUpgrades.normalDamage = true;
        } else if (!state.hero.savedData.weaponUpgrades.normalRange) {
            state.hero.savedData.weaponUpgrades.normalRange = true;
        } else {
            state.hero.savedData.weapon -= 1;
            state.hero.savedData.weaponUpgrades.normalDamage = false;
            state.hero.savedData.weaponUpgrades.normalRange = false;
        }
    },
};

const goldChakramMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Gold Chakram',
    isVisible: (state: GameState) => !!(state.hero.savedData.weapon & 2),
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'weapon', lootLevel: 2}), this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, getLootHelpMessage(state, {lootType: 'weapon', lootLevel: 2}));
        return true;
    },
    onUpgrade(state: GameState) {
        if ((state.hero.savedData.weapon & 2) === 0) {
            state.hero.savedData.weapon += 2;
        } else if (!state.hero.savedData.weaponUpgrades.spiritDamage) {
            state.hero.savedData.weaponUpgrades.spiritDamage = true;
        } else if (!state.hero.savedData.weaponUpgrades.spiritRange) {
            state.hero.savedData.weaponUpgrades.spiritRange = true;
        } else {
            state.hero.savedData.weapon -= 2;
            state.hero.savedData.weaponUpgrades.spiritDamage = false;
            state.hero.savedData.weaponUpgrades.spiritRange = false;
        }
    },
};

const returnMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Return',
    isVisible: (state: GameState) => isRandomizer,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'nimbusCloud'}), this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, '{@nimbusCloud.returnMenu}');
        return true;
    },
};

const helpMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Hint',
    isVisible: () => true,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, characterMap['?'], this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        showHint(state);
        return true;
    },
};

const mapMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Map',
    isVisible: () => true,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, mapFrame, this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        state.sceneStack[state.sceneStack.length - 1].closeScene?.(state);
        showMapScene(state);
        return false;
    },
};

const optionMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Options',
    isVisible: () => true,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, optionFrame, this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        // TODO:
        // add options scene to scene stack.
        return false;
    },
};


const armorMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: (state: GameState) => {
        // The silver mail schematics are displayed in isolation until you have armor.
        if (!state.hero.savedData.passiveTools.armor) {
            return getLootName(state, {lootType: 'silverMailSchematics'});
        }
        return getLootName(state, {lootType:'armor'});
    },
    // All armors are blocked behind the silver mail schematics.
    isVisible: (state: GameState) => !!state.hero.savedData.blueprints.silverMailSchematics,
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (!state.hero.savedData.blueprints.silverMailSchematics) {
            // This will only render during debug mode, displaying as the placeholder.
            return drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'silverMailSchematics'}), this);
        }
        if (state.hero.savedData.passiveTools.armor >= 2) {
            return drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'armor', lootLevel: 2}), this);
        }
        if (state.hero.savedData.blueprints.goldMailSchematics) {
            // Offset these schematics so you can see them behind the silver mail
            drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'goldMailSchematics'}),
                {x: this.x + 3, y: this.y - 2, w: this.w, h: this.h}
            );
        }
        if (state.hero.savedData.passiveTools.armor >= 1) {
            return drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'armor'}), this);
        }
        return drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'silverMailSchematics'}), this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        if (!state.hero.savedData.passiveTools.armor) {
            showMessage(state, getLootHelpMessage(state, {lootType: 'silverMailSchematics'}));
            return true;
        }
        showMessage(state, getLootHelpMessage(state, {lootType: 'armor'}));
        return true;
    },
    onUpgrade(state: GameState) {
        if (!state.hero.savedData.blueprints.silverMailSchematics) {
            state.hero.savedData.blueprints.silverMailSchematics = 1;
        } else if (state.hero.savedData.passiveTools.armor < 1) {
            state.hero.savedData.passiveTools.armor = 1;
        } else if (!state.hero.savedData.blueprints.goldMailSchematics) {
            state.hero.savedData.blueprints.goldMailSchematics = 1;
        } else if (state.hero.savedData.passiveTools.armor < 2) {
            state.hero.savedData.passiveTools.armor = 3;
        } else{
            state.hero.savedData.blueprints.silverMailSchematics = 0;
            state.hero.savedData.blueprints.goldMailSchematics = 0;
            state.hero.savedData.passiveTools.armor = 0;
        }
    },
};

const crownMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: (state: GameState) => {
        if (state.hero.savedData.passiveTools.phoenixCrown) {
            return getLootName(state, {lootType: 'phoenixCrown'});
        }
        return getLootName(state, {lootType: 'astralProjection'});
    },
    isVisible: (state: GameState) => !!state.hero.savedData.passiveTools.astralProjection || !!state.hero.savedData.passiveTools.phoenixCrown,
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (state.hero.savedData.passiveTools.phoenixCrown) {
            return drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'phoenixCrown'}), this);
        }
        return drawFrameCenteredAt(context, getLootFrame(state, {lootType: 'astralProjection'}), this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        if (state.hero.savedData.passiveTools.phoenixCrown) {
            showMessage(state, getLootHelpMessage(state, {lootType: 'phoenixCrown'}));
            return true;
        }
        showMessage(state, getLootHelpMessage(state, {lootType: 'astralProjection'}));
        return true;
    },
    onUpgrade(state: GameState) {
        if (!state.hero.savedData.passiveTools.astralProjection) {
            state.hero.savedData.passiveTools.astralProjection = 1;
        } else if (!state.hero.savedData.passiveTools.phoenixCrown) {
            state.hero.savedData.passiveTools.phoenixCrown = 1;
        } else {
            state.hero.savedData.passiveTools.astralProjection = 0;
            state.hero.savedData.passiveTools.phoenixCrown = 0;
        }
    },
};

function getPassiveToolElement(state: GameState, passiveTool: PassiveTool, maxLevel: number = 2) {
    return {
        ...elementGeometry,
        getLabel: () => getLootName(state, {lootType: passiveTool}),
        isVisible: (state: GameState) => state.hero.savedData.passiveTools[passiveTool] > 0,
        render(context: CanvasRenderingContext2D, state: GameState) {
            drawFrameCenteredAt(context, getLootFrame(state, {lootType: passiveTool}), this);
        },
        onSelect(state: GameState, toolIndex?: number) {
            showMessage(state, getLootHelpMessage(state, {lootType: passiveTool}));
            return true;
        },
        onUpgrade(state: GameState) {
            state.hero.savedData.passiveTools[passiveTool] = (state.hero.savedData.passiveTools[passiveTool] + 1) % (1 << maxLevel);
        }
    };
}

function getEquipmentElement(state: GameState, equipment: Equipment) {
    return {
        ...elementGeometry,
        getLabel: () => {
            // In randomizer, it is possible to obtain boots recipes without the boots, so update the label accordingly.
            if (equipment === 'cloudBoots' && !state.hero.savedData.equipment.cloudBoots) {
                return getLootName(state, {lootType: 'flyingBoots'});
            }
            if (equipment === 'ironBoots' && !state.hero.savedData.equipment.ironBoots) {
                return getLootName(state, {lootType: 'forgeBoots'});
            }
            return getLootName(state, {lootType: equipment});
        },
        isVisible: (state: GameState) => {
            if (equipment === 'leatherBoots') {
                return true;
            }
            if (equipment === 'cloudBoots') {
                return state.hero.savedData.equipment.cloudBoots > 0 || state.hero.savedData.blueprints.flyingBoots > 0;
            }
            if (equipment === 'ironBoots') {
                return state.hero.savedData.equipment.ironBoots > 0 || state.hero.savedData.blueprints.forgeBoots > 0;
            }
            return false;
        },
        renderSelection(context: CanvasRenderingContext2D, state: GameState) {
            fillRect(context, this, 'white');
            fillRect(context, pad(this, -2), 'black');
        },
        render(context: CanvasRenderingContext2D, state: GameState) {
            const level = state.hero.savedData.equipment[equipment];
            const scrollTarget = {x: this.x + 3, y: this.y - 2, w: this.w, h: this.h};
            const hideSpikeBootsRecipe = !state.hero.savedData.blueprints.spikeBoots || state.hero.savedData.equipment.leatherBoots > 1;
            if (equipment === 'leatherBoots' && !hideSpikeBootsRecipe) {
                drawFrameCenteredAt(context, lootFrames.spikeBoots, scrollTarget);
            }
            const hideFlyingBootsRecipe = !state.hero.savedData.blueprints.flyingBoots || state.hero.savedData.equipment.cloudBoots > 1;
            if (equipment === 'cloudBoots' && !hideFlyingBootsRecipe) {
                drawFrameCenteredAt(context, lootFrames.flyingBoots, scrollTarget);
            }
            const hideForgeBootsRecipe = !state.hero.savedData.blueprints.forgeBoots || state.hero.savedData.equipment.ironBoots > 1;
            if (equipment === 'ironBoots' && !hideForgeBootsRecipe) {
                drawFrameCenteredAt(context, lootFrames.forgeBoots, scrollTarget);
            }
            drawFrameCenteredAt(context, getLootFrame(state, {lootType: equipment, lootLevel: level}), this);
        },
        onSelect(state: GameState) {
            return setEquippedBoots(state, equipment);
        },
        onUpgrade(state: GameState) {
            if (equipment === 'leatherBoots') {
                if (!state.hero.savedData.blueprints.spikeBoots) {
                    state.hero.savedData.blueprints.spikeBoots = 1;
                } else if (state.hero.savedData.equipment.leatherBoots < 2) {
                    state.hero.savedData.equipment.leatherBoots = 2;
                } else {
                    state.hero.savedData.equipment.leatherBoots = 0;
                    state.hero.savedData.blueprints.spikeBoots = 0;
                }
            }
            if (equipment === 'cloudBoots') {
                if (!state.hero.savedData.equipment.cloudBoots) {
                    state.hero.savedData.equipment.cloudBoots = 1;
                } else if (!state.hero.savedData.blueprints.flyingBoots) {
                    state.hero.savedData.blueprints.flyingBoots = 1;
                } else if (state.hero.savedData.equipment.cloudBoots < 2) {
                    state.hero.savedData.equipment.cloudBoots = 2;
                } else {
                    state.hero.savedData.equipment.cloudBoots = 0;
                    state.hero.savedData.blueprints.flyingBoots = 0;
                }
            }
            if (equipment === 'ironBoots') {
                if (!state.hero.savedData.equipment.ironBoots) {
                    state.hero.savedData.equipment.ironBoots = 1;
                } else if (!state.hero.savedData.blueprints.forgeBoots) {
                    state.hero.savedData.blueprints.forgeBoots = 1;
                } else if (state.hero.savedData.equipment.ironBoots < 2) {
                    state.hero.savedData.equipment.ironBoots = 2;
                } else {
                    state.hero.savedData.equipment.ironBoots = 0;
                    state.hero.savedData.blueprints.forgeBoots = 0;
                }
            }
        }
    };
}

type ExtendedMenuOptionType = MenuOptionType | 'armor' | 'crown';
function getMenuElement(state: GameState, option: ExtendedMenuOptionType): MenuElement {
    switch (option) {
        case 'map': return dungeonMapMenuOption;
        case 'bigKey': return bigKeyMenuOption;
        case 'smallKey': return smallKeyMenuOption;
        case 'neutral': return neutralElementMenuOption;
        case 'weapon': return chakramMenuOption;
        case 'weapon2': return goldChakramMenuOption;
        case 'armor': return armorMenuOption;
        case 'crown': return crownMenuOption;
        case 'nimbusCloud': return nimbusCloudMenuOption;
    }
    if (isPassiveTool(option)) {
        return getPassiveToolElement(state, option);
    }
    if (isEquipment(option)) {
        return getEquipmentElement(state, option);
    }
    if (isMagicElement(option)) {
        return {
            ...elementGeometry,
            getLabel: () => getLootName(state, {lootType: option}),
            isVisible: (state: GameState) => !!state.hero.savedData.elements[option],
            isSelected: (state: GameState) => state.hero.savedData.element === option,
            render(context: CanvasRenderingContext2D, state: GameState) {
                const frame = getLootFrame(state, { lootType: option, lootLevel: state.hero.savedData.elements[option] || 1 });
                drawFrameCenteredAt(context, frame, this);
            },
            renderSelection(context: CanvasRenderingContext2D, state: GameState) {
                fillRect(context, this, 'white');
                fillRect(context, pad(this, -2), 'black');
            },
            onSelect(state: GameState, toolIndex?: number) {
                setEquippedElement(state, option);
                return true;
            },
            onUpgrade(state: GameState) {
                state.hero.savedData.elements[option] = state.hero.savedData.elements[option] ? 0 : 1;
            }
        };
    }
    if (isActiveTool(option)) {
        return {
            ...elementGeometry,
            getLabel: () => getLootName(state, {lootType: option}),
            isVisible: (state: GameState) => !!state.hero.savedData.activeTools[option],
            isSelected: (state: GameState) => state.hero.savedData.leftTool === option ||state.hero.savedData.rightTool === option,
            render(context: CanvasRenderingContext2D, state: GameState) {
                const frame = getLootFrame(state, { lootType: option, lootLevel: state.hero.savedData.activeTools[option] || 1 });
                drawFrameCenteredAt(context, frame, this);
            },
            renderSelection(context: CanvasRenderingContext2D, state: GameState) {
                if (state.hero.savedData.leftTool === option) {
                    drawFrameCenteredAt(context, blueFrame, this);
                }
                if (state.hero.savedData.rightTool === option) {
                    drawFrameCenteredAt(context, yellowFrame, this);
                }
            },
            onSelect(state: GameState, toolIndex?: number) {
                if (toolIndex === 1) {
                    if (state.hero.savedData.leftTool === option) {
                        setLeftTool(state, state.hero.savedData.rightTool);
                    }
                    setRightTool(state, option as ActiveTool);
                } else {
                    // Assign to left tool as default action.
                    // If a generic confirm key was pressed, cycle the current left tool
                    // over to the right tool slot.
                    if (toolIndex !== 0 && state.hero.savedData.leftTool !== option) {
                        setRightTool(state, state.hero.savedData.leftTool);
                    }
                    if (state.hero.savedData.rightTool === option) {
                        setRightTool(state, state.hero.savedData.leftTool);
                    }
                    setLeftTool(state, option as ActiveTool);
                }
                return false;
            },
            onUpgrade(state: GameState) {
                state.hero.savedData.activeTools[option] = ((state.hero.savedData.activeTools[option] || 0) + 1) % 4;
            }
        };
    }

    return {...emptyMenuElement};
}

export function createMenuPanel(id: string, options: MenuElement[], rows: number, columns: number, {x, y, w, h}: Rect): MenuPanel {
    return {
        id,
        x, y, w, h,
        rows,
        columns,
        options,
        optionsOffset: {
            x: ((w - columns * frameSize) / 2) | 0,
            y: ((h - rows * frameSize) / 2) | 0,
        },
    };
}

export function getSystemOptions(state: GameState): MenuElement[] {
    const systemOptions: MenuElement[] = [];
    if (isRandomizer) {
        systemOptions.push(returnMenuOption);
    }
    systemOptions.push(helpMenuOption);
    systemOptions.push(mapMenuOption);
    systemOptions.push(optionMenuOption);
    return systemOptions;
}


export function getEquipmentOptions(state: GameState): MenuElement[] {
    return (<const>[
        'weapon', 'weapon2',
        'armor', 'crown',
        'gloves', 'fireBlessing',
        'waterBlessing', 'lightningBlessing',
    ]).map(option => getMenuElement(state, option));
}

export function getElementOptions(state: GameState): MenuElement[] {
    return (<const>['neutral', 'fire', 'ice', 'lightning']).map(option => getMenuElement(state, option));
}

export function getToolOptions(state: GameState): MenuElement[] {
    return (<const>['bow', 'cloak', 'staff', 'clone']).map(option => getMenuElement(state, option));
}

export function getBootOptions(state: GameState): MenuElement[] {
    return (<const>['leatherBoots', 'ironBoots', 'cloudBoots']).map(option => getMenuElement(state, option));
}

export function getEyesOptions(state: GameState): MenuElement[] {
    return (<const>['catEyes', 'spiritSight', 'trueSight']).map(option => getMenuElement(state, option));
}

export function getTechniqueOptions(state: GameState): MenuElement[] {
    return (<const>['roll', 'teleportation', 'ironSkin']).map(option => getMenuElement(state, option));
}

function getCollectibleMenuElement(state: GameState, collectible: Collectible): MenuElement {
    return {
        ...elementGeometry,
        getLabel: () => getLootName(state, {lootType: collectible}),
        isVisible: (state: GameState) => state.hero.savedData.collectibleTotals[collectible] > 0,
        render(context: CanvasRenderingContext2D, state: GameState) {
            drawFrameCenteredAt(context, getLootFrame(state, {lootType: collectible}), {x: this.x, y: this.y, w: this.w, h: this.h});
            drawARFont(context, state.hero.savedData.collectibleTotals[collectible], this.x + this.w / 2, this.y + this.h + 1, {
                textBaseline: 'middle', textAlign: 'center',
            });
        },
        onSelect(state: GameState, toolIndex?: number) {
            showMessage(state, getLootHelpMessage(state, {lootType: collectible}));
            return true;
        },
        onUpgrade(state: GameState) {
            state.hero.savedData.collectibles[collectible] = ((state.hero.savedData.collectibles[collectible] || 0) + 1) % 10;
            state.hero.savedData.collectibleTotals[collectible] = state.hero.savedData.collectibles[collectible];
        }
    }
}

export function getMaterialOptions(state: GameState): MenuElement[] {
    return (<const>['silverOre', 'goldOre', 'aetherCrystal', 'magicBeans']).map(option => getCollectibleMenuElement(state, option));
}

function getConsumableMenuElement(state: GameState, consumable: Consumable): MenuElement {
    return {
        ...elementGeometry,
        getLabel: () => getLootName(state, {lootType: consumable}),
        isVisible: (state: GameState) => state.hero.savedData.consumableTotals[consumable] > 0,
        render(context: CanvasRenderingContext2D, state: GameState) {
            drawFrameCenteredAt(context, getLootFrame(state, {lootType: consumable}), {x: this.x, y: this.y, w: this.w, h: this.h});
            drawARFont(context, state.hero.savedData.consumables[consumable], this.x + this.w / 2, this.y + this.h + 1, {
                textBaseline: 'middle', textAlign: 'center',
            });
        },
        onSelect(state: GameState, toolIndex?: number) {
            showMessage(state, getLootHelpMessage(state, {lootType: consumable}));
            return true;
        },
        onUpgrade(state: GameState) {
            state.hero.savedData.consumables[consumable] = ((state.hero.savedData.consumables[consumable] || 0) + 1) % 10;
            state.hero.savedData.consumableTotals[consumable] = state.hero.savedData.consumables[consumable];
        }
    }
}

export function getPotionOptions(state: GameState): MenuElement[] {
    return (<const>['healthPotion', 'statusPotion', 'magicPotion']).map(option => getConsumableMenuElement(state, option));
}

function getDungeonItems(state: GameState) {
    if (!state.savedState.dungeonInventories[state.location.logicalZoneKey]) {
        state.savedState.dungeonInventories[state.location.logicalZoneKey] = {bigKey: false, map: false, smallKeys: 0, totalSmallKeys: 0};
    }
    return state.savedState.dungeonInventories[state.location.logicalZoneKey];
}
const dungeonMapMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Dungeon Map',
    isVisible: (state: GameState) => getDungeonItems(state).map,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, mapFrame, this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, getLootHelpMessage(state, {lootType: 'map'}));
        return true;
    },
    onUpgrade(state: GameState) {
        const dungeonItems = getDungeonItems(state);
        dungeonItems.map = !dungeonItems.map;
    }
};
const bigKeyMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Big Key',
    isVisible: (state: GameState) => getDungeonItems(state).bigKey,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, bigKeyFrame, this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, getLootHelpMessage(state, {lootType: 'bigKey'}));
        return true;
    },
    onUpgrade(state: GameState) {
        const dungeonItems = getDungeonItems(state);
        dungeonItems.bigKey = !dungeonItems.bigKey;
    }
};
const smallKeyMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Small Key',
    isVisible: (state: GameState) => getDungeonItems(state).totalSmallKeys > 0,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, keyFrame, {x: this.x, y: this.y, w: this.w, h: this.h});
        drawARFont(context, getDungeonItems(state).smallKeys, this.x + this.w / 2, this.y + this.h + 1, {
            textBaseline: 'middle', textAlign: 'center',
        });
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, getLootHelpMessage(state, {lootType: 'smallKey'}));
        return true;
    },
    onUpgrade(state: GameState) {
        const dungeonItems = getDungeonItems(state);
        dungeonItems.smallKeys = ((dungeonItems.smallKeys || 0) + 1) % 5;
        dungeonItems.totalSmallKeys = dungeonItems.smallKeys;
    }
};
export function getDungeonOptions(state: GameState): MenuElement[] {
    return [dungeonMapMenuOption, bigKeyMenuOption, smallKeyMenuOption];
}

export function getMenuTip(state: GameState, type: MenuOptionType): {buttons: string, action: string} | null {
    if (type === 'help') {
        return {
            buttons: '[B_WEAPON]',
            action: 'Show',
        };
    }
    if (type === 'return' || type === 'nimbusCloud') {
        return {
            buttons: '[B_WEAPON]',
            action: 'Use',
        };
    }
    if (type === 'bow' || type === 'staff' || type === 'cloak' || type === 'clone') {
        return {
            buttons: '[B_LEFT_TOOL]/[B_RIGHT_TOOL]',
            action: 'Equip',
        };
    }
    if (type === 'fire' || type === 'ice' || type === 'lightning') {
        if (state.hero.savedData.element === type) {
            return {
                buttons: '[B_WEAPON]',
                action: 'Unequip',
            };
        }
        return {
            buttons: '[B_WEAPON]',
            action: 'Unequip',
        };
    }
    if (type === 'neutral') {
        if (state.hero.savedData.element === null) {
            return null
        }
        return {
            buttons: '[B_WEAPON]',
            action: 'Equip',
        };
    }
    if (type === 'leatherBoots' || type === 'ironBoots' || type === 'cloudBoots') {
        if (state.hero.savedData.equippedBoots === type) {
            return null
        }
        return {
            buttons: '[B_WEAPON]',
            action: 'Equip',
        };
    }
    return {
        buttons: '[B_WEAPON]',
        action: 'Help',
    };
}
