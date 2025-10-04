// Trung Thu Celebration Script
// Assumptions: images directory contains some lantern images (you can add more).
// messages.json contains an array of objects: { message: string, image: string }

// Danh sách ảnh lồng đèn thực tế (1.png..12.png) trong thư mục images/longden/
// Muốn thêm ảnh: đặt file mới (ví dụ 13.png) rồi thêm 'images/longden/13.png' vào mảng.
const LANTERN_IMAGES = [
  'images/longden/1.png',
  'images/longden/2.png',
  'images/longden/3.png',
  'images/longden/4.png',
  'images/longden/5.png',
  'images/longden/6.png',
  'images/longden/7.png',
  'images/longden/8.png',
  'images/longden/9.png',
  'images/longden/10.png',
  'images/longden/11.png',
  'images/longden/12.png'
];

const lanternContainer = document.getElementById('lantern-container');
const popupOverlay = document.getElementById('popup-overlay');
const popupImage = document.getElementById('popup-image');
const popupMessage = document.getElementById('popup-message');
const closePopupBtn = document.getElementById('close-popup');
const bgMusic = document.getElementById('bg-music');

// Danh sách nhạc sẽ phát tuần tự (thêm / xoá file tại đây)
// Sử dụng đường dẫn tương đối tới thư mục musics/
const MUSIC_PLAYLIST = [
    'musics/ChungTaKhongThuocVeNhau-SonTungMTP-4528181.mp3',
    'musics/bat_tinh_yeu_len.mp3',
];
let currentTrackIndex = 0;
let userInteractedForMusic = false; // đánh dấu khi user đã click / gõ phím / chạm
let attemptedAuto = false; // đã từng gọi play() tự động
let autoRetryTimer = null; // interval thử lại autoplay (nếu bị chặn)
let fadeInterval = null;

let messagesData = [];
let spawnIntervalId = null;
// Bộ nhớ các chỉ số lời chúc đã hiện trong "chu kỳ" hiện tại
let seenMessageIndices = new Set();
// Ngưỡng phần trăm phải đạt (>= 70%) trước khi cho phép lặp lại
const MESSAGE_CYCLE_THRESHOLD = 0.7;

async function loadMessages() {
  try {
    const res = await fetch('data/messages.json?_=' + Date.now()); // prevent cache while dev
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    if (Array.isArray(data)) {
      messagesData = data;
    }
  } catch (err) {
    console.error('Không thể tải messages.json:', err);
  }
}

function random(min, max) { return Math.random() * (max - min) + min; }
function randomInt(min, max) { return Math.floor(random(min, max)); }

function createLantern() {
  const lantern = document.createElement('img');
  lantern.src = LANTERN_IMAGES[randomInt(0, LANTERN_IMAGES.length)];
  // Nếu ảnh bị thiếu / 404 -> loại bỏ để không hiện ô trống
  lantern.onerror = () => lantern.remove();
  lantern.alt = 'Lồng đèn';
  lantern.className = 'lantern';
  lantern.tabIndex = 0; // focusable

  const size = random(50, 110);
  lantern.style.width = size + 'px';

  const startXPercent = random(5, 95);
  lantern.style.left = startXPercent + '%';

  // Custom drift and duration
  const driftX = (Math.random() < 0.5 ? -1 : 1) * random(40, 120);
  lantern.style.setProperty('--drift-x', driftX + 'px');
  const duration = random(18, 38); // seconds
  lantern.style.animationDuration = duration + 's';

  lantern.addEventListener('animationend', () => {
    lantern.remove();
  });

  lantern.addEventListener('click', () => {
    openRandomPopup();
  });

  lantern.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openRandomPopup();
    }
  });

  lanternContainer.appendChild(lantern);
}

function startSpawning() {
  const spawnRateMs = 1500; // base spawn rate
  spawnIntervalId = setInterval(() => {
    // spawn 1-3 lanterns randomly at each interval for variety
    const count = randomInt(1, 3);
    for (let i = 0; i < count; i++) {
      createLantern();
    }
  }, spawnRateMs);
}

function openRandomPopup() {
  if (!messagesData.length) return;

  const total = messagesData.length;
  const requiredUnique = Math.ceil(total * MESSAGE_CYCLE_THRESHOLD);

  // Nếu đã đạt >= 70% số lời chúc (theo ngưỡng) thì reset chu kỳ để cho phép lặp lại dần
  if (seenMessageIndices.size >= requiredUnique) {
    seenMessageIndices.clear();
  }

  // Chọn ngẫu nhiên nhưng ưu tiên phần chưa xem
  let candidateIndex;
  const unseenIndices = [];
  for (let i = 0; i < total; i++) {
    if (!seenMessageIndices.has(i)) unseenIndices.push(i);
  }

  if (unseenIndices.length) {
    // Chọn trong nhóm chưa xem để tối đa đa dạng
    candidateIndex = unseenIndices[randomInt(0, unseenIndices.length)];
  } else {
    // Trường hợp hiếm khi set bị clear đúng lúc - fallback chọn bất kỳ
    candidateIndex = randomInt(0, total);
  }

  seenMessageIndices.add(candidateIndex);
  const item = messagesData[candidateIndex];
  popupImage.src = item.image;
  popupMessage.textContent = item.message;
  popupOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  closePopupBtn.focus();
}

