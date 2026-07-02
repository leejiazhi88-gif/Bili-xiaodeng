# BigA-growth 本地说明

这个工程是按 `Bili Atotal / BigA-total` 模仿出的成长指数版，当前目标指数为：

- 创业板指：`399006.SZ`
- 科创综指：`000680.SH`

GitHub 仓库：

```text
https://github.com/leejiazhi88-gif/Bili-xiaodeng
```

线上页面：

```text
https://leejiazhi88-gif.github.io/Bili-xiaodeng/
```

## 本机路径

```text
/Users/fuguiplus/Documents/Codex/2026-07-02/bi/work/BigA-growth
```

主要页面文件：

```text
index.html
outputs/growth_indices_dashboard.html
```

## 本地运行

生成页面：

```bash
node ./work/build_market_dashboard.js
```

本地预览：

```bash
node ./work/preview_server.js
```

然后打开：

```text
http://127.0.0.1:9876
```

## 数据限制

Tushare 当前可以返回：

- 创业板指 `399006.SZ`：价格、PE(TTM)、PB
- 科创综指 `000680.SH`：价格

Tushare 当前没有返回科创综指 `index_dailybasic` 的 PE/PB 序列，所以科创综指的 PE、PB、滚动盈利、股债收益差在页面内显示为暂无数据。

## 同步与部署

每次修改后：

```bash
git pull --rebase
node ./work/build_market_dashboard.js
git add .
git commit -m "描述这次修改"
git push
```

GitHub Pages 使用 `main` 分支根目录发布，推送后线上页面会自动更新。Pages/CDN 可能有几分钟缓存。
