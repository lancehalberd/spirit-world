import { addTextCue, findTextCue } from 'app/content/effects/textCue';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';



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
    }
};
