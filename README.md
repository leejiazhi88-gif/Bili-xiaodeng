# 成长指数研究仪表盘

这个工程模仿 `Bili Atotal / BigA-total` 的结构与视觉风格，但总览指数改为：

- 创业板指：`399006.SZ`
- 科创综指：`000680.SH`

GitHub 仓库：https://github.com/leejiazhi88-gif/Bili-xiaodeng

线上页面：https://leejiazhi88-gif.github.io/Bili-xiaodeng/

目前包含：

- 总览：创业板指、科创综指的价格走势
- 创业板估值：PE(TTM)、滚动盈利、PB 历史分位
- 估值事件 List：按年份和季度切换查看典型估值事件
- 情绪-散户模块：两市成交额、换手率、融资余额、融资余额/流通市值、涨停数量
- 情绪-大资金模块：大宗交易、机构席位大宗净买入、产业资本增减持、北向资金历史口径

## 运行

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

## 主要文件

- `outputs/growth_indices_dashboard.html`：生成后的仪表盘
- `index.html`：和输出页同步的根页面
- `work/build_market_dashboard.js`：总览生成入口
- `work/fetch_market_overview_data.py`：总览价格、PE(TTM)、滚动盈利数据更新脚本
- `work/market_overview_data.json`：总览数据缓存
- `work/add_valuation_module.js`：估值模块注入脚本
- `work/fetch_valuation_data.py`：PB、股债收益差数据更新脚本
- `work/valuation_data.json`：估值扩展数据缓存

## 数据口径

- 创业板指价格与 PE(TTM)：来自 Tushare `index_daily` / `index_dailybasic`
- 科创综指价格：来自 Tushare `index_daily`
- 滚动盈利点数：指数点位 ÷ PE(TTM)
- PB：来自 Tushare 指数每日指标
- 股债收益差：`100 / PE(TTM) - 10年期国债收益率`

注意：截至当前接口返回，Tushare 暂未提供 `000680.SH` 科创综指的 `index_dailybasic` PE/PB 序列，所以页面中科创综指估值与滚动盈利显示为暂无数据，只保留价格走势。
