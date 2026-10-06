import {validate, money, escapeHtml} from './core.js';
const KEY='customer-checker-v1';
export class MiroRepository {
  constructor(miro){this.miro=miro;this.items=new Map();}
  async list(){
    const cards=await this.miro.board.get({type:'app_card'});
    const result=[];
    for(const card of cards.filter(c=>c.owned)){
      const record=await card.getMetadata(KEY);
      if(record && record.version===1){this.items.set(card.id,card);result.push({...record,id:card.id});}
    }
    return result;
  }
  async add(input){
    const record={...validate(input),version:1,updatedAt:crypto.randomUUID()};
    const viewport=await this.miro.board.viewport.get();
    // Avoid scanning other board items: stale connectors can make findEmptySpace fail.
    const position={x:viewport.x+viewport.width/2,y:viewport.y+viewport.height/2};
    const card=await this.miro.board.createAppCard({title:escapeHtml(record.name),description:this.description(record),x:position.x,y:position.y,width:320,status:'connected'});
    // Keep a recoverable card if metadata persistence fails; never report it as saved.
    try{await card.setMetadata(KEY,record);}
    catch(error){throw new Error('The record could not be saved. An incomplete customer card may remain on the board; check it before retrying.');}
    this.items.set(card.id,card);return {...record,id:card.id};
  }
  async update(id,input,expectedVersion){
    const card=await this.miro.board.getById(id);
    if(!card || !card.owned)throw new Error('This customer is no longer available.');
    const previous=await card.getMetadata(KEY);
    if(previous?.updatedAt!==expectedVersion)throw new Error('This customer changed in another session. Refresh and edit the latest record.');
    const record={...validate(input),version:1,updatedAt:crypto.randomUUID()};
    await card.setMetadata(KEY,record);
    // Metadata is authoritative; presentation follows it.
    card.title=escapeHtml(record.name);card.description=this.description(record);
    try{await card.sync();}catch{ /* The saved table record can still be read. */ }
    return {...record,id};
  }
  description(r){return '<p>'+escapeHtml(r.booking)+'</p><p>'+escapeHtml(r.status)+' · '+(r.cents===null?'Amount not entered':money(r.cents))+'</p>';}
}
export class PreviewRepository {
  constructor(){
    this.rows=[
      {id:'sample-1',...validate({name:'Sample customer A',booking:'06/10/2026 + 10:00 - 11:00',amount:'250',status:'Paid'}),updatedAt:'1'},
      {id:'sample-2',...validate({name:'Sample customer B',booking:'07/10/2026 + 14:30 - 16:00',amount:'100',status:'Deposit'}),updatedAt:'1'},
      {id:'sample-3',...validate({name:'Sample customer C',booking:'08/10/2026 + 11:00 - 12:00',amount:'300',status:'Unpaid'}),updatedAt:'1'},
      {id:'sample-4',...validate({name:'Sample customer D',booking:'09/10/2026 + 09:30 - 10:30',amount:'150',status:'Quote'}),updatedAt:'1'}
    ];
  }
  async list(){return structuredClone(this.rows);}
  async add(input){const row={id:crypto.randomUUID(),...validate(input),updatedAt:crypto.randomUUID()};this.rows.push(row);return structuredClone(row);}
  async update(id,input,expectedVersion){const i=this.rows.findIndex(r=>r.id===id);if(i<0||this.rows[i].updatedAt!==expectedVersion)throw new Error('Refresh before editing this record.');this.rows[i]={id,...validate(input),updatedAt:crypto.randomUUID()};return structuredClone(this.rows[i]);}
}
