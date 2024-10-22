const redis = require('../config/redis');


const findChatPartner = async (socket, io, userData) => {
    const waitingUsers = await redis.lrange('waitingQueue', 0, -1);
    let preferredPartner = null;

 
    for (let i = 0; i < waitingUsers.length; i++) {
        const partnerSocketId = waitingUsers[i];
        const partnerData = JSON.parse(await redis.get(partnerSocketId));

        if (partnerData && partnerData.gender === userData.preference) {
            preferredPartner = partnerSocketId;
            break;
        }
    }

    if (preferredPartner) {
        await redis.lrem('waitingQueue', 0, preferredPartner);

       
        await redis.set(socket.id, JSON.stringify({ ...userData, partnerSocketId: preferredPartner }));
        await redis.set(preferredPartner, JSON.stringify({ ...JSON.parse(await redis.get(preferredPartner)), partnerSocketId: socket.id }));

     
        const partnerInfo = JSON.parse(await redis.get(preferredPartner));
        socket.emit('connectedToChatPartner', { id: preferredPartner, name: partnerInfo.name });
        io.to(preferredPartner).emit('connectedToChatPartner', { id: socket.id, name: userData.name });
    } else {
        await redis.rpush('waitingQueue', socket.id);
        await redis.set(socket.id, JSON.stringify(userData));
    }
};


const findRandomChatPartner = async (socket, io, userData) => {
 
    const waitingUser = await redis.lpop('waitingQueue');
    
    if (waitingUser) {
        const partnerSocketId = waitingUser;

        await redis.set(socket.id, JSON.stringify({ ...userData, partnerSocketId }));

   
        const partnerData = JSON.parse(await redis.get(partnerSocketId));

     
        await redis.set(partnerSocketId, JSON.stringify({ ...partnerData, partnerSocketId: socket.id }));

        socket.emit('connectedToChatPartner', { id: partnerSocketId, name: partnerData.name });
        io.to(partnerSocketId).emit('connectedToChatPartner', { id: socket.id, name: userData.name });

    } else {
       
        await redis.rpush('waitingQueue', socket.id);
        await redis.set(socket.id, JSON.stringify(userData)); 
    }
};


const handleMessage = async (socket, io, message) => {
    const userData = JSON.parse(await redis.get(socket.id));
    const partnerSocketId = userData.partnerSocketId; 
    

    if (partnerSocketId && partnerSocketId !== null) {
        io.to(partnerSocketId).emit('receiveMessage', {
            from: userData.name,  
            text: message.text,
        });
    }
};



const handleDisconnect = async (socket, io) => {
    const partnerSocketId = await redis.get(socket.id);
    if (partnerSocketId) {
      
        io.to(partnerSocketId).emit('partnerDisconnected');

   
        await redis.del(partnerSocketId);
        await redis.del(socket.id);
    }


    await redis.lrem('waitingQueue', 0, socket.id);
};

module.exports = {
    findChatPartner,        
    findRandomChatPartner,   
    handleMessage,
    handleDisconnect,
};
