#!/usr/bin/env bash

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
