/* Чёрный ящик: если что-то упадёт, покажем ошибку прямо на экране.
   Тестировщица пришлёт скриншот — и мы увидим точный диагноз без гаданий */
window.addEventListener('error', (e) => {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;' +
        'background:#8b0000;color:#fff;padding:10px;border-radius:10px;' +
        'font-size:12px;font-family:monospace;';
    box.textContent = 'Ошибка: ' + e.message;
    document.body.appendChild(box);
});

/* ============================================================
1. НАСТРОЙКИ
============================================================ */

/* ============================================================
2. СОСТОЯНИЕ ИГРЫ
============================================================ */
let currentSize = '4x4';
let timerEnabled = true;
let soundEnabled = true;
let board = [];
let flipped = [];
let matchedCount = 0;
let moves = 0;
let lockBoard = false;
let timerInterval = null;
let seconds = 0;
let gameStarted = false;
let currentRecords = null;
let bestMoves = null;
let bestTime = null;
let gameId = 0;          // номер текущей партии (защита setTimeout'ов)

/* ============================================================
3. СОЗДАНИЕ ИГРОВОГО ПОЛЯ
============================================================ */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getRandomAvatars(count) {
    const all = [];
    for (let i = 1; i <= CONFIG.TOTAL_AVATARS; i++) all.push(i);
    return shuffle(all).slice(0, count);
}

