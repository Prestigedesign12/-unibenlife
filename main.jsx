import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Home, Wallet, BriefcaseBusiness, MapPinned, Store, UserRound, Bell,
  Search, Menu, X, ChevronRight, ArrowUpRight, Clock3, GraduationCap,
  Utensils, Bike, BookOpen, Coffee, Building2, Landmark, ShieldCheck,
  CircleHelp, LogOut, Plus, CheckCircle2, LockKeyhole, Sparkles, Map,
  TrendingUp, BedDouble, Shirt, Users, CalendarDays
} from "lucide-react";
import "./styles.css";
import { supabase, hasCloudBackend } from "./lib/supabase";

const initialState = {
  player: { name: "Campus Explorer", username: "newstudent", level: 1, xp: 15, energy: 86, mood: "Good", studentStatus: "Student profile not verified" },
  balance: 25000,
  bank: 10000,
  day: 1,
  jobsDone: 0,
  studySessions: 0,
  activities: [
    { icon: "spark", title: "Welcome to UNIBEN Life", detail: "Your campus journey starts here.", time: "Just now" },
    { icon: "wallet", title: "Starter cash received", detail: "₦25,000 added to your wallet.", time: "Just now" }
  ],
  inventory: [],
  rented: null
};

const locations = [
  { name: "Campus Square", type: "Social hub", icon: Users, desc: "Meet students and catch up on campus happenings.", status: "Open", color: "mint" },
  { name: "Food Court", type: "Food & drink", icon: Utensils, desc: "Grab a meal and restore your energy.", status: "Open", color: "peach" },
  { name: "Job Centre", type: "Work", icon: BriefcaseBusiness, desc: "Find starter shifts and earn campus cash.", status: "Open", color: "blue" },
  { name: "Student Market", type: "Shopping", icon: Store, desc: "Browse useful items for your character.", status: "Open", color: "yellow" },
  { name: "Study Lounge", type: "Learning", icon: BookOpen, desc: "Study to gain experience and improve your profile.", status: "Open", color: "purple" },
  { name: "Hostel Desk", type: "Accommodation", icon: BedDouble, desc: "Explore sample room options around campus.", status: "Open", color: "rose" },
];

const jobs = [
  { title: "Cafeteria Assistant", employer: "Campus Food Court", pay: 3500, duration: "1 shift · 15 min (game time)", icon: Utensils, desc: "Help serve meals during a busy campus rush." },
  { title: "Flyer Distributor", employer: "Student Market", pay: 2500, duration: "1 shift · 10 min (game time)", icon: Bike, desc: "Help local vendors get the word out." },
  { title: "Library Helper", employer: "Study Lounge", pay: 3000, duration: "1 shift · 12 min (game time)", icon: BookOpen, desc: "Organise materials and help students find resources." },
];

const shopItems = [
  { name: "Campus meal", price: 1200, icon: Utensils, detail: "Restores 20 energy", energy: 20 },
  { name: "Notebook", price: 800, icon: BookOpen, detail: "A useful study essential", energy: 0 },
  { name: "Fresh outfit", price: 4500, icon: Shirt, detail: "Refresh your campus look", energy: 0 },
  { name: "Coffee", price: 700, icon: Coffee, detail: "Restores 10 energy", energy: 10 },
];

