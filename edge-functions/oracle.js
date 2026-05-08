/**
 * 灵境·雷诺曼 Edge Function
 * 路径: /edge-functions/oracle.js → 对应 URL: /oracle
 *
 * 将原 app.py (Flask) 逻辑完整移植为 EdgeOne Edge Function (JS)
 * 运行环境: V8 / Web Service Worker API (ES2023+)
 */

// ─────────────────────────────────────────────
// 1. 内置知识库（原 data/lenormand.json 的核心内容）
//    Edge Function 不能读取本地文件，故将知识库内联
// ─────────────────────────────────────────────
const LENORMAND_DB = {
  cards: {
    "1":  { name: "骑士",   tags: { reality: ["信使","行动","快速消息"], emotion: "期待", dynamic: ["来临","传递","移动"], time: ["很快","短期"] } },
    "2":  { name: "四叶草", tags: { reality: ["小幸运","偶遇","机会"], emotion: "轻松", dynamic: ["出现","遭遇"], time: ["短暂","眼前"] } },
    "3":  { name: "船",     tags: { reality: ["旅行","远方","商业","贸易"], emotion: "渴望", dynamic: ["出发","移动","离开"], time: ["长途","未来"] } },
    "4":  { name: "房子",   tags: { reality: ["家","家庭","安全","财产"], emotion: "安心", dynamic: ["守护","稳定","归巢"], time: ["持久","现在"] } },
    "5":  { name: "树",     tags: { reality: ["健康","成长","根基","生命"], emotion: "平静", dynamic: ["生长","积累","扎根"], time: ["长期","缓慢"] } },
    "6":  { name: "云",     tags: { reality: ["疑惑","不清晰","干扰","障碍"], emotion: "困惑", dynamic: ["遮蔽","变化","飘移"], time: ["不确定"] } },
    "7":  { name: "蛇",     tags: { reality: ["复杂","欲望","智慧","弯路","女性能量"], emotion: "警惕", dynamic: ["纠缠","迂回","诱惑"], time: ["迂回漫长"] } },
    "8":  { name: "棺材",   tags: { reality: ["终结","疾病","转化","深度变化"], emotion: "沉重", dynamic: ["结束","消逝","转化"], time: ["终点","转折"] } },
    "9":  { name: "花束",   tags: { reality: ["礼物","惊喜","美好","表达"], emotion: "喜悦", dynamic: ["给予","展现","庆祝"], time: ["很快","愉快时刻"] } },
    "10": { name: "镰刀",   tags: { reality: ["决断","收割","突发","切断"], emotion: "果断", dynamic: ["切除","收获","快速决定"], time: ["突然","当下"] } },
    "11": { name: "鞭子",   tags: { reality: ["争论","冲突","重复","性"], emotion: "紧张", dynamic: ["摩擦","重复","争执"], time: ["反复","持续"] } },
    "12": { name: "鸟",     tags: { reality: ["对话","消息","焦虑","神经质"], emotion: "焦虑", dynamic: ["交谈","传播","叽喳"], time: ["当下","快速"] } },
    "13": { name: "小孩",   tags: { reality: ["新生","初始","天真","孩子"], emotion: "纯真", dynamic: ["开始","新鲜","天真行动"], time: ["初期","新起点"] } },
    "14": { name: "狐狸",   tags: { reality: ["机智","欺骗","自保","工作"], emotion: "谨慎", dynamic: ["计谋","回避","自我保护"], time: ["当下"] } },
    "15": { name: "熊",     tags: { reality: ["权威","力量","保护","母亲","财务"], emotion: "稳重", dynamic: ["主导","保护","施压"], time: ["长期","稳定"] } },
    "16": { name: "星星",   tags: { reality: ["希望","指引","愿望","精神"], emotion: "希望", dynamic: ["向往","指引","闪耀"], time: ["未来","夜晚"] } },
    "17": { name: "鹳",     tags: { reality: ["改变","搬迁","好消息","分娩"], emotion: "期待", dynamic: ["迁移","转变","带来"], time: ["转折点"] } },
    "18": { name: "狗",     tags: { reality: ["忠诚","朋友","信赖","支持"], emotion: "温暖", dynamic: ["陪伴","支持","跟随"], time: ["持续","稳定"] } },
    "19": { name: "塔",     tags: { reality: ["孤独","权力","边界","机构","自我"], emotion: "孤立", dynamic: ["隔离","界定","构建"], time: ["长期","独立"] } },
    "20": { name: "花园",   tags: { reality: ["社交","公共场所","人群","表演"], emotion: "社交", dynamic: ["聚集","展示","公开"], time: ["当下","活跃期"] } },
    "21": { name: "山",     tags: { reality: ["障碍","挑战","敌人","延迟"], emotion: "压力", dynamic: ["阻挡","延迟","挑战"], time: ["漫长","困难期"] } },
    "22": { name: "十字路口", tags: { reality: ["选择","岔路","自由","方向"], emotion: "迷茫", dynamic: ["分叉","选择","决定方向"], time: ["关键时刻"] } },
    "23": { name: "老鼠",   tags: { reality: ["损耗","焦虑","偷窃","减少"], emotion: "焦虑", dynamic: ["消耗","侵蚀","偷走"], time: ["缓慢持续"] } },
    "24": { name: "心",     tags: { reality: ["爱","情感","感情","心愿"], emotion: "爱意", dynamic: ["感受","给予爱","渴望"], time: ["情感时刻"] } },
    "25": { name: "戒指",   tags: { reality: ["承诺","合同","循环","关系"], emotion: "庄重", dynamic: ["绑定","承诺","连接"], time: ["持续","长期"] } },
    "26": { name: "书",     tags: { reality: ["秘密","知识","学习","未知"], emotion: "好奇", dynamic: ["隐藏","学习","探索"], time: ["隐秘","学习期"] } },
    "27": { name: "信",     tags: { reality: ["消息","文件","通知","沟通"], emotion: "期待", dynamic: ["传递","告知","写作"], time: ["很快","当下"] } },
    "28": { name: "男人",   tags: { reality: ["男性","主体人物","伴侣（对女性）"], emotion: "中性", dynamic: ["行动","代表"], time: ["现在"] } },
    "29": { name: "女人",   tags: { reality: ["女性","主体人物","伴侣（对男性）"], emotion: "中性", dynamic: ["感受","代表"], time: ["现在"] } },
    "30": { name: "百合",   tags: { reality: ["纯洁","老年","平静","满足","性成熟"], emotion: "平静", dynamic: ["沉淀","享受","成熟"], time: ["晚年","安静期"] } },
    "31": { name: "太阳",   tags: { reality: ["成功","能量","健康","幸福","夏天"], emotion: "喜悦", dynamic: ["照耀","成功","繁荣"], time: ["白天","夏季","短期成功"] } },
    "32": { name: "月亮",   tags: { reality: ["直觉","名誉","情绪","梦境","潜意识"], emotion: "敏感", dynamic: ["感知","波动","浮现"], time: ["夜晚","月度"] } },
    "33": { name: "钥匙",   tags: { reality: ["解答","机遇","开启","成就"], emotion: "确定", dynamic: ["打开","解决","实现"], time: ["当下","关键时刻"] } },
    "34": { name: "鱼",     tags: { reality: ["金钱","财富","流动","独立"], emotion: "自由", dynamic: ["流动","积累","增长"], time: ["流动期"] } },
    "35": { name: "锚",     tags: { reality: ["稳定","工作","目标","执着"], emotion: "踏实", dynamic: ["固定","坚持","沉淀"], time: ["长期","稳定期"] } },
    "36": { name: "十字架", tags: { reality: ["命运","负担","信念","苦难"], emotion: "沉重", dynamic: ["承担","接受","苦行"], time: ["漫长","宿命性"] } },
  },

  scenarios: {
    love: { bias: "感情场景：侧重关系互动、情感流向、两人之间的动态" },
    work: { bias: "工作场景：侧重事业发展、职场关系、实际行动与结果" },
    daily: { bias: "通用场景：侧重整体能量走向与日常生活建议" },
  },

  rules: [
    {
      condition: { card1_tags: ["reality:消息", "dynamic:传递"], card2_tags: ["reality:爱", "emotion:爱意"] },
      output: "有与感情相关的消息即将到来"
    },
    {
      condition: { card1_tags: ["reality:障碍", "dynamic:阻挡"], card2_tags: ["reality:选择", "dynamic:选择"] },
      output: "前路受阻，需要重新选择方向"
    },
    {
      condition: { card1_tags: ["reality:终结", "dynamic:结束"], card2_tags: ["reality:新生", "dynamic:开始"] },
      output: "旧事结束后，全新的开始正在萌发"
    },
    {
      condition: { card1_tags: ["reality:爱", "emotion:爱意"], card2_tags: ["reality:障碍", "dynamic:阻挡"] },
      output: "感情遭遇阻碍或误解"
    },
    {
      condition: { card1_tags: ["reality:成功", "dynamic:成功"], card2_tags: ["reality:金钱", "dynamic:流动"] },
      output: "事业成功带来财富流动"
    },
  ]
};

