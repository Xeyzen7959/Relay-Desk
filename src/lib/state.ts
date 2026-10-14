import {seedState,staff,categories} from '../data/seed.ts';
import {matchAnswer} from './matcher.ts';
import type {State,Conversation,Message,Status,KnowledgeDoc} from '../types.ts';
export const STORAGE_KEY='relaydesk.demo.v1';
export const uid=()=>globalThis.crypto.randomUUID();
const now=()=>new Date().toISOString();
const event=(text:string):Message=>({id:uid(),kind:'event',text,at:now()});
export function filterConversations(items:Conversation[],query='',status='all',assignee='all'){
 const q=query.trim().toLowerCase();return items.filter(c=>(status==='all'||status==='unassigned'&&!c.assignee||c.status===status)&&(assignee==='all'||c.assignee===assignee)&&[c.customer,c.subject,...c.messages.map(m=>m.text)].some(s=>s.toLowerCase().includes(q)));
}
export type Action = {type:'assign';id:string;value:string}|{type:'status';id:string;value:Status}|{type:'resume';id:string}|{type:'message';id:string;text:string;note?:boolean}|{type:'customer';text:string}|{type:'answer';id:string}|{type:'handoff';id:string}|{type:'saveDoc';doc:KnowledgeDoc}|{type:'deleteDoc';id:string}|{type:'settings';settings:Partial<State['settings']>}|{type:'role';role:'agent'|'viewer'}|{type:'reset'};
export function reduceState(state:State,action:Action):State{
 if(action.type==='role')return {...state,settings:{...state.settings,role:action.role}};
 if(state.settings.role==='viewer')return state;
 if(action.type==='reset')return seedState();
 let next=structuredClone(state);
 if(action.type==='settings'){next.settings={...next.settings,...action.settings};return next;}
 if(action.type==='saveDoc'){if(!action.doc.title.trim()||!action.doc.sections.length||action.doc.sections.some(s=>!s.heading.trim()||!s.text.trim()))return state;const index=next.docs.findIndex(d=>d.id===action.doc.id);if(index<0)next.docs.push(action.doc);else next.docs[index]=action.doc;return next;}
 if(action.type==='deleteDoc'){next.docs=next.docs.filter(d=>d.id!==action.id);return next;}
 if(action.type==='customer'){
  if(!action.text.trim())return state;
  let c=next.conversations.find(c=>c.id===next.chatId);
  if(!c){c={id:uid(),customer:'Jamie Parker',email:'jamie.parker@example.com',company:'Demo visitor',order:'NS-1050',plan:'Growth',subject:action.text.trim().slice(0,72),topic:'General',status:'open',assignee:'',paused:false,messages:[]};next.conversations.unshift(c);next.chatId=c.id;}
  if(c.status==='resolved'){c.status='open';c.messages.push(event('Customer reopened the conversation.'));}
  c.messages.push({id:uid(),kind:'customer',text:action.text.trim(),at:now()});return next;
 }
 const c=next.conversations.find(c=>c.id===action.id);if(!c)return state;
 switch(action.type){
  case 'assign': if(action.value&&!staff.some(s=>s.id===action.value))return state;c.assignee=action.value;c.messages.push(event(`Assigned to ${staff.find(s=>s.id===action.value)?.name??'no agent'}.`));break;
  case 'status': c.status=action.value;c.messages.push(event(`Status changed to ${action.value==='waiting'?'awaiting human support':action.value}.`));if(action.value==='waiting')c.paused=true;break;
  case 'resume':c.paused=false;if(c.status==='waiting')c.status='open';c.messages.push(event('Automatic replies explicitly resumed by Maya Chen.'));break;
  case 'handoff':if(c.paused&&c.status==='waiting')return state;c.paused=true;c.status='waiting';c.messages.push(event('Human handoff requested. Automatic replies paused until an agent resumes them.'));break;
  case 'message':if(!action.text.trim())return state;c.messages.push({id:uid(),kind:action.note?'note':'staff',author:'maya',text:action.text.trim(),at:now()});break;
  case 'answer':{
   if(c.paused||!next.settings.autoReply)return state;
   const last=c.messages.at(-1);if(last?.kind!=='customer')return state;
   const answer=matchAnswer(last.text,next.docs,next.settings.fallback);
   c.messages.push({id:uid(),kind:'ai',text:answer.text,at:now(),citations:answer.citations,handoff:answer.handoff});
   if(answer.citations.length)c.topic=next.docs.find(d=>d.id===answer.citations[0].docId)?.category??'General';break;
  }
 }
 return next;
}
// Validate every nested value consumed by rendering. Unknown versions reset safely.
export function loadState(raw:string|null):{state:State;recovered:boolean}{
 if(!raw)return {state:seedState(),recovered:false};
 try{
  const s=JSON.parse(raw);const str=(x:unknown)=>typeof x==='string';const date=(x:unknown)=>str(x)&&Number.isFinite(Date.parse(x as string));
  const strings=(o:any,keys:string[])=>o&&keys.every(k=>str(o[k]));
  const valid=s?.version===1&&strings(s.settings,['workspace','greeting','fallback'])&&s.settings.workspace.trim()&&s.settings.greeting.trim()&&s.settings.fallback.trim()&&['agent','viewer'].includes(s.settings.role)&&typeof s.settings.autoReply==='boolean'
   &&Array.isArray(s.docs)&&s.docs.every((d:any)=>strings(d,['id','title','category','updated'])&&d.title.trim()&&date(d.updated)&&Array.isArray(d.sections)&&d.sections.length&&d.sections.every((p:any)=>strings(p,['heading','text'])&&p.heading.trim()&&p.text.trim()))
   &&Array.isArray(s.conversations)&&s.conversations.every((c:any)=>strings(c,['id','customer','email','company','order','plan','subject','topic','assignee'])&&['open','waiting','resolved'].includes(c.status)&&typeof c.paused==='boolean'&&(!c.assignee||staff.some(x=>x.id===c.assignee))&&Array.isArray(c.messages)&&c.messages.every((m:any)=>strings(m,['id','kind','text','at'])&&date(m.at)&&['customer','ai','staff','note','event'].includes(m.kind)&&(m.author===undefined||str(m.author))&&(m.handoff===undefined||typeof m.handoff==='boolean')&&(m.citations===undefined||Array.isArray(m.citations)&&m.citations.every((r:any)=>strings(r,['docId','title','excerpt','updated'])&&Number.isInteger(r.section)&&r.section>0))))
   &&(s.chatId===null||typeof s.chatId==='string'&&s.conversations.some((c:any)=>c.id===s.chatId))
   &&new Set(s.docs.map((d:any)=>d.id)).size===s.docs.length&&new Set(s.conversations.map((c:any)=>c.id)).size===s.conversations.length;
  if(!valid)throw Error('Invalid demo data');return {state:s,recovered:false};
 }catch{return {state:seedState(),recovered:true};}
}
export function stats(state:State){return {open:state.conversations.filter(c=>c.status==='open').length,unassigned:state.conversations.filter(c=>!c.assignee).length,waiting:state.conversations.filter(c=>c.status==='waiting').length,resolved:state.conversations.filter(c=>c.status==='resolved').length};}
export {categories};
