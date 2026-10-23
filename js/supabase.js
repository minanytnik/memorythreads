// Настройки Supabase
const SUPABASE_URL = 'https://yquwdsmpewtiwrqzavok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdXdkc21wZXd0aXdycXphdm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NDM3ODgsImV4cCI6MjEwNzMxOTc4OH0.Ds5kI3ix-ey4aUUbqSm23or25Fg4OGqHgG9yJrJQ6gw';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Сохранить рекорд в Supabase
async function saveRecordToSupabase(size, moves, time) {
    try {
        const username = currentUser.user_metadata?.username || 'Игрок';
        const userId = currentUser.id;

        // Проверяем, есть ли уже запись для этого игрока + размера
        const { data: existing, error: selectError } = await supabaseClient
            .from('records')
            .select('*')
            .eq('user_id', userId)
            .eq('board_size', size)
            .maybeSingle();

        if (selectError) {
            console.log('Ошибка проверки рекорда:', selectError);
            return;
        }

        if (existing) {
            // Запись есть — обновляем, если результат лучше
            const updateData = {};
            if (moves < existing.best_moves) updateData.best_moves = moves;
            if (time !== null && (existing.best_time === null || time < existing.best_time)) {
                updateData.best_time = time;
            }

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabaseClient
                    .from('records')
                    .update(updateData)
                    .eq('id', existing.id);

                if (updateError) {
                    console.log('Ошибка обновления рекорда:', updateError);
                } else {
                    console.log('Рекорд обновлён в Supabase');
                }
            }
        } else {
            // Записи нет — создаём
            const { error: insertError } = await supabaseClient
                .from('records')
                .insert({
                    user_id: userId,
                    username: username,
                    board_size: size,
                    best_moves: moves,
                    best_time: time
                });

            if (insertError) {
                console.log('Ошибка создания рекорда:', insertError);
            } else {
                console.log('Рекорд создан в Supabase');
            }
        }
    } catch (e) {
        console.log('Ошибка сохранения рекорда:', e);
    }
}

/* ============================================================
   SUPABASE — РЕГИСТРАЦИЯ И ВХОД
   ============================================================ */

let currentUser = null;       // Текущий залогиненный пользователь
let authMode = 'login';       // 'login' или 'register'

// Проверяем, залогинен ли кто-то при загрузке
async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            updateLoginButton();
        }
    } catch (e) {
        console.log('Ошибка проверки авторизации:', e);
    }
}

// Обновить иконку кнопки входа
function updateLoginButton() {
    const btn = document.getElementById('login-btn');
    if (currentUser) {
        const username = currentUser.user_metadata?.username || 'Игрок';
        btn.textContent = '👤';
        btn.title = `Вы вошли как ${username} (нажмите, чтобы выйти)`;
        btn.style.opacity = '1';
    } else {
        btn.textContent = '👤';
        btn.title = 'Войти или зарегистрироваться';
        btn.style.opacity = '0.6';
    }
}

// Открыть окно входа
function openAuth(mode = 'login') {
    authMode = mode;
    document.getElementById('auth-title').textContent = mode === 'login' ? 'Вход' : 'Регистрация';
    document.getElementById('auth-submit').textContent = mode === 'login' ? 'Войти' : 'Зарегистрироваться';
    document.getElementById('auth-switch').textContent = mode === 'login'
        ? 'Нет аккаунта? Зарегистрироваться'
        : 'Уже есть аккаунт? Войти';
    document.getElementById('auth-error').textContent = '';
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-screen').classList.add('show');
}

// Закрыть окно входа
function closeAuth() {
    document.getElementById('auth-screen').classList.remove('show');
}

// Показать ошибку
function showAuthError(msg) {
    document.getElementById('auth-error').textContent = msg;
}

