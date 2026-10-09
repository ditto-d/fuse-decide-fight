// Visual timing is independent of simulator randomness and resource accounting.
export const ACTION_SECONDS={scan:2.6,drill:6,move:2.8};
export function actionFrame(action,elapsed){
  const t=Math.max(0,Math.min(1,elapsed/ACTION_SECONDS[action]));
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  if(action==='scan')return {progress:t,phase:t<.2?'Aiming instruments':t<.8?'Collecting sensor readings':'Fusing new evidence',scan:Math.sin(t*Math.PI),drive:0,arm:0,drill:0};
  if(action==='drill')return {progress:t,phase:t<.25?'Deploying the sampling arm':t<.6?'Drilling at the target':t<.78?'Stowing the sampling arm':'Driving to the next site',scan:0,arm:t<.25?smooth(t/.25):t<.6?1:1-smooth((t-.6)/.18),drill:t>=.25&&t<.6?1:0,drive:smooth((t-.78)/.22)};
  return {progress:t,phase:t<.15?'Preparing to traverse':t<.85?'Driving to the next site':'Acquiring the next site',scan:0,arm:0,drill:0,drive:smooth(t)};
}
