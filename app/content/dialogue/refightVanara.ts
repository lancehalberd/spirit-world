import { dialogueHash } from 'app/content/dialogue/dialogueHash';

export function travelToLocation(state: GameState, zoneKey: string, markerId: string): string {
  if (state.travel) {
    state.travel(zoneKey, markerId, {instant: false});
    return '';
  }
  console.log("Can't find travel function!")
}

dialogueHash.refightVanara = {
    key: 'refightVanara',
    mappedOptions: {
        chooseRefight : (state: GameState) => {
            return `{choice:Here for a fight?
                    |Yes:refightVanara.openMenu
                    |No:refightVanara.no
                    }`;
        },
        openMenu: (state: GameState) => {
            console.log(state.savedState.savedHeroData.bossRushTimes)
            state.menuIndex = 0;
            state.travel("bossRefights", "beetleRefight", {instant: true});
            state.scene = 'bossRush';
            return ''
        },
        no: '',
    },
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['refightVanara'],
            },
            text: [
                {
                    dialogueIndex: 195,
                    text: `I see you have fought many tough battles in your travels.
                    {|}If you want, I can let you reexperience any of them you want to refight.
                    {|}See how fast you can vanquish your old foes and set a new record!
                    {flag:refightVanara}`,
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
                    dialogueIndex: 200,
                    text:'{@refightVanara.chooseRefight}'
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['elementalBeastsEscaped'],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 199,
                    text:'{@refightVanara.chooseRefight1B}'
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
                    dialogueIndex: 198,
                    text:'{@refightVanara.chooseRefight1A}'
                },
            ],
        },

    ],
};
