// getting dom elements
var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

// variables
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;

var iceServers = {
  'iceServers': [
    { 'url': 'stun:stun.services.mozilla.com' },
    { 'url': 'stun:stun.l.google.com:19302' },
    //{
    //  'url': 'turn:192.158.29.39:3478?transport=udp',
    //  'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //  'username': '28224511:1379330808'
    //}
  ]
}
var streamConstraints = { audio: true, video: true };
var isCaller;
//var dataChannel;



// Let's do this
var socket = io(); //Socket Conection is on fire


// Create or join request
btnGoRoom.onclick = function () {
  if (inputRoomNumber.value === '') {
    alert("Please type a room number")
  } else {
    roomNumber = inputRoomNumber.value;
    socket.emit('create or join', roomNumber); // Just request to server, i need a room.
    divSelectRoom.style = "display: none;";
    divConsultingRoom.style = "display: block;";
  }
};


// Own Video Capture Started when room created/joined except others
socket.on('created', function (room) {
  navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
    localStream = stream;
    localVideo.srcObject = stream;
    localVideo.play();
    isCaller = true;
  }).catch(function (err) {
    console.log(err);
    console.log('An error ocurred when accessing media devices');
  });
});




socket.on('joined', function (room) {
  navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
    localStream = stream;
    localVideo.srcObject = stream;
    localVideo.play();
    socket.emit('ready', roomNumber); // Now 2nd person joined and now we can say ready.
  }).catch(function (err) {
    console.log(err);
  });
});




// NOW THE MEJOR TASK TO RECIEVE OTHERS VIDEO.


socket.on('ready', function () {
  if (isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers); // INITIATE RTCT-PEER-CONNECTION
    
    rtcPeerConnection.onicecandidate = onIceCandidate; //will be called when a new candidate reached
    rtcPeerConnection.onaddstream = onAddStream; // when a MediaStream is added to this connection by the remote peer
    rtcPeerConnection.addStream(localStream); //  add local stream
    rtcPeerConnection.createOffer(setLocalAndOffer, function (e) { console.log(e) }); //Creates an offer(request) to find a remote peer.

    //dataChannel = rtcPeerConnection.createDataChannel();
    //dataChannel.onmemessage = event => {console.log(event.data)};
  }
});

//Avaiable candidate
socket.on('candidate', function (event) {
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate
  });
  rtcPeerConnection.addIceCandidate(candidate);
});



socket.on('offer', function (event) {
  if (!isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.onaddstream = onAddStream;
    rtcPeerConnection.addStream(localStream);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event)); // Properties of the connection. Three parameters, RTCSessionDescription object, callback if the change of description succeeds, callback if the change of description fails.
    rtcPeerConnection.createAnswer(setLocalAndAnswer, function (e) { console.log(e) });

    //rtcPeerConnection.onDataChannel = event => {
      //dataChannel = event.channel;
      //dataChannel.onmemessage = event => { console.log(event.data) };
    //};
  }
});

socket.on('answer', function (event) {
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
})

// handler functions
function onIceCandidate(event) {
  if (event.candidate) {
    console.log('sending ice candidate');
    socket.emit('candidate', {
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber
    })
  }
}

function onAddStream(event) {

  //remoteVideo.src = URL.createObjectURL(event.stream);
  remoteVideo.srcObject = event.stream;
  remoteVideo.play();
  remoteStream = event.stream;
}

function setLocalAndOffer(sessionDescription) {
  rtcPeerConnection.setLocalDescription(sessionDescription);
  socket.emit('offer', {
    type: 'offer',
    sdp: sessionDescription,
    room: roomNumber
  });
}

function setLocalAndAnswer(sessionDescription) {
  rtcPeerConnection.setLocalDescription(sessionDescription);
  socket.emit('answer', {
    type: 'answer',
    sdp: sessionDescription,
    room: roomNumber
  });
}

socket.on('pingoutx', function (txt) {
  console.log('pingx', txt);
  alert('Knock knock, someone pinged!');
});


document.getElementById("pingRequest").addEventListener("click", function () {
  console.log('pingx', 'clicked');
  socket.emit('pingx', '123');
});
