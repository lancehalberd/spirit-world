import { addTextCue, findTextCue } from 'app/content/effects/textCue';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';



specialBehaviorsHash.barrierBurstInstructions = {
    type: 'narration',
    update(state: GameState, object: ObjectInstance) {
        let helpText = 'Return here when you obtain the Spirit Cloak';
        let toolButton: string;
        if (state.hero.leftTool === 'cloak') {
            toolButton = '[B_LEFT_TOOL]';
        } else if (state.hero.rightTool === 'cloak') {
            toolButton = '[B_RIGHT_TOOL]';
        }
        if (toolButton) {
            if (state.hero.hasBarrier) {
                helpText = `Hold ${toolButton} to use the Barrier Burst Technique`;
            } else {
                helpText = `Press ${toolButton} to create a Spirit Barrier`;
            }
        } else if (state.hero.activeTools.cloak) {
            helpText = `Press [B_MENU] to open your inventory and assign Spirit Cloak to [B_TOOL]`;
        }
        const textCue = findTextCue(state);
        if (!textCue && object.area === state.areaInstance) {
            addTextCue(state, helpText, 0);
        } else if (textCue.props.text !== helpText || object.area !== state.areaInstance) {
            textCue.fadeOut();
        }
    }
};
