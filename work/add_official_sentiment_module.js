const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "outputs", "growth_indices_dashboard.html");
const DATA_FILE = path.join(ROOT, "work", "official_sentiment_data.json");
const EVENTS_FILE = path.join(ROOT, "work", "official_sentiment_events.json");

function stripExisting(html) {
  return html
    .replace(/\s*<section class="module-shell" id="official-sentiment">[\s\S]*?<\/section>/g, "")
    .replace(/\s*<style id="official-sentiment-style">[\s\S]*?<\/style>/g, "")
    .replace(/\s*<script id="official-sentiment-script">[\s\S]*?<\/script>/g, "")
    .replace(/\s*<a href="#official-sentiment"[^>]*>情绪-官方<\/a>/g, "");
}

const css = `
  <style id="official-sentiment-style">
    .official-grid {
      display: grid; grid-template-columns: minmax(0, 1.68fr) minmax(360px, .82fr);
      gap: 15px; align-items: stretch;
    }
    #officialSentimentChart { height: 500px; width: 100%; }
    @media (max-width: 980px) {
      .official-grid { grid-template-columns: 1fr; }
      #officialSentimentChart { height: 450px; }
    }
  </style>
`;

const moduleHtml = `
  <section class="module-shell" id="official-sentiment">
    <div class="module-head">
      <div>
        <div class="module-kicker">Module 04 / Official Sentiment</div>
        <h2>情绪-官方</h2>
        <p>观察政策层面的融资供给、交易成本、货币环境和监管信号，识别官方对市场温度的调节。</p>
      </div>
      <div class="module-status">IPO 2010年至今 / 宏观与利率月频 / 政策事件库</div>
    </div>

    <div class="official-grid">
      <article class="valuation-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">连续走势图</div>
            <div class="panel-subtitle" id="officialMetricSubtitle">IPO月度融资额</div>
          </div>
          <div class="range-tabs" id="officialRangeTabs">
            <button class="range-tab" data-years="3">3年</button>
            <button class="range-tab" data-years="5">5年</button>
            <button class="range-tab active" data-years="0">全部</button>
          </div>
        </div>
        <div class="metric-tabs" id="officialMetricTabs">
          <button class="metric-tab active" data-metric="ipoFund">IPO融资额</button>
          <button class="metric-tab" disabled title="缺少稳定可自动更新的全市场再融资金额接口">再融资额</button>
          <button class="metric-tab" data-metric="holderNetReductionAmount">产业资本净减持额</button>
          <button class="metric-tab" data-metric="stampDutyRate">印花税率</button>
          <button class="metric-tab" data-metric="lpr1y">政策利率</button>
          <button class="metric-tab" data-metric="socialFinancing">社融增量</button>
          <button class="metric-tab" data-metric="m2Yoy">M2增速</button>
          <button class="metric-tab" disabled title="国家队持仓规模没有统一官方连续披露口径">国家队持仓规模</button>
        </div>
        <div class="metric-note">
          <span id="officialMetricNote">IPO融资额反映一级市场供给压力，阶段性收紧通常对应官方稳定市场取向。</span>
          <span class="metric-reading" id="officialLatestReading"></span>
        </div>
        <div id="officialSentimentChart"></div>
      </article>

      <aside class="valuation-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">官方情绪事件 List</div>
            <div class="panel-subtitle">加息/降息、降准、IPO节奏、印花税、减持监管、汇金增持与窗口指导</div>
          </div>
          <div class="event-controls">
            <select id="officialEventYear" class="event-select" aria-label="官方事件年份"></select>
            <select id="officialEventQuarter" class="event-select" aria-label="官方事件季度">
              <option value="Q1">Q1</option><option value="Q2">Q2</option>
              <option value="Q3">Q3</option><option value="Q4">Q4</option>
            </select>
          </div>
        </div>
        <div class="event-body">
          <div class="quarter-summary">
            <div class="quarter-label" id="officialEventPeriod"></div>
            <div class="event-count" id="officialEventCount"></div>
          </div>
          <div class="quarter-dashboard" id="officialQuarterDashboard"></div>
          <ul class="event-list" id="officialEventList"></ul>
        </div>
      </aside>
    </div>

    <div class="valuation-foot">
      <div class="note"><strong>连续数据口径：</strong>IPO融资额来自新股上市募集资金；产业资本净减持额用重要股东增减持公告和均价估算，正值为净减持；LPR、社融、M2为月频宏观数据。</div>
      <div class="note"><strong>缺口说明：</strong>再融资额与国家队持仓规模缺少稳定、统一、可自动更新的官方连续口径，当前先保留指标入口并在事件库中记录重要政策窗口。</div>
    </div>
  </section>
`;

