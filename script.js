(() => {
  "use strict";

  /* ---------------- seeded PRNG helpers ---------------- */

  function hashString(str) {
    let h = 2166136261; // FNV-ish base
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randRange(rand, min, max) {
    return min + rand() * (max - min);
  }

  function pick(rand, arr) {
    return arr[Math.floor(rand() * arr.length)];
  }

  /* ---------------- domain data ---------------- */

  const ELEMENTS = [
    { key: "wood", label: "목(木)", varName: "--ohaeng-wood" },
    { key: "fire", label: "화(火)", varName: "--ohaeng-fire" },
    { key: "earth", label: "토(土)", varName: "--ohaeng-earth" },
    { key: "metal", label: "금(金)", varName: "--ohaeng-metal" },
    { key: "water", label: "수(水)", varName: "--ohaeng-water" },
  ];

  function seasonBias(month) {
    // Traditional seasonal correspondence: spring-wood, summer-fire,
    // autumn-metal, winter-water, with earth as the transitional element.
    if ([3, 4, 5].includes(month)) return { wood: 1.6, fire: 1.1, earth: 1.0, metal: 0.8, water: 0.8 };
    if ([6, 7, 8].includes(month)) return { fire: 1.6, earth: 1.2, wood: 0.9, metal: 0.8, water: 0.7 };
    if ([9, 10, 11].includes(month)) return { metal: 1.6, earth: 1.1, water: 1.0, wood: 0.8, fire: 0.7 };
    return { water: 1.6, wood: 1.0, metal: 0.9, fire: 0.7, earth: 0.8 }; // 12, 1, 2
  }

  const LUCKY_BY_ELEMENT = {
    wood: { colors: ["초록", "연두"], numbers: [3, 8], direction: "동쪽", item: "화분/식물" },
    fire: { colors: ["빨강", "주황"], numbers: [2, 7], direction: "남쪽", item: "캔들/조명" },
    earth: { colors: ["황토", "베이지"], numbers: [5, 10], direction: "중앙", item: "도자기 소품" },
    metal: { colors: ["흰색", "은색"], numbers: [4, 9], direction: "서쪽", item: "액세서리" },
    water: { colors: ["검정", "남색"], numbers: [1, 6], direction: "북쪽", item: "수경식물/어항" },
  };

  const KEYWORD_BANK = {
    wood: ["성장 지향형", "창의적 리더형", "추진력 있는", "유연한 사고", "확장을 즐기는"],
    fire: ["열정적인", "표현력 강한", "사교적인", "직관적인", "무대에 강한"],
    earth: ["신뢰감 있는", "안정 추구형", "책임감 강한", "포용력 있는", "균형 잡힌"],
    metal: ["원칙주의형", "분석적인", "결단력 있는", "완결을 중시하는", "정돈된"],
    water: ["지혜로운", "적응력 강한", "통찰력 있는", "차분한", "전략적인"],
  };

  const PERSONALITY_DESC = {
    wood: "새로운 시도를 두려워하지 않고 아이디어를 실행으로 옮기는 힘이 강한 유형입니다. 성장과 확장의 기운이 강해 변화가 많은 환경에서 오히려 두각을 나타냅니다.",
    fire: "표현력과 에너지가 넘쳐 주변 사람들에게 영향력을 미치는 유형입니다. 감정 표현이 솔직하고 새로운 관계를 맺는 데 거리낌이 없습니다.",
    earth: "묵묵히 신뢰를 쌓아가는 유형으로, 조직이나 관계에서 중심을 잡아주는 역할을 합니다. 급격한 변화보다는 꾸준함에서 힘을 얻습니다.",
    metal: "기준이 명확하고 맺고 끊음이 분명한 유형입니다. 분석적이고 체계적인 접근을 선호하며, 완결성 있는 결과물을 만들어내는 데 강점이 있습니다.",
    water: "상황에 따라 유연하게 형태를 바꾸는 지혜를 지닌 유형입니다. 겉으로는 잔잔하지만 내면에는 깊은 통찰과 전략적 사고가 자리잡고 있습니다.",
  };

  const TODAY_FORTUNE_TEMPLATES = [
    "오늘은 {dom} 기운이 강해지는 날로, 평소보다 {trait} 모습이 두드러질 수 있습니다. 작은 결정도 확신을 갖고 밀고 나가보세요.",
    "{dom} 기운과 오늘의 흐름이 맞물려 주변 사람과의 교류에서 좋은 기회가 생길 수 있습니다. {trait} 태도를 유지하면 도움이 됩니다.",
    "오늘은 무리한 확장보다 {trait} 자세로 하루를 차분히 정리하는 편이 유리한 흐름입니다. {dom} 기운을 조절하는 것이 관건입니다.",
    "{dom} 기운이 도움을 주는 하루입니다. 미뤄뒀던 일을 {trait} 마음으로 다시 들여다보면 실마리를 찾을 수 있습니다.",
  ];

  const SIMILAR_TRAIT_LABEL = {
    wood: "창의적 리더형",
    fire: "표현력 강한 활동형",
    earth: "안정 추구형",
    metal: "원칙주의 분석형",
    water: "전략적 적응형",
  };

  /* ---------------- core calculation ---------------- */

  function computeOhaeng(dateStr, hourVal, gender, rand) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const bias = seasonBias(m);
    const raw = {};
    ELEMENTS.forEach(({ key }) => {
      const jitter = randRange(rand, 0.7, 1.3);
      raw[key] = (bias[key] || 1) * jitter;
    });
    const sum = Object.values(raw).reduce((a, b) => a + b, 0);
    const pct = {};
    ELEMENTS.forEach(({ key }) => {
      pct[key] = Math.max(5, Math.round((raw[key] / sum) * 100));
    });
    // normalize rounding drift back to 100
    let diff = 100 - Object.values(pct).reduce((a, b) => a + b, 0);
    const order = ELEMENTS.map((e) => e.key).sort((a, b) => pct[b] - pct[a]);
    pct[order[0]] += diff;
    return pct;
  }

  function dominantElements(pct) {
    const sorted = ELEMENTS.map((e) => e.key).sort((a, b) => pct[b] - pct[a]);
    return { dominant: sorted[0], secondary: sorted[1] };
  }

  function buildSeed(dateStr, hourVal, gender, extra) {
    return hashString(`${dateStr}|${hourVal}|${gender}|${extra || ""}`);
  }

  function runAnalysis(input) {
    const { name, gender, dateStr, hourVal } = input;
    const coreSeed = buildSeed(dateStr, hourVal, gender, "core");
    const rand = mulberry32(coreSeed);

    const pct = computeOhaeng(dateStr, hourVal, gender, rand);
    const { dominant, secondary } = dominantElements(pct);

    const keywordRand = mulberry32(buildSeed(dateStr, hourVal, gender, "keywords"));
    const keywords = [
      pick(keywordRand, KEYWORD_BANK[dominant]),
      pick(keywordRand, KEYWORD_BANK[secondary]),
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRand = mulberry32(buildSeed(dateStr, hourVal, gender, "today-" + todayStr));
    const template = pick(todayRand, TODAY_FORTUNE_TEMPLATES);
    const todayFortune = template
      .replaceAll("{dom}", ELEMENTS.find((e) => e.key === dominant).label)
      .replaceAll("{trait}", pick(todayRand, KEYWORD_BANK[dominant]));

    const scores = {
      total: Math.round(randRange(todayRand, 55, 95)),
      money: Math.round(randRange(todayRand, 45, 95)),
      love: Math.round(randRange(todayRand, 45, 95)),
      health: Math.round(randRange(todayRand, 45, 95)),
    };

    const lucky = LUCKY_BY_ELEMENT[dominant];

    const statRand = mulberry32(buildSeed(dateStr, hourVal, gender, "stat"));
    const sampleSize = Math.round(randRange(statRand, 8000, 25000));
    const matchPct = Math.round(randRange(statRand, 62, 88));

    return {
      name: name && name.trim() ? name.trim() : "고객",
      pct,
      dominant,
      secondary,
      keywords,
      personalityDesc: PERSONALITY_DESC[dominant],
      todayFortune,
      scores,
      lucky,
      sampleSize,
      matchPct,
      dominantLabel: SIMILAR_TRAIT_LABEL[dominant],
    };
  }

  /* ---------------- rendering ---------------- */

  function renderResult(result) {
    document.getElementById("result-title").textContent = `${result.name}님의 사주 빅데이터 리포트`;
    document.getElementById("result-sub").textContent =
      `주 오행: ${ELEMENTS.find((e) => e.key === result.dominant).label} · 보조 오행: ${ELEMENTS.find((e) => e.key === result.secondary).label}`;

    const ohaengList = document.getElementById("ohaeng-list");
    ohaengList.innerHTML = "";
    ELEMENTS.forEach(({ key, label, varName }) => {
      const row = document.createElement("div");
      row.className = "ohaeng-row";
      row.innerHTML = `
        <span class="ohaeng-name">${label}</span>
        <span class="ohaeng-track"><span class="ohaeng-fill" style="background:var(${varName})"></span></span>
        <span class="ohaeng-pct">${result.pct[key]}%</span>
      `;
      ohaengList.appendChild(row);
      requestAnimationFrame(() => {
        row.querySelector(".ohaeng-fill").style.width = result.pct[key] + "%";
      });
    });

    const keywordList = document.getElementById("keyword-list");
    keywordList.innerHTML = "";
    result.keywords.forEach((kw) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = kw;
      keywordList.appendChild(span);
    });
    document.getElementById("keyword-desc").textContent = result.personalityDesc;

    document.getElementById("today-fortune").textContent = result.todayFortune;

    [
      ["total", "score-total", "score-total-num"],
      ["money", "score-money", "score-money-num"],
      ["love", "score-love", "score-love-num"],
      ["health", "score-health", "score-health-num"],
    ].forEach(([key, barId, numId]) => {
      const val = result.scores[key];
      document.getElementById(numId).textContent = val;
      const bar = document.getElementById(barId);
      requestAnimationFrame(() => {
        bar.style.width = val + "%";
      });
    });

    const luckyList = document.getElementById("lucky-list");
    luckyList.innerHTML = "";
    const luckyRows = [
      ["행운의 색", result.lucky.colors.join(", ")],
      ["행운의 숫자", result.lucky.numbers.join(", ")],
      ["행운의 방향", result.lucky.direction],
      ["행운의 아이템", result.lucky.item],
    ];
    luckyRows.forEach(([label, value]) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="lucky-label">${label}</span><span class="lucky-value">${value}</span>`;
      luckyList.appendChild(li);
    });

    document.getElementById("bigdata-stat").textContent =
      `당신과 같은 '${result.dominantLabel}' 오행 우세 유형 사용자 데이터 ${result.sampleSize.toLocaleString()}명 중 약 ${result.matchPct}%가 비슷한 성향 키워드를 보였습니다. (예시용 통계이며 실제 데이터가 아닙니다)`;

    const similarUsers = document.getElementById("similar-users");
    similarUsers.innerHTML = "";
    const avatarStack = document.createElement("div");
    avatarStack.className = "avatar-stack";
    for (let i = 0; i < 5; i++) {
      const span = document.createElement("span");
      avatarStack.appendChild(span);
    }
    const countSpan = document.createElement("span");
    countSpan.className = "similar-count";
    countSpan.textContent = `${result.sampleSize.toLocaleString()}명과 유사한 패턴`;
    similarUsers.appendChild(avatarStack);
    similarUsers.appendChild(countSpan);
  }

  /* ---------------- flow control ---------------- */

  const LOADING_STEPS = [
    "사용자 사주 데이터베이스에서 유사 패턴을 검색하는 중...",
    "생년월일 데이터를 오행(五行) 값으로 환산하는 중...",
    "유사 사용자 그룹과 성향 데이터를 비교하는 중...",
    "리포트를 생성하는 중...",
  ];

  function runLoadingAnimation(onDone) {
    const loadingSection = document.getElementById("loading-section");
    const loadingText = document.getElementById("loading-text");
    const progressBar = document.getElementById("progress-bar");

    loadingSection.classList.remove("hidden");
    loadingSection.scrollIntoView({ behavior: "smooth", block: "start" });

    let step = 0;
    progressBar.style.width = "0%";
    loadingText.textContent = LOADING_STEPS[0];

    const stepDuration = 420;
    const interval = setInterval(() => {
      step++;
      const pct = Math.min(100, Math.round((step / LOADING_STEPS.length) * 100));
      progressBar.style.width = pct + "%";
      if (step < LOADING_STEPS.length) {
        loadingText.textContent = LOADING_STEPS[step];
      } else {
        clearInterval(interval);
        setTimeout(() => {
          loadingSection.classList.add("hidden");
          onDone();
        }, 300);
      }
    }, stepDuration);
  }

  function init() {
    const form = document.getElementById("fortune-form");
    const submitBtn = document.getElementById("submit-btn");
    const resultSection = document.getElementById("result-section");
    const retryBtn = document.getElementById("retry-btn");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const dateStr = document.getElementById("birthdate").value;
      if (!dateStr) return;

      const name = document.getElementById("name").value;
      const gender = document.getElementById("gender").value;
      const hourVal = document.getElementById("birthtime").value;

      submitBtn.disabled = true;
      resultSection.classList.add("hidden");

      runLoadingAnimation(() => {
        const result = runAnalysis({ name, gender, dateStr, hourVal });
        renderResult(result);
        resultSection.classList.remove("hidden");
        resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
        submitBtn.disabled = false;
      });
    });

    retryBtn.addEventListener("click", () => {
      resultSection.classList.add("hidden");
      document.getElementById("fortune-form").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
