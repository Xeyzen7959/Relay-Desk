import type { State, KnowledgeDoc, Conversation } from '../types.ts';
export const staff = [
  { id:'maya', name:'Maya Chen', role:'Support lead', initials:'MC', color:'purple' },
  { id:'leo', name:'Leo Martinez', role:'Technical specialist', initials:'LM', color:'blue' },
  { id:'ava', name:'Ava Brooks', role:'Billing specialist', initials:'AB', color:'peach' },
];
export const categories = ['Billing','Delivery','Returns','Account','Technical'];
export const documents: KnowledgeDoc[] = [
 {id:'KB-001',title:'Plans & billing',category:'Billing',updated:'2026-10-10',sections:[
 {heading:'Monthly subscriptions',text:'Northstar Commerce Starter costs $29 per month and Growth costs $79 per month. Subscriptions renew monthly on the signup date. Prices are in USD before applicable taxes.'},
 {heading:'Invoices and payments',text:'View invoices in Settings → Billing → Invoices. Payments support Visa and Mastercard. If a payment fails, check the card expiry and contact your bank before trying again.'}]},
 {id:'KB-002',title:'Shipping & delivery',category:'Delivery',updated:'2026-10-09',sections:[
 {heading:'Delivery timeframes',text:'For orders placed with the fictional Northstar Demo Store, standard shipping takes 3–5 business days after dispatch and costs $4.95. Orders of $50 or more qualify for free standard shipping. Express shipping takes 1–2 business days and costs $12.'},
 {heading:'Tracking an order',text:'A tracking link appears in the dispatch email. Tracking may take 24 hours to update after dispatch. If tracking is unchanged for more than 3 business days, contact support with your order reference. This demo cannot check a live delivery.'}]},
 {id:'KB-003',title:'Returns & refunds',category:'Returns',updated:'2026-10-11',sections:[
 {heading:'Return eligibility',text:'Demo Store items can be returned within 30 days of delivery if unused and in their original packaging. Final-sale items are excluded. Return shipping costs $4.95 unless the item is damaged or incorrect.'},
 {heading:'Refund processing',text:'After a returned item is received and inspected, approved refunds take 5–10 business days to reach the original payment method. A support agent must review individual requests. The demo cannot issue or approve a refund.'}]},
 {id:'KB-004',title:'Account access & security',category:'Account',updated:'2026-10-08',sections:[
 {heading:'Resetting a password',text:'On the Northstar sign-in page, choose Forgot password and enter your account email. Reset links expire after 30 minutes. Check spam if no email arrives. This demo does not send emails or reset passwords.'},
 {heading:'Two-factor authentication',text:'Enable two-factor authentication in Settings → Security using an authenticator app. Store backup codes somewhere safe. If you lose access to both, a support agent must verify your identity outside this demo.'}]},
 {id:'KB-005',title:'Storefront troubleshooting',category:'Technical',updated:'2026-10-12',sections:[
 {heading:'Storefront loading errors',text:'For a blank storefront or a loading error, refresh the page, try a private browser window, and temporarily disable extensions. Check whether the issue also occurs on a second browser. Share the error text with support if it persists.'},
 {heading:'Custom domain setup',text:'Connect a custom domain in Settings → Domains. Use a CNAME record for the shop subdomain pointing to stores.northstar.example. DNS changes can take up to 48 hours. This is an illustrative example domain, not a live service.'}]},
 {id:'KB-006',title:'Integrations & API limits',category:'Technical',updated:'2026-10-10',sections:[
 {heading:'API rate limits',text:'The fictional Northstar API allows 100 requests per minute per workspace. A 429 response indicates the limit was reached. Respect the Retry-After header and retry with exponential backoff.'},
 {heading:'Webhook delivery',text:'Webhook deliveries are retried up to 3 times over 15 minutes after a failed response. Return a 2xx status promptly and process the payload asynchronously. Review delivery records in Settings → Integrations.'}]},
 {id:'KB-007',title:'Team members & permissions',category:'Account',updated:'2026-10-07',sections:[
 {heading:'Inviting teammates',text:'Growth workspaces include 5 team seats; Starter includes 1 seat. Workspace owners can invite teammates from Settings → Team. An invitation expires after 7 days. This demo cannot send invitations.'},
 {heading:'Role permissions',text:'In the fictional product, owners manage billing and members, agents handle support, and viewers read workspace information. RelayDesk role switching only demonstrates UI behavior and is not secure authorization.'}]},
 {id:'KB-008',title:'Damaged orders & cancellations',category:'Returns',updated:'2026-10-11',sections:[
 {heading:'Damaged or incorrect items',text:'Report damaged or incorrect Demo Store items within 7 days of delivery. Provide an order reference and a description of the issue to staff. Staff will review the next steps; replacements are never automatically approved.'},
 {heading:'Order cancellations',text:'Orders can be reviewed for cancellation before dispatch. Once dispatched, the standard return policy applies. Contact staff for an individual review. This demo cannot cancel orders or change delivery addresses.'}]},
];
const rows = [
 ['c-1001','Olivia Rhye','Willow & Co.','NS-1042','Growth','When will my order arrive?','Delivery','open','maya','My order NS-1042 was dispatched yesterday. How long does standard shipping take?'],
 ['c-1002','Phoenix Baker','Studio Form','NS-1043','Starter','An unexpected renewal charge','Billing','waiting','ava','Please refund my latest subscription charge. I meant to cancel before renewal.'],
 ['c-1003','Lana Steiner','Moss Market','NS-1038','Growth','Storefront is not loading','Technical','open','leo','My storefront shows a blank page in Safari. What should I try?'],
 ['c-1004','Demi Wilkinson','Sunday Goods','NS-1040','Growth','Returning an unused item','Returns','open','','What is the return window for an unused item in its original packaging?'],
 ['c-1005','Drew Cano','Common Ground','NS-1037','Starter','Locked out of my account','Account','waiting','','I lost my authenticator and my backup codes. Please unlock my account.'],
 ['c-1006','Natali Craig','Paper & Pine','NS-1035','Growth','Where are my invoices?','Billing','resolved','ava','Where can I download my monthly invoices?'],
 ['c-1007','Orlando Diggs','Fieldwork','NS-1045','Growth','Webhook retry behavior','Technical','open','leo','How many times are failed webhook deliveries retried?'],
 ['c-1008','Andi Lane','Kin Studio','NS-1039','Starter','My order arrived damaged','Returns','waiting','maya','My order NS-1039 arrived damaged today. Can you replace it?'],
 ['c-1009','Kate Morrison','Fern Supply','NS-1046','Growth','Adding two teammates','Account','open','','How many team seats are included in the Growth plan?'],
 ['c-1010','Kelly Williams','Westward','NS-1036','Starter','Tracking has not updated','Delivery','open','maya','My tracking has not changed in four business days. Can you check order NS-1036?'],
 ['c-1011','Alex Morgan','Objects Studio','NS-1041','Growth','API rate limit question','Technical','resolved','leo','What does an API 429 response mean?'],
 ['c-1012','Sam Wilson','Evergreen','NS-1044','Starter','Express shipping options','Delivery','resolved','maya','How much does express shipping cost?'],
];
export function seedState():State {
 const conversations:Conversation[]=rows.map((r,i)=>({id:r[0],customer:r[1],email:r[1].toLowerCase().replace(' ','.')+'@example.com',company:r[2],order:r[3],plan:r[4],subject:r[5],topic:r[6],status:r[7] as Conversation['status'],assignee:r[8],paused:r[7]==='waiting',messages:[
 {id:`seed-${i}-1`,kind:'customer',text:r[9],at:`2026-10-14T${String(14-Math.floor(i/4)).padStart(2,'0')}:${String(50-i*3).padStart(2,'0')}:00Z`},
 ...(r[7]==='waiting'?[{id:`seed-${i}-2`,kind:'event' as const,text:'Customer requested human support. Automatic replies paused.',at:'2026-10-14T14:55:00Z'}]:[]),
 ...(r[7]==='resolved'?[{id:`seed-${i}-3`,kind:'staff' as const,author:r[8],text:i===5?'You can find your invoices in Settings → Billing → Invoices.':i===10?'A 429 response means the 100 requests per minute workspace limit was reached. Please respect Retry-After and use exponential backoff.':'Express shipping is $12 and takes 1–2 business days after dispatch.',at:'2026-10-14T14:56:00Z'},{id:`seed-${i}-4`,kind:'event' as const,text:'Conversation marked resolved.',at:'2026-10-14T14:57:00Z'}]:[])
 ]}));
 return {version:1,settings:{workspace:'Northstar Commerce',greeting:'Hi there! I’m Relay, your Northstar guide. What can I help you with today?',fallback:'I could not find a reliable answer in the workspace knowledge. Try rephrasing, or ask our support team for help.',autoReply:true,role:'agent'},docs:structuredClone(documents),conversations,chatId:null};
}
