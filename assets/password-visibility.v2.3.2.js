(()=>{
  'use strict';

  const ROOT_ID='adminModal';
  const ENHANCED='nisPasswordVisibilityReady';

  function enhanceInput(input){
    if(!(input instanceof HTMLInputElement) || input.type!=='password' || input.dataset[ENHANCED]==='1')return;
    input.dataset[ENHANCED]='1';

    const wrap=document.createElement('span');
    wrap.className='nis-password-wrap';
    input.parentNode.insertBefore(wrap,input);
    wrap.appendChild(input);

    const button=document.createElement('button');
    button.type='button';
    button.className='nis-password-toggle';
    button.textContent='Show';
    button.setAttribute('aria-label','Show password');
    button.setAttribute('aria-pressed','false');
    wrap.appendChild(button);

    button.addEventListener('click',()=>{
      const showing=input.type==='text';
      input.type=showing?'password':'text';
      button.textContent=showing?'Show':'Hide';
      button.setAttribute('aria-label',showing?'Show password':'Hide password');
      button.setAttribute('aria-pressed',String(!showing));
      input.focus({preventScroll:true});
      try{input.setSelectionRange(input.value.length,input.value.length)}catch{}
    });
  }

  function scan(node){
    if(!(node instanceof Element))return;
    if(node.matches('input[type="password"]'))enhanceInput(node);
    node.querySelectorAll('input[type="password"]').forEach(enhanceInput);
  }

  function init(){
    const root=document.getElementById(ROOT_ID);
    if(!root || root.dataset.nisPasswordObserver==='1')return;
    root.dataset.nisPasswordObserver='1';
    scan(root);

    const observer=new MutationObserver((mutations)=>{
      for(const mutation of mutations){
        for(const added of mutation.addedNodes){
          if(added instanceof Element)scan(added);
        }
      }
    });
    observer.observe(root,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',init);
})();