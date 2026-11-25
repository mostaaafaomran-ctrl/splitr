(function(root){
function parseTasks(s){
  let lines=s.split(/\r?\n/).map(l=>l.replace(/^\s*(?:[-*\u2022\u2013]|\d+[.)]|[\u0661-\u0669]+[.)])\s*/,'').trim()).filter(Boolean);
  if(lines.length===1&&lines[0].length>80){
    lines=lines[0].split(/(?<=[.!?\u061F])\s+/).map(x=>x.trim()).filter(x=>x.length>2);
  }
  return lines;
}
function parseMembers(s){
  const seen=new Set();
  return s.split(/[,\n\u060C;]/).map(x=>x.trim()).filter(x=>x&&!seen.has(x.toLowerCase())&&seen.add(x.toLowerCase()));
}
function weight(t){return Math.max(1,Math.min(5,Math.round(t.length/40)+1))}
function plan(tasks,members,start,due){
  const items=tasks.map((t,i)=>({text:t,w:weight(t),i}));
  const load={};members.forEach(m=>load[m]=0);
  const order=items.slice().sort((a,b)=>b.w-a.w||a.i-b.i);
  order.forEach(it=>{
    let best=members[0];
    members.forEach(m=>{if(load[m]<load[best])best=m});
    it.owner=best;load[best]+=it.w;
  });
  const day=864e5;
  const total=Math.max(0,Math.round((due-start)/day));
  const reviewOff=total>=2?total-1:total;
  const reviewDate=new Date(start.getTime()+reviewOff*day);
  const span=Math.max(0,reviewOff);
  const byOwner={};
  members.forEach(m=>byOwner[m]=items.filter(x=>x.owner===m));
  members.forEach(m=>{
    const l=byOwner[m];
    l.forEach((it,k)=>{
      const off=Math.round(span*(k+1)/l.length);
      it.date=new Date(start.getTime()+off*day);
    });
  });
  const assignments=items.slice().sort((a,b)=>a.i-b.i);
  return{assignments,members,reviewDate,due,start};
}
function toText(p,fmt){
  const out=['Project split'];
  p.members.forEach(m=>{
    out.push('','*'+m+'*');
    const mine=p.assignments.filter(a=>a.owner===m);
    if(!mine.length)out.push('- merge and review');
    mine.slice().sort((a,b)=>a.date-b.date).forEach(a=>out.push('- '+a.text+' (by '+fmt(a.date)+')'));
  });
  out.push('','Merge and review: '+fmt(p.reviewDate),'Final deadline: '+fmt(p.due));
  return out.join('\n');
}
const api={parseTasks,parseMembers,plan,toText,weight};
if(typeof module!=='undefined')module.exports=api;else root.Splitr=api;
})(this);
