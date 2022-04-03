import { Howl } from 'howler';

export interface SoundSettings {
    muteTracks?: boolean
    muteSounds?: boolean
    globalVolume?: number
    musicVolume?: number
    soundVolume?: number
}
export interface HowlerProperties {
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
export interface GameSound {
    soundSettings?: SoundSettings
    props?: HowlerProperties
    howl?: Howl
    customDelay?: number
    canPlayAfter?: number
    activeInstances?: number
    instanceLimit?: number
    spriteName?: 'sprite'
    // This is just used by custom audio context sounds
    play?: () => void
    // BGM Only
    shouldPlay?: boolean
    shouldFadeIn?: boolean
    targetVolume?: number
    nextTrack?: string
}
