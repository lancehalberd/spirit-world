type BossKey =
  | "beetle"
  | "golem"
  | "idols"
  | "guardian"
  | "forestTempleBoss"
  | "rival2"
  | "collector"
  | "stormBeast"
  | "flameBeast"
  | "frostBeast"
  ;

type BossRushKey =
  BossKey
  | "rush"
  | "rush2"
  | "rush3"
  | "altGolem"
  | "altRival2"
  | "altGuardian"
  | "altIdols"
  ;

interface BossRushOption {
    // Name of the boss rush displayed to the player
    label: string
    // Key for the boss rush used to track best score
    key: BossRushKey
    // Player state to use for special scenarios
    playerState?: SavedHeroData
    // List of spawn locations for each section of this boss rush.
    bosses: BossKey[]
    // Special logic for unlocking this boss rush
    isVisible?: (state: GameState, realSavedHeroData: SavedHeroData) => boolean
    karma: number
    // Winning under the target time doubles Karma reward, but only up to the 10x reward cap.
    targetTime: number
    // Special logic for fixing the preview, since some bosses don't appear in frame by default.
    fixPreview?: (state: GameState) => void
}

interface BossRushCondition {
    key: BossRushConditionKey
    label: string
    description: string
    modifier: number
    apply: (state: GameState) => void
}

type BossRushConditionKey =
    | 'confident'
    | 'daredevil'
    | 'exposed'
    | 'mundane'
    | 'weak';

interface BossRushState {
  activeConditions: Set<BossRushCondition>
  bossRushOption: BossRushOption
  remainingBosses: BossKey[]
  bossStartTime: number
}
