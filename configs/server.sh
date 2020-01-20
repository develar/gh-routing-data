#!/usr/bin/env bash

# https://www.scaleway.com/en/docs/how-to-mount-and-format-a-block-volume/

#apt-get update -qq && apt-get upgrade -qq
#apt-get install -qq nginx

#cat <<EOF >/etc/apk/repositories
#http://nl.alpinelinux.org/alpine/latest-stable/main
#EOF

chown -R netdata:netdata /usr/share/webapss/netdata

cat <<EOF >/etc/ssh/sshd_config
PermitRootLogin no
AuthenticationMethods publickey
Subsystem sftp internal-sftp
EOF

cat <<EOF >/etc/netdata/netdata.conf
[global]
  # 2 instead of default 1 is enough
  update every = 2
  run as user = netdata
  # the database size - 24 hours * 2 (since collects every 2 but not 1 seconds)
  history = 86400
  bind to = [::]
[web]
  web files owner = root
  web files group = netdata
  allow netdata.conf from = localhost
EOF

rc-service netdata restart

/etc/init.d/sshd restart

####### caddy
# curl -L https://github.com/caddyserver/caddy/releases/download/v1.0.4/caddy_v1.0.4_linux_amd64.tar.gz | tar xvz && mv caddy /usr/bin/caddy && chmod +x /usr/bin/caddy
ulimit -n 8192
caddy -host d.graphhopper.develar.org -root /mnt/gh-data -email develar@gmail.com -agree -conf /etc/Caddyfile

groupadd --system caddy
useradd --system \
	--gid caddy \
	--create-home \
	--home-dir /var/lib/caddy \
	--shell /usr/sbin/nologin \
	--comment "Caddy web server" \
	caddy
#addgroup -S caddy 2>/dev/null
#adduser -S -D -h /var/lib/caddy -s /sbin/nologin -G caddy -g caddy caddy 2>/dev/null
#adduser caddy www-data 2>/dev/null

# pkill -USR1 caddy (to restart)
# tail /var/log/access.log

mkdir /var/log/caddy && chown caddy:caddy /var/log/caddy
scp ~/Documents/gh-routing-data/configs/server/Caddyfile root@51.15.100.144:/etc/Caddyfile

cat <<EOF >/etc/init.d/caddy
#!/sbin/openrc-run

name="Caddy web-server"
command="/usr/sbin/caddy"
command_args="-host d2.graphhopper.develar.org -log /var/log/caddy/caddy.log -root /var/www -quic -email develar@gmail.com -agree -conf /etc/Caddyfile"
pidfile="/var/run/caddy.pid"
command_background=yes
start_stop_daemon_args="--user caddy --group caddy"

depend() {
	need net localmount
	after firewall
}
EOF

chmod +x /etc/init.d/caddy