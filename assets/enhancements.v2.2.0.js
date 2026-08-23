import { createClient, SupabaseAuthAdapter as NeonAuthCompatibilityAdapter } from 'https://cdn.jsdelivr.net/npm/@neondatabase/neon-js@0.7.0-beta/+esm';

const cfg=window.NIS_CONFIG||{};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROLES=new Set(['super_admin','ngo_executive','communications_admin','content_admin']);
const TYPES=new Set(['video/mp4','video/webm','video/quicktime','video/x-m4v']);
const PART=10*1024*1024;
let client=null,adminInfo=null;

try{if(cfg.neonAuthUrl&&cfg.neonDataApiUrl)client=createClient({auth:{adapter:NeonAuthCompatibilityAdapter(),url:cfg.neonAuthUrl,allowAnonymous:true},dataApi:{url:cfg.neonDataApiUrl}})}catch(e){console.error('v2.2 Neon init failed',e)}

function workerBase(){const raw=String(cfg.videoUploadWorkerUrl||'').trim().replace(/\/+$/,'');try{const u=new URL(raw);return u.protocol==='https:'?u.origin:''}catch{return''}}
async function session(){if(!client)return null;const {data}=await client.auth.getSession();return data?.session||null}
function token(s){return s?.access_token||s?.accessToken||s?.token||''}
async function admin(){if(adminInfo)return adminInfo;const s=await session(),id=s?.user?.id;if(!id)return null;const {data,error}=await client.from('admin_users').select('id,email,display_name,role,is_active').eq('id',id).maybeSingle();if(error||!data?.is_active||!ROLES.has(data.role))return null;adminInfo={...data,userId:id};return adminInfo}
function externalOk(raw){try{const u=new URL(raw);return u.protocol==='https:'&&(u.hostname==='youtu.be'||/(^|\.)youtube\.com$/i.test(u.hostname)||/(^|\.)vimeo\.com$/i.test(u.hostname))}catch{return false}}
function managed(v){return v?.storage_provider==='cloudflare-r2'&&/^https:\/\//i.test(v?.video_url||'')}
function youtubeId(raw){try{const u=new URL(raw);if(u.hostname==='youtu.be')return u.pathname.slice(1).split('/')[0];if(/(^|\.)youtube\.com$/i.test(u.hostname))return u.searchParams.get('v')||u.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)?.[1]||''}catch{}return''}
function thumb(v){if(/^data:image\//i.test(v.thumbnail_url||'')||/^https:\/\//i.test(v.thumbnail_url||''))return v.thumbnail_url;const id=youtubeId(v.video_url);return id?`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`:''}
function ws(){return document.getElementById('adminModule')}
function st(msg,type=''){const e=document.getElementById('nisV22Status');if(e){e.textContent=msg;e.className=`nis-enh-status ${type}`}}

async function req(path,options={}){
  const base=workerBase();if(!base)throw new Error('Direct upload is not configured yet. Add the deployed Cloudflare Worker URL to assets/runtime-config.js.');
  const s=await session(),t=token(s);if(!t)throw new Error('Administrator session is not available. Sign in again.');
  const h=new Headers(options.headers||{});h.set('Authorization',`Bearer ${t}`);
  const r=await fetch(base+path,{...options,headers:h});
  let p=null;try{p=await r.json()}catch{try{p=await r.text()}catch{}}
  if(!r.ok)throw new Error(p?.error||p||`Upload service returned HTTP ${r.status}.`);
  return p;
}

async function upload(file,progress){
  if(!TYPES.has(String(file.type||'').toLowerCase()))throw new Error('Choose an MP4, WebM, MOV or M4V video file.');
  if(file.size<=0||file.size>2*1024*1024*1024)throw new Error('Video must be no more than 2 GB.');
  const c=await req('/upload/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,type:file.type,size:file.size})});
  const parts=[],total=Math.ceil(file.size/PART);let done=0;
  try{
    for(let i=0;i<total;i++){
      const start=i*PART,end=Math.min(file.size,start+PART),chunk=file.slice(start,end);
      progress?.({part:i+1,total,percent:Math.floor(done/file.size*100)});
      const p=await req(`/upload/part?key=${encodeURIComponent(c.key)}&uploadId=${encodeURIComponent(c.uploadId)}&partNumber=${i+1}`,{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:chunk});
      parts.push({partNumber:Number(p.partNumber),etag:p.etag});done+=chunk.size;progress?.({part:i+1,total,percent:Math.min(99,Math.floor(done/file.size*100))});
    }
    const x=await req('/upload/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:c.key,uploadId:c.uploadId,parts})});
    progress?.({part:total,total,percent:100});
    return{url:x.url||c.url,key:c.key,storage_provider:'cloudflare-r2',original_filename:c.originalFilename||file.name,mime_type:c.mimeType||file.type,file_size_bytes:Number(x.size||c.size||file.size)};
  }catch(e){try{await req('/upload/abort',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:c.key,uploadId:c.uploadId})})}catch{}throw e}
}
async function delObj(key){if(key)await req(`/upload/object?key=${encodeURIComponent(key)}`,{method:'DELETE'})}

async function compressThumb(file){
  if(!file)return'';if(!/^image\/(jpeg|png|webp)$/i.test(file.type)||file.size>8*1024*1024)throw new Error('Use a JPG, PNG or WEBP thumbnail up to 8 MB.');
  const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});
  const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=data});
  const scale=Math.min(1,1000/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/webp',.78)
}

