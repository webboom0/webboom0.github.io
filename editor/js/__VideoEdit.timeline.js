import * as THREE from "three";
import { UIPanel, UIRow, UIButton, UIText } from "./libs/ui.js";

// Three.js 기본 설정
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// FBX 로더 설정
const characters = [];
const keyframes = {}; // 키프레임 데이터 저장

function VideoEditTimeline(editor) {
  const container = new UIPanel();
  container.setId("videoEditTimeline");

  // 타임라인 바 생성
  const timelineBar = new UIPanel();
  timelineBar.setClass("timelineBar");
  // timelineBar.setStyle("position", "relative");
  // timelineBar.setStyle("height", "50px");
  // timelineBar.setStyle("background", "#333");
  // timelineBar.setStyle("border", "1px solid #ccc");
  container.add(timelineBar);

  // const timelineBar = document.createElement("div");
  // timelineBar.setAttribute("id", "timelineBar");
  // timelineBar.style.position = "absolute";
  // timelineBar.style.top = "10px";
  // timelineBar.style.left = "10px";
  // timelineBar.style.color = "white";
  // timelineBar.style.fontFamily = "system-ui";
  // timelineBar.style.fontSize = "12px";
  // timelineBar.style.textShadow = "0 0 2px black";
  // output.document.body.appendChild(timelineBar);
  // container.add(timelineBar);

  // 현재 프레임 텍스트
  const currentFrameText = new UIText("Current Frame: 0");
  // currentFrameText.setStyle("color", "white");
  // currentFrameText.setStyle("position", "absolute");
  // currentFrameText.setStyle("top", "10px");
  // currentFrameText.setStyle("left", "10px");
  timelineBar.add(currentFrameText);

  // Play 버튼
  const playButton = new UIButton("play");
  container.add(playButton);
  playButton.onClick(function () {
    playTimeline(0);
    // action.isRunning() ? action.stop() : action.play();
    // playButton.setTextContent(getButtonText(play));
  });

  timelineBar.onClick(async () => {
    const rect = timelineBar.dom.getBoundingClientRect();
    console.log(`rect ${rect}`);
    const clickX = event.clientX - rect.left;
    console.log(`clickX ${clickX}`);
    const totalWidth = rect.width;
    const frameIndex = Math.floor((clickX / totalWidth) * totalFrames);

    currentKeyframeIndex = frameIndex; // 현재 키프레임 인덱스 업데이트
    console.log(`currentKeyframeIndex ${currentKeyframeIndex}`);
    currentFrameText.setValue(`Current Frame: ${frameIndex}`); // 현재 프레임 텍스트 업데이트
    addKeyframe(frameIndex, clickX);
  });

  // 타임라인 편집기 구현 (간단한 예시)
  function addKeyframe(character, frameIndex, position) {
    keyframes[character.uuid].push({ frameIndex, position });
    console.log(keyframes);
  }
  console.log("characters");
  console.log(editor.scene.children[0]);
  // 키프레임 추가 예시
  // addKeyframe(characters[0], 0, new THREE.Vector3(0, 0, 0));
  // addKeyframe(characters[0], 50, new THREE.Vector3(10, 0, 0));
  // 애니메이션 재생
  let currentFrame = 0;
  const totalFrames = 100;

  function animate() {
    requestAnimationFrame(animate);

    // 각 캐릭터의 위치 업데이트
    characters.forEach((character) => {
      const frames = keyframes[character.uuid];
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

    renderer.render(scene, camera);

    currentFrame = (currentFrame + 1) % totalFrames; // 루프 재생
  }

  return container;
}
/*
export { VideoEditTimeline };
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

// Three.js 기본 설정
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// FBX 로더 설정
const loader = new FBXLoader();
const characters = [];
const keyframes = {}; // 키프레임 데이터 저장

// FBX 캐릭터 로드
function loadFBX(url, onLoad) {
  loader.load(url, (object) => {
    scene.add(object);
    characters.push(object);
    onLoad(object);
  });
}

// 예시로 두 개의 캐릭터 로드
loadFBX("character1.fbx", (character) => {
  character.position.set(0, 0, 0);
  keyframes[character.uuid] = [];
});

loadFBX("character2.fbx", (character) => {
  character.position.set(5, 0, 0);
  keyframes[character.uuid] = [];
});

// 타임라인 편집기 구현 (간단한 예시)
function addKeyframe(character, frameIndex, position) {
  keyframes[character.uuid].push({ frameIndex, position });
}

// 키프레임 추가 예시
addKeyframe(characters[0], 0, new THREE.Vector3(0, 0, 0));
addKeyframe(characters[0], 50, new THREE.Vector3(10, 0, 0));
addKeyframe(characters[1], 0, new THREE.Vector3(5, 0, 0));
addKeyframe(characters[1], 50, new THREE.Vector3(-5, 0, 0));

// 애니메이션 재생
let currentFrame = 0;
const totalFrames = 100;

function animate() {
  requestAnimationFrame(animate);

  // 각 캐릭터의 위치 업데이트
  characters.forEach((character) => {
    const frames = keyframes[character.uuid];
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
      character.position.lerpVectors(prevFrame.position, nextFrame.position, t);
    } else if (prevFrame) {
      character.position.copy(prevFrame.position);
    }
  });

  renderer.render(scene, camera);

  currentFrame = (currentFrame + 1) % totalFrames; // 루프 재생
}

camera.position.z = 10;
animate();
*/
