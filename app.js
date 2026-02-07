document.addEventListener("DOMContentLoaded", function(){

// ===== DOM =====
const landing = document.getElementById("landing");
const dashboard = document.getElementById("dashboard");
const getStarted = document.getElementById("getStarted");

const subjectInput = document.getElementById("subjectInput");
const dailySubject = document.getElementById("dailySubject");

const addDaily = document.getElementById("addDaily");
const dailyHours = document.getElementById("dailyHours");
const dailyOutcome = document.getElementById("dailyOutcome");
const dailyProof = document.getElementById("dailyProof");
const dailyNotes = document.getElementById("dailyNotes");
const currentDate = document.getElementById("currentDate");
const currentDay = document.getElementById("currentDay");

const addWeekly = document.getElementById("addWeekly");
const weeklyLayer = document.getElementById("weeklyLayer");
const weeklyEffort = document.getElementById("weeklyEffort");
const weeklyBlocker = document.getElementById("weeklyBlocker");
const weeklyTime = document.getElementById("weeklyTime");
const weeklyOutcome = document.getElementById("weeklyOutcome");
const weeklyScore = document.getElementById("weeklyScore");
const weeklyNotes = document.getElementById("weeklyNotes");
const weeklyProof = document.getElementById("weeklyProof");
const weeklyUnlockMsg = document.getElementById("weeklyUnlockMsg");

const progressBar = document.getElementById("progressBar");
const scoreDisplay = document.getElementById("score");
const verdict = document.getElementById("verdict");

const dailyTable = document.querySelector("#dailyTable tbody");
const weeklyTable = document.querySelector("#weeklyTable tbody");
const achievements = document.getElementById("achievements");
const topBlocker = document.getElementById("topBlocker");
const layerStats = document.getElementById("layerStats");
const realUsageCount = document.getElementById("realUsageCount");

// ===== USER ID =====
let USER_ID = localStorage.getItem("demo_user_id");
if(!USER_ID){
  USER_ID = crypto.randomUUID();
  localStorage.setItem("demo_user_id", USER_ID);
}
const key = (name)=>`tracker_${USER_ID}_${name}`;

// ===== STORAGE =====
let dailyLogs = JSON.parse(localStorage.getItem(key("dailyLogs"))||"[]");
let weeklyLogs = JSON.parse(localStorage.getItem(key("weeklyLogs"))||"[]");
let SUBJECT = localStorage.getItem(key("subject")) || "";

// ===== WEEK UTILS =====
function getWeekStart(dateObj){
  const d = new Date(dateObj);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff)).toISOString().slice(0,10);
}
function getCurrentWeek(){ return getWeekStart(new Date()); }

// ===== LANDING =====
getStarted.addEventListener("click", ()=>{
  const inputVal = subjectInput.value.trim();
  if(!inputVal){ alert("Subject required"); return; }
  SUBJECT = inputVal;
  localStorage.setItem(key("subject"), SUBJECT);
  dailySubject.value = SUBJECT;
  landing.style.display="none";
  dashboard.style.display="grid";
  render();
});

// ===== DAILY LOG =====
addDaily.addEventListener("click", ()=>{
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  const week = getCurrentWeek();

  if(dailyLogs.find(l=>l.date===todayStr)){
    alert("Already logged today");
    return;
  }

  const hours = +dailyHours.value;
  const outcome = dailyOutcome.value;
  const proof = dailyProof.value.trim();
  const notes = dailyNotes.value.trim();

  if(hours<1 || hours>24){ alert("Invalid hours"); return; }
  if(!outcome){ alert("Select outcome"); return; }
  if(!proof){ alert("Proof required"); return; }
  if(!notes){ alert("Notes required"); return; }

  dailyLogs.push({date:todayStr,day:today.toLocaleDateString('en-US',{weekday:'long'}),hours,outcome,proof,notes,week});
  localStorage.setItem(key("dailyLogs"),JSON.stringify(dailyLogs));

  dailyHours.value=""; dailyProof.value=""; dailyNotes.value=""; dailyOutcome.value="";

  render();
});

// ===== WEEKLY LOG =====
addWeekly.addEventListener("click", ()=>{
  const week = getCurrentWeek();
  const weekDaily = dailyLogs.filter(l=>l.week===week);
  if(weekDaily.length<4){ alert("Need 4 daily logs this week"); return; }
  if(weeklyLogs.find(w=>w.week===week)){ alert("Weekly already submitted"); return; }

  const layer = weeklyLayer.value;
  const effort = weeklyEffort.value;
  const blocker = weeklyBlocker.value;
  const timeSpent = +weeklyTime.value;
  const outcome = weeklyOutcome.value.trim();
  const scoreInput = weeklyScore.value.trim();
  const proof = weeklyProof.value.trim();
  const notes = weeklyNotes.value.trim();

  if(!layer || !effort || !blocker || timeSpent<3 || !outcome || !scoreInput.includes("/") || !proof){ 
    alert("All fields required & Time ≥3 & Score format correct"); return; 
  }

  weeklyLogs.push({week,layer,effort,blocker,timeSpent,outcome,score:scoreInput,proof,notes});
  localStorage.setItem(key("weeklyLogs"),JSON.stringify(weeklyLogs));

  weeklyLayer.value=""; weeklyEffort.value=""; weeklyBlocker.value=""; weeklyTime.value=""; 
  weeklyOutcome.value=""; weeklyScore.value=""; weeklyNotes.value=""; weeklyProof.value="";

  render();
});

