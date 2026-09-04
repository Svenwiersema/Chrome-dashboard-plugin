(()=>{
const p=document.getElementById('purchase'),m=document.getElementById('markup'),v=document.getElementById('vat'),t=document.getElementById('total');
const cp=document.getElementById('calcPurchase'),cm=document.getElementById('calcMarkup'),cs=document.getElementById('calcSubtotal'),cv=document.getElementById('calcVat'),ct=document.getElementById('calcTotal'),vl=document.getElementById('vatLine'),cl=document.getElementById('calcMarkupLabel');
const money=n=>n.toLocaleString('nl-NL',{style:'currency',currency:'EUR'});
function calc(){
  const a=Number(p.value)||0,s=Number(m.value)||0;
  const markup=a*s/100;
  const subtotal=a+markup;
  const vat= v.checked ? subtotal*0.21 : 0;
  const total=subtotal+vat;
  t.textContent=money(total);
  if(cp) cp.textContent=money(a);
  if(cm) cm.textContent=money(markup);
  if(cs) cs.textContent=money(subtotal);
  if(cv) cv.textContent=money(vat);
  if(ct) ct.textContent=money(total);
  if(vl) vl.hidden=!v.checked;
  if(cl) cl.textContent=`+ Opslag (${s.toLocaleString('nl-NL',{maximumFractionDigits:1})}%)`;
}
['input','change'].forEach(e=>{p.addEventListener(e,calc);m.addEventListener(e,calc);v.addEventListener(e,calc)});
calc();
})();
