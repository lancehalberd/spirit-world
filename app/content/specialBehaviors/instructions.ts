import {addTextCue, findTextCue} from 'app/content/effects/textCue';
import {specialBehaviorsHash} from 'app/content/specialBehaviors/specialBehaviorsHash';
import {MAX_SPIRIT_RADIUS} from 'app/gameConstants';
import {showMessage} from 'app/scriptEvents';
import {pad} from 'app/utils/index';

specialBehaviorsHash.runInstructions = {
    type: 'narration',
    update(state: GameState, object: ObjectInstance) {
        let helpText = '';
        const id = object.definition.id;

        if (state.hero.magicRegen && !state.savedState.objectFlags[id]) {
            helpText = `Hold [B_PASSIVE] to run.[-]Running uses Spirit Energy.`;
        }
        const textCue = findTextCue(state);
        if (!textCue && helpText && object.area === state.areaInstance) {
            addTextCue(state, helpText, 0);
        } else if (textCue && (textCue.props.text !== helpText || object.area !== state.areaInstance)) {
            textCue.fadeOut();
        }
    },
};


specialBehaviorsHash.rollInstructions = {
    type: 'narration',
    update(state: GameState, object: ObjectInstance) {
        let helpText = '';
        const id = object.definition.id;

        if (state.hero.savedData.passiveTools.roll && !state.savedState.objectFlags[id]) {
            helpText = `Press [B_ROLL] to roll through hazards.`;
        }
        if (!state.hero.savedData.passiveTools.roll && !state.hero.savedData.passiveTools.gloves) {
            helpText = `You need a new skill to continue ahead.[-]Press [B_MAP] to view your map.`;
        }
        const textCue = findTextCue(state);
        if (!textCue && helpText && object.area === state.areaInstance) {
            addTextCue(state, helpText, 0);
        } else if (textCue && (textCue.props.text !== helpText || object.area !== state.areaInstance)) {
            textCue.fadeOut();
        }
    },
};

specialBehaviorsHash.barrierBurstInstructions = {
    type: 'narration',
    update(state: GameState, object: ObjectInstance) {
        let helpText = 'Return here when you obtain the Spirit Cloak';
        let toolButton: string;
        if (state.hero.savedData.leftTool === 'cloak') {
            toolButton = '[B_LEFT_TOOL]';
        } else if (state.hero.savedData.rightTool === 'cloak') {
            toolButton = '[B_RIGHT_TOOL]';
        }
        if (toolButton) {
            if (state.hero.hasBarrier) {
                helpText = `Hold ${toolButton} to use the Barrier Burst Technique`;
            } else {
                helpText = `Tap ${toolButton} to create a Spirit Barrier`;
            }
        } else if (state.hero.savedData.activeTools.cloak) {
            helpText = `Press [B_MENU] to open your inventory and assign Spirit Cloak to [B_TOOL]`;
        }
        // Stop showing this help text once the player has successfully opened the cocoon back teleporter.
        if (state.savedState.objectFlags.cocoonBackTeleporter) {
            helpText = '';
        }
        const textCue = findTextCue(state);
        if (!textCue && helpText && object.area === state.areaInstance) {
            addTextCue(state, helpText, 0);
        } else if (textCue && (textCue.props.text !== helpText || object.area !== state.areaInstance)) {
            textCue.fadeOut();
        }
    },
};

specialBehaviorsHash.staffInstructions = {
    type: 'narration',
    update(state: GameState, object: ObjectInstance) {
        let helpText = '';
        if (!state.savedState.objectFlags.hideStaffInstructions) {
            let toolButton: string;
            if (state.hero.savedData.leftTool === 'staff') {
                toolButton = '[B_LEFT_TOOL]';
            } else if (state.hero.savedData.rightTool === 'staff') {
                toolButton = '[B_RIGHT_TOOL]';
            }
            if (toolButton) {
                if (state.hero.activeStaff) {
                    helpText = `Press ${toolButton} to retrieve the staff`;
                } else {
                    helpText = `Press ${toolButton} to place the staff`;
                }
            } else if (state.hero.savedData.activeTools.staff) {
                helpText = `Press [B_MENU] to open your inventory and assign Staff to [B_TOOL]`;
            }
        }
        const textCue = findTextCue(state);
        if (!textCue && helpText && object.area === state.areaInstance) {
            addTextCue(state, helpText, 0);
        } else if (textCue && (textCue.props.text !== helpText || object.area !== state.areaInstance)) {
            textCue.fadeOut();
        }
    },
};


specialBehaviorsHash.spiritSightInstructions = {
    type: 'narration',
    update(state: GameState, object: ObjectInstance) {
        let helpText = '';
        if (!state.hero.savedData.passiveTools.spiritSight && state.savedState.objectFlags.spiritSightTraining) {
            helpText = 'Approach the pots.'
            const pot = state.areaInstance.objects.find(o => o.definition?.id === 'tombEscapePot');
            const isCloseToPots = pot && state.hero.overlaps(pad(pot.getHitbox(), 16));
            if (isCloseToPots) {
                helpText = 'Hold [B_MEDITATE] to concentrate on the pot.';
                if (state.hero.action === 'meditating') {
                    state.hero.maxSpiritRadius = Math.min(MAX_SPIRIT_RADIUS, (state.hero.maxSpiritRadius + 0.15) * 1.005);
                    if (state.hero.maxSpiritRadius >= MAX_SPIRIT_RADIUS) {
                        // Once maximum spirit sight radius is reached, the player will learn the Spirit Sight ability.
                        showMessage(state, '{item:spiritSight}');
                        helpText = '';
                    } else if (state.hero.maxSpiritRadius >= MAX_SPIRIT_RADIUS / 2) {
                        helpText = `...and see what lies beneath.`;
                    } else if (state.hero.maxSpiritRadius >= MAX_SPIRIT_RADIUS / 4) {
                        helpText = `...let the obvious become obscure...`;
                    } else if (state.hero.maxSpiritRadius >= 8) {
                        helpText = '...feel the difference...';
                    } else {
                        helpText = 'Keep concentrating...';
                    }
                } else {
                    state
                }
            }
        }
        const textCue = findTextCue(state);
        if (!textCue && helpText && object.area === state.areaInstance) {
            addTextCue(state, helpText, 0);
        } else if (textCue && (textCue.props.text !== helpText || object.area !== state.areaInstance)) {
            textCue.fadeOut();
        }
    },
};

