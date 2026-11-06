// Inspect file bytes instead of relying on browser-provided MIME labels.
export function detectImageType(bytes) {
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 const png=[137,80,78,71,13,10,26,10];
 if(bytes.length>=8&&png.every((value,index)=>bytes[index]===value))return 'image/png';
 if(bytes.length>=12&&[82,73,70,70].every((value,index)=>bytes[index]===value)&&[87,69,66,80].every((value,index)=>bytes[index+8]===value))return 'image/webp';
 return null;
}
export async function uploadedImageType(file){return detectImageType(new Uint8Array(await file.slice(0,12).arrayBuffer()));}
