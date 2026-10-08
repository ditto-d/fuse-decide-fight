// Synthetic teaching simulator. All randomness is seeded and independent of action order.
export const SIGMAS=[1.56,2.34,3.51], COST={scan:1,drill:9,move:3}, MAX_SCANS=8;
export const LABELS=['Spectrometer','Thermal','Camera'];
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function normal(r){return Math.sqrt(-2*Math.log(Math.max(1e-12,r())))*Math.cos(2*Math.PI*r());}
export function site(seed,index,storm=false){const r=rng((seed*9973+index*7919)>>>0);const wet=r()<.3;const liters=wet?40+Math.floor(r()*81):0;const scans=Array.from({length:MAX_SCANS+1},()=>SIGMAS.map(s=>(wet?1:-1)+s*normal(r)+(storm?2.6:0)));return {wet,liters,scans};}
export function confidence(readings, knownBias=0) {
  let logOdds = Math.log(.3 / .7); // Prior: 30% wet sites.
  for (const scan of readings) {
    scan.forEach((signal, i) => {
      logOdds += 2 * (signal - knownBias) / SIGMAS[i] ** 2;
    });
  }
  return 1 / (1 + Math.exp(-clamp(logOdds, -35, 35)));
}
export function sensorConfidence(v,i){return 1/(1+Math.exp(-(Math.log(.3/.7)+2*v/(SIGMAS[i]**2))));}
export function bin(p){return Math.min(17,Math.floor(p*18));}
export function stateIndex(p,rescans){return rescans*18+bin(p);}
export function best(q,p,rescans){const row=q[stateIndex(p,rescans)];const available=rescans<MAX_SCANS?[0,1,2]:[1,2];return available.reduce((a,b)=>row[b]>row[a]?b:a,available[0]);}
export function updateValue(q, state, action, reward, nextState, nextAction) {
  const before = q[state][action];
  // A site episode ends at drill or move. No future value after that.
  const future = nextState === null ? 0 : q[nextState][nextAction];
  const target = reward + future; // Discount gamma = 1.
  // Learning rate alpha = .12.
  q[state][action] += .12 * (target - before);
  return {before, future, target, after: q[state][action]};
}

// The step-through lab and full training use this same generator.
export function* trainingSteps(price=.45, storm=false) {
  const random = rng(20261009);
  const q = Array.from({length:18*(MAX_SCANS+1)}, () => [0,0,0]);
  for (let n=0; n<8000; n++) {
    const ground = site(100000+n, 0, storm);
    let k=0, p=confidence([ground.scans[0]]);
    const epsilon=.03+.97*Math.pow(1-n/8000, 2);
    while (true) {
      const state=stateIndex(p,k), oldP=p, oldK=k;
      const exploratory=random()<epsilon;
      const action=exploratory
        ? Math.floor(random()*(k<MAX_SCANS?3:2))+(k<MAX_SCANS?0:1)
        : best(q,p,k);
      const terminal=action!==0;
      let reward;
      if (!terminal) {
        reward=-price;
        k++;
        p=confidence(ground.scans.slice(0,k+1));
      } else {
        reward=(action===1 && ground.wet?10:0)-(action===1?9:3)*price;
      }
      const update=updateValue(q,state,action,reward,
        terminal?null:stateIndex(p,k), terminal?null:best(q,p,k));
      yield {episode:n+1, state, p:oldP, rescans:oldK, nextP:p,
        action, terminal, epsilon, exploratory, reward, ...update,
        wet:action===1?ground.wet:null, row:[...q[state]], q};
      if (terminal) break;
    }
  }
  return q;
}

export function train(price=.45, storm=false, onCheckpoint) {
  const steps=trainingSteps(price,storm);
  let step=steps.next();
  while (!step.done) {
    const event=step.value;
    if (onCheckpoint && event.terminal && event.episode%1000===0)
      onCheckpoint(event.episode,event.q.map(row=>[...row]));
    step=steps.next();
  }
  return step.value;
}
export function createMission(seed=2047,storm=false){return {seed,storm,index:0,battery:100,liters:0,hits:0,dry:0,rescans:0,totalScans:0,history:[],done:false};}
export function observation(m){const s=site(m.seed,m.index,m.storm);const readings=s.scans.slice(0,m.rescans+1).map(scan=>scan.map(value=>value-(m.knownBias||0)));return {readings,last:readings.at(-1),p:confidence(readings)};}
export function act(m,action){if(!['scan','drill','move'].includes(action))throw Error('Choose scan, drill, or move.');if(m.done||m.battery<COST[action]||(action==='scan'&&(m.rescans>=MAX_SCANS||m.battery<4)))return {ok:false,message:'That action is unavailable.'};const o=observation(m),s=site(m.seed,m.index,m.storm);m.battery-=COST[action];let message;if(action==='scan'){m.rescans++;m.totalScans++;message='New scan received. Compare the updated estimate.';m.history.push({site:m.index+1,action,p:o.p,battery:m.battery});}else{let liters=0;if(action==='drill'){liters=s.liters;m.liters+=liters;if(s.wet)m.hits++;else m.dry++;message=s.wet?`Water found! +${liters} L collected.`:'Dry hole. No water collected.';}else message='Moved on. Water at that site stays unknown.';m.history.push({site:m.index+1,action,p:o.p,battery:m.battery,liters,wet:action==='drill'?s.wet:null});m.index++;m.rescans=0;}if(m.battery<3||m.index>=34)m.done=true;return {ok:true,message};}
export function runMission(seed=2047,policy='rove',q,storm=false,knownBias=0){const m=createMission(seed,storm);if(knownBias)m.knownBias=knownBias;let safety=0;while(!m.done&&safety++<400){const {p,last}=observation(m);let a=policy==='always'?'drill':policy==='fused'?(p>.5?'drill':'move'):policy==='expert'?(p>.68?'drill':p<.18?'move':m.rescans<3?'scan':'move'):policy==='sensor'?(sensorConfidence(last[0],0)>.5?'drill':'move'):['scan','drill','move'][best(q,p,m.rescans)];if(a==='drill'&&m.battery<9)a='move';if(a==='scan'&&(m.battery<4||m.rescans>=MAX_SCANS))a='move';act(m,a);}return m;}
export function evaluate(q,storm=false,count=300,knownBias=0){const policies=['rove','always','fused','expert'];return policies.map(policy=>{let liters=0,hits=0,dry=0,scans=0;for(let i=0;i<count;i++){const m=runMission(70000+i,policy,q,storm,knownBias);liters+=m.liters;hits+=m.hits;dry+=m.dry;scans+=m.totalScans;}return {policy,liters:liters/count,hits:hits/count,dry:dry/count,scans:scans/count};});}
export function traverse(count=4000){const results=[0,0,0,0,0];for(let i=0;i<count;i++){const s=site(90000+i,0);for(let j=0;j<3;j++)if((sensorConfidence(s.scans[0][j],j)>=.5)===s.wet)results[j]++;if((confidence([s.scans[0]])>=.5)===s.wet)results[3]++;if((confidence(s.scans.slice(0,3))>=.5)===s.wet)results[4]++;}return results.map(x=>100*x/count);}
