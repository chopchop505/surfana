#!/bin/bash

# Start Promtail
./promtail-linux-amd64 -config.file=/etc/promtail/app-config.yaml &

# Start Node
node src/server.js