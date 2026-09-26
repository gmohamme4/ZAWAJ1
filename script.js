/* ==========================================================
   EDIT YOUR WEDDING DETAILS HERE
   ========================================================== */
const invitationData = {
  bride: "غفران",
  groom: "محسن",
  // Use YYYY-MM-DDTHH:mm:ss. The countdown uses the viewer's local time.
  weddingDate: "2026-10-30T11:30:00",
  autoScrollDemo: true,   // set to false if you don't want automatic scrolling
  autoScrollSpeed: 0.62   // pixels per frame at 60 Hz; increase for faster scrolling
};

const invitation = document.getElementById("invitation");
const intro = document.getElementById("intro");
const introVideo = document.querySelector(".intro-video");
const music = document.getElementById("music");
const soundButton = document.getElementById("soundButton");
// تأكيد الحضور معطّل مؤقتًا؛ أزل تعليقات العناصر والمعالجات مع قسم HTML لإعادته.
/*
const rsvpButton = document.getElementById("rsvpButton");
const rsvpModal = document.getElementById("rsvpModal");
const modalClose = document.getElementById("modalClose");
const rsvpForm = document.getElementById("rsvpForm");
const formNote = document.getElementById("formNote");
*/

const date = new Date(invitationData.weddingDate);
const dateOptions = { calendar: "gregory", numberingSystem: "arab", day: "numeric", month: "long", year: "numeric" };
const prettyDate = new Intl.DateTimeFormat("ar", dateOptions).format(date);
const longDate = new Intl.DateTimeFormat("ar", { ...dateOptions, weekday: "long" }).format(date);
const countdownNumber = new Intl.NumberFormat("ar", { numberingSystem: "arab", minimumIntegerDigits: 2, useGrouping: false });

document.querySelectorAll("[data-bride]").forEach(el => el.textContent = invitationData.bride);
document.querySelectorAll("[data-groom]").forEach(el => el.textContent = invitationData.groom);
document.querySelectorAll("[data-date-pretty]").forEach(el => el.textContent = prettyDate);
document.querySelectorAll("[data-date-long]").forEach(el => el.textContent = prettyDate);
document.querySelectorAll("[data-date-day]").forEach(el => el.textContent = longDate);
document.title = `${invitationData.bride} و${invitationData.groom} — دعوة زفاف`;

function pad(n) { return countdownNumber.format(Math.max(0, n)); }
function updateCountdown() {
  const now = new Date();
  let ms = date - now;
  if (ms < 0) ms = 0;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  document.getElementById("days").textContent = pad(d);
  document.getElementById("hours").textContent = pad(h);
  document.getElementById("minutes").textContent = pad(m);
  document.getElementById("seconds").textContent = pad(s);
}
updateCountdown();
setInterval(updateCountdown, 1000);

