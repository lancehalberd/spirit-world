import { LevelKey, LevelConfig, ShopItem } from './fps_types';

export const baseAmmo = 5;

export const levelConfigs: {[key in LevelKey]: LevelConfig} = {
    'none': { timeLimit: 0, goal: 0, spawnInterval: 0 },
    'l1': { 
        timeLimit: 30000, 
        goal: 150, 
        spawnInterval: 1000,
        targetTypes: [
            { points: 30, radius: 18, speed: 3, lifetime: 6000, color: '#0C0', weight: 3, type: 'standard' },
        ]
    },
    'l2': { 
        timeLimit: 30000, 
        goal: 150, 
        spawnInterval: 1000, 
        targetTypes: [
            { points: 30, alternatePoints: 5, radius: 15, speed: 3.5, lifetime: 8000, weight: 5, type: 'alternating', switchInterval: 1000},
            { points: 20, radius: 14, speed: 3.5, lifetime: 6000, color: '#029', weight: 3, type: 'standard' },
        ]
    },
    'l3': { 
        timeLimit: 25000, 
        goal: 200, 
        spawnInterval: 1000, 
        targetTypes: [
            { points: 25, radius: 10, speed: 6.5, lifetime: 8000, color: '#0C0', weight: 4, type: 'circling' },
            { points: 25, radius: 15, speed: 3.7, lifetime: 12000, color: '#888', weight: 6, type: 'armored', maxHits: 2 },
        ]
    },
    'l4': { 
        timeLimit: 25000, 
        goal: 180, 
        spawnInterval: 1000, 
        targetTypes: [
            { points: 10, radius: 14, speed: 4, lifetime: 6000, color: '#0C0', weight: 4, type: 'standard' },
            { points: 0, radius: 12, speed: 2.5, lifetime: 6000, color: '#00F', weight: 1, type: 'ammo', bonusAmount: 1 },
            { points: 0, radius: 12, speed: 2.5, lifetime: 6000, color: '#F0F', weight: 1, type: 'time', bonusAmount: 4000 }
        ]
    },
    'l5': { 
        timeLimit: 28000, 
        goal: 210, 
        spawnInterval: 1000, 
        targetTypes: [
            { points: 40, alternatePoints: -40, radius: 8, speed: 2.5, lifetime: 8000, weight: 5, type: 'alternating', switchInterval: 800},
            { points: 25, radius: 12, speed: 2.9, lifetime: 6000, color: '#0C0', weight: 3, type: 'standard' },
            { points: 90, radius: 10, speed: 2.75, lifetime: 12000, color: '#888', weight: 6, type: 'armored', maxHits: 3 },
        ]
    },
    'l6': { 
        timeLimit: 20000, 
        goal: 300, 
        spawnInterval: 800, 
        targetTypes: [
           { points: 50, alternatePoints: -50, radius: 9, speed: 3.15, lifetime: 8000, weight: 5, type: 'alternating', switchInterval: 800},
           { points: 0, radius: 11, speed: 3, lifetime: 6000, color: '#00F', weight: 1.5, type: 'ammo', bonusAmount: 1 },
           { points: 0, radius: 11, speed: 3, lifetime: 6000, color: '#F0F', weight: 2, type: 'time', bonusAmount: 4000 }
        ]
    },
    'l7': { 
        timeLimit: 35000, 
        goal: 250, 
        spawnInterval: 500, 
        targetTypes: [
           { points: 25, radius: 8, speed: 6, lifetime: 6000, color: '#0C0', weight: 6, type: 'standard' },
           { points: 0, radius: 8, speed: 2.3, lifetime: 10000, color: '#F80', weight: 3, type: 'explosive', explosionRadius: 160 },
        ]
    },
    'l8': { 
        timeLimit: 50000, 
        goal: 250, 
        spawnInterval: 500, 
        targetTypes: [
            { points: 25, radius: 6, speed: 2.75, lifetime: 6000, color: '#0C0', weight: 3, type: 'standard' },
            { points: 25, radius: 12, speed: 4, lifetime: 6000, color: '#0C0', weight: 3, type: 'standard' },
            { points: 50, alternatePoints: -50, radius: 10, speed: 3, lifetime: 7000, weight: 2, type: 'alternating', switchInterval: 800}
        ]
    },
    'l9': { 
        timeLimit: 30000, 
        goal: 250, 
        spawnInterval: 600, 
        targetTypes: [
           { points: 25, radius: 10, speed: 3, lifetime: 6000, color: '#0C0', weight: 4, type: 'standard' },
           { points: 0, radius: 9, speed: 3, lifetime: 6000, color: '#00F', weight: 1, type: 'ammo', bonusAmount: 1 },
           { points: 0, radius: 9, speed: 3, lifetime: 6000, color: '#F0F', weight: 1, type: 'time', bonusAmount: 5000 }
        ]
    },
    'l10': { 
        timeLimit: 25000, 
        goal: 0, 
        spawnInterval: 500, 
        maxTargets: 4,
        targetTypes: [
            { points: 25, radius: 16, speed: 2, lifetime: 6000, color: '#0C0', weight: 3, type: 'standard' },
            { points: 50, alternatePoints: -50, radius: 15, speed: 2.3, lifetime: 7000, weight: 3, type: 'alternating', switchInterval: 800},
            { points: 20, radius: 16, speed: 2.5, lifetime: 8000, color: '#0C0', weight: 3, type: 'circling' },
            { points: 0, radius: 14, speed: 2, lifetime: 6000, color: '#00F', weight: 1, type: 'ammo', bonusAmount: 1 },
        ], escalation: true,
    }, 
};

export const shopItems: ShopItem[] = [
    {key: 'l1', levelKey: 'l1', x: 0, y: 0, unlocks: ['l10'], label: 'Level 1', description: 'Warmup'},
    {key: 'l2', levelKey: 'l2', x: 0, y: 1, unlocks: [], label: 'Level 2', description: 'Practice'},
    {key: 'l3', levelKey: 'l3', x: 0, y: 2, unlocks: [], label: 'Level 3', description: 'Deputy'},
    {key: 'l4', levelKey: 'l4', x: 0, y: 3, unlocks: [], label: 'Level 4', description: 'Bandito'},
    {key: 'l5', levelKey: 'l5', x: 0, y: 4, unlocks: [], label: 'Level 5', description: 'Sheriff'},
    {key: 'l6', levelKey: 'l6', x: 0, y: 5, unlocks: [], label: 'Level 6', description: 'Marshall'},
    {key: 'l7', levelKey: 'l7', x: 0, y: 6, unlocks: [], label: 'Level 7', description: 'Sharpshooter'},
    {key: 'l8', levelKey: 'l8', x: 0, y: 7, unlocks: [], label: 'Level 8', description: 'Legend'},
    {key: 'l9', levelKey: 'l9', x: 0, y: 8, unlocks: [], label: 'Level 9', description: 'Desperado'},
    {key: 'l10', levelKey: 'l10', x: 1, y: 8, label: 'Endless', description: 'Last as long as possible'},
    {
        key: 'reset', x: 2, y: 0,
        label: 'Reset',
        description: 'Clear data',
    },
];