(function(){
  const KEY='mijnDashboardTheme';
  function getTheme(){
    try{return localStorage.getItem(KEY)||'light'}catch{return 'light'}
  }
  function applyTheme(theme){
    const resolved=theme==='dark'?'dark':theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):'light';
    document.documentElement.dataset.theme=resolved;window.dispatchEvent(new CustomEvent('dashboard-theme-change',{detail:{theme:resolved}}));
  }
  function init(){
    const theme=getTheme();
    applyTheme(theme);
    if(theme==='system'){
      const media=matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener?.('change',()=>applyTheme('system'));
    }
  }
  window.dashboardTheme={get:getTheme,set:function(theme){try{localStorage.setItem(KEY,theme)}catch{}applyTheme(theme)}};
  init();
})();
