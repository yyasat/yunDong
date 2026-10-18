'use strict';
/* ============================================================
   日历
   ============================================================ */
let calCur = new Date();
function renderCal(){
  const y=calCur.getFullYear(), m=calCur.getMonth();
  $('#cal-label').textContent = `${y} 年 ${m+1} 月`;
  const first=new Date(y,m,1), days=new Date(y,m+1,0).getDate();
  const lead=wdIdx(first);
  let html='';
  for(let i=0;i<lead;i++) html+=`<div class="cday pad"></div>`;
  const tk=TODAY_KEY();
  let monthFull=0, monthHas=0;
  for(let d=1;d<=days;d++){
    const k=fmt(new Date(y,m,d)), st=dayStat(k), w=S.weights[k];
    if(st.total) monthHas++;
    if(st.full) monthFull++;
    const cls=['cday']; if(st.full)cls.push('full'); else if(st.any)cls.push('part');
    if(k===tk)cls.push('today');
    html+=`<div class="${cls.join(' ')}" data-d="${k}">${d}${w?`<i class="wdot"></i>`:''}</div>`;
  }
  $('#cal-grid').innerHTML=html;
  $('#cal-sub').textContent = `本月完成 ${monthFull} 天`;
  $('#st-streak').textContent = streak();
  $('#st-total').textContent = totalDays();
  $('#st-rate').textContent = monthHas? Math.round(monthFull/monthHas*100)+'%' : '0%';
  $('#cal-prev').innerHTML=I.left(17); $('#cal-next').innerHTML=I.right(17);
  $('#btn-reveal-test').innerHTML=I.medal(19);

  // 里程碑
  const n=+S.settings.mile, sk=streak();
  const list=[];
  for(let i=1;i<=4;i++){
    const target=n*i, got=S.meta.seenMiles.includes(target)||sk>=target;
    list.push(`<div class="ph-badge ${got?'on':''}" ${got?`data-mile="${target}"`:''} style="${got?'':'cursor:default'}">
      <div class="pn">${got?I.medal(15):I.lock(14)}</div>
      <div style="flex:1"><b>连续 ${target} 天</b><span>${got?'已解锁 · 点击回看成果':`还需 ${target-sk} 天`}</span></div>
    </div>`);
  }
  $('#milestones').innerHTML=list.join('');
}
$('#cal-prev').addEventListener('click',()=>{calCur=new Date(calCur.getFullYear(),calCur.getMonth()-1,1);renderCal()});
$('#cal-next').addEventListener('click',()=>{calCur=new Date(calCur.getFullYear(),calCur.getMonth()+1,1);renderCal()});
$('#cal-grid').addEventListener('click',e=>{
  const c=e.target.closest('.cday[data-d]'); if(c) openDaySheet(c.dataset.d);
});
$('#milestones').addEventListener('click',e=>{
  const b=e.target.closest('[data-mile]'); if(b) showReveal(+b.dataset.mile);
});
$('#btn-reveal-test').addEventListener('click',()=>showReveal(Math.max(streak(),+S.settings.mile)));

function openDaySheet(k){
  const d=parseD(k), day=S.days[k], st=dayStat(k), w=S.weights[k];
  const weightValue = w ? (typeof w === 'object' ? w.value : w) : null;
  const isFuture = k>TODAY_KEY();
  const tasks = day&&day.tasks.length ? day.tasks.map(t=>
    `<div class="food"><div class="fi">${I[ICON_MAP[t.type]||'spark'](17)}</div>
     <div style="flex:1"><b>${esc(t.name)}</b><span>${esc(t.cat||'')} · ${t.dur}分钟</span></div>
     <div class="fk" style="color:${t.done?'var(--accent)':'var(--text-3)'}">${t.done?'已完成':'—'}</div></div>`).join('')
    : `<p class="fs12 muted tc" style="padding:18px 0">这天没有记录</p>`;
  const moodTxt = day&&day.mood ? ['','有点吃力','正常','很轻松'][day.mood] : '—';
  
  // 添加耗时信息按钮
  const totalTime = day?.totalTime || 0;
  const timeBtn = totalTime > 0 ? `<button class="btn w ghost sm" id="d-time" style="margin-bottom:9px">${I.clock(16)} 查看锻炼耗时详情</button>` : '';
  
  // 添加今日感悟显示
  const feeling = day?.feeling ? `<div class="card flat" style="margin-bottom:14px"><div class="sl">今日感悟</div><p style="margin:8px 0 0;line-height:1.6">${esc(day.feeling)}</p></div>` : '';
  
  // 添加小票查看按钮
  const receiptBtn = S.receipts?.[k] ? `<button class="btn w ghost sm" id="d-receipt" style="margin-bottom:9px">${I.receipt?I.receipt(16):''} 查看打卡小票</button>` : '';
  
  $('#sheet-body').innerHTML=`
    <h2>${d.getMonth()+1}月${d.getDate()}日 · ${WD[wdIdx(d)]}</h2>
    <div class="stat-row" style="margin-bottom:16px">
      <div class="stat"><b>${st.done}/${st.total||0}</b><span>完成项</span></div>
      <div class="stat"><b>${weightValue?weightValue.toFixed(1):'—'}</b><span>体重 KG</span></div>
      <div class="stat"><b style="font-size:14px">${moodTxt}</b><span>当日感受</span></div>
    </div>
    <div class="card flat" style="margin-bottom:14px">${tasks}</div>
    ${feeling}
    ${timeBtn}
    ${receiptBtn}
    <div class="field"><label>这天的体重</label>
      <input class="inp" id="d-w" type="number" step="0.1" inputmode="decimal" value="${weightValue||''}" placeholder="未记录"></div>
    ${isFuture?'':`<button class="btn w ghost sm" id="d-load" style="margin-bottom:9px">按计划表载入这天的项目</button>`}
    <button class="btn w" id="d-save">保存</button>`;
  
  // 查看耗时详情
  const timeEl = $('#d-time');
  if(timeEl) {
    timeEl.onclick = () => {
      closeSheet();
      setTimeout(() => {
        if(typeof showTimeDetails === 'function') {
          showTimeDetails(k);
        }
      }, 300);
    };
  }
  
  // 查看小票
  const receiptEl = $('#d-receipt');
  if(receiptEl) {
    receiptEl.onclick = () => {
      const receipt = S.receipts[k];
      if(receipt && typeof showReceipt === 'function') {
        closeSheet();
        setTimeout(() => showReceipt(receipt), 300);
      }
    };
  }
  
  $('#d-save').onclick=()=>{
    const v=parseFloat($('#d-w').value);
    if(!isNaN(v)&&v>20&&v<300) S.weights[k]={value: +v.toFixed(1), unit: 'kg'};
    else if($('#d-w').value==='') delete S.weights[k];
    save(); closeSheet(); renderAll();
  };
  const dl=$('#d-load');
  if(dl) dl.onclick=()=>{
    const dd=getDay(k,true); dd.tasks=buildPlan(k); dd.loaded=true;
    save(); closeSheet(); renderAll();
  };
  openSheet();
}