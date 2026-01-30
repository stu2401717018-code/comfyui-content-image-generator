# comfyui-content-image-generator
Решение на заданията по "Визуално програмиране на генеративни модели с ComfyUI"

## Изисквания

Изтеглете:
- [stable-diffusion-v1-5/v1-5-pruned-emaonly.safetensors](https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/blob/main/v1-5-pruned-emaonly.safetensors) 
- [sd-vae-ft-mse-original/vae-ft-mse-840000-ema-pruned.safetensors](https://huggingface.co/stabilityai/sd-vae-ft-mse-original/blob/main/vae-ft-mse-840000-ema-pruned.safetensors)

## Съдържание

| Папка / файл | Описание |
|--------------|----------|
| **[docs/](docs/)** | Task 1: [Спецификация](docs/SPECIFICATION.md), [Wireframe описание](docs/WIREFRAME.md) |
| **[workflow/](workflow/)** | Task 2: [Workflow README](workflow/README.md), [Модели](workflow/MODELS.md) |
| **[app/](app/)** | Task 3: [Уеб приложение](app/README.md) |
| **assets/** | Wireframe изображение (основен екран) |

---

## Task 1 – Спецификация

- [**docs/SPECIFICATION.md**](docs/SPECIFICATION.md) – описание на проблема, целева аудитория, user stories, входове/изходи, параметри, ограничения и рискове, критерии за приемане.
- [**docs/WIREFRAME.md**](docs/WIREFRAME.md) – описание на основния екран и поток.
- **assets/wireframe-main-screen.png** – екранен прототип (wireframe) на основния екран.

---

## Task 2 – ComfyUI Workflow

- [**workflow/README.md**](workflow/README.md) – как се стартира workflow-ът, параметри, запис на резултати, batch.
- [**workflow/MODELS.md**](workflow/MODELS.md) – модели/ресурси (наименования, папки) – без качване на тежки файлове.
- **workflow/workflow_api_prompt.example.json** – пример за API prompt за ComfyUI `/prompt` endpoint (използва се от уеб приложението).
- **workflow/workflow_full.json** – пълен workflow за импорт в ComfyUI (опционално; при нужда създайте workflow върху веригата от README).

---

## Task 3 – Уеб приложение

- **app/** – React + Vite приложение с форма за параметри и визуализация на резултатите.
- Стартиране: `cd app && npm install && npm run dev`.
- Изисква ComfyUI да работи с разрешен CORS (напр. `python main.py --enable-cors`).

Подробности в [**app/README.md**](app/README.md).

---

## Бърз старт

1. Инсталирайте и стартирайте ComfyUI с един checkpoint (вижте [workflow/MODELS.md](workflow/MODELS.md)).
2. Стартирайте ComfyUI с `--enable-cors`.
3. В `app/` изпълнете `npm install` и `npm run dev`.
4. Отворете уеб приложението, въведете ComfyUI адрес, попълнете промпт и параметри и натиснете „Генерирай“.
