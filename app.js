const $ = (s) => document.querySelector(s);
const STORE = "jarvis-v1-local";
const today = () => new Date().toLocaleDateString("en-CA");
const defaults = [
  {id:"study",name:"Estudar por 15 minutos",xp:20,done:false,kind:"base"},
  {id:"organize",name:"Organizar o ambiente por 5 minutos",xp:10,done:false,kind:"base"},
  {id:"reflect",name:"Momento de fé ou reflexão",xp:10,done:false,kind:"base"},
  {id:"prepare",name:"Preparar o dia seguinte",xp:10,done:false,kind:"base"}
];
let state;
function load(){
  try{state=JSON.parse(localStorage.getItem(STORE))}catch(e){}
  if(!state || typeof state!=="object") state={totalXp:0,day:today(),missions:defaults.map(x=>({...x})),history:[]};
  if(state.day!==today()){
    const earned=state.missions.filter(m=>m.done).reduce((n,m)=>n+m.xp,0);
    if(earned>0) state.history.push({day:state.day,xp:earned,completed:state.missions.filter(m=>m.done).length});
    state.day=today();
    state.missions=defaults.map(x=>({...x}));
    save();
  }
  if(!Array.isArray(state.missions)) state.missions=defaults.map(x=>({...x}));
  if(!Array.isArray(state.history)) state.history=[];
  if(typeof state.totalXp!=="number") state.totalXp=0;
}
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function levelInfo(xp){const level=Math.floor(xp/100)+1;return {level,inside:xp%100,rank:level<3?"RECRUTA":level<6?"OPERADOR":level<10?"ESPECIALISTA":"COMANDANTE"}}
function render(){
  const info=levelInfo(state.totalXp), completed=state.missions.filter(m=>m.done).length;
  $("#level").textContent=String(info.level).padStart(2,"0");$("#rank").textContent=info.rank;
  $("#xpText").textContent=`${info.inside} / 100 XP`;$("#xpBar").style.width=info.inside+"%";
  $("#xpHint").textContent=`${100-info.inside} XP para o próximo nível.`;
  $("#totalXp").textContent=state.totalXp;$("#completedCount").textContent=`${completed}/${state.missions.length}`;
  $("#todayLabel").textContent=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"}).toUpperCase();
  $("#missionDate").textContent=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}).toUpperCase();
  $("#missionList").innerHTML="";
  state.missions.forEach(m=>{
    const row=document.createElement("div");row.className="mission"+(m.done?" done":"");
    const check=document.createElement("button");check.className="check";check.textContent=m.done?"✓":"";check.setAttribute("aria-label",m.done?"Marcar como pendente":"Concluir missão");
    check.addEventListener("click",()=>toggle(m.id));
    const info=document.createElement("div");info.className="mission-info";
    const name=document.createElement("span");name.className="mission-name";name.textContent=m.name;
    const meta=document.createElement("span");meta.className="mission-meta";meta.textContent=m.kind==="base"?"MISSÃO DIÁRIA":"MISSÃO PERSONALIZADA";
    info.append(name,meta);
    const xp=document.createElement("span");xp.className="xp-pill";xp.textContent=`+${m.xp} XP`;
    row.append(check,info,xp);$("#missionList").append(row);
  });
}
function toggle(id){
  const m=state.missions.find(x=>x.id===id);if(!m)return;
  m.done=!m.done;state.totalXp=Math.max(0,state.totalXp+(m.done?m.xp:-m.xp));save();render();
  toast(m.done?`Missão concluída: +${m.xp} XP`:"Missão desmarcada. XP atualizado.");
}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2400)}
$("#addMissionForm").addEventListener("submit",e=>{
  e.preventDefault();const input=$("#missionInput"),name=input.value.trim();if(!name)return;
  state.missions.push({id:"custom-"+Date.now(),name,xp:10,done:false,kind:"custom"});input.value="";save();render();toast("Missão adicionada: +10 XP disponíveis.");
});
const emergency=$("#emergencyDialog");
$("#emergencyBtn").addEventListener("click",()=>emergency.showModal());
$("#finishEmergency").addEventListener("click",()=>{emergency.close();toast("Protocolo E-01 consultado. Escolha seu próximo passo.")});
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
const reset=$("#resetDialog");$("#resetBtn").addEventListener("click",()=>reset.showModal());
$("#confirmReset").addEventListener("click",()=>{localStorage.removeItem(STORE);load();render();reset.close();toast("Progresso reiniciado neste aparelho.")});
function tick(){const d=new Date();$("#clock").textContent=d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});}
tick();setInterval(tick,15000);load();render();
let installPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("#installBtn").hidden=false});
$("#installBtn").addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("#installBtn").hidden=true});
if("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
