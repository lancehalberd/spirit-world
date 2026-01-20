import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'app/gameConstants';
import { renderStandardFieldStack } from 'app/render/renderField';
import { renderHUD } from 'app/renderHUD';
import { drawText } from 'app/utils/simpleWhiteFont';
import { fillRect, pad } from 'app/utils/index';


const WIDTH = 144;
const ROW_HEIGHT = 20;
const MAX_VISIBLE = 4;

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

const aBosses: BossName[] = ["beetle", "golem", "idols", "guardian", "rush", "altGolem"];
const bBosses: BossName[] = aBosses.concat(["rival2", "forest", "collector", "rush2"])
const cBosses: BossName[] = bBosses.concat(["flameBeast", "frostBeast", "stormBeast", "rush3"])

export function getBossRushOptions(state: GameState): string[] {
    if (state.savedState.objectFlags.frostBeast && 
        state.savedState.objectFlags.flameBeast &&
        state.savedState.objectFlags.stormBeast) {
            return cBosses
        }
    if (state.savedState.objectFlags.elementalBeastsEscaped) {
        return bBosses
    }
    return aBosses
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const paddedSeconds = seconds.toString().padStart(2, '0');
  
  return `${minutes}\'${paddedSeconds}\"`;
}

function getHighScore(state: GameState, boss: BossName): string {
    let bestTime = state.savedState.savedHeroData.bossRushTimes[boss];
    if (typeof bestTime !== 'number' || !Number.isFinite(bestTime)) {
            return `--`;
        }
    return formatTime(bestTime)
}
export function renderBossRushMenu(context: CanvasRenderingContext2D, state: GameState): void {
    renderStandardFieldStack(context, state);
    renderHUD(context, state);
    const options = getBossRushOptions(state);
    
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

    context.fillStyle = 'white';
    let x = r.x + 20, y = r.y + ROW_HEIGHT / 2;
    
    for (let i = 0; i < visibleOptions.length; i++) {
        const actualIndex = startIndex + i;
        let text = visibleOptions[i].slice(0, 13).toUpperCase();
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
    const selectedBoss = cBosses[state.menuIndex];
    const highScoreTime = getHighScore(state, selectedBoss); 

    if (highScoreTime) {
        const scoreBoxWidth = 100;
        const scoreBoxHeight = 30;
        const scoreBox = {
            x: CANVAS_WIDTH - scoreBoxWidth - 10, 
            y: CANVAS_HEIGHT - scoreBoxHeight - 10,
            w: scoreBoxWidth,
            h: scoreBoxHeight,
        };
        
        fillRect(context, scoreBox, 'white');
        fillRect(context, pad(scoreBox, -2), 'black');
        
        context.fillStyle = 'white';
        drawText(context, `Best: ${highScoreTime}`, 
            scoreBox.x + scoreBoxWidth / 2, 
            scoreBox.y + scoreBoxHeight / 2, 
            { ...textOptions, textAlign: 'center' }
        );
    }
}

