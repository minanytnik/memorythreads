# sync_www.py — обновляет папку www из корня проекта.
# Запускай ТОЛЬКО перед сборкой APK: Capacitor берёт файлы из www.
import os
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(ROOT, "www")

FILES = ["index.html", "styles.css", "sw.js", "manifest.json"]
DIRS = ["js", "images"]

os.makedirs(WWW, exist_ok=True)

# 1. Убираем из www всё устаревшее, чего больше нет в проекте
for item in os.listdir(WWW):
    if item not in FILES and item not in DIRS:
        path = os.path.join(WWW, item)
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)
        print(f"  убрали устаревшее: www/{item}")

# 2. Копируем файлы
for f in FILES:
    src = os.path.join(ROOT, f)
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(WWW, f))
        print(f"  {f} -> www/{f}")
    else:
        print(f"  ! файл не найден в корне: {f}")

# 3. Копируем папки свежими копиями
for d in DIRS:
    src = os.path.join(ROOT, d)
    dst = os.path.join(WWW, d)
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    print(f"  {d}/ -> www/{d}/")

print("\nwww обновлена!")
print("Следующий шаг для APK: npx cap sync android")