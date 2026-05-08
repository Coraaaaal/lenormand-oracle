/**
 * 灵境·雷诺曼 Edge Function v2
 * 路径: /edge-functions/oracle.js → URL: /oracle
 *
 * 知识库完全来自原始 data/lenormand.json，逻辑与 app.py 保持一致
 */

// ─────────────────────────────────────────────────────────────
// 1. 原始知识库（完整内联自 data/lenormand.json）
// ─────────────────────────────────────────────────────────────
const LENORMAND_DB = {
  cards: {
    "1":  { name: "骑士",    tags: { reality: ["消息","访客","新动态","到来"],         emotion: "中性偏激",     dynamic: ["触发","连接","进入","移动"],           domain: { work:0.9, love:0.7, daily:0.8 }, time: ["快速","即时","9天内"] } },
    "2":  { name: "四叶草",  tags: { reality: ["运气","机会","小确幸","偶然"],         emotion: "积极",         dynamic: ["短暂膨胀","转瞬即逝","轻微助益"],     domain: { work:0.6, love:0.9, daily:0.8 }, time: ["短暂","当下","转瞬"] } },
    "3":  { name: "船",      tags: { reality: ["旅行","远方","进出口","迁移"],         emotion: "中性",         dynamic: ["移动","扩展","距离","探索"],           domain: { work:0.9, love:0.8, daily:0.6 }, time: ["缓慢但持续","数月","长途"] } },
    "4":  { name: "房子",    tags: { reality: ["家庭","稳定","根基","机构","房产"],   emotion: "安定、安全",   dynamic: ["稳固","停滞","保守","积累"],           domain: { work:0.8, love:1.0, daily:0.9 }, time: ["长期","永久","稳固期"] } },
    "5":  { name: "树",      tags: { reality: ["健康","生命","过去","因果","成长"],   emotion: "中性偏慢",     dynamic: ["生长","积累","扎根","缓慢发展"],       domain: { work:0.7, love:0.8, daily:0.9 }, time: ["缓慢","以年计","长期过程"] } },
    "6":  { name: "云",      tags: { reality: ["混乱","误解","模糊","不确定"],         emotion: "消极、困惑",   dynamic: ["遮蔽","阻碍","不清","扰乱"],           domain: { work:0.8, love:0.9, daily:0.7 }, time: ["不确定","延迟","混乱期"] } },
    "7":  { name: "蛇",      tags: { reality: ["复杂","纠缠","女性","智慧","细节"],   emotion: "精明、诱惑",   dynamic: ["曲折","渗透","缠绕","迂回"],           domain: { work:0.9, love:0.9, daily:0.5 }, time: ["中间过程","绕路","需耐心"] } },
    "8":  { name: "棺材",    tags: { reality: ["结束","死亡","盒子","休息","终结"],   emotion: "压抑、终结",   dynamic: ["终止","冻结","无法动弹","闭合"],       domain: { work:0.9, love:0.9, daily:0.8 }, time: ["停滞期","结束时刻","静止"] } },
    "9":  { name: "花束",    tags: { reality: ["礼物","赞美","邀请","颜值","馈赠"],   emotion: "愉悦、礼貌",   dynamic: ["瞬时绽放","给予","美化","社交润滑"],   domain: { work:0.7, love:1.0, daily:0.9 }, time: ["短暂","节日","当下美好"] } },
    "10": { name: "镰刀",    tags: { reality: ["切割","手术","决断","危险","分离"],   emotion: "锋利、突然",   dynamic: ["切断","分离","果断","立即执行"],       domain: { work:0.9, love:0.9, daily:0.7 }, time: ["瞬间","立刻停止","突变"] } },
    "11": { name: "鞭子",    tags: { reality: ["争论","重复","运动","性","冲突"],     emotion: "焦躁、摩擦",   dynamic: ["反复","激烈","施压","强迫"],           domain: { work:0.8, love:0.9, daily:0.6 }, time: ["频繁","重复周期","短期多次"] } },
    "12": { name: "鸟",      tags: { reality: ["聊天","电话","一对多","社交"],         emotion: "兴奋、紧张",   dynamic: ["传递","扩散","交流","沟通"],           domain: { work:0.8, love:0.8, daily:0.9 }, time: ["短暂","碎片化","即时沟通"] } },
    "13": { name: "小孩",    tags: { reality: ["新人","幼稚","开始","单纯","小规模"], emotion: "天真、依赖",   dynamic: ["萌芽","无负担","成长起点"],             domain: { work:0.7, love:0.9, daily:0.8 }, time: ["刚开始","不成熟阶段","新周期"] } },
    "14": { name: "狐狸",    tags: { reality: ["工作","谋生","欺骗","精明","警惕"],   emotion: "警惕、自私",   dynamic: ["迂回","算计","生存策略"],               domain: { work:1.0, love:0.6, daily:0.8 }, time: ["工作日","朝九晚五","谨慎期"] } },
    "15": { name: "熊",      tags: { reality: ["权力","保护","上司","母亲","力量"],   emotion: "强势、包容",   dynamic: ["掌控","镇压","支持","庇护"],           domain: { work:1.0, love:0.9, daily:0.7 }, time: ["权力存续期","长期影响"] } },
    "16": { name: "星星",    tags: { reality: ["目标","指引","希望","网络","愿景"],   emotion: "清晰、期待",   dynamic: ["导向","规划","明确","指引"],           domain: { work:0.9, love:0.7, daily:0.6 }, time: ["未来导向","夜间","长期指引"] } },
    "17": { name: "鹳",      tags: { reality: ["变化","迁移","升级","怀孕","改善"],   emotion: "跃迁、期待",   dynamic: ["位移","改善","更迭","过渡"],           domain: { work:0.9, love:0.9, daily:0.8 }, time: ["过渡期","季节更替","变化节点"] } },
    "18": { name: "狗",      tags: { reality: ["朋友","信任","忠实","支持"],           emotion: "温暖、支持",   dynamic: ["陪伴","跟随","守护","协助"],           domain: { work:0.8, love:1.0, daily:0.9 }, time: ["长期稳定","持续陪伴"] } },
    "19": { name: "塔",      tags: { reality: ["孤独","官方","机构","边界","权威"],   emotion: "疏离、严肃",   dynamic: ["孤立","竖立","权威","隔离"],           domain: { work:1.0, love:0.5, daily:0.6 }, time: ["长期","缓慢","体制周期"] } },
    "20": { name: "花园",    tags: { reality: ["公众","社交圈","聚会","展示"],         emotion: "开放、展示",   dynamic: ["扩大接触面","公开","社交传播"],         domain: { work:0.8, love:0.8, daily:1.0 }, time: ["白天","聚会时刻","社交期"] } },
    "21": { name: "山",      tags: { reality: ["阻碍","敌人","挑战","延时"],           emotion: "沉重、顽固",   dynamic: ["阻挡","无法逾越","压力"],               domain: { work:0.9, love:0.8, daily:0.7 }, time: ["停滞","延迟","漫长等待"] } },
    "22": { name: "十字路口",tags: { reality: ["选择","出行","多种可能","决策"],       emotion: "犹豫、游离",   dynamic: ["分流","变数","自由","分支"],           domain: { work:0.9, love:0.8, daily:0.7 }, time: ["变化节点","决定时刻","多选项期"] } },
    "23": { name: "老鼠",    tags: { reality: ["损失","消耗","焦虑","小人"],           emotion: "侵蚀、烦躁",   dynamic: ["减少","损坏","内耗","流失"],           domain: { work:0.8, love:0.7, daily:0.9 }, time: ["逐渐流失","持续损耗"] } },
    "24": { name: "心",      tags: { reality: ["爱情","情感","愉悦","核心"],           emotion: "温暖、热爱",   dynamic: ["吸引","软化","融合","联结"],           domain: { work:0.5, love:1.0, daily:0.8 }, time: ["情感存续期","长期情感"] } },
    "25": { name: "戒指",    tags: { reality: ["承诺","合同","循环","绑定","关系"],   emotion: "约束、责任",   dynamic: ["连结","闭环","重复","锁定"],           domain: { work:0.9, love:1.0, daily:0.7 }, time: ["周期","固定期限","长期绑定"] } },
    "26": { name: "书",      tags: { reality: ["秘密","知识","项目","未知","信息"],   emotion: "内敛、深沉",   dynamic: ["隐藏","学习","未解锁","研究"],         domain: { work:1.0, love:0.8, daily:0.6 }, time: ["未到揭晓时","学习阶段","隐秘期"] } },
    "27": { name: "信",      tags: { reality: ["文件","信息","表达","沟通"],           emotion: "中性、告知",   dynamic: ["触发","连接","送达","传递"],           domain: { work:0.9, love:0.8, daily:0.9 }, time: ["即时","书面","消息时刻"] } },
    "28": { name: "男人",    tags: { reality: ["男性","主动方","阳性能量","人物"],     emotion: "视情况",       dynamic: ["主导","行动","施动"],                   domain: { work:0.8, love:1.0, daily:0.8 }, time: ["不适用"] } },
    "29": { name: "女人",    tags: { reality: ["女性","被动方","阴性能量","人物"],     emotion: "视情况",       dynamic: ["接纳","反应","受动"],                   domain: { work:0.8, love:1.0, daily:0.8 }, time: ["不适用"] } },
    "30": { name: "百合",    tags: { reality: ["成熟","宁静","性","智慧","沉淀"],     emotion: "平和、满足",   dynamic: ["沉淀","冻结(时间)","净化"],             domain: { work:0.9, love:0.9, daily:0.7 }, time: ["冬季","漫长岁月","成熟期"] } },
    "31": { name: "太阳",    tags: { reality: ["成功","胜利","能量","热","清晰"],     emotion: "热烈、自信",   dynamic: ["照亮","激活","升温","显现"],           domain: { work:0.9, love:0.9, daily:0.9 }, time: ["白天","夏天","1个月","能量高峰"] } },
    "32": { name: "月亮",    tags: { reality: ["名誉","情感","潜意识","周期","魅力"], emotion: "浪漫、敏感",   dynamic: ["吸引","波动","循环","情绪化"],         domain: { work:0.7, love:1.0, daily:0.6 }, time: ["夜晚","28天周期","情绪周期"] } },
    "33": { name: "钥匙",    tags: { reality: ["解决方案","重要","打开","答案"],       emotion: "确定、解放",   dynamic: ["解锁","进入","命中注定","突破"],       domain: { work:1.0, love:0.9, daily:0.8 }, time: ["关键节点","转折时刻","即时解决"] } },
    "34": { name: "鱼",      tags: { reality: ["金钱","资源","流动","深度","生意"],   emotion: "自由、富足",   dynamic: ["流入","流出","活跃","循环"],           domain: { work:1.0, love:0.6, daily:0.8 }, time: ["流动","持续性","财务周期"] } },
    "35": { name: "锚",      tags: { reality: ["稳定","工作","安全","停泊","职业"],   emotion: "踏实、忍耐",   dynamic: ["固定","下沉","不漂移","坚持"],         domain: { work:1.0, love:0.9, daily:0.8 }, time: ["长期","稳固","持久"] } },
    "36": { name: "十字架",  tags: { reality: ["痛苦","考验","信仰","使命","负担"],   emotion: "沉重、必须",   dynamic: ["压迫","净化","升华","必须承受"],       domain: { work:0.9, love:0.9, daily:0.8 }, time: ["痛苦的阶段","以年计","考验期"] } },
  },

  rules: [
    {
      id: "R1", description: "信息类牌 + 变化类牌 → 变化被通知",
      condition: { card1_tags: { reality: ["消息","信息","文件"] }, card2_tags: { dynamic: ["变化","位移","改善","更迭"] } },
      output_template: "关于{card2_reality}的通知/消息到来", example: "骑士 + 鹳 = 调动通知"
    },
    {
      id: "R2", description: "压力类牌 + 关系类牌 → 关系中的负担",
      condition: { card1_tags: { emotion: ["消极","困惑","沉重","侵蚀"] }, card2_tags: { reality: ["朋友","信任","家庭","关系","伴侣"] } },
      output_template: "在关系中存在{card1_emotion}的负担", example: "云 + 狗 = 友谊出现误解"
    },
    {
      id: "R3", description: "行动类牌 + 阻碍类牌 → 行动受阻",
      condition: { card1_tags: { dynamic: ["移动","扩展","触发","行动"] }, card2_tags: { dynamic: ["阻挡","无法逾越","停滞"] } },
      output_template: "{card1_action}受到{card2_obstacle}的阻碍", example: "船 + 山 = 行程延误"
    },
    {
      id: "R4", description: "切割类牌 + 连结类牌 → 解除绑定",
      condition: { card1_tags: { reality: ["切割","决断","分离"] }, card2_tags: { reality: ["承诺","合同","绑定","连结"] } },
      output_template: "{card1_action}切断了{card2_bond}", example: "镰刀 + 戒指 = 离婚/解约"
    },
    {
      id: "R5", description: "积极核心 + 终结类牌 → 好事终结",
      condition: { card1_tags: { emotion: ["积极","愉悦","热烈"] }, card2_tags: { reality: ["结束","终结","死亡"] } },
      output_template: "{card1_positive}的状态结束", example: "花束 + 棺材 = 热情消退"
    },
    {
      id: "R6", description: "静态稳固 + 消耗类牌 → 基础侵蚀",
      condition: { card1_tags: { dynamic: ["稳固","固定","停滞"] }, card2_tags: { dynamic: ["减少","损坏","内耗","流失"] } },
      output_template: "{card1_stable}正被{card2_erosion}侵蚀", example: "房子 + 老鼠 = 房屋折旧"
    },
    {
      id: "R7", description: "公开场合 + 隐藏物 → 隐匿",
      condition: { card1_tags: { reality: ["公众","社交圈","公开"] }, card2_tags: { dynamic: ["隐藏","未解锁","秘密"] } },
      output_template: "在公开场合下存在{card2_hidden}", example: "花园 + 书 = 秘密社团"
    },
    {
      id: "R8", description: "人物牌 + 描述牌 → 属性赋予",
      condition: { card1_is_person: true, card2_is_descriptor: true },
      output_template: "具有{card2_tags}特征的{card1_gender}", example: "女人 + 狐狸 = 精明的女同事"
    },
    {
      id: "R9", description: "短暂性 + 长期性 → 中间状态",
      condition: { card1_tags: { time: ["短暂","转瞬","当下"] }, card2_tags: { time: ["长期","漫长","永久"] } },
      output_template: "{card1_brief}与{card2_long}的混合状态", example: "四叶草 + 百合 = 短暂的宁静"
    },
    {
      id: "R10", description: "情感类 + 阻碍类 → 情感阻力",
      condition: { card1_tags: { reality: ["爱情","情感","心"] }, card2_tags: { dynamic: ["阻挡","压力","无法逾越"] } },
      output_template: "{card1_emotion}遇到{card2_obstacle}", example: "心 + 山 = 情感阻碍"
    },
    {
      id: "R11", description: "变化类 + 根基类 → 生活/工作变动",
      condition: { card1_tags: { dynamic: ["位移","改善","更迭","变化"] }, card2_tags: { reality: ["家庭","稳定","根基","机构"] } },
      output_template: "{card2_structure}发生{card1_change}", example: "鹳 + 房子 = 搬家/公司重组"
    },
    {
      id: "R12", description: "切割类 + 时间长期类 → 长期状态终结",
      condition: { card1_tags: { reality: ["切割","决断"] }, card2_tags: { time: ["长期","持久","考验期"] } },
      output_template: "长期存在的{card2_issue}被切断", example: "镰刀 + 十字架 = 结束长期痛苦"
    },
  ],

  scenarios: {
    love:  { name: "感情关系", domain_weight: { love:1.5, work:0.4, daily:0.8 }, bias_phrases: ["从感情关系角度解读","关注情感连接与承诺"],      example_adaptation: "骑士+山+心 → 消息受阻但心仍在，感情中有话说不出口的阻碍" },
    work:  { name: "事业工作", domain_weight: { work:1.5, love:0.3, daily:0.7 }, bias_phrases: ["从职场/事业角度解读","关注进展、机会与竞争"],   example_adaptation: "狐狸+镰刀+信 → 工作中精明决断带来的通知" },
    daily: { name: "日常综合", domain_weight: { daily:1.2, love:0.8, work:0.8 }, bias_phrases: ["从日常生活角度解读","关注琐事、健康与状态"],    example_adaptation: "老鼠+树+四叶草 → 健康损耗但有机会好转" },
  },
};

