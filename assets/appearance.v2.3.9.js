import { createClient, SupabaseAuthAdapter as NeonAuthCompatibilityAdapter } from 'https://cdn.jsdelivr.net/npm/@neondatabase/neon-js@0.7.0-beta/+esm';

const cfg=window.NIS_CONFIG||{};
const THEMES={
  classic_forest:{name:'Classic Forest',desc:'Professional NGO green with warm gold.',colors:['#0f5c45','#f1b24a','#f3f8f5']},
  royal_blue:{name:'Royal Blue',desc:'Institutional education blue with gold.',colors:['#174a7e','#f4b942','#f1f6fb']},
  warm_gold:{name:'Warm Gold',desc:'Community earth tones with donor warmth.',colors:['#75531f','#d9a441','#fbf6eb']},
  earth_hope:{name:'Earth & Hope',desc:'Natural green with grounded earth accents.',colors:['#4e6a3d','#c88c4a','#f4f5ed']},
  slate_teal:{name:'Slate Teal',desc:'Modern teal and slate with a soft ivory base.',colors:['#155e75','#e5b94f','#f4f8f9']},
  midnight_gold:{name:'Midnight Gold',desc:'Executive midnight slate with refined gold.',colors:['#243447','#d6a84b','#f5f3ed']},
  heritage_burgundy:{name:'Heritage Burgundy',desc:'Deep burgundy with champagne-style accents.',colors:['#6b2d3a','#c8a45d','#faf6f3']},
  sage_cream:{name:'Sage & Cream',desc:'Calm sage green with warm cream neutrals.',colors:['#526b5b','#c4a76c','#f8f5ec']},
  high_contrast:{name:'High Contrast',desc:'Accessibility-focused black, white and yellow.',colors:['#111111','#ffd400','#ffffff']}
};

