import {beforeAll,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld} from '../../src/living-organism/world';
beforeAll(initLivingWorld);
// Sector bins use body-local angles: 0 rear-right, 1 right-rear, 2 right-front,
// 3 front-right, 4 front-left, 5 left-front, 6 left-rear, 7 rear-left.
// Off-axis fixtures avoid quantization boundaries. Wrong manifold orientation
// or omission of body rotation reports the opposite/wrong body sector.
it.each([{angle:Math.PI/8,sector:4},{angle:3*Math.PI/8,sector:5},
 {angle:-3*Math.PI/8,sector:2},{angle:-7*Math.PI/8,sector:0}])(
 'reports the contacted body side at angle $angle',({angle,sector})=>{
 const w=new LivingWorld(false),c=Math.cos(angle),s=Math.sin(angle);
 w.addObject(c*1.35,s*1.35,.4,[1,0,0]);
 for(let i=0;i<4;i++)w.step({drive:0,turn:0,gazeRate:0},{x:c*30,y:s*30});
 const touch=Array.from(w.observe().touch);
 expect(touch[sector]).toBeGreaterThan(0);
 expect(touch.indexOf(Math.max(...touch))).toBe(sector);
 w.free();
});
it('reports a fixed wall on the left side rather than its outward normal',()=>{
 const w=new LivingWorld(false);w.addWall(0,1.1,2,.15,[1,0,0]);
 for(let i=0;i<4;i++)w.step({drive:0,turn:0,gazeRate:0},{x:0,y:30});
 const touch=Array.from(w.observe().touch);
 expect(touch[6]).toBeGreaterThan(0); // +90 degrees, boundary begins sector 6.
 w.free();
});
it('keeps a contact in the same body-local sector after body rotation',()=>{
 const w=new LivingWorld(false);
 for(let i=0;i<180;i++)w.step({drive:0,turn:1,gazeRate:0});
 const a=w.inspect().actor,angle=a.angle+Math.PI/8;
 const c=Math.cos(angle),s=Math.sin(angle);
 w.addObject(a.x+c*1.35,a.y+s*1.35,.4,[1,0,0]);
 for(let i=0;i<4;i++)w.step({drive:0,turn:0,gazeRate:0},{x:c*30,y:s*30});
 expect(w.observe().touch[4]).toBeGreaterThan(0);w.free();
});
