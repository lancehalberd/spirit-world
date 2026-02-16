import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'app/gameConstants';
import { renderStandardFieldStack } from 'app/render/renderField';
import { drawText } from 'app/utils/simpleWhiteFont';
import { fillRect, pad } from 'app/utils/index';
import { getBossRushOptions, getKarmaTimeByKey } from './bossRushOptions';


const WIDTH = 144;
const ROW_HEIGHT = 20;
const MAX_VISIBLE = 4;

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const paddedSeconds = seconds.toString().padStart(2, '0');
  
  return `${minutes}\'${paddedSeconds}\"`;
}

function getHighScore(state: GameState, boss: BossName): string {
    let condition = state.bossRushTrackers.currentCondition;
    let bestTime = state.savedState.bossRushTimes[condition][boss];
    if (typeof bestTime !== 'number' || !Number.isFinite(bestTime)) {
            return `--`;
        }
    return formatTime(bestTime)
}
export function renderBossRushMenu(context: CanvasRenderingContext2D, state: GameState): void {
    renderStandardFieldStack(context, state, false);
    const options = getBossRushOptions(state);

    //If somehow someone gets to this menu too early, this prevents issues
    if (!options || options.length === 0) {
        state.scene = 'game';
        state.travel("dream", "bossRefightReturn", {instant: true});
        return;
    }
    
    // Calculate visible window
    const startIndex = Math.max(0, Math.min(
        state.menuIndex - 1, 
        options.length - MAX_VISIBLE
    ));
    const endIndex = Math.min(startIndex + MAX_VISIBLE, options.length);
    const visibleOptions = options.slice(startIndex, endIndex);
    
    const h = ROW_HEIGHT * visibleOptions.length + 8;
    let r = {
        x: 0,
        y: CANVAS_HEIGHT - h - 10,
        w: WIDTH,
        h,
    };
    fillRect(context, r, 'white');
    fillRect(context, pad(r, -2), 'black');

    r = pad(r, -4);

    context.fillStyle = state.bossRushTrackers.currentCondition == 'daredevil' ? 'red' : 'white'; //WIP: Make better visual indicator of daredevil mode.
    let x = r.x + 20, y = r.y + ROW_HEIGHT / 2;
    
    for (let i = 0; i < visibleOptions.length; i++) {
        const actualIndex = startIndex + i;
        let text = visibleOptions[i].label.slice(0, 13).toUpperCase();
        drawText(context, text, x, y, textOptions);
        
        if (state.menuIndex === actualIndex) {
            context.beginPath();
            context.moveTo(r.x + 8, y - 8);
            context.lineTo(r.x + 16, y);
            context.lineTo(r.x + 8, y + 8);
            context.fill();
        }
        y += ROW_HEIGHT;
    }
    
    if (startIndex > 0) {
        context.fillStyle = 'white';
        const upY = r.y - 6;
        context.beginPath();
        context.moveTo(r.x + r.w / 2 - 4, upY);
        context.lineTo(r.x + r.w / 2, upY - 4);
        context.lineTo(r.x + r.w / 2 + 4, upY);
        context.fill();
    }
    
    if (endIndex < options.length) {
        context.fillStyle = 'white';
        const downY = r.y + r.h + 6;
        context.beginPath();
        context.moveTo(r.x + r.w / 2 - 4, downY);
        context.lineTo(r.x + r.w / 2, downY + 4);
        context.lineTo(r.x + r.w / 2 + 4, downY);
        context.fill();
    }

    // High Score Display
    const selectedBoss = options[state.menuIndex].key;
    const highScoreTime = getHighScore(state, selectedBoss); 

    if (highScoreTime) {
        let timeToBeat = formatTime(getKarmaTimeByKey(selectedBoss));
        const scoreBoxWidth = 100;
        const scoreBoxHeight = 30;
        const scoreBox = {
            x: CANVAS_WIDTH - scoreBoxWidth - 10, 
            y: CANVAS_HEIGHT - scoreBoxHeight - 10,
            w: scoreBoxWidth,
            h: scoreBoxHeight,
        };
        let condition = state.bossRushTrackers.currentCondition;
        let beatBestTime = state.savedState.bossRushTimes[condition][selectedBoss] < getKarmaTimeByKey(selectedBoss)
        let boxColor = (beatBestTime && condition == 'none') ? 'yellow' : 'white';
        fillRect(context, scoreBox, boxColor);
        fillRect(context, pad(scoreBox, -2), 'black');
        
        context.fillStyle = 'white';
        drawText(context, `Best: ${highScoreTime}`, 
            scoreBox.x + scoreBoxWidth / 2, 
            scoreBox.y + scoreBoxHeight / 2, 
            { ...textOptions, textAlign: 'center' }
        );
        if (!beatBestTime && condition == 'none') {
            const toBeatBox = {
                x: CANVAS_WIDTH - scoreBoxWidth - 10, 
                y: CANVAS_HEIGHT - (scoreBoxHeight * 2) - 20, // Position above the high score box
                w: scoreBoxWidth,
                h: scoreBoxHeight,
            };
            
            fillRect(context, toBeatBox, 'white');
            fillRect(context, pad(toBeatBox, -2), 'black');
            
            context.fillStyle = 'white';
            drawText(context, `Beat: ${timeToBeat}`, 
                toBeatBox.x + scoreBoxWidth / 2, 
                toBeatBox.y + scoreBoxHeight / 2, 
                { ...textOptions, textAlign: 'center', size: 14 }
            );
        }
    }

    

    // Karma display
    const karmaBoxWidth = 100;
    const karmaBoxHeight = 30;
    const karmaBox = {
        x: CANVAS_WIDTH - karmaBoxWidth - 10,
        y: 10,
        w: karmaBoxWidth,
        h: karmaBoxHeight,
    };
    
    fillRect(context, karmaBox, 'white');
    fillRect(context, pad(karmaBox, -2), 'black');
    
    context.fillStyle = 'white';
    drawText(context, `KARMA: ${state.savedState.savedHeroData.karma}`, 
        karmaBox.x + 6, 
        karmaBox.y + karmaBoxHeight / 2, 
        { ...textOptions, textAlign: 'left' }
    );
}

