import { CHAKRAM_2_NAME } from 'app/gameConstants';
import { showMessage } from 'app/scriptEvents';
import { createAnimation } from 'app/utils/animations';
import { createCanvasAndContext } from 'app/utils/canvas';
import { requireFrame } from 'app/utils/packedImages';

const equipToolMessage = '{|}Press [B_MENU] to open your menu.'
    + '{|}Select a tool and press [B_TOOL] to assign it.';

const equipBootsMessage = '{|}Press [B_MENU] to open your menu.'
    + '{|}Select boots and press [B_WEAPON] to equip them.'
    + '{|}Press [B_WEAPON] again to unequip them.';

function getEquipElementMessage(state: GameState) {
    if (state.isUsingKeyboard) {
        return '{|}Press [B_MENU] to open your menu.'
            + '{|}Select an element and press [B_WEAPON] to equip it.'
            + '{|}Press [B_WEAPON] again to unequip the element.'
            + '{|}The equipped element will be applied any time you charge an attack.';
    }
    return '{|}Press [B_PREVIOUS_ELEMENT]/[B_NEXT_ELEMENT] to switch elements.';
}

function getChargeMessage(state: GameState) {
    return `{|}Press and hold [B_WEAPON] to channel your Spirit Energy into the Chakram,
        then release it to unleash a powerful attack!
        {|}Press and hold [B_TOOL] to channel your Spirit Energy into your Bow to make it more powerful.
        {|}Charged attacks will apply your currently selected element.
    `;
    // Only bow can be charged currently
    // {|}Press and hold [B_TOOL] to channel your Spirit Energy into your Tools to make them more powerful.
    // Not implemented yet.
    // {|}You can even hold [B_PASSIVE] when picking up an object to channel Spirit Energy into them!
}

export function getLootName(state: GameState, lootType: LootType, lootLevel?: number): string {
    if (!lootLevel) {
        lootLevel = state.hero.savedData.activeTools[lootType] || state.hero.savedData.passiveTools[lootType] || 1;
    }
    switch (lootType) {
        case 'bow':
            if (lootLevel === 1) {
                return 'Spirit Bow';
            }
            return 'Golden Bow';
        case 'cloak':
            if (lootLevel === 1) {
                return 'Spirit Cloak';
            }
            return 'Invisibility Cloak';
        case 'staff':
            if (lootLevel === 1) {
                return 'Tree Staff';
            }
            return 'Tower Staff';
        case 'clone':
            if (lootLevel === 1) {
                return 'Clone';
            }
            return 'Double Clone';
        case 'roll':
            if (lootLevel === 1) {
                return 'Mist Roll';
            }
            return 'Cloud Somersault';
        case 'gloves':
            if (lootLevel === 1) {
                return 'Spirit Bracers';
            }
            return 'Magical Bracers';
        case 'spiritPower':
            if (!state.hero.savedData.passiveTools.spiritSight) {
                return 'Spirit Sight';
            }
            if (!state.hero.savedData.passiveTools.astralProjection) {
                return 'Astral Projection';
            }
            return 'Teleportation';
        case 'weapon':
            if (lootLevel === 1) {
                return 'Chakram';
            }
            return CHAKRAM_2_NAME;
        case 'spiritSight': return 'Spirit Sight';
        case 'astralProjection': return 'Summoner\'s Circlet';
        case 'teleportation': return 'Teleportation';
        case 'neutral': return 'Neutral Element';
        case 'fire': return 'Fire Element';
        case 'ice': return 'Ice Element';
        case 'lightning': return 'Lightning Element';
        case 'phoenixCrown': return 'Phoenix Crown';
        case 'goldMail': return 'Golden Mail';
        case 'ironSkin': return 'Iron Skin';
        case 'catEyes': return 'Cat Eyes';
        case 'nimbusCloud': return 'Nimbus Cloud';
        case 'trueSight': return 'True Sight';
        case 'leatherBoots': return 'Leather Boots';
        case 'ironBoots': return 'Iron Boots';
        case 'cloudBoots': return 'Cloud Boots';
        case 'fireBlessing': return 'Fire Blessing';
        case 'waterBlessing': return 'Water Blessing';
        case 'lightningBlessing': return 'Ancient Badge';
        case 'silverOre': return 'Silver Ore';
        case 'goldOre': return 'Gold Ore';
    }
    return '?'+lootType;
}