function closePopup() {
  popupOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

closePopupBtn.addEventListener('click', closePopup);
popupOverlay.addEventListener('click', (e) => {
  if (e.target === popupOverlay) {
    closePopup();
  }
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !popupOverlay.classList.contains('hidden')) {
    closePopup();
  }
});

// Handle music autoplay restrictions
function loadCurrentTrack(force = false) {
  if (!bgMusic || !MUSIC_PLAYLIST.length) return;
  if (currentTrackIndex >= MUSIC_PLAYLIST.length) currentTrackIndex = 0; // vòng lặp
  // Nếu đã có src đúng rồi và không force thì bỏ
  const desired = location.origin ? new URL(MUSIC_PLAYLIST[currentTrackIndex], location.href).href : MUSIC_PLAYLIST[currentTrackIndex];
  if (!force && bgMusic.src && bgMusic.src.endsWith(encodeURI(MUSIC_PLAYLIST[currentTrackIndex]))) return;
  bgMusic.src = MUSIC_PLAYLIST[currentTrackIndex];
  try { bgMusic.load(); } catch(_) {}
}

function playCurrentTrack(auto = true) {
  if (!bgMusic || !MUSIC_PLAYLIST.length) return;
  if (!bgMusic.src) loadCurrentTrack();
  attemptedAuto = attemptedAuto || auto;
  const playPromise = bgMusic.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.then(() => {
      // Nếu phát thành công và đang muted do autoplay policy, sẽ unmute sau nếu được
      if (auto && !userInteractedForMusic) {
        // Không unmute ngay lập tức để tránh vi phạm policy; đợi gesture hoặc timeout mượt
      }
      stopAutoRetry();
    }).catch(err => {
      // Bị chặn autoplay
      if (auto) scheduleAutoRetry();
      // Chưa show nút ngay, cho vài lần thử (cải thiện experience)
      autoRevealMusicButton();
      console.debug('Autoplay bị chặn:', err?.name || err);
    });
  }
}

// Phát nhạc do user thao tác (đảm bảo tương thích Chrome mobile)
async function userInitiatedPlay(forceUnmute = true) {
  if (!bgMusic || !MUSIC_PLAYLIST.length) return;
  userInteractedForMusic = true;
  stopAutoRetry();
  // Đảm bảo có src
  if (!bgMusic.src) loadCurrentTrack();
  // Bỏ muted attribute trước khi play (một số Chrome Android yêu cầu gesture + không muted để coi là tương tác hợp lệ)
  if (bgMusic.hasAttribute('muted')) bgMusic.removeAttribute('muted');
  bgMusic.muted = !forceUnmute; // nếu forceUnmute=false sẽ unmute sau fade
  if (forceUnmute) bgMusic.muted = false;
  // Volume tối thiểu
  if (bgMusic.volume === 0) bgMusic.volume = 1;
  console.log('[MUSIC] User play attempt', { currentTrackIndex, src: bgMusic.src, muted: bgMusic.muted, volume: bgMusic.volume, readyState: bgMusic.readyState });
  try {
    await bgMusic.play();
    console.log('[MUSIC] Play success');
    if (bgMusic.muted && forceUnmute) {
      // nếu vẫn bị muted (do browser cưỡng chế) thử unmute sau 100ms
      setTimeout(() => { try { bgMusic.muted = false; } catch(_){} }, 120);
    }
    if (forceUnmute) ensureAudible(); else smoothlyUnmute();
    showChangeTrackButton();
    return true;
  } catch (err) {
    console.warn('[MUSIC] Play failed', err);
    return false;
  }
}

function nextTrack() {
  if (!MUSIC_PLAYLIST.length) return;
  currentTrackIndex = (currentTrackIndex + 1) % MUSIC_PLAYLIST.length;
  loadCurrentTrack();
  playCurrentTrack(false); // không hiện nút nữa vì user đã cho phép
}

function attemptPlayMusic(initial = false) {
  if (!bgMusic || !MUSIC_PLAYLIST.length) return;
  loadCurrentTrack();
  // Đảm bảo muted để tăng khả năng được phép autoplay
  if (initial) {
    bgMusic.muted = true;
    bgMusic.volume = 1; // volume nội bộ; khi unmute sẽ nghe luôn
  }
  playCurrentTrack(true);
}

function scheduleAutoRetry() {
  if (autoRetryTimer) return;
  let tries = 0;
  autoRetryTimer = setInterval(() => {
    if (userInteractedForMusic) { stopAutoRetry(); return; }
    if (tries++ > 4) { // thử vài lần rồi thôi
      stopAutoRetry();
      showMusicButton();
      return;
    }
    playCurrentTrack(true);
  }, 1800);
}

function stopAutoRetry() {
  if (autoRetryTimer) {
    clearInterval(autoRetryTimer);
    autoRetryTimer = null;
  }
}

