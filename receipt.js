'use strict';
/* ============================================================
   打卡小票系统
   ============================================================ */

// 励志语录库（支持自定义）
let MOTIVATIONAL_QUOTES = [
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

// 初始化自定义语录
function initCustomQuotes() {
  if (!S.customQuotes) {
    S.customQuotes = [...MOTIVATIONAL_QUOTES];
    save();
  }
}

// 获取随机语录
function getRandomQuote() {
  const quotes = S.customQuotes && S.customQuotes.length > 0 ? S.customQuotes : MOTIVATIONAL_QUOTES;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// 生成打卡小票
function generateReceipt(dateStr) {
  const day = S.days[dateStr];
  if (!day || !dayStat(dateStr).full) return null;
  
  // 随机励志语录
  const quote = getRandomQuote();
  
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

// 显示小票动画（重新设计精美版）
function showReceipt(receipt) {
  const overlay = document.createElement('div');
  overlay.className = 'receipt-overlay';
  overlay.innerHTML = `
    <div class="receipt-container">
      <div class="receipt-paper-v2">
        <!-- 装饰顶部 -->
        <div class="receipt-header-deco">
          <div class="deco-circle"></div>
          <div class="deco-line"></div>
          <div class="deco-circle"></div>
        </div>
        
        <!-- 上半部分：励志语录 -->
        <div class="receipt-top-v2">
          <div class="receipt-icon-large">${I.medal(48)}</div>
          <div class="receipt-title">打卡成功</div>
          <div class="receipt-date-badge">${receipt.date}</div>
          
          <div class="receipt-quote-box">
            <div class="quote-mark">"</div>
            <div class="receipt-quote-text">${esc(receipt.quote)}</div>
            <div class="quote-mark quote-mark-end">"</div>
          </div>
          
          <div class="receipt-stars-deco">
            <span>✦</span>
            <span>✦</span>
            <span>✦</span>
          </div>
        </div>
        
        <!-- 虚线分割 -->
        <div class="receipt-perforation-v2">
          <div class="perf-line"></div>
        </div>
        
        <!-- 下半部分：数据 -->
        <div class="receipt-bottom-v2">
          <div class="receipt-stats-grid">
            <div class="stat-item">
              <div class="stat-icon">${I.check(20)}</div>
              <div class="stat-value">${receipt.tasks}</div>
              <div class="stat-label">完成项目</div>
            </div>
            ${receipt.totalTime > 0 ? `
            <div class="stat-item">
              <div class="stat-icon">${I.clock(20)}</div>
              <div class="stat-value">${formatTime(receipt.totalTime)}</div>
              <div class="stat-label">锻炼耗时</div>
            </div>` : ''}
            <div class="stat-item highlight">
              <div class="stat-icon">${I.trend(20)}</div>
              <div class="stat-value">${receipt.weightLoss > 0 ? '-' : '+'}${Math.abs(receipt.weightLoss)}</div>
              <div class="stat-label">累计减重 (kg)</div>
            </div>
          </div>
          
          <div class="receipt-footer-v2">
            <div class="receipt-barcode">
              <div class="bar"></div>
              <div class="bar"></div>
              <div class="bar short"></div>
              <div class="bar"></div>
              <div class="bar short"></div>
              <div class="bar"></div>
              <div class="bar"></div>
              <div class="bar short"></div>
            </div>
            <div class="receipt-id">NO. ${receipt.id.toUpperCase()}</div>
          </div>
        </div>
        
        <!-- 底部装饰 -->
        <div class="receipt-bottom-deco"></div>
      </div>
      
      <div class="receipt-actions-v2">
        <button class="btn-receipt-action primary" id="receipt-tear">
          ${I.down(18)} <span>撕下保存</span>
        </button>
        <button class="btn-receipt-action secondary" id="receipt-close">
          ${I.close(18)} <span>关闭</span>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // 动画进入
  setTimeout(() => overlay.classList.add('show'), 50);
  
  // 撕下按钮
  $('#receipt-tear').onclick = () => {
    const paper = overlay.querySelector('.receipt-paper-v2');
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

// 打开语录管理
function openQuoteManager() {
  initCustomQuotes();
  
  const renderQuotes = () => {
    const quotes = S.customQuotes || [...MOTIVATIONAL_QUOTES];
    
    const html = quotes.map((q, i) => `
      <div class="quote-item">
        <div class="quote-text">"${esc(q)}"</div>
        <div class="quote-actions">
          <button class="mini-btn" data-edit="${i}">${I.edit(15)}</button>
          ${quotes.length > 1 ? `<button class="mini-btn" data-del="${i}">${I.trash(15)}</button>` : ''}
        </div>
      </div>
    `).join('');
    
    $('#sheet-body').innerHTML = `
      <h2>${I.spark(20)} 励志语录管理</h2>
      <p class="hint">自定义打卡小票上的励志语录，让每次完成都有专属的鼓励</p>
      
      <div class="quotes-container">
        ${html}
      </div>
      
      <button class="btn w soft" id="quote-add" style="margin-top:12px">${I.plus(16)} 添加新语录</button>
      <button class="btn w ghost" id="quote-reset" style="margin-top:8px">恢复默认语录</button>
      <button class="btn w ghost" id="quote-close" style="margin-top:8px">关闭</button>
    `;
    
    openSheet();
    
    // 编辑
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => {
        const i = parseInt(btn.dataset.edit);
        const newText = prompt('编辑语录：', S.customQuotes[i]);
        if (newText && newText.trim()) {
          S.customQuotes[i] = newText.trim();
          save();
          renderQuotes();
          toast(null, '已保存', '语录已更新', 'check');
        }
      };
    });
    
    // 删除
    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => {
        const i = parseInt(btn.dataset.del);
        if (confirm('确定删除这条语录？')) {
          S.customQuotes.splice(i, 1);
          save();
          renderQuotes();
          toast(null, '已删除', '语录已移除', 'check');
        }
      };
    });
    
    // 添加
    $('#quote-add').onclick = () => {
      const newText = prompt('输入新语录：');
      if (newText && newText.trim()) {
        S.customQuotes.push(newText.trim());
        save();
        renderQuotes();
        toast(null, '已添加', '新语录已保存', 'check');
      }
    };
    
    // 恢复默认
    $('#quote-reset').onclick = () => {
      if (confirm('确定恢复为默认语录？这将清空你的自定义语录。')) {
        S.customQuotes = [...MOTIVATIONAL_QUOTES];
        save();
        renderQuotes();
        toast(null, '已恢复', '默认语录已载入', 'check');
      }
    };
    
    $('#quote-close').onclick = closeSheet;
  };
  
  renderQuotes();
}

// 打开小票库
function openReceiptLibrary() {
  const receipts = Object.values(S.receipts).sort((a, b) => b.date.localeCompare(a.date));
  
  const html = receipts.length ? receipts.map(r => `
    <div class="receipt-card-v2" data-date="${r.date}">
      <div class="receipt-card-header">
        <div class="receipt-card-icon">${I.medal(28)}</div>
        <div class="receipt-card-date">${r.date}</div>
      </div>
      <div class="receipt-card-quote">"${esc(r.quote)}"</div>
      <div class="receipt-card-footer">
        <span class="receipt-card-stat">${I.check(14)} ${r.tasks}项</span>
        ${r.totalTime > 0 ? `<span class="receipt-card-stat">${I.clock(14)} ${formatTime(r.totalTime)}</span>` : ''}
        <span class="receipt-card-weight">${r.weightLoss > 0 ? '-' : '+'}${Math.abs(r.weightLoss)} kg</span>
      </div>
    </div>
  `).join('') : `<div class="empty">${I.medal(32)}<p>还没有收集到小票<br>完成打卡后自动获得</p></div>`;
  
  $('#sheet-body').innerHTML = `
    <div class="card-h">
      <h2>${I.medal(20)} 打卡小票库</h2>
      <button class="btn sm soft" id="manage-quotes">${I.spark(14)} 管理语录</button>
    </div>
    <p class="hint">每次完成全部任务后，都会获得一张纪念小票</p>
    <div class="receipt-library-v2">
      ${html}
    </div>
    <button class="btn w ghost" onclick="closeSheet()">关闭</button>
  `;
  
  openSheet();
  
  // 管理语录按钮
  $('#manage-quotes').onclick = () => {
    closeSheet();
    setTimeout(() => openQuoteManager(), 300);
  };
  
  // 点击小票查看详情
  document.querySelectorAll('.receipt-card-v2').forEach(card => {
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

// 初始化
setTimeout(() => {
  initCustomQuotes();
}, 500);

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