function money(n) { return "₦" + Number(n).toLocaleString("en-NG"); }
function App() {
  const [state, setState] = useState(() => {
    try { return { ...initialState, ...JSON.parse(localStorage.getItem("unibenlife-save") || "{}") }; }
    catch { return initialState; }
  });
  const [active, setActive] = useState("Overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [newName, setNewName] = useState(state.player.name);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "" });
  const [localAccount, setLocalAccount] = useState(() => { try { return JSON.parse(localStorage.getItem("unibenlife-account") || "null"); } catch { return null; } });
  const [authUser, setAuthUser] = useState(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAuthUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) setRemoteLoaded(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !authUser) return;
    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase.from("player_profiles").select("display_name").eq("id", authUser.id).maybeSingle();
      const { data: save, error } = await supabase.from("player_saves").select("game_state").eq("user_id", authUser.id).maybeSingle();
      if (cancelled) return;
      if (save?.game_state && Object.keys(save.game_state).length) {
        setState({ ...initialState, ...save.game_state, player: { ...initialState.player, ...(save.game_state.player || {}) } });
      } else {
        const name = profile?.display_name || authUser.user_metadata?.display_name || "Campus Explorer";
        setState(prev => ({ ...prev, player: { ...prev.player, name } }));
        if (!error) await supabase.from("player_saves").upsert({ user_id: authUser.id, game_state: { ...initialState, player: { ...initialState.player, name } }, updated_at: new Date().toISOString() });
      }
      setLocalAccount({ email: authUser.email, name: profile?.display_name || authUser.user_metadata?.display_name || "Campus Explorer", access: "open", cloud: true });
      setRemoteLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [authUser?.id]);

  useEffect(() => {
    if (!supabase || !authUser || !remoteLoaded) return;
    const timer = setTimeout(() => {
      supabase.from("player_saves").upsert({ user_id: authUser.id, game_state: state, updated_at: new Date().toISOString() }).then(({ error }) => {
        if (error) console.error("UNIBEN Life cloud save failed:", error.message);
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [state, authUser?.id, remoteLoaded]);

  useEffect(() => { localStorage.setItem("unibenlife-save", JSON.stringify(state)); }, [state]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const update = (fn) => setState(prev => fn(structuredClone(prev)));
  const addXP = (draft, points) => {
    draft.player.xp += points;
    while (draft.player.xp >= 100) {
      draft.player.xp -= 100;
      draft.player.level += 1;
      draft.activities.unshift({ icon: "spark", title: `Level ${draft.player.level} reached!`, detail: "Your campus experience is growing.", time: "Just now" });
    }
  };
  const study = () => {
    if (state.player.energy < 10) { setNotice("You're too tired to study. Take a rest or grab a meal first."); return; }
    update(d => {
      d.player.energy = Math.max(0, d.player.energy - 10);
      d.studySessions = (d.studySessions || 0) + 1;
      addXP(d, 20);
      addActivity(d, "Study session completed", "You studied at the Study Lounge and gained 20 XP.");
      return d;
    });
    setNotice("Study session complete! You gained 20 XP.");
  };
  const rest = () => {
    update(d => {
      d.player.energy = Math.min(100, d.player.energy + 35);
      d.day += 1;
      addActivity(d, "Rested and recharged", "A new campus day begins. Energy restored.");
      return d;
    });
    setNotice("You feel refreshed. A new campus day has begun!");
  };
  const addActivity = (draft, title, detail) => {
    draft.activities.unshift({ icon: "spark", title, detail, time: "Just now" });
    draft.activities = draft.activities.slice(0, 8);
  };
  const doJob = (job) => {
    if (state.player.energy < 15) { setNotice("You're low on energy. Visit the Food Court first."); return; }
    update(d => {
      d.balance += job.pay;
      d.jobsDone += 1;
      addXP(d, 12);
      d.player.energy = Math.max(0, d.player.energy - 15);
      addActivity(d, `${job.title} completed`, `${money(job.pay)} earned at ${job.employer}.`);
      return d;
    });
    setNotice(`Shift complete! You earned ${money(job.pay)}.`);
  };
  const buyItem = (item) => {
    if (state.balance < item.price) { setNotice("Not enough cash for this item yet."); return; }
    update(d => {
      d.balance -= item.price;
      d.inventory.push(item.name);
      if (item.energy) d.player.energy = Math.min(100, d.player.energy + item.energy);
      addActivity(d, `${item.name} purchased`, `${money(item.price)} spent at the Student Market.`);
      return d;
    });
    setNotice(`${item.name} purchased successfully.`);
  };
  const eatMeal = () => {
    if (state.balance < 1200) { setNotice("You need more cash for a meal."); return; }
    update(d => {
      d.balance -= 1200;
      d.player.energy = Math.min(100, d.player.energy + 25);
      addActivity(d, "Meal enjoyed", "Energy restored after a stop at the Food Court.");
      return d;
    });
    setNotice("Meal enjoyed. Energy restored!");
  };
  const bankMove = (direction, amount) => {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (!n) { setNotice("Enter an amount greater than zero."); return; }
    if (direction === "deposit" && n > state.balance) { setNotice("Your wallet balance is too low."); return; }
    if (direction === "withdraw" && n > state.bank) { setNotice("Your bank balance is too low."); return; }
    update(d => {
      if (direction === "deposit") { d.balance -= n; d.bank += n; }
      else { d.balance += n; d.bank -= n; }
      addActivity(d, direction === "deposit" ? "Money deposited" : "Money withdrawn", `${money(n)} ${direction === "deposit" ? "moved into" : "moved out of"} your bank.`);
      return d;
    });
    setNotice("Bank transaction successful.");
  };
  const nav = [
    { label: "Overview", icon: Home, group: "MAIN" },
    { label: "Locations", icon: MapPinned, group: "MAIN" },
    { label: "Jobs", icon: BriefcaseBusiness, group: "LIFE" },
    { label: "Study & Rest", icon: BookOpen, group: "LIFE" },
    { label: "Wallet & Bank", icon: Wallet, group: "LIFE" },
    { label: "Market", icon: Store, group: "LIFE" },
    { label: "My Profile", icon: UserRound, group: "YOU" },
  ];
  const filteredLocations = locations.filter(l => (l.name + " " + l.type + " " + l.desc).toLowerCase().includes(search.toLowerCase()));

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="brand">
        <div className="brand-mark"><GraduationCap size={24}/></div>
        <div><div className="brand-name">UNIBEN<span> LIFE</span></div><div className="brand-sub">CAMPUS SIMULATOR</div></div>
        <button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={20}/></button>
      </div>
      <div className="campus-chip"><span className="online-dot"></span><span>UNIBEN · Ugbowo Campus</span></div>
      <div className="nav-wrap">
        {["MAIN", "LIFE", "YOU"].map(group => <div className="nav-group" key={group}>
          <div className="nav-label">{group}</div>
          {nav.filter(item => item.group === group).map(item => <button key={item.label} onClick={() => { setActive(item.label); setMobileNav(false); }} className={`nav-item ${active === item.label ? "active" : ""}`}>
            <item.icon size={18} strokeWidth={1.9}/><span>{item.label}</span>{item.label === "Jobs" && <span className="nav-count">3</span>}
          </button>)}
        </div>)}
      </div>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><div><strong>New around here?</strong><p>Explore campus and build your story.</p></div><ChevronRight size={16}/></div>
        <div className="sidebar-user"><div className="avatar small-avatar">{(state.player.name || "C").slice(0,1).toUpperCase()}</div><div className="user-meta"><strong>{state.player.name}</strong><span>Level {state.player.level} · Newcomer</span></div><button className="icon-button logout-button" onClick={() => { setAuthMode("login"); setAuthOpen(true); }} title="Account options"><LogOut size={16}/></button></div>
      </div>
    </aside>
    {mobileNav && <div className="mobile-overlay" onClick={() => setMobileNav(false)}></div>}
    <main className="main-area">
      <header className="topbar">
        <button className="menu-toggle" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={22}/></button>
        <div className="breadcrumb"><span>UNIBEN LIFE</span><ChevronRight size={14}/><strong>{active}</strong></div>
        <div className="top-actions">
          <div className="day-pill"><span className="sun-dot"></span> Day {state.day} <span className="pill-divider"></span> <Clock3 size={14}/> 10:45 AM</div>
          <button className="icon-button notification-button" title="Notifications" onClick={() => setNotice("You're all caught up on campus updates.")}><Bell size={18}/><i></i></button>
          <button className="top-avatar avatar" onClick={() => setActive("My Profile")} title="Open profile">{(state.player.name || "C").slice(0,1).toUpperCase()}</button>
        </div>
      </header>

      <div className="page-content">
        {active === "Overview" && <Overview state={state} setActive={setActive} setNotice={setNotice} eatMeal={eatMeal} />}
        {active === "Locations" && <LocationsPage locations={filteredLocations} search={search} setSearch={setSearch} setActive={setActive} />}
        {active === "Jobs" && <JobsPage jobs={jobs} state={state} doJob={doJob} />}
        {active === "Study & Rest" && <StudyPage state={state} study={study} rest={rest} />}
        {active === "Wallet & Bank" && <BankPage state={state} bankMove={bankMove} />}
        {active === "Market" && <MarketPage state={state} buyItem={buyItem} />}
        {active === "My Profile" && <ProfilePage state={state} setProfileOpen={setProfileOpen} />}
        <footer className="footer"><span>© 2026 UNIBEN Life</span><span><span className="footer-dot"></span> {hasCloudBackend ? (authUser ? "Cloud save enabled" : "Email sign-in available") : "Prototype build · local save"}</span><button onClick={() => setNotice("UNIBEN Life is an independent concept project, not an official University of Benin service.")}>About this project</button></footer>
      </div>
    </main>

    {profileOpen && <div className="modal-backdrop" onClick={() => setProfileOpen(false)}><div className="modal" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setProfileOpen(false)}><X size={18}/></button>
      <div className="modal-kicker">PLAYER SETTINGS</div><h2>Make it your campus story.</h2><p className="modal-desc">Choose how your character appears in UNIBEN Life.</p>
      <label className="field-label">Character name</label><input className="text-input" value={newName} onChange={e => setNewName(e.target.value)} maxLength={24} placeholder="Enter character name"/>
      <button className="primary-button full-button" onClick={() => { const name = newName.trim() || "Campus Explorer"; update(d => { d.player.name = name; return d; }); setProfileOpen(false); setNotice("Profile updated."); }}>Save profile <ChevronRight size={17}/></button>
    </div></div>}

    {authOpen && <div className="modal-backdrop" onClick={() => setAuthOpen(false)}><div className="modal" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close account window"><X size={18}/></button><div className="modal-kicker">OPEN TO EVERYONE</div><h2>{authMode === "login" ? "Welcome back." : "Join campus life."}</h2><p className="modal-desc">Anyone can play UNIBEN Life. Create a profile and continue your campus story. Cloud accounts are available when this app is connected to its backend.</p>
      {authMode === "signup" && <><label className="field-label">Character name</label><input className="text-input" type="text" placeholder="What should we call you?" maxLength={24} value={authForm.name} onChange={e => setAuthForm({...authForm, name:e.target.value})}/></>}
      <label className="field-label">Email address</label><input className="text-input" type="email" placeholder="you@example.com" value={authForm.email} onChange={e => setAuthForm({...authForm, email:e.target.value})}/>
      <div className="demo-note"><LockKeyhole size={15}/> {hasCloudBackend ? "Secure email sign-in is enabled. We will send you a one-time sign-in link." : "Local demo mode: connect the Supabase project to enable secure sign-in and cloud saves."}</div>
      <button className="primary-button full-button" onClick={async () => {
        const email = authForm.email.trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setNotice("Enter a valid email address to continue."); return; }
        if (hasCloudBackend) {
          const name = authForm.name.trim();
          if (authMode === "signup" && !name) { setNotice("Choose a character name to create your profile."); return; }
          const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin, data: { display_name: name || "Campus Explorer" } } });
          if (error) { setNotice(error.message); return; }
          setAuthOpen(false);
          setNotice("Check your email for your secure UNIBEN Life sign-in link.");
          return;
        }
        if (authMode === "signup") {
          const name = authForm.name.trim();
          if (!name) { setNotice("Choose a character name to create your profile."); return; }
          const account = { email, name, createdAt: new Date().toISOString(), access: "open" };
          localStorage.setItem("unibenlife-account", JSON.stringify(account)); setLocalAccount(account);
          update(d => { d.player.name = name; d.player.username = email.split("@")[0].replace(/[^a-z0-9_]/g, "") || "campusplayer"; d.player.studentStatus = "Open access player · not verified"; addActivity(d, "Player profile created", "Welcome! Your local UNIBEN Life profile is ready."); return d; });
          setAuthOpen(false); setNotice("Your local player profile is ready. Welcome to UNIBEN Life!");
        } else if (localAccount && localAccount.email === email) {
          setAuthOpen(false); setNotice(`Welcome back, ${localAccount.name}! Your progress is saved on this device.`);
        } else {
          setNotice("No matching local profile found on this device. Choose Join campus life to create one.");
        }
      }}>{authMode === "login" ? "Email me a sign-in link" : "Create account & email link"} <ChevronRight size={17}/></button>
      <button className="auth-switch" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthForm({ name: "", email: authForm.email }); }}>{authMode === "login" ? "New here? Create a free player profile" : "Already created a profile? Log in"}</button>
    </div></div>}
    {notice && <div className="toast"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={() => setNotice("")}><X size={15}/></button></div>}
  </div>;
}

