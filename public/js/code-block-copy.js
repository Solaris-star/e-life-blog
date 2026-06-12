document.querySelectorAll('.code-block-wrapper').forEach(function(w){
  var btn=document.createElement('button');
  btn.className='copy-btn';
  btn.type='button';
  btn.setAttribute('aria-label','复制代码');
  btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  btn.addEventListener('click',function(){
    var pre=w.querySelector('pre');
    if(!pre)return;
    var text=pre.textContent||'';
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){
        btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        btn.classList.add('copied');
        setTimeout(function(){btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';btn.classList.remove('copied');},1500);
      }).catch(function(){fallbackCopy(text,btn);});
    }else{fallbackCopy(text,btn);}
  });
  w.insertBefore(btn,w.firstChild);
});
function fallbackCopy(text,btn){
  var ta=document.createElement('textarea');
  ta.value=text;
  ta.style.position='fixed';ta.style.left='-9999px';
  document.body.appendChild(ta);
  ta.select();
  try{document.execCommand('copy');
    btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    btn.classList.add('copied');
    setTimeout(function(){btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';btn.classList.remove('copied');},1500);
  }catch{btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5252" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';}
  document.body.removeChild(ta);
}
