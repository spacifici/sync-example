'use strict';

var os = require('os');
var http = require('https');
var net = require('net');

// Get a list of local IPs
var IPs = (function () {
  var IPs = [];
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function (ifname) {
    ifaces[ifname].forEach(function (iface) {
      if (iface.family !== 'IPv4' || iface.internal) {
        return;
      }
      IPs.push(iface.address);
    });
  });
  return IPs;
})();

document.addEventListener('DOMContentLoaded', function () {
  var connectButton = document.getElementById("connect-button");
  connectButton.addEventListener('click', onConnectClicked);
});


function onConnectClicked(e) {
  this.disabled = true;
  var url = "https://stormy-shelf-9681.herokuapp.com/discover?ips=" + IPs.join(',');
  http.get(url, function (response) {
    response.on('data', onConnect);
  }).on('error', function(e) {
    console.log('Got error' + e.message);
  });
}

function onConnect(data) {
  var json = JSON.parse(data);
  if ('inner_ips' in json) {
    // Compare result IPs with the received ones
    var ipList= json['inner_ips'].split(',');
    var max = 0;
    var choosenIP = '';
    ipList.forEach(function (ip) {
      IPs.forEach(function (localIp) {
        var sharedLength = sharedPrefix([ip, localIp]).length;
        if (sharedLength > max) {
          max = sharedLength;
          choosenIP = ip;
        }
      });
    })
    updateStatus('Connecting to: ' + choosenIP);
    var connection = net.connect(11480, choosenIP);
    onConnected(connection);
  } else {
    // Open a server and listen for one minute;
    updateStatus('Listening for connections');
    var server = net.createServer(onConnected);
    server.listen(11480);
  }
}

function onConnected(connection) {
  updateStatus('Connected');
  var messagesArea = document.getElementById('message-area');
  connection.on('data', function(data) {
    messagesArea.innerHTML += '<div class="in-message">' + data.toString() + '</div>';
  });
  connection.on('timeout', function() {
    connection.end("bye");
  });

  var messageBox = document.getElementById('message-box');
  messageBox.addEventListener('keyup', function(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      connection.write(messageBox.value + '\r\n');
      messagesArea.innerHTML += '<div class="out-message">' + messageBox.value + '</div>'
      messageBox.value = "";
    }
  });
}

function updateStatus(message) {
  document.getElementById('connection-area').innerHTML= message;
}

function sharedPrefix(array) {
  var A= array.concat().sort();
  var a1 = A[0], a2 = A[A.length-1], L = a1.length, i = 0;
  while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
  return a1.substring(0, i);
}
