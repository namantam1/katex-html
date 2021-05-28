const express = require("express");
const { latexify } = require("./math");
const PORT = process.env.PORT || 3000
// create express peer server
const ExpressPeerServer = require('peer').ExpressPeerServer;


const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'pug')
app.set('views', __dirname + '/views');

app.get("/", (req, res) => {
    return res.render("form");
})

app.post("/", (req, res) => {
    if (req.body.data) {
        const dataArr = latexify(req.body.data);
        return res.render("katex", {katex: dataArr})
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

// create a http server instance to listen to request
var server = require('http').createServer(app);

// peerjs is the path that the peerjs server will be connected to.
app.use('/peerjs', ExpressPeerServer(server));


app.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}`)
})
