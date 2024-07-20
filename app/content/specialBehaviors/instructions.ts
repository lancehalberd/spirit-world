import { addTextCue, findTextCue } from 'app/content/effects/textCue';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';

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
                helpText = `Press ${toolButton} to create a Spirit Barrier`;
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
