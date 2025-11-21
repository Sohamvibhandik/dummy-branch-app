#!/bin/sh
set -e
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"
do
  sleep 1
done