function ensureSection(){
  let s=document.getElementById('videos');if(!s){s=document.createElement('section');s.id='videos';s.className='section section-soft nis-video-section';const g=document.getElementById('gallery'),stories=document.getElementById('stories');(g||stories)?.parentNode.insertBefore(s,g||stories.nextSibling)}
  s.innerHTML='<div class="container"><p class="eyebrow dark">Video Stories</p><div class="section-heading"><h2>Appreciation, testimony and moments of impact</h2><p>Approved video messages and field updates from our community, partners and programmes.</p></div><div id="nisVideoGrid" class="nis-video-grid"></div></div>';return s
}
async function publicVideos(){
  if(!client)return;const {data,error}=await client.from('media_videos').select('id,title,description,category,video_url,thumbnail_url,organisation_type,is_featured,sort_order,created_at,storage_provider,mime_type').eq('is_published',true).eq('publication_approved',true).order('is_featured',{ascending:false}).order('sort_order').order('created_at',{ascending:false}).limit(12);if(error)return console.error('v2.2 public video load failed',error);
  const rows=(data||[]).filter(v=>managed(v)||externalOk(v.video_url)),s=ensureSection(),grid=document.getElementById('nisVideoGrid');if(!rows.length){s.hidden=true;return}s.hidden=false;
  grid.innerHTML=rows.map(v=>{const label=v.organisation_type==='school'?'Nipe International School':v.organisation_type==='joint'?'Joint':'NIS Child Development Centre',meta=`${esc(v.category||'Video')} · ${esc(label)}`;
    if(managed(v)){const p=thumb(v);return `<article class="nis-video-card nis-uploaded-video-card"><video class="nis-public-video" controls preload="metadata" playsinline ${p?`poster="${esc(p)}"`:''}><source src="${esc(v.video_url)}" type="${esc(v.mime_type||'video/mp4')}">Your browser does not support HTML5 video.</video><div class="nis-video-body"><span class="nis-video-meta">${meta}</span><h3>${esc(v.title)}</h3>${v.description?`<p>${esc(v.description)}</p>`:''}</div></article>`}
    const p=thumb(v);return `<article class="nis-video-card"><a class="nis-video-thumb" href="${esc(v.video_url)}" target="_blank" rel="noopener noreferrer">${p?`<img loading="lazy" src="${esc(p)}" alt="${esc(v.title)} video thumbnail">`:''}<span class="nis-video-play">▶</span></a><div class="nis-video-body"><span class="nis-video-meta">${meta}</span><h3>${esc(v.title)}</h3>${v.description?`<p>${esc(v.description)}</p>`:''}<a class="nis-video-link" href="${esc(v.video_url)}" target="_blank" rel="noopener noreferrer">Watch video →</a></div></article>`}).join('')
}

