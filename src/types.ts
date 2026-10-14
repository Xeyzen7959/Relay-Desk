export type Status = 'open' | 'waiting' | 'resolved';
export type Role = 'agent' | 'viewer';
export type Citation = { docId: string; section: number; title: string; excerpt: string; updated: string };
export type Message = { id: string; kind: 'customer' | 'ai' | 'staff' | 'note' | 'event'; text: string; at: string; author?: string; citations?: Citation[]; handoff?: boolean };
export type Conversation = { id: string; customer: string; email: string; company: string; order: string; plan: string; subject: string; topic: string; status: Status; assignee: string; paused: boolean; messages: Message[] };
export type KnowledgeDoc = { id: string; title: string; category: string; updated: string; sections: { heading: string; text: string }[] };
export type State = { version: 1; settings: { workspace: string; greeting: string; fallback: string; autoReply: boolean; role: Role }; docs: KnowledgeDoc[]; conversations: Conversation[]; chatId: string | null };
