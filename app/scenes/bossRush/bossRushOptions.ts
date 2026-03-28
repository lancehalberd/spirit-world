import {Enemy} from 'app/content/enemy';
import {tombBossState, warTempleBoss, cocoonBossState, helixRivalStateBoss} from 'app/content/spawnStates';
import {updateHeroMagicStats} from 'app/render/spiritBar';
import {getRealSavedHeroData} from 'app/utils/alterHeroData';
import {hitTargets} from 'app/utils/field';
import {cloneDeep} from "app/utils/index";
import {addObjectToArea} from 'app/utils/objects';


export const bossRushConditions: BossRushCondition[] = [
    {
        key: 'confident',
        label: 'Confident',
        description: 'Compete without a Second Chance.',
        modifier: 1,
        apply(state: GameState) {
            state.hero.savedData.hasRevive = false;
        },
    },
    {
        key: 'weak',
        label: 'Dull Blade',
        description: 'No Chakram Upgrades.',
        modifier: 2,
        apply(state: GameState) {
            state.hero.savedData.weapon = 1;
            delete state.hero.savedData.weaponUpgrades.normalDamage;
            delete state.hero.savedData.weaponUpgrades.normalRange;
        },
    },
    {
        key: 'exposed',
        label: 'Exposed',
        description: 'No Armor or Blessings.',
        modifier: 3,
        apply(state: GameState) {
            delete state.hero.savedData.passiveTools.armor;
            delete state.hero.savedData.passiveTools.fireBlessing;
            delete state.hero.savedData.passiveTools.waterBlessing;
            delete state.hero.savedData.passiveTools.lightningBlessing;
        },
    },
    {
        key: 'daredevil',
        label: 'Dare Devil',
        description: 'Reduced Life.',
        modifier: 4,
        apply(state: GameState) {
            state.hero.life = state.hero.savedData.maxLife = 2;
            state.hero.savedData.ironSkinLife = 0;
            delete state.hero.savedData.passiveTools.ironSkin;
        },
    },
    {
        key: 'mundane',
        label: 'Mundane',
        description: 'No Spirit Energy.',
        modifier: 5,
        apply(state: GameState) {
            state.hero.isMagicDisabled = true;
            updateHeroMagicStats(state);
        },
    },
];

function getBoss(state: GameState, boss: BossType): Enemy {
    return state.areaInstance.objects.find(o => (o.definition as BossObjectDefinition).enemyType === boss) as Enemy;
}


const specialGolemState = cloneDeep(tombBossState.savedHeroData);
specialGolemState.hasRevive = false;
specialGolemState.weapon = 0;
specialGolemState.activeTools.bow = 0;
delete specialGolemState.leftTool;

const specialIdolsState = cloneDeep(warTempleBoss.savedHeroData);
specialIdolsState.hasRevive = false;
specialIdolsState.passiveTools.roll = 0;

const specialGuardianState = cloneDeep(cocoonBossState.savedHeroData);
specialGuardianState.hasRevive = false;
specialGuardianState.weapon = 0;
specialGuardianState.activeTools.bow = 0;
specialGuardianState.leftTool = 'cloak';
delete specialGuardianState.rightTool;

const specialRivalState = cloneDeep(helixRivalStateBoss.savedHeroData);
specialRivalState.hasRevive = false;
specialRivalState.activeTools.cloak = 0;
delete specialRivalState.rightTool;


const minute = 60000;

function fixBeetlePreview(state: GameState) {
    const boss = getBoss(state, 'beetleBoss');
    // Throw a copy of the boss in frame
    /*const boss = new Enemy(state, {
        type: 'boss',
        id: 'bossPreview',
        status: 'normal',
        saveStatus: 'never',
        enemyType: 'beetleBoss',
        lootType: 'empty',
        x: state.camera.x + 107,
        y: state.camera.y + 24,
    });*/
    boss.setMode('preview');
    addObjectToArea(state, state.areaInstance, boss);
}

function fixGuardianPreview(state: GameState) {
    // Throw a copy of the boss in frame
    const boss = new Enemy(state, {
        type: 'enemy',
        id: 'bossPreview',
        status: 'normal',
        saveStatus: 'never',
        enemyType: 'guardianProjection',
        x: 0,
        y: 0,
    });
    boss.scale = 2;
    boss.x = 256 - boss.w;
    boss.y = 256 - boss.h / 2;
    boss.setMode('preview');
    addObjectToArea(state, state.areaInstance, boss);
}
function fixFlameBeastPreview(state: GameState) {
    const boss = getBoss(state, 'flameBeast');
    boss.x = 256 + 8;
    boss.y = 256 + 32;
    // This should be a mode the renders the special lava pool instead of a regular shadow.
    boss.setMode('emerge');
}

