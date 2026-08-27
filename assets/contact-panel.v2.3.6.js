/* NIS Child Development Centre — Google Maps + WhatsApp contact compatibility v2.3.6.1 */
(function(){
  'use strict';
  var cfg=window.NIS_CONFIG||{};

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

  function showMap(url){
    var frame=document.getElementById('contactMap');
    if(!frame||!url)return false;
    frame.src=url;
    frame.loading='lazy';
    frame.referrerPolicy='no-referrer-when-downgrade';
    frame.setAttribute('allowfullscreen','');
    frame.title='NIS Child Development Centre location map';
    frame.hidden=false;
    return true;
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
      var label=cards[i].querySelector('strong');
      if(!label||String(label.textContent||'').trim().toLowerCase()!=='whatsapp')continue;
      if(cards[i].querySelector('a.nis-whatsapp-link'))return true;
      var raw='';
      for(var n=0;n<cards[i].childNodes.length;n++){
        var node=cards[i].childNodes[n];
        if(node.nodeType===Node.TEXT_NODE)raw+=node.nodeValue||'';
      }
      raw=raw.replace(/^\s*:\s*/,'').trim();
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
      for(var j=cards[i].childNodes.length-1;j>=0;j--){
        if(cards[i].childNodes[j].nodeType===Node.TEXT_NODE)cards[i].removeChild(cards[i].childNodes[j]);
      }
      cards[i].appendChild(link);
      return true;
    }
    return false;
  }

  function watchWhatsApp(){
    if(enhanceWhatsApp())return;
    var host=document.getElementById('contactDetails');
    if(!host)return;
    var observer=new MutationObserver(function(){
      if(enhanceWhatsApp())observer.disconnect();
    });
    observer.observe(host,{childList:true,subtree:true});
    setTimeout(function(){observer.disconnect();enhanceWhatsApp()},5000);
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
      var mapUrl=extractMapUrl(raw);
      if(mapUrl)showMap(mapUrl);
      else if(raw)console.warn('Google Maps embed setting was present but could not be safely validated.');
    }catch(e){
      console.error('Contact map load failed',e);
    }
  }

  function start(){
    watchWhatsApp();
    setTimeout(loadConfiguredMap,120);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',start,{once:true});
  }else{
    start();
  }
})();
