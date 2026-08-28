window.NIS_CONFIG = {
  neonAuthUrl: "https://ep-quiet-star-af3t7s87.neonauth.c-2.us-west-2.aws.neon.tech/neondb/auth",
  neonDataApiUrl: "https://ep-quiet-star-af3t7s87.apirest.c-2.us-west-2.aws.neon.tech/neondb/rest/v1",
  canonicalUrl: "https://nduah385.github.io/nis-childdevelopment/",
  version: "2.3.9-final-production-neon-r2-single-admin",
  videoUploadWorkerUrl: "https://nis-cdc-media-upload.nduah385.workers.dev",
  bootstrapOrganisationLogo: "https://nis-cdc-media-upload.nduah385.workers.dev/media/images/migration/website_settings/value/2026/08/66471ec8-6788-4837-b39c-eaa6b967a735.webp",
  bootstrapSchoolLogo: "https://nis-cdc-media-upload.nduah385.workers.dev/media/images/migration/school_profile/logo_url/2026/08/f8bebbbc-f460-4c74-8e51-1c2c23dad119.webp"
};

(function(){
  'use strict';
  var cfg=window.NIS_CONFIG;
  var isAdmin=new URLSearchParams(location.search).get('admin')==='1';

  if(cfg.bootstrapOrganisationLogo){
    var preloadLogo=document.createElement('link');
    preloadLogo.rel='preload';preloadLogo.as='image';preloadLogo.href=cfg.bootstrapOrganisationLogo;
    document.head.appendChild(preloadLogo);
    var favicon=document.getElementById('siteFavicon');
    if(favicon){favicon.href=cfg.bootstrapOrganisationLogo;favicon.type='image/webp'}
    var appleIcon=document.getElementById('appleTouchIcon');
    if(appleIcon)appleIcon.href=cfg.bootstrapOrganisationLogo;
  }
  var themeMeta=document.querySelector('meta[name="theme-color"]');
  if(themeMeta)themeMeta.setAttribute('content','#083f32');

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
  if(firstSetup)firstSetup.hidden=true;

  function addCss(href){var l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l);return l}
  function addScript(src,type){var s=document.createElement('script');if(type)s.type=type;s.src=src;document.head.appendChild(s);return s}

  addCss('assets/enhancements.v2.1.0.css?v=2.3.9');
  addCss('assets/enhancements.v2.2.0.css?v=2.3.9');
  addCss('assets/theme-pack.v2.3.9.css?v=2.3.9');
  addCss('assets/navigation-visibility.v2.3.7.css?v=2.3.9');

  if(isAdmin){
    addCss('assets/admin-version.v2.3.3.css?v=2.3.9');
    addScript('assets/single-admin-hardening.v2.3.4.js?v=2.3.9','module');
    addScript('assets/enhancements.v2.1.0.js?v=2.3.9','module');
    addScript('assets/enhancements.v2.2.0.js?v=2.3.9','module');
    addScript('assets/appearance.v2.3.9.js?v=2.3.9','module');
    addScript('assets/password-recovery.v2.3.1.js?v=2.3.9','module');
    addScript('assets/password-visibility.v2.3.2.js?v=2.3.9');
  }else{
    addCss('assets/production-performance.v2.3.8.css?v=2.3.9');
    addCss('assets/donation-panel.v2.3.5.css?v=2.3.9');
    addCss('assets/contact-panel.v2.3.6.css?v=2.3.9');
    addScript('assets/public-runtime.v2.3.9.js?v=2.3.9');
    addScript('assets/donation-panel.v2.3.8.js?v=2.3.9');
  }
})();