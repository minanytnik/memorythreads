const CONFIG = {
    TOTAL_AVATARS: 56,
    TOTAL_CAT_GIFS: 27,
    DELAY_MATCH_MS: 600,
    DELAY_MISMATCH_MS: 1800,
    CONFETTI_COUNT: 30,
    CONFETTI_COLORS: ['#ffd93d', '#ff6b6b', '#6bcbff', '#a66bff', '#6bff9e', '#ff9e6b'],
    SIZES: {
        '4x4': { cols: 4, rows: 4 },
        '4x5': { cols: 4, rows: 5 },
        '6x6': { cols: 6, rows: 6 },
        '2x3': { cols: 3, rows: 2 }
    },
    CARD_BACKS: [
        'card-back-1.jpg',
        'card-back-2.png',
        'card-back-3.png'
    ],
    DEFAULT_CARD_BACK: 'card-back-1.jpg',
    THEMES: ['theme-medium', 'theme-light', 'theme-dark'],
    DEFAULT_THEME: 'theme-medium',
    THEME_ICONS: {
        'theme-medium': '🌆',
        'theme-light': '☀️',
        'theme-dark': '🌙'
    },
    STORAGE_KEYS: {
        THEME: 'memory-theme',
        CARD_BACK: 'memory-card-back',
        RECORDS: 'memory-records'
    },
    CARD_APPEAR_DELAY_MS: 50,
    WIN_SCREEN_DELAY_MS: 500,
    EMOJI_AVATARS: ['🐱', '🐶', '🐰', '', '🐸', '🦄', '🐯', '🦋', '🐢', '🐙', '', '🐬', '🎃', '🌻', '⭐', '🔥', '🍀', '🎈', '🎮', '🎧', '', '🍕', '☕', '🌙']
};