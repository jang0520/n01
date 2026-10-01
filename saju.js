/* 숙요사주: 숙요(27수)와 사주팔자를 엮어 성격·궁합을 풀이 */
(function () {
  "use strict";

  const DATA = window.SAJU_DATA;
  const MIN_YEAR = 1901;
  const MAX_YEAR = 2049;

  /* =========================================================
   * 1. 기본 상수
   * ========================================================= */
  const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  const STEMS_H = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  const BRANCHES_H = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
  const BRANCH_ELEM = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  const stemElem = (s) => Math.floor(s / 2);

  // 오행: 0 목 1 화 2 토 3 금 4 수 (상생: e → e+1, 상극: e → e+2)
  const ELEMENTS = [
    { name: "목", hanja: "木", cls: "el-wood", color: "초록·청록", dir: "동쪽", season: "봄", num: "3·8",
      act: "산책, 식물 가꾸기, 새로운 배움",
      strong: "성장 욕구와 추진하는 힘이 강해 새 일을 벌이길 좋아하지만, 고집이 세지거나 일을 너무 많이 펼치기 쉬워요.",
      weak: "새로 시작하는 힘이나 자기 확신이 약해질 때가 있어요. 작게라도 먼저 시작해 보는 연습이 도움이 돼요." },
    { name: "화", hanja: "火", cls: "el-fire", color: "빨강·주황·보라", dir: "남쪽", season: "여름", num: "2·7",
      act: "운동, 햇볕 쬐기, 사람 만나기",
      strong: "열정과 표현력이 넘치고 분위기를 밝게 만들지만, 쉽게 달아오르고 빨리 식는 면도 있어요.",
      weak: "속으로는 뜨거워도 겉으로 잘 드러내지 않아요. 감정과 생각을 조금 더 표현하면 인정받기 쉬워져요." },
    { name: "토", hanja: "土", cls: "el-earth", color: "노랑·베이지·갈색", dir: "중앙", season: "환절기", num: "5·10",
      act: "규칙적인 생활, 정리정돈, 등산",
      strong: "믿음직하고 중심을 잘 잡지만, 변화를 싫어하고 생각이 무거워질 수 있어요.",
      weak: "생각이 여기저기로 흩어지기 쉬워요. 루틴과 생활 리듬을 만들면 마음이 안정돼요." },
    { name: "금", hanja: "金", cls: "el-metal", color: "흰색·은색·금색", dir: "서쪽", season: "가을", num: "4·9",
      act: "계획 세우기, 악기·공예, 결단 연습",
      strong: "결단력과 원칙이 분명해 맺고 끊음이 확실하지만, 말이 날카롭게 들릴 때가 있어요.",
      weak: "결정을 미루거나 거절을 어려워할 수 있어요. 기준을 미리 정해 두면 훨씬 편해져요." },
    { name: "수", hanja: "水", cls: "el-water", color: "검정·남색", dir: "북쪽", season: "겨울", num: "1·6",
      act: "독서, 명상, 물가 산책, 충분한 휴식",
      strong: "생각이 깊고 유연하며 지혜롭지만, 걱정이 많거나 속마음을 감추는 경향이 있어요.",
      weak: "쉬지 않고 달리다 지치기 쉬워요. 충분한 휴식과 혼자만의 생각 시간이 필요해요." }
  ];

  /* =========================================================
   * 2. 날짜·달력 계산
   * ========================================================= */
  const DAY_MS = 86400000;
  const EPOCH_MS = Date.UTC(1900, 0, 1);
  const dayOffset = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - EPOCH_MS) / DAY_MS);
  function offsetToDate(off) {
    const dt = new Date(EPOCH_MS + off * DAY_MS);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
  }
  function isValidSolar(y, m, d) {
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }

  // 음력 연도 정보: [시작일 오프셋, 윤달(0=없음), 월 길이 비트(1=30일), 달 개수]
  function lunarYearMonths(idx) {
    const [start, leap, bits, n] = DATA.lunar[idx];
    const months = [];
    let off = start;
    for (let k = 0; k < n; k++) {
      const len = (bits >> (n - 1 - k)) & 1 ? 30 : 29;
      let month, isLeap = false;
      if (!leap || k < leap) month = k + 1;
      else if (k === leap) { month = leap; isLeap = true; }
      else month = k;
      months.push({ month, isLeap, start: off, len });
      off += len;
    }
    return months;
  }

  function solarToLunar(y, m, d) {
    const off = dayOffset(y, m, d);
    const L = DATA.lunar;
    for (let i = L.length - 1; i >= 0; i--) {
      if (off >= L[i][0]) {
        const months = lunarYearMonths(i);
        for (const mo of months) {
          if (off < mo.start + mo.len) {
            return { y: 1900 + i, m: mo.month, d: off - mo.start + 1, isLeap: mo.isLeap };
          }
        }
        return null;
      }
    }
    return null;
  }

  function lunarToSolar(y, m, d, isLeap) {
    const idx = y - 1900;
    if (idx < 0 || idx >= DATA.lunar.length) return { error: "지원하는 범위를 벗어난 연도예요." };
    const mo = lunarYearMonths(idx).find((x) => x.month === m && x.isLeap === !!isLeap);
    if (!mo) return { error: isLeap ? `${y}년 음력에는 윤${m}월이 없어요.` : "존재하지 않는 음력 날짜예요." };
    if (d < 1 || d > mo.len) return { error: `${y}년 음력 ${isLeap ? "윤" : ""}${m}월은 ${mo.len}일까지 있어요.` };
    return offsetToDate(mo.start + d - 1);
  }

  // 현지 시각(분) → 당시 한국 표준시·서머타임 오프셋
  function tzAt(localMin) {
    const T = DATA.tz;
    for (let i = T.length - 1; i >= 0; i--) {
      if (localMin - T[i][1] >= T[i][0]) return { offset: T[i][1], dst: !!T[i][2] };
    }
    return { offset: T[0][1], dst: false };
  }

  // utc(1900-01-01 기준 분) 직전에 지난 절(節)의 인덱스
  function jieIndexAt(utcMin) {
    const T = DATA.terms;
    let lo = 0, hi = T.length - 1;
    if (utcMin < T[0]) return -1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (T[mid] <= utcMin) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  /* =========================================================
   * 3. 사주팔자
   * ========================================================= */
  function computePillars(birth, opts) {
    const timeKnown = birth.hour !== null;
    const localMin = dayOffset(birth.y, birth.m, birth.d) * 1440 +
      (timeKnown ? birth.hour * 60 + birth.minute : 12 * 60);
    const tz = tzAt(localMin);
    const utc = localMin - tz.offset;

    // 연주·월주: 절기 기준
    const j = jieIndexAt(utc);
    const termYear = 1900 + Math.floor(j / 12);
    const k = j % 12; // 0 소한, 1 입춘, ... 11 대설
    const sajuYear = k >= 1 ? termYear : termYear - 1;
    const yIdx = (((sajuYear - 4) % 60) + 60) % 60;
    const yearP = { s: yIdx % 10, b: yIdx % 12 };
    const monthBranch = (k + 1) % 12;
    const mIdx = (monthBranch - 2 + 12) % 12;
    const monthP = { s: ((yearP.s % 5) * 2 + 2 + mIdx) % 10, b: monthBranch };

    // 일주·시주: 태양시 기준
    let dayOff, hourP = null, solarNote = "";
    if (timeKnown) {
      let solarMin;
      if (opts.longitude !== null) {
        solarMin = utc + Math.round(opts.longitude * 4);
        solarNote = `경도 ${opts.longitude.toFixed(2)}° 진태양시 기준`;
      } else {
        solarMin = utc + (tz.dst ? tz.offset - 60 : tz.offset);
        solarNote = "표준시 기준";
      }
      if (tz.dst) solarNote += " · 서머타임 1시간 제외";
      dayOff = Math.floor(solarMin / 1440);
      const mod = solarMin - dayOff * 1440;
      const hb = Math.floor((mod + 60) / 120) % 12;
      const late = mod >= 23 * 60;
      if (late && opts.zasi === "early") dayOff += 1;
      const stemDayOff = late && opts.zasi !== "early" ? dayOff + 1 : dayOff;
      const hourStemBase = ((stemDayOff + 2415021 + 49) % 60) % 10;
      hourP = { s: ((hourStemBase % 5) * 2 + hb) % 10, b: hb };
      const hh = Math.floor(mod / 60), mm = mod % 60;
      solarNote += ` (${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")})`;
    } else {
      dayOff = dayOffset(birth.y, birth.m, birth.d);
    }
    const dIdx = (dayOff + 2415021 + 49) % 60;
    const dayP = { s: dIdx % 10, b: dIdx % 12 };

    return { year: yearP, month: monthP, day: dayP, hour: hourP, sajuYear, solarNote, timeKnown };
  }

  /* =========================================================
   * 4. 숙요 27수
   * ========================================================= */
  // 七曜 → 오행 인덱스 (日은 양의 화, 月은 음의 수로 본다)
  const YO = {
    "日": { el: 1, day: "일요일" }, "月": { el: 4, day: "월요일" }, "火": { el: 1, day: "화요일" },
    "水": { el: 4, day: "수요일" }, "木": { el: 0, day: "목요일" }, "金": { el: 3, day: "금요일" }, "土": { el: 2, day: "토요일" }
  };

  // 순서: 昴宿부터 27수 순환
  const SUKU = [
    { h: "昴", k: "묘", yo: "日", nick: "기품 있는 귀공자", kw: ["품격", "자존심", "교양"],
      desc: "품위와 교양을 갖춘 타고난 귀족형이에요. 아름답고 질 좋은 것을 알아보는 눈이 있고, 자존심이 강해 쉽게 굽히지 않아요.",
      strength: "어디서든 단정하고 신뢰감 있는 인상을 줘요.", caution: "자존심이 상하면 쉽게 마음을 닫아요.",
      t: ["express", "lead", "think"] },
    { h: "畢", k: "필", yo: "月", nick: "묵묵한 노력가", kw: ["끈기", "성실", "고집"],
      desc: "한번 정한 목표는 끝까지 밀고 나가는 끈기가 있어요. 화려하진 않아도 꾸준히 쌓아 올려 결국 결과를 만들어요.",
      strength: "지구력과 꾸준함은 누구에게도 뒤지지 않아요.", caution: "고집이 세서 방향을 바꾸는 데 시간이 걸려요.",
      t: ["steady", "drive", "lead"] },
    { h: "觜", k: "자", yo: "火", nick: "말솜씨 좋은 전략가", kw: ["언변", "신중", "실리"],
      desc: "말솜씨가 뛰어나고 계산이 빨라 손해 보는 일을 잘 하지 않아요. 겉으론 온화하지만 속으론 꼼꼼히 따져 보는 신중파예요.",
      strength: "사람을 설득하고 실리를 챙기는 감각이 탁월해요.", caution: "지나치게 따지다 보면 정 없어 보일 수 있어요.",
      t: ["social", "think", "steady"] },
    { h: "参", k: "삼", yo: "水", nick: "틀을 깨는 개혁가", kw: ["호기심", "행동력", "비판정신"],
      desc: "새로운 것에 대한 호기심이 강하고 생각하면 바로 움직이는 행동파예요. 낡은 방식에 의문을 던지고 바꾸려는 개혁 정신이 있어요.",
      strength: "변화가 필요한 곳에서 돌파구를 만들어 내요.", caution: "말이 직설적이라 의도치 않게 부딪칠 수 있어요.",
      t: ["free", "drive", "think"] },
    { h: "井", k: "정", yo: "木", nick: "냉철한 논리가", kw: ["이성", "분석", "정의감"],
      desc: "감정보다 논리로 판단하는 이성파예요. 복잡한 문제를 정리하고 옳고 그름을 따지는 능력이 뛰어나요.",
      strength: "분석력과 판단력이 뛰어나 문제 해결사로 통해요.", caution: "이론에 치우쳐 상대의 감정을 놓치기 쉬워요.",
      t: ["think", "steady", "lead"] },
    { h: "鬼", k: "귀", yo: "金", nick: "순수한 영감의 사람", kw: ["직관", "순수", "자유"],
      desc: "어린아이 같은 순수함과 번뜩이는 직관을 지녔어요. 얽매이는 것을 싫어하고 마음 가는 대로 움직이지만 정이 많고 친절해요.",
      strength: "직관과 영감이 뛰어나고 사람을 편하게 해 줘요.", caution: "흥미가 금방 옮겨 가 마무리가 약할 수 있어요.",
      t: ["free", "care", "express"] },
    { h: "柳", k: "류", yo: "土", nick: "한 길을 파는 열정가", kw: ["열정", "몰입", "헌신"],
      desc: "좋아하는 일이나 사람에게 온 마음을 쏟는 열정가예요. 감정이 풍부하고 한번 빠지면 깊이 몰입해요.",
      strength: "몰입하는 힘과 헌신으로 큰 성과를 내요.", caution: "감정 기복이 크고, 집착으로 번지지 않게 주의해야 해요.",
      t: ["drive", "care", "express"] },
    { h: "星", k: "성", yo: "日", nick: "홀로 빛나는 대기만성", kw: ["독립", "자립", "인내"],
      desc: "남에게 기대지 않고 스스로 길을 개척하는 독립형이에요. 젊어서 고생해도 시간이 갈수록 빛을 발하는 대기만성형이에요.",
      strength: "역경을 견디는 힘과 자립심이 강해요.", caution: "혼자 짊어지려다 외로워질 수 있어요.",
      t: ["lead", "steady", "drive"] },
    { h: "張", k: "장", yo: "月", nick: "무대 위의 주인공", kw: ["화려함", "표현력", "인기"],
      desc: "사람들 앞에 서는 것이 어울리는 화려한 존재감을 지녔어요. 자기 표현이 능숙하고 주목받을 때 힘이 나요.",
      strength: "분위기를 이끄는 매력과 표현력이 있어요.", caution: "인정받지 못하면 쉽게 상처받아요.",
      t: ["express", "social", "lead"] },
    { h: "翼", k: "익", yo: "火", nick: "큰 꿈을 향한 비행가", kw: ["이상", "성실", "도전"],
      desc: "멀리 날아가는 날개처럼 큰 이상과 넓은 무대를 꿈꿔요. 목표를 향해 성실하게 나아가고 낯선 곳에서도 기회를 찾아요.",
      strength: "넓은 시야와 꾸준한 실행력을 함께 지녔어요.", caution: "이상이 높아 현실과의 차이에 지칠 수 있어요.",
      t: ["drive", "free", "steady"] },
    { h: "軫", k: "진", yo: "水", nick: "바람 같은 사교가", kw: ["사교", "처세", "정보력"],
      desc: "누구와도 부드럽게 어울리는 사교성과 빠른 정보력이 있어요. 상황에 맞게 유연하게 움직이는 처세의 달인이에요.",
      strength: "인맥을 넓히고 사람을 연결하는 데 능해요.", caution: "여기저기 맞추다 보면 정작 내 마음을 놓치기 쉬워요.",
      t: ["social", "free", "care"] },
    { h: "角", k: "각", yo: "木", nick: "밝고 세련된 분위기 메이커", kw: ["사교", "감각", "즐거움"],
      desc: "밝고 친근해 어디서나 분위기를 띄우는 사람이에요. 유행과 아름다움에 대한 감각이 좋고 즐길 줄 알아요.",
      strength: "사람을 끄는 밝은 기운과 센스가 있어요.", caution: "즐거움을 좇다 보면 끈기가 부족해질 수 있어요.",
      t: ["social", "express", "free"] },
    { h: "亢", k: "항", yo: "金", nick: "꺾이지 않는 정의파", kw: ["정의감", "신념", "자기주장"],
      desc: "옳다고 믿는 것은 끝까지 주장하는 강한 신념의 소유자예요. 윗사람 앞에서도 굽히지 않는 반골 기질이 있어요.",
      strength: "불의를 참지 않는 용기와 추진력이 있어요.", caution: "타협을 몰라 적을 만들 수 있어요.",
      t: ["lead", "drive", "think"] },
    { h: "氐", k: "저", yo: "土", nick: "야망을 품은 실력자", kw: ["야심", "끈기", "현실감"],
      desc: "목표를 이루려는 욕구와 에너지가 강한 야심가예요. 현실 감각이 뛰어나 원하는 것을 차근차근 손에 넣어요.",
      strength: "에너지와 끈기로 원하는 결과를 만들어요.", caution: "욕심이 지나치면 주변을 지치게 해요.",
      t: ["drive", "lead", "steady"] },
    { h: "房", k: "방", yo: "日", nick: "복을 타고난 온화한 사람", kw: ["행운", "온화", "인덕"],
      desc: "타고난 복이 많고 온화한 성품으로 사람들에게 사랑받아요. 재물운과 인복이 좋아 주변의 도움을 잘 받아요.",
      strength: "사람을 편안하게 하는 온화함과 인덕이 있어요.", caution: "편안함에 안주해 도전을 미룰 수 있어요.",
      t: ["social", "steady", "care"] },
    { h: "心", k: "심", yo: "月", nick: "마음을 읽는 매력가", kw: ["매력", "통찰", "섬세함"],
      desc: "사람의 마음을 읽는 능력이 뛰어나고 상황에 따라 다양한 얼굴을 보여 주는 매력가예요. 겉으론 밝아도 속은 섬세하고 생각이 많아요.",
      strength: "상대의 속마음을 빠르게 알아채요.", caution: "속마음을 잘 드러내지 않아 오해를 받기도 해요.",
      t: ["social", "think", "express"] },
    { h: "尾", k: "미", yo: "火", nick: "끝까지 파고드는 승부사", kw: ["의지", "근성", "집중"],
      desc: "한번 시작하면 끝을 보는 강한 의지와 근성이 있어요. 승부욕이 강하고 깊이 파고드는 집중력이 뛰어나요.",
      strength: "포기하지 않는 근성으로 끝내 해내요.", caution: "융통성이 부족해 고집스러워 보일 수 있어요.",
      t: ["drive", "think", "lead"] },
    { h: "箕", k: "기", yo: "水", nick: "호방한 자유인", kw: ["대담", "솔직", "독립"],
      desc: "속이 시원하고 대담한 성격으로 얽매이지 않는 자유를 사랑해요. 솔직하고 통이 커서 사람들이 따르지만 간섭은 싫어해요.",
      strength: "대담한 결단력과 시원시원한 추진력이 있어요.", caution: "직설적인 말로 상처를 줄 수 있어요.",
      t: ["free", "drive", "lead"] },
    { h: "斗", k: "두", yo: "木", nick: "카리스마의 리더", kw: ["리더십", "정신력", "이상"],
      desc: "강한 카리스마와 정신력으로 사람들을 이끄는 타고난 리더예요. 높은 이상을 품고 어려움에 맞서는 투지가 있어요.",
      strength: "위기에 강하고 사람을 이끄는 힘이 있어요.", caution: "독선적으로 비치지 않도록 주변 의견을 들어야 해요.",
      t: ["lead", "drive", "think"] },
    { h: "女", k: "여", yo: "土", nick: "계획적인 노력가", kw: ["성실", "체계", "학구열"],
      desc: "계획을 세우고 체계적으로 노력하는 성실파예요. 배우는 것을 좋아하고 한 분야를 깊이 갈고닦아요.",
      strength: "꼼꼼함과 성실함으로 신뢰를 쌓아요.", caution: "완벽주의로 스스로를 몰아붙이기 쉬워요.",
      t: ["steady", "think", "care"] },
    { h: "虚", k: "허", yo: "日", nick: "이상을 품은 감성가", kw: ["감수성", "이상", "양면성"],
      desc: "섬세한 감수성과 풍부한 정신세계를 지녔어요. 현실과 이상 사이를 오가는 양면성이 있어 쉽게 속을 알 수 없는 사람이에요.",
      strength: "남들이 못 보는 것을 느끼고 표현하는 감성이 있어요.", caution: "생각이 많아 결단이 늦고 불안해지기 쉬워요.",
      t: ["think", "express", "free"] },
    { h: "危", k: "위", yo: "月", nick: "개성 넘치는 자유인", kw: ["개성", "감각", "변화"],
      desc: "독특한 감각과 개성으로 자기만의 세계를 가진 사람이에요. 변화와 새로움을 즐기고 다양한 사람과 쉽게 친해져요.",
      strength: "새로운 흐름을 빠르게 읽고 즐길 줄 알아요.", caution: "기분에 따라 움직여 일관성이 부족해 보일 수 있어요.",
      t: ["free", "social", "express"] },
    { h: "室", k: "실", yo: "火", nick: "거침없는 에너자이저", kw: ["대담", "행동력", "낙천"],
      desc: "에너지가 넘치고 대담해서 생각보다 몸이 먼저 움직여요. 낙천적이고 스케일이 커서 큰일을 벌이는 데 두려움이 없어요.",
      strength: "추진력과 배짱으로 길을 열어요.", caution: "브레이크 없이 달리다 무리할 수 있어요.",
      t: ["drive", "lead", "social"] },
    { h: "壁", k: "벽", yo: "水", nick: "든든한 조력자", kw: ["조력", "성실", "지성"],
      desc: "앞에 나서기보다 뒤에서 사람을 돕고 지키는 든든한 조력자예요. 성실하고 지적이며 신뢰를 중요하게 여겨요.",
      strength: "주변 사람을 성공시키는 서포트 능력이 탁월해요.", caution: "내 몫을 챙기지 못하고 손해를 보기 쉬워요.",
      t: ["care", "steady", "think"] },
    { h: "奎", k: "규", yo: "木", nick: "단정한 수호자", kw: ["청렴", "품위", "신중"],
      desc: "단정하고 품위 있으며 맑은 마음을 지닌 사람이에요. 신중하게 행동하고 소중한 사람을 지키려는 마음이 강해요.",
      strength: "정직함과 성실함으로 깊은 신뢰를 얻어요.", caution: "높은 기준으로 스스로를 피곤하게 할 수 있어요.",
      t: ["steady", "care", "express"] },
    { h: "婁", k: "루", yo: "金", nick: "재치 있는 조정자", kw: ["재치", "조정력", "다재다능"],
      desc: "재치가 있고 손재주와 기획력이 좋은 다재다능형이에요. 사람 사이를 조율하고 일을 매끄럽게 진행시키는 능력이 있어요.",
      strength: "갈등을 조율하고 실무를 깔끔하게 처리해요.", caution: "이것저것 챙기다 정작 나를 돌보지 못해요.",
      t: ["social", "think", "care"] },
    { h: "胃", k: "위", yo: "土", nick: "생명력 넘치는 개척자", kw: ["생명력", "의욕", "독립"],
      desc: "강한 생명력과 의욕으로 원하는 것을 향해 거침없이 나아가요. 독립심이 강해 남의 밑에 있기보다 스스로 길을 만들어요.",
      strength: "어떤 환경에서도 살아남는 강인함이 있어요.", caution: "욕심과 경쟁심이 지나치면 충돌을 부를 수 있어요.",
      t: ["drive", "lead", "free"] }
  ];
  // 음력 각 달 1일의 숙 (1월 室, 2월 奎, 3월 胃, 4월 畢, 5월 参, 6월 鬼, 7월 張, 8월 角, 9월 氐, 10월 心, 11월 斗, 12월 虚)
  const MONTH_START = [22, 24, 26, 1, 3, 5, 8, 11, 13, 15, 18, 20];
  const sukuName = (i) => `${SUKU[i].k}수(${SUKU[i].h}宿)`;

  function sukuIndex(lunar) {
    return (MONTH_START[lunar.m - 1] + lunar.d - 1) % 27;
  }

  /* =========================================================
   * 5. 일간·성향 데이터
   * ========================================================= */
  const DAY_MASTER = [
    { image: "곧게 뻗은 큰 나무", desc: "곧고 정직하며 위로 뻗어 나가려는 성장 욕구가 강해요. 원칙을 지키고 남을 이끄는 우두머리 기질이 있어요.",
      strength: "곧은 신념으로 사람들에게 방향을 제시해요.", caution: "굽힐 줄 몰라 한번 부딪히면 크게 꺾일 수 있어요.", t: ["lead", "drive", "steady"] },
    { image: "유연한 풀과 덩굴", desc: "부드럽고 유연하게 환경에 적응하는 생활력이 있어요. 겉은 여려 보여도 끈질기게 살아남는 강인함이 있어요.",
      strength: "어떤 환경에서도 자리를 잡는 적응력과 친화력이 있어요.", caution: "남의 눈치를 많이 보고 속으로 참는 편이에요.", t: ["social", "care", "steady"] },
    { image: "온 세상을 비추는 태양", desc: "밝고 열정적이며 숨김없이 드러내는 솔직함이 있어요. 어디서나 존재감이 크고 사람들에게 에너지를 나눠 줘요.",
      strength: "주변을 환하게 만드는 긍정 에너지가 있어요.", caution: "쉽게 달아오르고 금방 식는 면이 있어요.", t: ["express", "lead", "social"] },
    { image: "어둠을 밝히는 촛불", desc: "따뜻하고 섬세하며 한 사람을 깊이 비추는 헌신적인 빛이에요. 조용하지만 내면의 열정과 집중력이 강해요.",
      strength: "가까운 사람을 끝까지 따뜻하게 챙겨요.", caution: "감정을 속으로 쌓아 두다 한꺼번에 터질 수 있어요.", t: ["care", "think", "express"] },
    { image: "묵직한 큰 산", desc: "넓고 묵직해 쉽게 흔들리지 않는 믿음직한 사람이에요. 포용력이 크고 사람들 사이를 중재하는 역할을 잘 맡아요.",
      strength: "흔들리지 않는 중심과 포용력으로 신뢰를 얻어요.", caution: "변화에 둔하고 고집스러워 보일 수 있어요.", t: ["steady", "lead", "care"] },
    { image: "만물을 기르는 논밭", desc: "사람과 일을 섬세하게 길러 내는 실속형이에요. 현실적이고 꼼꼼하며 주변을 잘 챙겨요.",
      strength: "사람과 일을 차근차근 키워 내는 실속이 있어요.", caution: "걱정이 많고 속내를 잘 드러내지 않아요.", t: ["care", "steady", "think"] },
    { image: "단단한 바위와 쇠", desc: "결단력과 의리가 강하고 맺고 끊음이 분명해요. 어려운 일 앞에서 오히려 강해지는 승부사예요.",
      strength: "위기 앞에서 흔들림 없는 결단력을 보여요.", caution: "말과 행동이 거칠게 느껴질 수 있어요.", t: ["drive", "lead", "free"] },
    { image: "빛나는 보석", desc: "섬세하고 예리한 감각을 지닌 완벽주의자예요. 자기만의 기준과 미적 감각이 뚜렷하고 자존심이 강해요.",
      strength: "예리한 감각으로 디테일을 완성해요.", caution: "예민해서 작은 말에도 쉽게 상처받아요.", t: ["express", "think", "steady"] },
    { image: "넓은 바다와 큰 강", desc: "스케일이 크고 자유로우며 지혜로운 사람이에요. 많은 것을 품는 포용력과 흐름을 읽는 통찰이 있어요.",
      strength: "큰 흐름을 읽고 유연하게 대처해요.", caution: "변덕스럽고 한곳에 머물기 어려워해요.", t: ["free", "think", "social"] },
    { image: "만물을 적시는 비와 이슬", desc: "조용하고 섬세하게 스며드는 지혜를 지녔어요. 직관이 뛰어나고 남을 돕는 따뜻한 마음이 있어요.",
      strength: "말없이 상황을 읽고 필요한 곳을 채워 줘요.", caution: "생각이 많아 혼자 고민을 키우기 쉬워요.", t: ["think", "care", "free"] }
  ];

  const TRAIT_KEYS = ["lead", "drive", "express", "social", "care", "think", "steady", "free"];
  const TRAITS = {
    lead: { name: "주도성", adj: "이끄는", noun: "리더", core: "스스로 방향을 정하고 사람들을 이끄는 힘",
      strength: "결정이 필요한 순간 앞에 나서서 책임지는 리더십이 있어요.",
      caution: "내 방식이 옳다는 확신이 강해 독단적으로 보일 수 있어요.",
      rel: "관계에서도 주도권을 잡는 편이고, 상대를 보호하고 챙기려 해요.",
      work: "목표를 세우고 팀을 이끄는 자리, 결정권이 있는 역할에서 능력이 살아나요." },
    drive: { name: "추진력", adj: "도전하는", noun: "개척자", core: "생각한 것을 바로 행동으로 옮기는 에너지",
      strength: "망설임 없이 실행에 옮기는 추진력이 있어요.",
      caution: "속도를 내다 보면 주변을 놓치거나 무리하기 쉬워요.",
      rel: "좋아하면 적극적으로 다가가고, 함께 무언가를 해 나가는 관계를 좋아해요.",
      work: "빠르게 성과가 보이는 일, 새로 시작하는 프로젝트에서 빛나요." },
    express: { name: "표현력", adj: "빛나는", noun: "예술가", core: "감정과 생각을 아름답게 드러내는 감각",
      strength: "남다른 감각과 표현력으로 사람들의 마음을 움직여요.",
      caution: "인정받지 못한다고 느끼면 쉽게 의욕을 잃어요.",
      rel: "감정 표현이 풍부해 관계를 생기 있게 만들지만, 반응이 없으면 서운해해요.",
      work: "기획·디자인·콘텐츠처럼 나만의 색을 드러낼 수 있는 일이 잘 맞아요." },
    social: { name: "사교성", adj: "어울리는", noun: "연결자", core: "사람과 사람을 잇고 분위기를 읽는 능력",
      strength: "누구와도 금방 친해지는 친화력과 분위기를 읽는 눈이 있어요.",
      caution: "모두에게 맞추다 보면 정작 내 의견을 잃기 쉬워요.",
      rel: "넓은 인간관계를 즐기고, 상대를 편하게 해 주는 대화의 달인이에요.",
      work: "사람을 만나고 조율하는 영업·홍보·서비스·중재 역할에서 강점이 드러나요." },
    care: { name: "배려심", adj: "품어 주는", noun: "조력자", core: "상대의 필요를 먼저 알아채고 돕는 따뜻함",
      strength: "상대를 세심하게 챙기는 배려와 헌신이 있어요.",
      caution: "남을 챙기느라 나를 소홀히 하고 지치기 쉬워요.",
      rel: "상대에게 헌신적이고, 오래가는 깊은 관계를 원해요.",
      work: "사람을 돕고 키우는 교육·상담·지원 업무에서 보람을 느껴요." },
    think: { name: "탐구심", adj: "꿰뚫어 보는", noun: "탐구자", core: "본질을 파고들고 깊이 생각하는 지성",
      strength: "깊이 있는 사고와 날카로운 분석력이 있어요.",
      caution: "생각이 많아 결정이 늦어지고 걱정을 키울 수 있어요.",
      rel: "가볍게 많이 만나기보다 깊은 대화가 통하는 소수와 가까워져요.",
      work: "연구·분석·기획·전문 기술처럼 깊이가 필요한 일에서 실력을 발휘해요." },
    steady: { name: "안정감", adj: "단단한", noun: "수호자", core: "꾸준히 쌓고 지켜 내는 성실함",
      strength: "흔들림 없이 맡은 일을 끝까지 해내는 책임감이 있어요.",
      caution: "변화를 피하고 익숙한 것에 머물려는 경향이 있어요.",
      rel: "천천히 마음을 열지만, 한번 맺은 인연은 오래 지켜요.",
      work: "체계와 신뢰가 중요한 관리·재무·운영·전문직에서 믿음을 얻어요." },
    free: { name: "자유로움", adj: "자유로운", noun: "모험가", core: "틀에 얽매이지 않고 새로움을 찾는 감각",
      strength: "고정관념을 벗어난 유연한 발상과 적응력이 있어요.",
      caution: "구속을 싫어해 책임이나 약속을 부담스러워할 수 있어요.",
      rel: "서로의 공간을 존중해 주는 관계에서 편안함을 느껴요.",
      work: "변화가 많고 재량이 큰 일, 프리랜서나 새로운 분야에서 활기를 찾아요." }
  };

  // 십신 그룹: 0 비겁 1 식상 2 재성 3 관성 4 인성 (일간 기준 오행 거리)
  const TEN_GODS = [
    { name: "비겁", hanja: "比劫", w: { lead: 1, free: 1, drive: 0.5 },
      text: "자존감과 독립심이 강해 내 방식대로 해 나가는 힘이 있어요. 경쟁을 즐기지만 고집으로 비칠 수 있어요." },
    { name: "식상", hanja: "食傷", w: { express: 1.2, social: 0.6, free: 0.4 },
      text: "아이디어와 표현력이 풍부해 말과 손재주로 재능을 드러내요. 자유로운 환경에서 빛나요." },
    { name: "재성", hanja: "財星", w: { steady: 0.8, drive: 0.8, social: 0.4 },
      text: "현실 감각이 뛰어나고 결과를 만들어 내는 힘이 있어요. 사람과 돈의 흐름을 잘 읽어요." },
    { name: "관성", hanja: "官星", w: { steady: 1, lead: 0.6, care: 0.4 },
      text: "책임감과 규율을 중시해 조직에서 신뢰를 얻어요. 스스로에게 엄격한 편이에요." },
    { name: "인성", hanja: "印星", w: { think: 1.2, care: 0.8 },
      text: "배움과 사색을 좋아하고 이해심이 깊어요. 생각이 많아 실행이 늦어질 때가 있어요." }
  ];

  // 겉(숙요 七曜 오행)과 속(일간 오행)의 관계
  const OUTER_INNER = {
    same: (o, i) => `겉으로 보이는 모습과 속마음의 결이 같아요. 숙요와 사주가 모두 ${o} 기운을 가리키고 있어서, 성향이 뚜렷하고 일관된 사람으로 보여요. 같은 기운이 겹치는 만큼 장점도 단점도 진하게 드러나요.`,
    outerFeeds: (o, i) => `겉으로 드러나는 기질(${o})이 내면의 기운(${i})을 북돋아 줘요. 사람들과 부딪히며 경험을 쌓을수록 오히려 본래의 힘이 살아나는 타입이에요.`,
    innerFeeds: (o, i) => `내면의 기운(${i})이 자연스럽게 겉모습(${o})으로 흘러나와요. 속마음을 행동과 태도로 표현하는 데 능하지만, 겉으로 쏟아 내느라 속이 지칠 수 있어요.`,
    outerRules: (o, i) => `겉으로 보이는 모습(${o})이 내면(${i})을 다잡는 구조예요. 사회적으로는 절제되고 단단해 보이지만, 속으로는 하고 싶은 것을 참는 경우가 많아요.`,
    innerRules: (o, i) => `내면의 기운(${i})이 겉모습(${o})을 다스리는 구조예요. 겉으로 보이는 성향을 스스로 잘 다룰 줄 알아서, 상황에 따라 다른 얼굴을 꺼내 쓰는 노련함이 있어요.`
  };
  function elemRelation(outer, inner) {
    if (outer === inner) return "same";
    if ((outer + 1) % 5 === inner) return "outerFeeds";
    if ((inner + 1) % 5 === outer) return "innerFeeds";
    if ((outer + 2) % 5 === inner) return "outerRules";
    return "innerRules";
  }

  /* =========================================================
   * 6. 개인 분석 (숙요 + 사주 혼합)
   * ========================================================= */
  function analyzePerson(input, opts) {
    const solar = input.solar;
    const lunar = input.lunar;
    const pillars = computePillars({ y: solar.y, m: solar.m, d: solar.d, hour: input.hour, minute: input.minute }, opts);
    const si = sukuIndex(lunar);
    const suku = SUKU[si];
    const dm = pillars.day.s;
    const dmEl = stemElem(dm);

    // 오행 분포
    const list = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean);
    const elemCount = [0, 0, 0, 0, 0];
    const godCount = [0, 0, 0, 0, 0];
    list.forEach((p, idx) => {
      elemCount[stemElem(p.s)]++;
      elemCount[BRANCH_ELEM[p.b]]++;
      if (!(idx === 2)) godCount[(stemElem(p.s) - dmEl + 5) % 5]++;
      godCount[(BRANCH_ELEM[p.b] - dmEl + 5) % 5]++;
    });
    const maxCount = Math.max(...elemCount);
    const minCount = Math.min(...elemCount);
    const strongEls = elemCount.map((c, i) => i).filter((i) => elemCount[i] === maxCount && maxCount >= 3);
    const weakEls = elemCount.map((c, i) => i).filter((i) => elemCount[i] === minCount && minCount <= 1);

    // 성향 점수: 숙요와 사주를 같은 축 위에서 합산
    const score = {};
    const source = {};
    TRAIT_KEYS.forEach((k) => { score[k] = 0; source[k] = { suku: 0, saju: 0 }; });
    const add = (k, v, src) => { score[k] += v; source[k][src] += v; };
    [3, 2, 1.5].forEach((v, i) => add(suku.t[i], v, "suku"));
    // 숙의 七曜 오행이 사주에서 차지하는 비중만큼 숙요 쪽 성향을 한 번 더 강조
    const yoEl = YO[suku.yo].el;
    add(suku.t[0], 1.2 * elemCount[yoEl] / list.length, "suku");
    [3, 2, 1.5].forEach((v, i) => add(DAY_MASTER[dm].t[i], v, "saju"));
    godCount.forEach((c, g) => {
      Object.entries(TEN_GODS[g].w).forEach(([k, w]) => add(k, c * w * 0.55, "saju"));
    });
    const ranked = TRAIT_KEYS.slice().sort((a, b) => score[b] - score[a]);
    const top = ranked.slice(0, 3);
    const maxScore = score[ranked[0]] || 1;
    const minScore = score[ranked[ranked.length - 1]];
    const percent = {};
    TRAIT_KEYS.forEach((k) => {
      percent[k] = Math.round(35 + 60 * (score[k] - minScore) / Math.max(0.01, maxScore - minScore));
    });

    const shared = suku.t.filter((t) => DAY_MASTER[dm].t.includes(t));
    const dominantGod = godCount.indexOf(Math.max(...godCount));

    return {
      name: input.name, solar, lunar, pillars, si, suku, dm, dmEl, yoEl,
      elemCount, godCount, strongEls, weakEls, score, source, percent, ranked, top, shared, dominantGod,
      headline: `${TRAITS[top[1]].adj} ${TRAITS[top[0]].noun}`,
      outerInner: OUTER_INNER[elemRelation(yoEl, dmEl)](ELEMENTS[yoEl].name, ELEMENTS[dmEl].name)
    };
  }

  /* =========================================================
   * 7. 궁합 분석 (숙요 삼구법 + 사주 관계)
   * ========================================================= */
  const DIMS = [
    { key: "attract", name: "끌림",
      high: "처음부터 서로에게 시선이 가는 강한 끌림이 있어요.",
      mid: "적당한 호감에서 시작해 자연스럽게 가까워지는 사이예요.",
      low: "첫 끌림보다는 시간이 쌓이며 정이 드는 사이예요." },
    { key: "talk", name: "소통",
      high: "말하지 않아도 통하는 부분이 많아 대화가 편해요.",
      mid: "대체로 잘 통하지만 중요한 이야기는 한 번 더 확인하면 좋아요.",
      low: "표현 방식이 달라 오해가 생기기 쉬워요. 한 번 더 확인하는 습관이 도움이 돼요." },
    { key: "stable", name: "안정",
      high: "함께 있으면 마음이 놓이고 관계가 오래 이어지기 쉬워요.",
      mid: "큰 흔들림은 없지만 서로 맞춰 가는 노력이 필요해요.",
      low: "감정의 기복이나 생활 리듬 차이로 흔들릴 때가 있어요." },
    { key: "grow", name: "성장",
      high: "서로에게 자극이 되어 함께 성장하는 관계예요.",
      mid: "편안함과 자극이 적당히 섞여 있어요.",
      low: "편안함에 머물러 변화가 적을 수 있어요. 함께하는 새 목표가 활력을 줘요." }
  ];

  const REL_TYPES = {
    love: { name: "연인·부부", w: [0.35, 0.25, 0.25, 0.15] },
    friend: { name: "친구", w: [0.15, 0.4, 0.2, 0.25] },
    work: { name: "직장·동료", w: [0.1, 0.35, 0.25, 0.3] },
    family: { name: "가족", w: [0.1, 0.3, 0.4, 0.2] }
  };

  // 삼구법 관계: 상대 숙까지의 거리(0~26)를 9로 나눈 나머지로 판정
  const ROLE_BY_REM = [null, "栄", "衰", "安", "危", "成", "壊", "友", "親"];
  const ROLE_KO = { "命": "명", "業": "업", "胎": "태", "栄": "영", "衰": "쇠", "安": "안", "危": "위", "成": "성", "壊": "괴", "友": "우", "親": "친" };
  const SUKU_REL = {
    mei: { label: "명(命)", title: "거울 같은 인연", mood: "good", fx: [8, 14, 4, -4],
      desc: "두 사람이 같은 본명숙을 가진 '명(命)'의 관계예요. 생각과 감정의 흐름이 닮아 말하지 않아도 통하지만, 내 단점까지 비춰 보여 주는 거울 같아서 때로는 불편함을 느끼기도 해요." },
    gyotai: { label: "업태(業胎)", title: "전생부터 이어진 인연", mood: "good", fx: [14, 8, 10, 6],
      desc: "숙요에서 '업(業)'과 '태(胎)'는 전생과 내생으로 이어지는 특별한 인연을 뜻해요. 이유 없이 끌리고 서로에게 깊은 영향을 주고받는 운명적인 관계예요." },
    eishin: { label: "영친(栄親)", title: "서로를 키워 주는 최고의 짝", mood: "good", fx: [10, 14, 14, 8],
      desc: "'영(栄)'은 번영을, '친(親)'은 친밀함을 뜻해요. 숙요에서 가장 좋은 관계로 꼽히며, 함께 있으면 서로의 운과 능력이 함께 커지는 상생의 인연이에요." },
    yusui: { label: "우쇠(友衰)", title: "편안한 친구 같은 사이", mood: "mid", fx: [4, 12, 8, -6],
      desc: "'우(友)'는 벗을, '쇠(衰)'는 느슨해짐을 뜻해요. 함께 있으면 편하고 즐겁지만, 편안한 만큼 서로를 나태하게 만들 수 있어 적당한 긴장감이 필요해요." },
    ankai: { label: "안괴(安壊)", title: "강하게 끌리지만 흔들리는 사이", mood: "tense", fx: [14, -6, -14, 8],
      desc: "'안(安)'과 '괴(壊)'의 관계는 숙요에서 가장 강렬한 인연이에요. 처음부터 강하게 끌리지만 서로의 삶을 크게 흔들 수 있어, 거리를 잘 조절하면 큰 변화와 성장을 함께 이끌어 내요." },
    kisei: { label: "위성(危成)", title: "다르기에 배우는 사이", mood: "tense", fx: [0, -8, -2, 12],
      desc: "'위(危)'와 '성(成)'은 서로 다른 가치관이 만나는 관계예요. 처음엔 어색하거나 엇갈리기 쉽지만, 차이를 인정하면 혼자서는 얻지 못할 것을 서로에게서 배워요." }
  };
  const PAIR_OF = { "栄": "eishin", "親": "eishin", "友": "yusui", "衰": "yusui", "安": "ankai", "壊": "ankai", "危": "kisei", "成": "kisei" };
  const DISTANCE = {
    near: { name: "근거리", factor: 1, text: "관계의 성질이 가장 강하고 빠르게 드러나요." },
    mid: { name: "중거리", factor: 0.8, text: "관계의 성질이 적당한 강도로 드러나요." },
    far: { name: "원거리", factor: 0.6, text: "관계의 성질이 은은하게, 시간이 지나며 서서히 드러나요." }
  };

  function sukuRelation(ia, ib) {
    const k = (ib - ia + 27) % 27;
    if (k === 0) return { type: "mei", roleAB: "命", roleBA: "命", distance: null };
    const r = k % 9;
    if (r === 0) {
      return { type: "gyotai", roleAB: k === 9 ? "業" : "胎", roleBA: k === 9 ? "胎" : "業", distance: null };
    }
    const roleAB = ROLE_BY_REM[r];
    const roleBA = ROLE_BY_REM[9 - r];
    // 같은 관계 유형의 세 가지 변형을 실제 원 위 간격으로 정렬해 근·중·원거리를 정한다
    const sep = (x) => Math.min(x, 27 - x);
    const variants = [r, r + 9, r + 18].map(sep).sort((a, b) => a - b);
    const pos = variants.indexOf(sep(k));
    return { type: PAIR_OF[roleAB], roleAB, roleBA, distance: ["near", "mid", "far"][pos] };
  }

  const STEM_HAP_EL = [2, 3, 4, 0, 1]; // 甲己土 乙庚金 丙辛水 丁壬木 戊癸火
  function stemRelation(a, b) {
    if (Math.abs(a - b) === 5) return { type: "hap", el: STEM_HAP_EL[Math.min(a, b)] };
    if (Math.abs(a - b) === 6 && Math.min(a, b) <= 3) return { type: "chung" };
    const ea = stemElem(a), eb = stemElem(b);
    if (ea === eb) return { type: "same" };
    if ((ea + 1) % 5 === eb) return { type: "aFeedsB" };
    if ((eb + 1) % 5 === ea) return { type: "bFeedsA" };
    if ((ea + 2) % 5 === eb) return { type: "aRulesB" };
    return { type: "bRulesA" };
  }
  const STEM_FX = {
    hap: [14, 6, 8, 2], chung: [4, -8, -10, 8], same: [2, 10, 4, -2],
    aFeedsB: [4, 6, 8, 4], bFeedsA: [4, 6, 8, 4], aRulesB: [6, -6, -4, 8], bRulesA: [6, -6, -4, 8]
  };

  const WONJIN = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];
  const SAMHAP_NAME = ["신자진(申子辰) 수국", "사유축(巳酉丑) 금국", "인오술(寅午戌) 화국", "해묘미(亥卯未) 목국"];
  function branchRelation(a, b) {
    if (a === b) return { type: "same" };
    if ((a + b) % 12 === 1) return { type: "yukhap" };
    if (Math.abs(a - b) === 6) return { type: "chung" };
    if (WONJIN.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return { type: "wonjin" };
    if (a % 4 === b % 4) return { type: "samhap", group: SAMHAP_NAME[a % 4] };
    return { type: "none" };
  }
  const BRANCH_FX = {
    yukhap: [8, 6, 12, 2], samhap: [4, 10, 6, 4], chung: [6, -6, -12, 6],
    wonjin: [2, -10, -6, 0], same: [2, 6, 2, 0], none: [0, 0, 0, 0]
  };

  const SYNTH = {
    "good-good": "숙요로 본 마음의 결과 사주로 본 기운의 흐름이 모두 좋은 인연을 가리켜요. 처음 만났을 때의 편안함이 시간이 지나도 이어지기 쉬운, 드물게 균형 잡힌 관계예요.",
    "good-mid": "마음이 잘 통하는 인연이에요. 사주상으로는 특별히 부딪히거나 끌어당기는 기운이 크지 않아, 정서적인 교감이 관계를 이끄는 힘이 돼요.",
    "good-tense": "마음은 잘 통하는데 생활의 리듬이나 기질에서 부딪히는 부분이 있어요. 감정적으로는 가깝지만, 일상에서의 차이를 조율하는 것이 관계의 열쇠예요.",
    "mid-good": "숙요로는 편안한 친구 같은 사이이고, 사주로는 기운이 서로를 잘 받쳐 줘요. 무리 없이 함께 지내기 좋은, 오래가는 관계의 바탕이 있어요.",
    "mid-mid": "특별히 강하게 끌리거나 부딪히지 않는 담백한 관계예요. 어떻게 쌓아 가느냐에 따라 얼마든지 깊어질 수 있어요.",
    "mid-tense": "편하게 지내다가도 중요한 순간에 생각 차이가 드러날 수 있어요. 편안함에 기대기보다 서로의 다름을 미리 이야기해 두면 좋아요.",
    "tense-good": "숙요로는 서로를 강하게 흔드는 관계지만, 사주로는 기운이 잘 맞아요. 처음엔 엇갈리거나 부딪혀도 시간이 지날수록 서로에게 필요한 존재가 되는 인연이에요.",
    "tense-mid": "숙요로 보면 서로에게 강한 자극을 주는 관계예요. 사주에서는 이를 크게 키우거나 누그러뜨리는 요소가 적어, 두 사람의 태도가 관계의 방향을 정해요.",
    "tense-tense": "숙요와 사주 모두 긴장감이 있는 조합이에요. 그만큼 서로에게 강렬한 영향을 주고 크게 성장시키는 관계이기도 해요. 거리 조절과 배려가 특히 중요해요."
  };

  const ADVICE = {
    love: {
      attract: "익숙함에 설렘이 묻히지 않게, 가끔은 처음처럼 데이트를 계획해 보세요.",
      talk: "감정이 상했을 때는 바로 결론 내기보다 '나는 이렇게 느꼈어'로 시작하는 대화를 해 보세요.",
      stable: "서로의 생활 리듬과 혼자만의 시간을 존중하는 규칙을 함께 정해 두면 흔들림이 줄어요.",
      grow: "함께 배우거나 도전할 작은 목표(여행, 운동, 취미)를 만들면 관계에 새 활력이 생겨요."
    },
    friend: {
      attract: "자주 못 보더라도 생각났을 때 먼저 연락하는 작은 습관이 우정을 이어 줘요.",
      talk: "농담 속 진심을 놓치지 않도록, 가끔은 진지한 이야기를 나누는 시간을 가져 보세요.",
      stable: "약속과 시간 감각이 다를 수 있어요. 서로 편한 연락 빈도를 솔직히 이야기해 두세요.",
      grow: "서로의 관심사를 한 번씩 함께 체험해 보면 우정의 폭이 넓어져요."
    },
    work: {
      attract: "업무 외 짧은 대화로 서로를 알아 두면 협업이 훨씬 매끄러워져요.",
      talk: "중요한 내용은 말로 끝내지 말고 글로 정리해 공유하면 오해를 크게 줄일 수 있어요.",
      stable: "역할과 책임 범위를 처음부터 분명히 나누면 부딪힐 일이 줄어요.",
      grow: "서로의 강점이 다른 만큼, 피드백을 주고받는 자리를 정기적으로 가져 보세요."
    },
    family: {
      attract: "가까울수록 고마움을 말로 표현하는 일이 관계를 따뜻하게 지켜 줘요.",
      talk: "잔소리처럼 들리지 않도록, 조언보다 먼저 상대의 이야기를 끝까지 들어 주세요.",
      stable: "서로의 영역과 결정을 존중하는 선을 정해 두면 갈등이 줄어요.",
      grow: "함께하는 작은 전통(식사, 산책, 여행)을 만들면 새로운 추억이 쌓여요."
    }
  };

  function analyzeCompat(A, B, relType) {
    const fx = [0, 0, 0, 0];
    const sukuFx = [0, 0, 0, 0];
    const sajuFx = [0, 0, 0, 0];
    const addFx = (target, arr, f) => arr.forEach((v, i) => { target[i] += v * f; fx[i] += v * f; });

    // 숙요
    const sr = sukuRelation(A.si, B.si);
    const srInfo = SUKU_REL[sr.type];
    addFx(sukuFx, srInfo.fx, sr.distance ? DISTANCE[sr.distance].factor : 1);

    // 사주: 일간, 일지, 띠, 오행 보완
    const notes = [];
    const st = stemRelation(A.dm, B.dm);
    addFx(sajuFx, STEM_FX[st.type], 1);
    notes.push({ kind: "stem", rel: st });
    const db = branchRelation(A.pillars.day.b, B.pillars.day.b);
    addFx(sajuFx, BRANCH_FX[db.type], 1);
    notes.push({ kind: "dayBranch", rel: db });
    const yb = branchRelation(A.pillars.year.b, B.pillars.year.b);
    addFx(sajuFx, BRANCH_FX[yb.type], 0.4);
    notes.push({ kind: "yearBranch", rel: yb });

    const fills = [];
    A.weakEls.forEach((e) => { if (B.elemCount[e] >= 3) fills.push({ from: B, to: A, el: e }); });
    B.weakEls.forEach((e) => { if (A.elemCount[e] >= 3) fills.push({ from: A, to: B, el: e }); });
    fills.slice(0, 3).forEach(() => addFx(sajuFx, [2, 2, 5, 5], 1));
    const bothWeak = A.weakEls.filter((e) => B.weakEls.includes(e) && A.elemCount[e] === 0 && B.elemCount[e] === 0);
    bothWeak.forEach(() => addFx(sajuFx, [0, 0, -3, -2], 1));

    // 기본 55점에서 두 체계의 영향을 1.4배로 반영 (대략 30~95점 분포)
    const dims = DIMS.map((d, i) => Math.max(12, Math.min(98, Math.round(55 + fx[i] * 1.4))));
    const w = REL_TYPES[relType].w;
    const total = Math.round(dims.reduce((s, v, i) => s + v * w[i], 0));
    const sajuSum = sajuFx.reduce((s, v) => s + v, 0);
    const sajuMood = sajuSum >= 12 ? "good" : sajuSum <= -4 ? "tense" : "mid";
    const lowDim = dims.indexOf(Math.min(...dims));
    const highDim = dims.indexOf(Math.max(...dims));

    return { sr, srInfo, st, db, yb, fills, bothWeak, dims, total, sajuMood, sukuFx, sajuFx,
      synth: SYNTH[`${srInfo.mood}-${sajuMood}`], lowDim, highDim, relType };
  }

  /* =========================================================
   * 8. 한국어 조사 도우미
   * ========================================================= */
  function hasBatchim(word) {
    const ch = String(word).trim().slice(-1);
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
    if (/[0-9]/.test(ch)) return "013678".includes(ch);
    return false;
  }
  const josa = (w, withB, without) => `${w}${hasBatchim(w) ? withB : without}`;
  const eunNeun = (w) => josa(w, "은", "는");
  const iGa = (w) => josa(w, "이", "가");
  const gwaWa = (w) => josa(w, "과", "와");
  const eulReul = (w) => josa(w, "을", "를");
  const ieyo = (w) => josa(w, "이에요", "예요");
  const ege = (w) => `${w}에게`;

  /* =========================================================
   * 9. 렌더링
   * ========================================================= */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pillarText = (p) => `${STEMS[p.s]}${BRANCHES[p.b]}`;

  function pillarTable(person) {
    const P = person.pillars;
    const cols = [
      { label: "시주", p: P.hour }, { label: "일주", p: P.day }, { label: "월주", p: P.month }, { label: "연주", p: P.year }
    ];
    const cell = (p, which) => {
      if (!p) return `<div class="pc pc-empty">?</div>`;
      const idx = which === "s" ? p.s : p.b;
      const el = which === "s" ? stemElem(idx) : BRANCH_ELEM[idx];
      const h = which === "s" ? STEMS_H[idx] : BRANCHES_H[idx];
      const k = which === "s" ? STEMS[idx] : BRANCHES[idx];
      return `<div class="pc ${ELEMENTS[el].cls}"><b>${h}</b><span>${k} · ${ELEMENTS[el].name}</span></div>`;
    };
    return `<div class="pillars">
      ${cols.map((c) => `<div class="pillar${c.label === "일주" ? " is-day" : ""}">
        <div class="pillar-label">${c.label}</div>${cell(c.p, "s")}${cell(c.p, "b")}</div>`).join("")}
    </div>`;
  }

  function elementBars(person) {
    const total = person.elemCount.reduce((a, b) => a + b, 0);
    return `<div class="elem-bars">${ELEMENTS.map((e, i) => `
      <div class="elem-row">
        <span class="elem-name ${e.cls}-text">${e.name}(${e.hanja})</span>
        <div class="elem-track"><div class="elem-fill ${e.cls}" style="width:${Math.round(person.elemCount[i] / total * 100)}%"></div></div>
        <span class="elem-num">${person.elemCount[i]}</span>
      </div>`).join("")}</div>`;
  }

  function traitBars(person) {
    return `<div class="trait-bars">${person.ranked.map((k) => {
      const s = person.source[k];
      const tot = s.suku + s.saju || 1;
      const sukuPct = Math.round(s.suku / tot * 100);
      return `<div class="trait-row${person.top.includes(k) ? " is-top" : ""}">
        <span class="trait-name">${TRAITS[k].name}</span>
        <div class="trait-track"><div class="trait-fill" style="width:${person.percent[k]}%;--sk:${sukuPct}%"></div></div>
        <span class="trait-src">숙요 ${sukuPct}% · 사주 ${100 - sukuPct}%</span>
      </div>`;
    }).join("")}</div>
    <p class="legend"><i class="dot dot-suku"></i>숙요에서 온 비중 <i class="dot dot-saju"></i>사주에서 온 비중</p>`;
  }

  function birthLine(person) {
    const s = person.solar, l = person.lunar;
    const time = person.pillars.timeKnown ? person.timeLabel : "시간 모름";
    return `양력 ${s.y}.${s.m}.${s.d} · 음력 ${l.y}.${l.isLeap ? "윤" : ""}${l.m}.${l.d} · ${time}`;
  }

  function renderPersonal(P) {
    const name = P.name || "당신";
    const suku = P.suku;
    const dmInfo = DAY_MASTER[P.dm];
    const dmLabel = `${STEMS[P.dm]}${ELEMENTS[P.dmEl].name}(${STEMS_H[P.dm]}${ELEMENTS[P.dmEl].hanja})`;
    const [t1, t2, t3] = P.top;

    const sharedLine = P.shared.length
      ? `숙요와 사주가 함께 가리키는 ${name}의 핵심은 <strong>${P.shared.map((t) => TRAITS[t].name).join("·")}</strong>이에요. 두 체계가 같은 답을 내놓은 만큼, 주변 사람들도 가장 먼저 알아보는 모습이에요.`
      : `숙요가 보여 주는 <strong>${TRAITS[suku.t[0]].name}</strong>과 사주가 보여 주는 <strong>${TRAITS[dmInfo.t[0]].name}</strong>이 서로 다른 방향을 가리켜요. 그래서 ${name}에게는 처음 보는 사람이 예상하지 못하는 의외의 면이 있어요.`;

    const strengths = [TRAITS[t1].strength, suku.strength, dmInfo.strength, TRAITS[t2].strength];
    const cautions = [TRAITS[t1].caution, suku.caution, dmInfo.caution];
    P.strongEls.forEach((e) => cautions.push(ELEMENTS[e].strong));

    const weak = P.weakEls.length ? P.weakEls : [P.elemCount.indexOf(Math.min(...P.elemCount))];
    const luckyEl = ELEMENTS[weak[0]];
    const god = TEN_GODS[P.dominantGod];

    return `
      <div class="result-header">
        <p class="eyebrow">성격 풀이</p>
        <h2>${name}의 기질</h2>
        <p class="result-sub">${birthLine(P)}</p>
      </div>

      <div class="hero-result">
        <div class="hero-result-main">
          <p class="hero-kicker">숙요 × 사주로 본 ${name}</p>
          <h3 class="hero-headline">${TRAITS[t2].adj} <span class="accent">${TRAITS[t1].noun}</span></h3>
          <div class="badges">
            <span class="badge">본명숙 ${sukuName(P.si)} · ${suku.nick}</span>
            <span class="badge">일간 ${dmLabel} · ${dmInfo.image}</span>
            <span class="badge">${ANIMALS[P.pillars.year.b]}띠</span>
            <span class="badge">${suku.yo}曜 · ${YO[suku.yo].day}</span>
          </div>
        </div>
        <div class="hero-traits">
          ${P.top.map((t, i) => `<div class="hero-trait"><span class="rank">${i + 1}</span><b>${TRAITS[t].name}</b><small>${TRAITS[t].core}</small></div>`).join("")}
        </div>
      </div>

      <div class="result-grid">
        <article class="r-card span-2">
          <h4>핵심 성격</h4>
          <p class="body-text">달의 자리로 보면 ${eunNeun(name)} <strong>${sukuName(P.si)}</strong>의 '${suku.nick}', 사주의 중심 글자로 보면 <strong>${ieyo(dmInfo.image)}</strong>.
            ${suku.desc} 사주로 보면 ${dmInfo.desc}</p>
          <p class="body-text">${sharedLine}</p>
          <p class="body-text">두 체계를 합쳐 보면 가장 강한 성향은 <strong>${TRAITS[t1].name}</strong>, 그다음은 <strong>${TRAITS[t2].name}</strong>과 <strong>${TRAITS[t3].name}</strong>이에요.
            ${iGa(TRAITS[t1].core)} ${eulReul(name)} 움직이는 중심이고, ${iGa(TRAITS[t2].core)} 그 힘에 색을 입혀요.</p>
        </article>

        <article class="r-card">
          <h4>겉과 속</h4>
          <p class="mini-label">겉: 숙요의 ${suku.yo}曜(${ELEMENTS[P.yoEl].name}) · 속: 일간의 ${ELEMENTS[P.dmEl].name}</p>
          <p class="body-text">${P.outerInner}</p>
        </article>

        <article class="r-card">
          <h4>사주 구조에서 보이는 힘</h4>
          <p class="mini-label">가장 많은 십신: ${god.name}(${god.hanja})</p>
          <p class="body-text">${god.text}</p>
        </article>

        <article class="r-card span-2">
          <h4>성향 지도</h4>
          ${traitBars(P)}
        </article>

        <article class="r-card">
          <h4>강점</h4>
          <ul class="bullets">${strengths.map((s) => `<li>${s}</li>`).join("")}</ul>
        </article>
        <article class="r-card">
          <h4>주의할 점</h4>
          <ul class="bullets">${cautions.map((s) => `<li>${s}</li>`).join("")}</ul>
        </article>

        <article class="r-card">
          <h4>관계 스타일</h4>
          <p class="body-text">${TRAITS[t1].rel} ${TRAITS[t2].rel}</p>
        </article>
        <article class="r-card">
          <h4>일하는 방식</h4>
          <p class="body-text">${TRAITS[t1].work} ${TRAITS[t2].work}</p>
        </article>

        <article class="r-card">
          <h4>오행 분포</h4>
          ${elementBars(P)}
          <p class="body-text small">${P.strongEls.length ? `<b>${P.strongEls.map((e) => ELEMENTS[e].name).join("·")}</b> 기운이 강해요. ` : ""}${P.weakEls.length ? `<b>${P.weakEls.map((e) => ELEMENTS[e].name).join("·")}</b> 기운이 약해요. ${ELEMENTS[P.weakEls[0]].weak}` : "다섯 기운이 비교적 고르게 퍼져 있어 균형이 좋아요."}</p>
        </article>
        <article class="r-card">
          <h4>행운 포인트</h4>
          <p class="mini-label">부족한 ${luckyEl.name}(${luckyEl.hanja}) 기운을 채우고, 본명숙의 요일을 활용해 보세요.</p>
          <ul class="lucky">
            <li><span>색</span>${luckyEl.color}</li>
            <li><span>방향</span>${luckyEl.dir}</li>
            <li><span>숫자</span>${luckyEl.num}</li>
            <li><span>활동</span>${luckyEl.act}</li>
            <li><span>요일</span>${YO[suku.yo].day} (${suku.yo}曜)</li>
          </ul>
        </article>

        <details class="r-card span-2 basis">
          <summary>계산 근거 보기</summary>
          ${pillarTable(P)}
          <p class="body-text small">사주 연도 ${P.pillars.sajuYear}년 (입춘 기준) · ${P.pillars.timeKnown ? P.pillars.solarNote : "시간 모름: 연·월·일주만 사용"}<br>
          본명숙: 음력 ${P.lunar.m}월 1일의 숙(${SUKU[MONTH_START[P.lunar.m - 1]].h}宿)에서 ${P.lunar.d - 1}칸 진행 → ${sukuName(P.si)} · 키워드 ${suku.kw.join(", ")}</p>
        </details>
      </div>

      <div class="result-footer">
        <button type="button" class="btn-secondary" data-action="to-compat">이 정보로 궁합 보기</button>
        <p class="disclaimer">숙요 27수와 사주(일간·오행·십신)의 전통 해석을 같은 성향 축으로 옮겨 합산한 결과입니다. 재미로 참고해 주세요.</p>
      </div>`;
  }

  function stemNote(rel, A, B) {
    const a = A.name, b = B.name;
    const ea = ELEMENTS[A.dmEl].name, eb = ELEMENTS[B.dmEl].name;
    const sa = `${STEMS[A.dm]}${ea}`, sb = `${STEMS[B.dm]}${eb}`;
    switch (rel.type) {
      case "hap": return `${a}의 ${gwaWa(sa)} ${b}의 ${eunNeun(sb)} 천간합(${ELEMENTS[rel.el].name}으로 합)을 이뤄요. 서로를 끌어당겨 하나가 되려는 기운이라 자연스러운 끌림과 결속력이 있어요.`;
      case "chung": return `${a}의 ${gwaWa(sa)} ${b}의 ${eunNeun(sb)} 천간충 관계예요. 생각과 방식이 정면으로 엇갈리기 쉽지만, 그만큼 서로에게 없는 시각을 보여 줘요.`;
      case "same": return `두 사람 모두 ${ea} 기운의 일간이라 사고방식이 비슷해 말이 잘 통해요. 다만 비슷한 만큼 서로 양보하지 않고 경쟁할 때가 있어요.`;
      case "aFeedsB": return `${a}의 일간(${ea})이 ${b}의 일간(${eb})을 생해 주는 관계예요. ${eunNeun(a)} 자연스럽게 ${eulReul(b)} 챙기고 북돋고, ${eunNeun(b)} ${a} 곁에서 편안함을 느껴요.`;
      case "bFeedsA": return `${b}의 일간(${eb})이 ${a}의 일간(${ea})을 생해 주는 관계예요. ${eunNeun(b)} 자연스럽게 ${eulReul(a)} 챙기고 북돋고, ${eunNeun(a)} ${b} 곁에서 편안함을 느껴요.`;
      case "aRulesB": return `${a}의 일간(${ea})이 ${b}의 일간(${eb})을 극하는 관계예요. ${a} 쪽이 주도하고 ${b} 쪽이 맞춰 가는 구도가 되기 쉬워 배려가 필요하지만, 서로에게 긴장감 있는 자극이 돼요.`;
      default: return `${b}의 일간(${eb})이 ${a}의 일간(${ea})을 극하는 관계예요. ${b} 쪽이 주도하고 ${a} 쪽이 맞춰 가는 구도가 되기 쉬워 배려가 필요하지만, 서로에게 긴장감 있는 자극이 돼요.`;
    }
  }

  function branchNote(rel, label, ba, bb) {
    const pair = `${BRANCHES[ba]}(${BRANCHES_H[ba]})·${BRANCHES[bb]}(${BRANCHES_H[bb]})`;
    switch (rel.type) {
      case "yukhap": return `${label}가 육합(${pair})을 이뤄요. 서로를 편하게 받아 주고 정이 깊어지는 조합이에요.`;
      case "samhap": return `${label}가 ${rel.group}의 일부를 이뤄요. 같은 방향을 바라보며 함께 무언가를 이뤄 가기 좋은 기운이에요.`;
      case "chung": return `${label}가 충(${pair}) 관계예요. 생활 패턴이나 가치관에서 부딪히기 쉽지만 강한 자극과 끌림이 함께 있어요.`;
      case "wonjin": return `${label}가 원진(${pair}) 관계예요. 이유 없이 서운함이 쌓이기 쉬우니 작은 오해를 그때그때 풀어 주세요.`;
      case "same": return `${label}가 같은 ${BRANCHES[ba]}(${BRANCHES_H[ba]})라 생활 리듬과 취향이 닮았어요.`;
      default: return `${label}에는 특별한 합이나 충이 없어 무난해요.`;
    }
  }

  function personMini(P) {
    const dmInfo = DAY_MASTER[P.dm];
    return `<div class="person-mini">
      <p class="pm-name">${P.name}</p>
      <p class="pm-head">${TRAITS[P.top[1]].adj} ${TRAITS[P.top[0]].noun}</p>
      <p class="pm-meta">${sukuName(P.si)} · ${STEMS[P.dm]}${ELEMENTS[P.dmEl].name} ${dmInfo.image}</p>
      <p class="pm-meta small">${birthLine(P)}</p>
    </div>`;
  }

  function renderCompat(A, B, C) {
    const a = A.name, b = B.name;
    const sr = C.sr, info = C.srInfo;
    const roleLine = sr.type === "mei"
      ? `두 사람의 본명숙이 모두 ${sukuName(A.si)}예요.`
      : `${ege(a)} ${eunNeun(b)} '${ROLE_KO[sr.roleAB]}(${sr.roleAB})', ${ege(b)} ${eunNeun(a)} '${ROLE_KO[sr.roleBA]}(${sr.roleBA})'의 자리예요.`;
    const distLine = sr.distance ? `<p class="mini-label">${DISTANCE[sr.distance].name} · ${DISTANCE[sr.distance].text}</p>` : "";

    const sajuNotes = [
      stemNote(C.st, A, B),
      branchNote(C.db, "두 사람의 일지(생활·배우자 자리)", A.pillars.day.b, B.pillars.day.b),
      branchNote(C.yb, `${a}의 ${ANIMALS[A.pillars.year.b]}띠와 ${b}의 ${ANIMALS[B.pillars.year.b]}띠`, A.pillars.year.b, B.pillars.year.b)
    ];
    C.fills.forEach((f) => sajuNotes.push(`${f.to.name}에게 부족한 ${ELEMENTS[f.el].name} 기운을 ${f.from.name} 쪽이 넉넉히 갖고 있어 서로를 채워 줘요.`));
    C.bothWeak.forEach((e) => sajuNotes.push(`두 사람 모두 ${ELEMENTS[e].name} 기운이 없어요. 함께 ${ELEMENTS[e].act.split(",")[0]} 같은 활동을 해 보면 균형을 잡는 데 도움이 돼요.`));

    const ta = A.top[0], tb = B.top[0];
    const traitLine = ta === tb
      ? `두 사람 모두 '${TRAITS[ta].noun}' 기질이 가장 강해요. 공감대가 크지만 같은 지점에서 부딪힐 수 있으니 역할을 나누어 보세요.`
      : `${eunNeun(a)} ${TRAITS[A.top[1]].adj} ${TRAITS[ta].noun}, ${eunNeun(b)} ${TRAITS[B.top[1]].adj} ${TRAITS[tb].noun} 유형이에요. ${a}의 ${gwaWa(TRAITS[ta].core)} ${b}의 ${iGa(TRAITS[tb].core)} 만나 서로의 빈자리를 채워 줄 수 있어요.`;

    const level = (v) => (v >= 65 ? "high" : v < 45 ? "low" : "mid");
    const rel = REL_TYPES[C.relType];
    const lowKey = DIMS[C.lowDim].key;

    return `
      <div class="result-header">
        <p class="eyebrow">궁합 풀이 · ${rel.name}</p>
        <h2>${a} × ${b}</h2>
      </div>

      <div class="hero-result compat-hero">
        <div class="score-ring" style="--p:${C.total}">
          <div><b>${C.total}</b><span>점</span></div>
        </div>
        <div class="hero-result-main">
          <p class="hero-kicker">숙요 ${info.label} × 사주</p>
          <h3 class="hero-headline">${info.title}</h3>
          <p class="body-text">${C.synth}</p>
        </div>
      </div>

      <div class="people-row">${personMini(A)}<div class="pm-x">×</div>${personMini(B)}</div>

      <div class="result-grid">
        <article class="r-card span-2">
          <h4>관계의 네 가지 축</h4>
          <div class="dim-list">${DIMS.map((d, i) => `
            <div class="dim-row">
              <div class="dim-head"><b>${d.name}</b><span>${C.dims[i]}</span></div>
              <div class="dim-track"><div class="dim-fill" style="width:${C.dims[i]}%"></div></div>
              <p>${d[level(C.dims[i])]}</p>
            </div>`).join("")}
          </div>
          <p class="legend">점수는 숙요 관계와 사주 관계가 각 축에 주는 영향을 합산한 값이며, 종합 점수는 '${rel.name}' 관계에서 중요한 축에 가중치를 둔 것이에요.</p>
        </article>

        <article class="r-card">
          <h4>마음의 결 · 숙요</h4>
          <p class="mini-label">${info.label} — ${info.title}</p>
          ${distLine}
          <p class="body-text">${roleLine} ${info.desc}</p>
        </article>

        <article class="r-card">
          <h4>기운의 흐름 · 사주</h4>
          <ul class="bullets">${sajuNotes.map((n) => `<li>${n}</li>`).join("")}</ul>
        </article>

        <article class="r-card">
          <h4>성향의 조합</h4>
          <p class="body-text">${traitLine}</p>
        </article>

        <article class="r-card">
          <h4>관계를 위한 조언</h4>
          <p class="mini-label">가장 보완이 필요한 축: ${DIMS[C.lowDim].name} · 가장 강한 축: ${DIMS[C.highDim].name}</p>
          <p class="body-text">${ADVICE[C.relType][lowKey]}</p>
        </article>
      </div>

      <div class="result-footer">
        <button type="button" class="btn-secondary" data-action="back-to-form">다시 보기</button>
        <p class="disclaimer">숙요 삼구법과 사주의 일간·일지·띠·오행 관계를 끌림·소통·안정·성장 네 축으로 합산한 결과입니다. 재미로 참고해 주세요.</p>
      </div>`;
  }

  /* =========================================================
   * 10. 입력 폼
   * ========================================================= */
  function option(v, label, sel) { return `<option value="${v}"${sel ? " selected" : ""}>${label}</option>`; }

  function personFieldsHTML(prefix) {
    const years = [];
    for (let y = MAX_YEAR; y >= MIN_YEAR; y--) years.push(option(y, `${y}년`, y === 1995));
    const months = Array.from({ length: 12 }, (_, i) => option(i + 1, `${i + 1}월`, false)).join("");
    const days = Array.from({ length: 31 }, (_, i) => option(i + 1, `${i + 1}일`, false)).join("");
    const hours = [option("", "모름", true)].concat(Array.from({ length: 24 }, (_, i) => option(i, `${i}시`, false))).join("");
    const mins = Array.from({ length: 60 }, (_, i) => option(i, `${String(i).padStart(2, "0")}분`, false)).join("");
    return `
      <div class="field">
        <label for="${prefix}-name">이름 (선택)</label>
        <input type="text" id="${prefix}-name" class="f-name" maxlength="12" placeholder="${prefix === "b" ? "예: 상대" : "예: 나"}">
      </div>
      <div class="field">
        <label>생년월일</label>
        <div class="seg cal-seg">
          <label><input type="radio" name="${prefix}-cal" value="solar" checked> 양력</label>
          <label><input type="radio" name="${prefix}-cal" value="lunar"> 음력</label>
          <label class="leap-wrap hidden"><input type="checkbox" class="f-leap"> 윤달</label>
        </div>
        <div class="row3">
          <select class="f-year" aria-label="출생 연도">${years.join("")}</select>
          <select class="f-month" aria-label="출생 월">${months}</select>
          <select class="f-day" aria-label="출생 일">${days}</select>
        </div>
      </div>
      <div class="field">
        <label>태어난 시각</label>
        <div class="row2">
          <select class="f-hour" aria-label="출생 시">${hours}</select>
          <select class="f-min" aria-label="출생 분" disabled>${mins}</select>
        </div>
      </div>`;
  }

  function wirePersonFields(box) {
    const prefix = box.dataset.prefix;
    box.innerHTML = personFieldsHTML(prefix);
    const leapWrap = box.querySelector(".leap-wrap");
    const daySel = box.querySelector(".f-day");
    box.querySelectorAll(`input[name="${prefix}-cal"]`).forEach((r) => r.addEventListener("change", () => {
      const lunar = box.querySelector(`input[name="${prefix}-cal"]:checked`).value === "lunar";
      leapWrap.classList.toggle("hidden", !lunar);
      if (!lunar) box.querySelector(".f-leap").checked = false;
      daySel.querySelectorAll("option").forEach((o) => { o.hidden = lunar && Number(o.value) > 30; });
      if (lunar && Number(daySel.value) > 30) daySel.value = "30";
    }));
    const hourSel = box.querySelector(".f-hour");
    hourSel.addEventListener("change", () => { box.querySelector(".f-min").disabled = hourSel.value === ""; });
  }

  function readPerson(box, fallbackName) {
    const prefix = box.dataset.prefix;
    const name = esc(box.querySelector(".f-name").value.trim()) || fallbackName;
    const cal = box.querySelector(`input[name="${prefix}-cal"]:checked`).value;
    const y = Number(box.querySelector(".f-year").value);
    const m = Number(box.querySelector(".f-month").value);
    const d = Number(box.querySelector(".f-day").value);
    const leap = box.querySelector(".f-leap").checked;
    const hv = box.querySelector(".f-hour").value;
    const hour = hv === "" ? null : Number(hv);
    const minute = hour === null ? 0 : Number(box.querySelector(".f-min").value);

    let solar, lunar;
    if (cal === "solar") {
      if (!isValidSolar(y, m, d)) return { error: `${name}: ${y}년 ${m}월에는 ${d}일이 없어요.` };
      solar = { y, m, d };
      lunar = solarToLunar(y, m, d);
    } else {
      const r = lunarToSolar(y, m, d, leap);
      if (r.error) return { error: `${name}: ${r.error}` };
      solar = r;
      lunar = { y, m, d, isLeap: leap };
    }
    if (!lunar || solar.y < MIN_YEAR || solar.y > MAX_YEAR) return { error: `${name}: ${MIN_YEAR}~${MAX_YEAR}년 사이의 날짜만 계산할 수 있어요.` };
    const timeLabel = hour === null ? "" : `${hour}시 ${String(minute).padStart(2, "0")}분`;
    return { name, solar, lunar, hour, minute, timeLabel };
  }

  function readOptions(form) {
    const city = form.querySelector(".adv-city").value;
    const zasi = form.querySelector(".adv-zasi:checked").value;
    return { longitude: city === "none" ? null : Number(city), zasi };
  }

  function buildPerson(input, opts) {
    const p = analyzePerson(input, opts);
    p.timeLabel = input.timeLabel;
    return p;
  }

  function showResult(html) {
    const section = document.getElementById("result-section");
    document.getElementById("result-root").innerHTML = html;
    section.classList.remove("hidden");
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setMode(mode) {
    document.querySelectorAll(".mode-tab").forEach((t) => {
      const on = t.dataset.mode === mode;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.getElementById("personal-form").classList.toggle("hidden", mode !== "personal");
    document.getElementById("compat-form").classList.toggle("hidden", mode !== "compat");
  }

  function copyPersonFields(fromBox, toBox) {
    const fp = fromBox.dataset.prefix, tp = toBox.dataset.prefix;
    toBox.querySelector(".f-name").value = fromBox.querySelector(".f-name").value;
    const cal = fromBox.querySelector(`input[name="${fp}-cal"]:checked`).value;
    const radio = toBox.querySelector(`input[name="${tp}-cal"][value="${cal}"]`);
    radio.checked = true;
    radio.dispatchEvent(new Event("change"));
    [".f-year", ".f-month", ".f-day", ".f-hour", ".f-min"].forEach((s) => { toBox.querySelector(s).value = fromBox.querySelector(s).value; });
    toBox.querySelector(".f-leap").checked = fromBox.querySelector(".f-leap").checked;
    toBox.querySelector(".f-hour").dispatchEvent(new Event("change"));
  }

  function showError(form, msg) {
    const el = form.querySelector(".form-error");
    el.textContent = msg || "";
    el.classList.toggle("hidden", !msg);
  }

  function init() {
    const tpl = document.getElementById("advanced-template");
    document.querySelectorAll(".advanced-slot").forEach((slot, i) => {
      slot.appendChild(tpl.content.cloneNode(true));
      slot.querySelectorAll(".adv-zasi").forEach((r) => { r.name = `zasi-${i}`; });
    });
    document.querySelectorAll(".person-fields").forEach(wirePersonFields);

    document.querySelectorAll(".mode-tab").forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));

    const pForm = document.getElementById("personal-form");
    pForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = readPerson(pForm.querySelector(".person-fields"), "당신");
      if (input.error) return showError(pForm, input.error);
      showError(pForm, "");
      showResult(renderPersonal(buildPerson(input, readOptions(pForm))));
    });

    const cForm = document.getElementById("compat-form");
    cForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const boxes = cForm.querySelectorAll(".person-fields");
      const ia = readPerson(boxes[0], "나");
      if (ia.error) return showError(cForm, ia.error);
      const ib = readPerson(boxes[1], "상대");
      if (ib.error) return showError(cForm, ib.error);
      if (ia.name === ib.name) ib.name = `${ib.name}(2)`;
      showError(cForm, "");
      const opts = readOptions(cForm);
      const A = buildPerson(ia, opts), B = buildPerson(ib, opts);
      showResult(renderCompat(A, B, analyzeCompat(A, B, document.getElementById("rel-type").value)));
    });

    document.getElementById("result-root").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "to-compat") {
        copyPersonFields(pForm.querySelector(".person-fields"), cForm.querySelectorAll(".person-fields")[0]);
        setMode("compat");
      } else {
        setMode("compat");
      }
      document.getElementById("result-section").classList.add("hidden");
      document.getElementById("analyze").scrollIntoView({ behavior: "smooth" });
    });
  }

  // 테스트용 노출
  window.SukuyoSaju = { solarToLunar, lunarToSolar, computePillars, sukuIndex, sukuRelation, analyzePerson, analyzeCompat, SUKU, pillarText };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
