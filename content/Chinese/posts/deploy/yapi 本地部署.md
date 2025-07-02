---

title: "yapi 本地部署"
date: 2025-06-28
draft: false
author: "肖青山"
lastmod: 2025-06-30
draft: false  # 设为 false 发布
categories: ["yapi"]
tags: ["yapi", "deploy"]

---



在开发过程中，为了方便前后端新增，查看，修改 `RESTful API`接口，需要一个用于管理API的平台，YApi 是一款高效、易用、功能强大的开源 API 管理平台，特别适合中文开发团队使用。以下是其主要特点：

- 可视化接口管理
- 强大的 Mock 服务
- 自动化测试



# 1. 环境准备

1.  `kylin server 2204 arm` , 内核版本 `4.19.90-25.10.v2101.ky10.aarch64`
2. 虚拟机磁盘大小`>=150G`, 内存 `20G` (`mongodb`编译需要)



# 2. 安装高版本nodejs

[node下载地址](https://mirrors.aliyun.com/nodejs-release/v8.10.0/)



```

wget https://nodejs.org/download/release/v14.15.1/node-v14.15.1-linux-arm64.tar.xz

xz -d node-v14.15.1-linux-arm64.tar.xz
tar -xf node-v14.15.1-linux-arm64.tar

mv node-v14.15.1 nodejs

ln -s /usr/local/node/nodejs/bin/node /usr/local/bin/node
ln -s /usr/local/node/nodejs/bin/npm /usr/local/bin/npm
ln -s /usr/local/node/nodejs/bin/npx /usr/local/bin/npx

这里使用v8.10.0 版本node， 因为使用太高的版本yapi 在安装相应包时会提示(node version required >4 <=9)

```



# 3. 源码编译安装mongodb

## 3.1 编译安装

- 安装依赖包：`dnf install libcurl-devel libboost-all-devel libopenssl-dev scons`

- gcc 版本要求>=8.0 ，或者clang >= 7

- Python 3.7



这里使用 `v6.0.21` 版本，太高版本需要`gcc`的版本更高

```
克隆源码：git clone https://github.com/mongodb/mongo.git
切换到6.0分支：git checkout v6.0.21
cd mongo
pip3 install --user -r etc/pip/dev-requirements.txt
如果报错，缺啥安装啥

编译：
./buildscripts/scons.py install-mongod install-mongo --disable-warnings-as-errors CCFLAGS=-march=armv8-a+crc -j10

CCFLAGS=-march=armv8-a+crc： aarch64下编译需要
或使用 scons install-mongod install-mongo --opt=release 编译

编译后，生成的二进制 mongod 和mongo 在 mongo/build/下，直接拷贝到/usr/local/bin/下即可

scons --prefix=/usr/local/bin/mongodb install  也可安装到指定目录下

```



## 3.2 启动mongodb

1. 新建数据库配置文件

   新建`mongod.conf`

   ```
   # mongod.conf
     
   # where to write logging data
   systemLog:
       destination: file
       path: /var/log/mongodb/mongod.log
       logAppend: true
       logRotate: reopen  # 日志轮转方式(reopen/rename)
   
   # where to store data
   storage:
       dbPath: /var/lib/mongodb
       journal:
         enabled: true  # 启用journal日志
   
   # 进程管理
   processManagement:
     fork: true  # 以守护进程方式运行
     pidFilePath: /var/run/mongodb/mongod.pid  # PID文件位置
   
   # network interfaces
   net:
     port: 27017
     bindIp: 127.0.0.1
     maxIncomingConnections: 800  # 最大连接数
   
   security:
     authorization: enabled
   ```

   

2. 新建目录

   新建日志目录`/var/log/mongodb` 和进程目录 `/var/run/mongodb` 以及数据目录`/var/lib/mongodb`

3. 启动数据库

   执行`mongod -f /etc/mongod.conf` ，即可启动`mongodb`

4. 安全配置

   ```
   MongoDB 默认没有启用认证，这在生产环境中是不安全的。配置用户认证来保护数据库。
   
   mongo         # 进数据库
   use database    # 创建数据库， 这里将database设置为yapi 
   db.createUser({
     user: 'admin',
     pwd: 'password',
     roles: [{ role: 'userAdminAnyDatabase', db: 'admin' }]
   })
   
   将 'admin' 和 'password' 替换为实际的用户名和密码。这里是 yapi 和 123456
   创建用户后，通过以下命令要求 MongoDB 使用认证：
   mongod --auth -f /etc/mongod.conf
   
   ```

   

5. 连接数据库

```
mongo -u "username" -p "password" --authenticationDatabase "admin"  # username 和 password 使用实际的，这里是yapi 和 123456
```

# 4. 安装yapi

## 4.1 安装

```
mkdir yapi
cd yapi
git clone https://github.com/YMFE/yapi.git vendors //或者下载 zip 包解压到 vendors 目录（clone 整个仓库大概 140+ M，可以通过 `git clone --depth=1 https://github.com/YMFE/yapi.git vendors` 命令减少，大概 10+ M）
cp vendors/config_example.json ./config.json //复制完成后请修改相关配置
cd vendors
npm config set registry https://registry.npmmirror.com/
npm run install-server //安装程序会初始化数据库索引和管理员账号，管理员账号名可在 config.json 配置
node server/app.js //启动服务器后，请访问 127.0.0.1:{config.json配置的端口}，初次运行会有个编译的过程，请耐心等候

config.json
{
  "port": "3000",
  "host": "10.0.0.190",
  "adminAccount": "admin@admin.com",
  "timeout":120000,
  "db": {
    "servername": "127.0.0.1",
    "DATABASE": "yapi",         #数据库名
    "port": 27017,
    "user": "yapi",             #用户
    "pass": "123456",           #密码
    "authSource": "yapi"        #认证源
  },
  "mail": {
    "enable": true,
    "host": "smtp.163.com",
    "port": 465,
    "from": "***@163.com",
    "auth": {
      "user": "***@163.com",
      "pass": "*****"
    }
  }
}

在数据库中先要创建数据库和用户
use yapi
db.createUser
```

## 4.2 pm2 管理 node 服务器启动，停止

```
npm i pm2 -g  # 安装

pm2 start server/app.js --watch # 启动
```



# 5. 参考链接

https://hellosean1025.github.io/yapi/devops/index.html

https://github.com/mongodb/mongo/wiki/Build-MongoDB-From-Source/6a0880a8c101ddf81d639d64dafc818e41170c0b

https://my.oschina.net/emacs_8809898/blog/17316008

https://mirrors.aliyun.com/nodejs-release