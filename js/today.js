'use strict';
/* ============================================================
   渲染 — 今日
   ============================================================ */
const $ = s=>document.querySelector(s);
const $$ = s=>[...document.querySelectorAll(s)];
const WD = ['周一','周二','周三','周四','周五','周六','周日'];

function greet(){
  const h = new Date().getHours();
  const n = S.profile.name ? `，${S.profile.name}` : '';
  if(h<5) return '夜深了'+n;
  if(h<11) return '早上好'+n;
  if(h<14) return '午安'+n;
  if(h<18) return '下午好'+n;
  return '晚上好'+n;
}

function renderToday(){
  const k = TODAY_KEY(), d = parseD(k), day = ensureToday(), ph = phaseOf();
  $('#t-date').textContent = `${d.getMonth()+1}月${d.getDate()}日 · ${WD[wdIdx(d)]}`;
  $('#t-greet').textContent = greet();
  const st = dayStat(k);
  $('#t-sub').textContent = st.total ? (st.full ? '今日全部完成，漂亮。' : `还有 ${st.total-st.done} 项待完成`) : '尚未载入今日计划';

  const pct = st.total ? Math.round(st.done/st.total*100) : 0;
  const C = 2*Math.PI*45;
  $('#ring').style.strokeDasharray = C;
  $('#ring').style.strokeDashoffset = C*(1-pct/100);
  $('#ring-pct').textContent = pct;

  $('#hero-phase').textContent = PLAN.phases[ph].name + ' · ' + PLAN.phases[ph].range;
  $('#hero-title').textContent = `${WD[wdIdx(d)]} · 瘦全身 + 薄背`;
  const names = day.tasks.map(t=>t.cat||t.type).filter((v,i,a)=>a.indexOf(v)===i).join(' / ');
  $('#hero-desc').textContent = names || '点击下方载入计划';
  const sk = streak();
  $('#streak-chip').innerHTML = `${I.flame(13)} 连续 ${sk} 天${sk>=3?' · 保持住':''}`;

  $('#task-title').innerHTML = `${I.list(15)} 今日项目 <span class="muted nowrap" style="font-weight:600;font-size:12px">${st.done}/${st.total}</span>`;
  $('#btn-add-task').innerHTML = `${I.plus(16)} 添加运动项目`;
  $('#btn-quick-weight').innerHTML = I.scale(19);

  const list = $('#task-list');
  if(!day.tasks.length){
    list.innerHTML = `<div class="card empty">${I.aerobic(34)}<p>今天还没有项目<br>点「载入计划」按表格自动生成</p></div>`;
  } else {
    list.innerHTML = day.tasks.map(t=>{
      const ic = I[ICON_MAP[t.type]||'spark'];
      const tag = TYPE_TAG[t.cat]!==undefined?TYPE_TAG[t.cat]:'';
      return `<div class="task ${t.done?'done':''}" data-id="${t.id}">
        <div class="tick">${I.check()}</div>
        <div class="t-body">
          <div class="t-name"><span class="strike">${esc(t.name)}</span></div>
          <div class="t-meta">
            <span class="tag ${tag}">${esc(t.cat||'运动')}</span>
            <span class="t-dur">${I.clock(11)} ${t.dur} 分钟</span>
          </div>
        </div>
        <div class="t-act">
          <button class="mini-btn" data-edit="${t.id}" aria-label="编辑">${I.edit(15)}</button>
          <button class="mini-btn" data-del="${t.id}" aria-label="删除">${I.trash(15)}</button>
        </div>
      </div>`;
    }).join('');
  }

  // 薄背每天必做
  const bd = PLAN.backDaily.map(([n,v])=>`<div class="food"><div class="fi">${I.back(17)}</div><div style="flex:1"><b>${n}</b></div><div class="fk">${v[ph]}</div></div>`).join('');
  if(!$('#back-daily')){
    const sec = document.createElement('div');
    sec.innerHTML = `<div class="sec-title">薄背每天必做 · 无器械</div><div class="card" id="back-daily"></div>`;
    $('#v-today').appendChild(sec);
  }
  $('#back-daily').innerHTML = bd;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* 打卡交互 */
$('#task-list').addEventListener('click', e=>{
  const del = e.target.closest('[data-del]'), ed = e.target.closest('[data-edit]');
  if(del){ e.stopPropagation(); delTask(del.dataset.del); return }
  if(ed){ e.stopPropagation(); openTaskSheet(ed.dataset.edit); return }
  const row = e.target.closest('.task');
  if(row) toggleTask(row.dataset.id, row);
});

function toggleTask(id, el){
  const day = ensureToday();
  const t = day.tasks.find(x=>x.id===id); if(!t) return;
  const wasFull = dayStat(TODAY_KEY()).full;
  t.done = !t.done;
  save();
  if(t.done){
    el.classList.add('done');
    burst(el);
    if(navigator.vibrate) try{navigator.vibrate(12)}catch(e){}
  } else {
    el.classList.remove('done');
  }
  // 仅更新环与计数，避免重绘打断动画
  const st = dayStat(TODAY_KEY());
  const C = 2*Math.PI*45, pct = st.total?Math.round(st.done/st.total*100):0;
  $('#ring').style.strokeDashoffset = C*(1-pct/100);
  $('#ring-pct').textContent = pct;
  $('#task-title').innerHTML = `${I.list(15)} 今日项目 <span class="muted nowrap" style="font-weight:600;font-size:12px">${st.done}/${st.total}</span>`;
  $('#t-sub').textContent = st.full?'今日全部完成，漂亮。':`还有 ${st.total-st.done} 项待完成`;

  if(st.full && !wasFull){
    setTimeout(()=>onAllDone(), 620);
  } else if(t.done && S.settings.cheer){
    const m = ['稳。','这一下算数了。','节奏对了。','又近一点。','背会记得你今天的努力。'];
    toast(I.check?null:null, '已完成', m[Math.floor(Math.random()*m.length)], 'spark');
  }
}
function delTask(id){
  const day = ensureToday();
  day.tasks = day.tasks.filter(t=>t.id!==id);
  save(); renderToday();
}

/* 粒子 */
function burst(el){
  const r = el.getBoundingClientRect();
  const cx = r.left+26, cy = r.top+r.height/2;
  for(let i=0;i<10;i++){
    const s = document.createElement('div');
    s.className='spark';
    const sz = 3+Math.random()*3;
    const a = (-120+Math.random()*120)*Math.PI/180, dist=24+Math.random()*34;
    s.style.cssText=`width:${sz}px;height:${sz}px;left:${cx}px;top:${cy}px;position:fixed;z-index:200;--dx:${Math.cos(a)*dist}px;--dy:${Math.sin(a)*dist}px;animation:sparkUp ${500+Math.random()*320}ms var(--ease) forwards;background:${i%3===0?'var(--clay)':'var(--accent)'}`;
    document.body.appendChild(s);
    setTimeout(()=>s.remove(),900);
  }
}