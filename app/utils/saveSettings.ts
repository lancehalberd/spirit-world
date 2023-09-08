
export function saveSettings(state: GameState) {
    window.localStorage.setItem('settings', JSON.stringify(state.settings));
}
