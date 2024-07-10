import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { drawFrameAt } from 'app/utils/animations';
import { fillRect } from 'app/utils/index';
import { drawText } from 'app/utils/simpleWhiteFont';
import { keyboardMap, xboxMap } from 'app/utils/simpleWhiteFont';
import { GAME_KEY } from 'app/gameConstants';


function renderControlFrames(context: CanvasRenderingContext2D, state: GameState, key: number, p: Point, reverse = false): Rect {
    const isUsingKeyboard = reverse ? !state.isUsingKeyboard : state.isUsingKeyboard;
    const frames = isUsingKeyboard ? keyboardMap[key] : xboxMap[key];
    let {x, y} = p;
    const r = {x, y, w: 0, h: 0};
    for (const frame of frames) {
        r.w = x + frame.w - r.x;
        r.h = Math.max(r.h, frame.h);
        drawFrameAt(context, frame, {x, y});
        x += frame.w;
    }
    return r;
}

export function renderControls(context: CanvasRenderingContext2D, state: GameState): void {
    let r = {x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT};
    fillRect(context, r, 'black');
    const savedData = state.hero.savedData;
    let y = 20;
    let left = 80, right = 144;
    r = renderControlFrames(context, state, GAME_KEY.ROLL, {x: left, y});
    drawText(context, savedData.passiveTools.roll ? 'Roll' : '???', r.x - 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'right',
        size: 16,
    });

    r = renderControlFrames(context, state, GAME_KEY.MEDITATE, {x: right, y});
    drawText(context, savedData.passiveTools.spiritSight ? 'Meditate' : '???', r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    y += 20;
    const hasElement = savedData.elements.fire || savedData.elements.ice || savedData.elements.lightning;
    r = renderControlFrames(context, state, GAME_KEY.PREVIOUS_ELEMENT, {x: left, y});
    drawText(context, hasElement ? 'Prev Ele.' : '???', r.x - 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'right',
        size: 16,
    });

    r = renderControlFrames(context, state, GAME_KEY.NEXT_ELEMENT, {x: right, y});
    drawText(context, hasElement ? 'Next Ele.' : '???', r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    y += 20;
    r = renderControlFrames(context, state, GAME_KEY.MAP, {x: left, y});
    drawText(context, 'Map', r.x - 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'right',
        size: 16,
    });

    r = renderControlFrames(context, state, GAME_KEY.MENU, {x: right, y});
    drawText(context, 'Menu', r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    y += 30;
    r = renderControlFrames(context, state, GAME_KEY.UP, {x: 90, y});
    drawText(context, 'Move', r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    y += 30;
    r = renderControlFrames(context, state, GAME_KEY.WEAPON, {x: 60, y});
    drawText(context, 'Confirm/' + (savedData.weapon ? 'Chakram' : '???'), r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    y += 20;
    r = renderControlFrames(context, state, GAME_KEY.RIGHT_TOOL, {x: 60, y});
    renderControlFrames(context, state, GAME_KEY.LEFT_TOOL, {x: 40, y});
    drawText(context, 'Equip/Use Tools', r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    y += 20;
    r = renderControlFrames(context, state, GAME_KEY.PASSIVE_TOOL, {x: 60, y});
    drawText(context, 'Talk/Grab/' + (state.hero.magicRegen ? 'Run' : '???'), r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    /*y += 20;
    r = renderControlFrames(context, state, GAME_KEY.UP, {x: left, y});
    drawText(context, 'Move', r.x - 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'right',
        size: 16,
    });

    r = renderControlFrames(context, state, GAME_KEY.WEAPON, {x: right, y});
    drawText(context, (savedData.weapon ? 'Chakram' : '???') + '/Confirm', r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    y += 20;
    r = renderControlFrames(context, state, GAME_KEY.LEFT_TOOL, {x: left, y});
    drawText(context, 'Left Tool', r.x - 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'right',
        size: 16,
    });

    r = renderControlFrames(context, state, GAME_KEY.RIGHT_TOOL, {x: right, y});
    drawText(context, 'Right Tool', r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    y += 30;
    r = renderControlFrames(context, state, GAME_KEY.PASSIVE_TOOL, {x: 60, y});
    drawText(context, 'Talk/Grab/' + (state.hero.magicRegen ? 'Run' : '???'), r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });
    y += 30;*/

    y = 200;
    r = renderControlFrames(context, state, GAME_KEY.UP, {x: 40, y}, true);
    drawText(context, state.isUsingKeyboard ? 'Gamepad controls' : 'Keyboard controls', r.x + r.w + 2, r.y + r.h / 2, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });
}