const script = `
  <script id="official-sentiment-script">
  (() => {
    const officialData = __OFFICIAL_DATA__;
    const officialEvents = __OFFICIAL_EVENTS__;
    const fmt = (value, digits = 1) => Number.isFinite(value)
      ? Number(value).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits })
      : "--";
    const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
    const metrics = {
      ipoFund: {
        title: "IPO融资额", unit: "亿元", digits: 1,
        subtitle: "新股上市月度募集资金合计",
        note: "IPO融资额反映一级市场供给压力，阶段性收紧通常对应官方稳定市场取向。"
      },
      holderNetReductionAmount: {
        title: "产业资本净减持额", unit: "亿元", digits: 1,
        subtitle: "重要股东公告口径的月度净减持金额估算",
        note: "正值为净减持，负值为净增持；仅统计有成交均价的增减持记录。"
      },
      stampDutyRate: {
        title: "印花税率", unit: "%", digits: 2,
        subtitle: "证券交易印花税卖出端税率",
        note: "印花税率下降是官方降低交易成本、活跃资本市场的直接信号。"
      },
      lpr1y: {
        title: "1年期LPR", unit: "%", digits: 2,
        subtitle: "1年期贷款市场报价利率",
        note: "政策利率下行降低折现率，并常与稳增长政策组合一起影响风险偏好。"
      },
      socialFinancing: {
        title: "社融增量", unit: "亿元", digits: 0,
        subtitle: "社会融资规模月度增量",
        note: "社融增量反映信用扩张力度，持续改善通常有利于盈利预期和风险偏好。"
      },
      m2Yoy: {
        title: "M2同比增速", unit: "%", digits: 1,
        subtitle: "货币供应量M2同比增速",
        note: "M2增速体现广义流动性环境，需要与社融和政策利率结合观察。"
      }
    };
    let activeMetric = "ipoFund";
    let activeYears = 0;
    const chart = echarts.init(document.getElementById("officialSentimentChart"), null, { renderer: "canvas" });

    function activeRows() {
      const rows = officialData.series.filter(row => Number.isFinite(row[activeMetric]));
      if (!activeYears || !rows.length) return rows;
      const end = new Date(rows[rows.length - 1].date + "T00:00:00Z");
      const cutoff = new Date(end);
      cutoff.setUTCFullYear(cutoff.getUTCFullYear() - activeYears);
      return rows.filter(row => new Date(row.date + "T00:00:00Z") >= cutoff);
    }
    function renderChart() {
      const cfg = metrics[activeMetric];
      const rows = activeRows();
      const points = rows.map(row => [row.date, row[activeMetric]]);
      const latest = points[points.length - 1]?.[1];
      document.getElementById("officialMetricSubtitle").textContent = cfg.subtitle;
      document.getElementById("officialMetricNote").textContent = cfg.note;
      document.getElementById("officialLatestReading").textContent =
        "最新：" + fmt(latest, cfg.digits) + cfg.unit;
      chart.setOption({
        animation: false, backgroundColor: "transparent",
        grid: { left: 72, right: 28, top: 42, bottom: 64 },
        tooltip: {
          trigger: "axis", axisPointer: { type: "cross" },
          backgroundColor: "rgba(7,17,31,.96)", borderColor: "#36506f",
          textStyle: { color: "#edf4ff" },
          formatter(params) {
            const item = params[0];
            return "<b>" + (item?.axisValueLabel || "") + "</b><br>" +
              item.marker + cfg.title + "：<b>" + fmt(Number(item.value[1]), cfg.digits) + cfg.unit + "</b>";
          }
        },
        xAxis: {
          type: "time", axisLine: { lineStyle: { color: "#344760" } },
          axisLabel: { color: "#7890aa", hideOverlap: true }, splitLine: { show: false }
        },
        yAxis: {
          type: "value", scale: true,
          axisLabel: { color: "#7890aa", formatter: "{value}" + cfg.unit },
          splitLine: { lineStyle: { color: "#17283d" } }
        },
        dataZoom: [
          { type: "inside", filterMode: "none", start: 0, end: 100 },
          { type: "slider", bottom: 12, height: 22, start: 0, end: 100,
            borderColor: "#263b58", backgroundColor: "#0d1929",
            fillerColor: "rgba(255,93,115,.15)", handleStyle: { color: "#ff5d73" },
            textStyle: { color: "#8fa5bf" } }
        ],
        series: [{
          name: cfg.title, type: "line", data: points, showSymbol: false,
          sampling: "lttb", lineStyle: { width: 2.2, color: "#ff5d73" },
          areaStyle: { color: "rgba(255,93,115,.07)" }, itemStyle: { color: "#ff5d73" }
        }]
      }, true);
    }
    document.querySelectorAll("#officialMetricTabs [data-metric]").forEach(button => {
      button.addEventListener("click", () => {
        activeMetric = button.dataset.metric;
        document.querySelectorAll("#officialMetricTabs [data-metric]").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        renderChart();
      });
    });
    document.querySelectorAll("#officialRangeTabs [data-years]").forEach(button => {
      button.addEventListener("click", () => {
        activeYears = Number(button.dataset.years);
        document.querySelectorAll("#officialRangeTabs [data-years]").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        renderChart();
      });
    });

    const yearSelect = document.getElementById("officialEventYear");
    const quarterSelect = document.getElementById("officialEventQuarter");
    const latestDate = officialData.series[officialData.series.length - 1].date;
    const latestYear = Number(latestDate.slice(0, 4));
    const latestQuarter = "Q" + Math.ceil(Number(latestDate.slice(5, 7)) / 3);
    for (let year = latestYear; year >= 2006; year--) {
      const option = document.createElement("option");
      option.value = String(year); option.textContent = String(year);
      yearSelect.appendChild(option);
    }
    yearSelect.value = String(latestYear);
    quarterSelect.value = latestQuarter;
    function quarterKey(date) {
      return date.slice(0, 4) + "-Q" + Math.ceil(Number(date.slice(5, 7)) / 3);
    }
    function quarterRows(key) {
      return officialData.series.filter(row => quarterKey(row.date) === key);
    }
    function quarterSum(rows, field) {
      const values = rows.map(row => row[field]).filter(Number.isFinite);
      return values.length ? values.reduce((sum, value) => sum + value, 0) : NaN;
    }
    function renderEvents() {
      const key = yearSelect.value + "-" + quarterSelect.value;
      const events = officialEvents[key] || [];
      const rows = quarterRows(key);
      const row = rows[rows.length - 1];
      document.getElementById("officialEventPeriod").textContent =
        yearSelect.value + " " + quarterSelect.value;
      document.getElementById("officialEventCount").textContent = events.length + " 条事件";
      document.getElementById("officialQuarterDashboard").innerHTML = [
        ["IPO融资额", Number.isFinite(quarterSum(rows, "ipoFund")) ? fmt(quarterSum(rows, "ipoFund"), 1) + "亿元" : "暂无数据"],
        ["产业资本净减持", Number.isFinite(quarterSum(rows, "holderNetReductionAmount")) ? fmt(quarterSum(rows, "holderNetReductionAmount"), 1) + "亿元" : "暂无数据"],
        ["1年LPR", Number.isFinite(row?.lpr1y) ? fmt(row.lpr1y, 2) + "%" : "暂无数据"],
        ["M2同比", Number.isFinite(row?.m2Yoy) ? fmt(row.m2Yoy, 1) + "%" : "暂无数据"]
      ].map(item => '<div class="quarter-stat"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>').join("");
      document.getElementById("officialEventList").innerHTML = events.length ? events.map(event =>
        '<li class="event-item">' +
        '<div class="event-type">' + escapeHtml(event.type) + '</div>' +
        '<div class="event-title">' + escapeHtml(event.title) + '</div>' +
        '<div class="event-desc">' + escapeHtml(event.desc) + '</div>' +
        '<div class="event-meta">' + escapeHtml(event.meta || "") + '</div></li>'
      ).join("") : '<li class="event-empty">该季度暂无符合官方情绪事件口径的记录</li>';
    }
    yearSelect.addEventListener("change", renderEvents);
    quarterSelect.addEventListener("change", renderEvents);
    window.addEventListener("resize", () => chart.resize());
    renderChart();
    renderEvents();
  })();
  </script>
`;

