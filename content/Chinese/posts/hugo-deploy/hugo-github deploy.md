---
title: "Hugo + Github pages部署"
date: 2025-06-09
draft: false
author: "肖青山"
lastmod: 2025-06-15
draft: false
categories: ["Deploy", "Hugo"]
tags: ["Hugo", "PaperMod", "github"]
translationKey: false
---



- 环境准备
- 安装 `hugo`
- 创建 `hugo` 博客项目
- 本地访问
- 部署到`github pages` 



# 1. 环境准备

windows 10 桌面

## 1.1 安装 git 客户端

https://git-scm.com/downloads



# 2. 安装 hugo

## 2.1 先安装 [Chocolatey](https://chocolatey.org/install)（Windows 包管理器）

用管理员方式打开powershell

```
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

## 2.2 通过 Chocolatey 安装 Hugo

```
choco install hugo-extended -y
```

## 2.3 验证安装

```
hugo version
```



# 3. 创建 `hugo` 博客项目

## 3.1 生成新站点

在任意目录下，本文在 D：目录

```
cd d:
hugo new site my-blog
cd my-blog
```

## 3.2 克隆主题到本地（以 [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 为例）

参考：https://adityatelange.github.io/hugo-PaperMod/posts/papermod/papermod-installation/

```
git init
git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod --depth=1
```

## 3.3 配置主题

修改hugo.yml

```
baseURL = 'https://qingshanxiao292311.github.io/'   # baseurl 为 https://<github repository> 地址
languageCode = 'zh-cn'
title = 'My New Hugo Site'                          # 标题
theme = 'PaperMod'                                  # 主题，如果用github上的，可以使用remote-theme：xxx定义
```



# 4. 本地访问博客

使用 hugo 命令创建

```
1. hugo new content posts\first.md

在my-blog/content/posts 下即生成了一个markdown格式的文章

2. 编辑 first.md
---
title: "我的第一篇文章"
date: 2025-06-09
draft: false  # 设为 false 发布
---

3. 启动本地服务器： hugo server -D 
4. 浏览器访问： http://localhost:1313  # 实时预览效果（修改内容会自动刷新）
```

 

# 5. 部署到 GitHub Pages

## 5.1 创建 GitHub 仓库

在 `github` 下新建 `repository_name`:  <用户名.`github.io`> , 用于用户站点访问。其中仓库名必须是 <用户名.`github.io`>

新建仓库名 `qingshanxiao292311.github.io`

![repository name](repo.jpg)

## 5.2 配置 GitHub Actions

在博客根目录创建 `.github/workflows/deploy.yml`：

  - ```
    name: Deploy Hugo site to GitHub Pages
    
    on:
      push:
        branches:
    
       - main
    
    jobs:
      build-deploy:
        runs-on: ubuntu-latest
        steps:
    
       - name: Checkout
         uses: actions/checkout@v4
         with:
           submodules: true
           fetch-depth: 0
    
       - name: Setup Hugo
         uses: peaceiris/actions-hugo@v3
            with:
         hugo-version: 'latest'
         extended: true
    
      - name: Build
        run: hugo --minify
    
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
    ```
    
    

## 5.3 提交代码到仓库

```
cd my-blog

git branch -M main
git add .
git commit -m "Initial Huge site"
git remote add origin https://github.com/<你的用户名>/<你的用户名>.github.io.git
git push -u origin main
```

##  5.4 访问博客

等待 Actions 完成（约1分钟），访问 `https://<你的用户名>.github.io`



# 6. 部署遇到的问题

## 6.1 提交代码无权限

```

/usr/bin/git push origin gh-pages 
remote: Permission to qingshanxiao292311/xiaoqingshan.github.io.git denied to github-actions[bot].  
fatal: unable to access 
'https://github.com/qingshanxiao292311/xiaoqingshan.github.io.git/': The requested URL returned error: 403 
Error: Action failed with "The process '/usr/bin/git' failed with exit code 128"
```

**仓库 Settings → Actions → General** 中调整：

- 找到 **Workflow permissions**，勾选 **Read and write permissions**

