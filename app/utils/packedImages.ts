import { requireImage } from 'app/utils/images';


/**
 * Example usage:
 * Delete existing packed images and compile the game and run it.
 * In the console, run a line like this to pack certain images:

tilePacks = packSprites('gfx', 16, 64, 160);
debugCanvas(tilePacks[0].image, 1); // Right click and save this image to match the unique file name above
serializePackedImage(tilePacks[0]); // Copy this string into an imagePack object below and set a unique file name

 * Note that this size: (16 * 160) * (16 * 64) = (1024 * 2.5) * 1024 < 3 * 1024 * 1024
 * Where 3 mega pixels is the max image size for PNGs on devices with less than 256MB of RAM according to:
 * https://help.yoyogames.com/hc/en-us/articles/360011530032-HTML5-Resource-Limits-For-Browser-Games-On-iOS
 * In theory we could go all the way to 16 * 192, but I feel more comfortable being well under this limit.
 *
 */

const imagePacks: PackedImageData[] = [
{
    image: requireImage('gfx/packed_images/packed-tiles.png'),
    packedImages: [
        {x:0,y:0,w:80,h:16,originalSource:'gfx/tiles/bush.png'},
        {x:80,y:0,w:192,h:16,originalSource:'gfx/tiles/rocks.png'},
        {x:272,y:0,w:112,h:16,originalSource:'gfx/tiles/thorns.png'},
        {x:384,y:0,w:80,h:16,originalSource:'gfx/tiles/bushspirit.png'},
        {x:464,y:0,w:176,h:16,originalSource:'gfx/tiles/rocksspirit.png'},
        {x:640,y:0,w:112,h:16,originalSource:'gfx/tiles/thornsspirit.png'},
        {x:752,y:0,w:144,h:16,originalSource:'gfx/tiles/spiritplants.png'},
        {x:0,y:16,w:496,h:256,originalSource:'gfx/tiles/crystalcavesheet.png'},
        {x:896,y:0,w:48,h:32,originalSource:'gfx/tiles/crystalgrateplain.png'},
        {x:496,y:16,w:128,h:128,originalSource:'gfx/tiles/deserttiles.png'},
        {x:624,y:16,w:128,h:128,originalSource:'gfx/tiles/ceilingtilesfancystone.png'},
        {x:944,y:0,w:80,h:100,originalSource:'gfx/tiles/nicestonebuilding.png'},
        {x:496,y:144,w:496,h:256,originalSource:'gfx/tiles/stonetileset.png'},
        {x:752,y:16,w:128,h:128,originalSource:'gfx/tiles/ceilingtiles.png'},
        {x:0,y:272,w:256,h:96,originalSource:'gfx/tiles/stonebuildingtileset.png'},
        {x:0,y:368,w:464,h:256,originalSource:'gfx/tiles/woodhousetilesarranged.png'},
        {x:464,y:400,w:528,h:48,originalSource:'gfx/tiles/rockwalltiles.png'},
        {x:464,y:448,w:336,h:16,originalSource:'gfx/tiles/cavefloor.png'},
        {x:464,y:464,w:336,h:16,originalSource:'gfx/tiles/cavefloorspirit.png'},
        {x:464,y:480,w:448,h:160,originalSource:'gfx/tiles/cavewalls.png'},
        {x:256,y:272,w:224,h:16,originalSource:'gfx/tiles/grass.png'},
        {x:0,y:624,w:352,h:160,originalSource:'gfx/tiles/cavewalls2temp.png'},
        {x:880,y:16,w:16,h:16,originalSource:'gfx/tiles/iceTile.png'},
        {x:880,y:32,w:64,h:32,originalSource:'gfx/tiles/rails.png'},
        {x:256,y:288,w:128,h:80,originalSource:'gfx/tiles/deeptoshallowwater.png'},
        {x:352,y:640,w:128,h:80,originalSource:'gfx/tiles/shallowtodeepwater1.png'},
        {x:480,y:640,w:128,h:80,originalSource:'gfx/tiles/watershore.png'},
        {x:608,y:640,w:128,h:80,originalSource:'gfx/tiles/blackmaskground.png'},
        {x:736,y:640,w:128,h:80,originalSource:'gfx/tiles/cloud.png'},
        {x:384,y:288,w:96,h:64,originalSource:'gfx/tiles/vines.png'},
        {x:352,y:720,w:240,h:176,originalSource:'gfx/tiles/treesheet.png'},
        {x:592,y:720,w:240,h:176,originalSource:'gfx/tiles/knobbytrees.png'},
        {x:880,y:64,w:48,h:16,originalSource:'gfx/tiles/clifffloors.png'},
        {x:880,y:80,w:48,h:64,originalSource:'gfx/tiles/exteriorstairs.png'},
        {x:832,y:720,w:176,h:96,originalSource:'gfx/tiles/shadowtiles.png'},
        {x:0,y:896,w:496,h:256,originalSource:'gfx/tiles/cavearranged.png'},
        {x:928,y:64,w:16,h:16,originalSource:'gfx/tiles/eyemonsterbase.png'},
        {x:912,y:448,w:96,h:48,originalSource:'gfx/tiles/crystalbeadpiles.png'},
        {x:864,y:640,w:128,h:80,originalSource:'gfx/tiles/lava.png'},
        {x:0,y:784,w:128,h:80,originalSource:'gfx/tiles/lavaStone.png'},
        // This has been updated.
        //{x:912,y:496,w:80,h:64,originalSource:'gfx/tiles/spiritfloor.png'},
        {x:928,y:112,w:80,h:16,originalSource:'gfx/tiles/cactussheet.png'},
        {x:928,y:80,w:16,h:16,originalSource:'gfx/tiles/pit.png'},
        {x:128,y:784,w:224,h:16,originalSource:'gfx/tiles/grassspirit.png'},
        {x:928,y:96,w:16,h:4,originalSource:'gfx/tiles/spiritparticlesregeneration.png'},
        {x:1008,y:112,w:16,h:18,originalSource:'gfx/tiles/movablepot.png'},
        {x:992,y:144,w:32,h:128,originalSource:'gfx/tiles/trapdoor.png'},
        {x:480,y:272,w:16,h:80,originalSource:'gfx/tiles/ladder.png'},
        {x:992,y:272,w:16,h:19,originalSource:'gfx/tiles/signshort.png'},
        {x:1008,y:272,w:16,h:19,originalSource:'gfx/tiles/shortsignspirit.png'},
        {x:992,y:304,w:16,h:19,originalSource:'gfx/tiles/signtall.png'},
        {x:1008,y:304,w:16,h:19,originalSource:'gfx/tiles/signtallspirit.png'},
        {x:0,y:864,w:256,h:32,originalSource:'gfx/tiles/spirit_regeneration_bottom.png'},
        {x:496,y:896,w:256,h:32,originalSource:'gfx/tiles/spirit_regeneration_middle.png'},
        {x:752,y:896,w:256,h:32,originalSource:'gfx/tiles/spirit_regeneration_front.png'},
        {x:384,y:352,w:112,h:16,originalSource:'gfx/tiles/crystalgrate.png'},
        {x:928,y:128,w:32,h:16,originalSource:'gfx/tiles/toggletiles.png'},
        {x:496,y:928,w:416,h:36,originalSource:'gfx/tiles/locked_tile_small.png'},
        {x:496,y:976,w:416,h:36,originalSource:'gfx/tiles/locked_tile.png'},
        {x:800,y:448,w:64,h:16,originalSource:'gfx/tiles/rollingboulder.png'},
        {x:800,y:464,w:64,h:16,originalSource:'gfx/tiles/rollingboulderspirit.png'},
        {x:992,y:336,w:32,h:48,originalSource:'gfx/tiles/savepoint.png'},
        {x:128,y:800,w:176,h:18,originalSource:'gfx/tiles/tippablepot.png'},
        {x:912,y:560,w:112,h:52,originalSource:'gfx/tiles/vinebase.png'},
        {x:832,y:816,w:64,h:64,originalSource:'gfx/tiles/waterfalltilesdeep.png'},
        {x:896,y:816,w:64,h:80,originalSource:'gfx/tiles/pod.png'}
    ],
},

{
    image: requireImage('gfx/packed_images/packed-etc.png'),
    packedImages: [
        {x:0,y:0,w:1024,h:432,originalSource:'gfx/temporary_tiles/temp_furniture.png'},
        {x:0,y:432,w:256,h:256,originalSource:'gfx/temporary_tiles/temp_woodAndFood.png'},
        {x:256,y:432,w:96,h:32,originalSource:'gfx/temporary_tiles/temp_laundry32.png'},
        {x:352,y:432,w:30,h:3,originalSource:'gfx/effects/particles_beads.png'},
        {x:384,y:432,w:15,h:5,originalSource:'gfx/effects/goldparticles.png'},
        {x:400,y:432,w:80,h:10,originalSource:'gfx/effects/aura_particles.png'},
        {x:480,y:432,w:18,h:6,originalSource:'gfx/effects/dust_particles.png'},
        {x:512,y:432,w:42,h:6,originalSource:'gfx/effects/revive_particles.png'},
        {x:560,y:432,w:240,h:24,originalSource:'gfx/effects/enemyfall.png'},
        {x:800,y:432,w:176,h:20,originalSource:'gfx/effects/watersplash.png'},
        {x:256,y:464,w:260,h:22,originalSource:'gfx/effects/enemyfall2.png'},
        {x:256,y:496,w:752,h:16,originalSource:'gfx/hud/whiteFont8x16.png'},
        {x:0,y:688,w:774,h:18,originalSource:'gfx/hud/icons.png'},
        {x:528,y:464,w:120,h:20,originalSource:'gfx/hud/elementhud.png'},
        {x:976,y:432,w:18,h:18,originalSource:'gfx/hud/cloak1.png'},
        {x:656,y:464,w:18,h:18,originalSource:'gfx/hud/cloak2.png'},
        {x:256,y:512,w:54,h:90,originalSource:'gfx/hud/peaches.png'},
        {x:352,y:448,w:160,h:16,originalSource:'gfx/hud/money.png'},
        {x:688,y:464,w:144,h:16,originalSource:'gfx/hud/magicbar.png'},
        {x:320,y:512,w:320,h:20,originalSource:'gfx/hud/revive.png'},
        {x:832,y:464,w:36,h:20,originalSource:'gfx/objects/chest.png'},
        {x:640,y:512,w:72,h:40,originalSource:'gfx/objects/chest2.png'},
        {x:0,y:720,w:810,h:90,originalSource:'gfx/effects/45radiusburst.png'},
        {x:320,y:544,w:320,h:48,originalSource:'gfx/effects/arrow.png'},
        {x:640,y:560,w:320,h:48,originalSource:'gfx/effects/spiritarrow.png'},
        {x:720,y:512,w:216,h:10,originalSource:'gfx/effects/wukongbowcharging.png'},
        {x:1008,y:432,w:9,h:12,originalSource:'gfx/effects/shard1.png'},
        {x:512,y:448,w:9,h:12,originalSource:'gfx/effects/shard2.png'},
        {x:528,y:448,w:16,h:16,originalSource:'gfx/hud/mcIcon.png'},
        {x:880,y:464,w:72,h:26,originalSource:'gfx/mc/facing.png'},
        {x:944,y:512,w:80,h:28,originalSource:'gfx/mc/mcfacingshallow.png'},
        {x:720,y:528,w:80,h:28,originalSource:'gfx/mc/mchurt.png'},
        {x:800,y:528,w:80,h:28,originalSource:'gfx/mc/mc_kneel.png'},
        {x:320,y:592,w:80,h:28,originalSource:'gfx/mc/mc_death.png'},
        {x:784,y:608,w:160,h:112,originalSource:'gfx/mc/mcwalking.png'},
        {x:816,y:720,w:160,h:112,originalSource:'gfx/mc/mcwalkingshallow.png'},
        {x:0,y:816,w:160,h:224,originalSource:'gfx/mc/mcchakramwalkcharge.png'},
        {x:160,y:816,w:160,h:224,originalSource:'gfx/mc/mcbowwalk.png'},
        {x:320,y:816,w:100,h:112,originalSource:'gfx/mc/mcchakramthrow.png'},
        {x:432,y:816,w:100,h:112,originalSource:'gfx/mc/mcchakramthrowshallow.png'},
        {x:544,y:816,w:100,h:112,originalSource:'gfx/mc/mcroll.png'},
        {x:656,y:816,w:160,h:112,originalSource:'gfx/mc/mccarrypushpull.png'},
        {x:816,y:832,w:160,h:112,originalSource:'gfx/mc/mcpushpullshallow.png'},
        {x:320,y:928,w:160,h:112,originalSource:'gfx/mc/mc4directionliftwalk.png'},
        {x:400,y:592,w:180,h:28,originalSource:'gfx/mc/mcclimb.png'},
        {x:480,y:928,w:160,h:112,originalSource:'gfx/mc/wukongswim.png'},
        {x:640,y:928,w:160,h:112,originalSource:'gfx/mc/spiritmovesheet.png'},
        {x:800,y:944,w:160,h:112,originalSource:'gfx/mc/spiritholdpushsheet.png'},
        {x:0,y:1040,w:160,h:112,originalSource:'gfx/mc/spiritpullsheet.png'},
        {x:256,y:624,w:260,h:28,originalSource:'gfx/mc/mcfall.png'},
        {x:592,y:608,w:160,h:25,originalSource:'gfx/effects/cloudfall.png'},
        {x:160,y:1040,w:96,h:64,originalSource:'gfx/mc/aura.png'},
        {x:256,y:1040,w:96,h:64,originalSource:'gfx/mc/aura_fire.png'},
        {x:352,y:1040,w:96,h:64,originalSource:'gfx/mc/aura_ice.png'},
        {x:448,y:1040,w:96,h:64,originalSource:'gfx/mc/aura_lightning.png'},
        {x:0,y:1152,w:870,h:28,originalSource:'gfx/mc/bow1.png'},
        {x:0,y:1184,w:870,h:28,originalSource:'gfx/mc/bow2.png'},
        {x:0,y:1216,w:1024,h:32,originalSource:'gfx/effects/cloak_throw.png'},
        {x:256,y:656,w:399,h:28,originalSource:'gfx/mc/wukong_staff_mc.png'},
        {x:544,y:448,w:16,h:16,originalSource:'gfx/shadow.png'},
        {x:1008,y:448,w:16,h:16,originalSource:'gfx/smallshadow.png'},
        {x:960,y:464,w:60,h:28,originalSource:'gfx/shallowloop.png'},
        {x:0,y:1248,w:928,h:32,originalSource:'gfx/effects/cloak.png'},
        {x:544,y:1040,w:180,h:20,originalSource:'gfx/effects/enemydeath.png'},
        {x:736,y:1056,w:252,h:28,originalSource:'gfx/effects/powersource_explosion.png'},
        {x:880,y:528,w:54,h:18,originalSource:'gfx/enemies/snek.png'},
        {x:960,y:544,w:54,h:18,originalSource:'gfx/enemies/snekred.png'},
        {x:960,y:576,w:54,h:18,originalSource:'gfx/enemies/snekblue.png'},
        {x:0,y:1280,w:160,h:280,originalSource:'gfx/enemies/miniStatueBoss-ice-32x40.png'},
        {x:160,y:1280,w:160,h:280,originalSource:'gfx/enemies/miniStatueBoss-lightning-32x40.png'},
        {x:320,y:1280,w:160,h:280,originalSource:'gfx/enemies/miniStatueBoss-fire-32x40.png'},
        {x:944,y:608,w:72,h:85,originalSource:'gfx/enemies/genericbeetle.png'},
        {x:880,y:1088,w:72,h:85,originalSource:'gfx/enemies/goldenbeetle.png'},
        {x:688,y:480,w:90,h:10,originalSource:'gfx/enemies/smallbeetle.png'},
        {x:928,y:1248,w:88,h:144,originalSource:'gfx/enemies/hornedbeetle.png'},
        {x:656,y:640,w:88,h:18,originalSource:'gfx/enemies/flyingbeetle.png'},
        {x:976,y:704,w:40,h:38,originalSource:'gfx/enemies/ent.png'},
        {x:544,y:1072,w:72,h:68,originalSource:'gfx/enemies/drone.png'},
        {x:480,y:1280,w:160,h:156,originalSource:'gfx/enemies/sentrybot.png'},
        {x:640,y:1280,w:96,h:144,originalSource:'gfx/enemies/electricsquirrel.png'},
        {x:736,y:1280,w:96,h:144,originalSource:'gfx/enemies/superelectricsquirrel.png'},
        {x:832,y:1280,w:96,h:144,originalSource:'gfx/enemies/brownsquirrel.png'},
        {x:160,y:1104,w:272,h:16,originalSource:'gfx/enemies/eyemonster.png'},
        {x:480,y:1440,w:504,h:36,originalSource:'gfx/enemies/bat1-Sheet.png'},
        {x:0,y:1568,w:600,h:78,originalSource:'gfx/enemies/eyeboss2.png'},
        {x:0,y:1648,w:576,h:94,originalSource:'gfx/effects/monstershield.png'},
        {x:480,y:1488,w:272,h:72,originalSource:'gfx/effects/golemshield.png'},
        {x:784,y:480,w:24,h:8,originalSource:'gfx/effects/crystalwallparticles.png'},
        {x:528,y:624,w:64,h:28,originalSource:'gfx/effects/crystalwallparticles2.png'},
        {x:608,y:1568,w:320,h:48,originalSource:'gfx/enemies/golem.png'},
        {x:624,y:1088,w:144,h:32,originalSource:'gfx/enemies/icePlant.png'},
        {x:160,y:1120,w:216,h:23,originalSource:'gfx/enemies/turret.png'},
        {x:928,y:1488,w:96,h:288,originalSource:'gfx/npcs/24x36-mom.png'},
        {x:608,y:1616,w:96,h:288,originalSource:'gfx/npcs/24x36-guy.png'},
        {x:704,y:1616,w:96,h:288,originalSource:'gfx/npcs/24x36-guy2.png'},
        {x:800,y:1616,w:96,h:288,originalSource:'gfx/npcs/24x36-gal.png'},
        {x:0,y:1744,w:96,h:288,originalSource:'gfx/npcs/24x36-gal2.png'},
        {x:96,y:1744,w:96,h:288,originalSource:'gfx/npcs/24x36-paleMonk.png'},
        {x:192,y:1744,w:96,h:288,originalSource:'gfx/npcs/24x36-midMonk.png'},
        {x:288,y:1744,w:96,h:288,originalSource:'gfx/npcs/24x36-darkMonk.png'},
        {x:384,y:1744,w:84,h:128,originalSource:'gfx/npcs/21x32-zoro.png'},
        {x:768,y:1088,w:72,h:26,originalSource:'gfx/npcs/vanara-black-facing.png'},
        {x:384,y:1872,w:160,h:112,originalSource:'gfx/npcs/vanara-black-walking.png'},
        {x:432,y:1104,w:72,h:26,originalSource:'gfx/npcs/vanara-blue-facing.png'},
        {x:544,y:1904,w:160,h:112,originalSource:'gfx/npcs/vanara-blue-walking.png'},
        {x:624,y:1120,w:72,h:26,originalSource:'gfx/npcs/vanara-purple-facing.png'},
        {x:704,y:1904,w:160,h:112,originalSource:'gfx/npcs/vanara-purple-walking.png'},
        {x:704,y:1120,w:72,h:26,originalSource:'gfx/npcs/vanara-brown-facing.png'},
        {x:864,y:1904,w:160,h:112,originalSource:'gfx/npcs/vanara-brown-walking.png'},
        {x:784,y:1120,w:72,h:26,originalSource:'gfx/npcs/vanara-gold-facing.png'},
        {x:384,y:1984,w:160,h:112,originalSource:'gfx/npcs/vanara-gold-walking.png'},
        {x:880,y:1184,w:72,h:26,originalSource:'gfx/npcs/vanara-gray-facing.png'},
        {x:544,y:2016,w:160,h:112,originalSource:'gfx/npcs/vanara-gray-walking.png'},
        {x:928,y:1392,w:72,h:26,originalSource:'gfx/npcs/vanara-red-facing.png'},
        {x:704,y:2016,w:160,h:112,originalSource:'gfx/npcs/vanara-red-walking.png'},
        {x:592,y:592,w:32,h:16,originalSource:'gfx/effects/shockwave.png'},
        {x:0,y:2032,w:320,h:384,originalSource:'gfx/enemies/boss_golem_bodynew.png'},
        {x:320,y:2128,w:320,h:64,originalSource:'gfx/enemies/golem_hand_slam.png'},
        {x:640,y:2128,w:384,h:64,originalSource:'gfx/enemies/golem_hand_base.png'},
        {x:320,y:2192,w:384,h:64,originalSource:'gfx/enemies/golem_hand_crack.png'},
        {x:704,y:2192,w:288,h:192,originalSource:'gfx/enemies/spiritboss.png'},
        {x:320,y:2256,w:240,h:48,originalSource:'gfx/effects/eyespike.png'},
        {x:0,y:2416,w:816,h:48,originalSource:'gfx/effects/crystalpod.png'},
        {x:0,y:2464,w:406,h:60,originalSource:'gfx/objects/spiritQuestStatue-draftSprites-58x60.png'},
        {x:960,y:944,w:64,h:32,originalSource:'gfx/objects/cavelight.png'},
        {x:752,y:1488,w:158,h:60,originalSource:'gfx/npcs/stormbeastsleep.png'},
        {x:816,y:480,w:16,h:16,originalSource:'gfx/objects/plaque.png'},
        {x:1008,y:496,w:16,h:16,originalSource:'gfx/objects/plaque_broken.png'},
        {x:752,y:608,w:32,h:32,originalSource:'gfx/objects/icicleholemonster.png'},
        {x:752,y:640,w:24,h:24,originalSource:'gfx/hud/menu9slice.png'},
        {x:976,y:752,w:24,h:24,originalSource:'gfx/hud/cursortemp.png'},
        {x:960,y:1088,w:60,h:102,originalSource:'gfx/effects/wukong_staff_parts.png'},
        {x:384,y:1136,w:160,h:16,originalSource:'gfx/chakram1.png'},
        {x:640,y:1424,w:160,h:16,originalSource:'gfx/chakram2.png'},
        {x:256,y:608,w:50,h:10,originalSource:'gfx/hud/hearts.png'},
        {x:592,y:640,w:50,h:10,originalSource:'gfx/hud/greyhearts.png'},
        {x:976,y:784,w:24,h:24,originalSource:'gfx/hud/toprighttemp1.png'},
        {x:976,y:816,w:24,h:24,originalSource:'gfx/hud/toprighttemp2.png'},
        {x:656,y:672,w:32,h:16,originalSource:'gfx/objects/circulardepression.png'},
        {x:480,y:1744,w:128,h:32,originalSource:'gfx/effects/beadcascadeunder.png'},
        {x:480,y:1776,w:128,h:32,originalSource:'gfx/effects/beadcascadeover.png'},
        {x:320,y:2096,w:192,h:20,originalSource:'gfx/objects/activatablecrystal.png'},
        {x:976,y:848,w:32,h:32,originalSource:'gfx/objects/platform.png'},
        {x:960,y:976,w:36,h:80,originalSource:'gfx/objects/pushStairs.png'},
        {x:944,y:544,w:16,h:16,originalSource:'gfx/objects/iceSpikeBall.png'},
        {x:1008,y:752,w:16,h:18,originalSource:'gfx/objects/frozenPot.png'}
    ],
},
];

const imageSourceMap: {[key: string]: {imagePack: PackedImageData, r: Rect}} = {};

for (const imagePack of imagePacks) {
    for (const packedImage of imagePack.packedImages) {
        imageSourceMap[packedImage.originalSource] = {
            imagePack,
            r: packedImage,
        };;
    }
}


export function checkForPackedImage(source: string): Frame|undefined {
    if (!imageSourceMap[source]) {
        return;
    }
    const {imagePack, r} = imageSourceMap[source];
    return {...r, image: imagePack.image};
}

export function requireFrame(source: string, r?: FrameRectangle): Frame {
    const p = checkForPackedImage(source);
    // If the
    if (p) {
        return r
            ? {image: p.image, x: r.x + p.x, y: r.y + p.y, w: r.w, h: r.h, content: r.content}
            : p;
    }
    const frame = {
        image: requireImage(source, () => {
            // Use the image dimensions if dimensions were not provided for this frame.
            if (!r) {
                frame.w = frame.image.width;
                frame.h = frame.image.height;
            }
        }),
        x: r?.x ?? 0, y: r?.y ?? 0,
        w: r?.w ?? 0, h: r?.h ?? 0,
        content: r?.content
    };
    return frame;
}
