---

title: "Hugo & PaperMod 主题配置"
date: 2025-06-25
draft: false
author: "肖青山"
lastmod: 2025-06-26
draft: false  # 设为 false 发布
categories: ["Hugo"]
tags: ["Hugo", "PaperMod"]

---

使用hugo的PaperMod 主题，在默认的基础上进行一些修改，已便更加美观和好用。

# 1. Hugo 文件夹管理

- `archetypes`：不用管
- `asset`：[自定义的 CSS 和 JavaScript](https://www.yunyitang.me/hugo-papermod-blog/#自定义页面布局-htmlcss)
- `content`：用于放博客内容
- `data`：不用管
- `layouts`：[自定义的 HTML](https://www.yunyitang.me/hugo-papermod-blog/#自定义页面布局-htmlcss)
- `public`：项目导出文件 - 用于静态网页部署，`hugo server -D` 生成的网页在这个目录
- `static`：存放图片
- `themes`：主题 - [PaperMod](https://github.com/adityatelange/hugo-PaperMod/)

![hugo 文件夹](/images/hugo/dir.png)

# 2. 自定义config.yml 配置文件

```
baseURL: "https://qingshanxiao292311.github.io"    # github pages 访问url
pagination.pagerSize: 10                           # 单页显示文章数
theme: PaperMod                                    # 主题

hasCJKLanguage: true # 自动检测是否包含中文日文韩文,如果文章中使用了很多中文引号的话可以开启
enableInlineShortcodes: true
enableRobotsTXT: true
buildDrafts: false
buildFuture: false
buildExpired: false
pygmentsUseClasses: true
enableEmoji: true                        # 允许使用 Emoji 表情，建议 true

minify:
  disableXML: true
  # minifyOutput: true
  
permalinks:
  # post: "/:title/"
  post: "/:year/:month/:day/:title/"        
  
defaultContentLanguage: zh                  # 最顶部首先展示的语言页面
defaultContentLanguageInSubdir: true

outputs:                                    # 搜索需要
    home:
        - HTML
        - RSS
        - JSON

params:
  # author: ["肖青山"] # multiple authors
  # images: ["<link or path of image for opengraph, twitter-cards>"]
  defaultTheme: auto  # defaultTheme: light or  dark
  disableThemeToggle: false
  DateFormat: "2006-01-02"
  ShowShareButtons: false   # false, 去除X, IN, FACKBOOK等社交账号的显示
  # ShowReadingTime: true
  disableSpecialistPost: true
  displayFullLangName: true
  # ShowPostNavLinks: true
  ShowBreadCrumbs: true
  ShowCodeCopyButtons: true
  hideFooter: false                           # 隐藏页脚
  # ShowWordCounts: true
  VisitCount: true
  # ShowArchiveLinks: true

  # ShowLastMod: true                         #显示文章更新时间
  comments: false
  hidemeta: false
  hideSummary: false
  showtoc: true                               # 显示目录
  tocopen: true                               # 目录开启
  # enableGitInfo: true
  
languages:
  zh:
    languageName: 简体中文
    languageCode: zh-cn
    weight: 1
    contentDir: content/Chinese               # 内容目录

    title: "肖青山的博客"
    description: ''
    # keywords: [Blog, Portfolio, PaperMod]
    author: 肖青山
    # profile-mode
    params:
      profileMode:
        enabled: true
        title: 每天进步一点，有进步一点的欢喜
        subtitle: "👏🏼欢迎光临我的博客"
        imageUrl: "img/blog.png"
        imageTitle:
        imageWidth: 150
        imageHeight: 150
        buttons:
          - name: 博客
            url: "/zh/posts/"
          - name: Github
            url: "https://github.com/"
    
    menu:                                        # 菜单栏
      main:
        - identifier: home
          name: 🏠 主页
          url: /zh/
          weight: 10
        - identifier: search
          name: 🔍 搜索
          url: /zh/search/
          weight: 20
        - identifier: archive
          name: ⏱ 时间轴
          url: /zh/archives/
          weight: 40
        - identifier: categories
          name: 📁 分类
          url: /zh/categories/
          weight: 50
        - identifier: tags
          name: 🏷️ 标签
          url: /zh/tags/
          weight: 60
        # - identifier: about
        #  name: 👨🏻‍🦱 关于
        #  url: /zh/about/
        # weight: 70
        
  en:
    languageName: English
    languageCode: en
    weight: 2
    contentDir: content/English
    
    title: "Xiaoqingshan's blog"
    description: ''
    # keywords: [Blog, Portfolio, PaperMod]
    author: qingshan Xiao
    # profile-mode
    params:
      profileMode:
        enabled: true
        title: Make a little progress every day, and find joy in each step forward
        subtitle: "👏🏼Welcome to my Blog"
        imageUrl: "img/blog.png"
        imageTitle:
        imageWidth: 150
        imageHeight: 150
        buttons:
          - name: Blog
            url: "/en/posts/"
          - name: Github
            url: "https://github.com/"

    menu:
      main:
        - identifier: home
          name: 🏠 home
          url: /en/
          weight: 10
        - identifier: search
          name: 🔍 search
          url: /en/search/
          weight: 30
        - identifier: archive
          name: ⏱ archive
          url: /en/archives/
          weight: 40
        - identifier: categories
          name: 📁 categories
          url: /en/categories/
          weight: 50
        - identifier: tag
          name: 🏷️ tag
          url: /en/tags/
          weight: 60
        # - identifier: about
        #  name: 👨🏻‍🦱 about
        #  url: /en/about/
        #  weight: 70
markup:
  highlight:
        # anchorLineNos: true
        codeFences: true
        guessSyntax: true
        lineNos: true
        # noClasses: false
        # style: monokai
        style: darcula

        # codeFences：代码围栏功能，这个功能一般都要设为 true 的，不然很难看，就是干巴巴的-代码文字，没有颜色
        # guessSyntax：猜测语法，这个功能建议设置为 true, 如果你没有设置要显示的语言则会自动匹配
        # hl_Lines：高亮的行号，一般这个不设置，因为每个代码块我们可能希望让高亮的地方不一样
        # lineNoStart：行号从编号几开始，一般从 1 开始
        # lineNos：是否显示行号
        # lineNumbersInTable：使用表来格式化行号和代码,而不是 标签。这个属性一般设置为 true
        # noClasses：使用 class 标签，而不是内嵌的内联样式
```



## 2.1 双语设置

如上面的`config.yml`中`languages` 项所示。

```
languages:
  zh:
    ......
  en:
    ......
```

另外添加这两项：

```
defaultContentLanguage: zh                  # 最顶部首先展示的语言页面
defaultContentLanguageInSubdir: true
```



## 2.2 主页自定义

主页使用`Profile Mode`模式，没有使用`Home-Info Mode`和`default-mode`。

具体可以参考：[主页模式](https://github.com/adityatelange/hugo-PaperMod/wiki/Features#home-info-mode)



##  2.2 自定义内容目录

`contentDir`设置的是`content/Chinese` 和 `content/English`，为了匹配双语，必须在`content`目录下新建这两个目录，然后在`Chinese`和`English`下分别建一个`posts`目录，`posts`下的目录可以自定义。

```
├─content
│  ├─Chinese
│  │  └─posts
│  │      └─hugo
│  └─English
│      └─posts
│          └─hugo
```



# 3. 自定义菜单栏

如上面的`config.yml`中的`menu`项：

![菜单栏](/images/hugo/menu.png)

## 3.1 搜索(search)自定义

除了在`config.yml` 开启配置`outputs`项外，还需要在`content/Chinese`和`content/English`下新建`search.md`.

```
---
title: "🔍 搜索" # in any language you want
layout: "search" # is necessary
# description: "Description for Search"
summary: "search"
placeholder: "搜索框内的默认显示"
---
```

## 3.2 归档(archive)自定义

需要在`content/Chinese`和`content/English`下新建`archives.md`.

```
---
title: "⏱ 时间轴"
layout: "archives"
url: "/zh/archives/"
description: "......"
summary: archives
translationKey: archives
---
```

## 3.3 分类(categories)和标签(tags)

由于`PaperMod`默认支持，只需要在文章`xxx.md`的`front matter`中指定即可

```
---

title: "折腾 Hugo & PaperMod 主题"
date: 2025-06-25
draft: false
author: "......"
lastmod: 2025-06-26
draft: false  # 设为 false 发布
categories: ["Hugo"]
tags: ["Hugo", "PaperMod"]

---
```

添加`emoji`图标通过修改`/layouts/_default/term.html` 实现：

先把`themes/PaperMod/layouts/_default/term.html`复制到`layouts/__default/`中，`hugo`根目录下`layouts`的会覆盖`themes/PaperMod`下的，修改成如下即可.

```
<header class="page-header">
    <h1>
	  {{ if eq .Data.Plural "tags" }}🏷️{{ end }}
	  {{ if eq .Data.Plural "categories" }}📁{{ end }}
	  {{ .Title }}
	</h1>
    {{- if .Description }}
    <div class="post-description">
        {{ .Description }}
    </div>
    {{- end }}
</header>
{{- end }}
```

# 4. 文章样式修改

## 4.1 目录字体修改

- 修改文章目录靠左，字体大小
- 修改文章内容宽度等
- 屏蔽目录前的符合(markmod)标识
- 新建`assets/css/extended/custom.css`文件，添加如下内容：

```
/* 目录*/
.toc {
    float: left;
    margin-right: 20px;   /* 目录与文章内容之间的间距 */
    width: 240px;         /* 自定义目录宽度 */
    position: sticky;
    top: 20px;            /* 距离顶部的高度 */
	font-size: 14px;      /* 字体大小 */
}

/* 文章内容更宽 */
.post-content {
    margin-left: 280px;    /* 留出与目录的间距 */
    max-width: none;       /* 移除默认的最大宽度限制 */
    width: 95%;            /* 设置文章内容宽度为容器宽度的90%，可根据需要调整 */
    margin-right: 5%;      /* 右边留出一定间距，避免贴边 */
}

/* 去除目录前的markmod 符号(. o)*/
.toc li::marker {
    content: none;
}


/*适配移动小屏*/
@media screen and (max-width: 768px) {
    .toc {
        float: none;
        width: 100%;
        position: static;
    }
    .post-content {
        margin-left: 0;
        width: 100%;
        margin-right: 0;
    }
}

```

## 4.2 文章字体修改

复制`themes/PaperMod/assets/css/common/post-single.css` 到 `assets/css/common/`，然后修改`font-size`的值.

## 4.3 文章元数据自定义

显示创建时间，更新时间，时长，字数和作者

新建 /layouts/partials/post_meta.html，添加如下内容：

```
<div class="post-meta">
    {{ if .Date }}
        <span class="post-meta-item">
            <span class="icon">📅</span>
            创建: {{ .Date.Format "2006-01-02" }}
        </span>
    {{ end }}

    {{ if and .Lastmod (ne .Lastmod .Date) }}
        <span class="post-meta-item">
            <span class="icon">🔄</span>
            更新: {{ .Lastmod.Format "2006-01-02" }}
        </span>
    {{ end }}

    {{ if .ReadingTime }}
        <span class="post-meta-item">
            <span class="icon">⏳</span>
            时长: {{ .ReadingTime }}分钟
        </span>
    {{ end }}

    {{ if .WordCount }}
        <span class="post-meta-item">
            <span class="icon">📝</span>
            字数: {{ .WordCount }}字
        </span>
    {{ end }}
	
	{{ if .Params.author }}
        <span class="post-meta-item">
            <span class="icon">👤</span>
            {{ .Params.author }}
        </span>
    {{ end }}
</div>
```

调整元数据的显示，在`custom.css`文件，添加如下内容：

```
/**调整文章元数据信息**/
.post-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-bottom: 1.0rem;
    font-size: 0.9rem;
    color: var(--secondary);
}
.post-meta-item {
    display: flex;
    align-items: center;
    gap: 0.2rem;
}
.post-meta .icon {
    opacity: 0.6;
}
```

## 4.4 支持跳转到上/下篇文章

复制`themes/PaperMod/layouts/_default/single.html`到`layouts/_default`/下：

添加：

```
  {{ with .NextInSection }}
  <a class="next" href="{{ .Permalink }}">下一篇：{{ .Title }}</a>
  {{ end }}
  {{ with .PrevInSection }}
  <a class="prev" href="{{ .Permalink }}">上一篇：{{ .Title }}</a>
  {{ end }}
```



设置字体大小，custom.css添加：

```
/*跳转上下篇文章*/
.next, .prev {
    font-size: 15px;
    margin: 10px;
}
```

## 4.5 文章中链接另起页签



新建`assets/js/custom.js`，添加：

```
document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('.post-content a[href^="http"]');
  links.forEach(link => {
    if (link.hostname !== window.location.hostname) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
});

```

复制`themes/PaperMod/layouts/partials/head.html` 到 `layouts/partials/`下：

在最后添加：

```
{{ if resources.Get "js/custom.js" }}
  {{ $customJS := resources.Get "js/custom.js" | resources.Minify | resources.Fingerprint }}
  <script src="{{ $customJS.Permalink }}" integrity="{{ $customJS.Data.Integrity }}" defer></script>
{{ end }}
```



## 4.5 文章字体代码等设置

在 [Google Fonts](https://fonts.google.com/) 中查询开源字体，目前的文章字体为 [JetBrains Mono](https://www.jetbrains.com/lp/mono/)。Google Fonts 会生成 HTML 和 css ，将 HTML 插入到 `layouts/partials/extend_head.html` 中，将 CSS 插入到 `assets/css/extended/blank.css`：

```
extend_head.html:

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">

blank.css:

/* 全文字体
body {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
  # font-style: normal;
}*/

/*代码字体*/
.post-content pre,
code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13;
  line-height: 1.2;
  max-height: 40rem;
}

```

# 5. 参考

https://github.com/adityatelange/hugo-PaperMod/wiki/Features

https://www.shaohanyun.top/posts/env/blog_build2/

https://www.yunyitang.me/hugo-papermod-blog/

https://dvel.me/posts/hugo-papermod-config/
