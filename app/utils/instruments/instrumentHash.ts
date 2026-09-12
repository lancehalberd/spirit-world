
export const instruments = {} as {[key in InstrumentName]: Instrument};

declare global {
    export interface InstrumentPlayNoteParams {
        destination: AudioNode
        time: number
        frequency: number
        volume: number
        duration: number
    }
    export interface Instrument {
        playNote: (params: InstrumentPlayNoteParams) => void
        // How long to sound a note for when it's played outside of normal track playback purely to
        // preview its pitch/tone (the track viewer's audition-on-select/drag/keyboard-click - see
        // auditionNote, app/development/trackViewer.ts) - unrelated to a note's actual authored
        // `beats`/`duration`, which audition deliberately ignores so previewing a long held note
        // doesn't tie up the speakers for its full length. Defaults to 0.4s if unset; always capped
        // at 0.5s regardless (see MAX_AUDITION_DURATION in trackViewer.ts).
        defaultAuditionDuration?: number
    }
    export type InstrumentName = 'bell'|'harp'|'hihat'|'zeldaSquare'|'kick'|'snare'|'bass'|'piano';
}
