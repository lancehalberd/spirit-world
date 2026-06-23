import {allLootTypes} from 'app/utils/loot';
import {parseMessage, textScriptToString} from 'app/utils/parseMessage';

export function parseScriptEvents(state: GameState, script: TextScript): ScriptEvent[] {
    let events: ScriptEvent[] = [];
    // Script is a bunch of text broken up by actions marked by brackets like `{weapon}`
    const textAndActions = textScriptToString(state, script).split(/[{}]/);
    while (textAndActions.length) {
        const text = textAndActions.shift();
        if (text) {
            const textEvents = parseScriptText(state, text);
            events = [...events, ...textEvents];
        }
        const actionToken = textAndActions.shift();
        if (!actionToken) {
            continue;
        }
        // This is just used to split text dialogue up, which happens automatically
        // for any action tokens now.
        if (actionToken === '|') {
            continue;
        }
        if (actionToken[0] === '@') {
            const [npcKey, scriptKey] = actionToken.substring(1).split('.');
            events.push({
                type: 'runDialogueScript',
                npcKey, scriptKey,
            });
            continue;
        }
        if (actionToken === 'rest') {
            events.push({ type: 'rest' });
            continue;
        }
        // {screenShake:2:0:2200}
        if (actionToken.startsWith('screenShake:')) {
            const paramToken = actionToken.substring('screenShake:'.length);
            const [dx, dy, duration] = paramToken.split(':').map(Number);
            events.push({ type: 'screenShake', dx, dy, duration });
            continue;
        }
        if (actionToken.startsWith('startScreenShake:')) {
            const paramToken = actionToken.substring('startScreenShake:'.length);
            const [dx, dy, id] = paramToken.split(':');
            events.push({ type: 'startScreenShake', dx: Number(dx), dy: Number(dy), id });
            continue;
        }
        if (actionToken.startsWith('stopScreenShake:')) {
            const id = actionToken.substring('stopScreenShake:'.length);
            events.push({ type: 'stopScreenShake', id });
            continue;
        }
        if (actionToken.startsWith('addCue:')) {
            const text = actionToken.substring('addCue:'.length);
            events.push({ type: 'addTextCue', text });
            continue;
        }
        if (actionToken.startsWith('addMapCue:')) {
            const text = actionToken.substring('addMapCue:'.length);
            events.push({ type: 'addTextCue', text, isMapCue: true });
            continue;
        }
        if (actionToken === 'removeCue') {
            events.push({ type: 'removeTextCue' });
            continue;
        }
        if (actionToken.startsWith('choice:')) {
            const choiceToken = actionToken.substring('choice:'.length);
            //console.log(choiceToken);
            const [prompt, ...optionStrings] = choiceToken.split('|');
            const choices = optionStrings.map(o => {
                const [text, key] = o.trim().split(':');
                return { text, key };
            })
            //console.log(prompt, choices);
            events.push({
                type: 'clearTextBox',
            });
            events.push({
                type: 'showChoiceBox',
                // We don't support multiple pages on the prompt, we just grow
                // it vertically.
                prompt: parseScriptAsTextPage(state, prompt),
                choices,
            });
            continue;
        }
        if (actionToken.startsWith('flag:')) {
            const valueToken = actionToken.substring('flag:'.length);
            const [flag, value] = valueToken.split('=');
            const valueNumber = parseInt(value, 10);
            events.push({
                type: 'setFlag',
                flag: flag.trim(),
                value: isNaN(valueNumber) ? (value || true) : valueNumber,
            });
            events.push({
                type: 'refreshAreaLogic',
            });
            continue;
        }
        if (actionToken.startsWith('clearFlag:')) {
            const flag = actionToken.substring('clearFlag:'.length);
            events.push({
                type: 'clearFlag',
                flag: flag.trim(),
            });
            events.push({
                type: 'refreshAreaLogic',
            });
            continue;
        }
        if (actionToken.startsWith('clearTextBox')) {
            events.push({
                type: 'clearTextBox',
            });
            continue;
        }
        if (actionToken.startsWith('playSound:')) {
            const sound = actionToken.substring('playSound:'.length);
            events.push({
                type: 'playSound',
                sound,
            });
            continue;
        }
        if (actionToken.startsWith('playTrack:')) {
            const track = actionToken.substring('playTrack:'.length) as TrackKey;
            events.push({
                type: 'playTrack',
                track: track,
            });
            continue;
        }
        if (actionToken.startsWith('stopTrack')) {
            events.push({
                type: 'stopTrack',
            });
            continue;
        }
        if (actionToken.startsWith('item:')) {
            const valueToken = actionToken.substring('item:'.length);
            const [lootType, amountOrLevel] = valueToken.split('=');
            if (!allLootTypes.includes(lootType as LootType)) {
                throw new Error('Unknown loot type: ' + lootType);
            }
            const number = parseInt(amountOrLevel, 10);
            events.push({ type: 'clearTextBox' });
            events.push({
                type: 'gainLoot',
                lootDefinition: {
                    lootType: lootType as LootType,
                    lootLevel: isNaN(number) ? 0 : number,
                    lootAmount: isNaN(number) ? 0 : number,
                },
            });
            events.push({
                type: 'wait',
                blocksInput: true,
                // This must be long enough to let the get loot animation reach
                // adding the loot message to the front of the script queue.
                duration: 1000,
            });
            continue
        }
        if (actionToken.startsWith('buy:')) {
            const valueToken = actionToken.substring('buy:'.length);
            const [cost, successScript, failScript] = valueToken.split(':');
            events.push({
                type: 'attemptPurchase',
                cost: parseInt(cost, 10),
                successScript,
                failScript,
            });
            continue;
        }
        if (actionToken.startsWith('wait:')) {
            const valueToken = actionToken.substring('wait:'.length);
            let duration = parseInt(valueToken, 10);
            if (isNaN(duration)) {
                duration = 1000;
            }
            events.push({
                type: 'wait',
                blocksInput: true,
                duration,
            });
            continue
        }
        if (actionToken.startsWith('timeout:')) {
            const valueToken = actionToken.substring('timeout:'.length);
            let duration = parseInt(valueToken, 10);
            if (isNaN(duration)) {
                duration = 1000;
            }
            events.push({
                type: 'wait',
                duration,
            });
            continue
        }
        console.error('Unhandled action token', actionToken);
    }
    if (events.length) {
        //console.log('extra clear textbox');
        //console.log([...events]);
        // events.push({ type: 'clearTextBox' });
    }
    return events;
}