let client=null,savedTheme='classic_forest',previewTheme='classic_forest';
try{
  if(cfg.neonAuthUrl&&cfg.neonDataApiUrl){
    client=createClient({auth:{adapter:NeonAuthCompatibilityAdapter(),url:cfg.neonAuthUrl,allowAnonymous:true},dataApi:{url:cfg.neonDataApiUrl}});
  }
}catch(e){console.error('Appearance v2.3.9 Neon init failed',e)}

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validTheme(name){return THEMES[name]?name:'classic_forest'}
function applyTheme(name){
  const key=validTheme(name);previewTheme=key;document.documentElement.dataset.nisTheme=key;
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=THEMES[key].colors[0];
}
function workspace(){return document.getElementById('adminModule')}
function status(msg,type=''){
  const el=document.getElementById('nisEnhStatus');if(!el)return;
  el.textContent=msg||'';el.className=`nis-enh-status ${type}`;
}
function themeCards(selected){
  return Object.entries(THEMES).map(([key,t])=>`<button type="button" role="radio" aria-checked="${key===selected?'true':'false'}" aria-label="Preview ${esc(t.name)} theme" class="nis-theme-card nis-theme-card-compact ${key===selected?'selected':''}" data-theme-choice="${key}"><span class="nis-theme-selected-badge" aria-hidden="true"></span><span class="nis-theme-swatch nis-theme-swatch-compact">${t.colors.map(c=>`<span style="background:${c}"></span>`).join('')}</span><span class="nis-theme-card-copy"><strong>${esc(t.name)}</strong><p>${esc(t.desc)}</p></span></button>`).join('');
}
function updateSelection(host,selected){
  host.querySelectorAll('[data-theme-choice]').forEach(btn=>{
    const active=btn.dataset.themeChoice===selected;btn.classList.toggle('selected',active);btn.setAttribute('aria-checked',String(active));
  });
  const t=THEMES[selected];
  const name=document.getElementById('nisAppearanceCurrentName');if(name)name.textContent=t.name;
  const chip=document.getElementById('nisAppearancePreviewChip');if(chip)chip.innerHTML='<span class="nis-appearance-preview-dot" aria-hidden="true"></span>Previewing '+esc(t.name);
}
async function readSavedTheme(){
  if(!client)return'classic_forest';
  try{const {data,error}=await client.from('website_settings').select('value').eq('key','theme_name').maybeSingle();if(error)throw error;return validTheme(data?.value||'classic_forest')}catch(e){console.error('Appearance theme read failed',e);return'classic_forest'}
}
async function renderAppearance(){
  const host=workspace();if(!host)return;
  savedTheme=await readSavedTheme();previewTheme=savedTheme;applyTheme(savedTheme);
  host.innerHTML=`<div class="admin-toolbar"><div><h3>Website Appearance</h3><p>Choose a controlled professional theme. Selection previews instantly; nothing is permanent until you save.</p></div></div><div class="nis-appearance-summary"><div><strong id="nisAppearanceCurrentName">${esc(THEMES[savedTheme].name)}</strong><span>Current controlled website theme</span></div><span class="nis-appearance-preview-chip" id="nisAppearancePreviewChip"><span class="nis-appearance-preview-dot" aria-hidden="true"></span>Previewing ${esc(THEMES[savedTheme].name)}</span></div><div class="nis-theme-grid nis-theme-grid-compact" role="radiogroup" aria-label="Professional website themes">${themeCards(savedTheme)}</div><div class="nis-appearance-actions"><button class="btn btn-primary" id="nisSaveTheme" type="button">Save Theme</button><button class="btn btn-outline" id="nisResetTheme" type="button">Classic Forest</button><button class="btn btn-outline" id="nisCancelPreview" type="button">Restore Saved</button></div><p id="nisEnhStatus" class="nis-enh-status" role="status"></p>`;
  host.querySelectorAll('[data-theme-choice]').forEach(btn=>btn.addEventListener('click',()=>{previewTheme=validTheme(btn.dataset.themeChoice);applyTheme(previewTheme);updateSelection(host,previewTheme);status('Preview only — click Save Theme to publish.')}));
  document.getElementById('nisResetTheme').onclick=()=>{previewTheme='classic_forest';applyTheme(previewTheme);updateSelection(host,previewTheme);status('Classic Forest is being previewed. Click Save Theme to publish.')};
  document.getElementById('nisCancelPreview').onclick=()=>{previewTheme=savedTheme;applyTheme(previewTheme);updateSelection(host,previewTheme);status('Saved theme restored.')};
  document.getElementById('nisSaveTheme').onclick=async()=>{
    if(!client)return status('Theme service is temporarily unavailable.','error');
    const {data:{session},error:sessionError}=await client.auth.getSession();
    if(sessionError||!session?.user?.id)return status('Administrator session is not available. Sign in again.','error');
    status('Saving…');
    const {error}=await client.from('website_settings').upsert([{key:'theme_name',value:previewTheme,updated_at:new Date().toISOString(),updated_by:session.user.id}],{onConflict:'key'});
    if(error)return status('Theme save failed: '+error.message,'error');
    savedTheme=previewTheme;applyTheme(savedTheme);updateSelection(host,savedTheme);status('Theme saved successfully.','success');
  };
}

function claimAppearanceButton(){
  const original=document.querySelector('#adminNav [data-nis-enh="appearance"]');
  if(!original||original.dataset.nisAppearanceFinal==='1')return false;
  const replacement=original.cloneNode(true);replacement.dataset.nisAppearanceFinal='1';replacement.addEventListener('click',renderAppearance);original.replaceWith(replacement);return true;
}
function setBuildMarker(){
  const marker=document.querySelector('#adminDashboard .mini-label');if(marker)marker.textContent='Website build v2.3.9 • Neon + R2 • Single Admin • Final Production';
}
async function synchronizeSavedTheme(){savedTheme=await readSavedTheme();previewTheme=savedTheme;applyTheme(savedTheme)}
function install(){
  synchronizeSavedTheme();claimAppearanceButton();setBuildMarker();
  const nav=document.getElementById('adminNav');if(nav)new MutationObserver(()=>{claimAppearanceButton();setBuildMarker()}).observe(nav,{childList:true,subtree:true});
  const dash=document.getElementById('adminDashboard');if(dash)new MutationObserver(()=>{setBuildMarker();if(!dash.hidden)setTimeout(synchronizeSavedTheme,0)}).observe(dash,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('click',e=>{
    const other=e.target?.closest?.('#adminNav button');
    if(other&&!other.matches('[data-nis-enh="appearance"]')&&previewTheme!==savedTheme){previewTheme=savedTheme;applyTheme(savedTheme)}
  },true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
