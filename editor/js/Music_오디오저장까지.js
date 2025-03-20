import { createCanvasElement } from "three";
import {
  UIPanel,
  UIRow,
  UIButton,
  UIText,
  UIInput,
  UINumber,
} from "./libs/ui.js";

// 스타일 수정
const style = document.createElement("style");
style.textContent = `
  .button-3d {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, #383838, #2a2a2a);
    transition: all 0.2s ease;
  }

  .button-3d::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background: linear-gradient(145deg, #404040, #202020);
    z-index: 1;
    box-shadow: 
      2px 2px 4px rgba(0, 0, 0, 0.7),
      -2px -2px 4px rgba(255, 255, 255, 0.2);
  }

  .button-3d::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    border-radius: 50%;
    background: linear-gradient(145deg, #202020, #2a2a2a);
    z-index: 2;
    box-shadow: 
      inset 2px 2px 4px rgba(0, 0, 0, 0.8),
      inset -1px -1px 3px rgba(255, 255, 255, 0.2);
  }

  .button-3d i {
    color: #ffffff;
    font-size: 14px;
    opacity: 0.9;
    position: relative;
    z-index: 3;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  }

  .button-3d:hover::before {
    background: linear-gradient(145deg, #454545, #252525);
    box-shadow: 
      3px 3px 5px rgba(0, 0, 0, 0.8),
      -2px -2px 4px rgba(255, 255, 255, 0.07);
  }

  .button-3d:hover::after {
    background: linear-gradient(145deg, #252525, #303030);
  }

  .button-3d:active::before {
    background: linear-gradient(145deg, #202020, #404040);
    box-shadow: 
      1px 1px 2px rgba(0, 0, 0, 0.6),
      -1px -1px 2px rgba(255, 255, 255, 0.03);
  }

  .button-3d:active::after {
    background: linear-gradient(145deg, #1a1a1a, #252525);
    box-shadow: 
      inset 3px 3px 5px rgba(0, 0, 0, 0.9),
      inset -1px -1px 3px rgba(255, 255, 255, 0.03);
  }

  .button-3d.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-3d.disabled::before,
  .button-3d.disabled::after {
    background: linear-gradient(145deg, #252525, #202020);
    box-shadow: none;
  }

  /* 버튼 컨테이너 스타일 */
  .music-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    // background: #1a1a1a;
    border-radius: 8px;
  }
`;

document.head.appendChild(style);

