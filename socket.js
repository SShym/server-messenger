const Schema = require('./models/Schema');
const SchemaDirect = require('./models/SchemaDirect');
const userSchema = require('./models/userSchema');

module.exports = (io) => {

let users = [];

io.on('connect', (socket) => {
    let messages = {};
    let profile = {};
    
    ////////////////////////////////////////////////

    const updateMessageList = () => io.emit('comments', messages);
    const updateProfile = () => io.to(socket.id).emit('profile', profile);

    socket.on('comments:get', async () => {    
        const comments = await Schema.find();

        messages = { 
            data: comments 
        }
        
        updateMessageList();
    })
    
    socket.on('profile:get', async (id) => {
        profile = await userSchema.findById(id);
        updateProfile();
    })

    //////////////////////////////////////////////////////

    const getLastMessagesFromRoom = async (room) => {
        let roomMessages = await SchemaDirect.find({
            to: room,
        });

        return roomMessages;
    }
    
    socket.on('join-room', async(room) => {
        socket.join(room);

        let roomMessages = await getLastMessagesFromRoom(room);
        socket.emit('direct-comments', roomMessages)
    })

    socket.on('leave-room', async (room) => {
        socket.leave(room);

        let roomMessages = await getLastMessagesFromRoom(room);
        socket.emit('direct-comments', roomMessages);
    })

    socket.on('add-direct-comment', async(data) => {
        let roomMessages = await getLastMessagesFromRoom(data.to);

        io.to(data.to).emit('direct-comments', roomMessages);
    })

    socket.on('delete-direct-chat', async(room) => {
        io.to(room).emit('direct-comments', []);
    })

    /////////////////////////////////////////////////////

    io.emit('countUsers', users);

    socket.on('login', async (data) => {
        if(!users.some(user => user.userId === data.id)){
            users.push({
                userId: data.id,
                socketId: socket.id
            })
        }

        io.emit('countUsers', users);
    })

    socket.on('disconnectById', async (data) => {
        users = users.filter((user) => user.socketId !== socket.id);

        io.emit('countUsers', users);
    })

    socket.on('disconnect', async () => {
        users = users.filter((user) => user.socketId !== socket.id);

        io.emit('countUsers', users);
    })

    //////////////////////////////////
})

}