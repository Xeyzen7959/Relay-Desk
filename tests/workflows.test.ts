import test from 'node:test';
import assert from 'node:assert/strict';
import {seedState,documents} from '../src/data/seed.ts';
import {matchAnswer,citationSource,requiresStaff} from '../src/lib/matcher.ts';
import {reduceState,loadState,filterConversations,stats} from '../src/lib/state.ts';
import type {State} from '../src/types.ts';
const fallback='No reliable answer. Ask our team.';
const ask=(text:string)=>matchAnswer(text,documents,fallback);
function conversation(s:State){return s.conversations.find(c=>c.id===s.chatId)!;}
test('seed includes 12 consistent conversations and eight structured documents',()=>{
 const s=seedState();assert.equal(s.conversations.length,12);assert.equal(s.docs.length,8);assert.equal(new Set(s.conversations.map(c=>c.id)).size,12);assert.ok(s.docs.every(d=>d.sections.length===2));assert.deepEqual(stats(s),{open:6,unassigned:3,waiting:3,resolved:3});
});
test('known shipping question returns section text and supporting citation',()=>{
 const a=ask('How long does standard shipping take?');assert.equal(a.citations[0].docId,'KB-002');assert.equal(a.citations[0].section,1);assert.match(a.text,/3–5 business days/);assert.equal(a.handoff,false);
});
test('return and technical questions match distinct sources',()=>{
 assert.equal(ask('What is the return window for unused items?').citations[0]?.docId,'KB-003');assert.equal(ask('What are the API rate limits?').citations[0]?.docId,'KB-006');assert.equal(ask('How many times are failed webhook deliveries retried?').citations[0]?.section,2);
});
test('unknown or weak queries fall back without fabricated citations',()=>{
 for(const q of ['Will a dragon eat the moon?','hello','shipping quantum dragon broccoli','What is the weather in Tokyo?','']){const a=ask(q);assert.equal(a.text,fallback,q);assert.equal(a.handoff,true);assert.deepEqual(a.citations,[]);}
});
test('account-specific actions always offer a human and do not claim execution',()=>{
 for(const q of ['Please refund my last payment.','Can you refund my payment?','Check my order NS-1036','Please change my email','I lost my authenticator and backup codes.','I want to speak to a human']){const a=ask(q);assert.equal(a.handoff,true,q);assert.match(a.text,/cannot access accounts or perform actions/,q);assert.equal(a.citations.length,0);}
});
test('self-service password instructions remain answerable',()=>{assert.equal(ask('How do I reset my password?').citations[0]?.docId,'KB-004');});
test('same input and documents produce identical answers',()=>{assert.deepEqual(ask('What is the return window for unused items?'),ask('What is the return window for unused items?'));});
test('citation resolves exact excerpt and reports edited or unavailable sources',()=>{
 const a=ask('How long does standard shipping take?');const c=a.citations[0];assert.equal(citationSource(c,documents).excerpt,a.text);const changed=structuredClone(documents);changed[1].sections[0].text='Standard shipping takes 9 days.';assert.equal(citationSource(c,changed).changed,true);assert.equal(citationSource(c,changed).excerpt,a.text);assert.equal(citationSource(c,[]).excerpt,null);
});
test('handoff updates the same inbox conversation and pauses future AI replies',()=>{
 let s=reduceState(seedState(),{type:'customer',text:'How long does standard shipping take?'});const id=s.chatId!;s=reduceState(s,{type:'answer',id});assert.equal(conversation(s).messages.at(-1)?.kind,'ai');s=reduceState(s,{type:'handoff',id});assert.equal(conversation(s).status,'waiting');assert.equal(conversation(s).paused,true);const length=s.conversations.length;s=reduceState(s,{type:'handoff',id});assert.equal(s.conversations.length,length);s=reduceState(s,{type:'customer',text:'Are you there?'});const before=conversation(s).messages.length;s=reduceState(s,{type:'answer',id});assert.equal(conversation(s).messages.length,before);
});
test('staff reply appears in shared chat while notes remain separately typed',()=>{
 let s=reduceState(seedState(),{type:'customer',text:'Please refund my last payment.'});const id=s.chatId!;s=reduceState(s,{type:'handoff',id});s=reduceState(s,{type:'message',id,text:'I can review this request with you.'});s=reduceState(s,{type:'message',id,text:'Billing review needed.',note:true});const customerVisible=conversation(s).messages.filter(m=>!['note','event'].includes(m.kind));assert.equal(customerVisible.at(-1)?.text,'I can review this request with you.');assert.equal(conversation(s).messages.at(-1)?.kind,'note');assert.equal(conversation(s).paused,true);
});
test('only explicit resume enables replies after handoff',()=>{
 let s=reduceState(seedState(),{type:'customer',text:'Hello'});const id=s.chatId!;s=reduceState(s,{type:'handoff',id});s=reduceState(s,{type:'status',id,value:'open'});assert.equal(conversation(s).paused,true);s=reduceState(s,{type:'resume',id});assert.equal(conversation(s).paused,false);s=reduceState(s,{type:'customer',text:'How long does standard shipping take?'});s=reduceState(s,{type:'answer',id});assert.equal(conversation(s).messages.at(-1)?.kind,'ai');
});
test('automatic replies off blocks generation',()=>{let s=reduceState(seedState(),{type:'settings',settings:{autoReply:false}});s=reduceState(s,{type:'customer',text:'What are the API rate limits?'});assert.deepEqual(reduceState(s,{type:'answer',id:s.chatId!}),s);});
test('empty replies and empty customer inputs are rejected',()=>{const s=seedState();assert.deepEqual(reduceState(s,{type:'message',id:'c-1001',text:'  '}),s);assert.deepEqual(reduceState(s,{type:'customer',text:'\n  '}),s);});
test('assignment and status record activity',()=>{let s=reduceState(seedState(),{type:'assign',id:'c-1001',value:'leo'});assert.equal(s.conversations[0].assignee,'leo');assert.match(s.conversations[0].messages.at(-1)!.text,/Leo Martinez/);s=reduceState(s,{type:'status',id:'c-1001',value:'resolved'});assert.equal(s.conversations[0].status,'resolved');assert.match(s.conversations[0].messages.at(-1)!.text,/resolved/);});
test('filters find customer, subject and message text and intersect assignees',()=>{const s=seedState();assert.equal(filterConversations(s.conversations,'Olivia')[0].id,'c-1001');assert.equal(filterConversations(s.conversations,'renewal charge')[0].id,'c-1002');assert.equal(filterConversations(s.conversations,'Safari')[0].id,'c-1003');assert.equal(filterConversations(s.conversations,'','waiting','ava').length,1);assert.equal(filterConversations(s.conversations,'','unassigned').length,3);assert.equal(filterConversations(s.conversations,'not-a-result').length,0);});
test('knowledge edit immediately changes subsequent answers',()=>{let s=seedState();const d=structuredClone(s.docs[1]);d.sections[0].text='Standard shipping takes 6 business days after dispatch.';s=reduceState(s,{type:'saveDoc',doc:d});assert.match(matchAnswer('How long does standard shipping take?',s.docs,fallback).text,/6 business days/);s=reduceState(s,{type:'deleteDoc',id:d.id});assert.equal(matchAnswer('How long does standard shipping take?',s.docs,fallback).citations.some(c=>c.docId===d.id),false);});
test('document creation validates title and sections',()=>{const s=seedState();const d={id:'KB-NEW',title:'',category:'Billing',updated:'2026-10-14',sections:[{heading:'Details',text:'Content'}]};assert.deepEqual(reduceState(s,{type:'saveDoc',doc:d}),s);const next=reduceState(s,{type:'saveDoc',doc:{...d,title:'New policy'}});assert.equal(next.docs.length,9);});
test('round-trip persistence retains edits and reset restores full seed',()=>{let s=reduceState(seedState(),{type:'customer',text:'Test message'});s=reduceState(s,{type:'settings',settings:{workspace:'Test workspace'}});assert.deepEqual(loadState(JSON.stringify(s)),{state:s,recovered:false});assert.deepEqual(reduceState(s,{type:'reset'}),seedState());});
test('malformed and outdated nested storage recovers gracefully',()=>{for(const raw of ['{','null','{}','{"version":2}',JSON.stringify({...seedState(),docs:[null]}),JSON.stringify({...seedState(),conversations:[{id:'bad'}]}),JSON.stringify({...seedState(),settings:{}})])assert.equal(loadState(raw).recovered,true);const s=seedState();s.conversations[0].messages[0].at='not-a-date';assert.equal(loadState(JSON.stringify(s)).recovered,true);assert.equal(loadState(null).recovered,false);});
test('viewer guard blocks mutations, including chat, notes, documents and reset',()=>{const s=reduceState(seedState(),{type:'role',role:'viewer'});const actions=[{type:'reset'},{type:'customer',text:'hello'},{type:'settings',settings:{workspace:'No'}},{type:'deleteDoc',id:'KB-001'},{type:'message',id:'c-1001',text:'No'},{type:'assign',id:'c-1001',value:'leo'}] as const;for(const action of actions)assert.deepEqual(reduceState(s,action),s);assert.equal(reduceState(s,{type:'role',role:'agent'}).settings.role,'agent');});
test('reopening a resolved customer thread preserves its identity',()=>{let s=reduceState(seedState(),{type:'customer',text:'Question'});const id=s.chatId!;s=reduceState(s,{type:'status',id,value:'resolved'});s=reduceState(s,{type:'customer',text:'One more question'});assert.equal(s.chatId,id);assert.equal(conversation(s).status,'open');});
