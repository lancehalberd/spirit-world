import { drawARFont } from 'app/arGames/arFont';
import { wasGameKeyPressed } from 'app/userInput';
import { GAME_KEY } from 'app/gameConstants';
import { boxesIntersect, pad } from 'app/utils/index';
import { playAreaSound } from 'app/musicController';
import { saveGame } from 'app/utils/saveGame';
import { updateHeroPosition, getHeroPosition } from './fps_utility';
import { levelConfigs } from './fps_config';
import { TargetPracticeState, TargetPracticeSavedState, LevelKey} from './fps_types';
import { getNewTargetPracticeSavedState } from './fps_level';

function updateResults(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    updateHeroPosition(state, gameState);

    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        if (gameState.levelKey === 'l10') {
            const currentRecord = savedState.records[gameState.levelKey] ?? 0;
            if (gameState.score > currentRecord) {
                savedState.records[gameState.levelKey] = gameState.score;
            }
        } else if (gameState.completionTime !== undefined) {
            const currentRecord = savedState.records[gameState.levelKey] ?? Infinity;
            if (gameState.completionTime < currentRecord) {
                savedState.records[gameState.levelKey] = gameState.completionTime;
            }
        }

        if (gameState.goal > 0 && gameState.score >= gameState.goal) {
            const levelNum = parseInt(gameState.levelKey.substring(1), 10);
            const nextLevelKey = 'l' + (levelNum + 1) as LevelKey;
            if (levelConfigs[nextLevelKey] && !savedState.unlocks[nextLevelKey]) {
                savedState.unlocks[nextLevelKey] = 1;
            }
        }
        
        saveGame(state);
        gameState.scene = 'shop';
    }
}

function renderResults(context: CanvasRenderingContext2D, state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    const {x, y, w, h} = gameState.screen;
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(x, y, w, h);
    const centerX = x + w / 2;

    drawARFont(context, 'RESULTS', centerX, y + 10, {textAlign: 'center', textBaseline: 'top'});
    drawARFont(context, 'SCORE: ' + gameState.score, centerX, y + 25, {textAlign: 'center', textBaseline: 'top'});
    
    
    
    drawARFont(context, 'MISSED: ' + gameState.missedShots, centerX, y + 40, {textAlign: 'center', textBaseline: 'top'});

    const accuracy = gameState.shotsFired > 0 ? Math.round(((gameState.shotsFired - gameState.missedShots) / gameState.shotsFired) * 100) : 100;
    drawARFont(context, `ACCURACY: ${accuracy}% (${gameState.shotsHit}/${gameState.shotsFired})`, centerX, y + 55, {textAlign: 'center', textBaseline: 'top'});

    if (gameState.goal > 0) {
        const goalMet = gameState.score >= gameState.goal;
        const outOfAmmo = gameState.ammo <= 0;
        
        let statusText = '';
        let statusColor = '';
        
        if (goalMet) {
            statusText = 'SUCCESS!';
            statusColor = '#0F0';
        } else if (outOfAmmo) {
            statusText = 'OUT OF AMMO!';
            statusColor = '#F00';
        } else {
            statusText = 'TIME IS UP!';
            statusColor = '#FA0';
        }
        
        context.fillStyle = statusColor;
        drawARFont(context, statusText, centerX, y + 65, {textAlign: 'center', textBaseline: 'top'});
        context.fillStyle = '#FFF';

        if (goalMet && gameState.completionTime !== undefined) {
            const timeText = (gameState.completionTime / 1000).toFixed(1) + 's';
            drawARFont(context, 'TIME: ' + timeText, centerX, y + 75, {textAlign: 'center', textBaseline: 'top'});
        }
    }
    
    if (gameState.levelKey === 'l10') {
        const currentRecord = savedState.records[gameState.levelKey] ?? 0;
        if (gameState.score > currentRecord) {
            drawARFont(context, 'NEW HIGH SCORE!', centerX, y + 100, {textAlign: 'center', textBaseline: 'top'});
        } else if (currentRecord > 0) {
            drawARFont(context, 'HIGH SCORE: ' + currentRecord, centerX, y + 100, {textAlign: 'center', textBaseline: 'top'});
        }
    } else if (gameState.completionTime !== undefined) {
        const currentRecord = savedState.records[gameState.levelKey] ?? Infinity;
        if (gameState.completionTime < currentRecord && gameState.score >= gameState.goal) {
            drawARFont(context, 'NEW FASTEST TIME!', centerX, y + 100, {textAlign: 'center', textBaseline: 'top'});
        } else if (currentRecord !== Infinity) {
            const recordText = 'BEST TIME: ' + (currentRecord / 1000).toFixed(1) + 's';
            drawARFont(context, recordText, centerX, y + 100, {textAlign: 'center', textBaseline: 'top'});
        }
    }
    
    drawARFont(context, 'PRESS SPACE', centerX, y + h - 50, {textAlign: 'center', textBaseline: 'top'});
}

function getYesRect(gameState:TargetPracticeState) {
    return {
        x: gameState.screen.x + 4,
        y: gameState.screen.y + 108,
        w: 36,
        h: 14,
    }
}
function getNoRect(gameState:TargetPracticeState) {
    return {
        x: gameState.screen.x + gameState.screen.w - 4 - 36,
        y: gameState.screen.y + 108,
        w: 36,
        h: 14,
    }
}
function updateReset(state: GameState, gameState:TargetPracticeState, savedState: TargetPracticeSavedState) {

    updateHeroPosition(state, gameState);


    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        const heroHitbox = pad(getHeroPosition(state, gameState), -4);
        if (boxesIntersect(heroHitbox, getNoRect(gameState))) {
            gameState.scene = 'shop';
        }
        if (boxesIntersect(heroHitbox, getYesRect(gameState))) {
            Object.assign(savedState, getNewTargetPracticeSavedState());
            saveGame(state);
            gameState.scene = 'shop';
            playAreaSound(state, state.areaInstance, 'secretChime');
        }
    }
}
function renderReset(context: CanvasRenderingContext2D, state: GameState, gameState:TargetPracticeState, savedState: TargetPracticeSavedState) {
    drawARFont(context, 'ERASE ALL PROGRESS?', gameState.screen.x + gameState.screen.w / 2, gameState.screen.y + gameState.screen.h / 2, {textAlign: 'center', textBaseline: 'middle'});
    let r = getYesRect(gameState);
    context.fillStyle = '#084';
    context.fillRect(r.x, r.y, r.w, r.h);
    drawARFont(context, 'YES', r.x + r.w / 2, r.y + r.h / 2, {textAlign: 'center', textBaseline: 'middle'});
    r = getNoRect(gameState);
    context.fillStyle = '#084';
    context.fillRect(r.x, r.y, r.w, r.h);
    drawARFont(context, 'NO', r.x + r.w / 2, r.y + r.h / 2, {textAlign: 'center', textBaseline: 'middle'});
}

export { updateResults, renderResults, updateReset, renderReset };