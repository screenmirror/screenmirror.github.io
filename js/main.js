/*
 *  Copyright (c) 2018 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';

// Polyfill in Firefox.
// See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
if (adapter.browserDetails.browser == 'firefox') {
  adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}

const video = document.querySelector('video');
var mediaRecorder;



function handleError(error) {
  errorMsg(`getDisplayMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

var RecordEnabled = true;

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
  RecordEnabled = false;
  navigator.mediaDevices.getDisplayMedia({ video: true })
    .then(handleSuccess, handleError);
});
const startRecButton = document.getElementById('startRecButton');
startRecButton.addEventListener('click', () => {
  RecordEnabled = true;
  navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    .then(handleSuccess, handleError);
});


if ((navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
  startButton.disabled = false;
  startRecButton.disabled = false;
} else {
  errorMsg('getDisplayMedia is not supported');
}


function handleSuccess(stream) {
  startButton.disabled = true;
  startRecButton.disabled = true;
  video.srcObject = stream;

  // demonstrates how to detect that the user has stopped
  // sharing the screen via the browser UI.
  stream.getVideoTracks()[0].addEventListener('ended', () => {
    errorMsg('The user has ended sharing the screen');
    startButton.disabled = false;
    startRecButton.disabled = false;
  });

  if (RecordEnabled) {
    console.log(stream);
    var options = { mimeType: "video/webm; codecs=vp8" };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();


    // demo: to download after 9sec
    setTimeout(event => {
      RestartMediaRecorder()
    }, 5000);
  }
}


function RestartMediaRecorder() {
  console.log("stopping");
  mediaRecorder.stop();
  mediaRecorder.start();
  setTimeout(event => {
    RestartMediaRecorder()
  }, 5000);
}

var recordedChunks = [];
const downloadButton = document.getElementById('downloadButton');

downloadButton.addEventListener('click', () => {

  var fflist = "";
  var fflistfilename = filename + ".fflist";

  var cmd = "#!/bin/bash\n";
  cmd = cmd + "ffmpeg -f concat -safe 0 -i " + fflistfilename + " -c copy " + filename + ".webm\nrm -f " + filename + "-*.webm";


  for (let i = 1; i < fileindex; i++) {
    fflist = fflist + "file '" + filename + "-" + pad(i) + ".webm'\n";
  }

  downloadText(fflist, fflistfilename);
  downloadText(cmd, filename + ".sh");


});

function downloadText(txt, filename) {
  var blob = new Blob([txt], { type: 'text/plain' });

  // this will create a link tag on the fly
  // <a href="..." download>
  var link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', filename);

  // NOTE: We need to add temporarily the link to the DOM so
  //       we can trigger a 'click' on it.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleDataAvailable(event) {
  console.log("data-available");
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
    console.log(recordedChunks);
    download();
  } else {
    // ...
  }
}

var fileindex = 1
var filename = "Record-" + Date.now().toString()
function download() {
  var blob = new Blob(recordedChunks, {
    type: "video/webm"
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = filename + "-" + pad(fileindex) + ".webm";
  fileindex += 1;
  a.click();
  window.URL.revokeObjectURL(url);
  recordedChunks = []
}

function pad(num) {
  var s = "000000000" + num;
  return s.substr(s.length - 10);
}





function PlaybackMic() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  var aCtx;
  var analyser;
  var microphone;
  if (navigator.getUserMedia) {
    navigator.getUserMedia(
      { audio: true },
      function (stream) {

        aCtx = new (window.AudioContext || window.webkitAudioContext)();
        // aCtx = new AudioContext();

        window.AudioContext.
          microphone = aCtx.createMediaStreamSource(stream);
        var destination = aCtx.destination;
        microphone.connect(destination);


      },
      function () { console.log("Error 003.") }
    );
  }
}