if (!fs.existsSync(DATA_FILE)) throw new Error("Missing official_sentiment_data.json.");
if (!fs.existsSync(EVENTS_FILE)) throw new Error("Missing official_sentiment_events.json.");
const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const events = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
let html = stripExisting(fs.readFileSync(OUTPUT, "utf8"));
html = html.replace(
  '<a href="#large-money-sentiment">情绪-大资金</a>',
  '<a href="#large-money-sentiment">情绪-大资金</a><a href="#official-sentiment">情绪-官方</a>'
);
function insertBeforeLast(source, marker, content) {
  const index = source.lastIndexOf(marker);
  if (index === -1) throw new Error(`Marker not found: ${marker}`);
  return source.slice(0, index) + content + source.slice(index);
}
const officialScript = script
  .replace("__OFFICIAL_DATA__", JSON.stringify(data))
  .replace("__OFFICIAL_EVENTS__", JSON.stringify(events.quarters));
html = insertBeforeLast(html, "</head>", css + "\n");
html = insertBeforeLast(html, "</main>", moduleHtml + "\n");
html = insertBeforeLast(html, "</body>", officialScript + "\n");
fs.writeFileSync(OUTPUT, html, "utf8");
console.log(JSON.stringify({ output: OUTPUT, bytes: fs.statSync(OUTPUT).size }, null, 2));
