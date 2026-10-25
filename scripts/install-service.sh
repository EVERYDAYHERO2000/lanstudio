#!/usr/bin/env bash
set -euo pipefail

if [[ $(uname -s) != Linux ]] || ! command -v systemctl >/dev/null; then
  echo 'This installer requires Linux with systemd.' >&2; exit 1
fi
if [[ $EUID -ne 0 ]]; then
  echo 'Run with sudo after npm ci && npm run build.' >&2; exit 1
fi
project_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
node_bin=${NODE_BIN:-$(command -v node || true)}
if [[ ! $node_bin =~ ^/[a-zA-Z0-9_./+-]+$ ]] || [[ ! -x $node_bin ]]; then
  echo 'Set NODE_BIN to an absolute system-wide Node.js executable.' >&2; exit 1
fi
node_bin=$(readlink -f -- "$node_bin")
case "$node_bin" in /home/*|/root/*) echo 'Install Node.js system-wide: the service cannot use Node from a home directory.' >&2; exit 1;; esac
if ! "$node_bin" -e 'if(Number(process.versions.node.split(".")[0])<24)process.exit(1)'; then
  echo 'Node.js 24 or newer is required.' >&2; exit 1
fi
if [[ ! -f "$project_dir/.next/standalone/server.js" ]] || [[ ! -d "$project_dir/.next/standalone/.next/static" ]]; then
  echo 'Build the project first: npm ci && npm run build' >&2; exit 1
fi
if ! getent group lan-studio >/dev/null; then groupadd --system lan-studio; fi
if ! id lan-studio >/dev/null 2>&1; then
  useradd --system --gid lan-studio --home-dir /var/lib/lan-studio --no-create-home --shell /usr/sbin/nologin lan-studio
fi
if [[ $(id -u lan-studio) == 0 ]] || [[ $(id -gn lan-studio) != lan-studio ]]; then
  echo 'Existing lan-studio account must be non-root with primary group lan-studio.' >&2; exit 1
fi
install -d -m 0755 /opt/lan-studio/releases
release_dir=$(mktemp -d /opt/lan-studio/releases/release-XXXXXXXX)
cp -R "$project_dir/.next/standalone/." "$release_dir/"
chown -R root:root "$release_dir"
chmod -R a+rX "$release_dir"
chmod 0755 "$release_dir"
# A unique temporary symlink allows atomic switching without deleting older releases.
next_link="/opt/lan-studio/current-$(basename "$release_dir")"
ln -s "$release_dir" "$next_link"
mv -Tf "$next_link" /opt/lan-studio/current
if [[ ! -e /etc/lan-studio.env ]]; then
  install -m 0640 -o root -g lan-studio "$project_dir/deploy/systemd/lan-studio.env" /etc/lan-studio.env
fi
sed "s|@NODE_BIN@|$node_bin|g" "$project_dir/deploy/systemd/lan-studio.service" > /etc/systemd/system/lan-studio.service
chmod 0644 /etc/systemd/system/lan-studio.service
systemctl daemon-reload
systemctl enable lan-studio.service
systemctl restart lan-studio.service
systemctl --no-pager --full status lan-studio.service
printf '\nInstalled. Configuration: /etc/lan-studio.env\nLogs: journalctl -u lan-studio -f\nDatabase: /var/lib/lan-studio/lan-studio.sqlite\n'
