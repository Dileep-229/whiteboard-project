// user name
let userName = "";


// undo history
let history = [];
let redoStack = [];


// canvas setup
const canvas =
document.getElementById("board");

const ctx =
canvas.getContext("2d");


// socket connection
const socket = io();


// drawing state
let drawing = false;

let roomId = "";


// selected tool
let currentTool = "pen";


// shape points
let startX;
let startY;

let snapshot;


// color picker
const colorPicker =
document.getElementById(
"colorPicker"
);

let color =
colorPicker.value;


// change color
colorPicker.addEventListener(
"change",
(e)=>{

color = e.target.value;

}
);


// previous color
let previousColor = color;


// eraser
window.useEraser=function(){

previousColor=color;

color="white";

};


// pen
window.usePen=function(){

color=previousColor;

currentTool="pen";

};


// set tool
window.setTool=function(tool){

currentTool=tool;

};


// brush size
const brushSize =
document.getElementById(
"brushSize"
);

const sizeValue =
document.getElementById(
"sizeValue"
);

let lineWidth =
brushSize.value;


// update brush
brushSize.addEventListener(
"input",
(e)=>{

lineWidth=e.target.value;

sizeValue.innerText=
lineWidth;

}
);


// download image
window.downloadImage=function(){

const link =
document.createElement("a");

link.download =
"whiteboard.png";

link.href =
canvas.toDataURL();

link.click();

};


// CREATE ROOM
window.createRoom=function(){

const name =
document.getElementById(
"createUserName"
).value.trim();

const roomName =
document.getElementById(
"createRoomName"
).value.trim();

const password =
document.getElementById(
"createRoomPassword"
).value.trim();


if(!name || !roomName || !password){

alert(
"Enter all details"
);

return;

}


userName=name;


socket.emit(
"createRoom",
{
roomName,
password,
userName:name
}
);

};


// JOIN ROOM
window.joinRoom=function(){

const name =
document.getElementById(
"joinUserName"
).value.trim();

const roomName =
document.getElementById(
"joinRoomName"
).value.trim();

const password =
document.getElementById(
"joinRoomPassword"
).value.trim();


if(!name || !roomName || !password){

alert(
"Enter all details"
);

return;

}


userName=name;


socket.emit(
"joinRoom",
{
roomName,
password,
userName:name
}
);

};


// toggle users panel
window.toggleUsers=function(){

const panel=
document.getElementById(
"usersPanel"
);

if(panel.style.display==="none"){

panel.style.display="block";

}
else{

panel.style.display="none";

}

};


// ROOM CREATED
socket.on(
"roomCreated",
(roomName)=>{

roomId = roomName;


// hide room page
document.getElementById(
"roomPage"
).style.display="none";


// show whiteboard
document.getElementById(
"whiteboardPage"
).style.display="block";


alert(
"Room created: "+roomName
);

});


// ROOM JOINED
socket.on(
"roomJoined",
(roomName)=>{

roomId = roomName;


// hide room page
document.getElementById(
"roomPage"
).style.display="none";


// show whiteboard
document.getElementById(
"whiteboardPage"
).style.display="block";


alert(
"Joined room: "+roomName
);

});


// ROOM ERROR
socket.on(
"roomError",
(msg)=>{

alert(msg);

}
);


// USERS LIST
socket.on(
"usersList",
(users)=>{

const panel=
document.getElementById(
"usersPanel"
);


panel.innerHTML=
"<h3>Total Users: "
+
users.length+
"</h3>";


// show all users
users.forEach(user=>{


// current user
if(user===userName){

panel.innerHTML+=
"<div>("+
user+
" YOU)</div>";

}


// other users
else{

panel.innerHTML+=
"<div>("+
user+
")</div>";

}

});

});


// copy room link
window.copyRoomLink=function(){

if(!roomId){

alert(
"Join room first"
);

return;

}

const roomLink =

window.location.origin+

"/?room="+roomId;


navigator.clipboard
.writeText(roomLink);

alert("Link copied!");

};


// clear board
window.clearBoard=function(){

if(!roomId)
return;

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

socket.emit("clear");

};


// mouse down
canvas.addEventListener(
"mousedown",
(e)=>{

if(!roomId)
return;

drawing=true;

startX=e.offsetX;
startY=e.offsetY;


// save undo
history.push(
canvas.toDataURL()
);

redoStack=[];


// snapshot
snapshot=
ctx.getImageData(
0,
0,
canvas.width,
canvas.height
);

}
);


