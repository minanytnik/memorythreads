# update_avatars.py
# Автоматически обрабатывает фотки от народа и кладёт их в игру

from PIL import Image          # библиотека для работы с картинками (Pillow)
import os                      # для работы с папками и файлами

# --- Пути к папкам ---
SOURCE_DIR = r"F:\Vibecoding_by_minanytnik\avatars-source"   # сюда ты сваливаешь всё от народа
IMAGES_DIR = r"C:\projects\memorythreads\images"             # сюда кладём готовые card01.jpg...
CONFIG_PATH = r"C:\projects\memorythreads\js\config.js"         # файл с количеством аватарок

# Создаём папки, если их ещё нет (exist_ok=True — «не ругайся, если уже есть»)
os.makedirs(SOURCE_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

# --- Настройки обработки ---
SIZE = 400        # итоговый размер картинки (400x400)
QUALITY = 85      # качество JPEG (85 — хорошее, файл лёгкий)

def make_square(img):
    """Обрезает картинку в квадрат по центру."""
    w, h = img.size                      # ширина и высота исходной картинки
    side = min(w, h)                     # сторона будущего квадрата = меньшая из сторон
    left = (w - side) // 2               # отступ слева, чтобы квадрат был по центру
    top = (h - side) // 2                # отступ сверху
    return img.crop((left, top, left + side, top + side))   # вырезаем квадрат

# --- Собираем все картинки в папке-источнике ---
files = sorted(os.listdir(SOURCE_DIR))   # список всех файлов в папке
pictures = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png'))]  # только картинки

print(f"Нашёл {len(pictures)} картинок. Обрабатываю...")

if not pictures:
    print("Папка avatars-source пустая — обрабатывать нечего.")
    print("Закинь фотки и запусти скрипт ещё раз!")
    raise SystemExit

# --- Обрабатываем каждую и сохраняем под новым именем ---
for i, filename in enumerate(pictures, start=1):
    path = os.path.join(SOURCE_DIR, filename)      # полный путь к исходной картинке
    img = Image.open(path)                          # открываем картинку
    img = make_square(img)                          # обрезаем в квадрат
    img = img.resize((SIZE, SIZE), Image.LANCZOS)   # сжимаем до 400x400 (LANCZOS — качественно)

    new_name = f"card{i:02d}.jpg"                   # card01.jpg, card02.jpg... (:02d = две цифры с нулём)
    out_path = os.path.join(IMAGES_DIR, new_name)   # полный путь для сохранения
    img.save(out_path, "JPEG", quality=QUALITY)     # сохраняем как JPEG

    print(f"  {filename} -> {new_name}")

print(f"Готово! Обработал {len(pictures)} картинок.")

# --- Обновляем config.js: записываем новое количество аватарок ---
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    config_text = f.read()                           # читаем весь файл как текст

lines = config_text.split("\n")                      # разбиваем файл на строки
for i, line in enumerate(lines):
    stripped = line.strip()                                    # убираем пробелы слева
    if stripped.startswith("TOTAL_AVATARS:"):                  # ищем "TOTAL_AVATARS:"
        indent = line[:len(line) - len(line.lstrip())]         # сохраняем отступ
        lines[i] = f"{indent}TOTAL_AVATARS: {len(pictures)},"  # пишем с тем же отступом
        break

with open(CONFIG_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))                        # записываем обратно

print(f"config.js обновлён: TOTAL_AVATARS = {len(pictures)}")