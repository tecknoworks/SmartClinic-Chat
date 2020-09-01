const express = require('express')
const http = require('http');
const socketIo = require('socket.io');

const { addUser, removeUser, getUser, getUsersInRoom, getRooms, addAdmin, getAdmins, subAdmin } = require('./users')

const port = process.env.PORT || 5000;
const index = require("./routes/index");
const { get } = require('./routes/index');

const app = express();
app.use(index);

const server = http.createServer(app);

const io = socketIo(server); // < Interesting!

io.on('connection', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    console.log('User connected' + ' ' + socket.id)
    const { error, user } = addUser({ id: socket.id, name, room })

    console.log(user)
    if (error) return callback(error)

    let number = getAdmins()

    socket.emit('message', { user: 'admin', text: `${user.name} Welcome to the chat. ${number} admins online. Please wait for an admin to get in connection with you` })
   // socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} please wait for an admin to get in connection with you` }) // send message to all the user inside the room


    socket.join(user.room)

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })

    callback()
  })

  socket.on('adminJoin', () =>{
    console.log('Admin connected')

    addAdmin()
    let rooms = getRooms()
    console.log(rooms)
    socket.emit('roomsOnline', rooms)

  })

  socket.on('sendMessage', (message, callback) => {
    const userAux = getUser(socket.id)

    io.to(userAux.room).emit('message', { user: userAux.name, text: message })
    io.to(userAux.room).emit('roomData', {room: userAux.room, users: getUsersInRoom(userAux.room)})

    callback()

  })

  socket.on("disconnect", () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left` })
    }

    console.log('User ' + socket.id + ' disconnect ')
  })
})

server.listen(port, () => console.log(`Listening on port ${port}`))