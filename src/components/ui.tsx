import {useEffect,useRef,type ReactNode} from 'react';
import {BookOpen,X,ArrowUpRight,Bot,LockKeyhole} from 'lucide-react';
import type {Citation,KnowledgeDoc,Message} from '../types';
import {staff} from '../data/seed';
import {citationSource} from '../lib/matcher';
export const labels:Record<string,string>={open:'Open',waiting:'Needs a human',resolved:'Resolved',unassigned:'Unassigned'};
export const formatTime=(date:string)=>new Date(date).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
export function Avatar({name,color='purple',small=false}:{name:string;color?:string;small?:boolean}){return <span aria-hidden="true" className={`avatar ${color} ${small?'small':''}`}>{name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>;}
export function Chip({status}:{status:string}){return <span className={`chip ${status}`}><i/>{labels[status]??status}</span>;}
export function Empty({title,children}:{title:string;children:ReactNode}){return <div className="empty"><BookOpen size={28}/><h3>{title}</h3><p>{children}</p></div>;}
export function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement;ref.current?.showModal();return()=>{previous?.focus();};},[]);
 return <dialog ref={ref} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal-head"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</dialog>;
}
export function CitationModal({citation,docs,onClose}:{citation:Citation;docs:KnowledgeDoc[];onClose:()=>void}){const source=citationSource(citation,docs);return <Modal title={source.doc?citation.title:'Source unavailable'} onClose={onClose}><div className="modal-body">{source.doc?<><span className="eyebrow">{citation.docId} · SECTION {citation.section}</span><blockquote>{citation.excerpt}</blockquote><p className="muted">Source version: {citation.updated.slice(0,10)}. {source.changed?'This document has changed. This excerpt preserves the section used for the original answer.':'This is the exact section used to generate the answer.'}</p></>:<p>This knowledge document has been deleted. The original message remains, but its source is no longer available.</p>}</div></Modal>;}
export function MessageList({messages,onCitation,customer=false}:{messages:Message[];onCitation:(c:Citation)=>void;customer?:boolean}){
 const end=useRef<HTMLDivElement>(null);useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[messages.length]);
 return <div className="messages">{messages.filter(m=>!customer||!['note','event'].includes(m.kind)).map(m=>m.kind==='event'?<div className="thread-event" key={m.id}><span/>{m.text}<span/></div>:<article className={`message ${m.kind}`} key={m.id}><div className="message-meta">{m.kind==='ai'?<Bot size={14}/>:m.kind==='note'?<LockKeyhole size={13}/>:null}<strong>{m.kind==='customer'?'Customer':m.kind==='ai'?'Relay AI':staff.find(s=>s.id===m.author)?.name??'Support team'}</strong>{m.kind==='note'&&<span>Internal note · team only</span>}<time dateTime={m.at}>{formatTime(m.at)}</time></div><div className="bubble">{m.text}</div>{m.citations?.map(c=><button key={c.docId+c.section} className="citation" onClick={()=>onCitation(c)}><BookOpen size={12}/>{c.title} · §{c.section}<ArrowUpRight size={12}/></button>)}{m.handoff&&<small className="muted">A staff handoff is available below.</small>}</article>)}<div ref={end}/></div>;
}
