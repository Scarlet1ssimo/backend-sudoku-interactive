export interface SudokuState {
    Fillin: string;
    Candid?: string;
}
export interface HistoryStack {
    Stack: SudokuState[],
    Top: number
}
export interface SudokuGame {
    History: HistoryStack;
    Clue: string;
}

interface ServerToClientEvents {
    hello: (param: string) => void;
    log: (log: string) => void;
    clue: (clue: string) => void;
    state: (state: SudokuState) => void;
    selection: (selection: number[]) => void;
    sidenumber: (sidenumber: number[]) => void;
    pending: (pending: number[]) => void;
    resetPending: () => void;
}

interface ClientToServerEvents {
    key: (key: string) => void;
    log: (log: string) => void;
    undo: () => void;
    redo: () => void;
    state: (state: SudokuState) => void;
    selection: (selection: number[]) => void;
    sidenumber: (sidenumber: number[]) => void;
    newgame: (pending: boolean) => void;
}

interface SocketData {
    key: string;
    pending: string;
}

export { ServerToClientEvents, ClientToServerEvents, SocketData };