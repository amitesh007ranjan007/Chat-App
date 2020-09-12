const path = require('path') // core node module
const http = require('http') //core module
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users')

const app = express()
const server = http.createServer(app) // this way its easy to use socket.io
const io = socketio(server) // server supports websockets

const port = process.env.PORT || 3000

const pubicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(pubicDirectoryPath)) 


io.on('connection', (socket) => {
    console.log('New WebSocket connection')
 
    socket.on('join', ({username, room}, callback) => {
    const {error, user} =  addUser({id: socket.id, username, room})
        
    if(error) {
        return callback(error)
    }
    
    socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))  //send evryone except this client
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })   
        callback()
    })
    socket.on('sendMessage', (message, callback) => { // recieves event
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
      
     })

     socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
      io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https:google.com/maps?q=${location.latitude},${location.longitude}`))
      callback()  
    })

     
     socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            }) 
        }
         
     })
})


server.listen(port, () => console.log('Server running at port '+port))