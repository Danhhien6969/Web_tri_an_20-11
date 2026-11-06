import { uploadedImageType } from './image-type.js';
const MB=1024*1024;
async function optimize(file,budget){
 if(file.size<=budget)return file;
 const type=await uploadedImageType(file),url=URL.createObjectURL(new Blob([file],{type:type||file.type}));
 try{
  const image=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Chưa đọc được ảnh. Vui lòng chọn lại ảnh.'));image.src=url;});
  let scale=Math.min(1,1800/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');
  for(let attempt=0;attempt<8;attempt++){
   canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
   canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.86));
   if(blob&&blob.size<=budget)return new File([blob],file.name.replace(/\.[^.]+$/,'')+(blob.type==='image/webp'?'.webp':'.png'),{type:blob.type});
   scale*=.75;
  }
  throw new Error('Chưa tối ưu được ảnh. Vui lòng thử ảnh có kích thước nhỏ hơn.');
 }finally{URL.revokeObjectURL(url);}
}
export async function prepareForumImages(form){
 const files=['image','articleImage'].map(key=>[key,form.get(key)]).filter(([,file])=>file&&file.size);
 const total=files.reduce((sum,[,file])=>sum+file.size,0);
 if(total>5*MB)throw new Error('Tổng hai ảnh tối đa 5 MB.');
 // Keep the multipart request below Vercel's request-body limit.
 if(total>3*MB){for(const [key,file] of files){const budget=Math.floor(3*MB*file.size/total);form.set(key,await optimize(file,budget));}}
 return form;
}
