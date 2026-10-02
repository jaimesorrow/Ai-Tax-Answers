import crypto from 'node:crypto';

export const PLANS = Object.freeze({free:{id:'free',name:'Free',monthlyInterviews:3},plus:{id:'plus',name:'Plus',monthlyInterviews:100},season:{id:'season',name:'Tax Season Pass',monthlyInterviews:100}});
export const TOPICS = Object.freeze([{id:'dependents',label:'Dependents & filing status'},{id:'self-employment',label:'1099 & self-employment'},{id:'deductions',label:'Deductions & credits'},{id:'payments',label:'Estimated taxes & payments'},{id:'other',label:'Another federal tax question'}]);
const records=new Map();
const monthKey=()=>new Date().toISOString().slice(0,7);
export const validClientId=value=>typeof value==='string'&&/^[a-f0-9-]{20,80}$/i.test(value);
export const newClientId=()=>crypto.randomUUID();
export function getUsage(clientId,plan='free'){const selected=PLANS[plan]||PLANS.free;const key=`${clientId}:${monthKey()}`;const used=records.get(key)||0;return{plan:selected.id,planName:selected.name,used,limit:selected.monthlyInterviews,remaining:Math.max(0,selected.monthlyInterviews-used)}}
export function consumeInterview(clientId,plan='free'){const usage=getUsage(clientId,plan);if(usage.remaining<1)return{...usage,allowed:false};records.set(`${clientId}:${monthKey()}`,usage.used+1);return{...getUsage(clientId,plan),allowed:true}}
export function refundInterview(clientId){const key=`${clientId}:${monthKey()}`;records.set(key,Math.max(0,(records.get(key)||0)-1))}
