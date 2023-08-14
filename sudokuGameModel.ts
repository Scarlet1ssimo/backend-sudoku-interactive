import { SudokuState, SudokuGame, HistoryStack } from "./socketInterface";
export class SudokuGameDataModelInMemory {
    private static instance: SudokuGameDataModelInMemory;
    private roomsStates: Map<string, SudokuGame> = new Map<string, SudokuGame>();
    private roomsPending: Map<string, number> = new Map<string, number>();
    private constructor() { }
    public static getInstance(): SudokuGameDataModelInMemory {
        if (!SudokuGameDataModelInMemory.instance) {
            SudokuGameDataModelInMemory.instance = new SudokuGameDataModelInMemory();
        }
        return SudokuGameDataModelInMemory.instance;
    }
    public async newGame(key: string): Promise<void> {
        //New game
        console.log("New Game")
        const clue = await getRandomSudoku()
        this.roomsStates.set(key, { History: { Stack: [{ Fillin: initFillin, Candid: initCandid }], Top: 0 }, Clue: clue })
    }
    public async getRoomClue(key: string): Promise<string> {
        console.log("Getting room clue for ", key)
        const roomGame = this.roomsStates.get(key)
        if (!roomGame) {
            await this.newGame(key)
            const roomGame = this.roomsStates.get(key) as SudokuGame
            return roomGame.Clue
        }
        else {
            return roomGame.Clue
        }
    }
    public getSudokuState(key: string): SudokuState {
        console.log("Getting room state for ", key)
        const roomHistory = this.roomsStates.get(key);
        if (roomHistory)
            return roomHistory.History.Stack[roomHistory.History.Top];
        return { Fillin: "", Candid: "" }
    }
    public setSudokuState(key: string, State: SudokuState): void {
        console.log("Setting room state to ", key)
        const roomGame = this.roomsStates.get(key)
        if (!roomGame) return
        const roomHistory = roomGame.History;
        if (roomHistory) {
            const top = roomHistory.Top
            if (roomHistory.Stack[top].Fillin === State.Fillin && roomHistory.Stack[top].Candid === State.Candid) return
            roomGame.History = { Stack: [...roomHistory.Stack.slice(0, top + 1), State], Top: top + 1 }
        }
    }
    public undo(key: string): void {
        console.log("Undoing room state for ", key)
        const roomGame = this.roomsStates.get(key)
        if (!roomGame) return
        const roomHistory = roomGame.History;
        if (roomHistory) {
            const top = roomHistory.Top
            if (top === 0) return
            roomGame.History = { Stack: roomHistory.Stack, Top: top - 1 }
        }
    }
    public redo(key: string): void {
        console.log("Undoing room state for ", key)
        const roomGame = this.roomsStates.get(key)
        if (!roomGame) return
        const roomHistory = roomGame.History;
        if (roomHistory) {
            const top = roomHistory.Top
            if (top === roomHistory.Stack.length - 1) return
            roomGame.History = { Stack: roomHistory.Stack, Top: top + 1 }
        }
    }
    public setPending(key: string, delta: number): void {
        console.log("Setting pending for ", key)
        const pending = this.roomsPending.get(key)
        if (pending) {
            this.roomsPending.set(key, pending + delta)
        } else {
            this.roomsPending.set(key, delta)
        }
    }
    public getPending(key: string): number | undefined {
        console.log("Getting pending for ", key)
        const pending = this.roomsPending.get(key)
        if (pending !== undefined) {
            return pending
        }
        return undefined
    }
}

import cheerio from 'cheerio';
const getRandomSudoku = async () => {
    const board = await fetch('https://four.websudoku.com/?').then(res => res.text()).then(body => {
        const $ = cheerio.load(body);
        let board = ''
        for (let i = 0; i < 9; i++)
            for (let j = 0; j < 9; j++) {
                let v = $('#f' + i + j).attr('value')
                board += v ? v : '.'
            }
        console.log("b1", board)
        return board
    })
    console.log("b2", board)
    return board
}

const initSudoku = ".472.1.....9....2..2.9..17.6...547....5.2.6....316...9.31..7.4..5....3.....6.359."
const initFillin = "................................................................................."
const initCandid = ""