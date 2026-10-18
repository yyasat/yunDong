'use strict';
/* ============================================================
   我的 / 设置
   ============================================================ */
const SHAPES=['偏瘦','标准','微胖','苹果型','梨型','匀称'];
function renderMe(){
  const p=S.profile;
  
  // 头像显示（支持自定义）
  if(p.avatar) {
    $('#me-av').style.backgroundImage = `url(${p.avatar})`;
    $('#me-av').style.backgroundSize = 'cover';
    $('#me-av').textContent = '';
  } else {
    $('#me-av').style.backgroundImage = 'none';
    $('#me-av').textContent=p.name?p.name.slice(0,1):'轻';
  }
  
  $('#me-name').textContent=p.name||'未设置名字';
  const bmi=(p.height&&p.weight)?(p.weight/Math.pow(p.height/100,2)).toFixed(1):null;
  $('#me-meta').textContent=[p.gender,p.age?p.age+'岁':'',bmi?'BMI '+bmi:''].filter(Boolean).join(' · ')||'补全资料，计划更贴合';
  $('#me-chips').innerHTML=[
    p.height?`身高 ${p.height}cm`:'', p.weight?`体重 ${p.weight}kg`:'',
    S.settings.goal?`目标 ${S.settings.goal}kg`:'', p.shape?`身材 ${p.shape}`:'',
    p.birthday?`生日 ${p.birthday.slice(5)}`:''
  ].filter(Boolean).map(c=>`<span class="chip">${c}</span>`).join('');

  $('#phase-list').innerHTML=PLAN.phases.map((ph,i)=>`
    <div class="ph-badge ${phaseOf()===i?'on':''}" data-ph="${i}">
      <div class="pn">${i+1}</div>
      <div style="flex:1"><b>${ph.name} · ${ph.range}</b><span>${ph.desc}</span></div>
    </div>`).join('') + `
    <div class="divider"></div>
    <div class="sl" style="font-size:12.5px;margin-bottom:8px">升级信号</div>
    ${PLAN.upgradeSignals.map(([a,b])=>`<div class="setting-row" style="padding:9px 0"><div><div class="sl" style="font-size:13px">${a}</div></div><b class="fs12" style="color:var(--accent)">${b}</b></div>`).join('')}`;
  $$('[data-ph]').forEach(b=>b.onclick=()=>{
    S.settings.phase=+b.dataset.ph; save(); renderMe(); renderToday();
    toast(null,'已切换阶段',PLAN.phases[+b.dataset.ph].name+' · 下次载入计划生效','spark');
  });

  $('#sw-food').classList.toggle('on',S.settings.food);
  $('#sw-cheer').classList.toggle('on',S.settings.cheer);
  $('#sw-quiz').classList.toggle('on',S.settings.quiz);
  $('#sw-auto').classList.toggle('on',S.settings.autoAdjust);
  $('#sel-mile').value=S.settings.mile;
  $('#inp-goal').value=S.settings.goal;
  $('#inp-kcal').value=S.settings.kcal;
  if($('#inp-checkins')) $('#inp-checkins').value=S.settings.dailyCheckIns || 1;
  $$('#seg-theme button').forEach(b=>b.classList.toggle('on',b.dataset.theme===S.settings.theme));
  
  // 动态渲染图标按钮（修复模板语法错误）
  if($('#btn-assistant-settings-text')) {
    $('#btn-assistant-settings-text').innerHTML = `${I.robot(18)} 锻炼管家`;
    $('#btn-assistant-settings-btn').innerHTML = `${I.settings(16)} 管家设置`;
  }
  if($('#btn-videos-text')) $('#btn-videos-text').innerHTML = `${I.video(16)} 视频库 (${S.videos?S.videos.length:0})`;
  if($('#btn-exercise-groups-text')) $('#btn-exercise-groups-text').innerHTML = `${I.list(16)} 动作组管理`;
  if($('#btn-receipts-text')) $('#btn-receipts-text').innerHTML = `${I.receipt(16)} 打卡小票库`;
  if($('#btn-water-history-text')) $('#btn-water-history-text').innerHTML = `${I.water(16)} 饮水历史`;
  if($('#btn-meal-history-text')) $('#btn-meal-history-text').innerHTML = `${I.food(16)} 餐饮历史`;
}
function bindSwitch(sel,key,after){
  $(sel).addEventListener('click',()=>{
    S.settings[key]=!S.settings[key]; save();
    $(sel).classList.toggle('on',S.settings[key]);
    after&&after();
  });
}
bindSwitch('#sw-food','food',()=>{buildNav();renderMe()});
bindSwitch('#sw-cheer','cheer');
bindSwitch('#sw-quiz','quiz');
bindSwitch('#sw-auto','autoAdjust');
$('#sel-mile').addEventListener('change',e=>{S.settings.mile=+e.target.value;save();renderCal()});
$('#inp-goal').addEventListener('change',e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){S.settings.goal=+v.toFixed(1);save();renderWeight()}});
$('#inp-kcal').addEventListener('change',e=>{const v=parseInt(e.target.value);if(v>0){S.settings.kcal=v;save();if(S.settings.food)renderFood()}});
$('#inp-checkins').addEventListener('change',e=>{const v=parseInt(e.target.value);if(v>0&&v<=5){S.settings.dailyCheckIns=v;save()}});

