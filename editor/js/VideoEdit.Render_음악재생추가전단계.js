import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { UIPanel, UIRow, UIButton, UIText, UISpan } from "./libs/ui.js";

function Render(editor, _totalSeconds, _framesPerSecond, _newWindow = true) {
  // 타임라인 플레이 시 애니메이션 적용
  console.log("Render");
  const keyframes = editor.scene.userData.keyframes;
  if (!keyframes) {
    console.log("No keyframes found. Exiting function.");
    return;
  }

  // 오디오 상태 가져오기
  const musicEditor = editor.music;
  let audioContext;
  let source;
  let gainNode;

  if (musicEditor && musicEditor.toJSON) {
    const audioState = musicEditor.toJSON().audioState;
    if (audioState && audioState.audioUrl) {
      // 오디오 컨텍스트 초기화
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioContext.createGain();
      gainNode.gain.value = audioState.volume;
      gainNode.connect(audioContext.destination);

      // 오디오 파일 로드 및 재생 준비
      fetch(audioState.audioUrl)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          audioContext.decodeAudioData(arrayBuffer, function (buffer) {
            source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode);

            // 마커 위치에 맞춰 재생 시작
            const startTime = audioState.markerStartTime || 0;
            source.start(0, startTime);
          });
        });
    }
  }

  const editorScene = editor.scene; // 에디터 씬
  const camera = new THREE.PerspectiveCamera(75, 400 / 300, 0.1, 1000); // 카메라
  const mixers = []; // 애니메이션 믹서
  editorScene.children.forEach((character) => {
    const mixer = new THREE.AnimationMixer(character); // 애니메이션 믹서 생성
    mixers.push(mixer); // 믹서 배열에 추가
    character.animations.forEach((clip) => {
      mixer.clipAction(clip).play(); // 애니메이션 재생
    });
  });

  const clock = new THREE.Clock(); // 클럭
  let currentFrame = 0; // 현재 프레임
  let isPlaying = false; // 재생 여부

  const renderer = new THREE.WebGLRenderer(); // 렌더러
  renderer.setClearColor(0xf0f0f0, 1);

  const renderContainer = new UIPanel();
  renderContainer.setId("renderViewContainer");

  // dom 추가
  const renderView = new UIRow();
  renderView.setId("renderView");
  renderView.setStyle("background-color", ["#000"]);
  renderContainer.add(renderView);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderView.add(renderer.domElement);
  renderView.dom.appendChild(renderer.domElement);

  if (renderView) {
    // let playButton, pauseButton;

    const timeText = document.createElement("div");
    timeText.classList.add("timeText");
    timeText.innerText = "00:00:00";

    const controlsDiv = new UIRow();
    controlsDiv.setClass("controlsDiv");
    renderView.add(controlsDiv);
    const playButton = new UIButton("play");
    playButton.setClass("playButton");
    controlsDiv.add(playButton);

    const pauseButton = new UIButton("pause");
    pauseButton.setClass("PauseButton");
    controlsDiv.add(pauseButton);

    const stopButton = new UIButton("stop");
    stopButton.setClass("stopButton");
    controlsDiv.add(stopButton);

    // const timeText = new UIRow();
    // timeText.setClass("timeText");
    // controlsDiv.add(timeText);
    controlsDiv.dom.appendChild(timeText);
    // 재생
    playButton.dom.addEventListener("click", renderPlay);
    // 일시정지
    pauseButton.dom.addEventListener("click", renderPause);
    // 정지
    stopButton.dom.addEventListener("click", renderStop);

    // renderView 외부 클릭 및 드래그 감지
    document.body.addEventListener("mousedown", (event) => {
      console.log("%%%%%%%%%%%%%%%%%%%%%%");
      console.log(event.target.closest("#renderViewContainer"));
      if (
        !event.target.closest("#renderViewContainer") &&
        document.getElementById("renderViewContainer") != null
      ) {
        // renderStop();
        isPlaying = false;
        // renderContainer.remove();
        document.getElementById("renderViewContainer").remove();

        // currentFrame = 0;
        // renderer.dispose();
        // timeText.innerText = "00:00:00";
      }
    });

    // document.addEventListener("mousemove", (event) => {
    //   if (!renderView.dom.contains(event.target)) {
    //     renderer.clear();
    //     console.log("clear");
    //   }
    // });

    function renderPlay() {
      isPlaying = true;
      animate();
    }

    function renderPause() {
      isPlaying = false;
      renderer.dispose();
    }

    function renderStop() {
      isPlaying = false;
      currentFrame = 0;
      // renderer.dispose();

      // 카메라 초기 위치로 설정
      camera.position.set(0, 10, 100);
      camera.lookAt(editorScene.position);
      controls.update();

      // 캐릭터 초기 위치로 설정
      editorScene.children.forEach((character) => {
        const initialPosition =
          editorScene.userData.keyframes[character.uuid]?.[0]?.position;
        if (initialPosition) {
          character.position.copy(initialPosition);
        }
      });

      timeText.innerText = "00:00:00";
    }

    // 카메라 컨트롤
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 10, 100);
    camera.lookAt(editorScene.position);
    controls.update();

    const existingLights = editorScene.children.filter(
      (child) => child.isLight,
    );
    // 존재하는 라이트 찾기
    if (existingLights.length > 0) {
      console.log("Using existing lights:", existingLights);
    } else {
      console.log("No existing lights found in the scene.");
    }
    function animate() {
      if (!isPlaying || currentFrame == _totalSeconds * _framesPerSecond) {
        renderer.dispose();
        return;
      }

      requestAnimationFrame(animate);

      if (isPlaying) {
        const delta = clock.getDelta();
        mixers.forEach((mixer) => mixer.update(delta));

        editorScene.children.forEach((character) => {
          const frames = editorScene.userData.keyframes[character.uuid] || [];
          let prevFrame = null;
          let nextFrame = null;

          for (let i = 0; i < frames.length; i++) {
            if (frames[i].frameIndex <= currentFrame) {
              prevFrame = frames[i];
            }
            if (frames[i].frameIndex > currentFrame && nextFrame === null) {
              nextFrame = frames[i];
              break;
            }
          }

          if (prevFrame && nextFrame) {
            const t =
              (currentFrame - prevFrame.frameIndex) /
              (nextFrame.frameIndex - prevFrame.frameIndex);
            character.position.lerpVectors(
              prevFrame.position,
              nextFrame.position,
              t,
            );
          } else if (prevFrame) {
            character.position.copy(prevFrame.position);
          }
        });
        const seconds = Math.floor(currentFrame / _framesPerSecond);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const displaySeconds = seconds % 60;
        const displayMinutes = minutes % 60;
        const displayHours = hours;
        timeText.innerHTML = `${displayHours
          .toString()
          .padStart(2, "0")}:${displayMinutes
          .toString()
          .padStart(2, "0")}:${displaySeconds.toString().padStart(2, "0")}`;
        // console.log(document.querySelector(".timeText"));
        // timeText.innerHTML = `${currentFrame}`;
        // timeTextElement.innerHTML = `${currentFrame}`;
        // timeText.dom.innerText = `${currentFrame}`;

        currentFrame = currentFrame + 1;
      }

      renderer.render(editorScene, camera);
    }

    animate();
  }
  //   }
  // return renderContainer;
  // document.getElementById("viewer").appendChild(renderContainer.dom);
  document.body.appendChild(renderContainer.dom);

  // return {
  //   renderStop: renderStop,
  //   // 필요에 따라 다른 메서드도 추가 가능
  // };
}

export { Render };
