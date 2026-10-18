'use strict';
/* ============================================================
   计时系统
   ============================================================ */

// 总计时器状态
let totalTimer = {
  running: false,
  startTime: null,
  elapsed: 0,
  interval: null
};

// 各动作计时器
let exerciseTimers = {}; // {taskId: {running, startTime, elapsed, interval, mode: 'countdown'|'stopwatch', duration}}

// 格式化时间显示
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// 启动总计时
function startTotalTimer() {
  if (totalTimer.running) return;
  
  const day = ensureToday();
  totalTimer.running = true;
  totalTimer.startTime = Date.now() - (totalTimer.elapsed * 1000);
  
  if (!day.startTime) {
    day.startTime = new Date().toISOString();
    save();
  }
  
  totalTimer.interval = setInterval(() => {
    totalTimer.elapsed = Math.floor((Date.now() - totalTimer.startTime) / 1000);
    updateTotalTimerDisplay();
  }, 1000);
  
  updateTotalTimerDisplay();
  toast(null, '总计时开始', '开始记录锻炼时长', 'clock');
}

// 停止总计时
function stopTotalTimer() {
  if (!totalTimer.running) return;
  
  totalTimer.running = false;
  clearInterval(totalTimer.interval);
  
  const day = ensureToday();
  day.totalTime = totalTimer.elapsed;
  day.endTime = new Date().toISOString();
  save();
  
  updateTotalTimerDisplay();
  toast(null, '总计时停止', `总耗时 ${formatTime(totalTimer.elapsed)}`, 'clock');
}

// 更新总计时显示
function updateTotalTimerDisplay() {
  const display = $('#total-timer-display');
  if (display) {
    display.textContent = formatTime(totalTimer.elapsed);
    display.classList.toggle('running', totalTimer.running);
  }
}

// 启动动作计时
function startExerciseTimer(taskId, mode = 'stopwatch', duration = 0) {
  if (exerciseTimers[taskId]?.running) return;
  
  exerciseTimers[taskId] = {
    running: true,
    mode: mode,
    duration: duration,
    startTime: Date.now(),
    elapsed: 0,
    interval: setInterval(() => updateExerciseTimer(taskId), 1000)
  };
  
  updateExerciseTimerDisplay(taskId);
}

// 停止动作计时
function stopExerciseTimer(taskId) {
  const timer = exerciseTimers[taskId];
  if (!timer || !timer.running) return;
  
  timer.running = false;
  clearInterval(timer.interval);
  
  // 保存到任务
  const day = ensureToday();
  const task = day.tasks.find(t => t.id === taskId);
  if (task) {
    task.timeSpent = timer.elapsed;
    save();
  }
  
  updateExerciseTimerDisplay(taskId);
  toast(null, '计时停止', `耗时 ${formatTime(timer.elapsed)}`, 'clock');
}

// 更新动作计时
function updateExerciseTimer(taskId) {
  const timer = exerciseTimers[taskId];
  if (!timer) return;
  
  timer.elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
  
  // 倒计时模式
  if (timer.mode === 'countdown' && timer.elapsed >= timer.duration) {
    stopExerciseTimer(taskId);
    playTimerSound();
    toast(null, '计时完成', '这组动作时间到了', 'check');
  }
  
  updateExerciseTimerDisplay(taskId);
}

// 更新动作计时显示
function updateExerciseTimerDisplay(taskId) {
  const display = $(`#timer-${taskId}`);
  if (!display) return;
  
  const timer = exerciseTimers[taskId];
  if (!timer) return;
  
  if (timer.mode === 'countdown') {
    const remaining = Math.max(0, timer.duration - timer.elapsed);
    display.textContent = formatTime(remaining);
  } else {
    display.textContent = formatTime(timer.elapsed);
  }
  
  display.classList.toggle('running', timer.running);
}

// 播放提示音
function playTimerSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    // 静默失败
  }
}

// 渲染总计时器控制
function renderTotalTimerControl() {
  const existing = $('#total-timer-control');
  if (existing) existing.remove();
  
  const day = ensureToday();
  if (day.totalTime) {
    totalTimer.elapsed = day.totalTime;
  }
  
  const control = document.createElement('div');
  control.id = 'total-timer-control';
  control.className = 'timer-control';
  control.innerHTML = `
    <div class="timer-label">总耗时</div>
    <div class="timer-display" id="total-timer-display">${formatTime(totalTimer.elapsed)}</div>
    <button class="btn sm" id="total-timer-btn">${totalTimer.running ? I.minus(14) + ' 停止' : I.clock(14) + ' 开始'}</button>
  `;
  
  const taskList = $('#task-list');
  if (taskList) {
    taskList.parentNode.insertBefore(control, taskList);
  }
  
  $('#total-timer-btn').onclick = () => {
    if (totalTimer.running) {
      stopTotalTimer();
    } else {
      startTotalTimer();
    }
    renderTotalTimerControl();
  };
}

