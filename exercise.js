'use strict';
/* ============================================================
   动作库与自定义动作组
   ============================================================ */

// 动作详情数据
const EXERCISE_DETAILS = {
  '跳绳': {
    name: '跳绳',
    description: '高效燃脂有氧运动，提升心肺功能',
    howTo: `1. 双脚并拢站立，手握绳柄自然下垂
2. 用手腕发力甩绳，不要用整个手臂
3. 前脚掌着地起跳，膝盖微屈缓冲
4. 保持核心收紧，视线向前
5. 初学者可以先练习无绳跳`,
    tips: '跳绳前热身，穿减震鞋，避免在硬地面跳',
    hasJump: true
  },
  '燃脂操': {
    name: '燃脂操',
    description: '全身有氧运动，提高代谢燃烧脂肪',
    howTo: `1. 跟随视频节奏做动作
2. 幅度由小到大，逐渐找到节奏
3. 保持呼吸顺畅，不要憋气
4. 动作做到位比速度重要
5. 感觉累了可以原地踏步缓一下`,
    tips: '准备瑜伽垫，穿运动内衣，提前排空膀胱',
    hasJump: false
  },
  '薄背': {
    name: '薄背（肩背训练）',
    description: '改善体态，消除背部赘肉，打造纤薄美背',
    howTo: `【靠墙站】贴墙站立，后脑勺、肩胛骨、臀部、小腿、脚跟贴墙
【肩胛骨后缩】双手前平举，用力向后夹紧肩胛骨
【俯身飞鸟】俯身45度，双臂向两侧打开，夹紧肩胛
【面拉】双手在面部高度向后拉，肘部外展
【拉伸】拉伸斜方肌和胸肌，每边30秒以上`,
    tips: '注意肩胛骨内收，不要耸肩，动作慢而标准',
    hasJump: false
  },
  '核心': {
    name: '核心训练',
    description: '增强腹肌力量，稳定躯干，改善体态',
    howTo: `常见动作：
1. 平板支撑：肘部撑地，身体成一条直线
2. 卷腹：仰卧屈膝，用腹肌发力卷起上身
3. 俄罗斯转体：坐姿转体，双手触地两侧
4. 登山跑：平板姿势，交替提膝
5. 死虫：仰卧，对侧手脚同时伸展`,
    tips: '腰部不要发力，全程收紧核心，呼吸配合动作',
    hasJump: false
  },
  '拉伸': {
    name: '拉伸',
    description: '放松肌肉，增加柔韧性，预防受伤',
    howTo: `1. 颈部拉伸：头部缓慢向各方向倾斜
2. 肩部拉伸：单臂横跨身体，另一手辅助
3. 胸部拉伸：双手在身后交叉，挺胸
4. 腿部拉伸：弓步、坐姿前屈、侧压腿
5. 每个动作保持20-30秒，不要弹震`,
    tips: '拉伸到有拉扯感即可，不要硬拉，保持呼吸',
    hasJump: false
  },
  '手臂': {
    name: '手臂训练',
    description: '紧致手臂线条，告别拜拜肉',
    howTo: `1. 哑铃弯举：双臂屈伸，锻炼肱二头肌
2. 臂屈伸：支撑后仰，屈伸肘部
3. 侧平举：双臂向两侧抬起至肩高
4. 平举：双臂向前或向上举
5. 可用矿泉水瓶代替哑铃`,
    tips: '动作慢而标准，感受肌肉收缩，手腕保持中立',
    hasJump: false
  }
};

// 初始化动作库
function initExerciseLibrary() {
  if (Object.keys(S.exercises).length === 0) {
    Object.entries(EXERCISE_DETAILS).forEach(([key, detail]) => {
      S.exercises[uid()] = {
        name: detail.name,
        description: detail.description,
        howTo: detail.howTo,
        tips: detail.tips,
        hasJump: detail.hasJump,
        isDefault: true
      };
    });
    save();
  }
}

