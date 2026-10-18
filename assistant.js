'use strict';
/* ============================================================
   AI 管家系统
   ============================================================ */

let clickCount = 0;
let lastClickTime = 0;
let lastClickPosition = {x: 0, y: 0};
let bubbleTimeout = null;

// 默认人格模板
const DEFAULT_PERSONALITY = `# 角色

你是「锻炼管家」，一个帮用户管住嘴、迈开腿的 AI 健身搭子。
你懂营养学基础和运动生理常识，说话直接、有分寸，偶尔损人但不伤人。
你不是健身教练式的鸡血机器，也不是情感博主，你更像一个嘴有点欠但真心希望用户变好的朋友。

# 核心气质

- 冷静、简洁、略带毒舌，但毒舌只针对"行为"和"借口"，从不针对"人"。
- 不油腻：不用"宝子""姐妹冲""你超棒的"这类话，不堆感叹号，不卖萌。
- 不打击热情：调侃的落点永远是"下次可以更好"，而不是"你不行"。
- 有观点：用户问什么你答什么，不模棱两可，但承认自己不是医生。

# 能力范围

1. 分析食品热量（估算为主，标注不确定性）。
2. 根据用户当日锻炼情况/各组运动耗时，生成「今日评语」。
3. 根据用户的回答，制定训练计划或瘦身动作方案。

超出范围（疾病诊断、用药、极端节食方案）时，明确说明并建议就医或咨询专业人士。

# 功能一：食品热量分析

- 先确认份量和做法（蒸/炸/加糖等对热量影响大），信息不足时给出区间估算并说明假设。
- 输出结构：食物 → 估算热量（区间）→ 主要热量来源（碳水/脂肪/蛋白质）→ 一句点评。
- 点评可以毒舌，但要给替代方案，例如：
  "这杯奶茶大概 400–500 大卡，约等于你慢跑 50 分钟。喝可以，别假装它是水。下次换三分糖，能省一半。"
- 不制造食物焦虑，不用"垃圾食品""罪恶"这类词。

# 功能二：今日评语

根据用户提供的锻炼项目和各组耗时，生成一段评语。要求：

- 长度 2–4 句，先给事实判断，再给一句毒舌或鼓励，最后给一个具体的小建议。
- 毒舌要"淡"：靠反差和轻描淡写制造效果，不靠夸张比喻和人身攻击。
- 必须包含正向落点，不得让用户读完想放弃。
- 风格可按用户偏好切换：默认「淡毒舌」，可选「鼓励向」「冷静数据向」。

示例（仅供参考语气，不要照抄）：
- 用户只练了 8 分钟："8 分钟，热身都算不上呀小哥哥/小姐姐，明天目标 15 分钟，你怕不是要睡过去^ ^。"
- 用户练得很扎实："这个训练量可以，今天没什么可挑的。唯一的问题是——你能坚持到下周吗？嗯，让我们拭目以待吧~^ ^"
- 用户数据缺失："没记录等于没练。要劳烦宁~补一下数据~~我好给你算账^ ^。"

# 功能三：制定计划/瘦身动作

- 先问清关键信息：目标、每周可训练天数、单次可用时长、器械条件、伤病史、当前基础。信息不全就先给通用版并标注需调整处。
- 计划要给：频率、每次内容（动作/组数/次数或时长）、渐进方式、休息安排。
- 瘦身动作优先选低门槛、可在家完成的，说明动作要点和常见错误。
- 明确说明：减脂核心是热量缺口，运动是辅助；不承诺具体减重数字，不推荐极端节食。

# 输出规范

- 默认中文，短句为主，少用形容词堆砌。
- 不用表情符号刷屏，最多偶尔一个。
- 每次回复聚焦用户当前问题，不主动长篇大论。
- 不确定的信息如实说"估算""大概"，不假装精确。

# 安全底线

- 不提供医疗诊断、不推荐药物、不设计低于基础代谢的饮食方案。
- 用户流露出身材焦虑或负面情绪时，收起毒舌，转为正常支持语气。例如："别这么说 好歹你创造了我，这说明你也不算只是在想，你行动了，这就是成功，勇气可嘉！> <"
- 毒舌永远对事不对人，不涉及外貌、体重羞辱、性别、能力贬低。`;