// AI 管家设置
$('#btn-assistant-settings').addEventListener('click', ()=>{
  if(typeof openAssistantSettings === 'function') {
    openAssistantSettings();
  } else {
    toast(null, '功能加载中', '请稍后再试', 'close');
  }
});

// 视频管理
$('#btn-videos').addEventListener('click', ()=>{
  if(typeof openVideoManager === 'function') {
    openVideoManager();
  }
});

// 动作组管理
$('#btn-exercise-groups').addEventListener('click', ()=>{
  if(typeof openExerciseGroupManager === 'function') {
    openExerciseGroupManager();
  }
});

// 打卡小票库
$('#btn-receipts').addEventListener('click', ()=>{
  if(typeof openReceiptLibrary === 'function') {
    openReceiptLibrary();
  }
});

// 饮水历史
$('#btn-water-history').addEventListener('click', ()=>{
  if(typeof openWaterHistory === 'function') {
    openWaterHistory();
  }
});

// 餐饮历史
$('#btn-meal-history').addEventListener('click', ()=>{
  if(typeof openMealHistory === 'function') {
    openMealHistory();
  }
});

$('#btn-edit-profile').addEventListener('click',()=>{
  const p=S.profile;
  $('#sheet-body').innerHTML=`
    <h2>个人资料</h2>
    <div class="field">
      <label>头像</label>
      <div style="display:flex;align-items:center;gap:12px">
        <div class="avatar" id="preview-av" style="width:60px;height:60px;font-size:24px">${p.avatar?'':'轻'}</div>
        <div style="flex:1">
          <input type="file" id="p-avatar-file" accept="image/*" style="display:none">
          <button class="btn sm soft" id="p-avatar-btn" style="margin-bottom:6px">${I.up(14)} 选择图片</button>
          <input class="inp" id="p-avatar" placeholder="或输入图片 URL" value="${esc(p.avatar||'')}">
          <p class="hint" style="margin:4px 0 0">支持本地相册选择，不压缩画质</p>
        </div>
      </div>
    </div>
    <div class="field"><label>名字</label><input class="inp" id="p-n" value="${esc(p.name)}" placeholder="怎么称呼你"></div>
    <div class="row2">
      <div class="field"><label>性别</label><select class="inp" id="p-g"><option value="">未选择</option>${['女','男','其他'].map(g=>`<option ${p.gender===g?'selected':''}>${g}</option>`).join('')}</select></div>
      <div class="field"><label>年龄</label><input class="inp" id="p-a" type="number" inputmode="numeric" value="${p.age}"></div>
    </div>
    <div class="row2">
      <div class="field"><label>身高 (cm)</label><input class="inp" id="p-h" type="number" inputmode="decimal" value="${p.height}"></div>
      <div class="field"><label>当前体重 (kg)</label><input class="inp" id="p-w" type="number" step="0.1" inputmode="decimal" value="${p.weight}"></div>
    </div>
    <div class="row2">
      <div class="field"><label>生日</label><input class="inp" id="p-b" type="date" value="${p.birthday}"></div>
      <div class="field"><label>身材</label><select class="inp" id="p-s"><option value="">未选择</option>${SHAPES.map(s=>`<option ${p.shape===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>起始体重 (kg) · 用于计算变化</label><input class="inp" id="p-sw" type="number" step="0.1" inputmode="decimal" value="${p.startWeight}"></div>
    <button class="btn w" id="p-ok">保存</button>`;
  openSheet();
  
  // 本地图片上传（不压缩）
  $('#p-avatar-btn').onclick = () => $('#p-avatar-file').click();
  $('#p-avatar-file').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        $('#p-avatar').value = dataUrl;
        const preview = $('#preview-av');
        preview.style.backgroundImage = `url(${dataUrl})`;
        preview.style.backgroundSize = 'cover';
        preview.textContent = '';
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 实时预览头像
  $('#p-avatar').addEventListener('input', e => {
    const url = e.target.value.trim();
    const preview = $('#preview-av');
    if(url) {
      preview.style.backgroundImage = `url(${url})`;
      preview.style.backgroundSize = 'cover';
      preview.textContent = '';
    } else {
      preview.style.backgroundImage = 'none';
      preview.textContent = '轻';
    }
  });
  
  // 初始预览
  if(p.avatar) {
    $('#preview-av').style.backgroundImage = `url(${p.avatar})`;
    $('#preview-av').style.backgroundSize = 'cover';
    $('#preview-av').textContent = '';
  }
  
  $('#p-ok').onclick=()=>{
    const g=id=>$(id).value.trim();
    Object.assign(S.profile,{
      name:g('#p-n'),gender:g('#p-g'),age:g('#p-a'),height:g('#p-h'),
      birthday:g('#p-b'),shape:g('#p-s'),avatar:g('#p-avatar'),
      weight:parseFloat(g('#p-w'))||S.profile.weight,
      startWeight:parseFloat(g('#p-sw'))||S.profile.startWeight
    });
    const w=parseFloat(g('#p-w'));
    if(!isNaN(w)&&w>20&&w<300 && !S.weights[TODAY_KEY()]) S.weights[TODAY_KEY()]={value:+w.toFixed(1),unit:'kg'};
    save(); closeSheet(); renderAll();
    toast(null,'已保存','资料更新完成','check');
  };
});

/* 导入导出 */
$('#btn-export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=`qing-fitness-${TODAY_KEY()}.json`;
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast(null,'已导出','JSON 文件已下载','check');
});
$('#btn-import').addEventListener('click',()=>$('#file-import').click());
$('#file-import').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      S=deepMerge(structuredClone(DEFAULT),d);
      save(); applyTheme(); buildNav(); renderAll();
      toast(null,'导入成功','数据已恢复','check');
    }catch(err){ toast(null,'导入失败','文件格式不正确','close') }
  };
  r.readAsText(f); e.target.value='';
});
$('#btn-reset').addEventListener('click',()=>{
  $('#sheet-body').innerHTML=`
    <h2>清空所有数据</h2>
    <p class="hint">将删除全部打卡、体重、饮食与个人资料，且无法恢复。建议先导出备份。</p>
    <button class="btn w ghost" id="r-no" style="margin-bottom:9px">取消</button>
    <button class="btn w" id="r-yes" style="background:var(--clay);box-shadow:none">确认清空</button>`;
  openSheet();
  $('#r-no').onclick=closeSheet;
  $('#r-yes').onclick=()=>{
    localStorage.removeItem(KEY);
    S=structuredClone(DEFAULT);
    save(); closeSheet(); applyTheme(); buildNav(); renderAll();
    toast(null,'已清空','可以重新开始了','check');
  };
});