// 打开动作详情
function openExerciseDetail(exerciseName) {
  // 从动作库中查找
  let exercise = Object.values(S.exercises).find(e => e.name === exerciseName);
  
  // 如果没找到，使用默认数据
  if (!exercise && EXERCISE_DETAILS[exerciseName]) {
    exercise = EXERCISE_DETAILS[exerciseName];
  }
  
  if (!exercise) {
    toast(null, '暂无详情', '该动作还没有添加说明', 'close');
    return;
  }
  
  $('#sheet-body').innerHTML = `
    <div class="exercise-detail-header">
      <div class="exercise-icon">${I[ICON_MAP[exerciseName.includes('跳绳') ? 'jump' : exerciseName.includes('操') ? 'aerobic' : exerciseName.includes('背') ? 'back' : exerciseName.includes('核心') ? 'core' : exerciseName.includes('拉伸') ? 'stretch' : exerciseName.includes('手臂') ? 'arm' : 'spark']] ? I[ICON_MAP[exerciseName.includes('跳绳') ? 'jump' : exerciseName.includes('操') ? 'aerobic' : exerciseName.includes('背') ? 'back' : exerciseName.includes('核心') ? 'core' : exerciseName.includes('拉伸') ? 'stretch' : exerciseName.includes('手臂') ? 'arm' : 'spark']](32) : ''}</div>
      <div>
        <h2>${esc(exercise.name)}</h2>
        <p class="hint">${esc(exercise.description)}</p>
      </div>
    </div>
    
    ${exercise.hasJump ? '<div class="alert alert-warning">${I.spark(16)} 此动作包含跳跃</div>' : ''}
    
    <div class="exercise-section">
      <h3>${I.list(18)} 动作要领</h3>
      <div class="exercise-content">${esc(exercise.howTo).replace(/\\n/g, '<br>')}</div>
    </div>
    
    <div class="exercise-section">
      <h3>${I.spark(18)} 注意事项</h3>
      <div class="exercise-content">${esc(exercise.tips)}</div>
    </div>
    
    <button class="btn w ghost" onclick="closeSheet()">关闭</button>
  `;
  
  openSheet();
}

// 每日跳跃模式选择
function showJumpModeSelection() {
  const today = TODAY_KEY();
  const day = getDay(today);
  
  // 如果今天已经选择过，不再显示
  if (day?.jumpModeSelected) return;
  
  $('#sheet-body').innerHTML = `
    <h2>${I.rope(24)} 今日动作选择</h2>
    <p class="hint">选择今天要做的动作类型</p>
    
    <div class="jump-mode-options">
      <button class="jump-mode-btn" data-mode="jump">
        <div class="jump-mode-icon">${I.rope(40)}</div>
        <div class="jump-mode-label">有跳跃</div>
        <div class="jump-mode-desc">包含跳绳等跳跃动作</div>
      </button>
      
      <button class="jump-mode-btn" data-mode="nojump">
        <div class="jump-mode-icon">${I.aerobic(40)}</div>
        <div class="jump-mode-label">无跳跃</div>
        <div class="jump-mode-desc">适合楼层限制或关节休息</div>
      </button>
    </div>
    
    <button class="btn w ghost" id="jump-skip">稍后选择</button>
  `;
  
  openSheet();
  
  document.querySelectorAll('.jump-mode-btn').forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;
      const day = ensureToday();
      day.jumpMode = mode;
      day.jumpModeSelected = true;
      
      // 如果选择无跳跃，过滤掉跳跃动作
      if (mode === 'nojump') {
        day.tasks = day.tasks.filter(t => !t.hasJump);
      }
      
      save();
      closeSheet();
      renderToday();
      toast(null, '已选择', mode === 'jump' ? '今天有跳跃动作' : '今天无跳跃动作', 'check');
    };
  });
  
  $('#jump-skip').onclick = closeSheet;
}

