interface ContextMenuState {
    contextMenu: ContextMenu,
}

export const editingState: EditingState = {
    tool: 'brush',
    previousTool: 'select',
    hasChanges: false,
    isEditing: false,
    // Default editing the field, not the floor.
    refreshMinimap: true,
    replacePercentage: 100,
    spirit: false,
    areaScale: 1,
    selectedSections: [],
    recentAreas: [],
    selectedVariantData: {
        id: '',
        seed: 0,
        x: 0, y: 0,
        type: 'blockedPath',
        w: 48,
        h: 48,
        d: 'up',
        styleWeights: {},
    },
    showWallsOpacity: 0.6,
};
window['editingState'] = editingState;
window.onbeforeunload = () => {
    if (editingState.hasChanges) {
        // Chrome ignores this message but displays an appropriate message.
        return 'You have may unsaved changes.';
    }
}

export const contextMenuState: ContextMenuState = {
    contextMenu: null,
}
