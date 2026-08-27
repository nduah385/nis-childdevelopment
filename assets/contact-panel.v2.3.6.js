/* NIS Child Development Centre — Google Maps embed compatibility v2.3.6 */
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

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(loadConfiguredMap,120)},{once:true});
  }else{
    setTimeout(loadConfiguredMap,120);
  }
})();
