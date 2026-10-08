export const RETINA_SAMPLES=96;
export function retinalAngle(u:number){return Math.sign(u)*u*u*(80*Math.PI/180);}
export type VisualPatch={bearing:number;extent:number;clipped:boolean};
/** Visible color fragments, not object identities. Extent is quantized appearance only. */
export function visibleTurquoisePatches(retina:Float32Array):VisualPatch[]{
 const patches:VisualPatch[]=[];
 for(let i=0;i<RETINA_SAMPLES;i++){
  const matches=(j:number)=>retina[j*3]<.3&&retina[j*3+1]>.65&&retina[j*3+2]>.6;
  if(!matches(i))continue;
  const first=i;while(i+1<RETINA_SAMPLES&&matches(i+1))i++;
  const left=retinalAngle(first/RETINA_SAMPLES*2-1),right=retinalAngle((i+1)/RETINA_SAMPLES*2-1);
  patches.push({bearing:(left+right)/2,extent:right-left,clipped:first===0||i===RETINA_SAMPLES-1});
 }
 return patches;
}
