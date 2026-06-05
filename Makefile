.PHONY: dev install-deps docker-up db-migrate db-generate db-seed

dev: install-deps docker-up wait-db db-migrate db-generate db-seed

install-deps:
	pnpm install --frozen-lockfile

docker-up:
	docker compose -f docker-compose.yaml -f docker-compose.local.yaml up -d

wait-db:
	@echo "Waiting for database..."
	@until docker exec -it global-learn-cl-postgres-1 pg_isready -U postgres; do \
  		sleep 2; \
  	done

db-migrate:
	pnpm prisma migrate deploy

db-generate:
	pnpm prisma generate

db-seed:
	@echo "Seeding database..."
