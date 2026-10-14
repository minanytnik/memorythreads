/* ============================================================
   9. РЕКОРДЫ (localStorage)
   ============================================================ */

// Ключ для хранения рекордов (один на все размеры)
const RECORDS_KEY = 'memory-records';

// Прочитать все рекорды из localStorage
function loadRecords() {
    try {
        const raw = localStorage.getItem(RECORDS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

// Сохранить все рекорды в localStorage
function saveRecords(records) {
    try {
        localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    } catch (e) { }
}

// Получить рекорды для конкретного размера поля
function getRecordsForSize(size) {
    const all = loadRecords();
    return all[size] || { bestMoves: null, bestTime: null };
}

// Обновить рекорды после победы. Возвращает true, если побит хоть один рекорд.
function updateRecords(size, moves, time) {
    const all = loadRecords();
    const current = all[size] || { bestMoves: null, bestTime: null };
    let isNewRecord = false;

    if (current.bestMoves === null || moves < current.bestMoves) {
        current.bestMoves = moves;
        isNewRecord = true;
    }

    if (timerEnabled) {
        if (current.bestTime === null || time < current.bestTime) {
            current.bestTime = time;
            isNewRecord = true;
        }
    }

    all[size] = current;
    saveRecords(all);

    // Если игрок залогинен — сохраняем в Supabase
    if (currentUser) {
        saveRecordToSupabase(size, current.bestMoves, current.bestTime);
    }

    return isNewRecord;
}

// Показать рекорды на экране победы
function showRecords(size) {
    const rec = getRecordsForSize(size);
    document.getElementById('record-moves').textContent =
        rec.bestMoves !== null ? rec.bestMoves : '—';
    document.getElementById('record-time').textContent =
        rec.bestTime !== null ? rec.bestTime + ' с' : '—';
}

// Показать/скрыть плашку "Новый рекорд"
function showNewRecordBanner(show) {
    const el = document.getElementById('new-record');
    if (show) {
        el.classList.add('show');
    } else {
        el.classList.remove('show');
    }
}