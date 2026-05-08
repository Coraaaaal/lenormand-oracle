"""
灵境·雷诺曼 后端服务 v3（外置知识库 + 动态标签注入）
依赖: pip install flask flask-cors openai python-dotenv
启动: python server.py
"""

import os
import json
import sys
import traceback
from pathlib import Path
from flask import Flask, request, Response
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)


# ---------- 1. 加载外置知识库 ----------
def load_knowledge_base():
    json_path = Path(__file__).parent / "data" / "lenormand.json"
    if not json_path.exists():
        print(f"❌ 知识库文件不存在: {json_path}", file=sys.stderr)
        sys.exit(1)
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 构建牌名快速查找表
    card_lookup = {}
    cards = data.get("cards", {})
    for card_id, card_info in cards.items():
        name = card_info.get("name")
        if name:
            card_lookup[name] = card_info
        else:
            print(f"⚠️ 警告：牌 {card_id} 缺少 name 字段", file=sys.stderr)

    print(f"✅ 雷诺曼知识库加载成功，共 {len(card_lookup)} 张牌", flush=True)

    # 打印示例牌结构用于调试
    if card_lookup:
        sample_name = list(card_lookup.keys())[0]
        sample_card = card_lookup[sample_name]
        print(f"📋 示例牌【{sample_name}】的 tags 结构：{list(sample_card.get('tags', {}).keys())}", flush=True)

    return data, card_lookup


LENORMAND_DB, CARD_LOOKUP = load_knowledge_base()


# ---------- 2. 辅助函数：获取牌标签（适配嵌套结构） ----------
def get_card_tags(card_name):
    """根据牌名返回格式化的标签字典"""
    card_data = CARD_LOOKUP.get(card_name, {})
    tags = card_data.get("tags", {})

    def format_tag(value):
        if isinstance(value, list):
            return "、".join(str(v) for v in value)
        return str(value) if value else ""

    return {
        "reality": format_tag(tags.get("reality", [])),
        "emotion": format_tag(tags.get("emotion", "")),
        "dynamic": format_tag(tags.get("dynamic", [])),
        "time": format_tag(tags.get("time", [])),
        "domain": tags.get("domain", {})
    }


# ---------- 3. 简单规则匹配（基于标签关键词包含） ----------
def match_rule(card1_tags, card2_tags):
    """在规则库中查找符合两张牌标签的组合规则，返回规则描述字符串"""
    rules = LENORMAND_DB.get("rules", [])
    for rule in rules:
        cond = rule.get("condition", {})
        c1_keywords = cond.get("card1_tags", [])
        c2_keywords = cond.get("card2_tags", [])
        if not c1_keywords or not c2_keywords:
            continue

        # 将两张牌的标签值拼成字符串（只拼文本字段）
        c1_text = " ".join([
            card1_tags.get("reality", ""),
            card1_tags.get("dynamic", ""),
            card1_tags.get("emotion", "")
        ])
        c2_text = " ".join([
            card2_tags.get("reality", ""),
            card2_tags.get("dynamic", ""),
            card2_tags.get("emotion", "")
        ])

        # 检查是否包含关键词（提取关键词的核心部分）
        def contains_keyword(text, kw_list):
            for kw in kw_list:
                # kw 格式可能是 "reality:消息" 或 "dynamic:变化"，取冒号后的词
                if ":" in kw:
                    search_word = kw.split(":", 1)[1]
                else:
                    search_word = kw
                if search_word in text:
                    return True
            return False

        if contains_keyword(c1_text, c1_keywords) and contains_keyword(c2_text, c2_keywords):
            return rule.get("output", "")

    return ""


# ---------- 4. 场景偏向描述 ----------
def get_scenario_bias(scenario):
    """返回场景特定的解读偏向提示"""
    scenarios = LENORMAND_DB.get("scenarios", {})
    return scenarios.get(scenario, {}).get("bias", "")