let revealButtonTimeout = null;
function autoRevealMusicButton() {
  if (revealButtonTimeout || document.getElementById('music-btn')) return;
  revealButtonTimeout = setTimeout(() => {
    if (!userInteractedForMusic && bgMusic.paused) {
      showMusicButton();
    }
  }, 4200); // chờ vài giây xem autoplay có thành công ở lần retry
}

function showMusicButton() {
  if (document.getElementById('music-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'music-btn';
  btn.textContent = 'Phát nhạc 🎵';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '14px',
    left: '14px',
    zIndex: 1200,
    padding: '10px 16px',
    borderRadius: '30px',
    border: '2px solid #ffcc66',
    background: 'linear-gradient(135deg,#2f3d66,#1d2744)',
    color: '#ffe8b0',
    cursor: 'pointer',
    fontSize: '15px',
    boxShadow: '0 4px 12px #0008'
  });
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Đang phát...';
    const ok = await userInitiatedPlay(true);
    if (ok) {
      btn.remove();
    } else {
      btn.disabled = false;
      btn.textContent = 'Thử lại phát nhạc 🎵';
    }
  });
  document.body.appendChild(btn);
}

// Nút đổi bài (skip) – chỉ tạo nếu playlist > 1
function showChangeTrackButton() {
  if (MUSIC_PLAYLIST.length < 2) return; // không cần nếu chỉ 1 bài
  if (document.getElementById('next-track-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'next-track-btn';
  btn.textContent = 'Đổi nhạc ⏭️';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '14px',
    left: '160px', // đặt lệch sang phải để không đè nút phát nhạc
    zIndex: 1200,
    padding: '10px 16px',
    borderRadius: '30px',
    border: '2px solid #ffcc66',
    background: 'linear-gradient(135deg,#2f3d66,#1d2744)',
    color: '#ffe8b0',
    cursor: 'pointer',
    fontSize: '15px',
    boxShadow: '0 4px 12px #0008'
  });
  btn.title = 'Chuyển sang bài tiếp theo';
  btn.addEventListener('click', () => {
    // Nếu chưa phát được (autoplay bị chặn) thì force play sau khi load bài tiếp
    currentTrackIndex = (currentTrackIndex + 1) % MUSIC_PLAYLIST.length;
    loadCurrentTrack(true);
    playCurrentTrack(false);
    if (bgMusic.muted && userInteractedForMusic) smoothlyUnmute();
  });
  document.body.appendChild(btn);
}

// Khi bài hát kết thúc -> chuyển bài tiếp theo
if (bgMusic) {
  bgMusic.addEventListener('ended', () => {
    nextTrack();
  });
}

function ensureAudible() {
  if (!bgMusic) return;
  if (bgMusic.muted) bgMusic.muted = false;
  if (bgMusic.volume < 1) bgMusic.volume = 1;
}

function smoothlyUnmute() {
  if (!bgMusic) return;
  if (!bgMusic.muted && bgMusic.volume >= 1) return;
  bgMusic.muted = false;
  const target = 1;
  const startVol = bgMusic.volume || 0;
  bgMusic.volume = startVol;
  if (fadeInterval) clearInterval(fadeInterval);
  const step = 0.05 * Math.max(0.5, target - startVol); // nhỏ hơn nếu đã có 1 phần âm lượng
  fadeInterval = setInterval(() => {
    bgMusic.volume = Math.min(target, bgMusic.volume + step);
    if (bgMusic.volume >= target) {
      clearInterval(fadeInterval);
    }
  }, 120);
}

// Global user gesture fallback: bất kỳ click / touch đầu tiên sẽ gỡ mute & play
['click','touchstart','keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (!bgMusic || userInteractedForMusic) return;
    userInitiatedPlay(true);
  }, { once: true, passive: true });
});

// Visibility change thử lại (trong trường hợp tab background lúc load)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !userInteractedForMusic && bgMusic && bgMusic.paused) {
    playCurrentTrack(true);
  }
});

// Init với màn gift gate
window.addEventListener('DOMContentLoaded', async () => {
  await loadMessages();
  // Chỉ preload track (muted) không auto play cho tới khi user mở quà
  loadCurrentTrack();
  const gate = document.getElementById('gift-gate');
  const enterBtn = document.getElementById('enter-gift');
  if (enterBtn) {
    enterBtn.addEventListener('click', async () => {
      // Ẩn gate với hiệu ứng
      if (gate) {
        gate.classList.add('hidden');
        setTimeout(() => gate && gate.remove(), 650);
      }
      // Bắt đầu scene chính
      startSpawning();
      for (let i = 0; i < 6; i++) createLantern();
      // Phát nhạc dựa trên gesture này
      const ok = await userInitiatedPlay(true);
      if (!ok) {
        // Nếu vẫn fail, hiện nút phát thủ công
        showMusicButton();
      }
      // Hiện nút đổi nhạc (nếu có nhiều bài)
      showChangeTrackButton();
    }, { once: true });
  }
});
