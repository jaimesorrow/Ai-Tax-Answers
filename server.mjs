import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {answer,validateInput} from './engine.mjs';
const assets = {'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
export function createServer(config={}) {
  const apiKey=config.apiKey ?? process.env.OPENAI_API_KEY;
  let active=0;
  return http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
    if(req.method==='GET' && req.url==='/api/health') return send(200,{connected:!!apiKey});
    if(req.method==='GET' && assets[req.url]) {const [file,type]=assets[req.url];res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});return res.end(await readFile(new URL('./public/'+file,import.meta.url)));}
    if(req.method!=='POST'||req.url!=='/api/chat') return send(404,{error:'Not found'});
    if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}` && req.headers.origin!==`https://${req.headers.host}`) return send(403,{error:'Invalid origin'});
    if(active>=4) return send(429,{error:'The assistant is busy. Try again shortly.'});
    active++;
    try {
      let raw=''; for await(const chunk of req) {raw+=chunk;if(Buffer.byteLength(raw)>64000) {send(413,{error:'Conversation too large'});return;}}
      let messages;try{messages=validateInput(JSON.parse(raw));}catch(e){return send(400,{error:e.message});}
      if(!apiKey) return send(503,{error:'Live AI is not connected yet. Add the server API key to enable IRS answers.'});
      send(200,await answer(messages,{apiKey,model:process.env.OPENAI_MODEL,fetcher:config.fetcher}));
    } catch {send(502,{error:'Could not verify an IRS answer right now. Please try again.'});} finally {active--;}
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)) createServer().listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Tax Answers running on port '+(process.env.PORT||3000)));