specialBehaviorsHash.teleportationInstructions = {
    type: 'narration',
    update(state: GameState, object: ObjectInstance) {
        let helpText = '';
        if (state.hero.savedData.passiveTools.teleportation && !state.savedState.objectFlags.teleportationTutorialSwitch) {
            helpText = 'Hold [B_MEDITATE] to project your Astral Body.'
            if (state.hero.astralProjection) {
                helpText = 'Move your Astral Body to your goal.';
                if (!state.hero.overlaps(pad(state.hero.astralProjection.getHitbox(), 16))) {
                    helpText = 'Press [B_TOOL] to use your Spirit Energy to teleport to your Astral Body.';
                }
            }
        }
        const textCue = findTextCue(state);
        if (!textCue && helpText && object.area === state.areaInstance) {
            addTextCue(state, helpText, 0);
        } else if (textCue && (textCue.props.text !== helpText || object.area !== state.areaInstance)) {
            textCue.fadeOut();
        }
    },
};

specialBehaviorsHash.barrierReflectInstructions = {
    type: 'narration',
    update(state: GameState, object: ObjectInstance) {
        let helpText = 'Return here when you obtain the Spirit Cloak';
        let toolButton: string;
        if (state.hero.savedData.leftTool === 'cloak') {
            toolButton = '[B_LEFT_TOOL]';
        } else if (state.hero.savedData.rightTool === 'cloak') {
            toolButton = '[B_RIGHT_TOOL]';
        }
        if (toolButton) {
            if (state.hero.hasBarrier) {
                helpText = `Use the Spirit Barrier to reflect enemy attacks`;
            } else {
                helpText = `Press ${toolButton} to create a Spirit Barrier`;
            }
        } else if (state.hero.savedData.activeTools.cloak) {
            helpText = `Press [B_MENU] to open your inventory and assign Spirit Cloak to [B_TOOL]`;
        }
        // Stop showing this help text once the player has successfully defeated the enemies.
        // Do not show the text again in the future if the boss teleporter is already unlocked.
        if (!state.areaInstance.enemies.find(enemy => enemy.status !== 'gone' && !enemy.isDefeated)
            || state.savedState.objectFlags.cocoonBossTeleporter
        ) {
            helpText = '';
        }
        const textCue = findTextCue(state);
        if (!textCue && helpText && object.area === state.areaInstance) {
            addTextCue(state, helpText, 0);
        } else if (textCue && (textCue.props.text !== helpText || object.area !== state.areaInstance)) {
            textCue.fadeOut();
        }
    },
};

specialBehaviorsHash.bowInstructions = {
    type: 'narration',
    update(state: GameState, object: ObjectInstance) {
        let helpText = '';
        let toolButton: string;
        if (state.hero.savedData.leftTool === 'bow') {
            toolButton = '[B_LEFT_TOOL]';
        } else if (state.hero.savedData.rightTool === 'bow') {
            toolButton = '[B_RIGHT_TOOL]';
        }
        if (toolButton) {
            helpText = `Face a target and press ${toolButton} to shoot an arrow`;
        } else if (state.hero.savedData.activeTools.bow) {
            helpText = `Press [B_MENU] to open your inventory and assign the Bow to [B_TOOL]`;
        }
        // Stop showing this help text once the player has successfully defeated the enemies.
        // Do not show the text again in the future if the boss teleporter is already unlocked.
        if (state.savedState.objectFlags.bowDoor) {
            helpText = '';
        }
        const textCue = findTextCue(state);
        if (!textCue && helpText && object.area === state.areaInstance) {
            addTextCue(state, helpText, 0);
        } else if (textCue && (textCue.props.text !== helpText || object.area !== state.areaInstance)) {
            textCue.fadeOut();
        }
    },
};

specialBehaviorsHash.chestAndChakramInstructions = {
    type: 'narration',
    update(state: GameState, object: ObjectInstance) {
        let helpText = '';
        if (!state.hero.savedData.weapon) {
            helpText = 'Face a chest from the south and press [B_PASSIVE] to open it';
        } else if (state.areaInstance.enemies.filter(e => e.isFromCurrentSection(state) && !e.isDefeated && e.status !== 'gone').length) {
            helpText = 'Press [B_WEAPON] to throw the chakram at enemies';
        }
        const textCue = findTextCue(state);
        if (!textCue && helpText && object.area === state.areaInstance) {
            addTextCue(state, helpText, 0);
        } else if (textCue && (textCue.props.text !== helpText || object.area !== state.areaInstance)) {
            textCue.fadeOut();
        }
    },
};
