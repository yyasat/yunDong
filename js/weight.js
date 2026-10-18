'use strict';
/* ============================================================
   体重页
   ============================================================ */
let wRange=14;
function renderWeight(){
  const ws=weightSeries();
  const start=S.profile.startWeight||(ws[0]?ws[0].v:S.profile.weight);
  const now=ws.length?ws[ws.length-1].v:S.profile.weight;
  const chg=+(now-start).toFixed(1), goal=+S.settings.goal, togo=+(now-goal).toFixed(1);
  $('#w-now').textContent=now?now.toFixed(1):'—';
  $('#w-chg').textContent=(chg>0?'+':'')+chg.toFixed(1);
  $('#w-chg-box').className='stat '+(chg<0?'down':chg>0?'up':'');
  $('#w-togo').textContent=togo>0?togo.toFixed(1):'达成';
  $('#w-sub').textContent=`起点 ${start.toFixed(1)} → 目标 ${goal.toFixed(1)} kg`;
  $('#btn-weight-add').innerHTML=I.plus(19);
  $('#w-chart-title').innerHTML=`${I.trend(15)} 变化曲线`;

  // 曲线
  const cut=fmt(addDays(new Date(),-wRange+1));
  const series=ws.filter(s=>s.d>=cut);
  const box=$('#chart');
  if(series.length<2){
    box.innerHTML=`<div class="empty" style="padding:50px 10px">${I.scale(32)}<p>至少两条记录才能画出趋势</p></div>`;
  } else {
    const W=460,H=190,pl=30,pr=14,pt=14,pb=24;
    const vals=series.map(s=>s.v).concat([goal]);
    let lo=Math.min(...vals),hi=Math.max(...vals);
    if(hi-lo<1.2){const m=(hi+lo)/2;lo=m-.7;hi=m+.7}
    const pad=(hi-lo)*.12; lo-=pad; hi+=pad;
    const X=i=>pl+(W-pl-pr)*(series.length===1?.5:i/(series.length-1));
    const Y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));
    const pts=series.map((s,i)=>[X(i),Y(s.v)]);
    const d=smooth(pts);
    const area=`${d} L${pts[pts.length-1][0].toFixed(1)},${(H-pb).toFixed(1)} L${pts[0][0].toFixed(1)},${(H-pb).toFixed(1)} Z`;
    const ticks=4, grid=[];
    for(let i=0;i<=ticks;i++){
      const v=lo+(hi-lo)*i/ticks, y=Y(v);
      grid.push(`<line class="chart-grid" x1="${pl}" y1="${y.toFixed(1)}" x2="${W-pr}" y2="${y.toFixed(1)}"/>
        <text x="${pl-6}" y="${(y+3.4).toFixed(1)}" text-anchor="end" class="chart-lbl">${v.toFixed(1)}</text>`);
    }
    const gy=Y(goal);
    const showEvery=Math.ceil(series.length/5);
    const xl=series.map((s,i)=> (i%showEvery===0||i===series.length-1)
      ?`<text x="${X(i).toFixed(1)}" y="${H-6}" text-anchor="middle" class="chart-lbl">${s.d.slice(5).replace('-','/')}</text>`:'').join('');
    box.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="gradW" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity=".2"/>
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      ${grid.join('')}
      ${goal>=lo&&goal<=hi?`<line class="chart-goal" x1="${pl}" y1="${gy.toFixed(1)}" x2="${W-pr}" y2="${gy.toFixed(1)}"/>`:''}
      <path class="chart-area" d="${area}"/>
      <path class="chart-line" d="${d}"/>
      ${pts.map((p,i)=>`<circle class="chart-dot ${i===pts.length-1?'last':''}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i===pts.length-1?4.2:2.6}"/>`).join('')}
      ${xl}
    </svg>`;
  }

  // 列表
  const rev=[...ws].reverse().slice(0,30);
  $('#w-list').innerHTML = rev.length? rev.map((s,i)=>{
    const prev=rev[i+1];
    const dd=prev?+(s.v-prev.v).toFixed(1):null;
    const dir=dd===null?'':dd<0?'down':dd>0?'up':'minus';
    const col=dd===null?'var(--text-3)':dd<0?'var(--sage)':dd>0?'var(--clay)':'var(--text-3)';
    return `<div class="food">
      <div class="fi">${I.scale(17)}</div>
      <div style="flex:1"><b>${s.v.toFixed(1)} kg</b><span>${s.d}</span></div>
      <div class="fk" style="color:${col};display:flex;align-items:center;gap:3px">
        ${dd===null?'起点':`${I[dir](13)}${Math.abs(dd).toFixed(1)}`}</div>
      <button class="mini-btn" data-wdel="${s.d}" aria-label="删除">${I.trash(15)}</button>
    </div>`;
  }).join('') : `<div class="empty">${I.scale(32)}<p>还没有体重记录</p></div>`;
}
$$('[data-range]').forEach(b=>b.addEventListener('click',()=>{
  $$('[data-range]').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); wRange=+b.dataset.range; renderWeight();
}));
$('#w-list').addEventListener('click',e=>{
  const b=e.target.closest('[data-wdel]');
  if(b){ delete S.weights[b.dataset.wdel]; save(); renderWeight(); renderCal() }
});
$('#btn-weight-add').addEventListener('click',()=>openWeightSheet());
$('#btn-quick-weight').addEventListener('click',()=>openWeightSheet());

function openWeightSheet(){
  const k=TODAY_KEY();
  $('#sheet-body').innerHTML=`
    <h2>记录体重</h2>
    <p class="hint">空腹、同一时间称量，数字更有参考价值。</p>
    <div class="field"><label>日期</label><input class="inp" id="nw-d" type="date" value="${k}" max="${k}"></div>
    <div class="field"><label>体重 (kg)</label><input class="inp" id="nw-v" type="number" step="0.1" inputmode="decimal" value="${S.weights[k]||S.profile.weight||''}"></div>
    <button class="btn w" id="nw-ok">保存</button>`;
  openSheet();
  setTimeout(()=>$('#nw-v').focus(),420);
  $('#nw-ok').onclick=()=>{
    const d=$('#nw-d').value, v=parseFloat($('#nw-v').value);
    if(!d||isNaN(v)||v<20||v>300) return toast(null,'请检查输入','体重需在 20–300 kg 之间','close');
    S.weights[d]=+v.toFixed(1);
    if(d===k) S.profile.weight=+v.toFixed(1);
    if(!Object.keys(S.weights).length||d<=Object.keys(S.weights).sort()[0]) S.profile.startWeight=S.profile.startWeight||+v.toFixed(1);
    save(); closeSheet(); renderAll();
    toast(null,'已记录',`${d} · ${v.toFixed(1)} kg`,'scale');
  };
}