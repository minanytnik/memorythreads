/* ============================================================
           ЗВУКИ (синтезированные через Web Audio API)
           ============================================================ */

let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.15) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) { }
}

/* 💧 Капля в ведро при перевороте карточки */
function playFlip() {
    if (!soundEnabled) return;

    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;

        // Основной "бульк" — низкий, как в ведро
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);                     // старт — ниже, чем раньше
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.18); // глубокое падение

        // Громкость — тише, чем было
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.008);        // пик тише
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);  // длинное затухание

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.23);

        // "Эхо" — как будто в ведре отражается
        const echo = ctx.createOscillator();
        echo.type = 'sine';
        echo.frequency.setValueAtTime(500, now + 0.05);
        echo.frequency.exponentialRampToValueAtTime(120, now + 0.25);

        const echoGain = ctx.createGain();
        echoGain.gain.setValueAtTime(0, now + 0.05);
        echoGain.gain.linearRampToValueAtTime(0.04, now + 0.08);
        echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        echo.connect(echoGain);
        echoGain.connect(ctx.destination);

        echo.start(now + 0.05);
        echo.stop(now + 0.3);

    } catch (e) { }
}

function playMatch() {
    playTone(800, 0.1, 'sine', 0.15);
    setTimeout(() => playTone(1000, 0.15, 'sine', 0.15), 80);
}

/* 🎴 Шорох при несовпадении карточек */
function playMiss() {
    if (!soundEnabled) return;

    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;

        // Буфер с белым шумом
        const duration = 0.25;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // Источник
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Фильтр — «шуршащий» диапазон
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2200;
        filter.Q.value = 0.6;

        // Громкость — плавно нарастает и затухает
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + duration);

    } catch (e) { }
}

/* ============================================================
ЗВУКИ ПОБЕДЫ — 5 разных, играют рандомно
============================================================ */

// 1. 🎺 Фанфары — классические победные
function playWinFanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
        setTimeout(() => playTone(n, 0.25, 'square', 0.12), i * 120);
    });
    setTimeout(() => playTone(1047, 0.5, 'square', 0.15), 600);
}

// 2. 🎉 Весёлая мелодия — быстрая, игривая
function playWinHappy() {
    const notes = [659, 784, 880, 988, 1047, 988, 1047];
    notes.forEach((n, i) => {
        setTimeout(() => playTone(n, 0.15, 'triangle', 0.13), i * 90);
    });
}

// 3. 🌟 Нежная — медленная, мягкая
function playWinSoft() {
    const notes = [523, 659, 784, 988, 1047];
    notes.forEach((n, i) => {
        setTimeout(() => playTone(n, 0.5, 'sine', 0.1), i * 200);
    });
}

// 4. 🚀 Эпичная — низкая, нарастающая
function playWinEpic() {
    const notes = [262, 330, 392, 523, 659, 784];
    notes.forEach((n, i) => {
        setTimeout(() => playTone(n, 0.3, 'sawtooth', 0.08 + i * 0.015), i * 130);
    });
    setTimeout(() => {
        playTone(1047, 0.7, 'sine', 0.18);
        playTone(1319, 0.7, 'sine', 0.12);
    }, 850);
}

// 5. 🎈 Забавная — скачущая, с паузами
function playWinFunny() {
    const pattern = [
        { f: 784, t: 0 },
        { f: 988, t: 100 },
        { f: 784, t: 200 },
        { f: 1047, t: 350 },
        { f: 880, t: 500 },
        { f: 1047, t: 650 },
        { f: 1319, t: 800 }
    ];
    pattern.forEach(p => {
        setTimeout(() => playTone(p.f, 0.15, 'triangle', 0.13), p.t);
    });
}

// Все звуки победы в одном массиве
const WIN_SOUNDS = [
    playWinFanfare,
    playWinHappy,
    playWinSoft,
    playWinEpic,
    playWinFunny
];

// Проиграть случайный звук победы
function playWin() {
    if (!soundEnabled) return;
    const randomIndex = Math.floor(Math.random() * WIN_SOUNDS.length);
    WIN_SOUNDS[randomIndex]();
}

/* Разблокировка звука на iOS: AudioContext стартует "спящим"
   и просыпает только после жеста пользователя */
function unlockAudio() {
    try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
    } catch (e) { }
}
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchend', unlockAudio, { once: true });