// 渲染动作计时器
function renderExerciseTimerInTask(taskId, taskElement) {
  const day = ensureToday();
  const task = day.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  const existingTimer = taskElement.querySelector('.exercise-timer');
  if (existingTimer) existingTimer.remove();
  
  const timerDiv = document.createElement('div');
  timerDiv.className = 'exercise-timer';
  
  const timer = exerciseTimers[taskId];
  const elapsed = timer?.elapsed || task.timeSpent || 0;
  
  timerDiv.innerHTML = `
    <div class="timer-display small" id="timer-${taskId}">${formatTime(elapsed)}</div>
    <div class="timer-controls">
      <button class="mini-btn" data-timer-start="${taskId}" title="正计时">${I.clock(14)}</button>
      <button class="mini-btn" data-timer-countdown="${taskId}" title="倒计时">${I.down(14)}</button>
      <button class="mini-btn" data-timer-stop="${taskId}" title="停止">${I.minus(14)}</button>
    </div>
  `;
  
  taskElement.querySelector('.t-body').appendChild(timerDiv);
  
  // 绑定事件
  timerDiv.querySelector(`[data-timer-start="${taskId}"]`).onclick = (e) => {
    e.stopPropagation();
    startExerciseTimer(taskId, 'stopwatch');
  };
  
  timerDiv.querySelector(`[data-timer-countdown="${taskId}"]`).onclick = (e) => {
    e.stopPropagation();
    const duration = parseInt(prompt('倒计时时长（秒）：', task.dur * 60)) || task.dur * 60;
    startExerciseTimer(taskId, 'countdown', duration);
  };
  
  timerDiv.querySelector(`[data-timer-stop="${taskId}"]`).onclick = (e) => {
    e.stopPropagation();
    stopExerciseTimer(taskId);
  };
}

// 计算总耗时（如果没有开启②）
function calculateTotalFromExercises() {
  const day = ensureToday();
  if (day.totalTime > 0) return; // 已有总计时
  
  const total = day.tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
  if (total > 0) {
    day.totalTime = total;
    save();
  }
}

// 在日历中显示时间详情
function showTimeDetails(dateStr) {
  const day = S.days[dateStr];
  if (!day) return;
  
  const total = day.totalTime || 0;
  const details = day.tasks
    .filter(t => t.timeSpent > 0)
    .map(t => `<div class="food"><div class="fi">${I[ICON_MAP[t.type] || 'spark'](17)}</div><div style="flex:1"><b>${esc(t.name)}</b></div><div class="fk">${formatTime(t.timeSpent)}</div></div>`)
    .join('');
  
  $('#sheet-body').innerHTML = `
    <h2>${I.clock(20)} ${dateStr} 锻炼耗时</h2>
    <div class="stat-row" style="margin-bottom:16px">
      <div class="stat"><b>${formatTime(total)}</b><span>共耗时</span></div>
      <div class="stat"><b>${day.startTime ? new Date(day.startTime).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}) : '—'}</b><span>开始</span></div>
      <div class="stat"><b>${day.endTime ? new Date(day.endTime).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}) : '—'}</b><span>结束</span></div>
    </div>
    ${details ? '<div class="card">' + details + '</div>' : '<div class="empty">没有详细记录</div>'}
    <button class="btn w ghost" onclick="closeSheet()">关闭</button>
  `;
  
  openSheet();
}

// 后台保活（使用 Service Worker）
function setupBackgroundKeepAlive() {
  if ('serviceWorker' in navigator) {
    // 注册 Service Worker 用于后台保活
    // 由于这需要单独的 sw.js 文件，这里只做标记
    console.log('Timer system: Background keep-alive ready');
  }
  
  // 页面可见性变化时保存状态
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 页面隐藏时保存当前状态
      if (totalTimer.running) {
        const day = ensureToday();
        day.totalTime = totalTimer.elapsed;
        save();
      }
    } else {
      // 页面恢复时恢复计时器
      const day = ensureToday();
      if (day.startTime && !day.endTime) {
        const elapsed = Math.floor((Date.now() - new Date(day.startTime).getTime()) / 1000);
        totalTimer.elapsed = elapsed;
        if (!totalTimer.running) {
          // 自动恢复计时
          startTotalTimer();
        }
      }
    }
  });
}

// 初始化
setTimeout(() => {
  setupBackgroundKeepAlive();
  
  // 恢复未完成的计时
  const day = ensureToday();
  if (day.startTime && !day.endTime) {
    const elapsed = Math.floor((Date.now() - new Date(day.startTime).getTime()) / 1000);
    totalTimer.elapsed = elapsed;
  }
}, 1000);
