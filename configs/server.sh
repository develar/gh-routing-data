#!/usr/bin/env bash

# https://www.scaleway.com/docs/attach-and-detach-a-volume-to-an-existing-server/

#apt-get update -qq
#apt-get upgrade -qq
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

wget https://dl.minio.io/server/minio/release/linux-amd64/minio -O /usr/bin/minio
chmod +x /usr/bin/minio


####### caddy
ulimit -n 8192
caddy -host d.graphhopper.develar.org -root /var/lib/docker/volumes/site_gh-data/_data/gh-data -quic -email develar@gmail.com -agree -conf /etc/Caddyfile

addgroup -S caddy 2>/dev/null
adduser -S -D -h /var/lib/caddy -s /sbin/nologin -G caddy -g caddy caddy 2>/dev/null
adduser caddy www-data 2>/dev/null

# pkill -USR1 caddy (to restart)
# tail /var/log/access.log

cat <<EOF >/etc/Caddyfile
:80, :443
browse
log /var/log/caddy/access.log {
  except /not_found
}

rewrite {
  ext .php
  to /not_found
}
rewrite {
  if {method} is POST
  to /not_found
}
status 404 /not_found

EOF

# mkdir /var/log/caddy && chown caddy:caddy /var/log/caddy

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