async function listAdmin(){
  const host=ws();if(!host||!client)return;const a=await admin();if(!a){host.innerHTML='<div class="empty-state">Administrator authorisation is required.</div>';return}
  const {data,error}=await client.from('media_videos').select('*').order('is_featured',{ascending:false}).order('sort_order').order('created_at',{ascending:false});if(error){host.innerHTML=`<div class="empty-state">Videos could not be loaded: ${esc(error.message)}</div>`;return}
  const rows=data||[],ready=!!workerBase();
  host.innerHTML=`<div class="admin-toolbar"><div><h3>Videos & Appreciation Media</h3><p>Upload MP4, WebM or MOV files directly to Cloudflare R2. YouTube/Vimeo remains available as a fallback.</p></div><button class="btn btn-primary" id="v22add">Add Video</button></div>${ready?'':'<div class="nis-consent-note"><strong>Direct upload configuration required:</strong> deploy the v2.2 Cloudflare Worker and add its HTTPS URL to <code>videoUploadWorkerUrl</code> in <code>assets/runtime-config.js</code>.</div>'}<div class="nis-video-admin-list">${rows.length?rows.map(v=>{const p=thumb(v),m=managed(v),size=m&&v.file_size_bytes?` · ${(Number(v.file_size_bytes)/1024/1024).toFixed(1)} MB`:'';return `<article class="nis-video-admin-card">${p?`<img src="${esc(p)}" alt="">`:'<div class="nis-v22-video-placeholder">VIDEO</div>'}<div><strong>${esc(v.title)}</strong><p>${esc(v.category)} · ${m?'Uploaded file':'External link'}${size} · ${v.is_published&&v.publication_approved?'Published':'Draft / Review'}</p></div><div class="nis-video-admin-actions"><button class="btn btn-small btn-secondary" data-v22edit="${v.id}">Edit</button><button class="btn btn-small btn-danger" data-v22del="${v.id}">Delete</button></div></article>`}).join(''):'<div class="empty-state">No videos have been added yet.</div>'}</div><p id="nisV22Status" class="nis-enh-status"></p>`;
  document.getElementById('v22add').onclick=()=>form(null);
  host.querySelectorAll('[data-v22edit]').forEach(b=>b.onclick=()=>form(rows.find(v=>String(v.id)===b.dataset.v22edit)));
  host.querySelectorAll('[data-v22del]').forEach(b=>b.onclick=async()=>{const v=rows.find(x=>String(x.id)===b.dataset.v22del);if(!v||!confirm(`Delete video “${v.title}”?`))return;st('Deleting…');const {error}=await client.from('media_videos').delete().eq('id',v.id);if(error)return st('Delete failed: '+error.message,'error');if(v.storage_provider==='cloudflare-r2'&&v.storage_key)try{await delObj(v.storage_key)}catch(e){console.warn('R2 cleanup failed',e)}await publicVideos();listAdmin()})
}

