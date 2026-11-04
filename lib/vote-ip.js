import { isIP } from 'node:net';
export function requestVoteIP(request) {
 const raw = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') : process.env.NODE_ENV !== 'production' ? '127.0.0.1' : '';
 if (!raw || raw.includes(',') || !isIP(raw.trim())) return null;
 const ip=raw.trim();
 if(isIP(ip)===4)return ip;
 const canonical=new URL('http://['+ip+']/').hostname.slice(1,-1);
 const mapped=canonical.match(/^::ffff:([a-f\d]{1,4}):([a-f\d]{1,4})$/);
 if(mapped){const high=parseInt(mapped[1],16),low=parseInt(mapped[2],16);return [high>>8,high&255,low>>8,low&255].join('.');}
 return canonical;
}
