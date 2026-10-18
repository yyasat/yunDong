'use strict';
/* ============================================================
   主题 - 支持系统级昼夜主题自动切换
   ============================================================ */
const mq=window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(){
  const t=S.settings.theme || 'auto';
  const dark = t==='dark' || (t==='auto' && mq.matches);
  document.documentElement.dataset.theme = dark?'dark':'light';
  const mt=document.querySelector('meta[name=theme-color]');
  if(mt) mt.content = dark?'#13181e':'#eef1f5';
}

// 监听系统主题变化
mq.addEventListener('change',()=>{ 
  if(S.settings.theme==='auto') {
    applyTheme();
    toast(null, '主题已切换', mq.matches ? '已切换到夜间模式' : '已切换到日间模式', 'spark');
  }
});

// 主题切换按钮
$$('#seg-theme button').forEach(b=>{
  b.innerHTML = {
    auto: (I.spark?I.spark(14):'') + ' 自动',
    light: (I.sun?I.sun(14):'') + ' 日间',
    dark: (I.moon?I.moon(14):'') + ' 夜间'
  }[b.dataset.theme];
  
  b.addEventListener('click',()=>{
    S.settings.theme=b.dataset.theme; 
    save(); 
    applyTheme();
    $$('#seg-theme button').forEach(x=>x.classList.toggle('on',x===b));
  });
});