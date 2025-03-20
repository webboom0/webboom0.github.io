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
  // 이미 존재하는 renderViewContainer 제거
  const existingContainer = document.getElementById("renderViewContainer");
  if (existingContainer) {
    existingContainer.remove();
  }

  if (!editor) {
    console.log("Editor not found");
    return;
  }

  let editorScene = editor.scene; // 에디터 씬
  let camera = new THREE.PerspectiveCamera(75, 400 / 300, 0.1, 1000); // 카메라
  let mixers = []; // 애니메이션 믹서
  editorScene.children.forEach((character) => {
    const mixer = new THREE.AnimationMixer(character); // 애니메이션 믹서 생성
    mixers.push(mixer); // 믹서 배열에 추가
    character.animations.forEach((clip) => {
      mixer.clipAction(clip).play(); // 애니메이션 재생
    });
  });

  let clock = new THREE.Clock(); // 클럭
  let currentFrame = 0; // 현재 프레임
  let isPlaying = true; // 재생 여부

  let renderer = new THREE.WebGLRenderer(); // 렌더러
  renderer.setClearColor(0xf0f0f0, 1);
  // let editorScene;
  // let camera;
  let scene;
  // let clock;
  // let renderer;
  // let currentFrame = 0;
  // let isPlaying = true;

  const renderContainer = new UIPanel();
  renderContainer.setId("renderViewContainer");

  // dom 추가
  const renderView = new UIRow();
  renderView.setId("renderView");
  renderView.setStyle("background-color", ["#000"]);
  renderContainer.add(renderView);
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xf0f0f0, 1);
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
        renderClose();
        document.getElementById("renderViewContainer").remove();
      }
    });

    // document.addEventListener("mousemove", (event) => {
    //   if (!renderView.dom.contains(event.target)) {
    //     renderer.clear();
    //     console.log("clear");
    //   }
    // });

    function animate() {
      if (!isPlaying) {
        return;
      }

      // 애니메이션이 끝나면 정지
      if (currentFrame >= _totalSeconds * _framesPerSecond) {
        isPlaying = false;
        return;
      }

      requestAnimationFrame(animate);

      if (isPlaying) {
        // 현재 시간 계산
        const now = performance.now();
        if (!animate.lastTime) {
          animate.lastTime = now;
        }

        // 경과 시간 계산 (밀리초)
        const elapsed = now - animate.lastTime;

        // 1프레임당 시간 (밀리초) = 1000ms / fps
        const frameTime = 1000 / _framesPerSecond;

        // 충분한 시간이 경과했을 때만 프레임 업데이트
        if (elapsed >= frameTime) {
          animate.lastTime = now - (elapsed % frameTime); // 남은 시간 고려

          // 프레임 업데이트
          currentFrame++;

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

          // 시간 표시 업데이트
          const totalSeconds = currentFrame / _framesPerSecond;
          const minutes = Math.floor(totalSeconds / 60);
          const hours = Math.floor(minutes / 60);
          const displaySeconds = Math.floor(totalSeconds % 60);
          const displayFrames = Math.floor(currentFrame % _framesPerSecond);
          const displayMinutes = minutes % 60;
          const displayHours = hours;

          timeText.innerHTML = `${displayHours
            .toString()
            .padStart(2, "0")}:${displayMinutes
            .toString()
            .padStart(2, "0")}:${displaySeconds
            .toString()
            .padStart(2, "0")}:${displayFrames.toString().padStart(2, "0")}`;
        }
      }

      if (renderer) {
        renderer.render(editorScene, camera);
      }
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
              const endTime = audioState.markerEndTime;
              const duration = endTime - startTime;

              // 렌더링 시작과 함께 자동 재생
              source.start(0, startTime, duration);
              source.startTime = audioContext.currentTime;

              // 재생이 끝나면 오디오만 정지
              source.onended = () => {
                if (source) {
                  source.stop();
                }
              };
            });
          });
      }
    }

    function renderPlay() {
      // 처음 시작할 때만 초기화
      if (!renderer) {
        // 새로운 렌더러 초기화
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderView.dom.appendChild(renderer.domElement);

        // 카메라 초기화
        camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000,
        );

        // 씬 초기화
        scene = new THREE.Scene();

        // 클럭 초기화
        clock = new THREE.Clock();

        // 씬 복사 및 설정
        editorScene.children.forEach((child) => {
          const clonedChild = child.clone();
          scene.add(clonedChild);

          // 애니메이션이 있는 경우 믹서 생성
          if (child.animations && child.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(clonedChild);
            child.animations.forEach((clip) => {
              mixer.clipAction(clip).play();
            });
            mixers.push(mixer);
          }
        });

        // 조명 설정
        setupLights();
      }

      // 재생 상태로 변경
      isPlaying = true;

      // 애니메이션 재시작
      if (!animate.lastTime) {
        animate.lastTime = performance.now();
      }

      // 믹서 액션 재시작
      if (mixers) {
        mixers.forEach((mixer) => {
          mixer.timeScale = 1;
          mixer.startAllAction();
        });
      }

      // 음악 재생 시작
      camera = new THREE.PerspectiveCamera(75, 400 / 300, 0.1, 1000);
      scene = new THREE.Scene();
      clock = new THREE.Clock();

      console.log("Music Editor:", editor.music);
      if (editor.music && editor.music.toJSON) {
        const audioState = editor.music.toJSON().audioState;
        console.log("Audio State:", audioState);
        if (audioState && audioState.audioUrl) {
          console.log("Starting audio playback from URL:", audioState.audioUrl);
          if (!audioContext) {
            audioContext = new (window.AudioContext ||
              window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.gain.value = audioState.volume || 0.5;
            gainNode.connect(audioContext.destination);
          }

          // 이전 소스가 있다면 정지
          if (source) {
            try {
              source.stop();
            } catch (error) {
              console.log("Previous source stop error:", error);
            }
          }

          // 새로운 오디오 소스 생성 및 재생
          fetch(audioState.audioUrl)
            .then((response) => {
              if (!response.ok) {
                throw new Error("Network response was not ok");
              }
              return response.arrayBuffer();
            })
            .then((arrayBuffer) => {
              console.log("Audio data loaded, decoding...");
              return audioContext.decodeAudioData(arrayBuffer);
            })
            .then((buffer) => {
              console.log("Audio decoded, starting playback...");
              source = audioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(gainNode);

              // 마커 위치에 맞춰 재생 시작
              const startTime = audioState.markerStartTime || 0;
              const endTime = audioState.markerEndTime;
              console.log("Playing audio from:", startTime, "to:", endTime);

              if (endTime) {
                source.start(0, startTime, endTime - startTime);
              } else {
                source.start(0, startTime);
              }

              source.onended = () => {
                console.log("Audio playback ended");
              };
            })
            .catch((error) => {
              console.error("Error loading audio:", error);
            });
        } else {
          console.log("No audio URL found in state");
        }
      } else {
        console.log("No music editor or toJSON method found");
      }

      animate();
    }

    function renderPause() {
      isPlaying = false;

      // 음악 일시정지
      if (source) {
        source.stop();
      }

      renderer.dispose();
    }

    function renderStop() {
      // 음악 정지
      if (source) {
        try {
          source.stop();
        } catch (e) {
          console.log("Audio source already stopped");
        }
      }

      // 애니메이션 상태만 초기화
      isPlaying = false;
      currentFrame = 0;
      if (animate.lastTime) {
        animate.lastTime = null;
      }

      // 믹서 액션 정지
      if (mixers) {
        mixers.forEach((mixer) => {
          mixer.stopAllAction();
        });
      }

      // 마지막 프레임 렌더링
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    }

    function renderClose() {
      // 음악 정지 및 정리
      if (source) {
        try {
          source.stop();
        } catch (e) {
          console.log("Audio source already stopped");
        }
        source = null;
      }
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
      if (gainNode) {
        gainNode.disconnect();
        gainNode = null;
      }

      // 애니메이션 상태 초기화
      isPlaying = false;
      currentFrame = 0;
      if (animate.lastTime) {
        animate.lastTime = null;
      }

      // Three.js 리소스 정리
      if (renderer) {
        renderer.dispose();
        renderer = null;
      }

      // 믹서 정리
      if (mixers) {
        mixers.forEach((mixer) => {
          mixer.stopAllAction();
          mixer.uncacheRoot(mixer.getRoot());
        });
        mixers = [];
      }

      // 캔버스 정리
      const canvas = document.querySelector("#renderViewContainer canvas");
      if (canvas) {
        canvas.remove();
      }

      // 전역 변수 초기화
      camera = null;
      editorScene = null;
      scene = null;
      clock = null;
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

    // 초기 렌더링 시작
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
