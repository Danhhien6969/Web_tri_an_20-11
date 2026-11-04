import test from 'node:test';
import assert from 'node:assert/strict';
import { requestVoteIP } from '../lib/vote-ip.js';
test('uses trusted Vercel IP, canonicalizes addresses and rejects missing or ambiguous IP',()=>{
 const old=process.env.VERCEL;process.env.VERCEL='1';
 try{
 const req=headers=>new Request('https://example.com',{headers});
 assert.equal(requestVoteIP(req({'x-vercel-forwarded-for':'192.0.2.1','x-forwarded-for':'192.0.2.2'})),'192.0.2.1');
 assert.equal(requestVoteIP(req({'x-vercel-forwarded-for':'::ffff:192.0.2.1'})),'192.0.2.1');
 assert.equal(requestVoteIP(req({'x-vercel-forwarded-for':'2001:0db8:0:0:0:0:0:1'})),'2001:db8::1');
 assert.equal(requestVoteIP(req({'x-vercel-forwarded-for':'192.0.2.1, 192.0.2.2'})),null);
 assert.equal(requestVoteIP(req({})),null);
 }finally{if(old===undefined)delete process.env.VERCEL;else process.env.VERCEL=old;}
});
