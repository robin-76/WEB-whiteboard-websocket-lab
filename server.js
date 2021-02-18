var http = require('http'),
WebSocketServer = require('ws').Server,
port = 1234,
host = '0.0.0.0';

// create a new HTTP server to deal with low level connection details (tcp connections, sockets, http handshakes, etc.)
var server = http.createServer();

// create a WebSocket Server on top of the HTTP server to deal with the WebSocket protocol
var wss = new WebSocketServer({
  server: server
});

var rooms = ["Bienvenue"];
var points = [[]];
const roomStr = "Salon ";

// create a function to be able do broadcast messages to all WebSocket connected clients
wss.broadcast = function broadcast(message, destination) {

  wss.clients.forEach(function each(client) {
    client.send(message);
  });
};

// Register a listener for new connections on the WebSocket.
wss.on('connection', function (client, request) {

  // retrieve the name in the cookies
  var cookies = request.headers.cookie.split(';');
  var wsname = cookies.find((c) => {
    return c.match(/^\s*wsname/) !== null;
  });
  wsname = wsname.split('=')[1];

  // greet the newly connected user
  client.send(JSON.stringify({
    "mode": "connection",
    "tab": points[0],
    "rooms": rooms
  }));

  // Register a listener on each message of each connection
  client.on('message', function (message) {
    var cli = '[' + decodeURIComponent(wsname) + '] ';
    //console.log("message from" + cli + " message: " + message);
    // when receiving a message, broadcast it to all the connected clients

    //console.log("Server Receiving: " + message);
    var jsonParse = JSON.parse(message);

    let mode = jsonParse.mode;
    let roomName = jsonParse.roomName;
    let roomId = jsonParse.roomId;

    switch (mode) {
      case "draw":
      let x = jsonParse.x;
      let y = jsonParse.y;
      let color = jsonParse.color;

      if (rooms.includes(roomName)) {
        points[roomId].push([x, y, color]);

        wss.broadcast(JSON.stringify({
          "x": x,
          "y": y,
          "color": color,
          "mode": mode,
          "roomName": roomName,
          "roomId": roomId
        }));
      }
      break;

      case "create": //on créer un nouvelle room dans le tableau
      console.log("create mode");

      rooms.push(roomStr + rooms.length);
      points.push([null, null, null]);

      wss.broadcast(JSON.stringify({
        "mode": mode,
        "roomName": rooms[rooms.length - 1],
        "roomId": rooms.length - 1
      }));

      break;

      case "change":
      console.log("change mode");
      console.log("roomId : " + roomId + " roomName :" + roomName);

      if (rooms.includes(roomName)) {
        let id = rooms.indexOf(roomName);
        client.send(JSON.stringify({
          "mode": mode,
          "roomName": roomName,
          "roomId": roomId,
          "tab": points[id]
        }));
      }
      break;
    }
  });
});

// http sever starts listening on given host and port.
server.listen(port, host, function () {
  console.log('Listening on ' + server.address().address + ':' + server.address().port);
});

process.on('SIGINT', function () {
  process.exit(0);
});
