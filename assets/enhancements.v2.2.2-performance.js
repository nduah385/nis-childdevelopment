/* NIS Child Development Centre v2.2.2
   Lightweight public-video compatibility and performance layer.
   Replaces the v2.2.1 whole-page observer/polling hotfix. */
(function(){
  function addPreconnect(href){
    if(!href||document.head.querySelector('link[rel="preconnect"][href="'+href+'"]'))return;
    var l=document.createElement('link');l.rel='preconnect';l.href=href;l.crossOrigin='anonymous';document.head.appendChild(l);
  }

  try{
    var cfg=window.NIS_CONFIG||{};
    if(cfg.neonDataApiUrl)addPreconnect(new URL(cfg.neonDataApiUrl).origin);
    if(cfg.neonAuthUrl)addPreconnect(new URL(cfg.neonAuthUrl).origin);
    if(cfg.videoUploadWorkerUrl)addPreconnect(new URL(cfg.videoUploadWorkerUrl).origin);
  }catch(e){}

  function ensureNav(){
    var nav=document.getElementById('primaryNav');
    if(!nav||nav.querySelector('a[href="#videos"]'))return;
    var a=document.createElement('a');a.href='#videos';a.textContent='Videos';
    var galleryLink=nav.querySelector('a[href="#gallery"]');
    nav.insertBefore(a,galleryLink||nav.lastElementChild);
  }

  function reconcile(section){
    if(!section)return;
    var grid=section.querySelector('#nisVideoGrid');
    if(!grid||!grid.children.length)return;
    if(section.hidden)section.hidden=false;
    ensureNav();
    section.querySelectorAll('video').forEach(function(v){
      if(v.preload!=='none')v.preload='none';
    });
  }

  function watchSection(section){
    reconcile(section);
    var grid=section.querySelector('#nisVideoGrid');
    var sectionObserver=new MutationObserver(function(){reconcile(section)});
    sectionObserver.observe(section,{attributes:true,attributeFilter:['hidden']});
    if(grid){
      var gridObserver=new MutationObserver(function(){reconcile(section)});
      gridObserver.observe(grid,{childList:true});
    }
  }

  function install(){
    var existing=document.getElementById('videos');
    if(existing){watchSection(existing);return}
    var bodyObserver=new MutationObserver(function(){
      var section=document.getElementById('videos');
      if(section){bodyObserver.disconnect();watchSection(section)}
    });
    bodyObserver.observe(document.body,{childList:true,subtree:true});
  }

  function updateBuildMarker(){
    var marker=document.querySelector('#adminDashboard .mini-label');
    if(marker)marker.textContent='Website build v2.2.2 • Neon + R2';
  }

  function watchAdminMarker(){
    updateBuildMarker();
    var dash=document.getElementById('adminDashboard');
    if(!dash)return;
    var o=new MutationObserver(updateBuildMarker);
    o.observe(dash,{attributes:true,attributeFilter:['hidden']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){install();watchAdminMarker()},{once:true});
  else {install();watchAdminMarker()}
})();