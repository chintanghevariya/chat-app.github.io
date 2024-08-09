const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const cors = require('cors');
const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',  // Allow all origins
        methods: ['GET', 'POST']
      }
});

app.use(express.json());

//Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chat-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

//Define Routes
app.use('/api/auth', require('./routes/auth'));

let users = {};

io.on('connection', (socket) => {
    console.log('New Client Connected' + socket.id);

     // Store the user ID and socket ID
     socket.on('register', (userId) => {
        users[userId] = socket.id;
        console.log('User registered: ' + userId);
    });

    // Listen for private messages
    socket.on('private message', ({ senderId, recipientId, message }) => {
        console.log(`Message from ${senderId} to ${recipientId}: ${message}`);
        const recipientSocketId = users[recipientId];
        const room = [senderId, recipientId].sort().join('-'); // Create room name based on user IDs
        socket.join(room);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('private message', { senderId, message });
        }
        io.to(room).emit('private message', { senderId, message});  // Broadcast to room
    });


    // // Listen for messages from the client
    // socket.on('chat message', (msg) => {
    // console.log('Message received: ' + msg);
    
    // // Broadcast the message to all clients
    // io.emit('chat message', msg);
    // });

    socket.on('disconnect', ()=> {
        console.log('client disconnected', socket.id);
        //Remove the user from the users object
        for (let userId in users){
            if(users[userId] === socket.id){
                delete users[userId];
                console.log('User unregistered : '+ userId);
                break;
            }
        }
    });
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`server running on port ${PORT}`));
