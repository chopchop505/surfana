#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE TABLE cameras (camera_id VARCHAR (255) PRIMARY KEY, stream_url text, still_url text, rewind_clip text, spot_id VARCHAR (255), spot_name VARCHAR (255));
EOSQL