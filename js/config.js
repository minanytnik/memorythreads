/* ============================================================
КОНФИГУРАЦИЯ ИГРЫ
Все настройки — в одном месте!
============================================================ */

const CONFIG = {
    // Количество аватарок в папке images/ (файлы 1.jpg ... 34.jpg)
    TOTAL_AVATARS: 34,

    // Количество гифок с котами (cat1.gif ... cat27.gif)
    TOTAL_CAT_GIFS: 27,

    // Задержки в миллисекундах
    DELAY_MATCH_MS: 600,        // Сколько показывать совпавшую пару
    DELAY_MISMATCH_MS: 1800,    // Сколько показывать несовпавшие карты

    // Конфетти
    CONFETTI_COUNT: 30,
    CONFETTI_COLORS: ['#ffd93d', '#ff6b6b', '#6bcbff', '#a66bff', '#6bff9e', '#ff9e6b'],

    // Размеры поля
    SIZES: {
        '4x4': { cols: 4, rows: 4 },
        '4x5': { cols: 4, rows: 5 },
        '6x6': { cols: 6, rows: 6 }
    },

    // Доступные рубашки карт
    CARD_BACKS: [
        'card-back-1.jpg', // пёстрая
        'card-back-2.png', // светлая
        'card-back-3.png'  // тёмная
    ],
    DEFAULT_CARD_BACK: 'card-back-1.jpg',

    // Темы
    THEMES: ['theme-medium', 'theme-light', 'theme-dark'],
    DEFAULT_THEME: 'theme-medium',
    THEME_ICONS: {
        'theme-medium': '🌆',
        'theme-light': '☀️',
        'theme-dark': '🌙'
    },

    // Ключи для localStorage
    STORAGE_KEYS: {
        THEME: 'memory-theme',
        CARD_BACK: 'memory-card-back',
        RECORDS: 'memory-records'
    },

    // Анимация появления карт
    CARD_APPEAR_DELAY_MS: 50,  // Задержка между появлением карт (0.05s)

    // Задержка перед показом экрана победы
    WIN_SCREEN_DELAY_MS: 500
};