// ─────────────────────────────────────────────
// 2. 辅助函数：构建卡牌标签
// ─────────────────────────────────────────────
function getCardByName(name) {
  for (const card of Object.values(LENORMAND_DB.cards)) {
    if (card.name === name) return card;
  }
  return null;
}

function getCardTags(cardName) {
  const card = getCardByName(cardName);
  if (!card) return { reality: "", emotion: "", dynamic: "", time: "" };
  const tags = card.tags || {};
  const fmt = (v) => Array.isArray(v) ? v.join("、") : (v || "");
  return {
    reality: fmt(tags.reality),
    emotion: fmt(tags.emotion),
    dynamic: fmt(tags.dynamic),
    time:    fmt(tags.time),
  };
}

// ─────────────────────────────────────────────
// 3. 规则匹配
// ─────────────────────────────────────────────
function matchRule(card1Tags, card2Tags) {
  for (const rule of LENORMAND_DB.rules) {
    const { card1_tags = [], card2_tags = [] } = rule.condition || {};
    if (!card1_tags.length || !card2_tags.length) continue;

    const c1Text = [card1Tags.reality, card1Tags.dynamic, card1Tags.emotion].join(" ");
    const c2Text = [card2Tags.reality, card2Tags.dynamic, card2Tags.emotion].join(" ");

    const contains = (text, kwList) =>
      kwList.some(kw => text.includes(kw.includes(":") ? kw.split(":")[1] : kw));

    if (contains(c1Text, card1_tags) && contains(c2Text, card2_tags)) {
      return rule.output || "";
    }
  }
  return "";
}