function Music({ ffmpeg, fetchFile }) {
  // FFmpeg 인스턴스와 fetchFile은 외부에서 전달받은 것을 사용
  const container = new UIPanel();
  container.setId("musicEdit");
  //   music controls
  const musicControls = new UIPanel();
  musicControls.setClass("music-controls");
  container.add(musicControls);
  //   file input
  const fileInput = new UIInput();
  fileInput.setId("fileInput");
  fileInput.setClass("fileInput");
  fileInput.dom.setAttribute("type", "file");
  fileInput.dom.setAttribute("accept", "audio/*");
  musicControls.add(fileInput);
  //   start time
  const startTimeUi = new UINumber();
  startTimeUi.setId("startTime");
  startTimeUi.dom.setAttribute("min", "0");
  startTimeUi.dom.setAttribute("readonly", "readonly");
  startTimeUi.dom.value = secondsToTime(0);
  musicControls.add(startTimeUi);
  //   end time
  const endTimeUi = new UINumber();
  endTimeUi.setId("endTime");
  endTimeUi.dom.setAttribute("min", "0");
  endTimeUi.dom.value = secondsToTime(0);
  endTimeUi.dom.setAttribute("readonly", "readonly");
  musicControls.add(endTimeUi);
  // Cut 버튼 생성
  const cutButton = new UIButton("Cut Audio");
  cutButton.setId("cutButton");
  musicControls.add(cutButton);
  // Play 버튼 생성
  const playButton = new UIButton("Play");
  playButton.setId("playButton");
  playButton.dom.classList.add("disabled");
  musicControls.add(playButton);
  // Pause 버튼 생성
  // const pauseButton = new UIButton("");
  // pauseButton.setId("pauseButton");
  // pauseButton.dom.classList.add("button-3d", "disabled");
  // pauseButton.dom.innerHTML = '<i class="fas fa-pause"></i>';
  // pauseButton.dom.title = "Pause";
  // musicControls.add(pauseButton);
  // Stop 버튼 생성
  // const stopButton = new UIButton("Stop");
  // stopButton.setId("stopButton");
  // stopButton.dom.classList.add("disabled");
  // musicControls.add(stopButton);
  // 버튼 내용을 아이콘으로 변경
  cutButton.dom.innerHTML = '<i class="fas fa-cut"></i>';
  playButton.dom.innerHTML = '<i class="fas fa-play"></i>';
  // stopButton.dom.innerHTML = '<i class="fas fa-stop"></i>';
  // pauseButton.dom.innerHTML = '<i class="fas fa-pause"></i>';

  // 버튼에 클래스 적용
  cutButton.dom.classList.add("button-3d", "cut-button");
  playButton.dom.classList.add("button-3d", "play-button");
  // stopButton.dom.classList.add("button-3d", "stop-button");
  // pauseButton.dom.classList.add("button-3d", "pause-button");

  // 툴크 추가 (마우스 오버시 설명 표시)
  cutButton.dom.title = "Cut Audio";
  playButton.dom.title = "Play";
  // stopButton.dom.title = "Stop";

  // const pauseButton = new UIButton("Pause");
  // pauseButton.setId("pauseButton");
  // musicControls.add(pauseButton);

  //   audio player
  const audioPlayer = document.createElement("audio");
  // audioPlayer.setAttribute("controls", "");
  audioPlayer.setAttribute("id", "audioPlayer");
  musicControls.dom.appendChild(audioPlayer);

  let audioContext;
  let audioBuffer; // 원본 오디오 버퍼
  let cutAudioBuffer; // cut된 오디오 버퍼
  let source;
  let analyser;
  let dataArray;
  let animationId;
  let data;
  let arrayBuffer;
  let isPlaying = false;
  let gainNode; // GainNode 생성
  let startTime = 0; // 재생 시작 시간
  let endTime = 0; // 마지막 시간
  let pausedAt = 0; // 일시정지된 시점의 시간을 저장
  let playStartTime = 0; // 실제 재생 시작 시간
  let audioStartOffset = 0; // 오디오 시작 위치
  let audioUrl = null; // 오디오 시작 위치

  // 재생 상태를 저장할 변수들
  let audioState = {
    isPlaying: false,
    currentTime: 0,
    audioUrl: null,
    markerStartTime: 0,
    markerEndTime: 0,
    volume: 0.5,
  };

  fileInput.dom.addEventListener("change", function (event) {
    const file = event.target.files[0];
    console.log("event.target.files");
    console.log(fileInput.dom.files);
    if (file) {
      audioUrl = URL.createObjectURL(file);
      loadMusic(file);
    }
  });

  function loadMusic(file) {
    audioPlayer.src = audioUrl;
    console.log("loadMusic");
    console.log(audioPlayer);
    // editor.scene.userData.music에 오디오 정보 저장

    console.log("fileInput Change");
    console.log(editor.scene.userData.music);
    const reader = new FileReader();
    reader.onload = function (e) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContext.decodeAudioData(
        e.target.result,
        function (buffer) {
          audioBuffer = buffer; // audioBuffer에 디코딩된 오디오 데이터를 저장
          gainNode = audioContext.createGain(); // GainNode 생성
          gainNode.gain.value = 0.5; // 초기 볼륨 설정
          gainNode.connect(audioContext.destination); // GainNode를
          console.log(secondsToTime(audioBuffer.duration));
          // 프로그래스바 연결
          startMarker.style.left = "0%";
          endMarker.style.left = "100%";
          startTimeUi.dom.value = secondsToTime(0);
          endTimeUi.dom.value = secondsToTime(audioBuffer.duration);
          startText.textContent = secondsToTime(0);
          endText.textContent = secondsToTime(audioBuffer.duration);
          progressBar.max = audioBuffer.duration;
          progressBar.style.left = "0";
          progressBar.style.width = "100%";
          // startMarker.max = audioBuffer.duration;
          // endMarker.max = audioBuffer.duration;
          // endTime = audioBuffer.duration; // 초기 끝 시간을 전체 길이로 설정

          // 파일 URL 저장
          audioState.audioUrl = URL.createObjectURL(file);
          audioState.markerStartTime = 0;
          audioState.markerEndTime = audioBuffer.duration;

          saveMusic(audioUrl, file, 0, audioBuffer.duration);
        },
        function (error) {
          console.error("Error decoding audio data", error);
        },
      );
    };
    reader.readAsArrayBuffer(file);
  }

  function saveMusic(audioUrl, file, startTime, endTime) {
    if (!editor.scene.userData.music) {
      editor.scene.userData.music = {};
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const arrayBuffer = event.target.result;
      const base64Content = arrayBufferToBase64(arrayBuffer); // ArrayBuffer를 Base64로 변환

      editor.scene.userData.music = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        content: base64Content, // Base64 문자열로 저장
        audioUrl: audioUrl,
        startTime: startTime,
        endTime: endTime,
        volume: 0.5, // 초기 볼륨 설정
      };

      console.log("Music data saved:", editor.scene.userData.music);
    };
    reader.readAsArrayBuffer(file);
  }
  /*
  function saveMusic(audioUrl, file, startTime, endTime) {
    if (!editor.scene.userData.music) {
      editor.scene.userData.music = {};
    }
    if (!editor.scene.userData.music.fileInfo) {
      editor.scene.userData.music.fileInfo = {};
    }
    editor.scene.userData.music.audioUrl = audioUrl;
    // console.log(file);
    // console.log(typeof file);

    const files = fileInput.dom.files;
    if (files.length > 0) {
      const file = files[0]; // 첫 번째 파일 선택

      const reader = new FileReader();
      reader.onload = function (event) {
        const arrayBuffer = event.target.result;
        editor.scene.userData.music.fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          content: arrayBuffer, // 파일 내용을 ArrayBuffer로 저장
        };
        console.log(
          "File info saved with content:",
          editor.scene.userData.music.fileInfo,
        );
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error("No files selected.");
    }

    // const files = fileInput.dom.files;
    // if (files.length > 0) {
    //   const file = files[0]; // 첫 번째 파일 선택

    //   // file 객체를 Blob 형태로 저장
    //   editor.scene.userData.music.fileInfo = {
    //     blob: file, // Blob으로 저장
    //     name: file.name,
    //     size: file.size,
    //     type: file.type,
    //     lastModified: file.lastModified,
    //     lastModifiedDate: file.lastModifiedDate,
    //   };
    // }

    // file 객체의 모든 속성을 fileInfo에 복사
    // editor.scene.userData.music.fileInfo = {
    //   name: file.name,
    //   size: file.size,
    //   type: file.type,
    //   lastModified: file.lastModified,
    //   lastModifiedDate: file.lastModifiedDate,
    // };
   
    // console.log(fileInput.dom.files);
    // console.log(typeof fileInput.dom.files);
    // const files = fileInput.dom.files;
    // editor.scene.userData.music.fileInfo = []; // fileInfo를 배열로 초기화

    // for (let i = 0; i < files.length; i++) {
    //   const file = files[i];

    //   // 각 파일의 정보를 객체로 만들어 배열에 추가
    //   editor.scene.userData.music.fileInfo.push({
    //     name: file.name,
    //     size: file.size,
    //     type: file.type,
    //     lastModified: file.lastModified,
    //     lastModifiedDate: file.lastModifiedDate,
    //   });
    // }

    // fileInput.dom.files.forEach((file, idx) => {
    //   if (idx > 0) {
    //     editor.scene.userData.music.fileInfo = {
    //       name: file.name,
    //       size: file.size,
    //       type: file.type,
    //       lastModified: file.lastModified,
    //       lastModifiedDate: file.lastModifiedDate,
    //     };
    //   }
    // });
    editor.scene.userData.music.startTime = startTime;
    editor.scene.userData.music.endTime = endTime;
  }
*/
  cutButton.dom.addEventListener("click", async () => {
    startTime = document.getElementById("startTime").value;
    endTime = document.getElementById("endTime").value;

    if (!fileInput.dom.files[0]) {
      alert("오디오 파일을 선택해주세요.");
      return;
    }

    if (!startTime || !endTime || startTime >= endTime) {
      alert("시작 시간과 종료 시간을 올바르게 입력해주세요.");
      return;
    }
    const file = fileInput.dom.files[0];
    const fileName = file.name;
    console.log("file");
    console.log(file);
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

    data = ffmpeg.FS("readFile", "output.mp3");

    const audioBlob = new Blob([data.buffer], { type: "audio/mp3" });
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioUrl;

    // cut한 구간만큼 progressBar 조정
    const markerStartTime = parseFloat(
      startTimeUi.dom.value
        .split(":")
        .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
    );
    const markerEndTime = parseFloat(
      endTimeUi.dom.value
        .split(":")
        .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
    );

    // progressBar만 조정하고 나머지는 원본 유지
    const startPosition = (markerStartTime / audioBuffer.duration) * 100;
    const width =
      ((markerEndTime - markerStartTime) / audioBuffer.duration) * 100;

    progressBar.style.left = `${startPosition}%`;
    progressBar.style.width = `${width}%`;

    // 원본 파일의 전체 길이 유지
    progressBarContainer.style.width = "100%";
    durationText.textContent = secondsToTime(audioBuffer.duration);

    // Visualizer 초기화
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    // 버튼 활성화
    setting();

    // 컷된 오디오 상태 저장
    audioState.audioUrl = audioUrl;
    audioState.markerStartTime = markerStartTime;
    audioState.markerEndTime = markerEndTime;

    saveMusic(audioUrl, file, markerStartTime, markerEndTime);
  });

  playButton.dom.addEventListener("click", () => {
    if (!isPlaying) {
      if (!data || !data.buffer) {
        // 마커만 이동한 경우 (컷하지 않은 상태)
        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        const markerStartTime = parseFloat(
          startTimeUi.dom.value
            .split(":")
            .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
        );
        const markerEndTime = parseFloat(
          endTimeUi.dom.value
            .split(":")
            .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
        );

        const duration = markerEndTime - markerStartTime;

        // pause 상태에서 재생 시
        if (pausedAt > 0) {
          const elapsedTime = pausedAt - markerStartTime;
          playStartTime = audioContext.currentTime - elapsedTime;
          source.start(0, pausedAt, duration - (pausedAt - markerStartTime));
        } else {
          // 처음부터 재생
          playStartTime = audioContext.currentTime;
          source.start(0, markerStartTime, duration);
        }

        source.connect(gainNode);
        isPlaying = true;
        updateMarkerStyles();
        updateProgressBar();

        // 아이콘을 stop으로 변경
        playButton.dom.innerHTML = '<i class="fas fa-stop"></i>';
        playButton.dom.title = "Stop";

        // 현재 시간 저장
        audioState.currentTime = audioContext.currentTime - playStartTime;
      } else {
        // 컷된 오디오 재생
        arrayBuffer = data.buffer.slice(0);
        isPlaying = true;
        updateMarkerStyles();

        audioContext.decodeAudioData(
          arrayBuffer,
          function (buffer) {
            cutAudioBuffer = buffer;
            source = audioContext.createBufferSource();
            source.buffer = cutAudioBuffer;

            // analyser 노드 생성 및 연결
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            source.connect(analyser);
            analyser.connect(gainNode);

            // pause 상태에서 재생 시
            if (pausedAt > 0) {
              playStartTime = audioContext.currentTime - pausedAt;
              source.start(0, pausedAt);
            } else {
              // 처음부터 재생
              playStartTime = audioContext.currentTime;
              source.start(0);
            }

            source.onended = stopPlayback;
            draw();

            durationText.textContent = secondsToTime(audioBuffer.duration);
            updateProgressBar();

            // 아이콘을 stop으로 변경
            playButton.dom.innerHTML = '<i class="fas fa-stop"></i>';
            playButton.dom.title = "Stop";

            // 현재 시간 저장
            audioState.currentTime = audioContext.currentTime - playStartTime;
          },
          function (error) {
            console.error("오디오 디코딩 오류:", error);
          },
        );
      }
    } else {
      // 정지 (Stop) 로직
      stopPlayback();
      // 아이콘을 play로 변경
      playButton.dom.innerHTML = '<i class="fas fa-play"></i>';
      playButton.dom.title = "Play";

      // 현재 시간 저장
      audioState.currentTime = audioContext.currentTime - playStartTime;
    }
  });

  // stopButton.dom.addEventListener("click", () => {
  //   if (isPlaying) {
  //     stopPlayback();
  //     // Stop 시 버튼을 play 상태로 복귀
  //     playButton.dom.innerHTML = '<i class="fas fa-play"></i>';
  //     playButton.dom.title = "Play";
  //   }
  // });

  // pauseButton.dom.addEventListener("click", () => {
  //   console.log("pauseButton clicked");
  //   if (audioPlayer) {
  //     audioPlayer.pause(); // 오디오 일시정지
  //   }
  //   if (source) {
  //     source.stop();
  //     cancelAnimationFrame(animationId); // 애니메이션 중지
  //   }
  // });

  // 프로그레스바 컨테이너 생성
  const progressBarContainer = document.createElement("div");
  progressBarContainer.classList.add("progressBarContainer");
  progressBarContainer.style.position = "relative";
  progressBarContainer.style.width = "100%";
  progressBarContainer.style.height = "5px";
  progressBarContainer.style.borderRadius = "10px";
  progressBarContainer.style.backgroundColor = "#616161";
  progressBarContainer.style.margin = "0px 20px";
  musicControls.dom.appendChild(progressBarContainer);

  // 눈금 컨테이너 생성
  const ticksContainer = document.createElement("div");
  ticksContainer.style.position = "absolute";
  ticksContainer.style.width = "100%";
  ticksContainer.style.height = "10px";
  ticksContainer.style.top = "8px"; // progressBar 아래에 위치
  ticksContainer.style.left = "0";
  progressBarContainer.appendChild(ticksContainer);

  // 눈금 생성 함수
  function createTicks() {
    // 10개의 주 눈금과 각 주 눈금 사이에 4개의 보조 눈금
    const totalTicks = 100; // (10 - 1) * 5 + 1

    for (let i = 0; i < totalTicks; i++) {
      const tick = document.createElement("div");
      tick.style.position = "absolute";
      tick.style.width = i % 5 === 0 ? "1px" : "1px"; // 주 눈금은 더 굵게
      tick.style.height = i % 5 === 0 ? "5px" : "3px"; // 주 눈금은 더 길게
      tick.style.backgroundColor = i % 5 === 0 ? "#888" : "#666";
      tick.style.left = `${(i / (totalTicks - 1)) * 100}%`;
      tick.style.transform = "translateX(-50%)"; // 중앙 정렬
      ticksContainer.appendChild(tick);
    }
  }

  // 눈금 생성 함수 호출
  createTicks();

  // 프로그레스바 생성
  const progressBar = document.createElement("div");
  progressBar.classList.add("progressBar");
  progressBar.style.position = "absolute";
  progressBar.style.top = "0";
  progressBar.style.left = "0";
  progressBar.style.height = "100%";
  // progressBar.style.backgroundColor = "#ab4444";
  progressBar.style.background = "linear-gradient(90deg, #e1b166, #ab4444)";
  progressBar.style.zIndex = "1";
  progressBarContainer.appendChild(progressBar);

  // 시작 마커 생성
  const startMarker = document.createElement("div");
  startMarker.classList.add("startMarker");
  startMarker.style.position = "absolute";
  startMarker.style.top = "-6px";
  startMarker.style.width = "15px";
  startMarker.style.height = "15px";
  startMarker.style.borderRadius = "15px";
  startMarker.style.backgroundColor = "#e1b166";
  startMarker.style.cursor = "pointer";
  startMarker.style.zIndex = "2";
  progressBarContainer.appendChild(startMarker);

  // 끝 마커 생성
  const endMarker = document.createElement("div");
  endMarker.classList.add("endMarker");
  endMarker.style.position = "absolute";
  endMarker.style.top = "-6px";
  endMarker.style.width = "15px";
  endMarker.style.height = "15px";
  endMarker.style.borderRadius = "15px";
  endMarker.style.backgroundColor = "#ab4444";
  endMarker.style.cursor = "pointer";
  endMarker.style.zIndex = "2";
  progressBarContainer.appendChild(endMarker);

  const currentTimeText = document.createElement("span");
  currentTimeText.classList.add("currentTimeText");
  currentTimeText.textContent = "00:00";
  currentTimeText.style.position = "absolute";
  currentTimeText.style.left = "50%";
  currentTimeText.style.top = "25px";
  currentTimeText.style.transform = "translateX(-50%)";
  progressBarContainer.appendChild(currentTimeText);

  const durationText = document.createElement("span");
  durationText.classList.add("durationText");
  durationText.textContent = "00:00";
  durationText.style.position = "absolute";
  durationText.style.right = "0";
  durationText.style.top = "25px";
  progressBarContainer.appendChild(durationText);

  const startText = document.createElement("span");
  startText.classList.add("startText");
  startText.textContent = "00:00";
  startText.style.position = "absolute";
  startText.style.left = "0";
  startText.style.top = "-20px";
  startText.style.fontSize = ".8em";
  startText.style.transform = "translateX(-50%)";
  startMarker.appendChild(startText);

  const endText = document.createElement("span");
  endText.classList.add("endText");
  endText.textContent = "00:00";
  endText.style.position = "absolute";
  endText.style.right = "0";
  endText.style.top = "-20px";
  endText.style.fontSize = ".8em";
  endText.style.transform = "translateX(50%)";
  endMarker.appendChild(endText);

  // 마커 드래그 기능
  function makeDraggable(marker, isStart) {
    let isDragging = false;

    marker.addEventListener("mousedown", (e) => {
      if (isPlaying) {
        return; // 재생 중에는 드래그 불가
      }
      isDragging = true;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging || isPlaying) return; // 재생 중이거나 드래그 중이 아니면 리턴

      const rect = progressBarContainer.getBoundingClientRect();
      let newPosition =
        ((e.clientX - rect.left) / rect.width) * audioBuffer.duration;
      newPosition = Math.max(0, Math.min(newPosition, audioBuffer.duration));

      if (isStart) {
        const endTime = parseFloat(
          endTimeUi.dom.value
            .split(":")
            .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
        );
        if (newPosition < endTime) {
          startTime = newPosition;
          marker.style.left = `${(newPosition / audioBuffer.duration) * 100}%`;
          startTimeUi.dom.value = secondsToTime(startTime);
          startText.textContent = secondsToTime(startTime);
          progressBar.style.left = `${
            (startTime / audioBuffer.duration) * 100
          }%`;
          progressBar.style.width = `${
            ((endTime - startTime) / audioBuffer.duration) * 100
          }%`;
          // 마커가 이동되면 버튼 비활성화
          disabledSetting();
        }
      } else {
        const startTime = parseFloat(
          startTimeUi.dom.value
            .split(":")
            .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
        );
        if (newPosition > startTime) {
          endTime = newPosition;
          marker.style.left = `${(newPosition / audioBuffer.duration) * 100}%`;
          endTimeUi.dom.value = secondsToTime(endTime);
          endText.textContent = secondsToTime(endTime);
          progressBar.style.width = `${
            ((endTime - startTime) / audioBuffer.duration) * 100
          }%`;
          // 마커가 이동되면 버튼 비활성화
          disabledSetting();
        }
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  // 마커 스타일 업데이트 함수 추가
  function updateMarkerStyles() {
    if (isPlaying) {
      startMarker.style.cursor = "not-allowed";
      endMarker.style.cursor = "not-allowed";
      // startMarker.style.opacity = "0.5";
      // endMarker.style.opacity = "0.5";
    } else {
      startMarker.style.cursor = "pointer";
      endMarker.style.cursor = "pointer";
      startMarker.style.opacity = "1";
      endMarker.style.opacity = "1";
    }
  }

  makeDraggable(startMarker, true);
  makeDraggable(endMarker, false);

  // 오디오 재생 및 프로그레스바 업데이트
  // function playAudio() {
  //   if (!isPlaying && audioBuffer) {
  //     source = audioContext.createBufferSource();
  //     source.buffer = audioBuffer;
  //     source.connect(gainNode);
  //     source.start(0, (startTime / 100) * audioBuffer.duration);
  //     isPlaying = true;
  //     updateProgressBar();
  //   }
  // }

  function updateProgressBar() {
    if (isPlaying) {
      const markerStartTime = parseFloat(
        startTimeUi.dom.value
          .split(":")
          .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
      );
      const markerEndTime = parseFloat(
        endTimeUi.dom.value
          .split(":")
          .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
      );

      const currentTime =
        audioContext.currentTime - playStartTime + markerStartTime;
      const duration = markerEndTime - markerStartTime;

      if (currentTime <= markerEndTime) {
        currentTimeText.textContent = secondsToTime(currentTime);
        // progressBar의 시작 위치와 너비를 계산
        const startPosition = (markerStartTime / audioBuffer.duration) * 100;
        const maxWidth =
          ((markerEndTime - markerStartTime) / audioBuffer.duration) * 100;
        const currentPosition =
          ((currentTime - markerStartTime) / duration) * maxWidth;

        progressBar.style.left = `${startPosition}%`;
        progressBar.style.width = `${currentPosition}%`;

        requestAnimationFrame(updateProgressBar);
      } else {
        stopPlayback();
      }
    }
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  function setting() {
    playButton.dom.classList.remove("disabled");
    // stopButton.dom.classList.remove("disabled");
  }

  function disabledSetting() {
    playButton.dom.classList.add("disabled");
    // stopButton.dom.classList.add("disabled");
    // fileInput.dom.disabled = true;
  }

  // 원형 볼륨 컨트롤
  const volumeCanvas = document.createElement("canvas");
  volumeCanvas.width = 100;
  volumeCanvas.height = 100;
  musicControls.dom.appendChild(volumeCanvas);

  const volumeCtx = volumeCanvas.getContext("2d");
  let volume = 0.5; // 초기 볼륨
  audioPlayer.volume = volume; // 초기 볼륨 설정

  // MIN, MAX 텍스트 추가
  const minText = document.createElement("span");
  minText.textContent = "MIN";
  minText.style.position = "absolute";
  minText.style.left = "0";
  minText.style.bottom = "-20px";
  minText.style.fontSize = "12px";
  volumeCanvas.parentElement.appendChild(minText);

  const maxText = document.createElement("span");
  maxText.textContent = "MAX";
  maxText.style.position = "absolute";
  maxText.style.right = "0";
  maxText.style.bottom = "-20px";
  maxText.style.fontSize = "12px";
  volumeCanvas.parentElement.appendChild(maxText);

  function drawVolumeControl() {
    volumeCtx.clearRect(0, 0, volumeCanvas.width, volumeCanvas.height);

    // 외부 원 그라데이션
    const outerGradient = volumeCtx.createRadialGradient(
      45,
      45,
      35,
      50,
      50,
      40,
    );
    outerGradient.addColorStop(0, "#ffffff");
    outerGradient.addColorStop(1, "#333333");

    // 외부 원 그리기 (3D 효과)
    volumeCtx.beginPath();
    volumeCtx.arc(50, 50, 40, 0, 2 * Math.PI);
    volumeCtx.fillStyle = outerGradient;
    volumeCtx.fill();
    volumeCtx.strokeStyle = "#222";
    volumeCtx.lineWidth = 1;
    volumeCtx.stroke();

    // 눈금 그리기 (더 선명하게)
    for (let i = 0; i < 30; i++) {
      const angle = (i * Math.PI * 2) / 30;
      const startRadius = 35;
      const endRadius = i % 3 === 0 ? 28 : 32; // 눈금 길이 차이 더 크게

      const startX = 50 + Math.cos(angle) * startRadius;
      const startY = 50 + Math.sin(angle) * startRadius;
      const endX = 50 + Math.cos(angle) * endRadius;
      const endY = 50 + Math.sin(angle) * endRadius;

      volumeCtx.beginPath();
      volumeCtx.moveTo(startX, startY);
      volumeCtx.lineTo(endX, endY);
      volumeCtx.strokeStyle = "#222";
      volumeCtx.lineWidth = i % 3 === 0 ? 2 : 1; // 주요 눈금 더 굵게
      volumeCtx.stroke();
    }

    // 내부 원 그라데이션 (더 입체감 있게)
    const innerGradient = volumeCtx.createRadialGradient(
      45,
      45,
      15,
      50,
      50,
      28,
    );
    innerGradient.addColorStop(0, "#444444");
    innerGradient.addColorStop(1, "#000000");

    // 내부 검은색 원
    volumeCtx.beginPath();
    volumeCtx.arc(50, 50, 28, 0, 2 * Math.PI);
    volumeCtx.fillStyle = innerGradient;
    volumeCtx.fill();

    // 볼륨 표시 선 (더 선명하게)
    volumeCtx.beginPath();
    volumeCtx.arc(50, 50, 28, -Math.PI / 2, 2 * Math.PI * volume - Math.PI / 2);
    volumeCtx.strokeStyle = "#fff";
    volumeCtx.lineWidth = 3;
    volumeCtx.lineCap = "round"; // 선 끝을 둥글게
    volumeCtx.stroke();

    // 하이라이트 효과 (위쪽에 밝은 부분)
    volumeCtx.beginPath();
    volumeCtx.arc(50, 50, 38, -Math.PI / 2, Math.PI / 2);
    const highlightGradient = volumeCtx.createLinearGradient(50, 12, 50, 88);
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    volumeCtx.strokeStyle = highlightGradient;
    volumeCtx.lineWidth = 2;
    volumeCtx.stroke();
  }

  volumeCanvas.addEventListener("mousedown", (event) => {
    const rect = volumeCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left - 50;
    const y = event.clientY - rect.top - 50;
    const angle = Math.atan2(y, x) + Math.PI / 2;
    volume = (angle < 0 ? angle + 2 * Math.PI : angle) / (2 * Math.PI);
    gainNode.gain.value = volume;
    audioState.volume = volume; // 볼륨 상태 저장
    drawVolumeControl();
  });

  drawVolumeControl();

  // 시각화
  const visualizer = document.createElement("canvas");
  visualizer.setAttribute("id", "visualizer");
  visualizer.width = 800;
  visualizer.height = 200;
  musicControls.dom.appendChild(visualizer);

  function startVisualizer() {
    if (audioBuffer) {
      if (source) {
        source.stop();
      }

      source = audioContext.createBufferSource();
      source.buffer = cutAudioBuffer;

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);

      playStartTime = audioContext.currentTime;
      source.onended = stopPlayback;

      // cut된 오디오는 처음부터 끝까지 재생
      source.start(0);
      draw();
    }
  }

  function draw() {
    const canvasCtx = visualizer.getContext("2d");
    animationId = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = "rgb(0, 0, 0)";
    canvasCtx.fillRect(0, 0, visualizer.width, visualizer.height);

    const barWidth = (visualizer.width / dataArray.length) * 0.5;
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

  function secondsToTime(seconds) {
    // 음수 처리
    if (seconds < 0) {
      return "00:00:00";
    }

    // 시, 분, 초 계산
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // 2자리 숫자로 포맷팅
    const formatNumber = (num) => num.toString().padStart(2, "0");

    // 결과 반환
    return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(
      remainingSeconds,
    )}`;
  }

  function stopPlayback() {
    if (source) {
      source.stop();
    }
    isPlaying = false;
    pausedAt = 0; // 정지 시 일시정지 시간 초기화
    updateMarkerStyles();
    audioStartOffset = 0;
    currentTimeText.textContent = startTimeUi.dom.value;

    // 버튼을 play 상태로 복귀
    playButton.dom.innerHTML = '<i class="fas fa-play"></i>';
    playButton.dom.title = "Play";

    // cut한 구간 유지
    const markerStartTime = parseFloat(
      startTimeUi.dom.value
        .split(":")
        .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
    );
    const markerEndTime = parseFloat(
      endTimeUi.dom.value
        .split(":")
        .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
    );

    const startPosition = (markerStartTime / audioBuffer.duration) * 100;
    const width =
      ((markerEndTime - markerStartTime) / audioBuffer.duration) * 100;

    progressBar.style.left = `${startPosition}%`;
    progressBar.style.width = `${width}%`;

    cancelAnimationFrame(animationId);

    // 현재 시간 저장
    audioState.currentTime = audioContext.currentTime - playStartTime;
  }

  // editor에서 상태를 저장/복원하는 메서드를 container에 추가
  container.toJSON = function () {
    return {
      audioState: {
        isPlaying: isPlaying,
        currentTime: audioContext
          ? audioContext.currentTime - playStartTime
          : 0,
        audioUrl: audioPlayer.src,
        markerStartTime: parseFloat(
          startTimeUi.dom.value
            .split(":")
            .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
        ),
        markerEndTime: parseFloat(
          endTimeUi.dom.value
            .split(":")
            .reduce((acc, time) => 60 * acc + parseFloat(time), 0),
        ),
        volume: gainNode ? gainNode.gain.value : 0.5,
      },
    };
  };

  container.fromJSON = function (json) {
    if (json.audioState) {
      audioState = json.audioState;
      if (gainNode) {
        gainNode.gain.value = audioState.volume;
      }
      // 나머지 상태 복원 로직...
    }
  };
  function loadMusicFromSavedData() {
    const musicData = editor.scene.userData.music;
    if (musicData && musicData.content) {
      const arrayBuffer = base64ToArrayBuffer(musicData.content);
      const blob = new Blob([arrayBuffer], { type: musicData.type });
      const file = new File([blob], musicData.name, {
        type: musicData.type,
        lastModified: musicData.lastModified,
      });

      // 기존 loadMusic 로직을 사용하여 파일 로드
      loadMusic(file);
    } else {
      console.error("No saved music data available.");
    }
  }

  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function initMusic() {
    console.log("DOMContentLoaded!@!!!!!!!");
    const musicJson = editor.scene.userData.music;
    console.log(musicJson);

    if (musicJson) {
      console.log("musicJson");
      audioUrl = musicJson.audioUrl;

      const fileInfo = editor.scene.userData.music.fileInfo;
      if (fileInfo && fileInfo.content) {
        const blob = new Blob([fileInfo.content], { type: fileInfo.type });
        const file = new File([blob], fileInfo.name, {
          type: fileInfo.type,
          lastModified: fileInfo.lastModified,
        });

        loadMusicFromSavedData(file);

        // 이제 file 객체를 사용하여 필요한 작업 수행
        console.log("File loaded from saved data:", file);
      } else {
        console.error("No file content available to load.");
      }

      // UI 요소 업데이트
      startTimeUi.dom.value = secondsToTime(musicJson.startTime);
      endTimeUi.dom.value = secondsToTime(musicJson.endTime);
    }
  }

  loadMusicFromSavedData();
  return container;
}

export { Music };
