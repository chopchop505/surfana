# Surfana

Simple project to aggregate surf data using Grafana + Loki + Prometheus.

# Start & Stop

```bash
# Start
git clone https://github.com/chopchop505/surfana
cd surfana
docker-compose build --no-cache
docker-compose up --force-recreate --renew-anon-volumes
```
# Stop
^C
docker-compose down
```

# Components

This playground contains:
* `app` - scraps third-party websites for surf data, interface: [http://localhost:3001/metrics](http://localhost:3001/metrics)
* `loki` - storage for textual surf data
* `promtail` that scrapes logs from app `/var/log` directory and puts to `loki`
* `prometheus` - storage for metrics, get metrics from `app`, interface: [http://localhost:9090](http://localhost:9090)
* `grafana` with pre-configured both datasources, interface: [http://localhost:3000](http://localhost:3000), `admin`/`surfana`


