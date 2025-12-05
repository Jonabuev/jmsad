# 🔧 Исправление ошибок CI/CD

## Проблемы

### 1. Несинхронизированный package-lock.json
Ошибка: `npm ci` не может установить пакеты, так как `package-lock.json` не синхронизирован с `package.json`

**Причина**: После добавления новых пакетов (`@next/bundle-analyzer`, `next-pwa`, `react-window`) не был обновлен `package-lock.json`

### 2. Несовместимость версии Node.js
Предупреждения: Firebase и pdfjs-dist требуют Node.js >= 20.0.0, а в CI/CD использовался Node.js 18

**Причина**: В `.github/workflows/ci-cd.yml` была указана версия Node.js 18

## Решение

### 1. Обновлен package.json
- ✅ Добавлен `react-window@^1.8.10` в devDependencies
- ✅ Добавлен `react-window-infinite-loader@^1.0.9` в devDependencies
- ✅ Добавлен `@types/react-window@^1.8.8` в devDependencies

### 2. Обновлен CI/CD workflow
- ✅ Изменена версия Node.js с `18` на `20` в `.github/workflows/ci-cd.yml`

### 3. Обновлен package-lock.json
- ✅ Выполнен `npm install` для синхронизации lock файла

## Измененные файлы

1. ✅ `front/package.json` - добавлены недостающие пакеты
2. ✅ `.github/workflows/ci-cd.yml` - обновлена версия Node.js до 20
3. ✅ `front/package-lock.json` - автоматически обновлен после `npm install`

## Проверка

После этих изменений CI/CD должен работать корректно:

1. ✅ `npm ci` будет успешно устанавливать все зависимости
2. ✅ Не будет предупреждений о несовместимости версий Node.js
3. ✅ Все новые пакеты будут установлены

## Важно

**Обязательно закоммитьте обновленный `package-lock.json`** в репозиторий, иначе CI/CD будет падать с той же ошибкой.

```bash
git add front/package-lock.json
git commit -m "chore: update package-lock.json with new dependencies"
git push
```

---

**Дата исправления**: 2025-01-27
