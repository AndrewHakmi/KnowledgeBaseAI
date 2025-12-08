import os
import json
import re
import uuid
import requests
from typing import Dict, List, Tuple, Set, Optional

# Определяем базовую директорию и путь к каталогу знаний (KB)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KB_DIR = os.path.join(BASE_DIR, 'kb')


# Функция для загрузки данных из JSONL файла в список словарей
def load_jsonl(filepath: str) -> List[Dict]:
    data: List[Dict] = []
    if not os.path.exists(filepath):
        return data  # Если файл не существует, возвращаем пустой список
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:  # Пропускаем пустые строки
                continue
            try:
                data.append(json.loads(line))  # Преобразуем строку в словарь и добавляем в список
            except json.JSONDecodeError:
                continue  # Если возникла ошибка при декодировании, пропускаем строку
    return data


# Функция для добавления записи в JSONL файл
def append_jsonl(filepath: str, record: Dict) -> None:
    os.makedirs(os.path.dirname(filepath), exist_ok=True)  # Создаём директории, если их нет
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")  # Записываем запись в файл в формате JSONL


# Функция для перезаписи JSONL файла с новыми записями
def rewrite_jsonl(filepath: str, records: List[Dict]) -> None:
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")  # Перезаписываем файл новыми записями


# Функция для получения полного пути к файлу в каталоге KB
def get_path(name: str) -> str:
    return os.path.join(KB_DIR, name)


# Функция для создания уникального идентификатора на основе префикса и заголовка
def make_uid(prefix: str, title: str) -> str:
    base = ''.join(ch for ch in title.upper() if ch.isalnum())  # Преобразуем заголовок в строку из букв и цифр
    base = base[:18] if base else 'ITEM'  # Ограничиваем длину до 18 символов
    return f"{prefix}-{base}-{uuid.uuid4().hex[:6]}"  # Генерируем уникальный идентификатор с префиксом и случайным числом


# Функция для токенизации текста: разбивает текст на отдельные слова
def tokens(text: str) -> Set[str]:
    if not text:
        return set()  # Если текст пустой, возвращаем пустое множество
    out: List[str] = []
    buf: List[str] = []
    for ch in text.lower():
        if ch.isalnum():
            buf.append(ch)  # Собираем символы в буфер, если они являются буквами или цифрами
        else:
            if buf:
                out.append(''.join(buf))  # Когда встречаем разделитель, сохраняем слово в список
                buf = []  # Очищаем буфер
    if buf:
        out.append(''.join(buf))  # Добавляем последнее слово, если оно есть
    return set(out)  # Возвращаем множество уникальных слов


# Функция для генерации целей и задач по темам
def generate_goals_and_objectives() -> Dict:
    topics = load_jsonl(os.path.join(KB_DIR, 'topics.jsonl'))  # Загружаем темы
    existing_goals = load_jsonl(os.path.join(KB_DIR, 'topic_goals.jsonl'))  # Загружаем существующие цели
    existing_objs = load_jsonl(os.path.join(KB_DIR, 'topic_objectives.jsonl'))  # Загружаем существующие задачи

    # Создаём словари для хранения целей и задач по темам
    by_topic_goals: Dict[str, List[Dict]] = {}
    for g in existing_goals:
        by_topic_goals.setdefault(g.get('topic_uid'), []).append(g)

    by_topic_objs: Dict[str, List[Dict]] = {}
    for o in existing_objs:
        by_topic_objs.setdefault(o.get('topic_uid'), []).append(o)

    added_goals = 0  # Счётчик добавленных целей
    added_objs = 0  # Счётчик добавленных задач
    for t in topics:
        tuid = t.get('uid')
        title = t.get('title') or 'Тема'
        if not by_topic_goals.get(tuid):  # Если для темы нет цели
            record = {
                'uid': f"GOAL-{tuid}-MASTER",
                'topic_uid': tuid,
                'title': f"Достичь уверенного решения: {title}"
            }
            append_jsonl(os.path.join(KB_DIR, 'topic_goals.jsonl'), record)  # Добавляем цель
            added_goals += 1
        if not by_topic_objs.get(tuid):  # Если для темы нет задач
            obj_records = [
                {
                    'uid': f"OBJ-{tuid}-BASICS",
                    'topic_uid': tuid,
                    'title': f"Освоить базовые понятия: {title}"
                },
                {
                    'uid': f"OBJ-{tuid}-APPLY",
                    'topic_uid': tuid,
                    'title': f"Применять методы к задачам: {title}"
                }
            ]
            for rec in obj_records:
                append_jsonl(os.path.join(KB_DIR, 'topic_objectives.jsonl'), rec)  # Добавляем задачи
                added_objs += 1

    return {'added_goals': added_goals, 'added_objectives': added_objs}  # Возвращаем количество добавленных целей и задач


# Функция для автосвязывания навыков и методов
def autolink_skills_methods(max_links_per_skill: int = 2) -> Dict:
    skills = load_jsonl(os.path.join(KB_DIR, 'skills.jsonl'))  # Загружаем навыки
    methods = load_jsonl(os.path.join(KB_DIR, 'methods.jsonl'))  # Загружаем методы
    existing = load_jsonl(os.path.join(KB_DIR, 'skill_methods.jsonl'))  # Загружаем существующие связи

    # Создаём множество уже существующих пар навыков и методов
    existing_pairs: Set[Tuple[str, str]] = set()
    for sm in existing:
        su = sm.get('skill_uid')
        mu = sm.get('method_uid')
        if su and mu:
            existing_pairs.add((su, mu))

    added = 0  # Счётчик добавленных связей
    for sk in skills:
        suid = sk.get('uid')
        stoks = tokens(sk.get('title', '')) | tokens(sk.get('definition', ''))  # Токены для навыка
        candidates: List[Tuple[str, float, Dict]] = []  # Список кандидатов для связывания
        for m in methods:
            muid = m.get('uid')
            mtoks = tokens(m.get('title', '')) | tokens(m.get('method_text', ''))  # Токены для метода
            if not mtoks:
                continue
            overlap = stoks & mtoks  # Находим пересечение токенов
            score = len(overlap) / max(len(stoks) or 1, len(mtoks))  # Рассчитываем схожесть
            if score > 0:
                candidates.append((muid, score, m))  # Добавляем кандидатов с оценкой схожести
        candidates.sort(key=lambda x: x[1], reverse=True)  # Сортируем по схожести
        links = 0
        for muid, score, m in candidates:
            if (suid, muid) in existing_pairs:
                continue  # Пропускаем уже связанные пары
            record = {
                'skill_uid': suid,
                'method_uid': muid,
                'weight': 'primary' if score >= 0.2 else 'secondary',
                'confidence': round(min(0.95, 0.5 + score), 3),
                'is_auto_generated': True
            }
            append_jsonl(os.path.join(KB_DIR, 'skill_methods.jsonl'), record)  # Добавляем связь
            existing_pairs.add((suid, muid))
            added += 1
            links += 1
            if links >= max_links_per_skill:
                break  # Ограничиваем количество связей для каждого навыка

    return {'added_links': added}  # Возвращаем количество добавленных связей
