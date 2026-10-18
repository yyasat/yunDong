'use strict';
/* ============================================================
   打卡小票系统
   ============================================================ */

// 励志语录库
const MOTIVATIONAL_QUOTES = [
  '每一次汗水，都在重塑更好的自己',
  '坚持的意义，在于看见改变的那一刻',
  '今天的努力，是明天的底气',
  '不是因为有希望才坚持，而是坚持了才有希望',
  '你的身体会记住每一次付出',
  '每个动作都算数，每一天都重要',
  '瘦不是目标，健康才是答案',
  '比昨天强一点，就够了',
  '放弃很容易，但你选择了坚持',
  '别小看今天的自己，你已经很棒了',
  '改变，从不嫌晚',
  '汗水不会骗人，镜子也不会',
  '你值得一个更轻盈的自己',
  '每一次打卡，都是对未来的投资',
  '身体的改变，从心态开始',
  '不要和别人比，只需超越昨天的自己',
  '坚持到底的人，从来不会后悔',
  '运动的快乐，藏在坚持之后',
  '你的努力，终将美好',
  '今天又赢了一次'
];

// 生成打卡小票
function generateReceipt(dateStr) {
  const day = S.days[dateStr];
  if (!day || !dayStat(dateStr).full) return null;
  
  // 随机励志语录
  const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  
  // 计算累计减重
  const ws = weightSeries();
  const start = S.profile.startWeight || (ws[0]?.v || S.profile.weight);
  const current = ws.length ? ws[ws.length - 1].v : S.profile.weight;
  const weightLoss = (start - current).toFixed(1);
  
  const receipt = {
    id: uid(),
    date: dateStr,
    quote: quote,
    weightLoss: weightLoss,
    tasks: day.tasks.length,
    totalTime: day.totalTime || 0,
    timestamp: new Date().toISOString()
  };
  
  // 保存小票
  S.receipts[dateStr] = receipt;
  save();
  
  return receipt;
}

// 显示小票动画
function showReceipt(receipt) {
  const overlay = document.createElement('div');
  overlay.className = 'receipt-overlay';
  overlay.innerHTML = `
    <div class="receipt-container">
      <div class="receipt-paper">
        <!-- 上半部分：励志语录 -->
        <div class="receipt-top">
          <div class="receipt-header">
            <div class="receipt-icon">${I.medal(32)}</div>
            <h3>打卡成功</h3>
          </div>
          <div class="receipt-quote">${esc(receipt.quote)}</div>
          <div class="receipt-stars">✦ ✦ ✦</div>
        </div>
        
        <!-- 虚线 -->
        <div class="receipt-perforation"></div>
        
        <!-- 下半部分：数据 -->
        <div class="receipt-bottom">
          <div class="receipt-date">${receipt.date}</div>
          <div class="receipt-data">
            <div class="receipt-row">
              <span>完成项目</span>
              <span><b>${receipt.tasks}</b> 项</span>
            </div>
            ${receipt.totalTime > 0 ? `
            <div class="receipt-row">
              <span>锻炼耗时</span>
              <span><b>${formatTime(receipt.totalTime)}</b></span>
            </div>` : ''}
            <div class="receipt-row highlight">
              <span>累计减重</span>
              <span><b>${receipt.weightLoss > 0 ? '-' : '+'}${Math.abs(receipt.weightLoss)}</b> kg</span>
            </div>
          </div>
          <div class="receipt-footer">
            <div class="receipt-barcode">|||  ||  |  |||  ||  |||  |  ||</div>
            <div class="receipt-id">NO.${receipt.id.toUpperCase()}</div>
          </div>
        </div>
      </div>
      
      <div class="receipt-actions">
        <button class="btn soft" id="receipt-tear">${I.down(16)} 撕下保存</button>
        <button class="btn ghost" id="receipt-close">${I.close(16)} 关闭</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // 动画进入
  setTimeout(() => overlay.classList.add('show'), 50);
  
  // 撕下按钮
  $('#receipt-tear').onclick = () => {
    const paper = overlay.querySelector('.receipt-paper');
    paper.classList.add('torn');
    
    setTimeout(() => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
      toast(null, '已保存', '小票已收入小票库', 'check');
    }, 800);
  };
  
  // 关闭按钮
  $('#receipt-close').onclick = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
  };
}

// 打开小票库
function openReceiptLibrary() {
  const receipts = Object.values(S.receipts).sort((a, b) => b.date.localeCompare(a.date));
  
  const html = receipts.length ? receipts.map(r => `
    <div class="receipt-card" data-date="${r.date}">
      <div class="receipt-card-top">
        <div class="receipt-card-icon">${I.medal(24)}</div>
        <div class="receipt-card-quote">${esc(r.quote)}</div>
      </div>
      <div class="receipt-card-meta">
        <span>${r.date}</span>
        <span class="receipt-card-weight">${r.weightLoss > 0 ? '-' : '+'}${Math.abs(r.weightLoss)} kg</span>
      </div>
    </div>
  `).join('') : '<div class="empty">${I.medal(32)}<p>还没有收集到小票<br>完成打卡后自动获得</p></div>';
  
  $('#sheet-body').innerHTML = `
    <h2>${I.medal(20)} 打卡小票库</h2>
    <p class="hint">每次完成全部任务后，都会获得一张纪念小票</p>
    <div class="receipt-library">
      ${html}
    </div>
    <button class="btn w ghost" onclick="closeSheet()">关闭</button>
  `;
  
  openSheet();
  
  // 点击小票查看详情
  document.querySelectorAll('.receipt-card').forEach(card => {
    card.onclick = () => {
      const date = card.dataset.date;
      const receipt = S.receipts[date];
      if (receipt) {
        closeSheet();
        setTimeout(() => showReceipt(receipt), 300);
      }
    };
  });
}

// 在完成所有任务时触发
function onAllDoneWithReceipt() {
  const dateStr = TODAY_KEY();
  
  // 检查是否已经生成过小票
  if (S.receipts[dateStr]) {
    showReceipt(S.receipts[dateStr]);
    return;
  }
  
  // 生成新小票
  const receipt = generateReceipt(dateStr);
  if (receipt) {
    setTimeout(() => showReceipt(receipt), 800);
  }
}
