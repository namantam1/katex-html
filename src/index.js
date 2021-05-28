const express = require('express');
const awake = require("heroku-awake");
const cors = require('cors')
const latexify = require("./math");
const app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


// create express peer server
const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server);

const PORT = process.env.PORT || 3000


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// peerjs is the path that the peerjs server will be connected to.
app.use('/peerjs', peerServer);

app.set('view engine', 'pug')
app.set('views', __dirname + '/views');

app.get("/", (req, res) => {
    return res.render("form");
})

app.post("/", (req, res) => {
    if (req.body.data) {
        const dataArr = latexify(req.body.data);
        return res.render("katex", { katex: dataArr })
    }
    return res.redirect("/")
})

app.get("/ping/", (req, res) => {
    return res.send("Hello Naman!")
})

app.post("/api/", (req, res) => {
    let html;
    if (req.body.data) {
        const dataArr = latexify(req.body.data);
        html = dataArr.join("")
    }

    return res.send({
        data: html,
        code: html ? 1 : 0
    })
})

// Socket Connection

io.on("connection", (socket) => {
    socket.on("join-room", (roomID, userID, username) => {
        if (users[roomID]) users[roomID].push({ id: userID, name: username, video: true, audio: true });
        else users[roomID] = [{ id: userID, name: username, video: true, audio: true }];

        socket.join(roomID);
        socket.to(roomID).broadcast.emit("user-connected", userID, username);

        socket.on("message", (message) => {
            io.in(roomID).emit("message", message, userID, username);
        });

        io.in(roomID).emit("participants", users[roomID]);

        socket.on("mute-mic", () => {
            users[roomID].forEach((user) => {
                if (user.id === userID) return (user.audio = false);
            });
            io.in(roomID).emit("participants", users[roomID]);
        });

        socket.on("unmute-mic", () => {
            users[roomID].forEach((user) => {
                if (user.id === userID) return (user.audio = true);
            });
            io.in(roomID).emit("participants", users[roomID]);
        });

        socket.on("stop-video", () => {
            users[roomID].forEach((user) => {
                if (user.id === userID) return (user.video = false);
            });
            io.in(roomID).emit("participants", users[roomID]);
        });

        socket.on("play-video", () => {
            users[roomID].forEach((user) => {
                if (user.id === userID) return (user.video = true);
            });
            io.in(roomID).emit("participants", users[roomID]);
        });

        socket.on("disconnect", () => {
            socket.to(roomID).broadcast.emit("user-disconnected", userID, username);
            users[roomID] = users[roomID].filter((user) => user.id !== userID);
            if (users[roomID].length === 0) delete users[roomID];
            else io.in(roomID).emit("participants", users[roomID]);
        });
    });
});



server.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}`)
    awake("https://html-katex.herokuapp.com")
})
