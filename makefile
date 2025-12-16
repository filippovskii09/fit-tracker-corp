install:
	npm install
	cd backend && npm install

build:
	docker compose up --build -d

up:
	docker compose up -d

down:
	docker compose down

restart: down up

shell:
	docker compose exec backend sh
