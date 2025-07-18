---
title: "jenkins 本地部署"
date: 2025-03-15
draft: false
author: "肖青山"
lastmod: 2025-06-23
draft: false  # 设为 false 发布
categories: ["git"]
tags: ["jenkins", "deploy"]
---



# 1. jenkins 部署

- 环境准备

- 安装包

- 配置

## 1.1 环境准备

​     kylin-server-v10

## 1.2 安装包

### 1.3 安装openjdk

```
从yum 源安装：
yum install -y java-11-openjdk

alternatives --config java 

输入 1， 切换java 版本到java-11

从二进制安装：

下载openjdk21:

 wget wget https://download.java.net/java/GA/jdk24.0.1/24a58e0e276943138bf3e963e6291ac2/9/GPL/openjdk-21.0.2_linux-aarch64_bin.tar.gz

解压：
tar -zxvf openjdk-21.0.2_linux-aarch64_bin.tar.gz -C /opt

本文使用二进制安装。
```



## 1.3 安装jenkins 服务

#### 启动方式1

```
rpm包下载地址：https://get.jenkins.io/redhat-stable/ https://mirrors.tuna.tsinghua.edu.cn/jenkins/redhat-stable/

rpm -ivh jenkins-2.462.1-1.1.noarch.rpm

启动服务：

systemctl enable --now jenkins

journalctl -u jenkins -f # 实时查看日志

查看服务：

......

/usr/bin/java -Djava.awt.headless=true -jar /usr/share/java/jenkins.war --webroot=/var/cache/jenkins/war --httpPort=8080
```



####  启动方式2

```
1. war 包下载： https://updates.jenkins.io/download/war/

2. wget https://updates.jenkins.io/download/war/2.504.3/jenkins.war

3. 新建 jenkins.service

[root@localhost jjw]# cat /usr/lib/systemd/system/jenkins.service

[Unit]

Description=Extendable continuous integration server

Requires=network.target

After=network.target

[Service]

User=jenkins

Group=jenkins

Type=exec

EnvironmentFile=/etc/default/jenkins

ExecStart=/bin/sh -c 'eval $JENKINS_COMMAND_LINE'

SuccessExitStatus=143

[Install]

WantedBy=multi-user.target


4. 新建环境变量文件 /etc/default/jenkins：

[root@localhost jjw]# cat /etc/default/jenkins 

JAVA=/opt/jdk-21.0.2/bin/java

JAVA_OPTS=-Djava.awt.headless=true

JENKINS_HOME=/var/lib/jenkins

JENKINS_USER=jenkins

JENKINS_WAR=/usr/share/jenkins/jenkins.war

JENKINS_WEBROOT=/var/cache/jenkins

JENKINS_PORT=8000

JENKINS_LOG=/var/log/jenkins/jenkins.log

JENKINS_COMMAND_LINE="$JAVA $JAVA_OPTS -jar $JENKINS_WAR --webroot=$JENKINS_WEBROOT --httpPort=$JENKINS_PORT"

5. 新建用户及用户组jenkins:

groupadd jenkins

user add -g jenkins jenkins

6. 新建/var/cache/jenkins目录

mkdir -p /var/cache/jenkins

chown -R jenkins:jenkins /var/cache/jenkins

chown 755 /var/cache/jenkins

7. 新建/var/lib/jenkins目录

mkdir -p /var/lib/jenkins

chown -R jenkins:jenkins /var/lib/jenkins

chown 755 /var/lib/jenkins


8. 查看服务：

.....

/opt/jdk-21.0.2/bin/java  -jar /usr/share/jenkins/jenkins.war --webroot=/var/cache/jenkins --httpPort=8000

前两步也可以直接通过修改rpm包中jenkins.service实现, 修改ExecStart项即可

升级后需要替换jenkins.war文件即可

这里openjdk 只能使用17~21的版本，太高的版本.war不支持
```



# 2. 配置

1. 登录 `http//host_ip:8000`
2. 输入初始密码：密码存在`/var/lib/jenkins/secrets/initialAdminPassword`，等待第一次安装完成
3. 修改`admin`用户密码：`123456`
4. 安装插件`gitea、github、git、kubernetes`等