// ─────────────────────────────────────────────
// 4. 识别场景
// ─────────────────────────────────────────────
function detectScenario(question) {
  const q = question.toLowerCase();
  if (/感情|爱|恋爱|喜欢|分手|对象|伴侣|老公|老婆|婚姻/.test(q)) return "love";
  if (/工作|事业|职场|老板|同事|跳槽|面试|项目/.test(q)) return "work";
  return "daily";
}

// ─────────────────────────────────────────────
// 5. 构建动态 Prompt
// ─────────────────────────────────────────────
function buildPrompt(question, cards) {
  const scenario = detectScenario(question);
  const scenarioBias = LENORMAND_DB.scenarios[scenario]?.bias || "通用视角";

  const cardObjs = cards.map((c, i) => ({
    position: i + 1,
    name: c.name,
    tags: getCardTags(c.name),
  }));

  const cardLines = cardObjs.map(obj => {
    const t = obj.tags;
    return `第${obj.position}张【${obj.name}】→ 现实指向：${t.reality || "（缺失）"}；动态：${t.dynamic || "（缺失）"}；情绪：${t.emotion || "（缺失）"}`;
  });

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

${ruleHints.length ? "组合规则提示：\n" + ruleHints.join("\n") : "（无预设组合规则触发，请根据标签动态推理）"}

请按以下要求解读：
- 你是雷诺曼占卜师，用三张牌作为一个完整句子解读（主语→谓语→宾语）。
- 根据场景自动调整侧重（如感情场景侧重关系互动，工作场景侧重发展得失）。
- 组合意义优先于单牌意义，相邻牌必须结合理解。
- 输出风格真诚清晰，避免空洞修辞。
- 不需要复述牌面标签，直接给出解读内容。`;
}

// ─────────────────────────────────────────────
// 6. 系统提示词
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `你是一位精通雷诺曼卡牌的解读师。你的风格：真诚、清晰、富有同理心。用简洁而优美的中文表达，避免过度诗化。

【核心解读法则】
1. 三张牌必须当作一个完整句子：第1张（主语/起因）→ 第2张（谓语/过程/修饰）→ 第3张（宾语/结果/总结）。
2. 组合意义优先于单牌意义，相邻牌必须一起解释。
3. 根据用户问题中的「当前场景倾向」自动调整解读侧重点。
4. 没有逆位，正面或负面由牌的组合和语境决定。

【输出要求】
- 长度控制在 200-500 字（视问题复杂度）。
- 可以适当使用轻量 Markdown（**粗体**、> 引用）。
- 不预测死亡、重病等极端事件。
- 不暴露自己是 AI，你就是解读师本人。`;

// ─────────────────────────────────────────────
// 7. CORS 头
// ─────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ─────────────────────────────────────────────
// 8. Edge Function 入口
// ─────────────────────────────────────────────

// OPTIONS 预检
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// POST /oracle
export async function onRequestPost(context) {
  const { request, env } = context;

  // 解析请求体
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

  // 从环境变量获取 API Key
  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "未配置 DASHSCOPE_API_KEY 环境变量" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // 构建 Prompt
  const userMsg = buildPrompt(question, cards);

  // 调用阿里云 DashScope（兼容 OpenAI 格式），开启流式
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
          max_tokens: 800,
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

  // ── 将 DashScope 的 SSE 流转换为前端期望的格式，并透传 ──
  //
  // DashScope 返回格式（OpenAI 兼容）:
  //   data: {"choices":[{"delta":{"content":"文字片段"}}]}
  //   data: [DONE]
  //
  // 前端期望格式 (index.html fetchOracleStream):
  //   data: {"text":"文字片段"}
  //   data: [DONE]
  //
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8");

  // 异步处理上游流
  (async () => {
    const reader = upstreamResp.body.getReader();
    let sseBuffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const parts = sseBuffer.split("\n\n");
        sseBuffer = parts.pop(); // 保留不完整的最后一段

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
              const payload = JSON.stringify({ text: content });
              await writer.write(encoder.encode(`data: ${payload}\n\n`));
            }
          }
        }
      }
    } catch (err) {
      const errPayload = JSON.stringify({ error: String(err) });
      await writer.write(encoder.encode(`data: ${errPayload}\n\n`));
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

// 拦截所有其他方法（GET 等）返回 405
export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  if (context.request.method === "OPTIONS") return onRequestOptions();
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" },
  });
}