'use client';
import { useEffect, useRef } from 'react';
export default function WelcomeFireworks({ onDone }) {
 const canvasRef=useRef(null);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){onDone();return;}
  const canvas=canvasRef.current,ctx=canvas.getContext('2d');
  if(!ctx){onDone();return;}
  let width,height,frame,previous=0,start=null,launched=false;
  const particles=[],colors=['#ff1644','#ffba36','#ffda77','#ff7ba2','#42b9df'];
  function resize(){width=window.innerWidth;height=window.innerHeight;const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);}
  resize();window.addEventListener('resize',resize);
  function launch(){
   const count=width<600?22:38;
   for(const side of [-1,1])for(let i=0;i<count;i++){
    const angle=-Math.PI/2+side*(.35+Math.random()*.8);
    const speed=height*(.45+Math.random()*.3);
    particles.push({x:side===1?0:width,y:height*.76,vx:side*width*(.3+Math.random()*.16),vy:Math.sin(angle)*speed,life:0,max:1.8+Math.random()*.8,color:colors[i%colors.length],size:2+Math.random()*3});
   }
  }
  function draw(now){
   if(start===null){start=now;previous=now;}
   const elapsed=(now-start)/1000,dt=Math.min((now-previous)/1000,.04);previous=now;
   ctx.clearRect(0,0,width,height);
   if(!launched){launch();launched=true;}
   for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.life+=dt;if(p.life>p.max){particles.splice(i,1);continue;}
    const x=p.x,y=p.y;p.vy+=height*.32*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.88,dt);
    ctx.globalAlpha=Math.min(1,(p.max-p.life)*1.5);ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(p.x,p.y);ctx.stroke();
    ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*.65,0,Math.PI*2);ctx.fill();
   }
   ctx.globalAlpha=1;
   if(elapsed<4.5)frame=requestAnimationFrame(draw);else onDone();
  }
  frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);};
 },[onDone]);
 return <canvas ref={canvasRef} aria-hidden="true" style={{position:'fixed',inset:0,width:'100%',height:'100dvh',pointerEvents:'none',zIndex:1000}}/>;
}
