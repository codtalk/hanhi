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
function attemptPlayMusic() {
  if (!bgMusic) return;
  const playPromise = bgMusic.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.catch(() => {
      // Show a small unobtrusive prompt/button
      showMusicButton();
    });
  }
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
  btn.addEventListener('click', () => {
    bgMusic.play().then(() => btn.remove());
  });
  document.body.appendChild(btn);
}

// Init
window.addEventListener('DOMContentLoaded', async () => {
  await loadMessages();
  attemptPlayMusic();
  startSpawning();
  // Pre-spawn some lanterns
  for (let i = 0; i < 6; i++) createLantern();
});