export const allBossRushOptions: BossRushOption[] = [
    {
        label: 'Beetle',
        key: 'beetle',
        bosses: ['beetle'],
        karma: 1,
        targetTime: 0.5 * minute,
        fixPreview: fixBeetlePreview,
    },
    {
        label: 'Golem',
        key: 'golem',
        bosses: ['golem'],
        karma: 2,
        targetTime: 1 * minute,
    },
    {
        label: 'War Idols',
        key: 'idols',
        bosses: ['idols'],
        karma: 2,
        targetTime: 1.5 * minute,
    },
    {
        label: 'Guardian',
        key: 'guardian',
        bosses: ['guardian'],
        karma: 2,
        targetTime: 1.5 * minute,
        fixPreview: fixGuardianPreview,
    },
    {
        label: 'Saru',
        key: 'rival2',
        bosses: ['rival2'],
        karma: 4,
        targetTime: 1 * minute,
    },
    {
        label: 'Prototypes',
        key: 'forestTempleBoss',
        bosses: ['forestTempleBoss'],
        karma: 5,
        targetTime: 1 * minute,
    },
    {
        label: 'Collector',
        key: 'collector',
        bosses: ['collector'],
        karma: 5,
        targetTime: 1.5 * minute,
        fixPreview(state: GameState) {
            const boss = getBoss(state, 'crystalCollector');
            boss.changeToAnimation('idle')
            boss.setMode('choose');
        },
    },
    {
        label: 'Flame Beast',
        key: 'flameBeast',
        bosses: ['flameBeast'],
        karma: 10,
        targetTime: 2 * minute,
        fixPreview: fixFlameBeastPreview,
    },
    {
        label: 'Frost Beast',
        key: 'frostBeast',
        bosses: ['frostBeast'],
        karma: 10,
        targetTime: 2 * minute,
        fixPreview(state: GameState) {
            const boss = getBoss(state, 'frostBeast');
            boss.x = 256;
            boss.y = 256 + 48;
            // Destroy the ice where the serpent emerges.
            hitTargets(state, state.areaInstance, {
                element: 'fire',
                hitCircle: {
                    x: boss.x + boss.w / 2,
                    y: boss.y + 32,
                    r: 36,
                },
                hitTiles: true,
                source: boss,
            });
            boss.params.submerged = false;
            boss.setMode('choose');
        },
    },
    {
        label: 'Storm Beast',
        key: 'stormBeast',
        bosses: ['stormBeast'],
        karma: 10,
        targetTime: 2 * minute,
        fixPreview(state: GameState) {
            const boss = getBoss(state, 'stormBeast');
            boss.x = 256 + 48;
            boss.y = 256 - 128;
            boss.rotation = Math.PI / 6;
            boss.changeToAnimation('charging');
            boss.setMode('choose');
        },
    },
    {
        label: 'Rush 1',
        key: 'rush',
        bosses: ['beetle', 'golem', 'idols', 'guardian'],
        karma: 5,
        targetTime: 3 * minute,
        fixPreview: fixBeetlePreview,
    },
    {
        label: 'Rush 2',
        key: 'rush2',
        bosses: ['rival2', 'forestTempleBoss', 'collector'],
        karma: 10,
        targetTime: 3 * minute,
    },
    {
        label: 'Rush 3',
        key: 'rush3',
        bosses: ['flameBeast', 'frostBeast', 'stormBeast'],
        karma: 20,
        targetTime: 5 * minute,
        fixPreview: fixFlameBeastPreview,
    },
    {
        label: 'Odd Golem',
        key: 'altGolem',
        bosses: ['golem'],
        playerState: specialGolemState,
        karma: 20,
        targetTime: 1 * minute,
        // Also requires gloves to unlock.
        isVisible(state: GameState, realSavedHeroData: SavedHeroData) {
            return realSavedHeroData.passiveTools.gloves && (realSavedHeroData.karma >= 3);
        },
    },
    {
        label: 'Odd Idols',
        key: 'altIdols',
        bosses: ['idols'],
        playerState: specialIdolsState,
        karma: 30,
        targetTime: 1.5 * minute,
        isVisible(state: GameState, realSavedHeroData: SavedHeroData) {
            return realSavedHeroData.karma >= 4;
        },
    },
    {
        label: 'Odd Guardian',
        key: 'altGuardian',
        bosses: ['guardian'],
        playerState: specialGuardianState,
        karma: 50,
        targetTime: 3 * minute,
        isVisible(state: GameState, realSavedHeroData: SavedHeroData) {
            return realSavedHeroData.karma >= 1;
        },
        fixPreview: fixGuardianPreview,
    },
    {
        label: 'Odd Saru',
        key: 'altRival2',
        bosses: ['rival2'],
        playerState: specialRivalState,
        karma: 50,
        targetTime: 1.5 * minute,
        isVisible(state: GameState, realSavedHeroData: SavedHeroData) {
            return realSavedHeroData.karma >= 4;
        },
    },
];


const bossFlags: {[key in BossKey]?: string} = {
    // The first boss is always unlocked so that the boss rush menu can never be empty.
    beetle: undefined,
    golem: 'tombBoss',
    idols: 'warTempleBoss',
    guardian: 'cocoonBoss',
    rival2: 'helixRivalBoss',
    forestTempleBoss: 'forestTempleBoss',
    collector: 'waterfallTowerBoss',
    stormBeast: 'stormBeast',
    flameBeast: 'flameBeast',
    frostBeast: 'frostBeast',
};

export function isBossRushOptionVisible(state: GameState, bossRushOption: BossRushOption): boolean {
    const realSavedHeroData = getRealSavedHeroData(state);
    // You cannot enter a boss rush if you are missing the progress flag for defeating one of the bosses.
    // If there are special bosses that can only be encountered as a boss rush, the bossFlags values
    // can be set to a falsey value to skip this requirement.
    for (const bossKey of bossRushOption.bosses) {
        if (bossFlags[bossKey] && !state.savedState.objectFlags[bossFlags[bossKey]]) {
            return false;
        }
    }
    if (bossRushOption.isVisible) {
        return bossRushOption.isVisible(state, realSavedHeroData);
    }
    return true;
}
export function getBossRushOptions(state: GameState): BossRushOption[] {
    return allBossRushOptions.filter(bossRushOption => isBossRushOptionVisible(state, bossRushOption));
}
export function getBossRushOption(key: BossRushKey): BossRushOption {
    return allBossRushOptions.find(option => option.key === key);
}
