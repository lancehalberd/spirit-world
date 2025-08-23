import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { drawFrame } from 'app/utils/animations';
import { ArCrosshairIcon } from 'app/render/heroAnimations';
import { drawARFont } from 'app/arGames/arFont';
import { TargetPracticeState } from './fps_types';
import { startTargetPractice, updateLevel } from './fps_level';
import { updateShop, renderShop } from './fps_shop';
import { updateResults, renderResults, updateReset, renderReset } from './fps_results';

function renderHero(context: CanvasRenderingContext2D, state: GameState, gameState: TargetPracticeState) {
    drawFrame(context, ArCrosshairIcon, {
        ...ArCrosshairIcon,
        x: gameState.crosshair.x - 8,
        y: gameState.crosshair.y - 8,
    });
}

function updateTargetPractice(state: GameState) {
    const gameState = state.arState.game;// as TargetPracticeState;
    const savedState = state.savedState.savedArData.gameData.targetPractice;
    savedState.points = Math.floor(savedState.points);
    
    if (gameState.scene === 'shop') {
        return updateShop(state, gameState, savedState);
    }
    if (gameState.scene === 'level') {
        return updateLevel(state, gameState, savedState);
    }
    if (gameState.scene === 'results') {
        return updateResults(state, gameState, savedState);
    }
    if (gameState.scene === 'reset') {
        return updateReset(state, gameState, savedState);
    }
}

function renderTargetPractice(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game;// as TargetPracticeState;
    const savedState = state.savedState.savedArData.gameData.targetPractice;
    
    state.hideHUD = true;
    
    context.save();
    context.beginPath();
    context.rect(gameState.screen.x, gameState.screen.y, gameState.screen.w, gameState.screen.h);
    context.clip()
    context.save();
    context.globalAlpha = 0.5;
    context.fillStyle = 'black';
    context.fill();
    context.restore();
    context.strokeStyle = 'blue';
    context.stroke();
    
    if (gameState.scene === 'level') {
        for (const target of gameState.targets) {
            target.render(context);
        }
        
        for (const bullet of gameState.bullets) {
            bullet.render(context);
        }
    }
    
    if (gameState.scene === 'shop') {
        renderShop(context, state, gameState, savedState);
    } else if (gameState.scene === 'results') {
        renderResults(context, state, gameState, savedState);
    } else if (gameState.scene === 'reset') {
        renderReset(context, state, gameState, savedState);
    }
    
    renderHero(context, state, gameState);
    context.restore();
}

function renderTargetPracticeHUD(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game;
    const savedState = state.savedState.savedArData.gameData.targetPractice;

    drawARFont(context, 'TARGET PRACTICE', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 16, {textAlign: 'center', textBaseline: 'top'});

    if (gameState.scene === 'shop' && gameState.activeShopItem) {
        const item = gameState.activeShopItem;
        const level = savedState.unlocks[item.key] ?? 0;
        const boxY = CANVAS_HEIGHT - 40;
        const boxHeight = 20;
        const boxWidth = 180;
        const boxX = CANVAS_WIDTH / 2 - boxWidth / 2;
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(boxX, boxY, boxWidth, boxHeight);
        context.strokeStyle = '#084';
        context.strokeRect(boxX, boxY, boxWidth, boxHeight);
        drawARFont(context, item.description, CANVAS_WIDTH / 2, boxY + 4, {textAlign: 'center', textBaseline: 'top'});
        
        if (item.levelKey && level > 0) {
            if (item.levelKey === 'l10') {
                const highScore = savedState.records[item.levelKey] ?? 0;
                const scoreText = highScore > 0 ? 'HIGH SCORE: ' + highScore : 'NO RECORD YET';
                drawARFont(context, scoreText, CANVAS_WIDTH / 2, boxY + 12, {textAlign: 'center', textBaseline: 'top'});
            } else {
                const fastestTime = savedState.records[item.levelKey];
                const timeText = fastestTime !== undefined && fastestTime !== Infinity 
                    ? 'BEST: ' + (fastestTime / 1000).toFixed(1) + 's' 
                    : 'NO RECORD YET';
                drawARFont(context, timeText, CANVAS_WIDTH / 2, boxY + 12, {textAlign: 'center', textBaseline: 'top'});
            }
        } 
    }
    
    if (gameState.scene === 'level') {
        if (gameState.levelKey != 'l10') {
            const scoreText = gameState.score + (gameState.goal ? '/' + gameState.goal : '');
            drawARFont(context, scoreText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40, {textAlign: 'center', textBaseline: 'top'});
        }

        const timeBarWidth = 100;
        const timeBarHeight = 6;
        const timeBarX = CANVAS_WIDTH / 2 - timeBarWidth / 2;
        const timeBarY = CANVAS_HEIGHT - 32;
        
        const timeProgress = gameState.timeLeft / gameState.maxTime;
        
        context.fillStyle = '#333';
        context.fillRect(timeBarX, timeBarY, timeBarWidth, timeBarHeight);
        
        context.fillStyle = timeProgress > 0.25 ? '#0F0' : '#F00';
        context.fillRect(timeBarX, timeBarY, timeBarWidth * timeProgress, timeBarHeight);
        
        context.strokeStyle = '#FFF';
        context.strokeRect(timeBarX, timeBarY, timeBarWidth, timeBarHeight);
        
        const dotSize = 3;
        const dotSpacing = 6;
        const totalDotsWidth = (gameState.maxAmmo - 1) * dotSpacing + dotSize;
        const dotsStartX = CANVAS_WIDTH / 2 - totalDotsWidth / 2 + 0.5;
        const dotsY = CANVAS_HEIGHT - 22;
        
        for (let i = 0; i < gameState.maxAmmo; i++) {
            const dotX = dotsStartX + i * dotSpacing;
            context.fillStyle = i < gameState.ammo ? '#FF0' : '#333';
            context.fillRect(dotX, dotsY, dotSize, dotSize);
        } 
    }
}


export const fpsGame: ARGame = {
    start: startTargetPractice,
    update: updateTargetPractice,
    render: renderTargetPractice,
    renderHUD: renderTargetPracticeHUD,
    disablesPlayerMovement: true,
};