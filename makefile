# Makefile для VS Code extension
# Переменные
NAME = $(shell node -p "require('./package.json').name")
VERSION = $(shell node -p "require('./package.json').version")
VSIX_FILE = $(NAME)-$(VERSION).vsix

# Цвета для вывода
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

# Основные цели
.PHONY: help install build package clean publish watch test lint format

help:
	@echo "$(GREEN)Доступные команды:$(NC)"
	@echo "  $(YELLOW)make install$(NC)    - Установка всех зависимостей"
	@echo "  $(YELLOW)make build$(NC)      - Компиляция TypeScript в JavaScript"
	@echo "  $(YELLOW)make watch$(NC)       - Запуск компиляции в режиме наблюдения"
	@echo "  $(YELLOW)make package$(NC)     - Создание .vsix пакета"
	@echo "  $(YELLOW)make clean$(NC)       - Очистка собранных файлов"
	@echo "  $(YELLOW)make publish$(NC)     - Публикация в marketplace"
	@echo "  $(YELLOW)make test$(NC)        - Запуск тестов"
	@echo "  $(YELLOW)make lint$(NC)        - Проверка кода линтером"
	@echo "  $(YELLOW)make format$(NC)      - Форматирование кода"

# Установка зависимостей
install:
	@echo "$(GREEN)Установка зависимостей...$(NC)"
	npm install
	@echo "$(GREEN)Установка vsce глобально...$(NC)"
	npm install -g @vscode/vsce || npm install -g vsce
	@echo "$(GREEN)Установка языковой поддержки...$(NC)"
	npm install --save-dev @vscode/l10n-dev
	@echo "$(GREEN)Установка поддержки тестов...$(NC)"
	npm install --save-dev jest @types/jest ts-jest typescript
	@echo "$(GREEN)Готово!$(NC)"

# Компиляция TypeScript
build:
	@echo "$(GREEN)Компиляция TypeScript...$(NC)"
	npm run compile || tsc -p ./
	@echo "$(GREEN)Компиляция завершена$(NC)"

# Компиляция в режиме наблюдения
watch:
	@echo "$(GREEN)Запуск компиляции в режиме наблюдения...$(NC)"
	npm run watch || tsc -p ./ -w

# Создание .vsix пакета
package: build
	@echo "$(GREEN)Создание пакета $(VSIX_FILE)...$(NC)"
	vsce package || npx @vscode/vsce package
	@echo "$(GREEN)Пакет создан: $(VSIX_FILE)$(NC)"

# Очистка
clean:
	@echo "$(YELLOW)Очистка...$(NC)"
	rm -rf ./out ./node_modules
	rm -f *.vsix
	@echo "$(GREEN)Очистка завершена$(NC)"

# Публикация
publish: build test lint
	@echo "$(GREEN)Публикация версии $(VERSION)...$(NC)"
	vsce publish || npx @vscode/vsce publish
	@echo "$(GREEN)Публикация завершена$(NC)"

# Тесты
test: build
	@echo "$(GREEN)Запуск тестов...$(NC)"
	npm test || node ./out/test/runTest.js
	@echo "$(GREEN)Тесты завершены$(NC)"

# Линтинг
lint:
	@echo "$(GREEN)Проверка кода...$(NC)"
	npm run lint || npx eslint . --ext .ts,.tsx
	@echo "$(GREEN)Проверка завершена$(NC)"

# Форматирование
format:
	@echo "$(GREEN)Форматирование кода...$(NC)"
	npm run format || npx prettier --write "src/**/*.ts"
	@echo "$(GREEN)Форматирование завершено$(NC)"

# Полная переустановка
reinstall: clean install build
	@echo "$(GREEN)Полная переустановка завершена$(NC)"

# Установка зависимостей для разработки
dev-install:
	@echo "$(GREEN)Установка dev зависимостей...$(NC)"
	npm install --save-dev @types/node typescript @types/vscode eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
	@echo "$(GREEN)Dev зависимости установлены$(NC)"

# Запуск в режиме разработки
dev: build
	@echo "$(GREEN)Запуск в режиме разработки...$(NC)"
	code --extension-development-path . --extensionTestsPath ./out/test

# Проверка зависимостей
check-deps:
	@echo "$(GREEN)Проверка необходимых зависимостей...$(NC)"
	@command -v vsce >/dev/null 2>&1 || { echo >&2 "$(RED)vsce не установлен. Установите: npm install -g @vscode/vsce$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo >&2 "$(RED)npm не установлен$(NC)"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo >&2 "$(RED)node не установлен$(NC)"; exit 1; }
	@echo "$(GREEN)Все зависимости установлены$(NC)"

# Информация о плагине
info:
	@echo "$(GREEN)Информация о плагине:$(NC)"
	@echo "  Имя: $(NAME)"
	@echo "  Версия: $(VERSION)"
	@echo "  Файл пакета: $(VSIX_FILE)"
	@echo "  Директория: $(shell pwd)"

# Цель по умолчанию
default: help