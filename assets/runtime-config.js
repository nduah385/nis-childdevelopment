window.NIS_CONFIG = {
  neonAuthUrl: "https://ep-quiet-star-af3t7s87.neonauth.c-2.us-west-2.aws.neon.tech/neondb/auth",
  neonDataApiUrl: "https://ep-quiet-star-af3t7s87.apirest.c-2.us-west-2.aws.neon.tech/neondb/rest/v1",
  canonicalUrl: "https://nduah385.github.io/nis-childdevelopment/",
  version: "2.3.4.1-neon-r2-single-admin",
  videoUploadWorkerUrl: "https://nis-cdc-media-upload.nduah385.workers.dev",
  bootstrapOrganisationLogo: "https://nis-cdc-media-upload.nduah385.workers.dev/media/images/migration/website_settings/value/2026/08/66471ec8-6788-4837-b39c-eaa6b967a735.webp",
  bootstrapSchoolLogo: "https://nis-cdc-media-upload.nduah385.workers.dev/media/images/migration/school_profile/logo_url/2026/08/f8bebbbc-f460-4c74-8e51-1c2c23dad119.webp"
};

(function(){
  var cfg=window.NIS_CONFIG;

  function warmConnection(href){
    if(!href||document.head.querySelector('link[rel="preconnect"][href="'+href+'"]'))return;
    var link=document.createElement('link');link.rel='preconnect';link.href=href;link.crossOrigin='anonymous';document.head.appendChild(link);
  }
  warmConnection('https://cdn.jsdelivr.net');
  warmConnection('https://ep-quiet-star-af3t7s87.neonauth.c-2.us-west-2.aws.neon.tech');
  warmConnection('https://ep-quiet-star-af3t7s87.apirest.c-2.us-west-2.aws.neon.tech');
  warmConnection('https://nis-cdc-media-upload.nduah385.workers.dev');

  function showLogo(id,url,alt,priority,fallbackId){
    var img=document.getElementById(id);if(!img||!url)return;
    img.alt=alt||'';img.decoding='async';
    if(priority)img.setAttribute('fetchpriority','high');
    img.addEventListener('error',function(){img.hidden=true;var fallback=fallbackId&&document.getElementById(fallbackId);if(fallback)fallback.hidden=false},{once:true});
    img.src=url;img.hidden=false;
  }
  showLogo('brandLogo',cfg.bootstrapOrganisationLogo,'NIS Child Development Centre logo',true,'brandMark');
  var brandMark=document.getElementById('brandMark');if(brandMark&&cfg.bootstrapOrganisationLogo)brandMark.hidden=true;
  showLogo('schoolHeroLogo',cfg.bootstrapSchoolLogo,'Nipe International School logo',true);
  showLogo('schoolLogo',cfg.bootstrapSchoolLogo,'Nipe International School logo',false);

  var adminOpen=document.getElementById('adminOpen');
  if(adminOpen){adminOpen.style.display='none';adminOpen.setAttribute('aria-hidden','true')}
  var firstSetup=document.getElementById('showFirstAdminSetup');
  if(firstSetup){firstSetup.hidden=true}

  var css21=document.createElement('link');css21.rel='stylesheet';css21.href='assets/enhancements.v2.1.0.css';document.head.appendChild(css21);
  var css22=document.createElement('link');css22.rel='stylesheet';css22.href='assets/enhancements.v2.2.0.css';document.head.appendChild(css22);
  var css23=document.createElement('link');css23.rel='stylesheet';css23.href='assets/admin-version.v2.3.3.css?v=2.3.4.1';document.head.appendChild(css23);

  var hardening=document.createElement('script');hardening.type='module';hardening.src='assets/single-admin-hardening.v2.3.4.js?v=2.3.4.1';document.head.appendChild(hardening);

  var isAdmin=new URLSearchParams(location.search).get('admin')==='1';
  if(isAdmin){
    var js21=document.createElement('script');js21.type='module';js21.src='assets/enhancements.v2.1.0.js?v=2.3.4.1';document.head.appendChild(js21);
    var js22=document.createElement('script');js22.type='module';js22.src='assets/enhancements.v2.2.0.js?v=2.3.4.1';document.head.appendChild(js22);
    var recovery=document.createElement('script');recovery.type='module';recovery.src='assets/password-recovery.v2.3.1.js?v=2.3.4.1';document.head.appendChild(recovery);
    var visibility=document.createElement('script');visibility.src='assets/password-visibility.v2.3.2.js?v=2.3.4.1';document.head.appendChild(visibility);
  }else{
    var pub=document.createElement('script');pub.src='assets/public-enhancements.v2.2.3.js?v=2.3.4.1';document.head.appendChild(pub);
  }
})();