export function parseScriptAsTextPage(state: GameState, script: TextScript): TextPage {
    const textPages = parseScriptAsTextPages(state, script);
    const textPage: TextPage = {
        textRows: [],
        frames: [],
    }
    for (const page of textPages) {
        textPage.textRows = [...textPage.textRows, ...page.textRows];
        textPage.frames = [...textPage.frames, ...page.frames];
    }
    return textPage;
}

export function parseScriptAsTextPages(state: GameState, script: TextScript): TextPage[] {
    let textPages: TextPage[] = [];
    // Script is a bunch of text broken up by actions marked by brackets like `{weapon}`
    const textAndActions = textScriptToString(state, script).split(/[{}]/);
    while (textAndActions.length) {
        const text = textAndActions.shift();
        if (text) {
            const textEvents = parseScriptText(state, text);
            for (const event of textEvents) {
                textPages = [...textPages, ...event.textPages];
            }

        }
        // Skip any actions found in the text
        const actionToken = textAndActions.shift();
        if (actionToken && actionToken !== '|') {
            console.warn('Attempted to process a script as a simple message', script);
        }
    }
    return textPages;
}

export function parseScriptText(state: GameState, text: TextScript, blocksUpdates = true): ShowTextBoxScriptEvent[] {
    const events: ShowTextBoxScriptEvent[] = [];
    const pages = parseMessage(state, text);
    if (pages.length) {
        events.push({
            type: 'showTextBox',
            textPages: pages,
            blocksUpdates,
        });
    }
    return events;
}
