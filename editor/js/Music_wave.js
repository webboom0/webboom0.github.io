import { createCanvasElement } from "three";
import {
  UIPanel,
  UIRow,
  UIButton,
  UIText,
  UIInput,
  UINumber,
} from "./libs/ui.js";

function Music(ffmpeg) {
  const { createFFmpeg, fetchFile } = FFmpeg;
  const container = new UIPanel();
  container.setId("musicEdit");
  //   music controls
  const musicControls = new UIPanel();
  musicControls.setClass("music-controls");
  container.add(musicControls);
  //   file input
  const fileInput = new UIInput();
  fileInput.setId("fileInput");
  fileInput.dom.setAttribute("type", "file");
  fileInput.dom.setAttribute("accept", "audio/*");
  musicControls.add(fileInput);
  //   start time
  const startTime = new UINumber();
  startTime.setId("startTime");
  startTime.dom.setAttribute("min", "0");
  musicControls.add(startTime);
  //   end time
  const endTime = new UINumber();
  endTime.setId("endTime");
  endTime.dom.setAttribute("min", "0");
  musicControls.add(endTime);

  const cutButton = new UIButton();
  cutButton.setId("cutButton");
  cutButton.dom.textContent = "Cut Audio";
  musicControls.add(cutButton);

  //   audio player
  const audioPlayer = document.createElement("audio");
  audioPlayer.setAttribute("controls", "");
  audioPlayer.setAttribute("id", "audioPlayer");
  musicControls.dom.appendChild(audioPlayer);

  const visualizer = document.createElement("canvas");
  visualizer.setAttribute("id", "visualizer");
  visualizer.width = 800;
  visualizer.height = 200;
  musicControls.dom.appendChild(visualizer);

  let audioContext;
  let audioBuffer; // audioBuffer 변수를 상위 스코프에 선언
  let source;
  let analyser;
  let dataArray;
  let animationId;

  fileInput.dom.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext.decodeAudioData(
          e.target.result,
          function (buffer) {
            audioBuffer = buffer; // audioBuffer에 디코딩된 오디오 데이터를 저장
          },
          function (error) {
            console.error("Error decoding audio data", error);
          },
        );
      };
      reader.readAsArrayBuffer(file);
    }
  });

  cutButton.dom.addEventListener("click", async () => {
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;

    if (!fileInput.dom.files[0]) {
      alert("Please select an audio file.");
      return;
    }

    if (!startTime || !endTime || startTime >= endTime) {
      alert("Please enter valid start and end times.");
      return;
    }
    const file = fileInput.dom.files[0];
    const fileName = file.name;

    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    ffmpeg.FS("writeFile", fileName, await fetchFile(file));

    await ffmpeg.run(
      "-i",
      fileName,
      "-ss",
      startTime,
      "-to",
      endTime,
      "-c",
      "copy",
      "output.mp3",
    );

    const data = ffmpeg.FS("readFile", "output.mp3");

    const audioBlob = new Blob([data.buffer], { type: "audio/mp3" });
    const audioUrl = URL.createObjectURL(audioBlob);

    audioPlayer.src = audioUrl;
    audioPlayer.play();

    // 잘라낸 오디오 데이터를 다시 디코딩하여 audioBuffer로 설정
    const arrayBuffer = data.buffer;
    audioContext.decodeAudioData(
      arrayBuffer,
      function (buffer) {
        audioBuffer = buffer;
        startVisualizer();
      },
      function (error) {
        console.error("Error decoding cut audio data", error);
      },
    );
  });

  function startVisualizer() {
    if (audioBuffer) {
      source = audioContext.createBufferSource();
      analyser = audioContext.createAnalyser();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      source.start(0);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      draw();
    }
  }

  function draw() {
    const canvasCtx = visualizer.getContext("2d");
    animationId = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = "rgb(0, 0, 0)";
    canvasCtx.fillRect(0, 0, visualizer.width, visualizer.height);

    const barWidth = (visualizer.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      barHeight = dataArray[i];

      canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
      canvasCtx.fillRect(
        x,
        visualizer.height - barHeight / 2,
        barWidth,
        barHeight / 2,
      );

      x += barWidth + 1;
    }
  }
  function drawLineWaveform() {
    const canvasCtx = visualizer.getContext("2d");
    animationId = requestAnimationFrame(drawLineWaveform);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.clearRect(0, 0, visualizer.width, visualizer.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 255, 0)"; // 라인 색상 설정
    canvasCtx.beginPath();

    const sliceWidth = visualizer.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * visualizer.height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(visualizer.width, visualizer.height / 2);
    canvasCtx.stroke();
  }
  function drawBarWaveform() {
    const canvasCtx = visualizer.getContext("2d");
    animationId = requestAnimationFrame(drawBarWaveform);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, visualizer.width, visualizer.height);

    const barWidth = (visualizer.width / dataArray.length) * 2.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = dataArray[i] / 2;

      canvasCtx.fillStyle = `rgb(${barHeight + 100}, ${barHeight + 50}, 255)`;
      canvasCtx.fillRect(
        x,
        visualizer.height / 2 - barHeight / 2,
        barWidth,
        barHeight,
      );

      x += barWidth + 1;
    }
  }

  function drawGradientBarWaveform() {
    const canvasCtx = visualizer.getContext("2d");
    animationId = requestAnimationFrame(drawGradientBarWaveform);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, visualizer.width, visualizer.height);

    const barWidth = (visualizer.width / dataArray.length) * 0.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = dataArray[i] / 2;

      const gradient = canvasCtx.createLinearGradient(
        0,
        0,
        0,
        visualizer.height,
      );
      gradient.addColorStop(0, "#e30108");
      gradient.addColorStop(0.5, "#f719fd");
      gradient.addColorStop(1, "#01fbfc");

      canvasCtx.fillStyle = gradient;
      canvasCtx.fillRect(
        x,
        visualizer.height / 2 - barHeight / 2,
        barWidth,
        barHeight,
      );

      x += barWidth + 1;
    }
  }

  return container;
}

export { Music };