// mouse move
canvas.addEventListener(
"mousemove",
draw
);


// draw
function draw(e){

if(!drawing || !roomId)
return;

const x=e.offsetX;
const y=e.offsetY;


// PEN
if(currentTool==="pen"){

ctx.lineWidth=lineWidth;

ctx.lineCap="round";

ctx.strokeStyle=color;

ctx.lineTo(x,y);

ctx.stroke();

ctx.beginPath();

ctx.moveTo(x,y);


socket.emit(
"draw",
{
x,
y,
color,
lineWidth
}
);

return;

}


// restore board
ctx.putImageData(
snapshot,
0,
0
);


ctx.strokeStyle=color;

ctx.lineWidth=lineWidth;


// rectangle
if(currentTool==="rectangle"){

ctx.strokeRect(
startX,
startY,
x-startX,
y-startY
);

}


// circle
else if(currentTool==="circle"){

const radius=
Math.sqrt(
(x-startX)**2+
(y-startY)**2
);

ctx.beginPath();

ctx.arc(
startX,
startY,
radius,
0,
2*Math.PI
);

ctx.stroke();

}


// line
else if(currentTool==="line"){

ctx.beginPath();

ctx.moveTo(
startX,
startY
);

ctx.lineTo(
x,
y
);

ctx.stroke();

}

}


// mouse up
canvas.addEventListener(
"mouseup",
()=>{

if(!drawing)
return;

drawing=false;

ctx.beginPath();

socket.emit("stop");

});


// undo
window.undo=function(){

if(history.length===0)
return;


redoStack.push(
canvas.toDataURL()
);

let imageData=
history.pop();

let img=
new Image();

img.src=imageData;


img.onload=()=>{

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

ctx.drawImage(
img,
0,
0
);

};

};


// redo
window.redo=function(){

if(redoStack.length===0)
return;


history.push(
canvas.toDataURL()
);

let imageData=
redoStack.pop();

let img=
new Image();

img.src=imageData;


img.onload=()=>{

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

ctx.drawImage(
img,
0,
0
);

};

};


// sync draw
socket.on(
"draw",
(data)=>{

ctx.lineWidth=
data.lineWidth;

ctx.strokeStyle=
data.color;

ctx.lineCap=
"round";

ctx.lineTo(
data.x,
data.y
);

ctx.stroke();

ctx.beginPath();

ctx.moveTo(
data.x,
data.y
);

}
);


// clear sync
socket.on(
"clear",
()=>{

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

}
);


// stop sync
socket.on(
"stop",
()=>{

ctx.beginPath();

}
);


// user count
socket.on(
"userCount",
(count)=>{

document
.getElementById(
"userCount"
)
.innerText=
"Users online: "+count;

}
);


// send message
window.sendMessage=function(){

const input=
document.getElementById(
"messageInput"
);

const msg=
input.value.trim();

if(!msg || !roomId)
return;


socket.emit(
"chatMessage",
msg
);

input.value="";

};


// receive chat
socket.on(
"chatMessage",
(msg)=>{

const box=
document.getElementById(
"chatBox"
);

box.innerHTML+=
"<div>"+msg+"</div>";

box.scrollTop=
box.scrollHeight;

}
);


// add sticky note
window.addStickyNote=function(){

const text=
prompt(
"Enter note:"
);

if(!text)
return;


socket.emit(
"newNote",
text
);

};


// receive note
socket.on(
"newNote",
(text)=>{

const note=
document.createElement(
"div"
);

note.innerText=text;

note.style.width="150px";

note.style.minHeight="100px";

note.style.background="yellow";

note.style.padding="10px";

note.style.margin="10px";

note.style.display=
"inline-block";

note.style.border=
"1px solid black";


document
.getElementById(
"notesContainer"
)
.appendChild(note);

});


// send cursor
canvas.addEventListener(
"mousemove",
(e)=>{

if(!roomId)
return;

socket.emit(
"cursorMove",
{
x:e.offsetX,
y:e.offsetY
}
);

});


// receive cursor
socket.on(
"cursorMove",
(data)=>{

let cursor=
document.getElementById(
data.id
);


// create cursor
if(!cursor){

cursor=
document.createElement(
"div"
);

cursor.id=data.id;

cursor.innerHTML="👆";

cursor.style.position=
"absolute";

cursor.style.fontSize=
"24px";

document
.getElementById(
"cursorContainer"
)
.appendChild(cursor);

}


// move cursor
cursor.style.left=
data.x+"px";

cursor.style.top=
data.y+"px";

});