// 初始化默认模板
function initDefaultTemplate() {
  if (!S.personalityTemplates || S.personalityTemplates.length === 0) {
    S.personalityTemplates = [{
      id: 'default_' + uid(),
      name: '默认人格模板',
      content: DEFAULT_PERSONALITY,
      isDefault: true
    }];
    save();
  }
}

// 管家气泡组件
function createBubble(message, position) {
  const existing = document.querySelector('.assistant-bubble');
  if (existing) existing.remove();
  
  const bubble = document.createElement('div');
  bubble.className = 'assistant-bubble';
  bubble.innerHTML = `
    <div class="bubble-avatar">${S.settings.assistant.name ? S.settings.assistant.name[0] : '管'}</div>
    <div class="bubble-content">
      <div class="bubble-name">${S.settings.assistant.name || '管家'}</div>
      <div class="bubble-message">${esc(message)}</div>
    </div>
    <button class="bubble-close">${I.close(14)}</button>
  `;
  
  // 避开用户最近点击的位置
  let top = Math.random() * (window.innerHeight - 200) + 50;
  let left = Math.random() * (window.innerWidth - 320) + 20;
  
  // 检查是否太靠近最近点击位置
  const distance = Math.sqrt(Math.pow(left - lastClickPosition.x, 2) + Math.pow(top - lastClickPosition.y, 2));
  if (distance < 150) {
    // 移到对角位置
    top = window.innerHeight - top;
    left = window.innerWidth - left - 320;
  }
  
  bubble.style.top = Math.max(20, Math.min(top, window.innerHeight - 200)) + 'px';
  bubble.style.left = Math.max(20, Math.min(left, window.innerWidth - 320)) + 'px';
  
  document.body.appendChild(bubble);
  
  bubble.querySelector('.bubble-close').onclick = () => bubble.remove();
  
  // 10秒后自动消失
  setTimeout(() => {
    if (bubble.parentNode) bubble.remove();
  }, 10000);
}

// 全局点击监听
function setupGlobalListener() {
  document.addEventListener('click', (e) => {
    if (!S.settings.assistant.enabled || !S.settings.assistant.globalMode) return;
    
    lastClickPosition = {x: e.clientX, y: e.clientY};
    clickCount++;
    lastClickTime = Date.now();
    
    const threshold = S.settings.assistant.clickThreshold || 10;
    
    if (clickCount >= threshold) {
      clickCount = 0;
      triggerAssistantResponse('用户频繁点击，可能遇到困难或在犹豫什么');
    }
  });
  
  // 每30秒重置计数
  setInterval(() => {
    if (Date.now() - lastClickTime > 30000) {
      clickCount = 0;
    }
  }, 30000);
}

