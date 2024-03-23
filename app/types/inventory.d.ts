type ActiveTool = 'bow' | 'staff' | 'clone' | 'cloak';
type Equipment = 'leatherBoots' | 'cloudBoots' | 'ironBoots';
type PassiveTool = 'gloves'
    | 'roll'
    | 'nimbusCloud'
    | 'catEyes' | 'spiritSight' | 'trueSight'
    | 'astralProjection' | 'teleportation'
    | 'ironSkin' | 'goldMail' | 'phoenixCrown'
    | 'waterBlessing' | 'fireBlessing' | 'lightningBlessing';
type MagicElement = 'fire' | 'ice' | 'lightning';
type Collectible = 'peachOfImmortality'
    | 'peachOfImmortalityPiece'
    | 'silverOre'
    | 'goldOre'
    | 'victoryPoint';
type Blueprints = 'spikeBoots' | 'flyingBoots' | 'forgeBoots';
type CommonLoot = 'money' | 'peach';
type DungeonLoot = 'smallKey' | 'bigKey' | 'map';

type LootType = 'empty' | 'weapon'
    // In the randomizer spiritSight, astralProjection + teleportation are changed to this progressive spirit power
    // ability so that you will always get the abilities in an order that they can be used immediately.
    | 'spiritPower'
    | 'secondChance'
    | ActiveTool | Equipment | PassiveTool
    // Neutral element is used to unequip elements in the menu
    | 'neutral' | MagicElement
    | Blueprints
    | Collectible | CommonLoot | DungeonLoot | 'unknown';

type MenuOptionType = LootType | 'help' | 'return';

type WeaponUpgrades = 'normalDamage' | 'normalRange' | 'spiritDamage' | 'spiritRange';


interface LootTable {
    totalWeight: number
    thresholds:  number[]
    loot: {type: LootType, amount?: number}[]
}

interface MenuOption {
    // getLabel will be used instead of label if defined.
    getLabel?: () => string,
    label?: string,
    onSelect?: () => void,
    getChildren?: () => MenuOption[],
}
