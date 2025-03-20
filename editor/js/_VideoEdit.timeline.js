import * as THREE from "three";
import { UIPanel, UIRow, UIButton, UIText } from "./libs/ui.js";
function VideoEditTimeline(editor) {
  const strings = editor.strings;
  const signals = editor.signals;
  const mixer = editor.mixer;

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

  // 키프레임 저장 배열
  const keyframes = [];
  let currentKeyframeIndex = -1;

  // 타임라인 클릭 시 키프레임 추가 및 현재 키프레임 변경
  const totalFrames = 180; // 예시로 90프레임 설정
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

    // 현재 3D 객체의 위치를 가져와서 키프레임에 추가
    // const objectPosition = editor.scene.children.map((object) =>
    //   object.position.clone(),
    // );
    addKeyframe(frameIndex, clickX);
  });
  // timelineBar.onClick = (event) => {
  //   alert("dd");
  //   const rect = timelineBar.dom.getBoundingClientRect();
  //   const clickX = event.clientX - rect.left;
  //   const totalWidth = rect.width;
  //   const totalFrames = 90; // 예시로 90프레임 설정
  //   const frameIndex = Math.floor((clickX / totalWidth) * totalFrames);

  //   currentKeyframeIndex = frameIndex; // 현재 키프레임 인덱스 업데이트
  //   currentFrameText.setText(`Current Frame: ${frameIndex}`); // 현재 프레임 텍스트 업데이트

  //   addKeyframe(frameIndex);
  // };

  // 키프레임 추가 함수
  function addKeyframe(frameIndex, x) {
    const keyframeButton = new UIButton();
    keyframeButton.setClass("point");
    keyframeButton.setLeft(x + "px");
    // 현재 3D 객체의 위치를 가져와서 키프레임에 추가
    const objectInfo = editor.scene.children.map((object) => object.clone());
    const objectArr = [];
    editor.scene.children.forEach((obj) => {
      objectArr.push({ childrenid: obj.uuid, position: obj.position.clone() });
    });

    console.log("objectArr");
    console.log(objectArr);
    // const objectUuid = editor.scene.children.map((object) => object.uuid);

    // 키프레임에 위치 정보 저장
    keyframes.push({
      // button: keyframeButton,
      frameIndex: frameIndex,
      objectInfo: objectArr, // 위치 정보를 저장
    });
    // editor.scene = { ...editor.scene, keyframes: keyframes }; // 객체 배열에 추가 (예시)
    editor.scene.userData = { keyframes: keyframes };
    console.log("editor.scene.userData");
    console.log(editor.scene.userData);
    timelineBar.add(keyframeButton);

    // 씬의 모든 객체를 JSON으로 저장하는 함수
    // function saveScene() {
    //   const json = editor.scene.toJSON();
    //   localStorage.setItem("sceneData", JSON.stringify(json)); // 로컬 스토리지에 저장
    // }

    // keyframeButton.onClick(async () => {
    //   currentKeyframeIndex = keyframes.length; // 현재 키프레임 인덱스 업데이트
    //   currentFrameText.setValue(`Current Frame: ${frameIndex}`); // 현재 프레임 텍스트 업데이트
    //   console.log(
    //     `Keyframe ${currentKeyframeIndex + 1} added at frame: ${frameIndex}`,
    //   );
    // });
    // keyframes.push({ button: keyframeButton, frameIndex: frameIndex });
    timelineBar.add(keyframeButton);

    console.log(keyframes);
  }

  // 타임라인 플레이 시 애니메이션 적용
  function playTimeline(currentFrame) {
    console.log("playTimeline");
    console.log(editor);
    // Three.js에서 AnimationMixer 사용 예시
    editor.scene.children.forEach((character, idx) => {
      console.log("character");
      const animationClip = character.animations[0]; // 사용할 애니메이션 클립 (예시)
      const mixer = editor.mixer;
      const action = mixer.clipAction(animationClip, character); // 애니메이션 클립과 객체를 연결
      // action.play();
      console.log(action.isRunning());
      action.isRunning() ? action.stop() : action.play(); // 애니메이션 재생
    });

    const playInterval = setInterval(() => {
      currentFrame++;
      console.log(`currentFrame : ${currentFrame}`);
      if (currentFrame >= totalFrames) {
        clearInterval(playInterval); // 애니메이션 종료
        return;
      }

      // 현재 프레임 레이블 업데이트
      currentFrameText.setValue(`Current Frame: ${currentFrame}`); // 현재 프레임 텍스트 업데이트

      // 키프레임 사이의 보간 애니메이션 실행
      interpolateAnimation(currentFrame);
      // console.log("editor.scene.userData.keyframes");
      console.log(editor.scene.children[0].position.x);
    }, 100); // 30 FPS로 설정
  }

  function interpolateAnimation(currentFrame) {
    console.log("interpolateAnimation");

    const keyframes = editor.scene.userData.keyframes; // 키프레임 가져오기
    let prevKeyframe = null;
    let nextKeyframe = null;

    // 현재 프레임에 해당하는 이전 및 다음 키프레임 찾기
    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].frameIndex <= currentFrame) {
        prevKeyframe = keyframes[i];
      }
      if (keyframes[i].frameIndex > currentFrame && nextKeyframe === null) {
        nextKeyframe = keyframes[i];
        break;
      }
    }

    // 이전 및 다음 키프레임이 모두 존재하는 경우
    if (prevKeyframe && nextKeyframe) {
      const t =
        (currentFrame - prevKeyframe.frameIndex) /
        (nextKeyframe.frameIndex - prevKeyframe.frameIndex); // 보간 계수

      // 각 캐릭터의 위치 업데이트
      prevKeyframe.objectInfo.forEach((obj, index) => {
        const character = editor.scene.children.find(
          (child) => child.uuid === obj.childrenid,
        );
        if (character) {
          // 이전 및 다음 키프레임의 위치 가져오기
          const prevPos = prevKeyframe.objectInfo[index].position;
          const nextPos = nextKeyframe.objectInfo[index].position;

          // 선형 보간
          character.position.x = prevPos.x + (nextPos.x - prevPos.x) * t;
          character.position.y = prevPos.y + (nextPos.y - prevPos.y) * t;
          character.position.z = prevPos.z + (nextPos.z - prevPos.z) * t;
        }
      });
    } else if (prevKeyframe) {
      // 현재 프레임이 마지막 키프레임 이후인 경우
      prevKeyframe.objectInfo.forEach((obj, index) => {
        const character = editor.scene.children.find(
          (child) => child.uuid === obj.childrenid,
        );
        if (character) {
          const prevPos = prevKeyframe.objectInfo[index].position;
          character.position.copy(prevPos); // 이전 키프레임의 위치로 설정
        }
      });
    }
  }

  /*
  function interpolateAnimation(currentFrame) {
    console.log("interpolateAnimation");
    // const characters = editor.scene.children; // 캐릭터 목록 가져오기
    const keyframes = editor.scene.userData.keyframes;
    let keyframeIndex = 0;
    let nextKeyframeIndex = 0;
    let prevFrame = 0;
    let nextFrame = 0;
    const lastFrame = keyframes[keyframes.length - 1].frameIndex;
    console.log(`lastFrame : ${lastFrame}`);
    keyframeIndex = keyframes.findIndex(
      (keyframes) => currentFrame <= keyframes.frameIndex,
    );
    if (keyframeIndex >= 0) {
      console.log(`keyframeIndex :${keyframeIndex}`);
      prevFrame = keyframes[keyframeIndex].frameIndex;
      //nextFrame = keyframes[keyframeIndex + 1].frameIndex;
      nextKeyframeIndex =
        lastFrame < currentFrame ? keyframeIndex + 1 : keyframes.length - 1;
      console.log(`nextKeyframeIndex : ${nextKeyframeIndex}`);
      nextFrame = keyframes[keyframeIndex + 1].frameIndex;
      // lastFrame < currentFrame
      //   ? keyframes[keyframeIndex + 1].frameIndex
      //   : prevFrame;

      const t = nextFrame - currentFrame;
      console.log(`nextFrame:${nextFrame}`);
      console.log(`prevFrame:${prevFrame}`);
      console.log(`시간:${t}`);
      keyframes[keyframeIndex].objectInfo.forEach((obj, idx) => {
        console.log(obj);

        const character = editor.scene.children.find(
          (child) => child.uuid === obj.childrenid,
        );
        console.log("계산");
        console.log(keyframes[nextKeyframeIndex].objectInfo[idx].position);
        console.log(keyframes[keyframeIndex].objectInfo[idx].position);
        const currentPosX =
          character.position.x +
          (keyframes[nextKeyframeIndex].objectInfo[idx].position.x -
            keyframes[keyframeIndex].objectInfo[idx].position.x) /
            t;
        const currentPosY =
          character.position.y +
          (keyframes[nextKeyframeIndex].objectInfo[idx].position.y -
            keyframes[keyframeIndex].objectInfo[idx].position.y) /
            t;
        // const currentPosZ =
        //   character.position.z +
        //   (obj.position.z -
        //     keyframes[nextKeyframeIndex].objectInfo[idx].position.z) *
        //     t;
        console.log(
          `currentPosX : ${currentPosX}, character.position.x : ${character.position.x}`,
        );
        console.log(
          `currentPosY : ${currentPosY}, character.position.y : ${character.position.y}`,
        );
        // console.log(
        //   `currentPosZ : ${currentPosZ}, character.position.z : ${character.position.z}`,
        // );
        character.position.x = currentPosX;
        character.position.y = currentPosY;
        // character.position.z = currentPosZ;
      });
    } else {
      return;
    }

    /*
    // 모든 키프레임을 순회
    editor.scene.userData.keyframes.forEach((val) => {
      const keyframe = val.frameIndex;
      console.log(`keyframe : ${keyframe}`);
      // 현재 프레임과 일치하는 경우
      if (parseInt(keyframe) === currentFrame) {
        val.objectInfo.forEach((obj, index) => {
          console.log(`obj.childrenid : ${obj.childrenid}`);
          const character = editor.scene.children.find(
            (child) => child.uuid === obj.childrenid,
          );

          console.log(character);
          if (character) {
            console.log(character.position);
            character.position.copy(obj.position); // 객체의 위치 업데이트
          }
        });
      }
    });
    */
  /*
    keyframes.forEach((val) => {
      if (!val.frameIndex) return;

      const keyframe = val.frameIndex;
      let prevFrame = null;
      let nextFrame = null;

      // for (const frame of Object.keys(keyframes)
      //   .map(Number)
      //   .sort((a, b) => a - b)) {
      if (keyframe <= currentFrame) {
        prevFrame = keyframe;
      } else {
        nextFrame = keyframe;
      }
      // }
      if (prevFrame !== null && nextFrame !== null) {
        val.objectInfo.forEach((obj, index) => {
          console.log(`obj.childrenid : ${obj.childrenid}`);
          const character = editor.scene.children.find(
            (child) => child.uuid === obj.childrenid,
          );

          console.log(character);
          if (character) {
            const prevTransform = keyframes.find(
              (key) => key.frameIndex === prevFrame,
            ).transform;
            const nextTransform = keyframes[nextFrame].transform;

            const t = (currentFrame - prevFrame) / (nextFrame - prevFrame);
            const currentPos = [
              prevTransform[0][3] +
                (nextTransform[0][3] - prevTransform[0][3]) * t,
              prevTransform[1][3] +
                (nextTransform[1][3] - prevTransform[1][3]) * t,
              prevTransform[2][3] +
                (nextTransform[2][3] - prevTransform[2][3]) * t,
            ];

            character.position.set(currentPos[0], currentPos[1], currentPos[2]); // 캐릭터 위치 업데이트
            // console.log(character.position);
            // character.position.copy(obj.position); // 객체의 위치 업데이트
          }
        });
        const prevTransform = keyframes[prevFrame].transform;
        const nextTransform = keyframes[nextFrame].transform;

        const t = (currentFrame - prevFrame) / (nextFrame - prevFrame);
        const currentPos = [
          prevTransform[0][3] + (nextTransform[0][3] - prevTransform[0][3]) * t,
          prevTransform[1][3] + (nextTransform[1][3] - prevTransform[1][3]) * t,
          prevTransform[2][3] + (nextTransform[2][3] - prevTransform[2][3]) * t,
        ];

        character.position.set(currentPos[0], currentPos[1], currentPos[2]); // 캐릭터 위치 업데이트
      }
        
    });
    */
  // }

  /*
  // 타임라인 플레이 시 애니메이션 적용
  function playTimeline(currentFrame) {
    console.log("playTimeline");

    // Three.js에서 AnimationMixer 사용 예시
    editor.scene.children.forEach((character, idx) => {
      console.log("character");
      const animationClip = character.animations[0]; // 사용할 애니메이션 클립 (예시)
      const mixer = editor.mixer;
      console.log(animationClip);
      console.log(character);
      const action = mixer.clipAction(animationClip, character); // 애니메이션 클립과 객체를 연결
      console.log(action);
      // action.play();
      console.log(action.isRunning());
      action.isRunning() ? action.stop() : action.play(); // 애니메이션 재생
    });

    const playInterval = setInterval(() => {
      currentFrame++;
      if (currentFrame >= totalFrames) {
        clearInterval(playInterval); // 애니메이션 종료
        return;
      }
      console.log(`currentFrame : ${currentFrame}`);
      const keyframe = keyframes[currentFrame];
      console.log(keyframes)
      
      if (keyframe) {
        keyframe.objectInfo.forEach((obj, index) => {
          const character = editor.scene.children[index];
          if (character) {
            if (character.frameIndex == currentFrame) {
              character.position.copy(obj.position); // 객체의 위치 업데이트
            }
          }
        });
      }

      currentFrameText.setValue(`Current Frame: ${currentFrame}`); // 현재 프레임 텍스트 업데이트
    }, 100); // 30 FPS로 설정
  }
    */
  /*
  // 타임라인 플레이 시 애니메이션 적용
  function playTimeline(currentFrame) {
    console.log("playTimeline");
    // console.log(keyframes);

    // Three.js에서 AnimationMixer 사용 예시
    editor.scene.children.forEach((character, idx) => {
      console.log("character");

      const animationClip = character.animations[0]; // 사용할 애니메이션 클립 (예시)
      const mixer = editor.mixer;
      console.log(animationClip);
      console.log(character);
      const action = mixer.clipAction(animationClip, character); // 애니메이션 클립과 객체를 연결
      console.log(action);
      // action.play();
      console.log(action.isRunning());
      action.isRunning() ? action.stop() : action.play(); // 애니메이션 재생
    });

    const playInterval = setInterval(() => {
      currentFrame++;
      if (currentFrame >= totalFrames) {
        clearInterval(playInterval); // 애니메이션 종료
        return;
      }

      console.log(currentFrame);
      const character = editor.scene.children.find(
        (child) => child.uuid === "c130eeed-6e9e-48cb-a188-b5569df007d2",
      );

      console.log(character.position.x);
      character.position.x += 2;

      // 장면을 렌더링하여 변경된 위치를 반영
      // editor.renderer.render(editor.scene, editor.camera);

      console.log(`currentFrame : ${currentFrame}`);
      const keyframe = keyframes[currentFrame];
      keyframe.objectInfo.forEach((obj, index) => {
        console.log(obj);
        console.log(index);
        console.log(editor.scene.children[index]);
        editor.scene.children.forEach((val, idx) => {
          console.log("######");
          console.log(val);
          const object = editor.scene.children[index]; // 객체를 인덱스에 따라 가져옴
          if (object) {
            object.position.copy(position); // 객체의 위치 업데이트
          }
        });
      });

      currentFrameText.setValue(`Current Frame: ${currentFrame}`); // 현재 프레임 텍스트 업데이트
    }, 100); // 30 FPS로 설정

    // keyframes.forEach((keyframe) => {
    //   if (keyframe.frameIndex === currentFrame) {
    //     keyframe.positions.forEach((position, index) => {
    //       const object = editor.scene.children[index]; // 객체를 인덱스에 따라 가져옴
    //       if (object) {
    //         object.objectInfo.copy(position); // 객체의 위치 업데이트
    //       }
    //     });
    //   }
    // });
  }
*/
  return container;
}

export { VideoEditTimeline };