// ===== PROGRESS =====
function calculateProgress(){
  const week = getCurrentWeek();
  const weekDaily = dailyLogs.filter(l=>l.week===week);
  const weekLog = weeklyLogs.find(w=>w.week===week);

  const totalHours = weekDaily.reduce((a,b)=>a+b.hours,0);
  const targetHours = 7*6;
  const dailyPercent = Math.min(totalHours/targetHours,1)*70;

  let weeklyPercent=0;
  if(weekLog){
    const [o,t]=weekLog.score.split("/").map(Number);
    if(t>0){ weeklyPercent=(o/t)*30; }
  }
  return Math.min(100,dailyPercent+weeklyPercent);
}

// ===== TREND GRAPH =====
function renderTrend(){
  const ctx = document.getElementById("trendChart");
  if(!ctx) return;
  if(window.trendChartInstance) window.trendChartInstance.destroy();

  const scores = weeklyLogs.map(w=>w.score.split("/").map(Number)).map(([o,t])=>(o/t)*100);
  window.trendChartInstance = new Chart(ctx,{type:"line",
    data:{labels:weeklyLogs.map((_,i)=>"W"+(i+1)),datasets:[{data:scores,borderWidth:2,fill:false}]},
    options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{min:0,max:100}}}});
}

// ===== LADDER =====
function renderLadder(){
  achievements.innerHTML="";
  for(let i=0;i<24;i++){
    const badge=document.createElement("span");
    badge.className="badge"; badge.innerText="W"+(i+1);
    const w = weeklyLogs[i];
    if(w){ const [o,t]=w.score.split("/").map(Number); if((o/t)*100>=70) badge.classList.add("active"); }
    achievements.appendChild(badge);
  }
}

// ===== ANALYTICS =====
function renderAnalytics(){
  // Top Blocker
  const blockers = weeklyLogs.map(w=>w.blocker).filter(Boolean);
  const counts={};
  blockers.forEach(b=>counts[b]=(counts[b]||0)+1);
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  topBlocker.innerText = top ? top[0] : "None";

  // Layer Distribution
  const layers={KNOWLEDGE:0,PRACTICE:0,OUTPUT:0,REAL_USAGE:0};
  weeklyLogs.forEach(w=>{ if(w.layer) layers[w.layer]++; });
  layerStats.innerHTML = "";
  Object.entries(layers).forEach(([l,c])=>{
    const li=document.createElement("li"); li.innerText=`${l}: ${c}`; layerStats.appendChild(li);
  });

  // REAL_USAGE count
  const realCount = weeklyLogs.filter(w=>w.layer==="REAL_USAGE").length;
  realUsageCount.innerText=realCount;
}

// ===== RENDER ALL =====
function render(){
  const today = new Date();
  if(currentDate) currentDate.value = today.toISOString().slice(0,10);
  if(currentDay) currentDay.value = today.toLocaleDateString('en-US',{weekday:'long'});
  dailySubject.value = SUBJECT;

  // Daily table
  dailyTable.innerHTML="";
  dailyLogs.forEach((l,i)=>{
    dailyTable.innerHTML+=`<tr>
      <td>${i+1}</td><td>${l.date}</td><td>${l.day}</td><td>${l.hours}</td>
      <td>${l.outcome}</td><td>${l.proof}</td><td>${l.notes}</td></tr>`;
  });

  // Weekly table
  weeklyTable.innerHTML="";
  weeklyLogs.forEach((w,i)=>{
    weeklyTable.innerHTML+=`<tr>
      <td>${i+1}</td><td>${w.week}</td><td>${w.layer}</td><td>${w.effort}</td>
      <td>${w.blocker}</td><td>${w.timeSpent}</td><td>${w.score}</td><td>${w.proof}</td><td>${w.notes}</td></tr>`;
  });

  // Weekly unlock
  const weekDaily = dailyLogs.filter(l=>l.week===getCurrentWeek());
  addWeekly.disabled = weekDaily.length<4;
  weeklyUnlockMsg.innerText = weekDaily.length>=4 ? "Weekly unlocked" : `Need 4 logs (${weekDaily.length}/4)`;

  // Progress
  const prog = calculateProgress();
  progressBar.style.width = prog+"%";
  scoreDisplay.innerText = Math.round(prog)+"%";
  if(prog>=75){ verdict.innerText="Strong Momentum"; verdict.className="verdict green"; }
  else if(prog>=50){ verdict.innerText="Stable but Improve"; verdict.className="verdict yellow"; }
  else{ verdict.innerText="Weak Week – Low Output"; verdict.className="verdict red"; }

  renderLadder();
  renderTrend();
  renderAnalytics();
}

render();

});