export function getLootGetMessage(state: GameState, lootType: LootType, lootLevel?: number, lootAmount?: number): string {
    const lootName = getLootName(state, lootType, lootLevel);
    switch (lootType) {
        case 'cloudBoots':
        case 'ironBoots': return `You found the ${lootName}!` + equipBootsMessage;
        case 'bigKey': return 'You found a special key!';
        case 'smallKey': return 'You found a small key!';
        case 'map': return 'You found a map!';
        case 'peachOfImmortality': return 'You ate a Golden Peach!';
        case 'peachOfImmortalityPiece': return 'You found a Golden Peach Slice!';
        // Learned techniques
        case 'roll':
        case 'teleportation':
            return `You learned the ${lootName} Techique!`;
        case 'clone':
            return `You learned the ${lootName} Techique!` + equipToolMessage;
        // obtained tools
        case 'bow':
        case 'cloak':
            return `You have obtained the ${lootName}!` + equipToolMessage;
        case 'staff':
            if (!state.savedState.objectFlags.readTowerStaffMessage) {
                return `You have obtained the ${lootName}!` + equipToolMessage;
            } else {
                return `You have obtained the ${lootName}!`;
            }
        // blessed with passives
        case 'catEyes':
        case 'ironSkin':
        case 'spiritSight':
        case 'trueSight':
            return `You have been blessed with ${lootName}!`;
        // received elements
        case 'fire':
        case 'ice':
        case 'lightning':
            return `You have received the ${lootName}!` + getEquipElementMessage(state) + getChargeMessage(state);
        case 'fireBlessing': return 'You have received the Blessing of Fire!';
        case 'waterBlessing': return 'You have received the Blessing of Water!';
        case 'lightningBlessing': return `You have obtained the ${lootName}!`;
        case 'money': return `You found ${lootAmount || 1} Jade!`;
        case 'silverOre':
        case 'goldOre': return `You found some ${lootName}!`;
    }
    return `You found the ${lootName}!`;
}