// ─────────────────────────────────────────────────────────────
// 2. 辅助：按牌名查找牌数据
// ─────────────────────────────────────────────────────────────
function getCardByName(name) {
  for (const card of Object.values(LENORMAND_DB.cards)) {
    if (card.name === name) return card;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// 3. 提取标签（与 app.py get_card_tags 完全一致）
// ─────────────────────────────────────────────────────────────
function getCardTags(cardName) {
  const card = getCardByName(cardName);
  if (!card) return { reality: "", emotion: "", dynamic: "", time: "", domain: {} };
  const tags = card.tags || {};
  const fmt = (v) => Array.isArray(v) ? v.join("、") : (v || "");
  return {
    reality: fmt(tags.reality),
    emotion: fmt(tags.emotion),
    dynamic: fmt(tags.dynamic),
    time:    fmt(tags.time),
    domain:  tags.domain || {},
  };
}

// ─────────────────────────────────────────────────────────────
// 4. 规则匹配（精确复现 app.py match_rule 逻辑）
//    原始 JSON condition 格式：{ card1_tags: { reality:[...] }, card2_tags: { dynamic:[...] } }
//    每个字段取对应维度的值做包含匹配
// ─────────────────────────────────────────────────────────────
function matchRule(card1Tags, card2Tags) {
  for (const rule of LENORMAND_DB.rules) {
    const cond = rule.condition || {};

    // R8 是人物牌规则，无法通过标签匹配，跳过（需要额外字段支持）
    if (cond.card1_is_person || cond.card2_is_descriptor) continue;

    const c1Cond = cond.card1_tags || {};
    const c2Cond = cond.card2_tags || {};

    // 对每个条件维度，检查牌的对应维度文本是否包含任意一个关键词
    function tagsMatch(cardTags, condObj) {
      for (const [dim, keywords] of Object.entries(condObj)) {
        // dim 是 "reality" / "dynamic" / "emotion" / "time"
        const cardText = cardTags[dim] || "";
        const hit = keywords.some(kw => cardText.includes(kw));
        if (!hit) return false;
      }
      return true;
    }

    // 两张牌的条件必须同时满足
    if (
      Object.keys(c1Cond).length > 0 &&
      Object.keys(c2Cond).length > 0 &&
      tagsMatch(card1Tags, c1Cond) &&
      tagsMatch(card2Tags, c2Cond)
    ) {
      return rule.output_template || rule.description || "";
    }
  }
  return "";
}

// ─────────────────────────────────────────────────────────────
// 5. 场景识别（与 app.py 一致）
// ─────────────────────────────────────────────────────────────
function detectScenario(question) {
  const q = question.toLowerCase();
  if (/感情|爱|恋爱|喜欢|分手|对象|伴侣|老公|老婆|婚姻/.test(q)) return "love";
  if (/工作|事业|职场|老板|同事|跳槽|面试|项目/.test(q)) return "work";
  return "daily";
}

// ─────────────────────────────────────────────────────────────
// 6. 构建动态 Prompt（精确复现 app.py build_dynamic_prompt）
// ─────────────────────────────────────────────────────────────
function buildPrompt(question, cards) {
  const scenario = detectScenario(question);
  const scenarioData = LENORMAND_DB.scenarios[scenario] || LENORMAND_DB.scenarios.daily;

  // 场景偏向：使用 bias_phrases 拼接（原版只有单字符串 bias，这里更完整）
  const scenarioBias = scenarioData.bias_phrases
    ? scenarioData.bias_phrases.join("，")
    : scenarioData.name || "通用视角";

  // 卡牌标签
  const cardObjs = cards.map((c, i) => ({
    position: i + 1,
    name: c.name,
    tags: getCardTags(c.name),
  }));

  const cardLines = cardObjs.map(obj => {
    const t = obj.tags;
    return `第${obj.position}张【${obj.name}】→ 现实指向：${t.reality || "（缺失）"}；动态：${t.dynamic || "（缺失）"}；情绪：${t.emotion || "（缺失）"}`;
  });

  // 相邻牌组合规则提示
  const ruleHints = [];
  if (cardObjs.length >= 2) {
    const r1 = matchRule(cardObjs[0].tags, cardObjs[1].tags);
    if (r1) ruleHints.push(`牌1+牌2组合提示：${r1}`);
  }
  if (cardObjs.length >= 3) {
    const r2 = matchRule(cardObjs[1].tags, cardObjs[2].tags);
    if (r2) ruleHints.push(`牌2+牌3组合提示：${r2}`);
  }

  return `来访者的心问：「${question}」

当前场景倾向：${scenarioBias}

抽到的三张牌及其核心标签：
${cardLines.join("\n")}

${ruleHints.length
    ? "组合规则提示：\n" + ruleHints.join("\n")
    : "（无预设组合规则触发，请根据标签动态推理）"}

请按以下要求解读：
- 你是雷诺曼占卜师，用三张牌作为一个完整句子解读（主语→谓语→宾语）。
- 根据场景自动调整侧重（如感情场景侧重关系互动，工作场景侧重发展得失）。
- 组合意义优先于单牌意义，相邻牌必须结合理解。
- 输出风格真诚清晰，避免空洞修辞。
- 不需要复述牌面标签，直接给出解读内容。`;
}

// ─────────────────────────────────────────────────────────────
// 7. 系统提示词（与 app.py SYSTEM_PROMPT 完全一致）
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `你是一位精通雷诺曼卡牌的解读师。你的风格：真诚、清晰、富有同理心。用简洁而优美的中文表达，避免过度诗化。

【核心解读法则】
1. 三张牌必须当作一个完整句子：第1张（主语/起因）→ 第2张（谓语/过程/修饰）→ 第3张（宾语/结果/总结）。
2. 组合意义优先于单牌意义，相邻牌必须一起解释。
3. 根据用户问题中的「当前场景倾向」自动调整解读侧重点。
4. 没有逆位，正面或负面由牌的组合和语境决定。

【输出要求】
- 长度控制在 200-400 字（视问题复杂度）。
- 可以适当使用轻量 Markdown（粗体、> 引用）。
- 不预测死亡、重病等极端事件。
- 不暴露自己是 AI，你就是解读师本人。`;

// ─────────────────────────────────────────────────────────────
// 8. CORS 头
// ─────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ─────────────────────────────────────────────────────────────
// 9. Edge Function 入口
// ─────────────────────────────────────────────────────────────

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "请求体必须是合法的 JSON" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const question = (body.question || "").trim();
  const cards    = body.cards || [];

  if (!question) {
    return new Response(
      JSON.stringify({ error: "问题不能为空" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
  if (!Array.isArray(cards) || cards.length !== 3) {
    return new Response(
      JSON.stringify({ error: "需要恰好三张牌" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "未配置 DASHSCOPE_API_KEY 环境变量" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const userMsg = buildPrompt(question, cards);

  // 调用 DashScope（兼容 OpenAI 格式），流式输出
  let upstreamResp;
  try {
    upstreamResp = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "qwen-plus",
          stream: true,
          max_tokens: 600,
          temperature: 0.88,
          top_p: 0.92,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user",   content: userMsg },
          ],
        }),
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `上游请求失败: ${err.message}` }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  if (!upstreamResp.ok) {
    const errText = await upstreamResp.text().catch(() => "");
    return new Response(
      JSON.stringify({ error: `DashScope 返回错误 ${upstreamResp.status}: ${errText}` }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // ── SSE 格式转换：DashScope → 前端期望格式 ──
  // DashScope: data: {"choices":[{"delta":{"content":"..."}}]}
  // 前端期望:  data: {"text":"..."}
  const { readable, writable } = new TransformStream();
  const writer  = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8");

  (async () => {
    const reader = upstreamResp.body.getReader();
    let sseBuffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const parts = sseBuffer.split("\n\n");
        sseBuffer = parts.pop();
        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") {
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              return;
            }
            let obj;
            try { obj = JSON.parse(raw); } catch { continue; }
            const content = obj?.choices?.[0]?.delta?.content;
            if (content) {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`)
              );
            }
          }
        }
      }
    } catch (err) {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
      );
    } finally {
      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close();
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}

// 拦截非 POST/OPTIONS 请求
export async function onRequest(context) {
  if (context.request.method === "POST")   return onRequestPost(context);
  if (context.request.method === "OPTIONS") return onRequestOptions();
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" },
  });
}
