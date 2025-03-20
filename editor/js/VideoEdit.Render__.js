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
  let isPlaying = true; // 재생 여부

  const renderer = new THREE.WebGLRenderer(); // 렌더러
  renderer.setClearColor(0xf0f0f0, 1);

  const container = new UIPanel();
  container.setId("renderViewContainer");
  let renderView = null;
  if (_newWindow) {
    renderView = window.open("", "", "width=1200,height=800");
    renderer.setSize(1200, 800);
    renderView.document.body.style.margin = "0";
    renderView.document.body.appendChild(renderer.domElement);
    // 새 창 열기
    // renderView = window.open("", "", "width=1200,height=800");
  } else {
    // dom 추가
    renderView = new UIRow();
    renderView.setId("renderView");
    container.add(renderView);
    renderer.setSize(1200, 800);
    // renderView.add(renderer.domElement);
    renderView.dom.appendChild(renderer.domElement);
  }

  if (renderView) {
    // let playButton, pauseButton;

    const timeText = document.createElement("div");
    timeText.classList.add("timeText");
    timeText.innerText = "00:00:00";
    if (_newWindow) {
      const controlsDiv = renderView.document.createElement("div");
      controlsDiv.style.position = "absolute";
      controlsDiv.style.bottom = "0";
      controlsDiv.style.width = "100%";
      controlsDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      controlsDiv.style.color = "white";
      controlsDiv.style.textAlign = "center";
      controlsDiv.style.padding = "10px";

      const playButton = renderView.document.createElement("button");
      playButton.innerText = "Play";
      controlsDiv.appendChild(playButton);

      const pauseButton = renderView.document.createElement("button");
      pauseButton.innerText = "Pause";
      controlsDiv.appendChild(pauseButton);
      controlsDiv.appendChild(timeText);
      renderView.document.body.appendChild(controlsDiv);
      // 재생
      playButton.addEventListener("click", renderPlay);
      // 일시정지
      pauseButton.addEventListener("click", renderPause);

      // 창 닫기
      renderView.addEventListener("unload", () => {
        isPlaying = false;
        renderer.dispose();
      });
    } else {
      const controlsDiv = new UIRow();
      controlsDiv.setId("controlsDiv");
      controlsDiv.setStyle("position", ["absolute"]);
      controlsDiv.setStyle("bottom", ["0"]);
      controlsDiv.setStyle("width", ["100%"]);
      controlsDiv.setStyle("backgroundColor", ["rgba(0, 0, 0, 0.5)"]);
      controlsDiv.setStyle("color", ["white"]);
      controlsDiv.setStyle("textAlign", ["center"]);
      controlsDiv.setStyle("padding", ["10px"]);
      renderView.add(controlsDiv);
      const playButton = new UIButton("play");
      playButton.setClass("playButton");
      controlsDiv.add(playButton);

      const pauseButton = new UIButton("pause");
      pauseButton.setClass("PauseButton");
      controlsDiv.add(pauseButton);

      // const timeText = new UIRow();
      // timeText.setClass("timeText");
      // controlsDiv.add(timeText);
      controlsDiv.dom.appendChild(timeText);
      // 재생
      playButton.dom.addEventListener("click", renderPlay);
      // 일시정지
      pauseButton.dom.addEventListener("click", renderPause);
    }

    function renderPlay() {
      isPlaying = true;
      animate();
    }

    function renderPause() {
      isPlaying = false;
      renderer.dispose();
    }

    // 카메라 컨트롤
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 0, 100);
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
    const timeTextElement = document.querySelector(".timeText");
    function animate() {
      if (!isPlaying || currentFrame == _totalSeconds * _framesPerSecond)
        return;
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
  return container;
}

export { Render };
