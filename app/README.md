# Task 3: Уеб приложение за подаване на параметри и визуализация на резултати

Това приложение предоставя потребителски интерфейс за подаване на параметри към workflow-а от Task 2, стартира генерации чрез ComfyUI API и визуализира резултатите.

---

## Изисквания

- **Node.js** (напр. 18+)
- **ComfyUI** стартиран локално с достъпен API (напр. `http://127.0.0.1:8000`)
- За да приложението да може да извиква ComfyUI от браузъра, стартирайте ComfyUI с **CORS** разрешен, напр.:
  ```bash
  python main.py --enable-cors
  ```
  или с конкретен origin:
  ```bash
  python main.py --enable-cors "*"
  ```

---

## Стартиране

```bash
cd app
npm install
npm run dev
```

Отворете в браузър адреса, показан от Vite (напр. `http://localhost:5173`).

---

## Използване

1. В полето **ComfyUI адрес** въведете адреса на вашия ComfyUI сървър (по подразбиране `http://127.0.0.1:8000`).
2. Попълнете **Positive prompt** (какво да се вижда в изображението) и по избор **Negative prompt** (какво да се изключи).
3. Настройте **Seed** (празно или „random“ за случайно), **Steps**, **CFG Scale**, **Размер** (512×512, 768×768, 1024×1024) и **Batch** (1–4 изображения).
4. Натиснете **Генерирай**.
5. След приключване резултатите се показват в дясната панел; можете да ги преглеждате и да ги записвате от браузъра (десен бутон → Save image).

---

## Съответствие със спецификацията (Task 1)

- **Входове:** positive/negative prompt, seed, steps, CFG, размер, batch – всички са достъпни в UI.
- **Изходи:** генерираните изображения се визуализират в интерфейса.
- **Параметри за контрол:** seed, steps, CFG, размер, batch – съответстват на изискванията от Task 1 и Task 2.

Приложението изпраща към ComfyUI workflow в API формат (същият като в `workflow/workflow_api_prompt.example.json`), като подставя стойностите от формата.

---

## Checkpoint / "ckpt_name not in []"

If ComfyUI returns **"ckpt_name not in []"**, it means it does not see any checkpoints. Fix:

1. **Put the `.safetensors` file directly in the checkpoints folder**, not in a subfolder.  
   ComfyUI usually lists only files in `models/checkpoints/`.  
   - ✅ `...\models\checkpoints\v1-5-pruned-emaonly.safetensors`  
   - ❌ `...\models\checkpoints\SD1.5\v1-5-pruned-emaonly.safetensors`  
   For ComfyUI Desktop (AppData): use `...\ComfyUI\models\checkpoints\` (no `SD1.5` subfolder).

2. **Restart ComfyUI** after adding or moving the file so it rescans the folder.

3. The app now **loads the list of checkpoints from ComfyUI** and shows a **Checkpoint** dropdown. Use the one that appears there; if the list is empty, fix the path as above.
