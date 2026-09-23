(() => {
  "use strict";

  /* =========================================================
     TAROT DECK DATA
     78 cards from the traditional (Rider–Waite-style) tarot
     system: 22 Major Arcana + 56 Minor Arcana (Wands / Cups /
     Swords / Pentacles). Keywords below reflect the standard,
     widely-published symbolic meanings for each card in both
     upright and reversed orientation. This is the entire "data
     source" behind every reading in this prototype — nothing
     is fetched from a server or database.
     ========================================================= */

  const MAJOR_ARCANA = [
    { n: 0, name: "The Fool", ko: "바보", up: ["새로운 시작", "순수함", "모험"], rev: ["무모함", "경솔함", "방향 상실"] },
    { n: 1, name: "The Magician", ko: "마법사", up: ["의지력", "창조", "자원 활용"], rev: ["조작", "재능 낭비", "자신감 부족"] },
    { n: 2, name: "The High Priestess", ko: "여사제", up: ["직관", "신비", "잠재의식"], rev: ["비밀", "단절된 직관", "혼란"] },
    { n: 3, name: "The Empress", ko: "여황제", up: ["풍요", "양육", "자연"], rev: ["창조적 막힘", "의존", "과잉보호"] },
    { n: 4, name: "The Emperor", ko: "황제", up: ["권위", "구조", "통제"], rev: ["경직됨", "권위 남용", "독단"] },
    { n: 5, name: "The Hierophant", ko: "교황", up: ["전통", "신념", "제도"], rev: ["반항", "새로운 접근", "관습 탈피"] },
    { n: 6, name: "The Lovers", ko: "연인", up: ["사랑", "조화", "선택"], rev: ["불균형", "잘못된 선택", "갈등"] },
    { n: 7, name: "The Chariot", ko: "전차", up: ["의지", "승리", "결단"], rev: ["방향 상실", "통제력 부족", "좌절"] },
    { n: 8, name: "Strength", ko: "힘", up: ["용기", "인내", "내면의 힘"], rev: ["자기 의심", "나약함", "조급함"] },
    { n: 9, name: "The Hermit", ko: "은둔자", up: ["성찰", "고독", "내면 탐구"], rev: ["고립", "외로움", "길 잃음"] },
    { n: 10, name: "Wheel of Fortune", ko: "운명의 수레바퀴", up: ["전환점", "운명", "순환"], rev: ["불운", "통제력 상실", "정체"] },
    { n: 11, name: "Justice", ko: "정의", up: ["공정함", "진실", "인과"], rev: ["불공정", "책임 회피", "편향"] },
    { n: 12, name: "The Hanged Man", ko: "매달린 사람", up: ["새로운 관점", "항복", "기다림"], rev: ["정체", "저항", "희생의 낭비"] },
    { n: 13, name: "Death", ko: "죽음", up: ["끝과 시작", "변화", "전환"], rev: ["변화에 대한 저항", "정체", "두려움"] },
    { n: 14, name: "Temperance", ko: "절제", up: ["균형", "인내", "조화"], rev: ["불균형", "과잉", "조급함"] },
    { n: 15, name: "The Devil", ko: "악마", up: ["속박", "집착", "물질주의"], rev: ["해방", "자각", "속박에서 벗어남"] },
    { n: 16, name: "The Tower", ko: "탑", up: ["급격한 변화", "붕괴", "각성"], rev: ["재난 회피", "두려움 지속", "지연된 변화"] },
    { n: 17, name: "The Star", ko: "별", up: ["희망", "영감", "치유"], rev: ["절망", "신뢰 상실", "막막함"] },
    { n: 18, name: "The Moon", ko: "달", up: ["환상", "두려움", "잠재의식"], rev: ["혼란 해소", "명료함 회복", "불안 완화"] },
    { n: 19, name: "The Sun", ko: "태양", up: ["기쁨", "성공", "활력"], rev: ["일시적 우울", "과도한 낙관", "에너지 저하"] },
    { n: 20, name: "Judgement", ko: "심판", up: ["각성", "재탄생", "소명"], rev: ["자기 의심", "판단 회피", "미련"] },
    { n: 21, name: "The World", ko: "세계", up: ["완성", "성취", "통합"], rev: ["미완성", "지연된 완성", "마무리 부족"] },
  ];

  const SUITS = [
    { key: "wands", name: "Wands", ko: "완드", element: "불", theme: "열정・행동・창조" },
    { key: "cups", name: "Cups", ko: "컵", element: "물", theme: "감정・관계・직관" },
    { key: "swords", name: "Swords", ko: "소드", element: "공기", theme: "생각・갈등・소통" },
    { key: "pentacles", name: "Pentacles", ko: "펜타클", element: "흙", theme: "현실・물질・일" },
  ];

  const RANK_LABELS = {
    1: "에이스", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10",
    11: "페이지", 12: "나이트", 13: "퀸", 14: "킹",
  };

  const WANDS = {
    1: { up: ["새로운 시작", "영감", "잠재력"], rev: ["지연된 시작", "동기 부족", "막힘"] },
    2: { up: ["계획", "미래 설계", "발전"], rev: ["두려움", "우유부단", "계획 부재"] },
    3: { up: ["확장", "예측", "해외 진출"], rev: ["지연", "장애물", "좁은 시야"] },
    4: { up: ["축하", "안정", "조화"], rev: ["불화", "취소", "불안정"] },
    5: { up: ["경쟁", "갈등", "도전"], rev: ["내부 갈등", "회피", "긴장 해소"] },
    6: { up: ["승리", "인정", "자신감"], rev: ["자만", "지연된 성공", "불안한 승리"] },
    7: { up: ["방어", "맞섬", "끈기"], rev: ["압도됨", "포기", "지친 저항"] },
    8: { up: ["빠른 진행", "움직임", "소식"], rev: ["지연", "좌절", "혼선"] },
    9: { up: ["인내", "경계심", "회복력"], rev: ["소진", "편집증", "방어적 태도"] },
    10: { up: ["부담", "책임", "과로"], rev: ["짐 내려놓기", "위임", "한계 인식"] },
    11: { up: ["탐험", "열정", "새로운 아이디어"], rev: ["무모함", "방향성 부족", "산만함"] },
    12: { up: ["모험", "충동", "열정적 행동"], rev: ["조급함", "무모한 도전", "성급한 결정"] },
    13: { up: ["자신감", "독립성", "따뜻한 카리스마"], rev: ["요구적 태도", "질투", "불안정한 자신감"] },
    14: { up: ["비전", "리더십", "대담함"], rev: ["오만", "성급함", "독단적 결정"] },
  };

  const CUPS = {
    1: { up: ["새로운 사랑", "감정의 시작", "직관"], rev: ["감정 억압", "공허함", "놓친 기회"] },
    2: { up: ["파트너십", "연결", "상호 이끌림"], rev: ["불균형", "이별", "어긋난 마음"] },
    3: { up: ["우정", "축하", "공동체"], rev: ["과잉", "고립", "소문"] },
    4: { up: ["무관심", "명상", "재평가"], rev: ["새로운 동기", "각성", "기회 포착"] },
    5: { up: ["상실", "후회", "슬픔"], rev: ["수용", "앞으로 나아감", "치유"] },
    6: { up: ["향수", "어린 시절", "재회"], rev: ["과거에 얽매임", "미숙함", "현실 도피"] },
    7: { up: ["환상", "선택지", "백일몽"], rev: ["명확함", "현실적 선택", "우선순위 정리"] },
    8: { up: ["떠남", "내면 탐구", "실망"], rev: ["두려움에 머무름", "정체", "미련"] },
    9: { up: ["만족", "소원 성취", "행복"], rev: ["과욕", "물질적 만족의 공허", "자기 만족"] },
    10: { up: ["조화", "가족의 행복", "정서적 충만"], rev: ["깨진 관계", "불화", "어긋난 기대"] },
    11: { up: ["감수성", "창의적 메시지", "직관적 시작"], rev: ["정서적 미성숙", "백일몽", "실망"] },
    12: { up: ["낭만", "매력", "이상주의"], rev: ["변덕", "비현실적 기대", "감정 기복"] },
    13: { up: ["공감", "양육", "직관"], rev: ["감정 과잉", "의존", "불안정한 정서"] },
    14: { up: ["정서적 균형", "외교", "지혜"], rev: ["감정 조작", "냉담함", "억압된 감정"] },
  };

  const SWORDS = {
    1: { up: ["명료함", "돌파구", "진실"], rev: ["혼란", "잘못된 정보", "판단 착오"] },
    2: { up: ["결정 보류", "균형", "딜레마"], rev: ["우유부단", "정보 회피", "긴장 고조"] },
    3: { up: ["상심", "슬픔", "배신"], rev: ["회복", "용서", "치유의 시작"] },
    4: { up: ["휴식", "회복", "명상"], rev: ["소진", "정체", "강제된 휴식"] },
    5: { up: ["갈등", "패배", "자기 이익"], rev: ["화해", "후회", "관계 회복"] },
    6: { up: ["이행", "전환", "회복으로 향함"], rev: ["정체", "미해결 문제", "과거에 발목"] },
    7: { up: ["전략", "기만", "회피"], rev: ["자백", "죄책감", "발각"] },
    8: { up: ["속박", "제한된 신념", "무력감"], rev: ["자기 해방", "새로운 관점", "제약 극복"] },
    9: { up: ["불안", "걱정", "악몽"], rev: ["절망", "내면의 어둠", "불안 해소"] },
    10: { up: ["종결", "바닥", "고통의 끝"], rev: ["회복", "저항", "느린 재기"] },
    11: { up: ["호기심", "경계", "새로운 아이디어"], rev: ["성급한 판단", "소문", "무례함"] },
    12: { up: ["결단력", "야망", "빠른 행동"], rev: ["무모함", "공격성", "충동적 결정"] },
    13: { up: ["독립적 사고", "명확한 경계", "정직"], rev: ["냉정함", "비판적 태도", "고독"] },
    14: { up: ["지적 권위", "진실", "명확한 판단"], rev: ["조작", "권위 남용", "독선"] },
  };

  const PENTACLES = {
    1: { up: ["새로운 기회", "번영의 시작", "풍요"], rev: ["놓친 기회", "계획 부족", "불안정한 시작"] },
    2: { up: ["균형", "적응", "우선순위 조정"], rev: ["과부하", "불균형", "우선순위 혼란"] },
    3: { up: ["협업", "기술", "팀워크"], rev: ["불협화음", "낮은 기준", "소통 부족"] },
    4: { up: ["안정", "저축", "통제"], rev: ["집착", "인색함", "변화에 대한 두려움"] },
    5: { up: ["경제적 어려움", "소외", "불안"], rev: ["회복", "지원 발견", "상황 개선"] },
    6: { up: ["나눔", "관용", "균형 잡힌 교환"], rev: ["빚", "이기심", "불공정한 거래"] },
    7: { up: ["인내", "장기적 투자", "평가"], rev: ["조급함", "부족한 보상", "방향 재검토"] },
    8: { up: ["장인정신", "숙련", "헌신"], rev: ["완벽주의", "단조로움", "품질 저하"] },
    9: { up: ["풍요", "독립", "자기 충족"], rev: ["재정적 과시", "고립", "불안정한 풍요"] },
    10: { up: ["유산", "장기적 성공", "가족의 부"], rev: ["재정적 손실", "가족 갈등", "불안정한 기반"] },
    11: { up: ["학구열", "새로운 기술", "실용적 계획"], rev: ["게으름", "비현실적 목표", "산만함"] },
    12: { up: ["근면", "신뢰성", "꾸준함"], rev: ["정체", "지루함", "느린 진행"] },
    13: { up: ["실용성", "양육", "풍요로움"], rev: ["일과 삶의 불균형", "과잉보호", "불안정"] },
    14: { up: ["재정적 성공", "안정", "리더십"], rev: ["물질주의", "완고함", "권위적 태도"] },
  };

  const MINOR_TABLE = { wands: WANDS, cups: CUPS, swords: SWORDS, pentacles: PENTACLES };

  function buildDeck() {
    const deck = MAJOR_ARCANA.map((c) => ({
      id: `major-${c.n}`,
      n: c.n,
      name: c.name,
      ko: c.ko,
      arcana: "major",
      up: c.up,
      rev: c.rev,
    }));
    SUITS.forEach((suit) => {
      const table = MINOR_TABLE[suit.key];
      for (let rank = 1; rank <= 14; rank++) {
        const entry = table[rank];
        deck.push({
          id: `${suit.key}-${rank}`,
          name: `${RANK_LABELS[rank]} of ${suit.name}`,
          ko: `${suit.ko} ${RANK_LABELS[rank]}`,
          arcana: "minor",
          suit: suit.key,
          suitKo: suit.ko,
          rank,
          up: entry.up,
          rev: entry.rev,
        });
      }
    });
    return deck;
  }

  const TAROT_DECK = buildDeck();

  /* ---------------- draw logic ---------------- */

  function shuffledIndices(n) {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function drawCards(count) {
    const order = shuffledIndices(TAROT_DECK.length).slice(0, count);
    return order.map((idx) => ({
      card: TAROT_DECK[idx],
      reversed: Math.random() < 0.5,
    }));
  }

  const SPREADS = {
    one: { count: 1, positions: ["오늘의 카드"] },
    three: { count: 3, positions: ["과거", "현재", "미래"] },
  };

  /* ---------------- card art (inline SVG icons) ----------------
     No external image files are fetched — every card gets a small
     hand-drawn vector icon instead: 22 distinct icons for the Major
     Arcana, a suit glyph for each of the 4 minor suits, and pip/court
     layouts built from those suit glyphs, so all 78 cards render
     visually differently instead of sharing one emoji.
  */

  const SUIT_ICON_PATH = {
    wands:
      '<line x1="50" y1="22" x2="50" y2="80"/><path d="M50,10 C56,18 56,27 50,32 C44,27 44,18 50,10 Z" fill="currentColor" stroke="none"/>',
    cups:
      '<path d="M32,20 L68,20 L60,50 Q50,58 40,50 Z"/><line x1="50" y1="58" x2="50" y2="72"/><line x1="35" y1="80" x2="65" y2="80"/>',
    swords:
      '<line x1="50" y1="16" x2="50" y2="62"/><path d="M50,16 L44,27 L56,27 Z" fill="currentColor" stroke="none"/><line x1="32" y1="62" x2="68" y2="62"/><line x1="50" y1="62" x2="50" y2="84"/>',
    pentacles:
      '<circle cx="50" cy="50" r="32"/><path d="M50,26 L58,45 L79,45 L62,57 L69,78 L50,65 L31,78 L38,57 L21,45 L42,45 Z"/>',
  };

  /* Dedicated per-suit/major identity colors (fixed hex, independent of
     light/dark theme) — used for each card's gradient tint, medallion
     glow and border, like the ink color on a real printed deck. */
  const MAJOR_HEX = "#b98cff";
  const SUIT_HEX = {
    wands: "#ff9d5c",
    cups: "#5ec3ff",
    swords: "#8b93a8",
    pentacles: "#d4af5a",
  };

  function cardTint(card) {
    return card.arcana === "major" ? MAJOR_HEX : SUIT_HEX[card.suit];
  }

  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
  const COURT_INDEX = { 1: "A", 11: "P", 12: "N", 13: "Q", 14: "K" };

  function cornerIndex(card) {
    if (card.arcana === "major") return card.n === 0 ? "0" : ROMAN[card.n];
    return COURT_INDEX[card.rank] || String(card.rank);
  }

  const COURT_ICON_PATH = {
    11: // Page
      '<circle cx="50" cy="32" r="10"/><path d="M36,76 L50,46 L64,76 Z"/>',
    12: // Knight
      '<path d="M35,62 Q35,32 50,27 Q65,32 65,62 L55,62 L55,46 Q55,39 50,39 Q45,39 45,46 L45,62 Z"/>',
    13: // Queen
      '<circle cx="50" cy="48" r="13"/><path d="M35,32 L40,20 L47,29 L50,17 L53,29 L60,20 L65,32 Z"/>',
    14: // King
      '<circle cx="50" cy="45" r="13"/><path d="M32,30 L38,17 L44,27 L50,14 L56,27 L62,17 L68,30 Z"/><path d="M30,78 Q50,62 70,78 L70,86 L30,86 Z"/>',
  };

  const MAJOR_ICON = {
    0: '<circle cx="50" cy="58" r="9"/><line x1="50" y1="30" x2="50" y2="40"/><line x1="36" y1="36" x2="42" y2="44"/><line x1="64" y1="36" x2="58" y2="44"/><line x1="26" y1="50" x2="35" y2="52"/><line x1="74" y1="50" x2="65" y2="52"/>',
    1: '<path d="M38,35 C38,29 46,29 50,35 C54,41 62,41 62,35 C62,29 54,29 50,35 C46,41 38,41 38,35 Z"/><line x1="50" y1="45" x2="50" y2="75"/>',
    2: '<line x1="30" y1="35" x2="30" y2="75"/><line x1="70" y1="35" x2="70" y2="75"/><path d="M42,30 a10,10 0 1,0 16,0 a13,13 0 1,1 -16,0"/>',
    3: '<circle cx="50" cy="50" r="7"/><circle cx="50" cy="32" r="7"/><circle cx="50" cy="68" r="7"/><circle cx="32" cy="50" r="7"/><circle cx="68" cy="50" r="7"/>',
    4: '<rect x="34" y="45" width="32" height="32"/><path d="M34,45 L50,25 L66,45 Z"/>',
    5: '<circle cx="42" cy="35" r="9"/><line x1="42" y1="44" x2="42" y2="75"/><line x1="42" y1="65" x2="52" y2="65"/><line x1="42" y1="72" x2="50" y2="72"/>',
    6: '<circle cx="42" cy="50" r="16"/><circle cx="58" cy="50" r="16"/>',
    7: '<rect x="35" y="35" width="30" height="22"/><circle cx="38" cy="68" r="9"/><circle cx="62" cy="68" r="9"/>',
    8: '<path d="M38,32 C38,26 46,26 50,32 C54,38 62,38 62,32 C62,26 54,26 50,32 C46,38 38,38 38,32 Z"/><path d="M30,65 Q50,80 70,65"/>',
    9: '<rect x="42" y="45" width="16" height="24" rx="2"/><line x1="50" y1="35" x2="50" y2="45"/><circle cx="50" cy="30" r="5"/><line x1="45" y1="69" x2="55" y2="69"/>',
    10: '<circle cx="50" cy="50" r="26"/><line x1="50" y1="24" x2="50" y2="76"/><line x1="24" y1="50" x2="76" y2="50"/><line x1="32" y1="32" x2="68" y2="68"/><line x1="68" y1="32" x2="32" y2="68"/>',
    11: '<line x1="50" y1="20" x2="50" y2="70"/><line x1="30" y1="35" x2="70" y2="35"/><path d="M30,35 L22,50 L38,50 Z"/><path d="M70,35 L62,50 L78,50 Z"/><line x1="38" y1="75" x2="62" y2="75"/>',
    12: '<line x1="50" y1="20" x2="50" y2="32"/><circle cx="50" cy="42" r="8"/><line x1="50" y1="50" x2="50" y2="70"/><line x1="50" y1="70" x2="38" y2="60"/><line x1="50" y1="70" x2="62" y2="60"/><line x1="50" y1="55" x2="40" y2="45"/><line x1="50" y1="55" x2="60" y2="45"/>',
    13: '<circle cx="50" cy="42" r="16"/><circle cx="44" cy="40" r="3" fill="currentColor" stroke="none"/><circle cx="56" cy="40" r="3" fill="currentColor" stroke="none"/><path d="M42,50 L44,58 L48,50 L50,58 L52,50 L56,58 L58,50"/>',
    14: '<path d="M25,30 L40,30 L36,45 Q32,50 28,45 Z"/><path d="M60,55 L75,55 L71,70 Q67,75 63,70 Z"/><line x1="34" y1="38" x2="66" y2="62"/>',
    15: '<circle cx="50" cy="52" r="14"/><path d="M38,42 L30,28 L42,36 Z"/><path d="M62,42 L70,28 L58,36 Z"/><circle cx="45" cy="50" r="2" fill="currentColor" stroke="none"/><circle cx="55" cy="50" r="2" fill="currentColor" stroke="none"/>',
    16: '<rect x="42" y="40" width="16" height="40"/><path d="M42,40 L50,25 L58,40"/><path d="M60,20 L50,45 L58,45 L46,75"/>',
    17: '<path d="M50,24 L57,42 L76,42 L61,54 L67,73 L50,62 L33,73 L39,54 L24,42 L43,42 Z"/><circle cx="20" cy="25" r="2" fill="currentColor" stroke="none"/><circle cx="80" cy="30" r="2" fill="currentColor" stroke="none"/><circle cx="75" cy="70" r="2" fill="currentColor" stroke="none"/>',
    18: '<path d="M55,25 a25,25 0 1,0 0,50 a19,19 0 1,1 0,-50"/><circle cx="25" cy="30" r="2" fill="currentColor" stroke="none"/><circle cx="30" cy="70" r="2" fill="currentColor" stroke="none"/>',
    19: '<circle cx="50" cy="50" r="14"/><line x1="50" y1="18" x2="50" y2="28"/><line x1="50" y1="72" x2="50" y2="82"/><line x1="18" y1="50" x2="28" y2="50"/><line x1="72" y1="50" x2="82" y2="50"/><line x1="27" y1="27" x2="34" y2="34"/><line x1="73" y1="27" x2="66" y2="34"/><line x1="27" y1="73" x2="34" y2="66"/><line x1="73" y1="73" x2="66" y2="66"/>',
    20: '<path d="M30,45 L55,35 L55,55 Z"/><line x1="55" y1="45" x2="72" y2="45"/><circle cx="76" cy="45" r="5"/>',
    21: '<circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="18"/>',
  };

  function iconSvg(inner, extraClass) {
    return `<svg viewBox="0 0 100 100" class="card-svg-icon${extraClass ? " " + extraClass : ""}" aria-hidden="true">${inner}</svg>`;
  }

  // A 12-tick zodiac-style ring drawn behind every major/court icon, and a
  // shared ground line + four corner stars layered onto majors, so each
  // medallion reads as a small framed scene instead of one bare glyph.
  const RING_TICKS = (() => {
    let s = '<circle cx="50" cy="50" r="47"/>';
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 * Math.PI) / 180;
      const x1 = (50 + 41 * Math.sin(a)).toFixed(1);
      const y1 = (50 - 41 * Math.cos(a)).toFixed(1);
      const x2 = (50 + 47 * Math.sin(a)).toFixed(1);
      const y2 = (50 - 47 * Math.cos(a)).toFixed(1);
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }
    return s;
  })();

  const GROUND_LINE = '<path d="M14,87 Q50,97 86,87"/>';
  const STAR_ACCENTS =
    '<circle cx="14" cy="16" r="1.8" fill="currentColor" stroke="none"/>' +
    '<circle cx="86" cy="16" r="1.8" fill="currentColor" stroke="none"/>' +
    '<circle cx="12" cy="50" r="1.4" fill="currentColor" stroke="none"/>' +
    '<circle cx="88" cy="50" r="1.4" fill="currentColor" stroke="none"/>';

  function cardArtHTML(card) {
    if (card.arcana === "major") {
      const icon = MAJOR_ICON[card.n] + GROUND_LINE + STAR_ACCENTS;
      return `<div class="card-art major-art"><div class="icon-medallion">
        <div class="medallion-ring">${iconSvg(RING_TICKS)}</div>
        <div class="medallion-icon">${iconSvg(icon)}</div>
      </div></div>`;
    }
    if (card.rank >= 11) {
      const icon = COURT_ICON_PATH[card.rank] + GROUND_LINE;
      return `<div class="card-art court-art"><div class="icon-medallion">
        <div class="medallion-ring">${iconSvg(RING_TICKS)}</div>
        <div class="medallion-icon">${iconSvg(icon)}</div>
        <div class="suit-badge">${iconSvg(SUIT_ICON_PATH[card.suit])}</div>
      </div></div>`;
    }
    const pips = Array.from({ length: card.rank }, () => iconSvg(SUIT_ICON_PATH[card.suit], "pip-icon")).join("");
    return `<div class="card-art pip-art">${pips}</div>`;
  }

  /* ---------------- reading (interpretation) engine ----------------
     Combines question + spread position + the drawn card's own
     orientation, suit/element and keywords into an actual explanatory
     paragraph, instead of just listing keywords. This is a rule-based
     template composer (no external AI call) — see the FAQ on the page
     for why, and what it would take to make this a live model call.
  */

  const POSITION_PHRASE = {
    "오늘의 카드": "오늘 하루의 기운으로는",
    "과거": "지금까지 이어져 온 배경에는",
    "현재": "지금 이 순간에는",
    "미래": "앞으로 다가올 흐름에는",
  };

  const ORIENT_CAUTION = {
    up: "다만 좋은 기운일수록 과신하기 쉬우니, 속도를 조절하며 균형을 잃지 않는 것이 중요합니다.",
    rev: "이런 흐름에서는 조급하게 밀어붙이기보다, 잠시 멈춰서 무엇이 막혀 있는지부터 살펴보는 편이 도움이 됩니다.",
  };

  const SUIT_ELEMENT = {
    wands: "완드는 불의 기운을 가진 수트로, 열정・추진력・도전정신처럼 능동적으로 움직이는 상황에서 특히 두드러지게 작용합니다.",
    cups: "컵은 물의 기운을 가진 수트로, 감정・관계・직관처럼 마음의 흐름과 관련된 부분을 섬세하게 비춰줍니다.",
    swords: "소드는 공기의 기운을 가진 수트로, 생각・판단・의사소통처럼 머리로 정리해야 하는 국면에서 자주 등장합니다.",
    pentacles: "펜타클은 흙의 기운을 가진 수트로, 현실적인 여건・재정・일처럼 눈에 보이고 손에 잡히는 흐름을 구체적으로 드러냅니다.",
  };
  const MAJOR_ELEMENT =
    "메이저 아르카나는 전체 78장 중 22장뿐인 만큼, 일상의 사소한 사건보다는 삶 전체의 방향에 영향을 주는 큰 전환점이나 배움을 가리키는 경우가 많습니다.";

  const SUIT_ADVICE = {
    wands: "행동으로 옮기기 전에 방향을 한 번 더 점검해보면 좋겠습니다.",
    cups: "마음이 이끄는 대로, 지금 느끼는 감정을 솔직하게 들여다보는 것이 도움이 될 수 있습니다.",
    swords: "상황을 냉정하게 정리하고, 필요한 대화나 결정을 미루지 않는 것이 중요해 보입니다.",
    pentacles: "눈앞의 현실적인 부분부터 하나씩 차근차근 다져나가는 것이 핵심입니다.",
  };
  const MAJOR_ADVICE = "인생의 큰 흐름과 맞닿아 있는 메시지이니, 당장의 결과보다 방향성 자체에 집중해보는 것이 좋겠습니다.";

  const POSITION_CLOSING = {
    "오늘의 카드": "오늘 하루, 이 메시지를 마음 한편에 담아두고 지내보시면 좋겠습니다.",
    "과거": "지나간 일을 곱씹기보다, 그 경험에서 지금 가져올 수 있는 것이 무엇인지에 주목해보세요.",
    "현재": "지금 느끼는 감정이나 생각을 있는 그대로 인정하는 것부터 시작해보시면 좋겠습니다.",
    "미래": "아직 오지 않은 시간을 미리 걱정하기보다, 지금 할 수 있는 준비에 집중해보시면 좋겠습니다.",
  };

  function hasBatchim(word) {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    if (code < 0 || code > 11171) return true; // not a Hangul syllable, assume consonant-ending
    return code % 28 !== 0;
  }

  function eulReul(word) {
    return hasBatchim(word) ? "을" : "를";
  }

  function eunNeun(word) {
    return hasBatchim(word) ? "은" : "는";
  }

  function buildMeaningSentence(card, reversed) {
    const lastUp = card.up[2];
    if (!reversed) {
      return `이 카드는 정방향으로 나와, ${card.up[0]}, ${card.up[1]}, ${lastUp}${eulReul(lastUp)} 상징하는 기운이 또렷하고 자연스럽게 드러나고 있는 것으로 보입니다.`;
    }
    // Reversed cards get their own dedicated keyword set (card.rev), not
    // "the upright meaning, flipped by the reader" — the upright keyword is
    // only named here for contrast, so the reversed meaning that follows
    // reads as the actual interpretation rather than an instruction to
    // invert it yourself.
    const lastRev = card.rev[2];
    return (
      `이 카드는 역방향으로 나왔습니다. 정방향이었다면 '${card.up[0]}'처럼 순조롭게 드러났을 기운이지만, ` +
      `지금은 그렇지 않고 ${card.rev[0]}, ${card.rev[1]}, ${lastRev}${eulReul(lastRev)} 상징하는 쪽으로 나타나고 있습니다.`
    );
  }

  function buildReading(question, position, draw) {
    const { card, reversed } = draw;
    const orientLabel = reversed ? "역방향" : "정방향";
    const posPhrase = POSITION_PHRASE[position] || "지금 이 자리에는";
    const questionPhrase = question ? `"${question}"라는 질문과 연결해보면, ` : "";
    const caution = ORIENT_CAUTION[reversed ? "rev" : "up"];
    const elementText = card.arcana === "major" ? MAJOR_ELEMENT : SUIT_ELEMENT[card.suit];
    const advice = card.arcana === "major" ? MAJOR_ADVICE : SUIT_ADVICE[card.suit];
    const closing = POSITION_CLOSING[position] || "";

    return [
      `${questionPhrase}${posPhrase} ${card.ko}(${orientLabel}) 카드가 자리하고 있습니다.`,
      buildMeaningSentence(card, reversed),
      elementText,
      caution,
      advice,
      closing,
    ]
      .filter(Boolean)
      .join(" ");
  }

  function buildSynthesis(question, draws) {
    const topKeyword = (d) => (d.reversed ? d.card.rev : d.card.up)[0];
    const orientOf = (d) => (d.reversed ? "역방향" : "정방향");
    const [past, present, future] = draws;
    const qPhrase = question ? `"${question}"에 대해 세 카드를 종합하면, ` : "세 카드를 종합하면, ";

    return [
      `${qPhrase}과거 자리의 ${past.card.ko}(${orientOf(past)})${eunNeun(past.card.ko)} '${topKeyword(past)}'의 흐름에서 지금까지 이어져 온 배경을 보여주고,`,
      `현재 자리의 ${present.card.ko}(${orientOf(present)})${eunNeun(present.card.ko)} '${topKeyword(present)}'의 국면으로 지금의 상황을 짚어줍니다.`,
      `그리고 미래 자리의 ${future.card.ko}(${orientOf(future)})${eunNeun(future.card.ko)} '${topKeyword(future)}' 쪽으로 흐름이 이어질 가능성을 보여줍니다.`,
      `세 카드를 이어서 보면, 과거의 배경이 지금의 태도와 판단에 여전히 영향을 주고 있고, 지금 이 순간 어떻게 대응하느냐가 앞으로의 흐름을 상당 부분 바꿀 수 있다는 점을 함께 읽을 수 있습니다.`,
      `카드가 가리키는 방향을 정해진 결과로 받아들이기보다, 지금 선택할 수 있는 것이 무엇인지 확인하는 참고 자료로 활용해보시길 권합니다.`,
    ].join(" ");
  }

  function renderSpread(question, spreadKey, draws) {
    document.getElementById("reading-question").textContent = question
      ? `"${question}"에 대한 리딩`
      : "오늘의 타로 리딩";

    const row = document.getElementById("spread-row");
    row.innerHTML = "";
    row.className = "spread-row spread-" + spreadKey;

    const readingList = document.getElementById("reading-list");
    readingList.innerHTML = "";

    const synthesisBlock = document.getElementById("synthesis-block");

    const positions = SPREADS[spreadKey].positions;

    draws.forEach((draw, i) => {
      const position = positions[i];

      /* visual card */
      const wrap = document.createElement("div");
      wrap.className = "tarot-card-wrap";

      const posLabel = document.createElement("div");
      posLabel.className = "tarot-position";
      posLabel.textContent = position;
      wrap.appendChild(posLabel);

      const cardEl = document.createElement("div");
      cardEl.className = "tarot-card" + (draw.reversed ? " is-reversed" : "");
      const idx = cornerIndex(draw.card);
      cardEl.innerHTML = `
        <div class="tarot-card-inner">
          <div class="tarot-card-face tarot-card-back-design">
            <div class="back-medallion">
              <div class="medallion-ring">${iconSvg(RING_TICKS)}</div>
              <span class="back-mark medallion-icon">☾</span>
            </div>
          </div>
          <div class="tarot-card-face tarot-card-front" style="--card-tint:${cardTint(draw.card)}">
            <span class="corner-index corner-tl">${idx}</span>
            <span class="corner-index corner-br">${idx}</span>
            ${cardArtHTML(draw.card)}
            <div class="tarot-card-name">${draw.card.ko}</div>
            <div class="tarot-card-orient">${draw.reversed ? "역방향" : "정방향"}</div>
          </div>
        </div>
      `;
      wrap.appendChild(cardEl);
      row.appendChild(wrap);

      setTimeout(() => {
        cardEl.classList.add("flipped");
      }, 150 + i * 250);

      /* written reading */
      const keywords = draw.reversed ? draw.card.rev : draw.card.up;
      const block = document.createElement("div");
      block.className = "reading-block";
      block.innerHTML = `
        <div class="reading-block-head">
          <span class="reading-position">${position}</span>
          <span class="reading-card-name">${draw.card.ko}</span>
          <span class="reading-orient">${draw.reversed ? "역방향" : "정방향"}</span>
        </div>
        <div class="tag-list">${keywords.map((k) => `<span class="tag">${k}</span>`).join("")}</div>
        <p class="body-text">${buildReading(question, position, draw)}</p>
      `;
      readingList.appendChild(block);
    });

    if (spreadKey === "three") {
      synthesisBlock.classList.remove("hidden");
      synthesisBlock.innerHTML = `
        <h3>전체 흐름 정리</h3>
        <p class="body-text">${buildSynthesis(question, draws)}</p>
      `;
    } else {
      synthesisBlock.classList.add("hidden");
      synthesisBlock.innerHTML = "";
    }
  }

  /* ---------------- deck browser ---------------- */

  function renderDeckBrowser() {
    const majorGrid = document.getElementById("deck-major");
    majorGrid.innerHTML = TAROT_DECK.filter((c) => c.arcana === "major")
      .map((c) => `<button type="button" class="tag deck-tag" data-id="${c.id}">${c.n}. ${c.ko}</button>`)
      .join("");

    SUITS.forEach((suit) => {
      const grid = document.getElementById(`deck-${suit.key}`);
      if (!grid) return;
      const cards = TAROT_DECK.filter((c) => c.suit === suit.key);
      grid.innerHTML = cards
        .map((c) => `<button type="button" class="tag deck-tag" data-id="${c.id}">${c.ko}</button>`)
        .join("");
    });

    document.querySelectorAll(".deck-tag").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = TAROT_DECK.find((c) => c.id === btn.dataset.id);
        if (card) openCardModal(card);
      });
    });
  }

  /* ---------------- card detail modal ---------------- */

  function cardMetaLabel(card) {
    if (card.arcana === "major") return "메이저 아르카나";
    const suit = SUITS.find((s) => s.key === card.suit);
    return `마이너 아르카나 · ${suit.ko} (${suit.element})`;
  }

  function openCardModal(card) {
    const modal = document.getElementById("card-modal");
    const body = document.getElementById("card-modal-body");
    const elementText = card.arcana === "major" ? MAJOR_ELEMENT : SUIT_ELEMENT[card.suit];

    body.innerHTML = `
      <div class="card-modal-art-wrap" style="--card-tint:${cardTint(card)}">
        ${cardArtHTML(card)}
      </div>
      <div class="card-modal-title">
        <div class="card-modal-name-ko" id="card-modal-name">${card.ko}</div>
        <div class="card-modal-name-en">${card.name}</div>
        <span class="card-modal-meta">${cardMetaLabel(card)}</span>
      </div>
      <div class="card-modal-section">
        <h4>정방향</h4>
        <div class="tag-list">${card.up.map((k) => `<span class="tag">${k}</span>`).join("")}</div>
      </div>
      <div class="card-modal-section">
        <h4>역방향</h4>
        <div class="tag-list">${card.rev.map((k) => `<span class="tag">${k}</span>`).join("")}</div>
      </div>
      <div class="card-modal-section">
        <p class="body-text">${elementText}</p>
      </div>
    `;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeCardModal() {
    const modal = document.getElementById("card-modal");
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  /* ---------------- flow control ---------------- */

  const LOADING_STEPS = [
    "카드를 섞는 중...",
    "질문의 흐름을 읽는 중...",
    "카드를 펼치는 중...",
    "리딩을 완성하는 중...",
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
    renderDeckBrowser();

    const form = document.getElementById("fortune-form");
    const submitBtn = document.getElementById("submit-btn");
    const resultSection = document.getElementById("result-section");
    const retryBtn = document.getElementById("retry-btn");
    const spreadButtons = document.querySelectorAll(".spread-btn");
    let selectedSpread = "one";

    spreadButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        spreadButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedSpread = btn.dataset.spread;
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const question = document.getElementById("question").value.trim();

      submitBtn.disabled = true;
      resultSection.classList.add("hidden");

      runLoadingAnimation(() => {
        const draws = drawCards(SPREADS[selectedSpread].count);
        renderSpread(question, selectedSpread, draws);
        resultSection.classList.remove("hidden");
        resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
        submitBtn.disabled = false;
      });
    });

    retryBtn.addEventListener("click", () => {
      resultSection.classList.add("hidden");
      document.getElementById("fortune-form").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.getElementById("card-modal-close").addEventListener("click", closeCardModal);
    document.getElementById("card-modal-backdrop").addEventListener("click", closeCardModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !document.getElementById("card-modal").classList.contains("hidden")) {
        closeCardModal();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