export function getLootHelpMessage(state: GameState, lootType: LootType, lootLevel?: number, lootAmount?: number): string {
    switch (lootType) {
        case 'cloudBoots':
            return 'Use the Cloud Boots to glide over dangerous ground and even walk in the clouds!'
                + '{|}Cloud Boots allow you to move faster but with less control.';
        case 'ironBoots':
            return 'Use the Iron Boots to explore under water but watch your breath!'
                + '{|}Iron boots slow you down but keep you from slipping and being knocked back.';
        case 'weapon':
            if (state.hero.savedData.weapon === 1) {
                return `Press [B_WEAPON] to throw the Chakram.
                    {|}Use it to defeat enemies or destroy some obstacles.`;
            }
            return `The ${CHAKRAM_2_NAME} has improved range and damage.
                {|}But don't throw away your old Chakram just yet!
                {|}After throwing the ${CHAKRAM_2_NAME}, quickly press [B_WEAPON] again
                to throw your normal Chakram at the same time!`;
        case 'bow':
            if (state.hero.savedData.activeTools.bow === 1) {
                return 'Press [B_TOOL] to shoot a magic arrow.'
                    + '{|}Use the bow to hit distant enemies and objects.';
            }
            return `Press [B_TOOL] to shoot a magic arrow.
                    {|}This magical bow applies your equipped element to every shot.
                    {|}Charge the bow to shoot multiple arrows at once.`;
        case 'clone':
            if (state.hero.savedData.activeTools.clone === 1) {
                return 'Press [B_TOOL] to create a clone or switch between clones.'
                    + '{|}Hold [B_TOOL] to control all clones at once!'
                    + '{|}Hold [B_MEDITATE] to make a clone explode!';
            }
            return `Your clone technique now creates two clones!`;
        case 'cloak':
            if (state.hero.savedData.activeTools.cloak === 1) {
                return 'Press [B_TOOL] to create a Spirit Barrier around you.'
                    + '{|}The barrier will damage enemies and reflect projectiles at the cost of your Spirit Energy!'
                    + '{|}Your Spirit Energy will regenerate more slowly while the barrier is on,'
                    + '{|}and the barrier will fail if you run out of Spirit Energy.'
                    + '{|}Press [B_TOOL] again to deactivate the barrier.'
                    + '{|}Barrier Burst: Press and hold [B_TOOL] to detonate the barrier.';
            }
            return 'Use your Barrier Burst to become invisible.'
                + '{|}Press [B_TOOL] to create a Spirit Barrier.'
                + '{|}Hold [B_TOOL] to detonate your barrier and become invisible.'
                + '{|}Hold [B_TOOL] to remain invisible until your Spirit Energy runs out.'
                + '{|}Invisibility makes you undetectable and invulnerable to most damage.'
                + '{|}Your Spirit Energy will drain faster the longer you remain invisible.';
        case 'staff':
            if (state.hero.savedData.activeTools.staff === 1) {
                return 'Press [B_TOOL] to summon the staff and slam it to the ground.'
                    + '{|}You can use the staff as a weapon and a bridge!'
                    + '{|}Press [B_TOOL] again to summon the staff back to you.';
            }
            // Only show this message the first time the tower staff is obtained.
            if (state.savedState.objectFlags.readTowerStaffMessage) {
                return;
            }
            state.savedState.objectFlags.readTowerStaffMessage = true;
            return 'This Staff is unbelievably large and powerful!';
        case 'gloves':
            if (state.hero.savedData.passiveTools.gloves === 1) {
                return 'Now you can lift heavier objects.'
                    + '{|}Face an object and use [B_PASSIVE] to try to lift it.';
            }
            return 'Now you can lift even heavier objects.'
                + '{|}Face an object and use [B_PASSIVE] to try to lift it.';
        case 'roll':
            if (state.hero.savedData.passiveTools.roll === 1) {
                return 'Press [B_ROLL] to do a quick roll forward.'
                    + '{|}You can avoid most damage while rolling and cross small gaps.'
            }
            return `Press and hold [B_ROLL] to slow down time while rolling.
                {|}While time is slowed, press [B_DPAD] to teleport in any direction, damaging enemies in the way.
                {|}Continue holding [B_ROLL] to teleport more as long as you have spirit energy.
                `
        case 'catEyes':
            return 'This strange energy allows you to see much better in the dark.'
                + '{|}Using cat eyes consumes spirit energy, stand still to recover.'
        case 'spiritSight':
            return 'Hold [B_MEDITATE] to gaze into the Spirit World.'
                + '{|}If an object is in both the Material World and Spirit World,'
                + '{|}see what happens if you change it in the Material World!';
        case 'trueSight':
            return 'Now you can see objects that have been hidden between worlds.';
        case 'astralProjection':
            return 'Hold [B_MEDITATE] to gaze into the Spirit World.'
                + '{|}While looking into the Spirit World, use [B_UP] to move your Astral Body.'
                + '{|}Your Astral Body can touch the Spirit World.'
                + '{|}In your Astral Body, press [B_PASSIVE] to grab or pickup objects.';
        case 'teleportation':
            return 'Move your Astral Body away from you in the Sprit World'
                + '{|}Press [B_TOOL] to teleport your Real Body to your Astral Body.'
                + '{|}Teleportation consumes spirit energy, stand still to recover'
                + '{|}Use teleportation to move past obstacles in the Real World.';
        case 'neutral': return 'Neutral element uses less spirit energy with charged attacks.'
        case 'fire': return 'Fire can be used to light torches and melt ice.';
        case 'ice': return 'Ice can be used to freeze objects and enemies.';
        case 'lightning': return 'Lightning stuns enemies and activates some objects.';
        case 'fireBlessing':
            return 'Burning hot rooms will no longer damage you.'
                + '{|}You will also take half damage from fire.';
        case 'waterBlessing':
            return 'Being underwater will no longer drain your spirit energy or damage you.'
                + '{|}You will also take half damage from ice.';
        case 'lightningBlessing':
            return 'This ancient artifact halves the damage from lightning effects.';
        case 'goldMail': return 'This amazing armor reduces all damage you receive.';
        case 'phoenixCrown': return `The feather in this crown absorbs almost limitless energy from the spirit world.`;
        case 'ironSkin': return `The Iron Skin technique allows you to coat your skin
            with layers of Spirit Energy until it is as hard as iron!
            {|}Iron Skin will build up slowly over time as long as you take no damage.
            {|}Iron Skin will protect you from damage and many other effects!`;
        case 'nimbusCloud':
            return 'Use the Nimbus Cloud to quickly travel the world!'
                + '{|}Press [B_MENU] to open your menu.'
                + '{|}Select the Nimbus Cloud and press [B_WEAPON] to use it.'
                + '{|}Use the Nimbus Cloud inside to return to the entrance.'
                + '{|}Use the Nimbus Cloud outside to instantly travel the world.';
        case 'silverOre':
            return 'Maybe someone in the city can use this to make something.';
        case 'goldOre':
            return 'There must be someone in the world who can use this ore.';
    }
    return '';
}

