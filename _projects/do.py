import os
import random
import yaml
import re

# Однословные теги по кибербезопасности
CYBER_TAGS = [
    "ransomware", "phishing", "malware", "cybersecurity", "APT",
    "zerotrust", "SIEM", "firewall", "DDoS", "encryption",
    "SOC", "threats", "resilience", "IAM", "response",
    "CVE", "patching", "vulnerability", "EDR", "network"
]

def update_tags_in_post(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Найти YAML фронтматтер
    frontmatter_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if not frontmatter_match:
        print(f"Файл {file_path} не содержит корректного фронтматтера.")
        return

    frontmatter = frontmatter_match.group(1)
    body = content[frontmatter_match.end():]

    data = yaml.safe_load(frontmatter) or {}
    existing_tags = data.get('tags', [])

    if not isinstance(existing_tags, list):
        existing_tags = [existing_tags] if existing_tags else []

    # Удаление пробелов и фильтрация многословных тегов
    existing_tags = [tag.strip() for tag in existing_tags if isinstance(tag, str) and len(tag.strip().split()) == 1]

    # Генерация случайных тегов, исключая уже существующие
    new_tags = list(set(existing_tags + random.sample(
        [t for t in CYBER_TAGS if t not in existing_tags],
        k=random.randint(1, min(5, len(CYBER_TAGS) - len(existing_tags)))
    )))

    data['tags'] = sorted(new_tags)

    new_frontmatter = yaml.dump(data, default_flow_style=False, allow_unicode=True).strip()
    new_content = f"---\n{new_frontmatter}\n---\n{body}"

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Обновлён файл: {os.path.basename(file_path)}")

def process_all_posts():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    for filename in os.listdir(current_dir):
        if filename.endswith(".md"):
            update_tags_in_post(os.path.join(current_dir, filename))

if __name__ == "__main__":
    process_all_posts()