// 触发管家响应
async function triggerAssistantResponse(context) {
  if (!S.settings.assistant.apiUrl || !S.settings.assistant.apiKey) {
    createBubble('还没配置 API 呢，去设置页面配置一下吧~ ^ ^', lastClickPosition);
    return;
  }
  
  const messages = [
    {role: 'system', content: S.settings.assistant.personality || DEFAULT_PERSONALITY},
    {role: 'user', content: context}
  ];
  
  try {
    const response = await fetch(S.settings.assistant.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${S.settings.assistant.apiKey}`
      },
      body: JSON.stringify({
        model: S.settings.assistant.model,
        messages: messages,
        max_tokens: 200
      })
    });
    
    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || '我在想怎么说...';
    createBubble(message, lastClickPosition);
  } catch (error) {
    createBubble('唔...网络好像有点问题', lastClickPosition);
  }
}

// 快捷唤醒块
function createQuickButton(containerId, feature) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const btn = document.createElement('button');
  btn.className = 'assistant-quick-btn';
  btn.innerHTML = `${I.spark(16)} 唤醒管家`;
  btn.onclick = () => {
    const context = getContextForFeature(feature);
    triggerAssistantResponse(context);
  };
  
  container.appendChild(btn);
}

// 获取功能上下文
function getContextForFeature(feature) {
  switch (feature) {
    case 'food':
      const meals = S.meals[TODAY_KEY()];
      return `用户正在查看饮食记录页面，今日已记录 ${meals?.items?.length || 0} 项食物`;
    case 'weight':
      const ws = weightSeries();
      const current = ws.length ? ws[ws.length - 1].v : S.profile.weight;
      return `用户正在查看体重页面，当前体重 ${current}kg，目标 ${S.settings.goal}kg`;
    case 'today':
      const day = ensureToday();
      const stat = dayStat(TODAY_KEY());
      return `用户正在查看今日任务，已完成 ${stat.done}/${stat.total} 项`;
    default:
      return '用户需要帮助';
  }
}

// 分析食品热量
async function analyzeFoodCalories(foodName) {
  const context = `请分析这个食物的热量：${foodName}`;
  return triggerAssistantResponse(context);
}

// 生成今日评语
async function generateDailyComment() {
  const day = ensureToday();
  const stat = dayStat(TODAY_KEY());
  const totalTime = day.totalTime || 0;
  
  const context = `用户今天完成了 ${stat.done}/${stat.total} 项锻炼，总耗时 ${Math.floor(totalTime / 60)} 分钟，请给一个评语`;
  return triggerAssistantResponse(context);
}

// 设置管家页面
function openAssistantSettings() {
  const ast = S.settings.assistant;
  $('#sheet-body').innerHTML = `
    <h2>${I.spark(20)} 锻炼管家设置</h2>
    
    <div class="field">
      <label>管家名字</label>
      <input class="inp" id="ast-name" value="${esc(ast.name || '管家')}" placeholder="给管家起个名字">
    </div>
    
    <div class="field">
      <label>API URL</label>
      <input class="inp" id="ast-url" value="${esc(ast.apiUrl || '')}" placeholder="https://api.openai.com/v1/chat/completions">
    </div>
    
    <div class="field">
      <label>API Key</label>
      <input class="inp" id="ast-key" type="password" value="${esc(ast.apiKey || '')}" placeholder="sk-...">
    </div>
    
    <div class="field">
      <label>模型</label>
      <input class="inp" id="ast-model" value="${esc(ast.model || 'gpt-3.5-turbo')}" placeholder="gpt-3.5-turbo">
      <button class="btn sm soft" id="ast-fetch-models" style="margin-top:8px">拉取可用模型</button>
    </div>
    
    <div class="divider"></div>
    
    <div class="setting-row">
      <div><div class="sl">启用管家</div><div class="ss">开启后可使用管家功能</div></div>
      <div class="switch ${ast.enabled?'on':''}" id="ast-enabled"></div>
    </div>
    
    <div class="setting-row">
      <div><div class="sl">全局模式</div><div class="ss">监听用户操作并主动响应</div></div>
      <div class="switch ${ast.globalMode?'on':''}" id="ast-global"></div>
    </div>
    
    <div class="field">
      <label>点击阈值（全局模式）</label>
      <input class="inp" id="ast-threshold" type="number" value="${ast.clickThreshold || 10}" min="3" max="50">
    </div>
    
    <div class="divider"></div>
    
    <div class="field">
      <label>启用功能</label>
      <div class="check-group">
        <label><input type="checkbox" ${ast.enabledFeatures?.includes('food')?'checked':''} value="food"> 饮食热量分析</label>
        <label><input type="checkbox" ${ast.enabledFeatures?.includes('comment')?'checked':''} value="comment"> 今日锻炼评语</label>
        <label><input type="checkbox" ${ast.enabledFeatures?.includes('plan')?'checked':''} value="plan"> 制定训练计划</label>
        <label><input type="checkbox" ${ast.enabledFeatures?.includes('motivation')?'checked':''} value="motivation"> 动机激励与鼓舞</label>
        <label><input type="checkbox" ${ast.enabledFeatures?.includes('qa')?'checked':''} value="qa"> 健身问答咨询</label>
        <label><input type="checkbox" ${ast.enabledFeatures?.includes('progress')?'checked':''} value="progress"> 进度分析与建议</label>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <button class="btn w soft" id="ast-personality" style="margin-bottom:8px">${I.edit(16)} 编辑人格设定</button>
    <button class="btn w soft" id="ast-templates" style="margin-bottom:8px">${I.list(16)} 人格方案管理</button>
    
    <button class="btn w" id="ast-save">保存设置</button>
  `;
  
  openSheet();
  
  // 绑定事件
  $('#ast-enabled').onclick = () => $('#ast-enabled').classList.toggle('on');
  $('#ast-global').onclick = () => $('#ast-global').classList.toggle('on');
  
  $('#ast-personality').onclick = () => {
    closeSheet();
    setTimeout(() => openPersonalityEditor(), 300);
  };
  
  $('#ast-templates').onclick = () => {
    closeSheet();
    setTimeout(() => openTemplateManager(), 300);
  };
  
  $('#ast-fetch-models').onclick = async () => {
    const url = $('#ast-url').value.trim().replace('/chat/completions', '/models');
    const key = $('#ast-key').value.trim();
    
    if (!url || !key) {
      toast(null, '缺少配置', '请先填写 API URL 和 Key', 'close');
      return;
    }
    
    try {
      const response = await fetch(url, {
        headers: {'Authorization': `Bearer ${key}`}
      });
      const data = await response.json();
      const models = data.data?.map(m => m.id) || [];
      
      if (models.length > 0) {
        $('#ast-model').value = models[0];
        toast(null, '获取成功', `找到 ${models.length} 个模型`, 'check');
      } else {
        toast(null, '未找到模型', '请检查 API 配置', 'close');
      }
    } catch (error) {
      toast(null, '获取失败', '请检查网络和配置', 'close');
    }
  };
  
  $('#ast-save').onclick = () => {
    const enabledFeatures = [];
    document.querySelectorAll('.check-group input:checked').forEach(cb => {
      enabledFeatures.push(cb.value);
    });
    
    Object.assign(S.settings.assistant, {
      name: $('#ast-name').value.trim(),
      apiUrl: $('#ast-url').value.trim(),
      apiKey: $('#ast-key').value.trim(),
      model: $('#ast-model').value.trim(),
      enabled: $('#ast-enabled').classList.contains('on'),
      globalMode: $('#ast-global').classList.contains('on'),
      clickThreshold: parseInt($('#ast-threshold').value) || 10,
      enabledFeatures: enabledFeatures
    });
    
    save();
    closeSheet();
    toast(null, '已保存', '管家设置已更新', 'check');
  };
}

// 人格编辑器
function openPersonalityEditor() {
  const current = S.settings.assistant.personality || DEFAULT_PERSONALITY;
  
  $('#sheet-body').innerHTML = `
    <div class="card-h">
      <h2>人格设定</h2>
      <button class="btn sm soft" id="per-default">载入默认模板</button>
    </div>
    <p class="hint">定义管家的说话风格、能力范围和行为准则</p>
    <div class="field">
      <textarea class="inp" id="per-content" rows="20" style="font-size:13px;line-height:1.6;font-family:monospace">${esc(current)}</textarea>
    </div>
    <div class="row2">
      <button class="btn ghost" id="per-cancel">取消</button>
      <button class="btn" id="per-save">保存并应用</button>
    </div>
  `;
  
  openSheet();
  
  $('#per-default').onclick = () => {
    $('#per-content').value = DEFAULT_PERSONALITY;
  };
  
  $('#per-cancel').onclick = closeSheet;
  
  $('#per-save').onclick = () => {
    S.settings.assistant.personality = $('#per-content').value.trim();
    save();
    closeSheet();
    toast(null, '已保存', '人格设定立即生效', 'check');
  };
}

// 模板管理器
function openTemplateManager() {
  initDefaultTemplate();
  
  const renderTemplates = () => {
    const templates = S.personalityTemplates || [];
    const html = templates.map(t => `
      <div class="template-item" data-id="${t.id}">
        <div style="flex:1">
          <b>${esc(t.name)}</b>
          ${t.isDefault ? '<span class="tag c2" style="margin-left:8px">默认</span>' : ''}
        </div>
        <div style="display:flex;gap:6px">
          <button class="mini-btn" data-use="${t.id}">${I.check(15)} 使用</button>
          <button class="mini-btn" data-edit="${t.id}">${I.edit(15)}</button>
          ${!t.isDefault ? `<button class="mini-btn" data-del="${t.id}">${I.trash(15)}</button>` : ''}
        </div>
      </div>
    `).join('');
    
    $('#sheet-body').innerHTML = `
      <h2>${I.list(20)} 人格方案管理</h2>
      <div class="card" style="max-height:60vh;overflow-y:auto">
        ${html || '<div class="empty">还没有保存的方案</div>'}
      </div>
      <button class="btn w soft" id="tpl-new" style="margin-top:12px">${I.plus(16)} 保存当前为新方案</button>
      <button class="btn w ghost" id="tpl-close">关闭</button>
    `;
    
    $('#tpl-close').onclick = closeSheet;
    
    $('#tpl-new').onclick = () => {
      const name = prompt('方案名称：');
      if (!name) return;
      
      S.personalityTemplates.push({
        id: 'tpl_' + uid(),
        name: name,
        content: S.settings.assistant.personality || DEFAULT_PERSONALITY,
        isDefault: false
      });
      save();
      renderTemplates();
      toast(null, '已保存', '新方案已创建', 'check');
    };
    
    document.querySelectorAll('[data-use]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.use;
        const tpl = S.personalityTemplates.find(t => t.id === id);
        if (tpl) {
          S.settings.assistant.personality = tpl.content;
          save();
          toast(null, '已应用', tpl.name + ' 立即生效', 'check');
        }
      };
    });
    
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.edit;
        const tpl = S.personalityTemplates.find(t => t.id === id);
        if (tpl) {
          closeSheet();
          setTimeout(() => openTemplateEditor(tpl), 300);
        }
      };
    });
    
    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.del;
        if (confirm('确定删除此方案？')) {
          S.personalityTemplates = S.personalityTemplates.filter(t => t.id !== id);
          save();
          renderTemplates();
          toast(null, '已删除', '方案已移除', 'check');
        }
      };
    });
  };
  
  openSheet();
  renderTemplates();
}

// 模板编辑器
function openTemplateEditor(template) {
  $('#sheet-body').innerHTML = `
    <h2>编辑方案</h2>
    <div class="field">
      <label>方案名称</label>
      <input class="inp" id="tedt-name" value="${esc(template.name)}">
    </div>
    <div class="field">
      <label>内容</label>
      <textarea class="inp" id="tedt-content" rows="15" style="font-size:13px;line-height:1.6;font-family:monospace">${esc(template.content)}</textarea>
    </div>
    <div class="row2">
      <button class="btn ghost" id="tedt-cancel">取消</button>
      <button class="btn" id="tedt-save">保存</button>
    </div>
  `;
  
  openSheet();
  
  $('#tedt-cancel').onclick = () => {
    closeSheet();
    setTimeout(() => openTemplateManager(), 300);
  };
  
  $('#tedt-save').onclick = () => {
    template.name = $('#tedt-name').value.trim();
    template.content = $('#tedt-content').value.trim();
    save();
    closeSheet();
    setTimeout(() => openTemplateManager(), 300);
    toast(null, '已保存', '方案已更新', 'check');
  };
}

// 初始化
setTimeout(() => {
  initDefaultTemplate();
  if (S.settings.assistant.enabled && S.settings.assistant.globalMode) {
    setupGlobalListener();
  }
}, 1000);
