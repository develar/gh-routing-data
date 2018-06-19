apt-get update -qq
apt-get upgrade -qq
apt-get install -qq nginx

apk update
apk upgrade --available

cat <<EOF >/etc/ssh/sshd_config
Port 722

AuthorizedKeysFile .ssh/authorized_keys
Subsystem sftp /usr/lib/ssh/sftp-server

AuthenticationMethods publickey
MaxAuthTries 1
PasswordAuthentication no

EOF

/etc/init.d/sshd restart

wget https://dl.minio.io/server/minio/release/linux-amd64/minio -O /usr/bin/minio
chmod +x /usr/bin/minio
# minio doesn't allow short names like gh, so, we use gh-data
# minio exposes all sub directories as buckets, so, we cannot use www to store gh data directly
minio server /www

# https://wiki.alpinelinux.org/wiki/Nginx
apk add nginx
adduser -D -g 'www' www
mkdir /www
chown -R www:www /var/lib/nginx
chown -R www:www /www

cat <<EOF >/etc/nginx/nginx.conf
user www;
worker_processes auto;
pcre_jit on;
error_log /var/log/nginx/error.log warn;

events {
  worker_connections 1024;
}

http {
  # Includes mapping of file name extensions to MIME types of responses
  # and defines the default type.
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  # Name servers used to resolve names of upstream servers into addresses.
  # It's also needed when using tcpsocket and udpsocket in Lua modules.
  #resolver 208.67.222.222 208.67.220.220;

  # Don't tell nginx version to clients.
  server_tokens off;

  # Specifies the maximum accepted body size of a client request, as
  # indicated by the request header Content-Length. If the stated content
  # length is greater than this size, then the client receives the HTTP
  # error code 413. Set to 0 to disable.
  client_max_body_size 1m;

  # Timeout for keep-alive connections. Server will close connections after
  # this time.
  keepalive_timeout 65;

  # Sendfile copies data between one FD and other from within the kernel,
  # which is more efficient than read() + write().
  sendfile on;

  # Don't buffer data-sends (disable Nagle algorithm).
  # Good for sending frequent small bursts of data in real time.
  tcp_nodelay on;

  # Path of the file with Diffie-Hellman parameters for EDH ciphers.
  #ssl_dhparam /etc/ssl/nginx/dh2048.pem;

  # Specifies that our cipher suits should be preferred over client ciphers.
  ssl_prefer_server_ciphers on;

  # Enables a shared SSL cache with size that can hold around 8000 sessions.
  ssl_session_cache shared:SSL:2m;

  # Specifies the main log format.
  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';

  # Sets the path, format, and configuration for a buffered log write.
  access_log /var/log/nginx/access.log main;

  server {
    listen 80;
    listen [::]:80;
    root /www/gh-data;
    index index.html index.htm;

    location / {
      autoindex on;
      autoindex_format json;
    }
  }
}

EOF

rc-service nginx restart