// 自定义动作组管理
function openExerciseGroupManager() {
  const renderGroups = () => {
    const groups = S.exerciseGroups || [];
    const html = groups.length ? groups.map(g => `
      <div class="exercise-group-card">
        <div style="flex:1">
          <b>${esc(g.name)}</b>
          <div class="fs12 muted">${g.exercises.length} 个动作</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="mini-btn" data-use="${g.id}">${I.check(15)} 使用</button>
          <button class="mini-btn" data-edit="${g.id}">${I.edit(15)}</button>
          <button class="mini-btn" data-del="${g.id}">${I.trash(15)}</button>
        </div>
      </div>
    `).join('') : '<div class="empty">还没有自定义动作组</div>';
    
    $('#sheet-body').innerHTML = `
      <h2>${I.list(20)} 自定义动作组</h2>
      <div class="card" style="max-height:50vh;overflow-y:auto">
        ${html}
      </div>
      <button class="btn w soft" id="grp-new">${I.plus(16)} 新建动作组</button>
      <button class="btn w ghost" id="grp-close">关闭</button>
    `;
    
    $('#grp-close').onclick = closeSheet;
    
    $('#grp-new').onclick = () => {
      closeSheet();
      setTimeout(() => openExerciseGroupEditor(), 300);
    };
    
    // 使用动作组
    document.querySelectorAll('[data-use]').forEach(btn => {
      btn.onclick = () => {
        const group = S.exerciseGroups.find(g => g.id === btn.dataset.use);
        if (group) {
          const day = ensureToday();
          day.tasks = group.exercises.map(e => ({
            id: uid(),
            name: e.name,
            type: e.type || 'other',
            cat: e.cat || '运动',
            dur: e.duration || 10,
            done: false,
            hasJump: e.hasJump || false
          }));
          save();
          closeSheet();
          renderToday();
          toast(null, '已载入', group.name, 'check');
        }
      };
    });
    
    // 编辑
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => {
        const group = S.exerciseGroups.find(g => g.id === btn.dataset.edit);
        if (group) {
          closeSheet();
          setTimeout(() => openExerciseGroupEditor(group), 300);
        }
      };
    });
    
    // 删除
    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => {
        if (confirm('确定删除此动作组？')) {
          S.exerciseGroups = S.exerciseGroups.filter(g => g.id !== btn.dataset.del);
          save();
          renderGroups();
          toast(null, '已删除', '动作组已移除', 'check');
        }
      };
    });
  };
  
  openSheet();
  renderGroups();
}

// 动作组编辑器
function openExerciseGroupEditor(group = null) {
  const isNew = !group;
  const exercises = group?.exercises || [];
  
  $('#sheet-body').innerHTML = `
    <h2>${isNew ? '新建' : '编辑'}动作组</h2>
    <div class="field">
      <label>组名</label>
      <input class="inp" id="grp-name" value="${group?.name || ''}" placeholder="例如：无跳跃版周一">
    </div>
    <div class="field">
      <label>动作列表</label>
      <div id="grp-exercises"></div>
      <button class="btn w soft sm" id="grp-add-ex" style="margin-top:8px">${I.plus(14)} 添加动作</button>
    </div>
    <div class="row2">
      <button class="btn ghost" id="grp-cancel">取消</button>
      <button class="btn" id="grp-save">保存</button>
    </div>
  `;
  
  openSheet();
  
  // 渲染动作列表
  const renderExercises = () => {
    const html = exercises.map((e, i) => `
      <div class="exercise-item">
        <span>${i + 1}. ${esc(e.name)} - ${e.duration}分钟</span>
        <button class="mini-btn" data-del="${i}">${I.trash(15)}</button>
      </div>
    `).join('');
    $('#grp-exercises').innerHTML = html || '<div class="hint">还没有添加动作</div>';
    
    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => {
        exercises.splice(parseInt(btn.dataset.del), 1);
        renderExercises();
      };
    });
  };
  
  renderExercises();
  
  // 添加动作
  $('#grp-add-ex').onclick = () => {
    const name = prompt('动作名称：');
    if (!name) return;
    const duration = parseInt(prompt('时长（分钟）：', '10')) || 10;
    const hasJump = confirm('是否包含跳跃？');
    
    exercises.push({
      name,
      duration,
      hasJump,
      type: 'other',
      cat: '运动'
    });
    
    renderExercises();
  };
  
  $('#grp-cancel').onclick = () => {
    closeSheet();
    setTimeout(() => openExerciseGroupManager(), 300);
  };
  
  $('#grp-save').onclick = () => {
    const name = $('#grp-name').value.trim();
    if (!name) {
      toast(null, '请输入组名', '', 'close');
      return;
    }
    
    if (isNew) {
      S.exerciseGroups.push({
        id: uid(),
        name,
        exercises
      });
    } else {
      group.name = name;
      group.exercises = exercises;
    }
    
    save();
    closeSheet();
    setTimeout(() => openExerciseGroupManager(), 300);
    toast(null, '已保存', name, 'check');
  };
}

