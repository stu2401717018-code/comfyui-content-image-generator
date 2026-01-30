# Task 3: Уеб приложение за подаване на параметри и визуализация на резултати

Това приложение предоставя потребителски интерфейс за подаване на параметри към workflow-а от Task 2, стартира генерации чрез ComfyUI API и визуализира резултатите.

---

## Изисквания

- **Node.js** (напр. 18+)
- **ComfyUI** стартиран локално с достъпен API (напр. `http://127.0.0.1:8000`)

**CORS:** В режим dev при подразбирания ComfyUI URL (`http://127.0.0.1:8000` или `http://localhost:8000`) приложението използва Vite proxy (`/comfyui` → ComfyUI), така че **CORS не е нужен**. При собствен URL или production стартирайте ComfyUI с CORS, напр. `python main.py --enable-cors` или `python main.py --enable-cors "*"`.

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

Интерфейсът е на английски. Основни стъпки:

1. **ComfyUI URL** – по подразбиране `http://127.0.0.1:8000`. При нужда въведете друг адрес. Натиснете **Test connection** за проверка; при успех се показва броят намерени checkpoints, при грешка – съобщение и връзка „Try to open ComfyUI url“.
2. **Checkpoint** – ако ComfyUI връща списък с checkpoints, се показва падащо меню; изберете желания модел.
3. **Positive prompt** и **Negative prompt** – какво да се вижда и какво да се изключи.
4. **Seed** (празно или „random“ за случайно), **Steps**, **CFG Scale**, **Size** (512×512, 768×768, 1024×1024), **Batch (Nr images)** (1–4).
5. Натиснете **Generate**. След приключване резултатите се показват в дясната панел; можете да ги преглеждате и да ги записвате от браузъра (десен бутон → Save image).

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
