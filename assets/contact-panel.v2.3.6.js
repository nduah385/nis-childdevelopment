/* NIS Child Development Centre — resilient Google Maps + WhatsApp contact compatibility v2.3.6.2 */
(function(){
  'use strict';
  var cfg=window.NIS_CONFIG||{};
  var approvedMapUrl='';
  var mapRestoreQueued=false;

  function extractMapUrl(raw){
    var value=String(raw||'').trim();
    if(!value)return'';

    if(/^</.test(value)){
      try{
        var doc=new DOMParser().parseFromString(value,'text/html');
        var iframe=doc.querySelector('iframe[src]');
        if(iframe)value=String(iframe.getAttribute('src')||'').trim();
      }catch(e){return''}
    }

    try{
      var url=new URL(value,location.href);
      var host=url.hostname.toLowerCase();
      var allowedHost=host==='www.google.com'||host==='maps.google.com';
      var allowedPath=url.pathname.indexOf('/maps/embed')===0;
      if(url.protocol!=='https:'||!allowedHost||!allowedPath)return'';
      return url.href;
    }catch(e){return''}
  }

  function ensureMap(){
    var frame=document.getElementById('contactMap');
    if(!frame||!approvedMapUrl)return false;
    if(frame.getAttribute('src')!==approvedMapUrl)frame.setAttribute('src',approvedMapUrl);
    frame.loading='lazy';
    frame.referrerPolicy='no-referrer-when-downgrade';
    frame.setAttribute('allowfullscreen','');
    frame.title='NIS Child Development Centre location map';
    if(frame.hidden)frame.hidden=false;
    return true;
  }

  function queueMapRestore(){
    if(mapRestoreQueued)return;
    mapRestoreQueued=true;
    setTimeout(function(){
      mapRestoreQueued=false;
      ensureMap();
    },0);
  }

  function watchMap(){
    var frame=document.getElementById('contactMap');
    if(!frame)return;
    var observer=new MutationObserver(function(){
      if(approvedMapUrl)queueMapRestore();
    });
    observer.observe(frame,{attributes:true,attributeFilter:['src','hidden']});
  }

  function whatsappDigits(raw){
    var value=String(raw||'').trim();
    if(!value)return'';
    var digits=value.replace(/\D/g,'');
    if(!digits)return'';
    if(digits.indexOf('00')===0)digits=digits.slice(2);
    if(digits.length===10&&digits.charAt(0)==='0')digits='233'+digits.slice(1);
    return digits;
  }

  function enhanceWhatsApp(){
    var host=document.getElementById('contactDetails');
    if(!host)return false;
    var cards=host.querySelectorAll('p');
    for(var i=0;i<cards.length;i++){
      var card=cards[i];
      var label=card.querySelector('strong');
      var labelText=label?String(label.textContent||'').trim().toLowerCase().replace(/:\s*$/,''):'';
      if(labelText!=='whatsapp')continue;
      if(card.querySelector('a.nis-whatsapp-link'))return true;

      var clone=card.cloneNode(true);
      var cloneLabel=clone.querySelector('strong');
      if(cloneLabel)cloneLabel.remove();
      var raw=String(clone.textContent||'').trim().replace(/^:\s*/,'');
      if(!raw)return false;
      var digits=whatsappDigits(raw);
      if(!digits)return false;

      var link=document.createElement('a');
      link.className='nis-whatsapp-link';
      link.href='https://wa.me/'+digits;
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.textContent=raw;
      link.setAttribute('aria-label','Chat on WhatsApp with '+raw);
      link.title='Open WhatsApp chat';

      while(label.nextSibling)card.removeChild(label.nextSibling);
      card.appendChild(document.createTextNode(' '));
      card.appendChild(link);
      return true;
    }
    return false;
  }

  function watchWhatsApp(){
    var host=document.getElementById('contactDetails');
    if(!host)return;
    enhanceWhatsApp();
    var queued=false;
    var observer=new MutationObserver(function(){
      if(queued)return;
      queued=true;
      setTimeout(function(){
        queued=false;
        enhanceWhatsApp();
      },0);
    });
    observer.observe(host,{childList:true,subtree:true,characterData:true});
  }

  async function loadConfiguredMap(){
    if(!cfg.neonAuthUrl||!cfg.neonDataApiUrl)return;
    try{
      var mod=await import('https://cdn.jsdelivr.net/npm/@neondatabase/neon-js@0.7.0-beta/+esm');
      var client=mod.createClient({
        auth:{adapter:mod.SupabaseAuthAdapter(),url:cfg.neonAuthUrl,allowAnonymous:true},
        dataApi:{url:cfg.neonDataApiUrl}
      });
      var result=await client.from('website_settings').select('value').eq('key','map_embed_url').limit(1);
      if(result.error)throw new Error(result.error.message);
      var raw=result.data&&result.data[0]?result.data[0].value:'';
      approvedMapUrl=extractMapUrl(raw);
      if(approvedMapUrl)ensureMap();
      else if(raw)console.warn('Google Maps embed setting was present but could not be safely validated.');
    }catch(e){
      console.error('Contact map load failed',e);
    }
  }

  function start(){
    watchWhatsApp();
    watchMap();
    setTimeout(loadConfiguredMap,80);
    setTimeout(enhanceWhatsApp,400);
    setTimeout(enhanceWhatsApp,1200);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',start,{once:true});
  }else{
    start();
  }
})();
