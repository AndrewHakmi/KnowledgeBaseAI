# KnowledgeBaseAI — Руководство разработчика

## 1. Обзор
- Назначение: единый граф знаний (Neo4j) + веб‑интерфейс + API для синхронизации, аналитики и персонализированных дорожных карт.
- Технологии: Neo4j, Flask (UI/сервисное API), FastAPI (персонализация/тестирование), Cytoscape (визуализация), Traefik (маршрутизация/TLS), Docker Compose.
- Ключевые возможности: синхронизация из JSONL, построение графа, аналитика качества, персональные веса и маршрутизация, Swagger для обоих API.

## 2. Архитектура
- Слой данных: Neo4j (узлы/связи, индексы/констрейнты).
- Сервисный слой: `neo4j_repo.py` (единый доступ с транзакциями и ретраями).
- Доменные функции: `neo4j_utils.py` (синхронизация, аналитика, построение графа, персонализация).
- Веб‑слои:
  - Flask: UI, служебные операции, списки/детали, визуализация.
  - FastAPI: персональные операции (тесты, веса, дорожные карты), Swagger.
- Развёртывание: Traefik (HTTP/HTTPS), Dockerfile’ы для Flask/FastAPI, `docker-compose.yml`.

## 3. Модель графа
- Узлы: Subject, Section, Topic, Skill, Method, Goal, Objective, User.
- Связи:
  - Subject → Section (`CONTAINS`)
  - Section → Topic (`CONTAINS`)
  - Subject → Skill (`HAS_SKILL`)
  - Skill → Method (`LINKED` с `weight`, `confidence`, `adaptive_weight`)
  - Topic → (Goal|Objective) (`TARGETS`)
  - Topic → Topic (`PREREQ`)
  - User → Topic (`PROGRESS_TOPIC`)
  - User → Skill (`PROGRESS_SKILL`)
  - User → (Topic|Skill) (`COMPLETED` c метриками)
- Веса:
  - `static_weight`: эвристика от текста/терминов; инициализирует `dynamic_weight` при отсутствии.
  - `dynamic_weight`: глобально на узле; пользовательский — на `PROGRESS_*`.
  - `adaptive_weight`: на `LINKED`, пересчитывается из `dynamic_weight` навыка (точечно).
- Индексы/констрейнты: уникальность `uid`, уникальность `(subject_uid,title)` у Section, `(section_uid,title)` у Topic, `(subject_uid,title)` у Skill; индексы `title` для поиска.

## 4. Структура репозитория
- `web_app.py` — Flask UI/REST (визуализация, аналитика, синхронизация, нормализация, CRUD, Swagger UI).
- `fastapi_app.py` — FastAPI (тесты, динамичные веса, персональные уровни, дорожные карты, точечный пересчёт).
- `neo4j_repo.py` — клиент Neo4j с `read`/`write`/`write_unwind`, ретраи.
- `neo4j_utils.py` — доменные функции: синхронизация, построение графа, поиск, аналитика, персонализация.
- `static/js/knowledge.js` — логика визуализации графа, фильтры/поиск/детали.
- `templates/knowledge.html` — UI страницы знаний; `templates/swagger.html` — Swagger UI для Flask.
- `kb/*.jsonl` — сиды знаний.
- `Dockerfile.flask`, `Dockerfile.fastapi`, `docker-compose.yml` — развёртывание.
- `docs/` — документация (`DEVELOPER_GUIDE.md`, `todo.md`).

## 5. Быстрый старт (локально)
- Зависимости: `pip install -r requirements.txt`.
- Переменные окружения:
  - `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`.
- Запуск:
  - Flask: `python web_app.py` → `http://localhost:5000/knowledge`
  - FastAPI: `uvicorn fastapi_app:app --host 0.0.0.0 --port 8000` → `http://localhost:8000/docs`

## 6. Синхронизация и сиды
- Источники JSONL: `kb/subjects.jsonl`, `kb/sections.jsonl`, `kb/topics.jsonl`, `kb/skills.jsonl`, `kb/methods.jsonl`, `kb/skill_methods.jsonl`, `kb/topic_goals.jsonl`, `kb/topic_objectives.jsonl`.
- Нормализация: `POST /api/normalize_kb` — исправляет склейки, валидирует префиксы UID/ссылки, отчёт `invalid/warnings`.
- Синхронизация: `POST /api/neo4j_sync` — батчевые MERGE через UNWIND, индексы/констрейнты.
- Автогенерация: `kb_builder.py` (`generate_goals_and_objectives`, `autolink_skills_methods`).

