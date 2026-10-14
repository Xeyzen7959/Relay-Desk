import type { KnowledgeDoc, Citation } from '../types.ts';
const stop=new Set('a an the is are was do does can could would should i my me your you we our to of on in for with and or it this that how what when where please have has much many'.split(' '));
export function tokens(text:string):string[]{return [...new Set(text.toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(t=>t.length>1&&!stop.has(t)).map(t=>t.length>4&&t.endsWith('s')?t.slice(0,-1):t))];}
export function requiresStaff(q:string):boolean {
 return /\b(refund|cancel|delete|unlock|change|update|reset|replace|book|approve|send|invite)\s+(?:me\s+|my\s+|our\s+|the\s+|this\s+|a\s+)/i.test(q) && !/\b(how|policy|window|long|cost|can i|do i|where)\b/i.test(q)
 || /\b(check|track|look up|status of)\b.*\b(my|order|account|ns-\d+)\b/i.test(q)
 || /\b(lost|forgot)\b.*\b(authenticator|backup codes)\b/i.test(q)
 || /\b(human|person|agent|talk to|speak to)\b/i.test(q);
}
export function matchAnswer(question:string,docs:KnowledgeDoc[],fallback:string){
 if(requiresStaff(question)) return {text:'This request needs a support agent to review your account or order. I can explain general policies, but cannot access accounts or perform actions. Would you like a human handoff?',citations:[] as Citation[],handoff:true,score:0};
 const query=tokens(question);
 const ranked=docs.flatMap(d=>d.sections.map((s,i)=>{
 const body=tokens(s.text),head=tokens(s.heading),title=tokens(d.title);
 const hits=query.filter(t=>body.includes(t)||head.includes(t)||title.includes(t));
 const score=hits.reduce((n,t)=>n+(head.includes(t)?3:title.includes(t)?2:1),0);
 return {d,s,i,score,hits:hits.length};
 })).sort((a,b)=>b.score-a.score||a.d.id.localeCompare(b.d.id)||a.i-b.i);
 const best=ranked[0];
 if(!best||best.score<4||best.hits<2||best.hits/Math.max(query.length,1)<0.25) return {text:fallback,citations:[] as Citation[],handoff:true,score:best?.score??0};
 return {text:best.s.text,citations:[{docId:best.d.id,section:best.i+1,title:best.d.title,excerpt:best.s.text,updated:best.d.updated}],handoff:false,score:best.score};
}
export function citationSource(c:Citation,docs:KnowledgeDoc[]){const doc=docs.find(d=>d.id===c.docId);return {doc,changed:!!doc&&(doc.updated!==c.updated||doc.sections[c.section-1]?.text!==c.excerpt),excerpt:doc?c.excerpt:null};}
