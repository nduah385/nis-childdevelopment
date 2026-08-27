/* NIS Child Development Centre — professional Ways to Give panel v2.3.5 */
(function(){
  'use strict';

  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function clean(v){return String(v||'').replace(/\u00a0/g,' ').trim()}

  function bankIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h18M5 9v8M9 9v8M15 9v8M19 9v8M3 19h18M12 3l9 4H3l9-4Z"/></svg>';
  }

  function phoneIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.2"/><path d="M10 5h4M10.5 18.5h3"/></svg>';
  }

  function copyIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="10" height="10" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
  }

  function checkIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  }

  function parseInstructions(raw){
    var lines=String(raw||'').split(/\r?\n/).map(clean).filter(Boolean);
    var bank={},momo={},section='';

    lines.forEach(function(line){
      var lower=line.toLowerCase();
      if(lower.indexOf('bank transfer')!==-1){section='bank';return}
      if(lower.indexOf('mobile transfer')!==-1||lower.indexOf('mobile money')!==-1||lower.indexOf('momo')!==-1&&line.indexOf(':')===-1){section='momo';return}

      var match=line.match(/^([^:]+):\s*(.+)$/);
      if(!match)return;
      var label=clean(match[1]),value=clean(match[2]);
      if(!label||!value)return;

      if(section==='bank'){
        if(/^bank$/i.test(label))bank.bank=value;
        else if(/account\s*name/i.test(label))bank.accountName=value;
        else if(/account\s*(number|no\.?)/i.test(label))bank.accountNumber=value;
      }else if(section==='momo'){
        if(/mtn|momo|mobile/i.test(label)){momo.number=value;momo.network=/mtn/i.test(label)?'MTN Mobile Money':label}
        else if(/account\s*name/i.test(label))momo.accountName=value;
        else if(/network/i.test(label))momo.network=value;
      }
    });

    return {
      bank:(bank.bank||bank.accountName||bank.accountNumber)?bank:null,
      momo:(momo.number||momo.accountName||momo.network)?momo:null
    };
  }

  function detail(label,value,numberCopy){
    if(!value)return'';
    if(numberCopy){
      return '<div class="nis-give-detail"><span class="nis-give-label">'+esc(label)+'</span><div class="nis-give-copy-row"><span class="nis-give-number">'+esc(value)+'</span><button type="button" class="nis-give-copy" data-copy="'+esc(value)+'" aria-label="Copy '+esc(label)+'">'+copyIcon()+'<span>Copy</span></button></div></div>';
    }
    return '<div class="nis-give-detail"><span class="nis-give-label">'+esc(label)+'</span><span class="nis-give-value">'+esc(value)+'</span></div>';
  }

  function bankCard(bank){
    if(!bank)return'';
    return '<section class="nis-give-card" aria-label="Bank transfer details">'+
      '<div class="nis-give-card-head"><div class="nis-give-icon nis-give-icon-bank">'+bankIcon()+'</div><div class="nis-give-card-title"><h4>Bank Transfer</h4><span>Direct bank payment details</span></div></div>'+
      detail('Bank',bank.bank,false)+
      detail('Account Name',bank.accountName,false)+
      detail('Account Number',bank.accountNumber,true)+
    '</section>';
  }

  function momoCard(momo){
    if(!momo)return'';
    return '<section class="nis-give-card" aria-label="Mobile money details">'+
      '<div class="nis-give-card-head"><div class="nis-give-icon nis-give-icon-momo">'+phoneIcon()+'</div><div class="nis-give-card-title"><h4>Mobile Money</h4><span>Fast and convenient mobile giving</span></div></div>'+
      detail('Network',momo.network||'MTN Mobile Money',false)+
      detail('MoMo Number',momo.number,true)+
      detail('Account Name',momo.accountName,false)+
    '</section>';
  }

  function upgrade(){
    var panel=document.getElementById('publicDonationInstructions');
    var source=document.getElementById('publicDonationInstructionsText');
    if(!panel||!source||panel.dataset.nisGiving==='v2.3.5')return !!panel;

    var raw=clean(source.textContent);
    if(!raw)return false;
    var data=parseInstructions(raw);
    if(!data.bank&&!data.momo)return false;

    panel.classList.add('nis-give-panel');
    panel.dataset.nisGiving='v2.3.5';
    panel.innerHTML=
      '<div class="nis-give-heading">'+
        '<span class="nis-give-kicker">'+checkIcon()+' How to Give</span>'+
        '<h3>Ways to Give</h3>'+
        '<p>Choose the payment option that is most convenient for you. Your support helps us continue investing in children and communities.</p>'+
      '</div>'+
      '<div class="nis-give-grid">'+bankCard(data.bank)+momoCard(data.momo)+'</div>'+
      '<div class="nis-give-note"><span class="nis-give-note-icon">'+checkIcon()+'</span><div><strong>After payment:</strong> please submit the donation enquiry form or contact the organisation so your contribution can be confirmed and properly followed up.</div></div>'+
      '<p id="publicDonationInstructionsText" class="nis-give-source" hidden>'+esc(raw)+'</p>';
    panel.hidden=false;
    return true;
  }

  async function writeClipboard(value){
    if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);return}
    var input=document.createElement('textarea');
    input.value=value;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';
    document.body.appendChild(input);input.select();document.execCommand('copy');input.remove();
  }

  document.addEventListener('click',function(event){
    var button=event.target.closest&&event.target.closest('.nis-give-copy');
    if(!button)return;
    var value=button.getAttribute('data-copy');
    if(!value)return;
    var label=button.querySelector('span'),original=label?label.textContent:'Copy';
    writeClipboard(value).then(function(){
      button.classList.add('is-copied');if(label)label.textContent='Copied';
      setTimeout(function(){button.classList.remove('is-copied');if(label)label.textContent=original},1400);
    }).catch(function(){
      if(label)label.textContent='Try again';
      setTimeout(function(){if(label)label.textContent=original},1400);
    });
  });

  function start(){
    var attempts=0;
    function tryUpgrade(){
      attempts++;
      if(upgrade()||attempts>=15)return;
      setTimeout(tryUpgrade,250);
    }
    tryUpgrade();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