function form(v){
  const host=ws();if(!host)return;const m=managed(v),current=m?`${v.original_filename||'Uploaded video'}${v.file_size_bytes?` (${(Number(v.file_size_bytes)/1024/1024).toFixed(1)} MB)`:''}`:'',ext=!m&&externalOk(v?.video_url||'')?v.video_url:'';
  host.innerHTML=`<div class="admin-toolbar"><div><h3>${v?'Edit':'Add'} Video</h3><p>Direct upload is recommended. External YouTube/Vimeo URL remains optional.</p></div><button class="btn btn-outline" id="v22back">Back</button></div><form id="v22form" class="nis-form-grid">
  <label class="full">Title<input name="title" required maxlength="180" value="${esc(v?.title||'')}"></label><label class="full">Description<textarea name="description" rows="4" maxlength="1200">${esc(v?.description||'')}</textarea></label>
  <div class="full nis-v22-source-panel"><strong>Video Source</strong><label class="nis-v22-file-label">Choose Video File<input name="video_file" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v"></label>${current?`<p class="admin-field-help"><strong>Current uploaded file:</strong> ${esc(current)}</p>`:''}<div class="nis-v22-or"><span>OR</span></div><label>External YouTube/Vimeo URL<input name="external_url" type="url" value="${esc(ext)}" placeholder="https://www.youtube.com/watch?v=..."></label><p class="admin-field-help">A newly selected video file takes priority over the external URL.</p></div>
  <label>Category<select name="category">${['Appreciation','Testimonial','Project Update','Event','Partner Message','Other'].map(x=>`<option ${v?.category===x?'selected':''}>${x}</option>`).join('')}</select></label>
  <label>Organisation<select name="organisation_type">${[['ngo','NIS Child Development Centre'],['school','Nipe International School'],['joint','Joint']].map(([x,l])=>`<option value="${x}" ${v?.organisation_type===x?'selected':''}>${l}</option>`).join('')}</select></label>
  <label>Display order<input name="sort_order" type="number" value="${Number(v?.sort_order||0)}"></label><label>Featured<select name="is_featured"><option value="false" ${!v?.is_featured?'selected':''}>No</option><option value="true" ${v?.is_featured?'selected':''}>Yes</option></select></label>
  <label>Publication approved<select name="publication_approved"><option value="false" ${!v?.publication_approved?'selected':''}>No</option><option value="true" ${v?.publication_approved?'selected':''}>Yes</option></select></label><label>Publish on website<select name="is_published"><option value="false" ${!v?.is_published?'selected':''}>No</option><option value="true" ${v?.is_published?'selected':''}>Yes</option></select></label>
  <label>Child-identifiable content<select name="child_identifiable"><option value="false" ${!v?.child_identifiable?'selected':''}>No</option><option value="true" ${v?.child_identifiable?'selected':''}>Yes</option></select></label><label>Consent confirmed<select name="consent_confirmed"><option value="false" ${!v?.consent_confirmed?'selected':''}>No / Not yet</option><option value="true" ${v?.consent_confirmed?'selected':''}>Yes</option></select></label>
  <label class="full">Thumbnail URL (optional)<input name="thumbnail_url" type="url" value="${/^https:\/\//i.test(v?.thumbnail_url||'')?esc(v.thumbnail_url):''}" placeholder="https://..."></label><label class="full">Or upload thumbnail image<input name="thumbnail_file" type="file" accept="image/jpeg,image/png,image/webp"></label>
  <div class="full nis-consent-note"><strong>Safeguarding:</strong> child-identifiable videos cannot be published without confirmed consent. Publication approval is also required before public display.</div>
  <div class="full nis-v22-progress-wrap" id="v22pw" hidden><div class="nis-v22-progress-track"><span id="v22bar"></span></div><p id="v22pt">Preparing upload…</p></div>
  <div class="full admin-actions"><button class="btn btn-primary" id="v22save" type="submit">Save Video</button></div><p id="nisV22Status" class="full nis-enh-status"></p></form>`;
  document.getElementById('v22back').onclick=listAdmin;
  document.getElementById('v22form').onsubmit=async e=>{
    e.preventDefault();const a=adminInfo||await admin();if(!a)return st('Administrator session not available.','error');
    const f=new FormData(e.currentTarget),file=e.currentTarget.elements.video_file.files?.[0],external=String(f.get('external_url')||'').trim(),child=f.get('child_identifiable')==='true',consent=f.get('consent_confirmed')==='true',pub=f.get('is_published')==='true',approved=f.get('publication_approved')==='true';
    if(child&&pub&&!consent)return st('Child-identifiable video cannot be published until consent is confirmed.','error');if(pub&&!approved)return st('Confirm publication approval before publishing the video.','error');if(!file&&!v&&!externalOk(external))return st('Choose a video file or enter a valid YouTube/Vimeo URL.','error');if(!file&&external&&!externalOk(external))return st('The external URL must be a public YouTube or Vimeo HTTPS URL.','error');if(file&&!workerBase())return st('Direct upload is not configured yet.','error');
    const old=v?.storage_provider==='cloudflare-r2'?v.storage_key:'',btn=document.getElementById('v22save');btn.disabled=true;let up=null,th=String(f.get('thumbnail_url')||'').trim();
    try{
      const tf=e.currentTarget.elements.thumbnail_file.files?.[0];if(tf)th=await compressThumb(tf);if(!th&&v?.thumbnail_url)th=v.thumbnail_url;
      let vf;
      if(file){const w=document.getElementById('v22pw'),bar=document.getElementById('v22bar'),txt=document.getElementById('v22pt');w.hidden=false;up=await upload(file,p=>{bar.style.width=`${p.percent}%`;txt.textContent=p.percent===100?'Upload complete. Saving record…':`Uploading part ${p.part} of ${p.total} · ${p.percent}%`});vf={video_url:up.url,storage_provider:'cloudflare-r2',storage_key:up.key,original_filename:up.original_filename,mime_type:up.mime_type,file_size_bytes:up.file_size_bytes}}
      else if(external)vf={video_url:external,storage_provider:'external',storage_key:'',original_filename:'',mime_type:'',file_size_bytes:0};
      else vf={video_url:v.video_url,storage_provider:v.storage_provider||'external',storage_key:v.storage_key||'',original_filename:v.original_filename||'',mime_type:v.mime_type||'',file_size_bytes:Number(v.file_size_bytes||0)};
      const payload={title:String(f.get('title')||'').trim(),description:String(f.get('description')||'').trim(),category:f.get('category'),organisation_type:f.get('organisation_type'),sort_order:Number(f.get('sort_order'))||0,is_featured:f.get('is_featured')==='true',publication_approved:approved,is_published:pub,child_identifiable:child,consent_confirmed:consent,thumbnail_url:th,updated_at:new Date().toISOString(),updated_by:a.userId,...vf};if(!v)payload.created_by=a.userId;
      const r=v?await client.from('media_videos').update(payload).eq('id',v.id):await client.from('media_videos').insert(payload);if(r.error)throw new Error(r.error.message);if(old&&old!==payload.storage_key)try{await delObj(old)}catch(e){console.warn('Old R2 cleanup failed',e)}await publicVideos();listAdmin();
    }catch(e){if(up?.key)try{await delObj(up.key)}catch{}st('Save failed: '+(e?.message||e),'error');btn.disabled=false}
  }
}

function override(){document.addEventListener('click',e=>{const b=e.target.closest?.('[data-nis-enh="videos"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();listAdmin()},true)}
function marker(){const e=document.querySelector('#adminDashboard .mini-label');if(e)e.textContent='Website build v2.2.0 • Neon + R2'}
async function boot(){override();setInterval(marker,1800);await new Promise(r=>setTimeout(r,400));await publicVideos();marker()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
