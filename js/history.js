'use strict';
/* ============================================================
   历史记录 - 饮水和餐饮
   ============================================================ */

// 打开饮水历史
function openWaterHistory() {
  const history = {};
  
  // 整理历史数据
  Object.entries(S.waterHistory || {}).forEach(([date, records]) => {
    history[date] = {
      total: records.reduce((sum, r) => sum + (r.amount || 0), 0),
      records: records
    };
  });
  
  const dates = Object.keys(history).sort().reverse().slice(0, 30);
  
  const html = dates.length ? dates.map(date => {
    const day = history[date];
    return `
      <div class="history-day">
        <div class="history-date">${date}</div>
        <div class="history-summary">
          <span class="history-total">${I.water(16)} ${day.total} ml</span>
          <button class="mini-btn" data-detail="${date}">${I.list(14)} 详情</button>
        </div>
      </div>
    `;
  }).join('') : '<div class="empty">${I.water(32)}<p>还没有饮水记录</p></div>';
  
  $('#sheet-body').innerHTML = `
    <h2>${I.water(20)} 饮水历史</h2>
    <div class="history-container">
      ${html}
    </div>
    <button class="btn w ghost" onclick="closeSheet()">关闭</button>
  `;
  
  openSheet();
  
  // 查看详情
  document.querySelectorAll('[data-detail]').forEach(btn => {
    btn.onclick = () => {
      const date = btn.dataset.detail;
      showWaterDayDetail(date);
    };
  });
}

// 显示某天饮水详情
function showWaterDayDetail(date) {
  const records = S.waterHistory?.[date] || [];
  
  const html = records.length ? records.map(r => `
    <div class="food">
      <div class="fi">${I.water(17)}</div>
      <div style="flex:1">
        <b>${r.amount} ml</b>
        <span>${new Date(r.time).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}</span>
      </div>
    </div>
  `).join('') : '<div class="empty">当天没有记录</div>';
  
  $('#sheet-body').innerHTML = `
    <h2>${I.water(20)} ${date} 饮水详情</h2>
    <div class="stat-row" style="margin-bottom:16px">
      <div class="stat">
        <b>${records.reduce((sum, r) => sum + r.amount, 0)}</b>
        <span>总量 (ml)</span>
      </div>
      <div class="stat">
        <b>${records.length}</b>
        <span>次数</span>
      </div>
    </div>
    <div class="card">
      ${html}
    </div>
    <button class="btn w ghost" onclick="closeSheet();setTimeout(openWaterHistory,300)">返回</button>
  `;
  
  openSheet();
}

// 打开餐饮历史
function openMealHistory() {
  const history = {};
  
  // 整理历史数据
  Object.entries(S.mealHistory || {}).forEach(([date, records]) => {
    history[date] = {
      total: records.reduce((sum, r) => sum + (r.kcal || 0), 0),
      count: records.length,
      records: records
    };
  });
  
  const dates = Object.keys(history).sort().reverse().slice(0, 30);
  
  const html = dates.length ? dates.map(date => {
    const day = history[date];
    return `
      <div class="history-day">
        <div class="history-date">${date}</div>
        <div class="history-summary">
          <span class="history-total">${I.food(16)} ${day.total} kcal · ${day.count} 项</span>
          <button class="mini-btn" data-detail="${date}">${I.list(14)} 详情</button>
        </div>
      </div>
    `;
  }).join('') : '<div class="empty">${I.food(32)}<p>还没有餐饮记录</p></div>';
  
  $('#sheet-body').innerHTML = `
    <h2>${I.food(20)} 餐饮历史</h2>
    <div class="history-container">
      ${html}
    </div>
    <button class="btn w ghost" onclick="closeSheet()">关闭</button>
  `;
  
  openSheet();
  
  // 查看详情
  document.querySelectorAll('[data-detail]').forEach(btn => {
    btn.onclick = () => {
      const date = btn.dataset.detail;
      showMealDayDetail(date);
    };
  });
}

// 显示某天餐饮详情
function showMealDayDetail(date) {
  const records = S.mealHistory?.[date] || [];
  
  const slotNames = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐'
  };
  
  const html = records.length ? records.map(r => `
    <div class="food">
      <div class="fi">${I.food(17)}</div>
      <div style="flex:1">
        <b>${esc(r.name)}</b>
        <span>${slotNames[r.slot] || r.slot} · ${new Date(r.time).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}</span>
      </div>
      <div class="fk">${r.kcal} kcal</div>
    </div>
  `).join('') : '<div class="empty">当天没有记录</div>';
  
  const total = records.reduce((sum, r) => sum + (r.kcal || 0), 0);
  const limit = S.settings.kcal || 1500;
  
  $('#sheet-body').innerHTML = `
    <h2>${I.food(20)} ${date} 餐饮详情</h2>
    <div class="stat-row" style="margin-bottom:16px">
      <div class="stat">
        <b>${total}</b>
        <span>总热量 (kcal)</span>
      </div>
      <div class="stat">
        <b>${records.length}</b>
        <span>食物数</span>
      </div>
      <div class="stat ${total > limit ? 'up' : 'down'}">
        <b>${total > limit ? '+' : ''}${total - limit}</b>
        <span>相比目标</span>
      </div>
    </div>
    <div class="card">
      ${html}
    </div>
    <button class="btn w ghost" onclick="closeSheet();setTimeout(openMealHistory,300)">返回</button>
  `;
  
  openSheet();
}

// 添加饮水记录到历史
function addWaterToHistory(date, amount) {
  if (!S.waterHistory) S.waterHistory = {};
  if (!S.waterHistory[date]) S.waterHistory[date] = [];
  
  S.waterHistory[date].push({
    time: new Date().toISOString(),
    amount: amount
  });
  
  save();
}

// 添加餐饮记录到历史
function addMealToHistory(date, slot, name, kcal) {
  if (!S.mealHistory) S.mealHistory = {};
  if (!S.mealHistory[date]) S.mealHistory[date] = [];
  
  S.mealHistory[date].push({
    time: new Date().toISOString(),
    slot: slot,
    name: name,
    kcal: kcal
  });
  
  save();
}