export function showLootMessage(state: GameState, lootType: LootType, lootLevel?: number, lootAmount?: number): void {
    // Skip instructions during the randomizer.
    if (state.randomizer?.seed) {
        if (lootType === 'peachOfImmortalityPiece' && state.hero.savedData.peachQuarters === 0) {
            showMessage(state, '{item:peachOfImmortality}');
            return;
        }
        if (lootType === 'peachOfImmortality' && !state.hero.savedData.passiveTools.catEyes) {
            showMessage(state, '{item:catEyes}');
            return;
        }
        return;
    }
    const getMessage = getLootGetMessage(state, lootType, lootLevel, lootAmount);
    switch (lootType) {
        case 'bigKey':
            return showMessage(state, getMessage
                + '{|}This key can open all the special locks in this area!');
        case 'smallKey':
            if (!state.savedState.objectFlags.readSmallKeyMessage) {
                state.savedState.objectFlags.readSmallKeyMessage = true;
                return showMessage(state, getMessage + '{|}Use it to unlock one locked door.');
            }
            return;
        case 'map':
            return showMessage(state, getMessage
                + '{|}Press [B_MAP] to see the full map of this area!');
        case 'peachOfImmortality':
            if (!state.hero.savedData.passiveTools.catEyes) {
                return showMessage(state, `
                    ${getMessage}
                    {|} Your health has increased and you feel a strange energy...
                    {wait:200}{item:catEyes}`
                );
            }
            return showMessage(state, `${getMessage}{|} Your maximum health has increased!`);
        case 'peachOfImmortalityPiece':
            if (state.hero.savedData.peachQuarters === 1) {
                return showMessage(state, getMessage + '{|}Find three more to increase your health!');
            }
            if (state.hero.savedData.peachQuarters === 2) {
                return showMessage(state, getMessage + '{|}Find two more to increase your health!');
            }
            if (state.hero.savedData.peachQuarters === 3) {
                return showMessage(state, getMessage + '{|}Find one more to increase your health!');
            }
            // Finding the 4th slice grants a full peach of immortality.
            return showMessage(state, getMessage + '{item:peachOfImmortality}');
        
        case 'staff':
            if (state.hero.savedData.activeTools.staff & 2) {
                // Refresh the location to hide the tower.
                //enterLocation(state, state.location);
                state.areaInstance.needsLogicRefresh = true;
            }
            // Use default handling for first staff.
            break;
        case 'secondChance':
            if (!state.savedState.objectFlags.readSecondChanceMessage) {
                state.savedState.objectFlags.readSecondChanceMessage = true;
                return showMessage(state, 'You have been blessed with a Second Chance!'
                    + '{|}If you are defeated you will be revived one time.');
            }
            return;
    }
    const helpMessage = getLootHelpMessage(state, lootType, lootLevel, lootAmount);
    if (getMessage) {
        if (helpMessage) {
            return showMessage(state, getMessage + '{|}' + helpMessage);
        }
        return showMessage(state, getMessage);
    }
}


