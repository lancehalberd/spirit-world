import { getRandomizerHint } from 'app/randomizer/utils';
import { isRandomizer } from 'app/gameConstants';
import { setScript } from 'app/scriptEvents';

import { GameState } from 'app/types';


export function showHint(state: GameState): void {
    if (isRandomizer) {
        setScript(state, getRandomizerHint(state));
        return;
    }
    const flags = state.savedState.objectFlags;
    if (!state.hero.weapon) {
        if (state.location.zoneKey !== 'peachCave') {
            setScript(state, `Maybe I should explore that cave I fell in more.
                {|}The entrance was just east of the waterfall north of the lake.`);
        } else {
            setScript(state, 'I need to find a way out of this cave.');
        }
    } else if (!state.hero.passiveTools.catEyes) {
        if (state.location.zoneKey !== 'peachCave') {
            setScript(state, `I wonder if that glowing peach is still in that cave?
                {|}The entrance was just east of the waterfall north of the lake.`);
        } else {
            setScript(state, 'With this Chakram I should be able to climb out of this cave.');
        }
    } else if (!state.savedState.objectFlags.momElder && !state.savedState.objectFlags.elderTomb) {
        if (state.location.zoneKey !== 'waterfallCave') {
            setScript(state, `I've been out for a long time, I should head home to the cave behind the waterfall.
                {|}The waterfall is just north of the lake.`);
        } else {
            setScript(state, `I should tell my mom about what happened in the cave.
                {|}I think I saw her by the pool at the entrance.`);
        }
    } else if (!state.savedState.objectFlags.elderTomb) {
        setScript(state, `I should talk to the Vanara Elder about my strange powers.
            {|}He lives in the woods to the southwest with the other Vanara. `);
    } else  if (!state.hero.activeTools.bow) {
        setScript(state, `The Vanara Elder said there was something I needed in his basement.
            {|}He lived in the southwest tree in the forest.`);
    } else if (!state.hero.passiveTools.roll) {
        if (state.location.zoneKey !== 'tomb') {
            setScript(state, `The elder said I could learn more about my powers if I explore the Vanara Tomb.
                {|}The Tomb is North of the woods in the Southwest.`);
        } else {
            setScript(state, `The elder said I could learn more about my powers if I explore this Tomb.`);
        }
    } else if (!state.hero.passiveTools.spiritSight) {
        if (state.location.zoneKey !== 'tomb') {
            setScript(state, `I need to finish exploring the Vanara Tomb to learn about my powers.
                {|}The Tomb is North of the woods in the Southwest.`);
        } else {
            setScript(state, `I need to finish exploring this Tomb to learn about my powers.`);
        }
    } else if (!state.savedState.objectFlags.momRuins && !flags.warTempleEntrance) {
        setScript(state, `I should go ask my mom if she knows anything about what the Vanara Guardian
            was talking about.
            {|}He said she might know a way for me to "touch the spirit world".`);
    } else if (!flags.warTempleEntrance) {
        setScript(state, `There must be some way to open the Temple in the southeastern ruins.
            {|}Maybe my new spirit sight will show the way.`);
    } else if (!state.hero.passiveTools.gloves) {
        setScript(state, `Maybe I can find something useful if I explore the ruins more.`);
    } else if (!state.hero.passiveTools.astralProjection) {
        setScript(state, `I'm sure I'll find what I need if I reach the top of the War Temple ruins.`);
    } else if (!flags.tombExit) {
        setScript(state, `The Guardian of the Tomb said to come back when I could "touch the spirit world".
            {|}There was a teleporter by the lake that will take me back to the Tomb.`);
    } else if (!state.hero.passiveTools.teleportation) {
        if (state.location.zoneKey === 'cocoon') {
            setScript(state, `There must be something important at the bottom of this strange cave.`);
        } else if (state.location.zoneKey === 'tomb') {
            setScript(state, `There must be something important in that strange cave behind this Tomb.`);
        } else {
            setScript(state, `There must be something important in that strange cave behind the Tomb.
                {|}There was a teleporter by the lake that will take me back to the Tomb.`);
        }
    } else if (!state.hero.activeTools.staff) {
        if (state.location.zoneKey !== 'helix') {
            setScript(state, `The Guardian said there is something called the 'Helix' beyond the Lake Tunnel.
                {|}With all my new spirit abilities, I should be able to get through now.`);
        } else {
            setScript(state, `The Guardian said I should seek answers at the top of this 'Helix'.`);
        }
    } else if (!state.hero.passiveTools.charge) {
        if (state.location.zoneKey === 'helix') {
            setScript(state, `Someone at the top of this Helix has the answers I'm looking for.`);
        } else {
            setScript(state, `Someone at the top of the Helix has the answers I'm looking for.
                {|}I should head back to that tunnel near the lake.`);
        }
    } else if (!flags.flameBeast || !flags.frostBeast) {
        setScript(state, `I need to explore the world and hunt down the escaped Spirit Beasts.
            {|}There is a portal to the spirit world in the Holy City to the northeast.`);
    } else if (state.hero.activeTools.cloak < 2) {
        setScript(state, `There is still something to find behind the waterfall at the top of the mountain.`);
    } else if (!state.hero.activeTools.clone) {
        setScript(state, `There is still something to find in the spirit world.`);
    } else {
        setScript(state, `Isn't there anywhere else interesting to go?
            {|}(The Storm Beast is coming soon. Want to play more now?
            {|}Try adding ?seed=20 to the url to play the randomizer).`);
    }
}

export function getMapTarget(state: GameState): {x: number, y: number} | null {
    if (isRandomizer) {
        return null;
    }
    const flags = state.savedState.objectFlags;
    if (!state.hero.weapon || !state.hero.passiveTools.catEyes) {
        // Mark the Peach Cave until they have both the Chakram and Cat Eyes.
        return {x: 96, y: 50};
    } else if (!state.savedState.objectFlags.momElder && !state.savedState.objectFlags.elderTomb) {
        // Talk to mom to get advice to see the Vanara Elder.
        return {x: 76, y: 32};
    } else if (!state.hero.activeTools.bow) {
        // Mark the Elder until the player picks up the bow.
        return {x: 24, y: 174};
    } else if (!state.hero.passiveTools.spiritSight) {
        // Mark the Tomb until the player has spirit sight.
        return {x: 16, y: 76};
    } else  if (!state.savedState.objectFlags.momRuins && !flags.warTempleEntrance) {
        // Talk to mom to get advice to explore the Summoner Ruins.
        return {x: 76, y: 32};
    } else if (!flags.warTempleEntrance) {
        return {x: 160, y: 170};
    } else if (!state.hero.passiveTools.gloves) {
        return {x: 160, y: 170};
    } else if (!state.hero.passiveTools.astralProjection) {
        return {x: 160, y: 170};
    } else if (!flags.tombExit) {
        return {x: 80, y: 118};
    } else if (!state.hero.passiveTools.teleportation) {
        return {x: 80, y: 118};
    } else if (!state.hero.activeTools.staff) {
        return {x: 80, y: 108};
    } else if (!state.hero.passiveTools.charge) {
        return {x: 80, y: 108};
    }
    return null;
}
