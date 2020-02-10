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
caddy -host d.gh-data.org -root /mnt/gh -email develar@gmail.com -agree -conf /etc/Caddyfile

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

echo '/dev/sda /mnt/gh ext4 defaults 0 0' >> /etc/fstab

cat <<EOF >/etc/systemd/system/caddy.service
[Unit]
Description=Caddy HTTP/2 web server
Documentation=https://caddyserver.com/docs
After=network-online.target
Wants=network-online.target systemd-networkd-wait-online.service

; Do not allow the process to be restarted in a tight loop. If the
; process fails to start, something critical needs to be fixed.
StartLimitIntervalSec=14400
StartLimitBurst=10

[Service]
Restart=on-abnormal

; User and group the process will run as.
User=caddy
Group=caddy

; Letsencrypt-issued certificates will be written to this directory.
Environment=CADDYPATH=/etc/ssl/caddy

; Always set "-root" to something safe in case it gets forgotten in the Caddyfile.
ExecStart=/usr/local/bin/caddy -log stdout -log-timestamps=false -agree=true -host d.gh-data.org -root /mnt/gh -email develar@gmail.com -agree -conf /etc/Caddyfile
ExecReload=/bin/kill -USR1 $MAINPID

; Use graceful shutdown with a reasonable timeout
KillMode=mixed
KillSignal=SIGQUIT
TimeoutStopSec=5s

; Limit the number of file descriptors; see `man systemd.exec` for more limit settings.
LimitNOFILE=1048576
; Unmodified caddy is not expected to use more than that.
LimitNPROC=512

; Use private /tmp and /var/tmp, which are discarded after caddy stops.
PrivateTmp=true
; Use a minimal /dev (May bring additional security if switched to 'true', but it may not work on Raspberry Pi's or other devices, so it has been disabled in this dist.)
PrivateDevices=false
; Hide /home, /root, and /run/user. Nobody will steal your SSH-keys.
ProtectHome=true
; Make /usr, /boot, /etc and possibly some more folders read-only.
ProtectSystem=full
; … except /etc/ssl/caddy, because we want Letsencrypt-certificates there.
;   This merely retains r/w access rights, it does not add any new. Must still be writable on the host!
ReadWritePaths=/etc/ssl/caddy
ReadWriteDirectories=/etc/ssl/caddy

; The following additional security directives only work with systemd v229 or later.
; They further restrict privileges that can be gained by caddy. Uncomment if you like.
; Note that you may have to add capabilities required by any plugins in use.
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

chmod +x /etc/init.d/caddy