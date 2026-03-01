let hearts = 3;
let hp = 100;
let xp = 0;
let tokens = 0;
let dayEnded = false;

// timer state
let timerSeconds = 25 * 60;
let timerInterval = null;

const STORAGE_KEY = 'boardJeeGameState_v1';

// Celebratory floaty text
function celebrateXP(amount) {
  const floaty = document.createElement('div');
  floaty.textContent = `+${amount} ✨`;
  floaty.style.cssText = `
    position: fixed;
    pointer-events: none;
    font-size: 24px;
    font-weight: bold;
    color: #22c55e;
    text-shadow: 0 0 10px rgba(34,197,94,0.8);
    z-index: 9999;
    left: ${Math.random() * window.innerWidth}px;
    top: ${window.innerHeight * 0.3}px;
    animation: floatUp 1.5s ease-out forwards;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatUp {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-200px) scale(1.2); opacity: 0; }
    }
  `;
  if (!document.querySelector('style[data-animation="floatUp"]')) {
    style.setAttribute('data-animation', 'floatUp');
    document.head.appendChild(style);
  }
  
  document.body.appendChild(floaty);
  setTimeout(() => floaty.remove(), 1500);
}

const heartEls = [
  document.getElementById('heart1'),
  document.getElementById('heart2'),
  document.getElementById('heart3')
];
const hpBar = document.getElementById('hpBar');
const hpText = document.getElementById('hpText');
const xpBar = document.getElementById('xpBar');
const xpText = document.getElementById('xpText');
const tokenText = document.getElementById('tokenText');
const logList = document.getElementById('logList');
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const endDayBtn = document.getElementById('endDayBtn');
const daySummaryText = document.getElementById('daySummaryText');
const newDayBtn = document.getElementById('newDayBtn');
function saveState() {
  const state = {
    hearts,
    hp,
    xp,
    tokens
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const state = JSON.parse(saved);
    if (typeof state.hearts === 'number') hearts = state.hearts;
    if (typeof state.hp === 'number') hp = state.hp;
    if (typeof state.xp === 'number') xp = state.xp;
    if (typeof state.tokens === 'number') tokens = state.tokens;
  } catch (e) {
    console.warn('Failed to parse saved state', e);
  }
}

function getLevel(xpVal) {
  if (xpVal >= 350) return 5;
  if (xpVal >= 220) return 4;
  if (xpVal >= 120) return 3;
  if (xpVal >= 50) return 2;
  return 1;
}

function updateUI() {
  heartEls.forEach((el, idx) => {
    if (idx < hearts) {
      el.classList.remove('lost');
    } else {
      el.classList.add('lost');
    }
  });

  hp = Math.max(0, Math.min(100, hp));
  hpBar.style.width = hp + '%';
  hpText.textContent = hp;

  const level = getLevel(xp);
  xpBar.style.width = Math.min(100, xp / 3.5) + '%';
  xpText.textContent = `${xp} (Level ${level})`;

  tokenText.textContent = tokens;

  // save whenever UI updates
  saveState();
}

function addLog(text) {
  const li = document.createElement('li');
  const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  const span = document.createElement('span');
  span.className = 'time';
  span.textContent = `[${time}]`;
  li.appendChild(span);
  li.appendChild(document.createTextNode(text));
  logList.prepend(li);
  
  // Limit log to 50 entries
  while (logList.children.length > 50) {
    logList.removeChild(logList.lastChild);
  }
}

function pulseHearts() {
  heartEls.forEach(el => {
    el.classList.add('pulse');
    setTimeout(() => el.classList.remove('pulse'), 500);
  });
}

function breakHeart(index) {
  if (index < heartEls.length) {
    heartEls[index].classList.add('break');
    setTimeout(() => heartEls[index].classList.remove('break'), 600);
  }
}

function gainXP(amount, label) {
  if (dayEnded) return;
  xp += amount;
  addLog(`✨ +${amount} XP → ${label}`);
  pulseHearts();
  celebrateXP(amount);
  updateUI();
}

function loseHeart(reason) {
  if (dayEnded) return;
  if (hearts > 0) {
    breakHeart(hearts - 1);
    hearts -= 1;
  }
  hp -= 10;
  addLog(`💔 Heart lost! (${reason})`);

  if (hearts === 0) {
    addLog('😭 OUCH! Game Over penalty incoming: 45 min NCERT tomorrow!');
    addLog('💪 But you can still earn tokens today - go for it!');
  }
  updateUI();
}

