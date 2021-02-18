import './index.css';
import nameGenerator from './name-generator';
import isDef from './is-def';



// Store/retrieve the name in/from a cookie.
const cookies = document.cookie.split(';');
console.log(cookies)
let wsname = cookies.find(function(c) {
  if (c.match(/wsname/) !== null) return true;
  return false;
});
if (isDef(wsname)) {
  wsname = wsname.split('=')[1];
} else {
  wsname = nameGenerator();
  document.cookie = "wsname=" + encodeURIComponent(wsname);
}

let wscolor = cookies.find(function (c) {
  if (c.match(/wscolor/) !== null)
  return true;

  return false;
});
if (isDef(wscolor)) {
  wscolor = wscolor.split('=')[1];
} else {
  wscolor = 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';
  document.cookie = "wscolor=" + wscolor;
}

// Set the name in the header
document.querySelector('header>p').textContent = decodeURIComponent(wsname);

// Create a WebSocket connection to the server
const ws = new WebSocket("ws://" + window.location.host+ "/socket");

// We get notified once connected to the server
ws.onopen = (event) => {
  console.log("We are connected.");
};

/*
// Listen to messages coming from the server. When it happens, create a new <li> and append it to the DOM.
const messages = document.querySelector('#messages');
let line;
ws.onmessage = (event) => {
  line = document.createElement('li');
  line.textContent = event.data;
  messages.appendChild(line);
};

// Retrieve the input element. Add listeners in order to send the content of the input when the "return" key is pressed.
function sendMessage(event) {
  event.preventDefault();
  event.stopPropagation();
  if (sendInput.value !== '') {
    // Send data through the WebSocket
    ws.send(sendInput.value);
    sendInput.value = '';
  }
}
const sendForm = document.querySelector('form');
const sendInput = document.querySelector('form input');
sendForm.addEventListener('submit', sendMessage, true);
sendForm.addEventListener('blur', sendMessage, true);
*/

const roomsHTML = document.querySelector('#rooms');
const buttonHTML = document.querySelector('#button');
let roomHTML;

var canvas = document.getElementById('canvas');
var canvasBorder = canvas.getBoundingClientRect();
var context = canvas.getContext('2d');
canvas.width = 4 * (window.innerWidth / 5);
canvas.height = window.innerHeight / 2;

var myRoom = "Bienvenue dans le salon !";
var myRoomId = 0;
let rooms = [myRoom];
var myCoord = [,];
var previousCoord = [,];
var mouseDown = false;

canvas.addEventListener("mousedown", (event) => {
  mouseDown = true;
});

canvas.addEventListener("mouseup", (event) => {
  mouseDown = false;
});

canvas.addEventListener("mousemove", (event) => {
  if (mouseDown) {
    myCoord[0] = event.clientX;
    myCoord[1] = event.clientY;
    sendData("draw");
  }
});

function sendData(mode) {
  let json = JSON.stringify({
    "x": myCoord[0],
    "y": myCoord[1],
    "color": wscolor,
    "mode": mode,
    "roomName": myRoom,
    "roomId": myRoomId
  });

  ws.send(json);
}

ws.onmessage = (event) => {
  var jsonParse = JSON.parse(event.data);

  let mode = jsonParse.mode;
  let roomName = jsonParse.roomName;
  let roomId = jsonParse.roomId;
  let draw;
  switch (mode) {

    case "draw":
    let x = jsonParse.x;
    let y = jsonParse.y;
    let color = jsonParse.color;

    if (roomName === myRoom && roomId === myRoomId) {
      drawLine(x, y, color);
    }
    break;

    case "create":
    console.log("create mode");
    createRoom(roomName, roomId);
    break;

    case "change":
    console.log("change mode");
    draw = jsonParse.tab;
    for (let i = 0; i < draw.length; i++) {
      if(draw[i] !== null){
        drawLine(draw[i][0], draw[i][1], draw[i][2]);
      }
    }
    break;

    case "connection":
    console.log("connection mode");

    draw = jsonParse.tab;
    for (let i = 0; i < draw.length; i++) {
      if (draw[i] !== null) {
        drawLine(draw[i][0], draw[i][1], draw[i][2]);
      }
    }

    let roomAlreadyCreated = jsonParse.rooms;
    for (let i = 1; i < roomAlreadyCreated.length; i++) {
      if (roomAlreadyCreated[i] !== null) {
        createRoom(roomAlreadyCreated[i], i);
      }
    }
    break;
  }
};

function drawLine(x, y, c) {
  context.strokeStyle = c;
  context.beginPath();
  context.moveTo(x, y);
  var cercle = new Path2D();
  cercle.arc(x - canvasBorder.left, y - canvasBorder.top, 10, 0, 2 * Math.PI);
  context.fillStyle = c;
  context.fill(cercle);
  context.closePath();
}

buttonHTML.addEventListener("click", function (event) {
  sendData("create");
});

function createRoom(roomName, roomId) {
  rooms.push(roomName);
  roomHTML = document.createElement("option");
  roomHTML.textContent = roomName;
  roomHTML.id = roomId;
  roomsHTML.appendChild(roomHTML);
  console.log("New room created : " + roomHTML.textContent + " id : " + roomHTML.id)
}

roomsHTML.addEventListener("change", function (event) {
  context.fillStyle = '#2e2e2e';
  context.fillRect(0, 0, window.innerWidth, window.innerHeight);
  myRoom = roomsHTML.value;
  myRoomId = rooms.indexOf(myRoom);
  sendData("change");
});
