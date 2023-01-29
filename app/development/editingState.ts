import { palettes } from 'app/content/palettes';

import { EditingState } from 'app/types';

export const editingState: EditingState = {
    tool: 'brush',
    previousTool: 'select',
    hasChanges: false,
    isEditing: false,
    paletteKey: Object.keys(palettes)[0],
    // Default editing the field, not the floor.
    refreshMinimap: true,
    replacePercentage: 100,
    spirit: false,
};
window['editingState'] = editingState;
window.onbeforeunload = () => {
    if (editingState.hasChanges) {
        // Chrome ignores this message but displays an appropriate message.
        return 'You have may unsaved changes.';
    }
}
