build:
	docker compose build && make up

up:
	docker compose up -d

down:
	docker compose down