// Регистрация
async function registerUser(username, password) {
    try {
        const email = `${username.toLowerCase()}@memorythreads.local`;

        // 1. Создаём аккаунт
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { username: username }
            }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                showAuthError('Это имя уже занято. Выбери другое.');
            } else {
                showAuthError('Ошибка: ' + error.message);
            }
            return;
        }

        // 2. СРАЗУ логинимся (чтобы получить сессию)
        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (loginError) {
            showAuthError('Ошибка входа после регистрации: ' + loginError.message);
            return;
        }

        // 3. Теперь создаём профиль (мы залогинены, RLS пропустит)
        const userId = loginData.user.id;
        const { error: profileError } = await supabaseClient.from('profiles').insert({
            id: userId,
            username: username
        });

        if (profileError) {
            console.log('Ошибка создания профиля:', profileError);
        } else {
            console.log('Профиль создан успешно');
        }

        currentUser = loginData.user;
        updateLoginButton();
        closeAuth();

    } catch (e) {
        showAuthError('Ошибка: ' + e.message);
    }
}

// Вход
async function loginUser(username, password) {
    try {
        const email = `${username.toLowerCase()}@memorythreads.local`;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            showAuthError('Неверное имя или пароль');
            return;
        }

        currentUser = data.user;
        updateLoginButton();
        closeAuth();
    } catch (e) {
        showAuthError('Ошибка: ' + e.message);
    }
}

// Выход
async function logoutUser() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    updateLoginButton();
}

// Обработчики кнопок
document.getElementById('login-btn').addEventListener('click', () => {
    if (currentUser) {
        openProfile();
    } else {
        openAuth('login');
    }
});

document.getElementById('auth-submit').addEventListener('click', () => {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;

    if (!username || username.length < 2) {
        showAuthError('Введи имя (минимум 2 символа)');
        return;
    }
    if (!password || password.length < 6) {
        showAuthError('Пароль должен быть минимум 6 символов');
        return;
    }

    if (authMode === 'login') {
        loginUser(username, password);
    } else {
        registerUser(username, password);
    }
});

document.getElementById('auth-switch').addEventListener('click', () => {
    openAuth(authMode === 'login' ? 'register' : 'login');
});

document.getElementById('auth-cancel').addEventListener('click', closeAuth);

/* ============================================================
   ПРОФИЛЬ ИГРОКА
   ============================================================ */

// Открыть окно профиля
async function openProfile() {
    document.getElementById('profile-screen').classList.add('show');

    // Заполняем имя и дату
    const username = currentUser.user_metadata?.username || 'Игрок';
    document.getElementById('profile-username').textContent = username;

    const createdAt = new Date(currentUser.created_at);
    const dateStr = createdAt.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('profile-date').textContent = 'С нами с ' + dateStr;

    // Загружаем статистику
    await loadProfileStats();
}

// Закрыть окно профиля
function closeProfile() {
    document.getElementById('profile-screen').classList.remove('show');
}

// Загрузить статистику профиля из Supabase
async function loadProfileStats() {
    try {
        // Загружаем профиль (счётчик переворотов)
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('total_flips')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (profileError) {
            console.log('Ошибка загрузки профиля:', profileError);
        } else if (profile) {
            document.getElementById('profile-flips').textContent = profile.total_flips || 0;
        }

        // Загружаем рекорды
        const { data: records, error: recordsError } = await supabaseClient
            .from('records')
            .select('board_size, best_moves, best_time')
            .eq('user_id', currentUser.id);

        if (recordsError) {
            console.log('Ошибка загрузки рекордов:', recordsError);
            return;
        }

        // Заполняем по размерам
        ['4x4', '4x5', '6x6'].forEach(size => {
            const rec = records?.find(r => r.board_size === size);
            const el = document.getElementById('profile-' + size);
            if (rec) {
                el.textContent = `${rec.best_moves} ходов` +
                    (rec.best_time !== null ? ` / ${rec.best_time} с` : '');
            } else {
                el.textContent = '—';
            }
        });

    } catch (e) {
        console.log('Ошибка загрузки статистики:', e);
    }
}

// Обновить счётчик переворотов в Supabase
async function incrementFlips() {
    if (!currentUser) return;

    try {
        // Получаем текущее значение
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('total_flips')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (profile) {
            const newValue = (profile.total_flips || 0) + 1;
            await supabaseClient
                .from('profiles')
                .update({ total_flips: newValue })
                .eq('id', currentUser.id);
        }
    } catch (e) {
        console.log('Ошибка обновления счётчика:', e);
    }
}

// Обработчики кнопок профиля
document.getElementById('profile-close').addEventListener('click', closeProfile);
document.getElementById('profile-logout').addEventListener('click', () => {
    closeProfile();
    logoutUser();
});