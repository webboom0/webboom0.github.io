import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { UIPanel, UIRow, UIButton, UIText, UISpan } from "./libs/ui.js";

class VideoEditRender {
  constructor(editor) {
    // 이미 존재하는 renderViewContainer 제거
    const existingContainer = document.getElementById("renderViewContainer");
    if (existingContainer) {
      existingContainer.remove();
    }

    if (!editor) {
      console.log("Editor not found");
      return;
    }

    this.editor = editor;
    this.renderer = null;
    this.camera = null;
    this.scene = null;
    this.clock = null;
    this.mixers = [];
    this.isPlaying = false;
    this.currentFrame = 0;
    this.source = null;
    this.audioContext = null;
    this.gainNode = null;

    // 컨테이너 생성
    this.container = document.createElement("div");
    this.container.id = "renderViewContainer";
    document.body.appendChild(this.container);

    // 초기 설정
    this.init();

    // 외부 클릭 이벤트 리스너 설정
    this.setupEventListeners();

    // 초기 렌더링 시작
    this.renderPlay();
  }

  init() {
    // 타임라인 플레이 시 애니메이션 적용
    console.log("Render");
    const keyframes = this.editor.scene.userData.keyframes;
    if (!keyframes) {
      console.log("No keyframes found. Exiting function.");
      return;
    }

    let editorScene = this.editor.scene; // 에디터 씬
    this.camera = new THREE.PerspectiveCamera(75, 400 / 300, 0.1, 1000); // 카메라
    this.mixers = []; // 애니메이션 믹서
    editorScene.children.forEach((character) => {
      const mixer = new THREE.AnimationMixer(character); // 애니메이션 믹서 생성
      this.mixers.push(mixer); // 믹서 배열에 추가
      character.animations.forEach((clip) => {
        mixer.clipAction(clip).play(); // 애니메이션 재생
      });
    });

    this.clock = new THREE.Clock(); // 클럭

    let renderer = new THREE.WebGLRenderer(); // 렌더러
    renderer.setClearColor(0xf0f0f0, 1);
    // let editorScene;
    // let camera;
    this.scene = new THREE.Scene();
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
      playButton.dom.addEventListener("click", this.renderPlay.bind(this));
      // 일시정지
      pauseButton.dom.addEventListener("click", this.renderPause.bind(this));
      // 정지
      stopButton.dom.addEventListener("click", this.renderStop.bind(this));

      // renderView 외부 클릭 및 드래그 감지
      document.body.addEventListener("mousedown", (event) => {
        console.log("%%%%%%%%%%%%%%%%%%%%%%");
        console.log(event.target.closest("#renderViewContainer"));
        if (
          !event.target.closest("#renderViewContainer") &&
          document.getElementById("renderViewContainer") != null
        ) {
          this.renderClose();
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
        if (!this.isPlaying) {
          return;
        }

        // 애니메이션이 끝나면 정지
        if (this.currentFrame >= _totalSeconds * _framesPerSecond) {
          this.isPlaying = false;
          return;
        }

        requestAnimationFrame(animate);

        if (this.isPlaying) {
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
            this.currentFrame++;

            const delta = this.clock.getDelta();
            this.mixers.forEach((mixer) => mixer.update(delta));

            editorScene.children.forEach((character) => {
              const frames =
                editorScene.userData.keyframes[character.uuid] || [];
              let prevFrame = null;
              let nextFrame = null;

              for (let i = 0; i < frames.length; i++) {
                if (frames[i].frameIndex <= this.currentFrame) {
                  prevFrame = frames[i];
                }
                if (
                  frames[i].frameIndex > this.currentFrame &&
                  nextFrame === null
                ) {
                  nextFrame = frames[i];
                  break;
                }
              }

              if (prevFrame && nextFrame) {
                const t =
                  (this.currentFrame - prevFrame.frameIndex) /
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
            const totalSeconds = this.currentFrame / _framesPerSecond;
            const minutes = Math.floor(totalSeconds / 60);
            const hours = Math.floor(minutes / 60);
            const displaySeconds = Math.floor(totalSeconds % 60);
            const displayFrames = Math.floor(
              this.currentFrame % _framesPerSecond,
            );
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

        if (this.renderer) {
          this.renderer.render(this.scene, this.camera);
        }
      }

      // 오디오 상태 가져오기
      const musicEditor = this.editor.music;
      if (musicEditor && musicEditor.toJSON) {
        const audioState = musicEditor.toJSON().audioState;
        if (audioState && audioState.audioUrl) {
          // 오디오 컨텍스트 초기화
          this.audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          this.gainNode = this.audioContext.createGain();
          this.gainNode.gain.value = audioState.volume;
          this.gainNode.connect(this.audioContext.destination);

          // 오디오 파일 로드 및 재생 준비
          fetch(audioState.audioUrl)
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => {
              this.audioContext.decodeAudioData(arrayBuffer, function (buffer) {
                this.source = this.audioContext.createBufferSource();
                this.source.buffer = buffer;
                this.source.connect(this.gainNode);

                // 마커 위치에 맞춰 재생 시작
                const startTime = audioState.markerStartTime || 0;
                const endTime = audioState.markerEndTime;
                const duration = endTime - startTime;

                // 렌더링 시작과 함께 자동 재생
                this.source.start(0, startTime, duration);
                this.source.startTime = this.audioContext.currentTime;

                // 재생이 끝나면 오디오만 정지
                this.source.onended = () => {
                  if (this.source) {
                    this.source.stop();
                  }
                };
              });
            });
        }
      }

      // 카메라 컨트롤
      const controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.camera.position.set(0, 10, 100);
      this.camera.lookAt(editorScene.position);
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
      animate.call(this);
    }
  }

  renderPlay() {
    // 처음 시작할 때만 초기화
    if (!this.renderer) {
      // 새로운 렌더러 초기화
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderView.dom.appendChild(this.renderer.domElement);

      // 카메라 초기화
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
      );

      // 씬 초기화
      this.scene = new THREE.Scene();

      // 클럭 초기화
      this.clock = new THREE.Clock();

      // 씬 복사
      this.editor.scene.children.forEach((child) => {
        this.scene.add(child.clone());
      });

      // 조명 설정
      this.setupLights();
    }

    // 재생 상태로 변경
    this.isPlaying = true;

    // 애니메이션 재시작
    if (!animate.lastTime) {
      animate.lastTime = performance.now();
    }

    // 애니메이션 함수 호출
    requestAnimationFrame(animate);
  }

  renderPause() {
    this.isPlaying = false;

    // 음악 일시정지
    if (this.source) {
      this.source.stop();
    }

    this.renderer.dispose();
  }

  renderStop() {
    // 음악 정지
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        console.log("Audio source already stopped");
      }
    }

    // 애니메이션 상태만 초기화
    this.isPlaying = false;
    this.currentFrame = 0;
    if (animate.lastTime) {
      animate.lastTime = null;
    }

    // 마지막 프레임 렌더링
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  renderClose() {
    // 재생 중지
    this.isPlaying = false;

    // 음악 정지 및 정리
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        console.log("Audio source already stopped");
      }
      this.source.disconnect();
      this.source = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // 애니메이션 상태 초기화
    this.currentFrame = 0;
    if (animate.lastTime) {
      animate.lastTime = null;
    }

    // 믹서 정리
    if (this.mixers.length > 0) {
      this.mixers.forEach((mixer) => {
        // 모든 액션 정지 및 메모리 정리
        mixer.stopAllAction();
        mixer.uncacheRoot(mixer.getRoot());
      });
      this.mixers = [];
    }

    // Three.js 리소스 정리
    if (this.scene) {
      // 씬의 모든 객체 제거
      while (this.scene.children.length > 0) {
        const object = this.scene.children[0];
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
        this.scene.remove(object);
      }
      this.scene = null;
    }

    if (this.renderer) {
      // WebGL 컨텍스트 정리
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
      this.renderer = null;
    }

    // 카메라 정리
    this.camera = null;

    // 클럭 정리
    if (this.clock) {
      this.clock.stop();
      this.clock = null;
    }

    // 캔버스 요소 제거
    const canvas = this.container.querySelector("canvas");
    if (canvas) {
      canvas.remove();
    }

    // 컨테이너 내용 정리
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  setupLights() {
    // Implementation of setupLights method
  }

  setupEventListeners() {
    // Implementation of setupEventListeners method
  }
}

export { VideoEditRender };
