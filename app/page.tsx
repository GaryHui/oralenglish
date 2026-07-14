"use client";

import { useEffect, useMemo, useState } from "react";

type Card = {
  scene: string; icon: string; context: string; prompt: string; answer: string;
  chunks: { text: string; meaning: string }[]; hint: string; followUp: string;
};

const cards: Card[] = [
  { scene: "咖啡店", icon: "☕", context: "你在点单，店员问你要喝什么。", prompt: "我想要一杯中杯拿铁，少糖，带走。", answer: "Could I get a medium latte, less sweet, to go?", chunks: [{text:"Could I get…",meaning:"我可以要……吗"},{text:"less sweet",meaning:"少甜 / 少糖"},{text:"to go",meaning:"带走"}], hint: "Could I get… / less… / to go", followUp: "如果店员问：Anything else? 你想说“不用了，就这些，谢谢”。" },
  { scene: "咖啡店", icon: "☕", context: "饮料做好了，但你不确定是不是你的。", prompt: "不好意思，这是我的拿铁吗？", answer: "Excuse me, is this my latte?", chunks: [{text:"Excuse me",meaning:"礼貌引起注意"},{text:"Is this my…?",meaning:"这是我的……吗"}], hint: "Excuse me / Is this my…?", followUp: "对方说名字不对，你想说“没关系，我再等一下”。" },
  { scene: "餐厅", icon: "🍜", context: "服务员来点餐，你还没决定好。", prompt: "我们还需要一点时间，可以等会儿再来吗？", answer: "We need a little more time. Could you come back in a few minutes?", chunks: [{text:"need a little more time",meaning:"还需要一点时间"},{text:"come back in…",meaning:"过……再来"}], hint: "need…time / come back / a few minutes", followUp: "你决定好了，想叫服务员回来点餐。" },
  { scene: "餐厅", icon: "🍜", context: "结账时你和朋友想各付各的。", prompt: "我们可以分开结账吗？", answer: "Could we split the bill, please?", chunks: [{text:"Could we…?",meaning:"我们可以……吗"},{text:"split the bill",meaning:"分开结账"}], hint: "Could we / split / the bill", followUp: "改成：今天我请客，我来付。" },
  { scene: "购物", icon: "🛍️", context: "你喜欢一件衣服，但想试穿。", prompt: "这件有大一码的吗？我可以试穿吗？", answer: "Do you have this in a larger size? Could I try it on?", chunks: [{text:"Do you have this in…?",meaning:"这件有……的吗"},{text:"a larger size",meaning:"大一码"},{text:"try it on",meaning:"试穿"}], hint: "have this / larger size / try it on", followUp: "试完觉得不合适，你想说“我再考虑一下”。" },
  { scene: "出行", icon: "🚇", context: "你在地铁站，不知道该在哪一站换乘。", prompt: "请问，去市中心我应该在哪里换乘？", answer: "Excuse me, where should I transfer to get downtown?", chunks: [{text:"Where should I…?",meaning:"我应该在哪里……"},{text:"transfer",meaning:"换乘"},{text:"get downtown",meaning:"到市中心"}], hint: "Excuse me / where should I / transfer", followUp: "对方说得太快，请他再说一遍。" },
  { scene: "出行", icon: "🚕", context: "你上了出租车，想告诉司机目的地。", prompt: "麻烦送我到这个地址，我赶时间。", answer: "Could you take me to this address? I’m in a bit of a hurry.", chunks: [{text:"take me to…",meaning:"送我去……"},{text:"in a bit of a hurry",meaning:"有点赶时间"}], hint: "take me to / this address / in a hurry", followUp: "你不赶时间，想请司机开慢一点。" },
  { scene: "工作", icon: "💻", context: "会议中你没听懂同事的意思。", prompt: "抱歉，我不太明白。你能举个例子吗？", answer: "Sorry, I’m not quite following. Could you give me an example?", chunks: [{text:"I’m not quite following",meaning:"我不太明白你的意思"},{text:"give me an example",meaning:"给我举个例子"}], hint: "not quite following / give me / example", followUp: "你听懂了，想确认：“所以你的意思是我们要推迟，对吗？”" },
  { scene: "社交", icon: "👋", context: "朋友邀请你周五吃饭，但你那天有安排。", prompt: "谢谢你邀请我，但周五我可能不行。周六怎么样？", answer: "Thanks for inviting me, but Friday might not work for me. How about Saturday?", chunks: [{text:"Thanks for inviting me",meaning:"谢谢你邀请我"},{text:"might not work for me",meaning:"对我来说可能不行"},{text:"How about…?",meaning:"……怎么样"}], hint: "Thanks for / might not work / How about", followUp: "对方周六也没空，你想说“那我们改天再约”。" },
  { scene: "邻里", icon: "🏠", context: "邻居家的音乐有点大，你准备礼貌沟通。", prompt: "不好意思，能把音乐调小一点吗？我明早要早起。", answer: "Sorry to bother you, but could you turn the music down a little? I have to get up early tomorrow.", chunks: [{text:"Sorry to bother you",meaning:"抱歉打扰你"},{text:"turn … down",meaning:"把……调小"},{text:"get up early",meaning:"早起"}], hint: "Sorry to bother / turn down / get up early", followUp: "邻居道歉后，你想说“没关系，谢谢你理解”。" },
  { scene: "电话", icon: "📞", context: "电话信号不好，你听不清对方。", prompt: "这里信号不太好。你能再说一遍吗？", answer: "The signal isn’t very good here. Could you say that again?", chunks: [{text:"The signal isn’t very good",meaning:"信号不太好"},{text:"say that again",meaning:"再说一遍"}], hint: "signal / not very good / say that again", followUp: "还是听不清，你想说“我晚点给你回电话”。" },
  { scene: "求助", icon: "🧭", context: "你迷路了，想问路人去车站怎么走。", prompt: "不好意思，你知道去火车站怎么走吗？", answer: "Excuse me, do you know how to get to the train station?", chunks: [{text:"Do you know how to get to…?",meaning:"你知道怎么去……吗"},{text:"train station",meaning:"火车站"}], hint: "Excuse me / know how to get to / station", followUp: "对方指路后，你想确认“走路大概要多久？”" },
];

