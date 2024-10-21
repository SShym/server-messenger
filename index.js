const { Server } = require('socket.io');
const cors = require("cors");
const express = require('express');
const bodyParser = require('body-parser');
const Database = require('./DB/db'); 
const app = express();
const authRouter = require('./routers/authRouter');
const commentsRouter = require('./routers/commentsRouter');
const profileRouter = require('./routers/profileRouter');

const PORT = process.env.PORT;

app.use(cors());

Database();

app.get("/", async (req, res) => { res.send('SERVER IS RUNNING!') });

app.use(express.json({limit: '25mb'}));
app.use(express.urlencoded({limit: '25mb', extended: true}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()).use(bodyParser.json());

const server = app.listen(PORT, () => console.log(`Server started on ${PORT}`));

const io = new Server(server, {
    cors: { origin: `${process.env.siteURL}` },
});

require('./socket')(io)

app.use(authRouter);
app.use(commentsRouter);
app.use(profileRouter);