const express = require('express');
const cors = require('cors');
const http = require('http');
const { ExpressPeerServer } = require('peer');
const routes = require('./routes');
const initializeSocket = require('./services/socketService');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));
app.use(express.json());


initializeSocket(server);


const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/peerjs',
});


app.use('/', routes);
app.use('/peerjs', peerServer);


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



