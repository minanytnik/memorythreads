/* ============================================================
ДОСТИЖЕНИЯ
============================================================ */

// Список всех достижений с условиями
const ACHIEVEMENTS = {
    first_game:      { emoji: '🎮', name: 'Первый ход',         check: (stats) => stats.totalGames >= 1 },
    ten_games:       { emoji: '🔥', name: 'Разогрев',           check: (stats) => stats.totalGames >= 10 },
    fifty_games:     { emoji: '💪', name: 'Марафонец',          check: (stats) => stats.totalGames >= 50 },
    hundred_flips:   { emoji: '🔄', name: 'Первые перевороты',  check: (stats) => stats.totalFlips >= 100 },
    thousand_flips:  { emoji: '🌀', name: 'Вихрь',              check: (stats) => stats.totalFlips >= 1000 },
    all_sizes:       { emoji: '🔎', name: 'Исследователь',      check: (stats) => stats.sizesPlayed.has('4x4') && stats.sizesPlayed.has('4x5') && stats.sizesPlayed.has('6x6') },
    sprinter_4x4:    { emoji: '⚡', name: 'Спринтер',           check: (stats) => stats.bestTime4x4 !== null && stats.bestTime4x4 < 30 },
    perfect_4x4:     { emoji: '🎯', name: 'Снайпер',            check: (stats) => stats.bestMoves4x4 === 8 },
    master_6x6:      { emoji: '🧠', name: 'Мастер 6×6',         check: (stats) => stats.games6x6 >= 1 },
    no_mistakes:     { emoji: '💎', name: 'Безошибочный',       check: (stats) => stats.lastGamePerfect },
    first_4x5:       { emoji: '🎲', name: 'Новый формат',       check: (stats) => stats.games4x5 >= 1 },
    speed_demon:     { emoji: '🚀', name: 'Скоростной демон',   check: (stats) => stats.bestTimeAny !== null && stats.bestTimeAny < 20 }
};

// Проверить и выдать достижения после партии
async function checkAndUnlockAchievements(stats) {
    if (!currentUser) return;

    const newlyUnlocked = [];

    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (achievement.check(stats)) {
            // Проверяем, не получено ли уже
            const { data: existing } = await supabaseClient
                .from('achievements')
                .select('id')
                .eq('user_id', currentUser.id)
                .eq('achievement_key', key)
                .maybeSingle();

            if (!existing) {
                // Выдаём достижение
                const { error } = await supabaseClient
                    .from('achievements')
                    .insert({
                        user_id: currentUser.id,
                        achievement_key: key
                    });

                if (!error) {
                    newlyUnlocked.push(achievement);
                }
            }
        }
    }

    // Показываем уведомления о новых достижениях
    if (newlyUnlocked.length > 0) {
        showAchievementNotifications(newlyUnlocked);
    }
}

// Показать всплывающие уведомления о достижениях
function showAchievementNotifications(achievements) {
    achievements.forEach((achievement, index) => {
        setTimeout(() => {
            const notif = document.createElement('div');
            notif.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 12px;
                font-size: 16px;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            notif.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 5px;">${achievement.emoji}</div>
                <div style="font-weight: bold;">Достижение разблокировано!</div>
                <div>${achievement.name}</div>
            `;
            document.body.appendChild(notif);

            setTimeout(() => {
                notif.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notif.remove(), 300);
            }, 3000);
        }, index * 500); // Каждое следующее через 0.5 сек
    });
}

// Собрать статистику для проверки достижений
async function getAchievementStats() {
    if (!currentUser) return null;

    try {
        // Загружаем профиль (для total_flips)
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('total_flips')
            .eq('id', currentUser.id)
            .maybeSingle();

        // Загружаем все партии
        const { data: games } = await supabaseClient
            .from('games')
            .select('board_size, moves, seconds')
            .eq('user_id', currentUser.id);

        if (!games || games.length === 0) {
            return {
                totalGames: 0,
                totalFlips: profile?.total_flips || 0,
                sizesPlayed: new Set(),
                bestTime4x4: null,
                bestMoves4x4: null,
                games6x6: 0,
                lastGamePerfect: false
            };
        }

        const totalGames = games.length;
        const totalFlips = profile?.total_flips || 0;
        const sizesPlayed = new Set(games.map(g => g.board_size));

        const games4x4 = games.filter(g => g.board_size === '4x4');
        const bestTime4x4 = games4x4.length > 0 ? Math.min(...games4x4.map(g => g.seconds)) : null;
        const bestMoves4x4 = games4x4.length > 0 ? Math.min(...games4x4.map(g => g.moves)) : null;

        const games6x6 = games.filter(g => g.board_size === '6x6').length;

        const games4x5 = games.filter(g => g.board_size === '4x5').length;
        const bestTimeAny = games.length > 0 ? Math.min(...games.map(g => g.seconds)) : null;

        // Проверяем последнюю партию: была ли без ошибок
        const lastGame = games[games.length - 1];
        const lastGamePairs = CONFIG.SIZES[lastGame.board_size].cols * CONFIG.SIZES[lastGame.board_size].rows / 2;
        const lastGamePerfect = lastGame.moves === lastGamePairs;

        return {
            totalGames,
            totalFlips,
            sizesPlayed,
            bestTime4x4,
            bestMoves4x4,
            games6x6,
            games4x5,
            bestTimeAny,
            lastGamePerfect
        };
    } catch (e) {
        console.log('Ошибка сбора статистики для достижений:', e);
        return null;
    }
}

// Загрузить и показать достижения в профиле
async function loadAchievements() {
    if (!currentUser) return;

    const list = document.getElementById('achievements-list');
    if (!list) return;

    // Загружаем полученные достижения
    const { data: unlocked } = await supabaseClient
        .from('achievements')
        .select('achievement_key')
        .eq('user_id', currentUser.id);

    const unlockedKeys = new Set((unlocked || []).map(a => a.achievement_key));

    // Показываем все достижения (полученные и заблокированные)
    list.innerHTML = Object.entries(ACHIEVEMENTS).map(([key, achievement]) => {
        const isUnlocked = unlockedKeys.has(key);
        return `
            <div class="achievement-item ${isUnlocked ? '' : 'locked'}" title="${achievement.name}">
                <div>${achievement.emoji}</div>
                <div class="achievement-name">${isUnlocked ? achievement.name : '???'}</div>
            </div>
        `;
    }).join('');
}