export type SensoryExample={input:number[];output:number[]};
export type RegressorState={mean:number[];scale:number[];weights:number[][]};
/** Small learned baseline. Fits normalized ridge regression; no host truth API. */
export class SensoryRegressor{
 private state:RegressorState|null=null;
 fit(samples:SensoryExample[]){
  const n=samples[0]?.input.length;
  if(!n||samples.some(s=>s.input.length!==n||s.output.length!==2||![...s.input,...s.output].every(Number.isFinite)))throw new Error('Invalid training samples');
  const mean=Array.from({length:n},(_,j)=>samples.reduce((v,s)=>v+s.input[j],0)/samples.length);
  const scale=mean.map((m,j)=>{const sd=Math.sqrt(samples.reduce((v,s)=>v+(s.input[j]-m)**2,0)/samples.length);return sd<1e-6?1:sd;});
  const size=n+1,matrix=Array.from({length:size},()=>Array(size+2).fill(0) as number[]);
  for(const s of samples){
   const x=[1,...s.input.map((v,j)=>(v-mean[j])/scale[j])];
   for(let i=0;i<size;i++){
    for(let j=0;j<size;j++)matrix[i][j]+=x[i]*x[j]/samples.length;
    for(let o=0;o<2;o++)matrix[i][size+o]+=x[i]*s.output[o]/samples.length;
   }
  }
  for(let i=0;i<size;i++)matrix[i][i]+=.001;
  // Pivoted elimination solves both outputs against the same regularized Gram matrix.
  for(let col=0;col<size;col++){
   let pivot=col;for(let row=col+1;row<size;row++)if(Math.abs(matrix[row][col])>Math.abs(matrix[pivot][col]))pivot=row;
   [matrix[col],matrix[pivot]]=[matrix[pivot],matrix[col]];
   const value=matrix[col][col];if(Math.abs(value)<1e-12)throw new Error('Degenerate fit');
   for(let j=col;j<size+2;j++)matrix[col][j]/=value;
   for(let row=0;row<size;row++)if(row!==col){const factor=matrix[row][col];for(let j=col;j<size+2;j++)matrix[row][j]-=factor*matrix[col][j];}
  }
  this.restore({mean,scale,weights:[0,1].map(o=>matrix.map(row=>row[size+o]))});
 }
 predict(input:number[]):number[]{
  const s=this.state;if(!s||input.length!==s.mean.length||!input.every(Number.isFinite))throw new Error('Invalid prediction input');
  const x=[1,...input.map((v,j)=>(v-s.mean[j])/s.scale[j])];
  return s.weights.map(w=>w.reduce((sum,v,j)=>sum+v*x[j],0));
 }
 capture():RegressorState{if(!this.state)throw new Error('Untrained model');return structuredClone(this.state);}
 restore(state:RegressorState){
  const n=state.mean.length;
  if(!n||state.scale.length!==n||state.weights.length!==2||state.weights.some(w=>w.length!==n+1)
   ||![...state.mean,...state.scale,...state.weights.flat()].every(Number.isFinite)||state.scale.some(v=>v<=0))throw new Error('Invalid model state');
  this.state=structuredClone(state);
 }
}