## 7. Визуализация
- Данные: `GET /api/graph?subject_uid=...` — единый Cypher с `COLLECT()`.
- UI: фильтры типов, порог степени, поиск, детали по клику, метки по зуму.
- Компоновка: Cytoscape `cose`, пониженная непрозрачность рёбер, повышение читаемости.

## 8. API — Flask
- Главное: `GET /knowledge` (страница), `GET /api/graph`, `GET /api/analysis`, `POST /api/neo4j_sync`, `POST /api/normalize_kb`, `POST /api/delete_record`.
- CRUD: `POST /api/subjects|sections|topics|skills|methods|skill_methods|topic_goals|topic_objectives`.
- Списки/детали: `GET /api/list`, `GET /api/node_details`.
- Поиск: `GET /api/search?q=...&limit=...`.
- Здоровье: `GET /health`.
- Swagger: `GET /api/openapi.json`, `GET /api/docs`.
- Защита небезопасных операций: заголовок `X-API-Key` с `ADMIN_API_KEY`.

## 9. API — FastAPI
- Тесты/веса: `POST /test_result` (глобально/пользовательски), `POST /skill_test_result`.
- Пересчёт связей: `POST /recompute_links` (защита `X-API-Key`).
- Уровни: `GET /knowledge_level/{topic_uid}`, `GET /skill_level/{skill_uid}`.
- Пользователь: `GET /user/knowledge_level/{user_id}/{topic_uid}`, `GET /user/skill_level/{user_id}/{skill_uid}`.
- Дорожная карта: `POST /roadmap`, `POST /user/roadmap` (`penalty_factor` для пререквизитов).
- История: `POST /user/complete_topic`, `POST /user/complete_skill`.

## 10. Персонализация
- Пользовательские веса на `PROGRESS_*`;
- Точечный пересчёт `adaptive_weight` для изменённого навыка;
- Учёт пререквизитов: штраф в `build_user_roadmap`, сортировка по `effective_dynamic_weight`.

## 11. Развёртывание (Docker + Traefik)
- Подготовка `.env`: скопировать из `.env.example` и заполнить значения (`KB_DOMAIN`, `KB_ALT_DOMAIN`, `LETSENCRYPT_EMAIL`, `ADMIN_API_KEY`, `NEO4J_*`).
- DNS: A‑записи для `kb.*` и `api.kb.*` на IP сервера.
- Запуск: `docker compose build --no-cache && docker compose up -d`.
- Маршруты:
  - Flask: `kb.<domain>`
  - FastAPI: `api.kb.<domain>`
- TLS: автоматический выпуск LE (HTTP‑challenge).

## 12. Наблюдаемость и тестирование
- Health: `GET /health` (Flask).
- Логи: Docker/Traefik.
- Тесты: добавляйте модульные тесты для нормализации и доменных функций; интеграционные — с тестовым Neo4j.

## 13. Безопасность
- Секреты только через переменные окружения; `.env.example` без реальных значений.
- Защита API ключом для мутационных операций.
- Утечки в истории: используйте `git filter-repo --replace-text` для удаления чувствительных данных.
- Регулярная ротация ключей/паролей.

## 14. Производительность
- Батчевое MERGE (UNWIND 500); единый запрос для графа; точечный пересчёт связей.
- UI: фильтры, порог степени, метки по зуму; минимизация визуального шума.

## 15. Траблшутинг
- 404 для `/api/docs`: перезапустите Flask/Traefik, убедитесь в корректном `KB_DOMAIN`.
- HTTPS ошибки LE: проверьте DNS для `api.*`, перезапустите Traefik.
- Ошибки Neo4j транзакций: используйте `neo4j_repo.read/write` (обёртка с ретраями).

## 16. Конвенции кодирования
- Python: читаемые имена, явные транзакции, без хардкода секретов.
- UI: минимум глобального состояния, события/обработчики отделены.
- Документация: обновляйте README и Swagger при добавлении эндпоинтов.

## 17. Git‑политика
- Не коммитить `.env` с реальными значениями; использовать `.env.example`.
- При утечке: `git filter-repo` с заменами; затем `git push --force`.
- Ревью PR: проверка на секреты, соответствие конвенциям.

## 18. Расширение функционала
- Добавить поиск по текстам методов/навыков.
- Улучшить эвристику статичных весов (TF‑IDF/словарь терминов).
- Расширить Swagger примерами/моделями `response_model` для FastAPI/Flask.

