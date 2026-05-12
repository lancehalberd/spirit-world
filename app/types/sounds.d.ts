interface SoundSettings {
    muteTracks?: boolean
    muteSounds?: boolean
    musicVolume?: number
    soundVolume?: number
}
interface HowlerProperties {
    src: string[]
    html5?: boolean
    loop?: boolean
    volume: number
    onfade?: () => void
    onplay?: () => void
    onplayerror?: (error: unknown) => void
    onload?: () => void
    onstop?: () => void
    onend?: () => void
    sprite?: { sprite: [number, number] }
}
interface AudioInstance {
    // Synth sounds don't use this.
    sourceNode?: AudioBufferSourceNode
    // Used for fade in/out effects.
    gainNode?: GainNode
    // When the sound is/was scheduled to start.
    startTime: number
    // When the sound is scheduled to stop.
    // This will be set on long running sounds that need to
    // be explicitly stopped. The code that actually stops
    // the sound is in the update loop so it will not stop
    // at this exact time.
    scheduledStopTime?: number
    // The time to seek to if a sound is restarted. This should
    // not be calculated from scheduledStopTime which is not
    // the same as the time the sound actually stopped at.
    restartTime?: number
    // This will not be set on looping tracks.
    endTime?: number
    sound: GameSound
    customStop?: void | ((time: number) => void)
}
interface GameSound {
    key?: string
    audioBuffer?: AudioBuffer
    instances: AudioInstance[]
    // Seconds to wait between multiple instances of a sound effect.
    customDelay?: number
    // Custom offset and duration can be set to play a subset of an AudioBuffer.
    offset?: number
    duration: number
    // Whether to loop a sound.
    loop?: boolean
    // Number of seconds to seek to on repeat. Defaults to offset
    repeatFrom?: number
    canPlayAfter?: number
    activeInstances?: number
    instanceLimit?: number
    volume?: number
    speed?: number
    // If this is set to true, duplicate instanecs of this sound on the same frame
    // will be skipped instead of doubled up or staggered.
    skipDuplicates?: boolean
    // This is just used by custom audio context sounds
    play?: (target: AudioNode, time: number) => void | ((time: number) => void)
}

interface GameTrack extends GameSound {
    key: TrackKey
    nextTrack?: TrackKey
    // Key of the initial track played for multi track sequences.
    // This is used to prevent restarting BGMs when the current key no longer matches the original key.
    baseTrack?: TrackKey
}

type TrackKey
    = 'caveTheme'
    | 'mainTheme'
    | 'waterfallVillageTheme'
    | 'forestTheme'
    | 'vanaraForestTheme'
    | 'tombTheme'
    | 'cocoonTheme'
    | 'vanaraDreamTheme'
    | 'helixTheme'
    | 'waterfallTowerTheme'
    | 'forgeTheme'
    | 'craterTheme'
    | 'towerTheme'
    | 'skyTheme'
    | 'lakeTheme'
    | 'skyPalaceTheme'
    | 'village'
    | 'ruins'
    | 'dungeonTheme'
    | 'labTheme'
    | 'grandPriestTheme'
    | 'idleTheme'
    | 'bossIntro'
    | 'bossA'
    | 'bossB';