function PageHeading({ eyebrow, title, desc, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{desc}</p></div>{action}</div>;
}
function Overview({ state, setActive, setNotice, eatMeal }) {
  const xpPercent = Math.min(100, (state.player.xp / 100) * 100);
  return <>
    <div className="welcome-banner">
      <div className="welcome-copy"><div className="welcome-label"><Sparkles size={14}/> YOUR CAMPUS STORY STARTS HERE</div><h1>Hey, {state.player.name.split(" ")[0]} <span className="wave">✌️</span></h1><p>New semester, new opportunities. What will you make of campus life today?</p>
        <div className="welcome-actions"><button className="light-button" onClick={() => setActive("Locations")}>Explore campus <ArrowUpRight size={16}/></button><button className="ghost-light-button" onClick={() => setActive("Jobs")}>Find a job <ChevronRight size={16}/></button></div>
      </div>
      <div className="welcome-art"><div className="art-sun"></div><div className="art-cloud cloud-one"></div><div className="art-cloud cloud-two"></div><div className="art-building building-back"></div><div className="art-building building-front"><div className="building-roof"></div><div className="building-windows"></div></div><div className="art-tree tree-one"></div><div className="art-tree tree-two"></div><div className="art-ground"></div><div className="art-sign">UNIBEN <span>CAMPUS</span></div></div>
    </div>
    <div className="section-title-row"><div><h2>Your snapshot</h2><p>A quick look at how you're doing.</p></div><span className="live-label"><i></i> LIVE STATUS</span></div>
    <div className="stats-grid">
      <StatCard label="Wallet balance" value={money(state.balance)} sub="Ready to spend" icon={Wallet} color="green" trend="Virtual cash"/>
      <StatCard label="Bank savings" value={money(state.bank)} sub="Keep your money safe" icon={Landmark} color="blue" trend="Your savings"/>
      <StatCard label="Energy level" value={`${state.player.energy}%`} sub={state.player.energy < 30 ? "Time to recharge" : "You're feeling good"} icon={Sparkles} color="orange" progress={state.player.energy}/>
      <StatCard label="Work completed" value={state.jobsDone} sub="Shifts completed" icon={BriefcaseBusiness} color="purple" trend="Keep it up"/>
    </div>
    <div className="content-grid">
      <div className="panel quick-panel">
        <div className="panel-header"><div><h3>Jump right in</h3><p>Your next campus move is one tap away.</p></div><span className="panel-spark"><Sparkles size={17}/></span></div>
        <div className="quick-actions">
          <QuickAction icon={MapPinned} color="green" title="Explore locations" desc="Find your next stop" onClick={() => setActive("Locations")}/>
          <QuickAction icon={BriefcaseBusiness} color="orange" title="Get a job" desc="Earn campus cash" onClick={() => setActive("Jobs")}/>
          <QuickAction icon={Wallet} color="blue" title="Manage money" desc="Wallet & savings" onClick={() => setActive("Wallet & Bank")}/>
          <QuickAction icon={Store} color="purple" title="Visit the market" desc="Pick up essentials" onClick={() => setActive("Market")}/>
        </div>
        <div className="campus-tip"><div className="tip-icon"><Sparkles size={17}/></div><div><strong>Campus tip</strong><p>Jobs cost energy, so stop for a meal when you need to recharge.</p></div></div>
      </div>
      <div className="panel activity-panel">
        <div className="panel-header"><div><h3>Recent activity</h3><p>Your latest campus moments.</p></div><button className="text-link" onClick={() => setNotice("Showing your most recent activity.")}>View all <ChevronRight size={15}/></button></div>
        <div className="activity-list">{state.activities.slice(0,4).map((a,i) => <div className="activity-row" key={i}><div className={`activity-icon activity-${a.icon}`}>{a.icon === "wallet" ? <Wallet size={16}/> : <Sparkles size={16}/>}</div><div className="activity-copy"><strong>{a.title}</strong><span>{a.detail}</span></div><time>{a.time}</time></div>)}</div>
        <div className="xp-card"><div className="xp-top"><div><span>PLAYER PROGRESS</span><strong>Level {state.player.level} <em>· Campus newcomer</em></strong></div><span>{state.player.xp}/100 XP</span></div><div className="xp-track"><span style={{width:`${xpPercent}%`}}></span></div><p>Complete jobs and activities to build your experience.</p></div>
      </div>
    </div>
    <div className="section-title-row lower-title"><div><h2>Places to check out</h2><p>A few popular stops around your campus world.</p></div><button className="text-link" onClick={() => setActive("Locations")}>All locations <ChevronRight size={15}/></button></div>
    <div className="location-preview-grid">{locations.slice(0,3).map(loc => <LocationCard key={loc.name} loc={loc} onClick={() => loc.name === "Food Court" ? eatMeal() : setActive(loc.name === "Job Centre" ? "Jobs" : loc.name === "Study Lounge" ? "Study & Rest" : "Locations")}/>)}</div>
  </>;
}
function StatCard({ label, value, sub, icon:Icon, color, trend, progress }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon ${color}`}><Icon size={18}/></div></div><div className="stat-value">{value}</div><div className="stat-bottom"><span>{sub}</span>{progress !== undefined ? <div className="mini-progress"><span style={{width:`${progress}%`}}></span></div> : <span className="stat-trend">{trend}</span>}</div></div>;
}
function QuickAction({ icon:Icon, color, title, desc, onClick }) {
  return <button className="quick-action" onClick={onClick}><div className={`quick-icon ${color}`}><Icon size={19}/></div><div><strong>{title}</strong><span>{desc}</span></div><ChevronRight size={16} className="quick-chevron"/></button>;
}
function LocationCard({ loc, onClick }) {
  const Icon = loc.icon;
  return <button className="location-card" onClick={onClick}><div className={`location-illustration ${loc.color}`}><div className="illustration-circle"></div><Icon size={34}/><span className="open-badge"><i></i> Open</span></div><div className="location-card-body"><div className="location-type">{loc.type}</div><h3>{loc.name}</h3><p>{loc.desc}</p><span className="card-link">Visit location <ArrowUpRight size={15}/></span></div></button>;
}
function LocationsPage({ locations, search, setSearch, setActive }) {
  return <><PageHeading eyebrow="THE CAMPUS MAP" title="Explore your world." desc="From campus hangouts to the places where your next opportunity begins." action={<div className="map-count"><Map size={17}/><span>6 locations</span></div>}/>
    <div className="search-row"><div className="search-box"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search places, services, activities..."/></div><div className="map-note"><span className="online-dot"></span> All demo locations are open</div></div>
    <div className="campus-map"><div className="map-grid-lines"></div><div className="map-road road-a"></div><div className="map-road road-b"></div><div className="map-green green-a"></div><div className="map-green green-b"></div><div className="map-label label-campus">UNIBEN CAMPUS</div><div className="map-label label-ugb">UGBOWO</div><div className="map-pin pin-a"><span><GraduationCap size={17}/></span><b>Main campus</b></div><div className="map-pin pin-b"><span><Utensils size={17}/></span><b>Food court</b></div><div className="map-pin pin-c"><span><Store size={17}/></span><b>Student market</b></div><div className="map-pin pin-d"><span><BedDouble size={17}/></span><b>Hostel desk</b></div><div className="map-legend"><span><i className="legend-green"></i> Campus</span><span><i className="legend-yellow"></i> Services</span></div></div>
    <div className="section-title-row"><div><h2>All locations</h2><p>Choose where you want to go next.</p></div><span className="result-count">{locations.length} places</span></div>
    <div className="location-grid">{locations.map(loc => <LocationCard key={loc.name} loc={loc} onClick={() => setActive(loc.name === "Job Centre" ? "Jobs" : loc.name === "Student Market" ? "Market" : loc.name === "Study Lounge" ? "Study & Rest" : "Locations")}/>)}</div>
  </>;
}
function StudyPage({ state, study, rest }) {
  const xpPercent = Math.min(100, (state.player.xp / 100) * 100);
  return <>
    <PageHeading eyebrow="WELLBEING & LEARNING" title="Find your balance." desc="Build your knowledge, recharge your energy, and get ready for another campus day." action={<div className="balance-mini"><Sparkles size={17}/><div><span>Current energy</span><strong>{state.player.energy}%</strong></div></div>}/>
    <div className="study-hero"><div className="study-hero-copy"><span className="study-kicker"><GraduationCap size={14}/> CAMPUS WELLBEING</span><h2>Make progress, at your own pace.</h2><p>Study sessions help your character gain experience. Rest when your energy gets low, then head back out to campus.</p><div className="study-level-row"><div><span>YOUR CURRENT LEVEL</span><strong>Level {state.player.level}</strong></div><div className="study-xp"><span>{state.player.xp}/100 XP TO NEXT LEVEL</span><div className="xp-track"><span style={{width:`${xpPercent}%`}}></span></div></div></div></div><div className="study-hero-art"><div className="study-book"><BookOpen size={64}/></div><div className="study-star star-a">✦</div><div className="study-star star-b">✧</div><div className="study-circle"></div></div></div>
    <div className="section-title-row"><div><h2>Your campus routine</h2><p>Choose an activity that fits your energy.</p></div><span className="result-count">{state.studySessions || 0} study sessions</span></div>
    <div className="routine-grid"><div className="routine-card"><div className="routine-icon routine-study"><BookOpen size={25}/></div><span className="routine-label">LEARNING</span><h3>Study at the lounge</h3><p>Settle in, review your notes, and build your character's experience.</p><div className="routine-reward"><span><Sparkles size={14}/> +20 XP</span><span><ZapIcon/> −10 energy</span></div><button className="primary-button routine-button" onClick={study} disabled={state.player.energy < 10}>Start study session <ChevronRight size={16}/></button></div><div className="routine-card"><div className="routine-icon routine-rest"><BedDouble size={25}/></div><span className="routine-label">RECOVERY</span><h3>Take a proper rest</h3><p>Pause your busy schedule, restore your energy, and start a fresh in-game day.</p><div className="routine-reward"><span><Sparkles size={14}/> +35 energy</span><span><Clock3 size={14}/> Next day</span></div><button className="secondary-button routine-button" onClick={rest} disabled={state.player.energy >= 100}>Rest and recharge <ChevronRight size={16}/></button></div></div>
    <div className="disclaimer-strip"><CircleHelp size={17}/><span>Study sessions and energy are fictional game mechanics. Progress is saved in this browser, not to an online account yet.</span></div>
  </>;
}
function ZapIcon() { return <Sparkles size={14}/>; }

function JobsPage({ jobs, state, doJob }) {
  return <><PageHeading eyebrow="WORK & EARN" title="Find your next shift." desc="Take on a campus gig, earn virtual cash, and build your experience." action={<div className="balance-mini"><Wallet size={17}/><div><span>Available cash</span><strong>{money(state.balance)}</strong></div></div>}/>
    <div className="job-banner"><div className="job-banner-icon"><BriefcaseBusiness size={27}/></div><div><span>STARTER OPPORTUNITIES</span><h2>Small shifts. Bigger plans.</h2><p>Every completed shift earns you money and experience. Keep an eye on your energy.</p></div><div className="job-banner-stat"><span>YOUR ENERGY</span><strong>{state.player.energy}%</strong><div className="energy-track"><i style={{width:`${state.player.energy}%`}}></i></div></div></div>
    <div className="section-title-row"><div><h2>Available jobs</h2><p>Starter roles in the campus community.</p></div><span className="result-count">{jobs.length} opportunities</span></div>
    <div className="job-list">{jobs.map(job => <div className="job-card" key={job.title}><div className="job-icon"><job.icon size={22}/></div><div className="job-info"><h3>{job.title}</h3><span className="job-employer">{job.employer}</span><p>{job.desc}</p><div className="job-duration"><Clock3 size={14}/>{job.duration}</div></div><div className="job-pay"><span>PAY PER SHIFT</span><strong>{money(job.pay)}</strong><button className="primary-button" onClick={() => doJob(job)} disabled={state.player.energy < 15}>Start shift <ChevronRight size={16}/></button></div></div>)}</div>
    <div className="disclaimer-strip"><CircleHelp size={17}/><span>These are fictional starter jobs for the prototype. No real employment or payments are involved.</span></div>
  </>;
}
function BankPage({ state, bankMove }) {
  const [amount, setAmount] = useState("5000");
  return <><PageHeading eyebrow="YOUR FINANCES" title="Money, managed." desc="Keep track of your campus cash and move money between your wallet and savings."/>
    <div className="finance-cards"><div className="finance-card wallet-finance"><div className="finance-label"><Wallet size={18}/> WALLET CASH</div><div className="finance-amount">{money(state.balance)}</div><p>Spend on food, items and campus activities.</p><div className="finance-card-bottom"><span>Available to spend</span><span className="finance-dot"></span></div></div><div className="finance-card bank-finance"><div className="finance-label"><Landmark size={18}/> BANK SAVINGS</div><div className="finance-amount">{money(state.bank)}</div><p>Set money aside for your bigger plans.</p><div className="finance-card-bottom"><span>Safe in your virtual bank</span><span className="finance-dot"></span></div></div></div>
    <div className="bank-layout"><div className="panel transfer-panel"><div className="panel-header"><div><h3>Move your money</h3><p>Transfer between wallet and bank instantly.</p></div><div className="transfer-icon"><ArrowUpRight size={18}/></div></div><label className="field-label">Amount (₦)</label><div className="amount-input"><span>₦</span><input value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d]/g,""))} inputMode="numeric"/><span className="amount-currency">NGN</span></div><div className="amount-presets">{[1000,5000,10000].map(n => <button key={n} onClick={() => setAmount(String(n))}>{money(n)}</button>)}</div><div className="transfer-buttons"><button className="primary-button" onClick={() => bankMove("deposit",amount)}>Deposit to bank <ArrowUpRight size={16}/></button><button className="secondary-button" onClick={() => bankMove("withdraw",amount)}>Withdraw to wallet <ArrowUpRight size={16}/></button></div><div className="secure-note"><ShieldCheck size={15}/> Demo transactions are saved in this browser only.</div></div>
    <div className="panel money-tips"><div className="panel-header"><div><h3>Money tips</h3><p>Make your virtual cash go further.</p></div></div><div className="tip-row"><div className="tip-bullet green-bullet"><TrendingUp size={17}/></div><div><strong>Work before you spend</strong><p>Take a shift to top up your wallet when funds run low.</p></div></div><div className="tip-row"><div className="tip-bullet blue-bullet"><Landmark size={17}/></div><div><strong>Build your savings</strong><p>Move spare cash into the bank for future purchases.</p></div></div><div className="tip-row"><div className="tip-bullet orange-bullet"><Sparkles size={17}/></div><div><strong>Watch your energy</strong><p>Food and rest keep you ready for more shifts.</p></div></div></div></div>
  </>;
}
function MarketPage({ state, buyItem }) {
  return <><PageHeading eyebrow="CAMPUS MARKET" title="A few things for the journey." desc="Pick up useful essentials for your character using virtual cash." action={<div className="balance-mini"><Wallet size={17}/><div><span>Available cash</span><strong>{money(state.balance)}</strong></div></div>}/>
    <div className="market-notice"><Store size={19}/><div><strong>Welcome to the Student Market</strong><p>Items are prototype inventory only. Purchases use demo currency, not real money.</p></div></div>
    <div className="shop-grid">{shopItems.map(item => <div className="shop-card" key={item.name}><div className={`shop-art shop-${item.name.toLowerCase().replaceAll(" ","-")}`}><div className="shop-art-circle"></div><item.icon size={40}/></div><div className="shop-card-body"><h3>{item.name}</h3><p>{item.detail}</p><div className="shop-buy-row"><strong>{money(item.price)}</strong><button className="primary-button" onClick={() => buyItem(item)} disabled={state.balance < item.price}><Plus size={15}/> Buy</button></div></div></div>)}</div>
    <div className="panel inventory-panel"><div className="panel-header"><div><h3>Your inventory</h3><p>Things you've picked up on campus.</p></div><span className="inventory-count">{state.inventory.length} items</span></div>{state.inventory.length ? <div className="inventory-tags">{state.inventory.map((it,i) => <span key={i}><CheckCircle2 size={14}/>{it}</span>)}</div> : <div className="empty-state"><div><Store size={22}/></div><strong>Your bag is still empty</strong><p>Visit the market above to get started.</p></div>}</div>
  </>;
}
function ProfilePage({ state, setProfileOpen }) {
  return <><PageHeading eyebrow="YOUR IDENTITY" title="Your campus profile." desc="This is your character's home base. Shape your name and grow your story." action={<button className="primary-button" onClick={() => setProfileOpen(true)}>Edit profile <UserRound size={16}/></button>}/>
    <div className="profile-hero"><div className="profile-avatar">{(state.player.name || "C").slice(0,1).toUpperCase()}<span className="profile-online"></span></div><div className="profile-identity"><span className="profile-tag"><Sparkles size={13}/> CAMPUS NEWCOMER</span><h2>{state.player.name}</h2><p>@{state.player.username} · Level {state.player.level}</p><div className="profile-badges"><span><GraduationCap size={14}/> UNIBEN Life player</span><span><ShieldCheck size={14}/> Demo profile</span></div></div><div className="profile-xp"><span>EXPERIENCE</span><strong>{state.player.xp} <em>/ 100 XP</em></strong><div className="xp-track"><span style={{width:`${Math.min(100,state.player.xp)}%`}}></span></div></div></div>
    <div className="section-title-row"><div><h2>Player statistics</h2><p>Your progress so far in the simulation.</p></div></div>
    <div className="stats-grid profile-stats"><StatCard label="Wallet balance" value={money(state.balance)} sub="Spendable virtual cash" icon={Wallet} color="green" trend="Wallet"/><StatCard label="Bank savings" value={money(state.bank)} sub="Saved virtual cash" icon={Landmark} color="blue" trend="Savings"/><StatCard label="Jobs completed" value={state.jobsDone} sub="Total shifts finished" icon={BriefcaseBusiness} color="orange" trend="Work"/><StatCard label="Items owned" value={state.inventory.length} sub="In your inventory" icon={Store} color="purple" trend="Items"/></div>
    <div className="verification-card"><div className="verification-icon"><ShieldCheck size={22}/></div><div><strong>Student verification</strong><p>Student-only access is planned for the live version. This prototype does not verify enrolment or represent an official UNIBEN service.</p></div><span className="pending-pill">Coming later</span></div>
  </>;
}

createRoot(document.getElementById("root")).render(<App />);
