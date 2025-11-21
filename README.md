# Branch Loan API

This is a simple, clean submission for the Branch Loan API task.

## What this repo contains
- Small REST API for loans
- Postgres database
- Docker and docker-compose setup
- Basic health check and metrics
- Simple CI workflow to build and push images

## Quick start (developer)
1. Copy example env
cp .env.example .env

2. Build and run
docker compose up --build

3. Create database table
docker exec -it branchloan-api node migrations/run_migrations.js

4. Test
curl http://localhost:8000/health
curl http://localhost:8000/api/loans

## Quick start (recruiter)
1. Clone repo
2. Copy example env
cp .env.example .env
3. Pull published images and run
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
4. Visit https://branchloans.com/health
If accessing locally use curl -k or visit http://localhost:8000

## Notes
- Do not commit .env
- If ports 80/443 are in use, stop other services or use a different host
- To stop the stack
docker compose down -v

## Contact
If anything does not run, reply and I will help quickly.
