#!/bin/bash
set -e

echo "== Actualizando sistema =="
apt update && apt upgrade -y

echo "== Instalando Docker =="
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

echo "== Instalando Docker Compose (plugin) =="
apt install -y docker-compose-plugin

echo "== Configurando firewall básico =="
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 9090/tcp   # Prometheus (solo si quieres acceso directo)
ufw allow 3002/tcp   # Grafana (solo si quieres acceso directo)
ufw --force enable

echo "== Instalando fail2ban =="
apt install -y fail2ban
systemctl enable fail2ban

echo "== Instalando herramientas útiles =="
apt install -y git jq bc curl

echo "== Configurando límites de sistema =="
cat >> /etc/sysctl.conf <<EOF
vm.overcommit_memory = 1
net.ipv4.ip_forward = 1
EOF
sysctl -p

echo "== Listo. Reinicia la sesión para aplicar grupos =="