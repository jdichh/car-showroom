import { canvas } from "../main.js";

const musicFiles = [
    "./assets/music/music1.mp3", 
    "./assets/music/music2.mp3",
    "./assets/music/music3.mp3",
];

const preloadedMusicFiles = musicFiles.map((musicFile) => {
  const audio = new Audio();
  audio.src = musicFile;
  audio.preload = "auto";
  audio.volume = 0.2;
  audio.addEventListener("error", (event) => {
    console.error("Error loading audio:", event);
  });
  return audio;
});

let currentMusicIndex;
let MUSIC;
let isMusicPlaying = true;

const musicToggleButton = document.createElement("button");
musicToggleButton.setAttribute("id", "music-toggle-button");
musicToggleButton.addEventListener("click", toggleMusic);

const iconElement = document.createElement("i");
iconElement.classList.add("fas", "fa-stop", "fa-sm");
musicToggleButton.appendChild(iconElement);

const volumeUpButton = document.createElement("button");
volumeUpButton.setAttribute("id", "volume-up-button");
volumeUpButton.classList.add("fas", "fa-plus", "fa-sm");
volumeUpButton.addEventListener("click", increaseVolume);

const volumeDownButton = document.createElement("button");
volumeDownButton.setAttribute("id", "volume-down-button");
volumeDownButton.classList.add("fas", "fa-minus", "fa-sm");
volumeDownButton.addEventListener("click", decreaseVolume);

canvas.parentNode.appendChild(musicToggleButton);
canvas.parentNode.appendChild(volumeUpButton);
canvas.parentNode.appendChild(volumeDownButton);

function increaseVolume() {
  if (MUSIC.volume < 1) {
    MUSIC.volume += 0.1;
  }
}

function decreaseVolume() {
  if (MUSIC.volume > 0) {
    MUSIC.volume -= 0.1;
  }
}

function toggleMusic() {
  if (isMusicPlaying) {
    MUSIC.pause();
    iconElement.classList.remove("fas", "fa-play", "fa-sm");
    iconElement.classList.add("fas", "fa-stop", "fa-sm");
  } else {
    MUSIC.play();
    iconElement.classList.remove("fas", "fa-stop", "fa-sm");
    iconElement.classList.add("fas", "fa-play", "fa-sm");
  }
  isMusicPlaying = !isMusicPlaying;
}

function playNextTrack() {
  const previousMusicIndex = currentMusicIndex;
  do {
    currentMusicIndex = Math.floor(Math.random() * musicFiles.length);
  } while (currentMusicIndex === previousMusicIndex);

  MUSIC = preloadedMusicFiles[currentMusicIndex];
  MUSIC.currentTime = 0;
//   MUSIC.playbackRate = 3.5; // For testing if music will proceed to the next one, and to check if looping works.
  MUSIC.removeEventListener("ended", playNextTrack);
  MUSIC.addEventListener("ended", playNextTrack);

  if (isMusicPlaying) {
    MUSIC.play();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  currentMusicIndex = Math.floor(Math.random() * musicFiles.length);
  MUSIC = preloadedMusicFiles[currentMusicIndex];
  MUSIC.loop = true;
  playNextTrack();
});
