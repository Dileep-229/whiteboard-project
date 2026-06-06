const express = require("express");

const http = require("http");

const { Server } = require("socket.io");


// express app
const app = express();


// create server
const server =
http.createServer(app);


// socket setup
const io =
new Server(server);


// public folder
app.use(
express.static("public")
);


// room storage
const rooms = {};


// room users
const roomUsers = {};


// socket connection
io.on(
"connection",
(socket)=>{

console.log(
"User connected"
);



// ================= CREATE ROOM =================

socket.on(
"createRoom",
async(data)=>{

const roomName =
data.roomName;

const password =
data.password;


// room already exists
if(rooms[roomName]){

socket.emit(
"roomError",
"Room already exists"
);

return;

}


// save room
rooms[roomName]={
password
};


// join room
socket.join(
roomName
);


// save room id
socket.roomId=
roomName;


// save username
socket.userName=
data.userName;


// create users array
if(!roomUsers[roomName]){

roomUsers[roomName]=[];

}


// add user
roomUsers[roomName].push(
data.userName
);


// send users list
io.to(roomName).emit(
"usersList",
roomUsers[roomName]
);


// send room created
socket.emit(
"roomCreated",
roomName
);


// update user count
const clients =
await io
.in(roomName)
.fetchSockets();


io.to(roomName).emit(
"userCount",
clients.length
);

}
);




// ================= JOIN ROOM =================

socket.on(
"joinRoom",
async(data)=>{

const roomName =
data.roomName;

const password =
data.password;


// room not exists
if(!rooms[roomName]){

socket.emit(
"roomError",
"Room does not exist"
);

return;

}


// wrong password
if(
rooms[roomName].password
!== password
){

socket.emit(
"roomError",
"Wrong password"
);

return;

}


// join room
socket.join(
roomName
);


// save room id
socket.roomId=
roomName;


// save username
socket.userName=
data.userName;


// create users array
if(!roomUsers[roomName]){

roomUsers[roomName]=[];

}


// add user
roomUsers[roomName].push(
data.userName
);


// send users list
io.to(roomName).emit(
"usersList",
roomUsers[roomName]
);


// send joined
socket.emit(
"roomJoined",
roomName
);


// update user count
const clients =
await io
.in(roomName)
.fetchSockets();


io.to(roomName).emit(
"userCount",
clients.length
);

}
);




// ================= DRAW =================

socket.on(
"draw",
(data)=>{

if(!socket.roomId)
return;


socket.to(
socket.roomId
).emit(
"draw",
data
);

}
);




// ================= CLEAR =================

socket.on(
"clear",
()=>{

if(!socket.roomId)
return;


socket.to(
socket.roomId
).emit(
"clear"
);

}
);




// ================= STOP =================

socket.on(
"stop",
()=>{

if(!socket.roomId)
return;


socket.to(
socket.roomId
).emit(
"stop"
);

}
);




// ================= CHAT =================

socket.on(
"chatMessage",
(msg)=>{

if(!socket.roomId)
return;


io.to(
socket.roomId
).emit(
"chatMessage",
msg
);

}
);




// ================= STICKY NOTES =================

socket.on(
"newNote",
(text)=>{

if(!socket.roomId)
return;


io.to(
socket.roomId
).emit(
"newNote",
text
);

}
);




// ================= CURSOR =================

socket.on(
"cursorMove",
(data)=>{

if(!socket.roomId)
return;


socket.to(
socket.roomId
).emit(
"cursorMove",
{
id:socket.id,
x:data.x,
y:data.y
}
);

}
);




// ================= DISCONNECT =================

socket.on(
"disconnect",
async()=>{

if(socket.roomId){


// room users exists
if(
roomUsers[socket.roomId]
){

// remove current user
roomUsers[socket.roomId]=
roomUsers[socket.roomId]
.filter(
name =>
name !== socket.userName
);


// update users list
io.to(
socket.roomId
).emit(
"usersList",
roomUsers[socket.roomId]
);

}


// update count
const clients =
await io
.in(socket.roomId)
.fetchSockets();


io.to(
socket.roomId
).emit(
"userCount",
clients.length
);

}


console.log(
"User disconnected"
);

});

});




// ================= START SERVER =================

server.listen(
3000,
()=>{

console.log(
"Server running on http://localhost:3000"
);

});