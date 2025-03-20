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

  //   cut button event
  cutButton.dom.addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    const audioPlayer = document.getElementById("audioPlayer");

    if (!fileInput.files[0]) {
      alert("Please select an audio file.");
      return;
    }

    if (!startTime || !endTime || startTime >= endTime) {
      alert("Please enter valid start and end times.");
      return;
    }

    const file = fileInput.files[0];
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
  });
  return container;
}
export { Music };