function createLootFrame(color: string, letter: string): Frame {
    const size = 16;
    const [toolCanvas, toolContext] = createCanvasAndContext(size, size);
    toolContext.fillStyle = color;
    toolContext.fillRect(0, 0, size, size);
    toolContext.fillStyle = 'white';
    toolContext.textBaseline = 'middle';
    toolContext.textAlign = 'center';
    toolContext.fillText(letter, size / 2, size / 2);
    return {image: toolCanvas, x: 0, y: 0, w: toolCanvas.width, h: toolCanvas.height};
}

export const [
    /*fullPeachFrame*/, goldPeachFrame,
    keyOutlineFrame, bigKeyOutlineFrame,
    bow, mistScrollFrame,
    spiritSightFrame,
    catEyes,
    twoCloneFrame, threeCloneFrame, /* fourCloneFrame */,
    /*invisibilityFrame*/,
    bracelet , gloveFrame,
    normalBoots, ironBoots, cloudBoots,
    circlet, phoenixCrown,
    teleportFrame, /* teleportFrame2 */,
    treeStaff, towerStaff,
    /* recycle */, /* book */, scroll1, /* scroll2 */, scroll3,
    nimbusCloud, trueSight,
    goldOre, silverOre,
    goldMedal, silverMedal, bronzeMedal,
    waterBlessing, fireBlessing, lightningBlessing,
    goldBow,
    silverChakram, goldChakram,
    goldMail, ironSkin,
] = createAnimation('gfx/hud/icons.png',
    {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}, {cols: 43}
).frames;
export const [
    /* container */, fireElement, iceElement, lightningElement, neutralElement, /* elementShine */
] = createAnimation('gfx/hud/elementhud.png',
    {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}}, {cols: 6}
).frames;

const [spiritCloak] = createAnimation('gfx/hud/cloak1.png',
    {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}
).frames;
const [invisibilityCloak] = createAnimation('gfx/hud/cloak2.png',
    {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}
).frames;

const [/*smallPeach*/, /*fullPeachFrame*/, /*threeQuartersPeach*/, /*halfPeach*/, /*quarterPeach*/, peachPieceFrame] =
    createAnimation('gfx/hud/peaches.png', {w: 18, h: 18}, {cols: 3, rows: 2}).frames;

const smallPeachFrame = requireFrame('gfx/hud/peaches.png', {x: 4, y: 3, w: 12, h: 12 });
const smallMoneyGeometry: FrameDimensions = {w: 16, h: 16, content:{ x: 4, y: 8, w: 8, h: 8}};
const largeMoneyGeometry: FrameDimensions = {w: 16, h: 16, content:{ x: 2, y: 4, w: 12, h: 12}};
const [
    smallShadow, bigShadow,
    /*smallLightHalf*/, /*smallDarkHalf*/,
    lightOrb, darkOrb,
    /* smallWhole*/,
] = createAnimation('gfx/hud/money.png', smallMoneyGeometry, {cols: 7}).frames;