function handleBlock(type) {
  switch (type) {
    case 'board-read':
      gainXP(10, '📖 Board NCERT Reading');
      break;
    case 'board-write':
      gainXP(15, '✍️ Board Writing Practice');
      break;
    case 'jee':
      gainXP(15, '🎯 JEE Problem Solving');
      break;
    case 'analysis':
      gainXP(20, '🔍 Analysis & Error Log');
      break;
    case 'distraction':
      loseHeart('📱 Phone distraction/Skipped');
      break;
    default:
      break;
  }
}

document.querySelectorAll('.buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.getAttribute('data-type');
    handleBlock(type);
  });
});

// timer functions
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

function startTimer() {
  if (timerInterval !== null || dayEnded) return;
  if (timerSeconds <= 0) timerSeconds = 25 * 60;

  startTimerBtn.textContent = '⏸️ RUNNING...';
  startTimerBtn.disabled = true;

  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerSeconds = 0;
      updateTimerDisplay();
      startTimerBtn.textContent = '▶️ START BLOCK';
      startTimerBtn.disabled = false;
      
      // Show celebratory message
      addLog('⏰ TIME\'S UP! ⭐ Block complete!');
      addLog('📊 Log your block type to claim XP!');
      
      // Flash effect
      timerDisplay.style.color = '#fbbf24';
      setTimeout(() => {
        timerDisplay.style.color = '#60a5fa';
      }, 500);
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 25 * 60;
  startTimerBtn.textContent = '▶️ START BLOCK';
  startTimerBtn.disabled = false;
  updateTimerDisplay();
  addLog('🔄 Timer reset!');
}

startTimerBtn.addEventListener('click', startTimer);
resetTimerBtn.addEventListener('click', resetTimer);

// end-of-day tokens logic
endDayBtn.addEventListener('click', () => {
  if (dayEnded) return;
  dayEnded = true;

  const level = getLevel(xp);
  let earnedTokens = 0;

  if (level >= 5) earnedTokens = 4;
  else if (level === 4) earnedTokens = 3;
  else if (level === 3) earnedTokens = 2;
  else if (level === 2) earnedTokens = 1;
  else earnedTokens = 0;

  if (hearts === 0) {
    earnedTokens = Math.max(0, earnedTokens - 1);
  }

  tokens += earnedTokens;
  updateUI();

  // Build celebratory message
  let msg = `🏆 END OF DAY SUMMARY 🏆\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `Level Reached: ${level} ⭐\n`;
  msg += `Hearts Remaining: ${hearts} ❤️\n`;
  msg += `Total XP: ${xp} ✨\n`;
  
  if (earnedTokens > 0) {
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🎉 YOU EARNED ${earnedTokens} TOKEN(S)! 🎉\n`;
    msg += `Spend on: Piano 🎹, F1 🏎️, YouTube 📺 (guilt-free!)`;
  } else {
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💪 0 tokens earned today.\n`;
    msg += `Tomorrow: Start with penalty NCERT block (45 min)`;
  }

  daySummaryText.textContent = msg;
  addLog('🎊 DAY ENDED - Check summary above!');
});


newDayBtn.addEventListener('click', () => {
  // confirm so you don't accidentally wipe mid-day
  if (!confirm('☀️ Start a brand new day?\n\nHearts, HP, XP reset.\nTokens stay with you.\n\nReady? 💪')) {
    return;
  }

  // reset daily state
  hearts = 3;
  hp = 100;
  xp = 0;
  dayEnded = false;
  daySummaryText.textContent = '';

  addLog('═════════════════════════════════');
  addLog('🌅 NEW DAY STARTED!');
  addLog('═════════════════════════════════');
  addLog('💪 Hearts, HP, XP reset');
  addLog('💰 Tokens carried over');
  addLog('⚡ Let\'s crush today!');
  
  updateUI();
});

// init
loadState();
updateTimerDisplay();
updateUI();

// Welcome message on first load
if (logList.children.length === 0) {
  addLog('💪 Welcome to Board-JEE QUEST!');
  addLog('🎮 Complete study blocks to gain XP');
  addLog('❤️ Protect your hearts - don\'t get distracted!');
  addLog('⏰ Use the 25-min timer to stay focused');
  addLog('💰 Earn tokens at day\'s end and spend guilt-free');
  addLog('🚀 Ready? Start your first block!');
}