// Start music from the opening gesture and keep the sound button in sync.
function syncSoundButton() {
  const playing = !music.paused && !music.ended;
  soundButton.classList.toggle("playing", playing);
  soundButton.setAttribute("aria-pressed", String(playing));
  soundButton.setAttribute("aria-label", playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى");
}
async function startMusic() {
  try {
    await music.play();
  } catch (error) {
    console.warn("Music playback could not start.", error);
  }
  syncSoundButton();
}
["play", "pause", "ended", "error"].forEach(event => music.addEventListener(event, syncSoundButton));
syncSoundButton();
soundButton.addEventListener("click", () => {
  if (music.paused) startMusic();
  else music.pause();
});

// Animate scrolling ourselves; CSS smooth scrolling would restart on every frame.
let autoScrollId = null;
let userStoppedAutoScroll = false;
function startAutoScroll() {
  if (!invitationData.autoScrollDemo || userStoppedAutoScroll || autoScrollId !== null) return;
  // Keep fractional progress outside scrollTop, which browsers may round.
  let position = Math.max(0, invitation.scrollTop);
  let previousTime = null;
  const pixelsPerSecond = invitationData.autoScrollSpeed * 60;
  const step = timestamp => {
    autoScrollId = null;
    if (userStoppedAutoScroll) return;
    const max = Math.max(0, invitation.scrollHeight - invitation.clientHeight);
    if (invitation.scrollTop >= max) return;
    // Avoid a large jump after returning from a background tab.
    const elapsed = previousTime === null ? 0 : Math.min(timestamp - previousTime, 64);
    previousTime = timestamp;
    position = Math.min(max, position + pixelsPerSecond * elapsed / 1000);
    invitation.scrollTop = Math.min(max, Math.round(position));
    if (position < max) autoScrollId = requestAnimationFrame(step);
  };
  autoScrollId = requestAnimationFrame(step);
}

const stopAutoScroll = () => {
  userStoppedAutoScroll = true;
  if (autoScrollId !== null) cancelAnimationFrame(autoScrollId);
  autoScrollId = null;
};
["wheel", "touchstart", "pointerdown", "keydown"].forEach(evt => {
  invitation.addEventListener(evt, stopAutoScroll, { passive: true });
});

let introStarted = false;
let introFinished = false;
function finishIntro() {
  // Loading errors must never open the invitation before the user's gesture.
  if (intro && introVideo && !introStarted) return;
  if (introFinished) return;
  introFinished = true;
  intro?.classList.add("hidden");
  intro?.setAttribute("aria-hidden", "true");
  document.querySelector(".phone")?.removeAttribute("inert");
  document.querySelector(".phone")?.classList.add("intro-complete");
  setTimeout(startAutoScroll, 1600);
}

function startIntroVideo() {
  if (!introVideo || introStarted || introFinished) return;
  introStarted = true;
  if (introVideo.error || introVideo.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
    finishIntro();
  } else {
    // Request playback directly from the click, before starting the music.
    // If playback fails, the same click still opens the invitation.
    introVideo.play().catch(finishIntro);
  }
  startMusic();
}

if (intro && introVideo) {
  document.querySelector(".phone")?.setAttribute("inert", "");
  intro.setAttribute("aria-hidden", "false");
  introVideo.addEventListener("ended", finishIntro, { once: true });
  introVideo.addEventListener("error", finishIntro, { once: true });
  introVideo.querySelector("source")?.addEventListener("error", finishIntro, { once: true });
  intro.addEventListener("click", startIntroVideo);
  introVideo.addEventListener("playing", () => intro.classList.add("opening"));

} else {
  finishIntro();
}

// RSVP modal.
/*function openModal() {
  stopAutoScroll();
  rsvpModal.classList.add("open");
  rsvpModal.setAttribute("aria-hidden", "false");
}
function closeModal() {
  rsvpModal.classList.remove("open");
  rsvpModal.setAttribute("aria-hidden", "true");
}
rsvpButton.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
rsvpModal.addEventListener("click", e => { if (e.target === rsvpModal) closeModal(); });
window.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

rsvpForm.addEventListener("submit", e => {
  e.preventDefault();
  const form = new FormData(rsvpForm);
  const name = form.get("name") || "ضيفنا العزيز";
  formNote.textContent = `شكرًا لك، ${name}. إرسال الردود غير متاح حاليًا؛ يُرجى التواصل مع العروسين لتأكيد الحضور.`;
  rsvpForm.reset();
});*/
const scheduleList = document.querySelector(".schedule-list");
const flower = document.querySelector(".moving-flower");
const scheduleDots = [...document.querySelectorAll(".schedule-dot")];

function moveScheduleFlower() {
  if (!invitation || !scheduleList || !flower || !scheduleDots.length) return;

  const listRect = scheduleList.getBoundingClientRect();
  const viewportRect = invitation.getBoundingClientRect();
  const firstDot = scheduleDots[0].getBoundingClientRect();
  const lastDot = scheduleDots[scheduleDots.length - 1].getBoundingClientRect();
  // Use the invitation's visible area because it owns the scrollbar.
  const triggerY = viewportRect.top + viewportRect.height * 0.55;
  const firstY = firstDot.top + firstDot.height / 2;
  const lastY = lastDot.top + lastDot.height / 2;
  const flowerY = Math.max(firstY, Math.min(lastY, triggerY));
  // Convert screen coordinates to local coordinates, including the intro scale.
  const scaleX = listRect.width / scheduleList.offsetWidth || 1;
  const scaleY = listRect.height / scheduleList.offsetHeight || 1;
  flower.style.left = `${(firstDot.left + firstDot.width / 2 - listRect.left) / scaleX}px`;
  flower.style.top = `${(flowerY - listRect.top) / scaleY}px`;
}

let flowerFrame = null;
function requestFlowerMove() {
  if (flowerFrame !== null) return;
  flowerFrame = requestAnimationFrame(() => {
    flowerFrame = null;
    moveScheduleFlower();
  });
}

invitation.addEventListener("scroll", requestFlowerMove, { passive: true });
window.addEventListener("resize", requestFlowerMove);
window.addEventListener("load", requestFlowerMove);
document.querySelector(".phone")?.addEventListener("animationend", requestFlowerMove);
if (document.fonts) document.fonts.ready.then(requestFlowerMove);
if (typeof ResizeObserver !== "undefined") {
  const flowerObserver = new ResizeObserver(requestFlowerMove);
  flowerObserver.observe(invitation);
  flowerObserver.observe(scheduleList);
}
moveScheduleFlower();
