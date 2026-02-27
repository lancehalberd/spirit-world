type ActiveTool = 'bow' | 'staff' | 'clone' | 'cloak';
type Equipment = 'leatherBoots' | 'cloudBoots' | 'ironBoots';
type PassiveTool =
    // Techniques
    | 'roll'
    | 'nimbusCloud'
    | 'teleportation'
    | 'ironSkin'
    // Eyes
    | 'catEyes' | 'spiritSight' | 'trueSight'
    // Head
    | 'astralProjection' | 'phoenixCrown'
    // Hands
    | 'gloves'
    // Body
    | 'armor'
    // Accessories
    | 'waterBlessing' | 'fireBlessing' | 'lightningBlessing'
    | 'arDevice';
type MagicElement = 'fire' | 'ice' | 'lightning';
type Collectible = 'peachOfImmortality'
    | 'peachOfImmortalityPiece'
    | 'silverOre'
    | 'goldOre'
    | 'aetherCrystal'
    | 'victoryPoint';
type Blueprints = 'spikeBoots' | 'flyingBoots' | 'forgeBoots' | 'silverMailSchematics' | 'goldMailSchematics';
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

type MenuOptionType = null | LootType | 'weapon2' | 'help' | 'return';

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
