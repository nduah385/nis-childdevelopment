/* NIS Child Development Centre v2.2.3
   Lightweight PUBLIC-only enhancements.
   No Neon JS client, no polling, no broad MutationObserver.
   Handles only public theme + published videos through anonymous Data API reads. */
(function(){
  'use strict';
  var cfg=window.NIS_CONFIG||{};
  var API=String(cfg.neonDataApiUrl||'').replace(/\/+$/,'');
  var THEMES={classic_forest:true,royal_blue:true,warm_gold:true,earth_hope:true,high_contrast:true};

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function safeHttps(raw){try{var u=new URL(String(raw||''));return u.protocol==='https:'?u.href:''}catch(e){return''}}
  function externalVideo(raw){try{var u=new URL(String(raw||''));return u.protocol==='https:'&&(u.hostname==='youtu.be'||/(^|\.)youtube\.com$/i.test(u.hostname)||/(^|\.)vimeo\.com$/i.test(u.hostname))}catch(e){return false}}
  function managedVideo(v){return v&&v.storage_provider==='cloudflare-r2'&&!!safeHttps(v.video_url)}
  function youtubeId(raw){try{var u=new URL(raw);if(u.hostname==='youtu.be')return u.pathname.slice(1).split('/')[0];if(/(^|\.)youtube\.com$/i.test(u.hostname))return u.searchParams.get('v')||(u.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)||[])[1]||''}catch(e){}return''}
  function thumb(v){var t=String(v.thumbnail_url||'');if(/^data:image\//i.test(t)||safeHttps(t))return t;var id=youtubeId(v.video_url);return id?'https://i.ytimg.com/vi/'+encodeURIComponent(id)+'/hqdefault.jpg':''}

  async function get(path){
    if(!API)return [];
    var r=await fetch(API+path,{method:'GET',headers:{Accept:'application/json'},cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    var x=await r.json();return Array.isArray(x)?x:[];
  }

  async function applyTheme(){
    try{
      var rows=await get('/website_settings?select=value&key=eq.theme_name&limit=1');
      var key=rows[0]&&THEMES[rows[0].value]?rows[0].value:'classic_forest';
      document.documentElement.dataset.nisTheme=key;
    }catch(e){document.documentElement.dataset.nisTheme='classic_forest'}
  }

  function ensureSection(){
    var s=document.getElementById('videos');
    if(!s){
      s=document.createElement('section');s.id='videos';s.className='section section-soft nis-video-section';s.hidden=true;
      var g=document.getElementById('gallery'),stories=document.getElementById('stories');
      if(g&&g.parentNode)g.parentNode.insertBefore(s,g);else if(stories&&stories.parentNode)stories.parentNode.insertBefore(s,stories.nextSibling);
    }
    s.innerHTML='<div class="container"><p class="eyebrow dark">Video Stories</p><div class="section-heading"><h2>Appreciation, testimony and moments of impact</h2><p>Approved video messages and field updates from our community, partners and programmes.</p></div><div id="nisVideoGrid" class="nis-video-grid"></div></div>';
    return s;
  }

  function ensureNav(){
    var nav=document.getElementById('primaryNav');if(!nav||nav.querySelector('a[href="#videos"]'))return;
    var a=document.createElement('a');a.href='#videos';a.textContent='Videos';
    var gallery=nav.querySelector('a[href="#gallery"]');nav.insertBefore(a,gallery||nav.lastElementChild);
  }

  async function loadVideos(){
    try{
      var rows=await get('/media_videos?select=id,title,description,category,video_url,thumbnail_url,organisation_type,is_featured,sort_order,created_at,storage_provider,mime_type&is_published=eq.true&publication_approved=eq.true&order=is_featured.desc,sort_order.asc,created_at.desc&limit=12');
      rows=rows.filter(function(v){return managedVideo(v)||externalVideo(v.video_url)});
      if(!rows.length)return;
      var s=ensureSection(),grid=document.getElementById('nisVideoGrid');
      grid.innerHTML=rows.map(function(v){
        var org=v.organisation_type==='school'?'Nipe International School':v.organisation_type==='joint'?'Joint':'NIS Child Development Centre';
        var meta=esc(v.category||'Video')+' · '+esc(org),p=thumb(v);
        if(managedVideo(v)){
          return '<article class="nis-video-card nis-uploaded-video-card"><video class="nis-public-video" controls preload="none" playsinline '+(p?'poster="'+esc(p)+'"':'')+'><source src="'+esc(v.video_url)+'" type="'+esc(v.mime_type||'video/mp4')+'">Your browser does not support HTML5 video.</video><div class="nis-video-body"><span class="nis-video-meta">'+meta+'</span><h3>'+esc(v.title)+'</h3>'+(v.description?'<p>'+esc(v.description)+'</p>':'')+'</div></article>';
        }
        return '<article class="nis-video-card"><a class="nis-video-thumb" href="'+esc(v.video_url)+'" target="_blank" rel="noopener noreferrer">'+(p?'<img loading="lazy" src="'+esc(p)+'" alt="'+esc(v.title)+' video thumbnail">':'')+'<span class="nis-video-play">▶</span></a><div class="nis-video-body"><span class="nis-video-meta">'+meta+'</span><h3>'+esc(v.title)+'</h3>'+(v.description?'<p>'+esc(v.description)+'</p>':'')+'<a class="nis-video-link" href="'+esc(v.video_url)+'" target="_blank" rel="noopener noreferrer">Watch video →</a></div></article>';
      }).join('');
      s.hidden=false;ensureNav();
    }catch(e){console.error('Public video load failed',e)}
  }

  function start(){
    applyTheme();
    if('requestIdleCallback' in window)requestIdleCallback(loadVideos,{timeout:1500});else setTimeout(loadVideos,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
