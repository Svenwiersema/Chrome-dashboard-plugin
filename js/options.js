(function(){
  const radios=[...document.querySelectorAll('input[name="theme"]')];
  const status=document.getElementById('status');
  const logoInput=document.getElementById('logoInput');
  const logoPreview=document.getElementById('logoPreview');
  const chooseLogo=document.getElementById('chooseLogo');
  const removeLogo=document.getElementById('removeLogo');
  const LOGO_KEY='mijnDashboardLogoV1';

  function getLogo(){try{return localStorage.getItem(LOGO_KEY)||''}catch{return ''}}
  function showLogo(){
    const logo=getLogo();
    logoPreview.innerHTML='';
    if(logo){
      const img=document.createElement('img'); img.src=logo; img.alt='Eigen dashboard logo'; logoPreview.appendChild(img);
      removeLogo.disabled=false;
    }else{
      logoPreview.innerHTML='<div class="brand-mark"><span></span><span></span><span></span><span></span></div>';
      removeLogo.disabled=true;
    }
  }
  function logoMessage(message){status.textContent=message;clearTimeout(window.__logoStatusTimer);window.__logoStatusTimer=setTimeout(()=>status.textContent='',1800)}
  chooseLogo?.addEventListener('click',()=>logoInput?.click());
  logoInput?.addEventListener('change',()=>{
    const file=logoInput.files?.[0]; if(!file)return;
    if(file.size>1.5*1024*1024){logoMessage('Het logo is te groot (maximaal 1,5 MB).');logoInput.value='';return}
    const reader=new FileReader();
    reader.onload=()=>{try{localStorage.setItem(LOGO_KEY,reader.result);showLogo();window.dispatchEvent(new Event('dashboard-logo-change'));logoMessage('Logo opgeslagen.')}catch{logoMessage('Het logo kon niet worden opgeslagen.')}};
    reader.readAsDataURL(file);
  });
  removeLogo?.addEventListener('click',()=>{try{localStorage.removeItem(LOGO_KEY)}catch{}logoInput.value='';showLogo();window.dispatchEvent(new Event('dashboard-logo-change'));logoMessage('Standaardlogo hersteld.')});
  showLogo();
  const current=window.dashboardTheme?.get()||'light';
  const selected=radios.find(r=>r.value===current)||radios[0];
  if(selected) selected.checked=true;

  radios.forEach(radio=>radio.addEventListener('change',()=>{
    window.dashboardTheme?.set(radio.value);
    status.textContent='Instelling opgeslagen.';
    clearTimeout(window.__themeStatusTimer);
    window.__themeStatusTimer=setTimeout(()=>status.textContent='',1800);
  }));
})();
