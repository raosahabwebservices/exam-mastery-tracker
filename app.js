document.addEventListener("DOMContentLoaded", function(){

// ===== DOM REFERENCES =====
const landing = document.getElementById("landing");
const dashboard = document.getElementById("dashboard");
const getStarted = document.getElementById("getStarted");

const subjectInput = document.getElementById("subjectInput");
const dailySubject = document.getElementById("dailySubject");

const addDaily = document.getElementById("addDaily");
const dailyHours = document.getElementById("dailyHours");
const dailyOutcome = document.getElementById("dailyOutcome");
const dailyProof = document.getElementById("dailyProof");
const currentDate = document.getElementById("currentDate");
const currentDay = document.getElementById("currentDay");

const addWeekly = document.getElementById("addWeekly");
const weeklyAttempt = document.getElementById("weeklyAttempt");
const weeklyScore = document.getElementById("weeklyScore");
const weeklyProof = document.getElementById("weeklyProof");
const weeklyUnlockMsg = document.getElementById("weeklyUnlockMsg");

const progressBar = document.getElementById("progressBar");
const score = document.getElementById("score");
const verdict = document.getElementById("verdict");

// ===== USER ISOLATION =====
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

// ===== WEEK UTIL =====
function getWeekStart(dateObj){
  const d = new Date(dateObj);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff)).toISOString().slice(0,10);
}

function getCurrentWeek(){
  return getWeekStart(new Date());
}

// ===== LANDING =====
getStarted.addEventListener("click", ()=>{
  const inputVal = subjectInput.value.trim();
  if(!inputVal){
    alert("Subject required");
    return;
  }
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

  if(hours<1 || hours>24){
    alert("Invalid hours");
    return;
  }

  if(!proof){
    alert("Proof required");
    return;
  }

  dailyLogs.push({
    date: todayStr,
    day: today.toLocaleDateString("en-US",{weekday:"long"}),
    hours,
    outcome,
    proof,
    week
  });

  localStorage.setItem(key("dailyLogs"), JSON.stringify(dailyLogs));

  dailyHours.value="";
  dailyProof.value="";

  render();
});

// ===== WEEKLY LOG =====
addWeekly.addEventListener("click", ()=>{
  const week = getCurrentWeek();
  const weekDaily = dailyLogs.filter(l=>l.week===week);

  if(weekDaily.length < 4){
    alert("Need 4 daily logs this week");
    return;
  }

  if(weeklyLogs.find(w=>w.week===week)){
    alert("Weekly already submitted");
    return;
  }

  const attempt = weeklyAttempt.value;
  const scoreInput = weeklyScore.value.trim();
  const proof = weeklyProof.value.trim();

  if(!proof){
    alert("Proof required");
    return;
  }

  if(!scoreInput.includes("/")){
    alert("Use format 80/100");
    return;
  }

  weeklyLogs.push({
    week,
    attempt,
    score: scoreInput,
    proof
  });

  localStorage.setItem(key("weeklyLogs"), JSON.stringify(weeklyLogs));
  render();
});

// ===== PROGRESS =====
function calculateProgress(){

  const week = getCurrentWeek();
  const weekDaily = dailyLogs.filter(l=>l.week===week);
  const weekLog = weeklyLogs.find(w=>w.week===week);

  const totalHours = weekDaily.reduce((a,b)=>a+b.hours,0);
  const targetHours = 7 * 6;
  const dailyPercent = Math.min(totalHours/targetHours,1) * 70;

  let weeklyPercent = 0;
  if(weekLog){
    const [o,t] = weekLog.score.split("/").map(Number);
    if(t>0){
      weeklyPercent = (o/t) * 30;
    }
  }

  return Math.min(100, dailyPercent + weeklyPercent);
}

// ===== TREND GRAPH =====
function renderTrend(){
  const ctx = document.getElementById("trendChart");
  if(!ctx) return;

  if(window.trendChartInstance){
    window.trendChartInstance.destroy();
  }

  const scores = weeklyLogs.map(w=>{
    const [o,t]=w.score.split("/").map(Number);
    return (o/t)*100;
  });

  window.trendChartInstance = new Chart(ctx,{
    type:"line",
    data:{
      labels: weeklyLogs.map((_,i)=>"W"+(i+1)),
      datasets:[{data:scores,borderWidth:2,fill:false}]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false}},
      scales:{y:{min:0,max:100}}
    }
  });
}

// ===== LADDER =====
function renderLadder(){
  const container = document.getElementById("achievements");
  container.innerHTML="";

  for(let i=0;i<24;i++){
    const badge=document.createElement("span");
    badge.className="badge";
    badge.innerText="W"+(i+1);

    const w = weeklyLogs[i];
    if(w){
      const [o,t]=w.score.split("/").map(Number);
      if((o/t)*100 >= 70){
        badge.classList.add("active");
      }
    }

    container.appendChild(badge);
  }
}

// ===== RENDER =====
function render(){

  if(currentDate)
    currentDate.value = new Date().toISOString().slice(0,10);

  if(currentDay)
    currentDay.value = new Date().toLocaleDateString("en-US",{weekday:"long"});

  dailySubject.value = SUBJECT;

  const week = getCurrentWeek();

  // Daily Table
  const dailyTable = document.querySelector("#dailyTable tbody");
  dailyTable.innerHTML="";
  dailyLogs.filter(l=>l.week===week).forEach((l,i)=>{
    dailyTable.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>${l.date}</td>
        <td>${l.day}</td>
        <td>${l.hours}</td>
        <td>${l.outcome}</td>
        <td>${l.proof}</td>
      </tr>`;
  });

  // Weekly Table
  const weeklyTable = document.querySelector("#weeklyTable tbody");
  weeklyTable.innerHTML="";
  weeklyLogs.forEach((l,i)=>{
    weeklyTable.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>${l.week}</td>
        <td>${l.attempt}</td>
        <td>${l.score}</td>
        <td>${l.proof}</td>
      </tr>`;
  });

  // Unlock
  const weekDaily = dailyLogs.filter(l=>l.week===week);
  addWeekly.disabled = weekDaily.length < 4;
  weeklyUnlockMsg.innerText =
    weekDaily.length>=4 ? "Weekly unlocked" : `Need 4 logs (${weekDaily.length}/4)`;

  // Progress
  const progress = calculateProgress();
  progressBar.style.width = progress+"%";
  score.innerText = Math.round(progress)+"%";

  if(progress>=75){
    verdict.innerText="Strong Momentum";
    verdict.className="verdict green";
  }else if(progress>=50){
    verdict.innerText="Stable but Improve";
    verdict.className="verdict yellow";
  }else{
    verdict.innerText="Weak Week – Low Output";
    verdict.className="verdict red";
  }

  renderLadder();
  renderTrend();
}

render();

});