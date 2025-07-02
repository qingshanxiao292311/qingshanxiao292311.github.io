---

title: "gitea 本地部署"
date: 2025-06-28
draft: false
author: "肖青山"
lastmod: 2025-06-30
draft: false  # 设为 false 发布
categories: ["git"]
tags: ["git", "deploy"]

---



# 1. 环境准备

-  在kylin-server-2204 arm架构上部署


## 1.1 安装高版本go



```
wget https://go.dev/dl/go1.24.1.linux-arm64.tar.gz

tar -zxvf go1.24.1 linux-arm64.tar.gz -C /opt/

echo "export PATH=$PATH:/opt/go/bin" >> ~/.bashrc

source ~/.bashrc
```



## 1.2 安装高版本nodejs

```
wget https://nodejs.org/download/release/v24.1.0/node-v24.1.0-linux-arm64.tar.xz

xz -d node-v24.1.0-linux-arm64.tar.xz

tar -xf node-v24.1.0-linux-arm64.tar

mv node-v24.1.0 nodejs

ln -s /usr/local/node/nodejs/bin/node /usr/local/bin/node

ln -s /usr/local/node/nodejs/bin/npm /usr/local/bin/npm

ln -s /usr/local/node/nodejs/bin/npx /usr/local/bin/npx
```



## 1.3 安装数据库mariadb

```
yum install -y mariadb mariadb-server
systemctl enable --now mariadb

创建一个gitea数据库和gitea用户：
mysql -u root -p
MariaDB [(none)]> create databse gitea;    #创建数据库gitea
MariaDB [(none)]> CREATE USER 'gitea'@'localhost' IDENTIFIED BY '123456';  # 创建一个用户gitea, 密码123456
MariaDB [(none)]> GRANT ALL PRIVILEGES ON gitea.* TO 'gitea'@'localhost';    # 赋予所有的操作权限
MariaDB [(none)]> FLUSH PRIVILEGES;  # 刷新权限
```



# 2. 源码编译

```
git clone -b release/v1.24 https://github.com/go-gitea/gitea.git

cd gitea

TARS="bindata" make build

编译失败，由于有些地址不通，直接使用二进制安装

```

## 3.  下载二进制

```
https://dl.gitea.com/gitea/  
wget -O gitea https://dl.gitea.com/gitea/1.24.0/gitea-1.24.0-linux-arm64   # 直接下载
```

## 4. 运行

```
/opt/gitea/gitea web

打开网页：
http://0.0.0.0:5000                   # 端口连接, 第一次连接会需要安装，查看后台，根据报错修复问题
AppURL(ROOT_URL): http://git.xqs.com/   # 域名连接

```

## 5. gitea配置文件修改

```
[xqs@localhost ~]$ vim /opt/gitea/custom/conf/app.ini 

APP_NAME = My Gitea

RUN_USER =xqs     # 运行用户即运行/opt/gitea/gitea web的用户名

WORK_PATH = /opt/gitea

RUN_MODE = prod

[database]

DB_TYPE = mysql

HOST = 127.0.0.1:3306

NAME = gitea    #数据库名

USER = gitea    #数据库用户名

PASSWD = 123456  #数据库gitea 密码

SCHEMA = 

SSL_MODE = disable

PATH = /opt/gitea/data/gitea.db  #数据库路径

LOG_SQL = false

[server]

PROTOCOL = http

HTTP_ADDR = 0.0.0.0    # 地址

HTTP_PORT = 5000      # 端口

DOMAIN = git.xqs.com    # 域名

ROOT_URL = http://git.xqs.com/

START_SSH_SERVER = true

SSH_PORT = 2222       # ssh 方式下载代码的端口号，默认22与系统的sshd 22端口冲突

SSH_DOMAIN = git.xqs.com

APP_DATA_PATH = /opt/gitea/data

DISABLE_SSH = false

LFS_START_SERVER = false

OFFLINE_MODE = true

[repository]

ROOT = /opt/gitea/data/repositories   #仓库地址

[mailer]

ENABLED = false

[service]

REGISTER_EMAIL_CONFIRM = false

ENABLE_NOTIFY_MAIL = false

DISABLE_REGISTRATION = false

ALLOW_ONLY_EXTERNAL_REGISTRATION = false

ENABLE_CAPTCHA = false

REQUIRE_SIGNIN_VIEW = false

DEFAULT_KEEP_EMAIL_PRIVATE = false

DEFAULT_ALLOW_CREATE_ORGANIZATION = true

DEFAULT_ENABLE_TIMETRACKING = true

NO_REPLY_ADDRESS = noreply.git.xqs.com

[openid]

ENABLE_OPENID_SIGNIN = true

ENABLE_OPENID_SIGNUP = true

[cron.update_checker]

ENABLED = false

[session]

PROVIDER = file

[log]

MODE = console

LEVEL = info

ROOT_PATH = /opt/gitea/log  #日志路径

[repository.pull-request]

DEFAULT_MERGE_STYLE = merge    # 合并风格，merge, rebase等

[repository.signing]

DEFAULT_TRUST_MODEL = committer

[security]   #第一次安装生成

INSTALL_LOCK = true

INTERNAL_TOKEN = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE3NDk1NTUwMTJ9.mcXVTx4YnRCueNq5rASyvx_nwY-SydmaPNdB5vb6b7s

PASSWORD_HASH_ALGO = pbkdf2  

[oauth2]   #第一次安装生成

JWT_SECRET = zrLLRezYRSNtCdQohBz30uMHBDk93i59N20RNMzRp6g
```

# 6.参考

https://docs.gitea.com/zh-cn/installation/install-from-source