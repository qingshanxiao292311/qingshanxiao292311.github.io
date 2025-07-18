---
title: "k8s+gitea+jenkins搭建CI环境"
date: 2025-04-12
draft: false
author: "肖青山"
lastmod: 2025-06-23
draft: false  # 设为 false 发布
categories: ["git"]
tags: ["jenkins", "gitea", "k8s"]
---



记录一下利用 Gitea 存储代码、Jenkins 进行持续集成 (CI)，并在 Kubernetes (K8s) 中拉取容器编译代码的 CI/CD 流程。

# 1. 环境搭建

环境搭建包括gitea部署，jenkins部署和k8s部署。

## 1.1 gitea 部署

[gitea部署](https://qingshanxiao292311.github.io/zh/posts/deploy/gitea-%E6%9C%AC%E5%9C%B0%E9%83%A8%E7%BD%B2/)

## 1.2 jenkins 部署

[jenkins部署](https://qingshanxiao292311.github.io/zh/posts/deploy/jenkins-%E6%9C%AC%E5%9C%B0%E9%83%A8%E7%BD%B2/)



## 1.3 k8s部署

[k8s master节点部署](https://blog.csdn.net/qq_35721743/article/details/146638816?spm=1001.2014.3001.5501)

[k8s node节点部署](https://blog.csdn.net/qq_35721743/article/details/146965262?spm=1001.2014.3001.5501)

[k8s 网络插件部署](https://blog.csdn.net/qq_35721743/article/details/146969984?spm=1001.2014.3001.5501)



# 2. Gitea 配置

## 2.1 organization 

1. 使用管理员登录Gitea 管理平台

2. 添加一个organization

   ![新建 organization](/images/ci/organization.png)

3. 给组织设置webhook

   ![设置 webhook](/images/ci/webhook.png)

​        Target URL设置： 例如http://10.0.0.190:8000/gitea-webhook/post， 10.0.0.190是jenkins服务所在的主机IP， 8000是jenkins服务端口

4. 设置Trigger

​        ![设置触发选项](/images/ci/trigger.png)

5. 设置 pull request

    ![设置 pullrequest 选项](/images/ci/pull-request.png)

​       点击 Update Webhook更新设置



## 2.2 repository 

1. 新建repository

   ![新建reposiroty](/images/ci/repository.png)

2. 设置webhook

   repository 的webhook设置与organization的webhook完全一致。

3. 检查仓库webhook联通性

   **注意：这步需要在Jenkins设置好后才可以验证。**

    点击 Test Delivery，可以测试Gitea到Jenkins服务是否连通，注意需要先启动Jenkins服务。

   ![Test Delivery](/images/ci/test-delivery.png)

   "红色感叹号"代表不通：没有响应

   ![Delivery Error](/images/ci/Delivery-error.png)

   ```
   Delivery: Post "http://10.0.0.190:8000/gitea-webhook/post": dial tcp 10.0.0.190:8000: webhook can only call allowed HTTP servers (check your webhook.ALLOWED_HOST_LIST setting), deny '10.0.0.190(10.0.0.190:8000)'	
   ```

   

## 2.3 修改配置文件

修改Gitea配置文件app.ini，添加如下内容，可以修复2.2小节的步骤3出现的问题。

```
[webhook]
ALLOWED_HOST_LIST = *或10.0.0.190
```



## 2.4 生成 Token

这个token用于Jenkins可以通过安装的Gitea插件访问Gitea，扫描和拉取代码。

点击右上角用户：

![Gitea Token](/images/ci/gitea-token.png)

设置token名，设置相应的read或read/write权限，点击Generate Token即可产生Token，复制下这个Token，需要放到Jenkins的Cerdentials中去。

![Generate Token](/images/ci/gitea-create-token.png)



# 3. Jenkins 设置

## 3.1 Install Plugin

由于需要从gitea拉取代码，并利用k8s拉取镜像编译代码，所以需要安装必要的插件。安装 Kubernetes，Gitea.

![Plugins](/images/ci/plugin-install.png)

在Available plugins 中搜索需要安装的插件，点击右上角的"Install" 即可安装。

安装好后在Install plugins可以查看：

![Kubernetes Plugin](/images/ci/k8s-plugin.png)

![Gitea plugin](/images/ci/gitea-plugin.png)



## 3.2 System Configuration

点击 Manage Jenkins->System Configuration->system:

![System Configure](/images/ci/system-configure.png)

![Jenkins URL](/images/ci/jenkins-url.png)

![Gitea Server](/images/ci/gitea-server.png)

Gitea Server 添加访问Gitea页面的URL，添加后会正确显示Gitea的版本。这个Gitea版本就是1.24.0。

设置后保存即可。



## 3.3 Add Cerdentials 

添加证书用于访问Gitea和Kubernetes。

### 3.3.1 添加Gitea Credential

点击 Manage Jenkins->Cerdentials。

![Add Cerdentials](/images/ci/add-credentials.png)

添加访问Gitea的Credentials：

Kind选择Gitea Personal Access Token，Token输入2.4小节保存的Token，ID和Description 自定义。

![Add Gitea Credentials](/images/ci/gitea-credentials.png)

### 3.3.2 添加 Kubernetes Credential

添加Kubernetes Credential与添加Gitea Credential步骤一样，只是在Kind选择时有所不同：

1. Kind 可以选择Screct file，这是只需要添加k8s的config文件即可。本文部署的k8s的 config配置文件路径在master节点的~/.kube/下。

![Screct file](/images/ci/screct-file.png)

2. Kind 可以选择Screct text，本文采用的这种方式。

   这种方式需要先获取K8s的Token，k8s在1.24+版本之后需要手动生成Token，步骤如下：

   ```
   创建命名空间devops：
   kubectl create ns devops;
   创建服务账号jenkins:
   kubectl create sa jenkins -n devops  #创建服务账号jenkins属于命名空间devops, sa是serviceaccounts的缩写
   绑定集群角色：
   kubectl create clusterrolebinding jenkins --clusterrole=cluster-admin --serviceaccount=devops:jenkins
   
   k8s 1.24+之后手动生成token:
   kubectl create token jenkins --duration=8760h  # 有效期 1 年
   
   ```

**复制kubectl create 产生的Token**。

添加完成后可以看到：

![credentials](/images/ci/credentials.png)



## 3.4  Add Clouds

配置Jenkins通过Kubernetes插件与Kubernetes连接。

### 3.4.1 New cloud

点击 Manage Jenkins ---> Clouds-->New cloud.

输入cloud name，Type选择Kubernetes，点击Create。

![New Cloud](/images/ci/new-cloud.png)

### 3.4.2 Cloud Configure

![K8s address](/images/ci/cloud-cfg.png)

- 名称: 继承上个步骤输入的；
- Kubernetes地址: Kubernetes集群kube-apiserver所在节点的IP和端口，如果地址不通会有提示；
- 禁用https检查；
- Kubernetes 命令空间：输入3.3.2步骤创建的

![add k8s credential](/images/ci/add-k8s-token.png)

- 凭据：选择3.3.2步骤添加的k8s credentials；
- 勾选websocket；
- Jenkins地址：填写Jenkins服务的主机IP与服务端口号。

![Pod Label](/images/ci/pod-Lable.png)

- Pod Lable:  标签自定义一个，后续在Pod的yaml文件中能看到这个。
- Pod Retetion：Pod 保留策略，always是永久保存。

其他默认，最后点击保存即可。



# 4 上传代码到Gitea

## 4.1 编写Jenkinsfile文件

基于Jenkins Kubernetes插件的podTemplate编写Jenkinsfile文件，例如：

```
podTemplate(
  podRetention: always(),
  containers: [
    containerTemplate(
      name: 'c-builder-env1',
      image: 'registry.example.com/c-builder-env1:latest', // 替换为你的私有镜像地址
      ttyEnabled: true,
      command: 'cat',
      imagePullSecrets: 'docker-registry-credentials' // Jenkins中配置的Kubernetes Secret名称
    ),
  ]
) {
  node(POD_LABEL) {
    stage('Checkout') {
      checkout scm              // 依赖Jenkins任务配置的SCM，检出代码
    }

    stage('Build in env1') {
      container('c-builder-env1') {
        withEnv(['PATH+EXTRA=/opt/build-tools']) { // 替换为你的工具路径
          sh '''#!/bin/bash
          set -exo pipefail
          chmod +x ./build.sh
          bash ./build.sh
          '''
        }
      }
    }

    stage('Test') {
      container('c-builder-env1') { // 示例：使用env1运行测试
        withEnv(['PATH+EXTRA=/opt/build-tools']) {
          sh '''#!/bin/bash
          set -exo pipefail
          // 替换为你的测试命令，例如：
          bash ./run-tests.sh // 假设有测试脚本
          '''
        }
      }
    }
  }
}
```



## 4.2 上传源代码

将Jenkinsfile文件和源代码上传到 Gitea 仓库。这个很重要，因为Jenkins是根据Jenkinsfile文件来进行流水线作业的。并且这个Jenkinsfile文件要放在源代码的根目录下。

![Jenkinsfile](/images/ci/jenkinsfile.png)

# 5 Jenkins New Item

## 5.1 新建 Organization Folder

![New Item](/images/ci/new-item.png)

- Item name:  输入Gitea 上的organization名，大小写必须一致；
- 选择Organization Folder

## 5.2 configure

对新建的组织文件夹进行配置。

![Organization Configure](/images/ci/organization-cfg.png)

- Display Name: 设置的organization名；
- Repository Sources: 选择 Gitea Organization，并配置Server 和 Credentials
- Owner: 必须与 Gitea的Organization 一致。

![Pipeline Jenkinsfile](/images/ci/pipeline-jenkinsfile.png)

这就是上文要添加Jenkinsfile的原因，不然Jenkins扫描不到组织下的仓库。

点击保存即设置完成。



# 6. 触发Jenkins 

1. 手动触发

![Trigger Jenkins](/images/ci/hand-trigger.png)

2. 自动触发

   对Gitea组织下仓库的webhook设置触发条件（2.1小节），pull request 就会自动触发Jenkins调用k8s创建POD编译。 

3. 点击某次编译的Console Output，可以看到详细的编译过程

   ![Console Output](/images/ci/console-output.png)

   4. k8s上自动创建的POD

      ![k8s pod](/images/ci/k8s-pod.png)

      进入容器的/home/jenkins/agent/workspace/xxx下，即可看到源代码。

​    

# 7. 搭建过程遇到的问题

## 问题1：没有自动触发Jenkins

从Gitea上pull request 分支代码到主分支，没有成功触发Jenkins。这就是2.2小节第3步的问题，通过2.3解决。

## 问题2：镜像拉取失败

**现象：**

1. 从本地镜像仓库拉取spice-vdagent-ks10-builder:v1.5.1镜像失败，配置的本地私有镜像仓库地址是http://xxxx，但是却从https://xxx拉取；
2. jenkins/inbound-agent:3309.v27b_9314fd1a_4-1镜像拉取失败；

这是k8s的容器运行时containerd 拉取镜像的地址设置不对导致。

```
[PodInfo] devops/spice-vd-agent-master-3-jg7c8-6hq6d-6fh7s
	Container [jnlp] waiting [ErrImagePull] failed to pull and unpack image "oci.docker.com/jenkins/inbound-agent:3309.v27b_9314fd1a_4-1": failed to resolve reference "oci.docker.com/jenkins/inbound-agent:3309.v27b_9314fd1a_4-1": failed to do request: Head "https://oci.docker.com/v2/jenkins/inbound-agent/manifests/3309.v27b_9314fd1a_4-1": dial tcp 192.168.1.71:443: connect: connection refused
	Container [spice-vdagent-ks10-builder] waiting [ErrImagePull] failed to pull and unpack image "oci.docker.com/spice-vdagent-ks10-builder:v1.5.1": failed to resolve reference "oci.docker.com/spice-vdagent-ks10-builder:v1.5.1": failed to do request: Head "https://oci.docker.com/v2/spice-vdagent-ks10-builder/manifests/v1.5.1": dial tcp 192.168.1.71:443: connect: connection refused

```

使用的containerd是v2.0.0版本。

**解决办法：**

- 修改containerd的配置文件config.toml。默认目录是/etc/containerd/，添加config_path = "xxx"，注意最后一级目录

```
      [plugins.'io.containerd.cri.v1.images'.registry]
        config_path = '/etc/containerd/certs.d'       

```

- 新建文件 /etc/containerd/certs.d/oci.docker.com/hosts.toml 

- 修改hosts.toml

  ```
  # 定义服务器的基地址
  server = "http://oci.docker.com"
  
  [host."http://oci.docker.com"]
    # 如果仓库是 HTTP 或使用自签名证书，需要设置这个
    skip_verify = true
    capabilities = ["pull", "resolve"]
  
  ```

- 由于本地镜像仓库没有上传 inbound-agent:3309.v27b_9314fd1a_4-1镜像，所以拉取失败，配置国内源解决

- 新建文件 /etc/containerd/certs.d/docker.io/hosts.toml 

  ```
  server = "https://docker.xuanyuan.me"
  
  # 为 docker.io 配置镜像加速器 (mirrors)
  [host."https://docker.xuanyuan.me"]
    capabilities = ["pull", "resolve"]
    override_path = false             # 这个很重要，表示这是一个镜像而不是路径覆盖
   
  
  ```

  重启containerd容器。

至此搭建和测试完成！



