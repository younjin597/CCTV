let webcam;
let detector;

let myVideoRec;
let recorder;
let recordedChunks = [];

let state = 0;
// 0: main page  1: recording page  2: paused page  3: saved page

let btn_pause = [];
let btn_record = [];
let btn_stop = [];

let recordingTime = '00:00:00'; // Text type variable
let recordingStartTime = 0; // Number type variable
let pausedStartTime = 0; // Number type variable
let pausedTime = 0; // Number type variable
let totalPausedTime = 0; // Number type variable

let peopleNumber = 0;

let detectedObjects = [];

let myWriter;
let writerMsg = '';

function preload() {
  detector = ml5.objectDetector('cocossd');

  // 실제로 있는 이미지들만 로드
  btn_record[0] = loadImage('img/record_stop.png');
  btn_record[1] = loadImage('img/record_recording.png');
  btn_record[2] = loadImage('img/record_paused.png');
  btn_record[3] = loadImage('img/record_saved.png');

  btn_pause[0] = loadImage('img/pause_disabled.png');
  btn_pause[1] = loadImage('img/pause_activated.png');

  btn_stop[0] = loadImage('img/stop_disabled.png');
  btn_stop[1] = loadImage('img/stop_activated.png');
}

function setup() {
  createCanvas(1512, 982);
  webcam = createCapture(VIDEO);
  recorder = new MediaRecorder(webcam.elt.captureStream(), { mimeType: 'video/webm' });
  recorder.ondataavailable = function (e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };
  recorder.onstop = function() {
  saveVideo();
  if (myWriter) {
    myWriter.close();
    myWriter.clear();
  }
};

  webcam.size(1512, 750);
  webcam.hide();

  detector.detect(webcam, gotDetections);
}

function draw() {
  background(0);

  calculateRecordingTime();

  drawVideoPreview(0, 0, 1512, 750);

  doCOCOSSD();

  drawButtons(state);
  drawStatusBarTop(state);
  drawStatusBarBottom();
  drawStateIndicator(state);
  writeLog(state);

  peopleNumber = 0;
}

function drawVideoPreview(x, y, w, h) {
  image(webcam, x, y, w, h);
}

// drawStateIndicator 함수에서 텍스트만 사용
function drawStateIndicator(currentState) {
  let indicatorX = width / 2;
  let indicatorY = 805;

  textFont('Inter');
  textSize(18);
  textAlign(CENTER, CENTER);

  if (currentState === 0) {
    fill(255);
    text('Tap to record', indicatorX, indicatorY);
  } else if (currentState === 1) {
    fill(255, 0, 0);
    text('Recording', indicatorX, indicatorY);
  } else if (currentState === 2) {
    fill(200);
    text('Paused', indicatorX, indicatorY);
  } else if (currentState === 3) {
    fill(255);
    text('Video and data saved!', indicatorX, indicatorY);
  }
}

// drawCounter에서도 아이콘 이미지를 제거하고 텍스트만 사용
function drawCounter(currentState) {
  fill(255, 51);
  noStroke();
  rect(2, 262, 60, 20, 4);

  textFont('Inter');
  textSize(14);

  if (currentState == 1) {
    fill(255);
    textAlign(LEFT);
    text(peopleNumber, 29, 277);
  } else {
    fill(255, 153);
    textAlign(LEFT);
    text(peopleNumber, 29, 277);
  }
}

function drawButtons(currentState) {
  let btnY = 860;
  let btnSize = 60;
  let startX = (width - (btnSize * 3 + 25 * 2)) / 2;
  let spacing = 25;

  let pauseButtonState = currentState === 1 ? 1 : 0;
  let stopButtonState = currentState === 1 ? 1 : 0;
  image(btn_pause[pauseButtonState], startX, btnY, btnSize, btnSize);
  image(btn_record[currentState], startX + btnSize + spacing, btnY, btnSize, btnSize);
  image(btn_stop[stopButtonState], startX + (btnSize + spacing) * 2, btnY, btnSize, btnSize);
}

function drawStatusBarTop(currentState) {
  fill(255, 255, 255, 180);
  noStroke();
  rect(20, 20, 140, 30, 15);
  rect(180, 20, 140, 30, 15);

  textFont('Inter');
  textSize(16);
  fill(0);
  textAlign(CENTER, CENTER);

  let currentTime = '' + nf(hour(), 2, 0) + ':' + nf(minute(), 2, 0) + ':' + nf(second(), 2, 0);
  let currentDate = '' + year() + '.' + nf(month(), 2, 0) + '.' + nf(day(), 2, 0);

  text(currentDate, 90, 35);
  text(currentTime, 250, 35);

  

  

  // Draw recording indicator circle inside the recording time box
  fill(0, 0, 0, 178); // Black background with 70% transparency
  noStroke();
  rect(20, 60, 140, 30, 15);

  fill(255);
  noStroke();
  ellipse(40, 75, 15, 15);
  if (state === 1) {
    fill(255, 0, 0);
    ellipse(370, 35, 10, 10);
  }
  

  // Adjust recording time text position
  textAlign(LEFT, CENTER);
  textAlign(CENTER, CENTER);
  text(recordingTime, 90, 75);

  // Draw recording time at the top right
  
}

