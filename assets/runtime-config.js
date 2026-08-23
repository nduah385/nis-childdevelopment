window.NIS_CONFIG = {
  neonAuthUrl: "https://ep-quiet-star-af3t7s87.neonauth.c-2.us-west-2.aws.neon.tech/neondb/auth",
  neonDataApiUrl: "https://ep-quiet-star-af3t7s87.apirest.c-2.us-west-2.aws.neon.tech/neondb/rest/v1",
  canonicalUrl: "https://nduah385.github.io/nis-childdevelopment/",
  version: "2.1.0-neon"
};

/* v2.1 enhancement loader. Core v2.0 remains untouched for safe rollback. */
(function(){
  var adminOpen=document.getElementById('adminOpen'); if(adminOpen){adminOpen.style.display='none';adminOpen.setAttribute('aria-hidden','true');}
  var firstSetup=document.getElementById('showFirstAdminSetup'); if(firstSetup){firstSetup.hidden=true;}
  var css=document.createElement('link');
  css.rel='stylesheet';
  css.href='assets/enhancements.v2.1.0.css';
  document.head.appendChild(css);
  var js=document.createElement('script');
  js.type='module';
  js.src='assets/enhancements.v2.1.0.js';
  document.head.appendChild(js);
})();
