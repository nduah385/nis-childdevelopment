window.NIS_CONFIG = {
  neonAuthUrl: "https://ep-quiet-star-af3t7s87.neonauth.c-2.us-west-2.aws.neon.tech/neondb/auth",
  neonDataApiUrl: "https://ep-quiet-star-af3t7s87.apirest.c-2.us-west-2.aws.neon.tech/neondb/rest/v1",
  canonicalUrl: "https://nduah385.github.io/nis-childdevelopment/",
  version: "2.2.2-neon-r2",
  videoUploadWorkerUrl: "https://nis-cdc-media-upload.nduah385.workers.dev"
};

(function(){
  var adminOpen=document.getElementById('adminOpen');if(adminOpen){adminOpen.style.display='none';adminOpen.setAttribute('aria-hidden','true')}
  var firstSetup=document.getElementById('showFirstAdminSetup');if(firstSetup){firstSetup.hidden=true}

  var css21=document.createElement('link');css21.rel='stylesheet';css21.href='assets/enhancements.v2.1.0.css';document.head.appendChild(css21);
  var js21=document.createElement('script');js21.type='module';js21.src='assets/enhancements.v2.1.0.js';document.head.appendChild(js21);

  function loadV22(){
    if(document.querySelector('script[data-nis-v22]'))return;
    var css22=document.createElement('link');css22.rel='stylesheet';css22.href='assets/enhancements.v2.2.0.css';document.head.appendChild(css22);
    var js22=document.createElement('script');js22.type='module';js22.dataset.nisV22='1';js22.src='assets/enhancements.v2.2.0.js?v=2.2.2';document.head.appendChild(js22);
    var perf=document.createElement('script');perf.src='assets/enhancements.v2.2.2-performance.js?v=2.2.2';document.head.appendChild(perf);
  }

  var isAdmin=new URLSearchParams(location.search).get('admin')==='1';
  if(isAdmin){loadV22()}
  else if(document.readyState==='complete'){
    if('requestIdleCallback' in window)requestIdleCallback(loadV22,{timeout:1200});else setTimeout(loadV22,250);
  }else{
    window.addEventListener('load',function(){
      if('requestIdleCallback' in window)requestIdleCallback(loadV22,{timeout:1200});else setTimeout(loadV22,250);
    },{once:true});
  }
})();