function drawStatusBarBottom() {
  fill(0, 0, 0, 180);
  noStroke();
  rect(20, 780, 480, 90, 15);

  

  fill(255);
  textFont('Inter');
  textSize(16);
  textAlign(LEFT, CENTER);

  // Display current time, recording time, and number of passengers
  text('Current time: ' + nf(hour(), 2, 0) + ':' + nf(minute(), 2, 0) + ':' + nf(second(), 2, 0), 40, 795);
  text('Recording time: ' + recordingTime, 40, 815);
  text('Passengers: ' + peopleNumber, 40, 835);

}
function gotDetections(error, results) {
  if (error) {
    console.error(error);
    return;
  }

  detectedObjects = results;
  detector.detect(webcam, gotDetections);
}

function mouseReleased() {
  let btnSize = 60;
  let startX = (width - (btnSize * 3 + 25 * 2)) / 2;
  let btnY = 860;
  let spacing = 25;

  if (dist(mouseX, mouseY, startX + btnSize / 2, btnY) <= btnSize / 2) {
    if (state === 1) {
      state = 2;
      pausedStartTime = millis();
    }
  } else if (dist(mouseX, mouseY, startX + btnSize + spacing + btnSize / 2, btnY) <= btnSize / 2) {
    if (state === 0 || state === 2) {
      state = 1;
      recordingStartTime = state === 0 ? millis() : recordingStartTime;
      totalPausedTime += state === 2 && pausedStartTime !== 0 ? millis() - pausedStartTime : 0;
      startLog();
      recordedChunks = [];
      recorder.start();
    }
  } else if (dist(mouseX, mouseY, startX + (btnSize + spacing) * 2 + btnSize / 2, btnY) <= btnSize / 2) {
    if (state === 1) {
      state = 3;
      initializeTimes();
      saveLog();
      recorder.stop();
    }
  } else if (state === 3) {
    state = 0;
  }
}

function initializeTimes() {
  recordingStartTime = 0;
  pausedStartTime = 0;
  pausedTime = 0;
  totalPausedTime = 0;
}

function calculateRecordingTime() {
  let cur_time = millis();

  if (state == 0) {
    recordingTime = '00:00:00';
  } else if (state == 1) {
    let rec_time = cur_time - recordingStartTime - totalPausedTime;
    let rec_sec = int(rec_time / 1000) % 60;
    let rec_min = int(rec_time / (1000 * 60)) % 60;
    let rec_hour = int(rec_time / (1000 * 60 * 60)) % 24;

    recordingTime = '' + nf(rec_hour, 2, 0) + ':' + nf(rec_min, 2, 0) + ':' + nf(rec_sec, 2, 0);
  } else if (state == 2) {
    pausedTime = millis() - pausedStartTime;
  } else if (state == 3) {
    recordingTime = '00:00:00';
  }
}

function doCOCOSSD() {
  let tempMsg = '';
  for (let i = 0; i < detectedObjects.length; i++) {
    let object = detectedObjects[i];

    if (object.label == 'person') {
      peopleNumber += 1;

      stroke(255, 0, 254);
      strokeWeight(2);
      noFill();
      rect(object.x, object.y, object.width, object.height);
      noStroke();
      fill(255, 0, 254);
      textSize(10);
      text(object.label + ' ' + peopleNumber, object.x, object.y - 5);

      let centerX = object.x + (object.width / 2);
      let centerY = object.y + (object.height / 2);
      strokeWeight(4);
      stroke(255, 0, 254);
      point(centerX, centerY);

      tempMsg = tempMsg + ',' + peopleNumber + ',' + centerX + ',' + centerY;
    }
  }
  let millisTime = int(millis() - recordingStartTime - totalPausedTime);
  writerMsg = '' + recordingTime + ',' + millisTime + ',' + peopleNumber + tempMsg;
}

function startLog() {
  let mm = nf(month(), 2, 0);
  let dd = nf(day(), 2, 0);
  let ho = nf(hour(), 2, 0);
  let mi = nf(minute(), 2, 0);
  let se = nf(second(), 2, 0);

  let fileName = 'data_' + mm + dd + '_' + ho + mi + se + '.csv';

  myWriter = createWriter(fileName);
}

function saveLog() {
  if (myWriter) {
    myWriter.close();
    myWriter.clear();
  }
}

function saveVideo() {
  if (recordedChunks.length) {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'recorded_video_' + year() + nf(month(), 2) + nf(day(), 2) + '_' + nf(hour(), 2) + nf(minute(), 2) + nf(second(), 2) + '.webm';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    recordedChunks = [];
  }
}


function writeLog(currentState) {
  if (currentState == 1 && myWriter) {
    myWriter.print(writerMsg);
  }
  
}
