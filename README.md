# LAN Studio

LAN Studio — сервис для документирования локальной сети на своём сервере. Он помогает собрать в одном месте схему подключений, сведения об устройствах и их физическое расположение, чтобы не искать эту информацию в заметках и не вспоминать, куда ведёт каждый кабель.

На карте видно, какие устройства связаны между собой и через какие порты. Это помогает разбирать сложные подключения и искать причины сетевых проблем. Список устройств удобен для учёта оборудования, а JSON-экспорт позволяет передать топологию для дальнейшего анализа. Сеть и её версии хранятся локально в SQLite.

![Схема локальной сети](docs/screenshots/topology.png)

![Список устройств](docs/screenshots/devices.png)

## Установка

Скачайте исходники:

```bash
git clone https://github.com/EVERYDAYHERO2000/lanstudio.git
cd lanstudio
```

Выберите один из вариантов запуска ниже. После запуска откройте [http://127.0.0.1:3000](http://127.0.0.1:3000). Начальные логин и пароль: **admin / admin**.

### Docker

Нужны Docker и Docker Compose.

```bash
docker compose up -d --build
```

Для доступа с других устройств локальной сети:

```bash
BIND_ADDRESS=0.0.0.0 docker compose up -d --build
```

Откройте `http://IP-СЕРВЕРА:3000`. Данные сохраняются в постоянном volume `lan-data`.

### Без Docker

Нужны Node.js **24+**, npm и Git. Для работы ping в Debian/Ubuntu установите пакет `iputils-ping`.

```bash
npm ci
npm run build
LISTEN_HOST=127.0.0.1 npm start
```

Для доступа из локальной сети используйте `LISTEN_HOST=0.0.0.0 npm start` и адрес `http://IP-СЕРВЕРА:3000`. Порт задаётся переменной `PORT`, например `PORT=8080 LISTEN_HOST=0.0.0.0 npm start`.

База создаётся в `data/lan-studio.sqlite`. Другой путь можно задать переменной `DATABASE_PATH`.

### Служба Linux с автозапуском

После сборки из предыдущего раздела выполните:

```bash
sudo bash scripts/install-service.sh
```

Нужны systemd и Node.js 24+, установленный для всей системы. Установщик запускает службу `lan-studio` и включает автозапуск.

Служба по умолчанию доступна на `127.0.0.1:3000`. Для доступа из локальной сети задайте `HOSTNAME=0.0.0.0` в `/etc/lan-studio.env` и перезапустите её:

```bash
sudo systemctl restart lan-studio
```

Данные службы находятся в `/var/lib/lan-studio`. Проверить состояние и посмотреть логи:

```bash
sudo systemctl status lan-studio
sudo journalctl -u lan-studio -f
```
