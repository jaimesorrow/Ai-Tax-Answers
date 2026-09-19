import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {answer,validateInput} from './engine.mjs';
import {consumeInterview,getUsage,newClientId,refundInterview,TOPICS,validClientId} from './product.mjs';
const assets = {'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css'],'/product.css':['product.css','text/css']};
export function createServer(config={}) {
  const apiKey=config.apiKey ?? process.env.OPENAI_API_KEY;
  let active=0;
  return http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
    if(req.method==='GET' && req.url==='/api/health') return send(200,{connected:!!apiKey});
    if(req.method==='GET' && req.url==='/api/config') return send(200,{connected:!!apiKey,topics:TOPICS,freeMonthlyInterviews:3});
    if(req.method==='POST' && req.url==='/api/session') return send(200,{clientId:newClientId()});
    if(req.method==='GET' && req.url?.startsWith('/api/usage')) {const clientId=req.headers['x-client-id'];if(!validClientId(clientId))return send(400,{error:'Invalid client session'});return send(200,getUsage(clientId));}
    if(req.method==='GET' && assets[req.url]) {const [file,type]=assets[req.url];res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});return res.end(await readFile(new URL('./public/'+file,import.meta.url)));}
    if(req.method!=='POST'||req.url!=='/api/chat') return send(404,{error:'Not found'});
    if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}` && req.headers.origin!==`https://${req.headers.host}`) return send(403,{error:'Invalid origin'});
    if(active>=4) return send(429,{error:'The assistant is busy. Try again shortly.'});
    active++;
    try {
      let raw=''; for await(const chunk of req) {raw+=chunk;if(Buffer.byteLength(raw)>64000) {send(413,{error:'Conversation too large'});return;}}
      let body,messages;try{body=JSON.parse(raw);messages=validateInput(body);}catch(e){return send(400,{error:e.message});}
      if(!apiKey) return send(503,{error:'Live AI is not connected yet. Add the server API key to enable IRS answers.'});
      const clientId=req.headers['x-client-id'];if(!validClientId(clientId))return send(400,{error:'Start a valid client session first.'});
      const firstTurn=messages.length===1;const usage=firstTurn?consumeInterview(clientId):getUsage(clientId);
      if(firstTurn&&!usage.allowed)return send(429,{error:'You have used your 3 free interviews for this month.',code:'FREE_LIMIT',usage});
      try{send(200,{...(await answer(messages,{apiKey,model:process.env.OPENAI_MODEL,fetcher:config.fetcher,topic:body.topic})),usage});}catch(e){if(firstTurn)refundInterview(clientId);throw e;}
    } catch {send(502,{error:'Could not verify an IRS answer right now. Please try again.'});} finally {active--;}
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)) createServer().listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Tax Answers running on port '+(process.env.PORT||3000)));
