
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
    }
    export type InstrumentName = 'bell'|'harp'|'hihat'|'zeldaSquare'|'kick'|'snare'|'bass'|'piano';
}
