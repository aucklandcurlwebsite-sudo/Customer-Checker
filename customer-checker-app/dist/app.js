import {STATUSES,COLORS,validate,totals,money,escapeHtml} from './core.js';
import {MiroRepository,PreviewRepository} from './repository.js';
const $=id=>document.getElementById(id);
let repo,rows=[],editing=null,busy=false,loading=false;
const preview=new URLSearchParams(location.search).get('preview')==='1';
function message(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
function setBusy(value){busy=value;$('fields').disabled=value||!repo;$('refresh').disabled=value||!repo;}
function inputs(){return {name:$('name').value,booking:$('booking').value,amount:$('amount').value,status:$('status').value};}
function stopEditing(){editing=null;$('customer-form').reset();$('form-title').textContent='Quick add customer';$('submit').textContent='Add customer';$('cancel').hidden=true;}
function render(){
 const summary=totals(rows),sum=STATUSES.reduce((n,s)=>n+summary[s].cents,0);
 $('totals').innerHTML=STATUSES.map((s,i)=>'<div class="total"><span class="total-name"><i class="swatch" style="background:'+COLORS[i]+'"></i>'+s+'</span><strong class="total-value">'+money(summary[s].cents)+'</strong><span class="subtle">'+summary[s].count+' customer'+(summary[s].count===1?'':'s')+'</span></div>').join('');
 $('record-count').textContent=rows.length+' customer'+(rows.length===1?'':'s');
 $('chart-total').textContent=money(sum)+' entered';
 const missing=STATUSES.reduce((n,s)=>n+summary[s].missing,0);
 $('missing-note').hidden=!missing;$('missing-note').textContent=missing+' customer'+(missing===1?' has':'s have')+' no amount entered. They are excluded from money totals.';
 $('legend').innerHTML=STATUSES.map((s,i)=>'<div class="legend-row"><i class="swatch" style="background:'+COLORS[i]+'"></i><span>'+s+'</span><span class="legend-value">'+money(summary[s].cents)+'</span></div>').join('');
 let angle=-Math.PI/2,paths='';
 for(let i=0;i<STATUSES.length;i++){
  const value=summary[STATUSES[i]].cents;if(!value||!sum)continue;
  const delta=value/sum*Math.PI*2;
  if(delta>=Math.PI*2-.000001)paths+='<circle cx="120" cy="120" r="102" fill="'+COLORS[i]+'"><title>'+STATUSES[i]+': '+money(value)+'</title></circle>';
  else {const next=angle+delta;const x1=120+102*Math.cos(angle),y1=120+102*Math.sin(angle),x2=120+102*Math.cos(next),y2=120+102*Math.sin(next);
   paths+='<path d="M120 120 L'+x1+' '+y1+' A102 102 0 '+(delta>Math.PI?1:0)+' 1 '+x2+' '+y2+' Z" fill="'+COLORS[i]+'" stroke="white" stroke-width="2"><title>'+STATUSES[i]+': '+money(value)+'</title></path>';angle=next;}
 }
 if(!sum)paths='<circle cx="120" cy="120" r="102" fill="#f4eeeb"/><text x="120" y="116" text-anchor="middle" fill="#694A47" font-size="15">No amounts yet</text><text x="120" y="140" text-anchor="middle" fill="#766c69" font-size="12">Enter an amount to begin</text>';
 $('pie').innerHTML=paths;$('pie').setAttribute('aria-label','Payment totals: '+STATUSES.map(s=>s+' '+money(summary[s].cents)).join(', '));
 $('empty').hidden=rows.length>0;
 const sorted=[...rows].sort((a,b)=>a.bookingSort-b.bookingSort||a.name.localeCompare(b.name));
 $('rows').innerHTML=sorted.map(r=>{const i=STATUSES.indexOf(r.status);return '<tr><td>'+escapeHtml(r.name)+'</td><td>'+escapeHtml(r.booking)+'</td><td class="numeric">'+(r.cents===null?'<span class="subtle">Not entered</span>':money(r.cents))+'</td><td><span class="pill" style="background:'+COLORS[i]+';color:'+(i===2?'white':'#382a28')+'">'+r.status+'</span></td><td><button type="button" class="quiet" data-edit="'+escapeHtml(r.id)+'" aria-label="Edit '+escapeHtml(r.name)+'">Edit</button></td></tr>';}).join('');
}
async function refresh(silent=false){
 if(!repo||busy||loading)return;loading=true;$('refresh').disabled=true;
 try{const next=await repo.list();totals(next);rows=next;render();if(!silent)message('Customer records refreshed.');$('mode').textContent=preview?'Temporary preview':'Saved to this Miro board';return true;}
 catch(error){if(!silent)message('Could not load customer records. '+error.message,true);else $('mode').textContent='Refresh failed. Your last loaded records remain visible.';return false;}
 finally{loading=false;$('refresh').disabled=busy||!repo;}
}
async function save(input){
 if(busy||!repo)throw new Error('The tracker is not ready.');validate(input);setBusy(true);
 try{
  const saved=editing?await repo.update(editing.id,input,editing.updatedAt):await repo.add(input);
  const i=rows.findIndex(r=>r.id===saved.id);if(i<0)rows.push(saved);else rows[i]=saved;
  render();const edited=!!editing;stopEditing();message(edited?'Customer updated. Totals and chart refreshed.':'Customer added. Totals and chart refreshed.');
  return {id:saved.id,name:saved.name,booking:saved.booking,status:saved.status,amount:saved.cents===null?null:saved.cents/100};
 }finally{setBusy(false);}
}
$('customer-form').addEventListener('submit',async e=>{e.preventDefault();try{await save(inputs());$('name').focus();}catch(error){message(error.message,true);}});
$('cancel').onclick=()=>{stopEditing();message('Edit cancelled.');};
$('refresh').onclick=()=>refresh();
$('rows').onclick=e=>{const button=e.target.closest('[data-edit]');if(!button||busy)return;const row=rows.find(r=>r.id===button.dataset.edit);if(!row)return;
 editing={...row};$('name').value=row.name;$('booking').value=row.booking;$('amount').value=row.cents===null?'':(row.cents/100).toFixed(2);$('status').value=row.status;
 $('form-title').textContent='Edit customer';$('submit').textContent='Save changes';$('cancel').hidden=false;message('');$('name').focus();};
async function connect(){
 if(preview){repo=new PreviewRepository();$('mode').textContent='Temporary preview';$('preview-note').hidden=false;}
 else{
  if(window.parent===window){$('mode').textContent='Open this app inside Miro';message('Install Customer Checker in Miro to add and save customers. This page does not save data outside Miro.',true);render();return;}
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://miro.com/app/static/sdk/v2/miro.js';script.onload=resolve;script.onerror=()=>reject(new Error('Miro could not connect. Reopen the app.'));document.head.append(script);});
  await miro.board.getInfo();repo=new MiroRepository(miro);$('mode').textContent='Saved to this Miro board';
 }
 if(!await refresh(true))throw new Error('Could not load saved customers. Reopen the app or check your Miro permissions.');setBusy(false);
 if(!preview)setInterval(()=>{if(!busy&&!editing&&!document.hidden)refresh(true);},15000);
 registerTools();
}
function registerTools(){
 const context=document.modelContext;if(!context?.registerTool)return;
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 const definitions=[
  {name:'read_customer_tracker',description:'Read customers and money totals from this tracker. Preview data is temporary.',annotations:{readOnlyHint:true,untrustedContentHint:true},inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>({preview,customers:rows.map(r=>({id:r.id,name:r.name,booking:r.booking,amount:r.cents===null?null:r.cents/100,status:r.status})),totals:totals(rows)})},
  {name:'add_customer',description:'Save a new customer to the current Miro board, and update the visible totals and pie chart. In preview mode it only adds a temporary preview record.',annotations:{readOnlyHint:false,untrustedContentHint:true},inputSchema:{type:'object',properties:{name:{type:'string'},booking:{type:'string',description:'dd/mm/yyyy + HH:mm'},amount:{type:'string',description:'Optional non-negative dollar amount'},status:{type:'string',enum:STATUSES}},required:['name','booking','status'],additionalProperties:false},execute:async input=>{if(editing)throw new Error('Cancel the current edit before adding a customer.');return save(input);}}
 ];
 for(const t of definitions)Promise.resolve(context.registerTool(t,{signal:lifecycle.signal})).catch(()=>{});
}
connect().catch(error=>{repo=null;setBusy(false);$('mode').textContent='Connection unavailable';message(error.message,true);});
