'use strict';
/* ============================================================
   视频播放器
   ============================================================ */

// 支持的平台及其 URL 模式
const VIDEO_PLATFORMS = {
  xiaohongshu: {
    name: '小红书',
    patterns: [/xiaohongshu\.com/, /xhslink\.com/],
    icon: '🔴'
  },
  douyin: {
    name: '抖音',
    patterns: [/douyin\.com/, /iesdouyin\.com/],
    icon: '🎵'
  },
  kuaishou: {
    name: '快手',
    patterns: [/kuaishou\.com/, /ksurl\.cn/],
    icon: '⚡'
  },
  bilibili: {
    name: 'B站',
    patterns: [/bilibili\.com/, /b23\.tv/],
    icon: '📺'
  },
  youtube: {
    name: 'YouTube',
    patterns: [/youtube\.com/, /youtu\.be/],
    icon: '▶️'
  }
};

// 识别平台
function detectPlatform(url) {
  for (const [key, platform] of Object.entries(VIDEO_PLATFORMS)) {
    if (platform.patterns.some(pattern => pattern.test(url))) {
      return { key, ...platform };
    }
  }
  return { key: 'other', name: '其他', icon: '🎬' };
}

// 添加视频
function addVideo(url, title = '') {
  if (!url) return;
  
  const platform = detectPlatform(url);
  const video = {
    id: uid(),
    url: url,
    platform: platform.key,
    platformName: platform.name,
    platformIcon: platform.icon,
    title: title || '未命名视频',
    date: TODAY_KEY(),
    addedAt: new Date().toISOString()
  };
  
  S.videos.push(video);
  save();
  
  return video;
}

// 删除视频
function deleteVideo(videoId) {
  S.videos = S.videos.filter(v => v.id !== videoId);
  save();
}

// 打开视频添加表单
function openAddVideoSheet() {
  $('#sheet-body').innerHTML = `
    <h2>${I.spark(20)} 添加视频链接</h2>
    <p class="hint">支持小红书、抖音、快手、B站等平台</p>
    
    <div class="field">
      <label>视频链接</label>
      <input class="inp" id="vid-url" placeholder="粘贴视频分享链接">
    </div>
    
    <div class="field">
      <label>标题（可选）</label>
      <input class="inp" id="vid-title" placeholder="给视频起个名字">
    </div>
    
    <div class="platform-hints">
      ${Object.values(VIDEO_PLATFORMS).map(p => 
        `<span class="chip">${p.icon} ${p.name}</span>`
      ).join('')}
    </div>
    
    <button class="btn w" id="vid-add">添加</button>
  `;
  
  openSheet();
  
  $('#vid-add').onclick = () => {
    const url = $('#vid-url').value.trim();
    const title = $('#vid-title').value.trim();
    
    if (!url) {
      toast(null, '请输入链接', '视频链接不能为空', 'close');
      return;
    }
    
    const video = addVideo(url, title);
    closeSheet();
    renderVideoList();
    toast(null, '已添加', `${video.platformIcon} ${video.platformName} 视频`, 'check');
  };
}

// 播放视频
function playVideo(video) {
  $('#sheet-body').innerHTML = `
    <div class="video-player-header">
      <h2>${video.platformIcon} ${esc(video.title)}</h2>
      <span class="tag">${video.platformName}</span>
    </div>
    
    <div class="video-player-container">
      <div class="video-embed-placeholder">
        <div class="video-platform-icon">${video.platformIcon}</div>
        <p>由于平台限制，请点击下方按钮<br>在新标签页打开视频</p>
        <a href="${esc(video.url)}" target="_blank" class="btn">${I.right(16)} 打开视频</a>
      </div>
    </div>
    
    <div class="video-info">
      <div class="video-info-row">
        <span class="video-info-label">添加时间</span>
        <span>${new Date(video.addedAt).toLocaleString('zh-CN')}</span>
      </div>
      <div class="video-info-row">
        <span class="video-info-label">链接</span>
        <span class="video-url">${esc(video.url)}</span>
      </div>
    </div>
    
    <div class="row2">
      <button class="btn ghost" onclick="closeSheet()">关闭</button>
      <button class="btn soft" id="vid-del-${video.id}" style="color:var(--clay)">删除</button>
    </div>
  `;
  
  openSheet();
  
  $(`#vid-del-${video.id}`).onclick = () => {
    if (confirm('确定删除这个视频链接？')) {
      deleteVideo(video.id);
      closeSheet();
      renderVideoList();
      toast(null, '已删除', '视频已移除', 'check');
    }
  };
}

// 渲染视频列表
function renderVideoList() {
  const container = $('#video-list-container');
  if (!container) return;
  
  const videos = [...S.videos].reverse(); // 最新的在前
  
  if (videos.length === 0) {
    container.innerHTML = `
      <div class="card empty">
        ${I.spark(34)}
        <p>还没有添加视频<br>点击上方按钮添加教学视频</p>
      </div>
    `;
    return;
  }
  
  const html = videos.map(v => `
    <div class="video-card" data-id="${v.id}">
      <div class="video-card-icon">${v.platformIcon}</div>
      <div class="video-card-content">
        <div class="video-card-title">${esc(v.title)}</div>
        <div class="video-card-meta">
          <span class="tag">${v.platformName}</span>
          <span>${v.date}</span>
        </div>
      </div>
      <button class="icon-btn" data-play="${v.id}">${I.right(18)}</button>
    </div>
  `).join('');
  
  container.innerHTML = `<div class="card">${html}</div>`;
  
  // 绑定播放事件
  document.querySelectorAll('[data-play]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const video = S.videos.find(v => v.id === btn.dataset.play);
      if (video) playVideo(video);
    };
  });
  
  // 点击卡片也能播放
  document.querySelectorAll('.video-card').forEach(card => {
    card.onclick = () => {
      const video = S.videos.find(v => v.id === card.dataset.id);
      if (video) playVideo(video);
    };
  });
}

// 创建视频页面（在"我的"页面添加入口）
function createVideoSection() {
  const section = `
    <div class="sec-title">教学视频</div>
    <div class="card">
      <div class="setting-row" style="flex-direction:column;align-items:stretch;gap:12px">
        <div>
          <div class="sl">视频库</div>
          <div class="ss">保存跳绳、燃脂操等教学视频</div>
        </div>
        <button class="btn w ghost" id="btn-manage-videos">${I.spark(16)} 管理视频 (${S.videos.length})</button>
      </div>
    </div>
  `;
  
  return section;
}

// 打开视频管理页面
function openVideoManager() {
  $('#sheet-body').innerHTML = `
    <div class="card-h">
      <h2>${I.spark(20)} 视频管理</h2>
      <button class="btn sm" id="btn-add-video">${I.plus(14)} 添加</button>
    </div>
    <div id="video-list-container"></div>
  `;
  
  openSheet();
  renderVideoList();
  
  $('#btn-add-video').onclick = () => {
    closeSheet();
    setTimeout(() => openAddVideoSheet(), 300);
  };
}
