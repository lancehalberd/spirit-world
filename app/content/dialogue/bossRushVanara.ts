import {returnToBossRushMenu, showBossRushScene} from 'app/scenes/bossRush/showBossRushScene';
import {dialogueHash} from 'app/content/dialogue/dialogueHash';


dialogueHash.bossRushVanara = {
    key: 'bossRushVanara',
    mappedOptions: {
        chooseRefight : (state: GameState) => {
            return `{choice:Here for a fight?
                    |Yes:bossRushVanara.openMenu
                    |No:bossRushVanara.no
                    }`;
        },
        openMenu: (state: GameState) => {
            showBossRushScene(state)
            return ''
        },
        quitMenu: (state: GameState) => {
            return `{choice: Quit?|No:bossRushVanara.no|Yes:bossRushVanara.quit}`;
        },
        quit: (state: GameState) => {
            returnToBossRushMenu(state);
            return ``;
        },
        no: '',
    },
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['bossRushVanara'],
            },
            text: [

                {
                    dialogueIndex: 234,
                    text: `Training in the Dreaming is no substitute for the real thing,
                    but you can still learn a lot by practicing here.`,
                },
                {
                    dialogueIndex: 235,
                    dialogueType: 'quest',
                    text: `I see you have fought many tough battles in your travels.
                    {|}Do you want a chance to prove yourself against old foes?
                    {|}Show us how fast you can vanquish them and set a new record!
                    {flag:bossRushVanara}`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 236,
                    dialogueType: 'subquest',
                    text:'{@bossRushVanara.chooseRefight}'
                },
            ],
        },
    ],
};