const scenes = ["全部", ...Array.from(new Set(cards.map(c => c.scene)))];

export default function Home() {
  const [scene, setScene] = useState("全部");
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<"prompt"|"hint"|"answer"|"transfer">("prompt");
  const [done, setDone] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const filtered = useMemo(() => cards.map((c, i) => ({...c, originalIndex:i})).filter(c => scene === "全部" || c.scene === scene), [scene]);
  const card = filtered[index % filtered.length];

  useEffect(() => { const raw = localStorage.getItem("chunk-progress"); if (raw) setDone(JSON.parse(raw)); }, []);
  const speak = (text: string, rate=.88) => { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang="en-US"; u.rate=rate; speechSynthesis.speak(u); };
  const chooseScene = (s:string) => { setScene(s); setIndex(0); setStep("prompt"); };
  const next = (remembered:boolean) => {
    if (remembered && !done.includes(card.originalIndex)) { const n=[...done,card.originalIndex]; setDone(n); localStorage.setItem("chunk-progress",JSON.stringify(n)); }
    setStreak(remembered ? streak+1 : 0); setIndex((index+1)%filtered.length); setStep("prompt");
  };

  return <main>
    <header>
      <div className="brand"><span className="logo">C</span><div><strong>Chunk Talk</strong><small>把想说的话，练成脱口而出的语块</small></div></div>
      <div className="progress"><span>今日连胜 <b>{streak}</b></span><span className="bar"><i style={{width:`${Math.round(done.length/cards.length*100)}%`}} /></span><span>{done.length}/{cards.length}</span></div>
    </header>

    <section className="hero">
      <div><span className="eyebrow">DAILY SPEAKING LAB</span><h1>别再背孤零零的单词。<br/><em>练你今天真的会说的话。</em></h1><p>先凭记忆开口，再看提示，最后用自然语块重说一遍。每天 10 分钟，让英语从“认识”变成“说得出”。</p></div>
      <div className="today"><b>{done.length ? "继续保持" : "今天，从一句开始"}</b><span>{done.length ? `你已经掌握 ${done.length} 个生活表达` : "不求完美，先把意思说出来"}</span></div>
    </section>

    <nav aria-label="选择生活场景">
      {scenes.map(s => <button key={s} className={scene===s?"active":""} onClick={()=>chooseScene(s)}>{s}</button>)}
    </nav>

    <section className="practice">
      <aside>
        <span className="sceneIcon">{card.icon}</span><span className="sceneName">{card.scene}</span>
        <h2>{card.context}</h2>
        <div className="instruction"><span>1</span><p><b>先别看答案</b><br/>用你现有的英语说出来。卡住也没关系。</p></div>
        <div className="instruction"><span>2</span><p><b>说完再揭晓</b><br/>注意整块表达，不要逐词翻译。</p></div>
      </aside>

      <article className="card">
        <div className="cardTop"><span>第 {index+1} / {filtered.length} 题</span><button onClick={()=>setIndex(Math.floor(Math.random()*filtered.length))}>↝ 换一道</button></div>
        <label>你想表达</label><h3>{card.prompt}</h3>

        {step === "prompt" && <div className="actionArea"><p>现在，大声说出来。</p><div><button className="secondary" onClick={()=>setStep("hint")}>给我一点提示</button><button className="primary" onClick={()=>setStep("answer")}>我说完了 · 看答案</button></div></div>}
        {step === "hint" && <div className="hint"><label>只看关键词，再试一次</label><p>{card.hint}</p><button className="primary" onClick={()=>setStep("answer")}>看自然表达</button></div>}
        {(step === "answer" || step === "transfer") && <div className="answer">
          <label>自然表达 <button className="sound" onClick={()=>speak(card.answer)}>▶ 听一遍</button></label><h4>{card.answer}</h4>
          <div className="chunks">{card.chunks.map(c=><div key={c.text}><b>{c.text}</b><span>{c.meaning}</span></div>)}</div>
          {step === "answer" && <div className="repeat"><button onClick={()=>speak(card.answer,.68)}>🐢 慢速</button><button onClick={()=>speak(card.answer)}>▶ 正常</button><button className="primary" onClick={()=>setStep("transfer")}>我跟读了 · 换个情境</button></div>}
        </div>}
        {step === "transfer" && <div className="transfer"><label>迁移挑战 · 不看原句</label><p>{card.followUp}</p><div><button className="secondary" onClick={()=>next(false)}>还不熟，再遇一次</button><button className="primary" onClick={()=>next(true)}>说出来了 ✓</button></div></div>}
      </article>
    </section>

    <footer><span>训练原则：先输出 → 再提示 → 整块记忆 → 换境复用</span><span>你的进度只保存在当前设备</span></footer>
  </main>;
}
