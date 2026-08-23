/* NIS Child Development Centre v2.2.1
   Compatibility hotfix: v2.1 can hide the public Videos section after
   v2.2 has rendered R2-backed videos. Keep the v2.2-rendered section
   authoritative and restore its navigation link. */
(function(){
  function syncPublicVideos(){
    var section=document.getElementById('videos');
    var grid=document.getElementById('nisVideoGrid');
    if(!section||!grid||!grid.children.length)return;

    /* Any rendered v2.2 video card represents content already approved by
       the public Neon query. Do not let the legacy v2.1 URL filter hide it. */
    if(section.hidden)section.hidden=false;

    var nav=document.getElementById('primaryNav');
    if(nav&&!nav.querySelector('a[href="#videos"]')){
      var a=document.createElement('a');
      a.href='#videos';
      a.textContent='Videos';
      var galleryLink=nav.querySelector('a[href="#gallery"]');
      nav.insertBefore(a,galleryLink||nav.lastElementChild);
    }
  }

  function updateBuildMarker(){
    var marker=document.querySelector('#adminDashboard .mini-label');
    if(marker)marker.textContent='Website build v2.2.1 • Neon + R2';
  }

  function boot(){
    syncPublicVideos();
    updateBuildMarker();

    var observer=new MutationObserver(function(){
      syncPublicVideos();
      updateBuildMarker();
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});

    /* Cover asynchronous module-load ordering and browser cache timing. */
    var attempts=0;
    var timer=setInterval(function(){
      syncPublicVideos();
      updateBuildMarker();
      attempts++;
      if(attempts>=20)clearInterval(timer);
    },500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();