function startGame() {
    gameId++;            // новая партия — новый номер, старые таймеры обезврежены
    flipped = [];
    matchedCount = 0;
    moves = 0;
    seconds = 0;
    lockBoard = false;
    gameStarted = false;
    document.getElementById('moves').textContent = '0';
    document.getElementById('time').textContent = '0';
    document.getElementById('win-screen').classList.remove('show');
    clearInterval(timerInterval);
    lockBoard = false;
    timerInterval = null;

    const { cols, rows } = CONFIG.SIZES[currentSize];
    const totalCells = cols * rows;
    const pairsCount = totalCells / 2;

    const avatars = getRandomAvatars(pairsCount);
    let cards = [];
    avatars.forEach(num => {
        cards.push(num);
        cards.push(num);
    });

    cards = shuffle(cards);

    const boardEl = document.getElementById('board');
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    boardEl.innerHTML = '';

    board = cards.map((avatarNum, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.avatar = avatarNum;
        card.dataset.index = index;

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) {
            card.style.animationDelay = (index * CONFIG.CARD_APPEAR_DELAY_MS / 1000) + 's';
        }

        card.innerHTML = `
            <div class="card-inner" style="transform-style: preserve-3d; transition: transform 0.8s;">
                <div class="card-face card-back" style="background-image: url('images/${currentCardBack}')"></div>
                <div class="card-face card-front">
                    <img src="images/card${String(avatarNum).padStart(2, '0')}.jpg" alt="avatar">
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onCardClick(card);
        }, { passive: false });

        boardEl.appendChild(card);
        return card;
    });
}

/* ============================================================
4. ЛОГИКА ИГРЫ
============================================================ */
function onCardClick(card) {
    if (lockBoard) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;

    if (!gameStarted) {
        gameStarted = true;
        if (timerEnabled) startTimer();
    }

    card.classList.add('flipped');
    card.querySelector('.card-inner').style.transform = 'rotateY(180deg)';
    playFlip();

    if (currentUser) {
        incrementFlips();
    }

    flipped.push(card);

    if (flipped.length === 2) {
        moves++;
        document.getElementById('moves').textContent = moves;
        checkMatch();
    }
}

// Телефон ли это? Браузер носит "паспорт" устройства (userAgent),
// а мы проверяем, есть ли в нём слова-маркеры мобильных
function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function checkMatch() {
    const [a, b] = flipped;
    const isMatch = a.dataset.avatar === b.dataset.avatar;
    const myGameId = gameId;

    if (isMatch) {
        playMatch();
        if (!isMobile()) {
            launchConfetti();
        }
        lockBoard = true;

        setTimeout(() => {
            if (myGameId !== gameId) return; // партия уже сменилась — отмена
            a.classList.add('matched');
            b.classList.add('matched');
            matchedCount++;
            flipped = [];
            lockBoard = false;

            if (matchedCount >= board.length / 2) {
                clearInterval(timerInterval);
                win();
            }
        }, CONFIG.DELAY_MATCH_MS);
    } else {
        playMiss();
        lockBoard = true;

        setTimeout(() => {
            if (myGameId !== gameId) return; // партия уже сменилась — отмена
            a.classList.remove('flipped');
            b.classList.remove('flipped');
            a.querySelector('.card-inner').style.transform = '';
            b.querySelector('.card-inner').style.transform = '';
            flipped = [];
            lockBoard = false;
        }, CONFIG.DELAY_MISMATCH_MS);
    }
}

function win() {
    clearInterval(timerInterval);
    lockBoard = false;
    flipped = [];
    playWin();

    const randomCat = Math.floor(Math.random() * CONFIG.TOTAL_CAT_GIFS) + 1;
    document.getElementById('win-gif').src = `images/cat${randomCat}.gif`;

    const isNewRecord = updateRecords(currentSize, moves, seconds);

    // Пишем партию в историю (для аналитики и достижений).
    // Не ждём ответа (fire-and-forget), чтобы не задерживать экран победы
    if (currentUser) {
        supabaseClient
            .from('games')
            .insert({
                user_id: currentUser.id,
                board_size: currentSize,
                moves: moves,
                seconds: seconds
            })
            .then(({ error }) => {
                if (error) console.log('Ошибка записи партии:', error);
            });
    }

    document.getElementById('final-moves').textContent = moves;
    document.getElementById('final-time').textContent = seconds;

    showRecords(currentSize);
    showNewRecordBanner(isNewRecord);

    setTimeout(() => {
        document.getElementById('win-screen').classList.add('show');
    }, CONFIG.WIN_SCREEN_DELAY_MS);
}

/* ============================================================
5. ТАЙМЕР
============================================================ */
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds++;
        document.getElementById('time').textContent = seconds;
    }, 1000);
}

/* ============================================================
6. КОНФЕТТИ
============================================================ */
function launchConfetti() {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const count = isMobile ? 10 : CONFIG.CONFETTI_COUNT;
    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.top = '-20px';
        piece.style.background = CONFIG.CONFETTI_COLORS[Math.floor(Math.random() * CONFIG.CONFETTI_COLORS.length)];
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

        const duration = 1.5 + Math.random() * 1.5;
        piece.style.animationDuration = duration + 's';
        piece.style.animationDelay = Math.random() * 0.3 + 's';

        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), (duration + 0.5) * 1000);
    }
}

/* ============================================================
7. КНОПКИ УПРАВЛЕНИЯ
============================================================ */
document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSize = btn.dataset.size;
        startGame();
    });
});

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker зарегистрирован'))
            .catch((err) => console.log('Service Worker не зарегистрирован:', err));
    });

    // Автоперезагрузка страницы, когда Service Worker обновился:
    // игрок не должен играть в устаревший код
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController) {
            window.location.reload();
        }
    });
}

// Таймер вкл/выкл
document.getElementById('timer-toggle').addEventListener('click', (e) => {
    timerEnabled = !timerEnabled;
    e.target.textContent = '⏱️';
    e.target.style.textDecoration = timerEnabled ? 'none' : 'line-through';
    e.target.style.opacity = timerEnabled ? '1' : '0.5';
    e.target.title = timerEnabled ? 'Таймер включён (нажми, чтобы выключить)' : 'Таймер выключен (нажми, чтобы включить)';

    const timerBox = document.getElementById('timer-box');
    if (timerEnabled) {
        timerBox.style.display = '';
        if (gameStarted && matchedCount < board.length / 2) startTimer();
    } else {
        timerBox.style.display = 'none';
        clearInterval(timerInterval);
    }
});

// Звук вкл/выкл
document.getElementById('sound-toggle').addEventListener('click', (e) => {
    soundEnabled = !soundEnabled;
    e.target.textContent = '🔊';
    e.target.style.textDecoration = soundEnabled ? 'none' : 'line-through';
    e.target.style.opacity = soundEnabled ? '1' : '0.5';
    e.target.title = soundEnabled ? 'Звук включён (нажми, чтобы выключить)' : 'Звук выключен (нажми, чтобы включить)';
});

// Смена темы
CONFIG.THEMES = ['theme-medium', 'theme-light', 'theme-dark'];
CONFIG.THEME_ICONS = {
    'theme-medium': '🌆',
    'theme-light': '☀️',
    'theme-dark': '🌙'
};

let currentThemeIndex = 0;
try {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    if (saved && CONFIG.THEMES.includes(saved)) {
        currentThemeIndex = CONFIG.THEMES.indexOf(saved);
    }
} catch (e) { }

function applyTheme() {
    document.body.classList.remove('theme-light', 'theme-medium', 'theme-dark');
    document.body.classList.add(CONFIG.THEMES[currentThemeIndex]);

    const btn = document.getElementById('theme-toggle');
    btn.textContent = CONFIG.THEME_ICONS[CONFIG.THEMES[currentThemeIndex]];
    btn.title = 'Тема: ' + CONFIG.THEMES[currentThemeIndex].replace('theme-', '');
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % CONFIG.THEMES.length;
    applyTheme();
    try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, CONFIG.THEMES[currentThemeIndex]);
    } catch (e) { }
});

// Смена рубашки
document.getElementById('card-back-btn').addEventListener('click', () => {
    let currentIndex = CONFIG.CARD_BACKS.indexOf(currentCardBack);
    currentIndex = (currentIndex + 1) % CONFIG.CARD_BACKS.length;
    currentCardBack = CONFIG.CARD_BACKS[currentIndex];
    localStorage.setItem(CONFIG.STORAGE_KEYS.CARD_BACK, currentCardBack);

    document.querySelectorAll('.card-back').forEach(el => {
        el.style.backgroundImage = `url('images/${currentCardBack}')`;
    });
});

applyTheme();

// Заново (в панели)
document.getElementById('restart-btn').addEventListener('click', startGame);

// Играть снова (на экране победы)
document.getElementById('play-again').addEventListener('click', startGame);

/* ============================================================
8. РЕЙТИНГ
============================================================ */
let ratingSize = '4x4';

function openRating() {
    document.getElementById('rating-screen').classList.add('show');
    loadRating(ratingSize);
}

function closeRating() {
    document.getElementById('rating-screen').classList.remove('show');
}

async function loadRating(size) {
    const list = document.getElementById('rating-list');
    list.innerHTML = '<div class="rating-loading">Загрузка...</div>';

    try {
        const { data, error } = await supabaseClient
            .from('records')
            .select('user_id, username, best_moves, best_time')
            .eq('board_size', size)
            .order('best_moves', { ascending: true })
            .limit(20);

        if (error) {
            list.innerHTML = '<div class="rating-loading">Ошибка загрузки</div>';
            console.log('Ошибка загрузки рейтинга:', error);
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = '<div class="rating-loading">Пока никто не играл в этом размере</div>';
            return;
        }

        const userIds = data.map((r) => r.user_id).filter(Boolean);
        const emojiByUser = {};
        if (userIds.length > 0) {
            const { data: profs } = await supabaseClient
                .from('profiles')
                .select('id, avatar_emoji')
                .in('id', userIds);
            (profs || []).forEach((p) => { emojiByUser[p.id] = p.avatar_emoji || '👤'; });
        }

        const myUsername = currentUser?.user_metadata?.username;

        list.innerHTML = data.map((row, index) => {
            const isMe = row.username === myUsername;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
            const emoji = emojiByUser[row.user_id] || '👤';

            return `
                <div class="rating-row ${isMe ? 'me' : ''} clickable" data-user-id="${row.user_id}">
                    <div class="rating-place">${medal}</div>
                    <div class="rating-name">${emoji} ${row.username}</div>
                    <div class="rating-score">
                        <div>Ходы: ${row.best_moves}</div>
                        ${row.best_time !== null ? `<div>Время: ${row.best_time} с</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        list.innerHTML = '<div class="rating-loading">Ошибка загрузки</div>';
        console.log('Ошибка:', e);
    }
}

document.getElementById('rating-btn').addEventListener('click', openRating);
document.getElementById('rating-close').addEventListener('click', closeRating);

document.querySelectorAll('.rating-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.rating-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        ratingSize = tab.dataset.size;
        loadRating(ratingSize);
    });
});

/* ============================================================
9. ЗАКРЫТИЕ ОКОН ПО ESC И КЛИКУ ВНЕ
============================================================ */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('win-screen').classList.remove('show');
        document.getElementById('auth-screen').classList.remove('show');
        document.getElementById('rating-screen').classList.remove('show');
    }
});

document.querySelectorAll('.win-screen, .auth-screen, .rating-screen').forEach(screen => {
    screen.addEventListener('click', (e) => {
        if (e.target === screen) {
            screen.classList.remove('show');
        }
    });
});

// Инициализация при загрузке
checkAuth();

// Текущая рубашка (из localStorage или первая)
let currentCardBack = 'card-back-1.jpg';
try {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.CARD_BACK);
    if (saved && CONFIG.CARD_BACKS.includes(saved)) {
        currentCardBack = saved;
    }
} catch (e) { }

// Запуск игры
startGame();