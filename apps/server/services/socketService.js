const socketIo = require('socket.io');
const redisAdapter = require('socket.io-redis');
const chatController = require('../controllers/chatController');

const initializeSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        }
    });

    io.adapter(redisAdapter({ host: process.env.REDIS_HOST || 'localhost', port: process.env.REDIS_PORT || 6379}));

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

       
        socket.on('findChatPartner', async (userData) => {
            await chatController.findChatPartner(socket, io, userData);
        });

        socket.on('findRandomChatPartner', async (userData) => {
            await chatController.findRandomChatPartner(socket, io, userData); 
        });

      
        socket.on('sendMessage', async (message) => {
            await chatController.handleMessage(socket, io, message);
        });

   
        socket.on('disconnect', async () => {
            await chatController.handleDisconnect(socket, io);
        });
    });

    return io;
};

module.exports = initializeSocket;