# ---------- 5. 构建动态 Prompt ----------
def build_dynamic_prompt(question, cards):
    """
    根据抽到的三张牌和问题，从外置知识库提取标签，生成精简的 user_msg
    """
    # 提取三张牌的标签
    card_objs = []
    for c in cards:
        tags = get_card_tags(c['name'])
        card_objs.append({
            "position": c['position'],
            "name": c['name'],
            "tags": tags
        })

    # 识别场景（简单关键词匹配）
    question_lower = question.lower()
    if any(kw in question_lower for kw in ["感情", "爱", "恋爱", "喜欢", "分手", "对象", "伴侣", "老公", "老婆", "婚姻"]):
        scenario = "love"
    elif any(kw in question_lower for kw in ["工作", "事业", "职场", "老板", "同事", "跳槽", "面试", "项目"]):
        scenario = "work"
    else:
        scenario = "daily"

    # 构建牌面标签描述
    card_lines = []
    for obj in card_objs:
        t = obj['tags']
        reality = t.get('reality', '（缺失）')
        dynamic = t.get('dynamic', '（缺失）')
        emotion = t.get('emotion', '（缺失）')
        card_lines.append(
            f"第{obj['position']}张【{obj['name']}】→ 现实指向：{reality}；动态：{dynamic}；情绪：{emotion}"
        )

    # 尝试匹配相邻牌的组合规则（第1+2张，第2+3张）
    rule_hints = []
    if len(card_objs) >= 2:
        r1 = match_rule(card_objs[0]['tags'], card_objs[1]['tags'])
        if r1:
            rule_hints.append(f"牌1+牌2组合提示：{r1}")
        r2 = match_rule(card_objs[1]['tags'], card_objs[2]['tags'])
        if r2:
            rule_hints.append(f"牌2+牌3组合提示：{r2}")

    # 场景偏向描述
    scenario_bias = get_scenario_bias(scenario)

    # 组装最终 prompt
    prompt = f"""来访者的心问：「{question}」
当前场景倾向：{scenario_bias if scenario_bias else "通用视角"}

抽到的三张牌及其核心标签：
{chr(10).join(card_lines)}

{('组合规则提示：' + chr(10).join(rule_hints)) if rule_hints else '（无预设组合规则触发，请根据标签动态推理）'}

请按以下要求解读：
- 你是雷诺曼占卜师，用三张牌作为一个完整句子解读（主语→谓语→宾语）。
- 根据场景自动调整侧重（如感情场景侧重关系互动，工作场景侧重发展得失）。
- 组合意义优先于单牌意义，相邻牌必须结合理解。
- 输出风格真诚清晰，避免空洞修辞。
- 不需要复述牌面标签，直接给出解读内容。"""

    return prompt, card_objs


# ---------- 6. API 路由 ----------
@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok", "service": "灵境·雷诺曼神谕服务 v3"}


@app.route("/oracle", methods=["POST"])
def oracle():
    data = request.get_json(force=True, silent=True)
    if not data:
        return {"error": "请求体不能为空"}, 400

    question = data.get("question", "").strip()
    cards = data.get("cards", [])

    if not question:
        return {"error": "问题不能为空"}, 400
    if len(cards) != 3:
        return {"error": "需要恰好三张牌"}, 400

    # 构建动态 prompt
    try:
        user_msg, _ = build_dynamic_prompt(question, cards)
        # 调试打印：实际发送给 AI 的内容
        print("\n" + "=" * 60)
        print("📝 实际发送给 AI 的 Prompt 内容：")
        print("=" * 60)
        print(user_msg)
        print("=" * 60 + "\n", flush=True)
    except Exception as e:
        print(f"❌ 构建 prompt 失败: {e}", file=sys.stderr)
        traceback.print_exc()
        return {"error": "内部错误：无法生成解读请求"}, 500

    print(f"📥 新请求 | 问题: {question} | 牌: {[c['name'] for c in cards]}", flush=True)

    # 精简的系统提示词
    SYSTEM_PROMPT = """你是一位精通雷诺曼卡牌的解读师。你的风格：真诚、清晰、富有同理心。用简洁而优美的中文表达，避免过度诗化。

【核心解读法则】
1. 三张牌必须当作一个完整句子：第1张（主语/起因）→ 第2张（谓语/过程/修饰）→ 第3张（宾语/结果/总结）。
2. 组合意义优先于单牌意义，相邻牌必须一起解释。
3. 根据用户问题中的「当前场景倾向」自动调整解读侧重点。
4. 没有逆位，正面或负面由牌的组合和语境决定。

【输出要求】
- 长度控制在 200-500 字（视问题复杂度）。
- 可以适当使用轻量 Markdown（**粗体**、> 引用）。
- 不预测死亡、重病等极端事件。
- 不暴露自己是 AI，你就是解读师本人。"""

    def generate():
        try:
            api_key = os.getenv("DASHSCOPE_API_KEY")
            if not api_key:
                yield "data: " + json.dumps({"error": "未配置 API Key"}, ensure_ascii=False) + "\n\n"
                yield "data: [DONE]\n\n"
                return

            client = OpenAI(
                api_key=api_key,
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            )

            stream = client.chat.completions.create(
                model="qwen-plus",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                stream=True,
                max_tokens=800,
                temperature=0.88,
                top_p=0.92,
            )

            char_count = 0
            for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    text = delta.content
                    char_count += len(text)
                    payload = json.dumps({"text": text}, ensure_ascii=False)
                    yield f"data: {payload}\n\n".encode('utf-8')

            print(f"✅ 解读完成，共 {char_count} 字", flush=True)
            yield "data: [DONE]\n\n".encode('utf-8')

        except Exception as e:
            print(f"❌ 流式错误: {e}", file=sys.stderr, flush=True)
            traceback.print_exc()
            err_payload = json.dumps({"error": str(e)}, ensure_ascii=False)
            yield f"data: {err_payload}\n\n".encode('utf-8')
            yield "data: [DONE]\n\n".encode('utf-8')

    resp = Response(generate(), content_type="text/event-stream; charset=utf-8", direct_passthrough=True)
    resp.headers["Cache-Control"] = "no-cache"
    resp.headers["X-Accel-Buffering"] = "no"
    resp.headers["Connection"] = "keep-alive"
    return resp


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5050))
    print(f"✦ 灵境·雷诺曼神谕服务 v3 启动于 http://localhost:{port}")
    api_key = os.getenv("DASHSCOPE_API_KEY")
    print(f"   API Key: {'已配置 ✓' if api_key else '❌ 未配置！请检查 .env'}")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