// 薄背动作详情
const BACK_EXERCISE_DETAILS = {
  '靠墙站': {
    name: '靠墙站',
    description: '改善体态，拉直脊柱，矫正圆肩驼背',
    howTo: `1. 背靠墙站立，双脚离墙约10-15厘米
2. 后脑勺、肩胛骨、臀部、小腿、脚跟五点贴墙
3. 收紧核心，不要塌腰
4. 下巴微收，眼睛平视前方
5. 保持自然呼吸，坚持规定时间`,
    tips: '初期可能很累，坚持就会改善，可以分组完成'
  },
  '肩胛骨后缩': {
    name: '肩胛骨后缩',
    description: '激活菱形肌，改善圆肩，增强后背力量',
    howTo: `1. 站立或坐姿，背部挺直
2. 双臂自然垂放或前平举
3. 用力向后夹紧肩胛骨
4. 保持1-2秒后放松
5. 重复指定次数`,
    tips: '注意是肩胛骨往后夹，不是耸肩，感受背部中间用力'
  },
  '俯身飞鸟': {
    name: '俯身飞鸟',
    description: '锻炼后肩和中背部，消除背部赘肉',
    howTo: `1. 俯身45度，膝盖微屈，背部挺直
2. 双手自然下垂或持轻哑铃
3. 双臂向两侧打开至与肩同高
4. 夹紧肩胛骨，顶峰收缩1秒
5. 缓慢还原，重复动作`,
    tips: '用背部发力，不要用手臂甩，慢动作更有效'
  },
  '面拉（徒手慢做）': {
    name: '面拉（徒手慢做）',
    description: '针对后肩和斜方肌中下束，改善体态',
    howTo: `1. 站立，双手握拳放在面前
2. 手肘外展，向后拉至耳朵两侧
3. 想象手肘往后夹
4. 保持1秒后缓慢还原
5. 徒手版注重慢动作和顶峰收缩`,
    tips: '保持手肘与肩同高，不要向下拉'
  },
  '拉伸斜方肌': {
    name: '拉伸斜方肌',
    description: '放松颈肩，缓解斜方肌紧张',
    howTo: `1. 坐姿或站立，背部挺直
2. 头部缓慢侧向一边
3. 对侧手可轻按头部辅助
4. 感受颈侧拉伸感
5. 每边保持30秒以上，不要弹震`,
    tips: '拉伸要温和，不要用力过猛，保持深呼吸'
  },
  '拉伸胸肌': {
    name: '拉伸胸肌',
    description: '打开胸腔，改善含胸，配合薄背训练效果更好',
    howTo: `1. 站在墙角或门框旁
2. 手臂屈肘90度贴墙
3. 身体前倾，感受胸部拉伸
4. 或双手在身后交叉，挺胸
5. 每边保持30秒以上`,
    tips: '配合深呼吸，拉伸时想象打开胸腔'
  }
};

// 打开薄背动作详情
function openBackExerciseDetail(actionName) {
  const exercise = BACK_EXERCISE_DETAILS[actionName];
  
  if (!exercise) {
    toast(null, '暂无详情', '该动作还没有添加说明', 'close');
    return;
  }
  
  $('#sheet-body').innerHTML = `
    <div class="exercise-detail-header">
      <div class="exercise-icon">${I.back(32)}</div>
      <div>
        <h2>${esc(exercise.name)}</h2>
        <p class="hint">${esc(exercise.description)}</p>
      </div>
    </div>
    
    <div class="exercise-section">
      <h3>${I.list(18)} 动作要领</h3>
      <div class="exercise-content">${esc(exercise.howTo).replace(/\n/g, '<br>')}</div>
    </div>
    
    <div class="exercise-section">
      <h3>${I.spark(18)} 注意事项</h3>
      <div class="exercise-content">${esc(exercise.tips)}</div>
    </div>
    
    <button class="btn w ghost" onclick="closeSheet()">关闭</button>
  `;
  
  openSheet();
}