const lootFrames = {
    smallKey: keyOutlineFrame,
    silverOre,
    goldOre,
    fire: fireElement,
    ice: iceElement,
    lightning: lightningElement,
    // Summoner's Circlet.
    astralProjection: circlet,
    phoenixCrown,
    goldMail,
    ironSkin,
    bigKey: bigKeyOutlineFrame,
    map: scroll1,
    catEyes: catEyes,
    charge: neutralElement,
    clone: twoCloneFrame,
    clone2: threeCloneFrame,
    invisibilityCloak,
    nimbusCloud,
    spiritCloak,
    trueSight,
    gloves: gloveFrame,
    bracelet,
    roll: mistScrollFrame,
    somersault: scroll3,
    staff: treeStaff,
    towerStaff,
    peach: smallPeachFrame,
    peachOfImmortality: goldPeachFrame,
    peachOfImmortalityPiece: peachPieceFrame,
    // Spirit Eyes
    spiritSight: spiritSightFrame,
    teleportation: teleportFrame,
    unknown: createLootFrame('black', '?'),
    empty: createLootFrame('grey', '--'),
    leatherBoots: normalBoots,
    ironBoots: ironBoots,
    cloudBoots: cloudBoots,
    fireBlessing,
    waterBlessing,
    lightningBlessing,
    // This is invisible for now, an effect is applied to the HUD representing this.
    secondChance: {image: createCanvasAndContext(16, 16)[0], x :0, y: 0, w: 16, h: 16},
} as const;

const [
    lightHalf, darkHalf, wholeCoin
] = createAnimation('gfx/hud/money.png', largeMoneyGeometry, {x: 7, cols: 3}).frames;
export function getLootFrame(state: GameState, {lootType, lootLevel, lootAmount}:
    {lootType: LootType, lootLevel?: number, lootAmount?: number}
): Frame {
    if (lootType === 'money') {
        if (!lootAmount || lootAmount === 1) {
            return lightOrb;
        }
        if (lootAmount === 5) {
            return darkOrb;
        }
        if (lootAmount === 10) {
            return lightHalf;
        }
        if (lootAmount === 20) {
            return darkHalf;
        }
        return wholeCoin;
    }
    if (lootType === 'weapon') {
        if (lootLevel === 1 || (lootLevel === 0 && !state.hero.savedData.weapon)){
            return silverChakram;
        }
        return goldChakram;
    }
    if (lootType === 'bow') {
        if (lootLevel === 1 || (lootLevel === 0 && !state.hero.savedData.activeTools.bow)){
            return bow;
        }
        return goldBow;
    }
    if (lootType === 'cloak') {
        if (lootLevel === 1 || (lootLevel === 0 && !state.hero.savedData.activeTools.cloak)){
            return lootFrames.spiritCloak;
        }
        return lootFrames.invisibilityCloak;
    }
    if (lootType === 'staff') {
        if (lootLevel === 1 || (lootLevel === 0 && !state.hero.savedData.activeTools.staff)){
            return lootFrames.staff;
        }
        return lootFrames.towerStaff;
    }
    if (lootType === 'clone') {
        if (lootLevel === 1 || (lootLevel === 0 && !state.hero.savedData.activeTools.clone)){
            return lootFrames.clone;
        }
        return lootFrames.clone2;
    }
    if (lootType === 'roll') {
        if (lootLevel === 1 || (lootLevel === 0 && !state.hero.savedData.passiveTools.roll)){
            return lootFrames.roll;
        }
        return lootFrames.somersault;
    }
    if (lootType === 'gloves') {
        if (lootLevel === 1 || (lootLevel === 0 && !state.hero.savedData.passiveTools.gloves)){
            return lootFrames.gloves;
        }
        return lootFrames.bracelet;
    }
    if (lootType === 'spiritPower') {
        if (!state.hero.savedData.passiveTools.spiritSight) {
            return lootFrames.spiritSight;
        }
        if (!state.hero.savedData.passiveTools.astralProjection) {
            return lootFrames.astralProjection;
        }
        return lootFrames.teleportation;
    }
    if (lootType === 'victoryPoint') {
        if (lootAmount >= 5) {
            return goldMedal;
        }
        if (lootAmount > 1) {
            return silverMedal;
        }
        return bronzeMedal;
    }
    return lootFrames[lootType] || lootFrames.unknown;
}

export function getLootShadowFrame({lootType, lootLevel, lootAmount}:
    {lootType: LootType, lootLevel?: number, lootAmount?: number}
): Frame {
    if (lootType === 'money') {
        if (!lootAmount || lootAmount <= 5) {
            return smallShadow;
        }
        return bigShadow;
    }
    if (lootType === 'peach') {
        return smallShadow;
    }
    return bigShadow;
}
