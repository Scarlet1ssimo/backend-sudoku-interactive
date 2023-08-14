// Import the express in typescript file
import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, SocketData } from "./socketInterface";
import { SudokuGameDataModelInMemory } from "./sudokuGameModel";
const app = express();
const httpServer = createServer(app);
const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    SocketData
>(httpServer, {

});
const game = SudokuGameDataModelInMemory.getInstance();

io.on("connection", (socket) => {
    console.log(socket.id);
    socket.emit("hello", "world")
    socket.on("key", async (key) => {
        socket.join(key);
        socket.data.key = key
        socket.data.pending = false
        socket.to(key).emit("log", socket.id + " joined room: " + key);
        socket.emit("clue", await game.getRoomClue(key))
        socket.emit("state", game.getSudokuState(key))
        socket.emit("resetPending")
        let clientsInRoom = 0;
        if (io.sockets.adapter.rooms.has(socket.data.key)) clientsInRoom = io.sockets.adapter.rooms.get(socket.data.key)?.size as number;
        const pendingCount = game.getPending(socket.data.key) as number
        socket.emit("pending", [pendingCount, clientsInRoom])
    })
    socket.on("state", (state) => {
        console.log("state", state)
        game.setSudokuState(socket.data.key, state)
        socket.to(socket.data.key).emit("state", state)
    })
    socket.on("log", (log) => {
        console.log(socket.id, ":", log);
    })
    socket.on("undo", () => {
        game.undo(socket.data.key)
        io.to(socket.data.key).emit("state", game.getSudokuState(socket.data.key))
    })
    socket.on("redo", () => {
        game.redo(socket.data.key)
        io.to(socket.data.key).emit("state", game.getSudokuState(socket.data.key))
    })
    socket.on("selection", (selection: number[]) => {
        socket.to(socket.data.key).emit("selection", selection)
    })
    socket.on("sidenumber", (sidenumber: number[]) => {
        socket.to(socket.data.key).emit("sidenumber", sidenumber)
    })
    socket.on("newgame", async (pending) => {
        let clientsInRoom = 0;
        if (io.sockets.adapter.rooms.has(socket.data.key)) clientsInRoom = io.sockets.adapter.rooms.get(socket.data.key)?.size as number;

        if (pending && !socket.data.pending) {
            socket.data.pending = true
            game.setPending(socket.data.key, +1)
        } else if (!pending && socket.data.pending) {
            socket.data.pending = false
            game.setPending(socket.data.key, -1)
        }
        const pendingCount = game.getPending(socket.data.key)
        console.log("newgaming", pendingCount, clientsInRoom)
        if (pendingCount === undefined) return
        if (pendingCount === clientsInRoom) {
            game.newGame(socket.data.key).then(async () => {
                io.to(socket.data.key).emit("clue", await game.getRoomClue(socket.data.key))
                io.to(socket.data.key).emit("state", game.getSudokuState(socket.data.key))
                io.to(socket.data.key).emit("resetPending")
            })
        } else {
            io.to(socket.data.key).emit("pending", [pendingCount, clientsInRoom])
        }
    })
    socket.on("disconnecting", () => {
        console.log("disconnecting", socket.rooms);
        let clientsInRoom = 0;
        if (io.sockets.adapter.rooms.has(socket.data.key)) clientsInRoom = io.sockets.adapter.rooms.get(socket.data.key)?.size as number;
        if (socket.data.pending) {
            game.setPending(socket.data.key, -1)
        }
        const pendingCount = game.getPending(socket.data.key)
        if (pendingCount === undefined) return
        io.to(socket.data.key).emit("pending", [pendingCount, clientsInRoom])

        // the Set contains at least the socket ID
    });
    // client-side

    socket.on("disconnect", () => {
        console.log(socket.id); // undefined
    });
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

httpServer.listen(3010, () => {
    console.log("Started!")
});

