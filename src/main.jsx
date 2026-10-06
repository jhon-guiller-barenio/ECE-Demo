import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Check, ChevronDown, CircleHelp, Clock3, Globe2, Headphones, HeartHandshake, MapPin, Menu, MessageCircle, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

const roles = [
  { title: 'Customer Experience Associate', group: 'Customer Support', place: 'Dumaguete', type: 'Full time', desc: 'Help customers get clear, thoughtful answers across phone, chat, or email.' },
  { title: 'Chat Support Representative', group: 'Customer Support', place: 'Makati', type: 'Full time', desc: 'Resolve customer questions through responsive, friendly digital conversations.' },
  { title: 'Quality Assurance Analyst', group: 'Operations', place: 'Dumaguete', type: 'Full time', desc: 'Review customer interactions and turn feedback into better service.' },
];
const locations = [
  { city: 'Makati', region: 'Metro Manila, Philippines', address: 'Robinsons Summit Center, Ayala Avenue', link: 'https://maps.google.com/?q=Robinsons+Summit+Center+Makati' },
  { city: 'Dumaguete', region: 'Negros Oriental, Philippines', address: 'ECE operations center, Dumaguete City', link: 'https://maps.google.com/?q=ECE+Contact+Centers+Dumaguete' },
];

function App() {
  const [page, setPage] = useState(() => window.location.pathname === '/admin' ? 'admin' : window.location.pathname === '/apply' ? 'apply' : window.location.pathname === '/why-ece' ? 'difference' : 'home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(roles[0].title);
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [session, setSession] = useState(null);
  const [form, setForm] = useState({ firstName:'', lastName:'', phone:'', location:'', experience:'', note:'' });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState(roles);
  const [applications, setApplications] = useState([]);
  const [adminEmail, setAdminEmail] = useState('');
  const [admin, setAdmin] = useState(false);
  const [filter, setFilter] = useState('All');
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onPopState = () => setPage(window.location.pathname === '/admin' ? 'admin' : window.location.pathname === '/apply' ? 'apply' : window.location.pathname === '/why-ece' ? 'difference' : 'home');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('jobs').select('id,title,department,location,employment_type,description').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) setJobs(data.map(j => ({...j, group:j.department, place:j.location, type:j.employment_type, desc:j.description}))); });
  }, []);

  useEffect(() => { if (page === 'admin' && session) loadApplications(); }, [page, session]);
  async function loadApplications() {
    if (!supabase) return;
    const { data, error } = await supabase.from('applications').select('id,first_name,last_name,email,phone,location,experience,note,status,created_at,jobs(title)').order('created_at', { ascending: false });
    if (error) setStatus(error.message); else setApplications(data || []);
  }
  const go = (name) => { setPage(name); const paths={home:'/',apply:'/apply',admin:'/admin',difference:'/why-ece'}; window.history.pushState({}, '', paths[name]||'/'); setMobileOpen(false); window.scrollTo({top:0,behavior:'smooth'}); };
  const apply = (role) => { setSelectedRole(role); setStatus(''); go('apply'); };
  const setField = (key, val) => setForm(s => ({...s, [key]:val}));

  async function sendVerification(e) {
    e.preventDefault(); setStatus('');
    if (!email.toLowerCase().endsWith('@gmail.com')) return setStatus('Please use a Gmail address to continue.');
    if (!supabase) return setStatus('Connect Supabase first using the setup guide, then email verification will be available.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/apply` } });
    setBusy(false);
    if (error) setStatus(error.message); else { setOtpSent(true); setStatus('Check your Gmail inbox and click the verification link. This page will unlock once verified.'); }
  }
  async function submitApplication(e) {
    e.preventDefault(); setStatus('');
    if (!supabase) return setStatus('Connect Supabase first using the setup guide.');
    if (!session?.user?.email_confirmed_at) return setStatus('Verify your email before submitting.');
    setBusy(true);
    let jobId = null;
    const { data: matchedJob } = await supabase.from('jobs').select('id').eq('title', selectedRole).maybeSingle();
    jobId = matchedJob?.id || null;
    const { error } = await supabase.from('applications').insert({
      user_id: session.user.id, job_id: jobId, first_name: form.firstName.trim(), last_name: form.lastName.trim(),
      email: session.user.email, phone: form.phone.trim(), location: form.location, experience: form.experience, note: form.note.trim(), status:'New'
    });
    setBusy(false);
    if (error) setStatus(error.message); else { setStatus('Application submitted. Thank you — your response has been received.'); setForm({ firstName:'', lastName:'', phone:'', location:'', experience:'', note:'' }); }
  }
  async function signInAdmin(e) {
    e.preventDefault(); setStatus('');
    if (!supabase) return setStatus('Connect Supabase first using the setup guide.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: adminEmail.trim().toLowerCase(), options:{ emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (error) setStatus(error.message); else setStatus('Check your email for the secure sign-in link. Your account must be assigned the admin role.');
  }
  useEffect(() => {
    if (page !== 'admin' || !session || !supabase) { setAdmin(false); return; }
    supabase.auth.getUser().then(({data}) => {
      const isAdmin = data?.user?.app_metadata?.role === 'admin';
      setAdmin(isAdmin);
      if (!isAdmin) setStatus('This verified account does not have admin access.');
    });
  }, [page, session]);
  async function updateStatus(id, next) {
    const { error } = await supabase.from('applications').update({status:next}).eq('id', id);
    if (error) setStatus(error.message); else loadApplications();
  }
  async function logout() { await supabase?.auth.signOut(); setSession(null); setAdmin(false); setPage('home'); }

  return <>
    <header className="topbar">
      <a className="brand" onClick={() => go('home')} href="#top" aria-label="ECE home"><span className="brand-mark">e<span>.</span></span><span className="brand-name">ECE<span>EXTRAORDINARY CUSTOMER EXPERIENCE</span></span></a>
      <button className="menu-toggle" onClick={()=>setMobileMenu(v=>!v)} aria-label="Toggle menu">{mobileMenu?<X/>:<Menu/>}</button>
      <nav className={mobileMenu?'nav open':'nav'}>
        <a href="#about" onClick={e=>{e.preventDefault();go('home');setTimeout(()=>document.getElementById('about')?.scrollIntoView({behavior:'smooth'}),80);}}>About ECE</a>
        <a href="/why-ece" onClick={e=>{e.preventDefault();go('difference');}}>Why ECE</a>
        <a href="#services" onClick={e=>{e.preventDefault();go('home');setTimeout(()=>document.getElementById('services')?.scrollIntoView({behavior:'smooth'}),80);}}>What we do</a>
        <a href="#locations" onClick={e=>{e.preventDefault();go('home');setTimeout(()=>document.getElementById('locations')?.scrollIntoView({behavior:'smooth'}),80);}}>Locations</a>
        <a href="#careers" onClick={e=>{e.preventDefault();go('home');setTimeout(()=>document.getElementById('careers')?.scrollIntoView({behavior:'smooth'}),80);}}>Careers</a>
        <button className="nav-cta" onClick={()=>apply(jobs[0]?.title || 'Customer Experience Associate')}>Explore careers <ArrowUpRight size={16}/></button>
      </nav>
    </header>
    {page === 'home' && <main>
      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/> CUSTOMER EXPERIENCE, MADE HUMAN</div>
          <h1>Make every<br/>conversation <span>count.</span></h1>
          <p className="hero-lede">We help ambitious brands turn everyday customer interactions into lasting relationships.</p>
          <div className="hero-actions"><a className="button button-green" href="#services">Discover ECE <ArrowRight size={17}/></a><button className="button button-text" onClick={()=>document.getElementById('careers')?.scrollIntoView({behavior:'smooth'})}>Find your next opportunity <ArrowDown size={16}/></button></div>
          <div className="hero-proof"><div className="proof-avatars"><span>J</span><span>M</span><span>A</span><span>+</span></div><div><strong>People first. Always.</strong><small>Powered by people who care.</small></div></div>
        </div>
        <div className="hero-visual">
          <img className="hero-photo" src="/images/ece-hero.png" alt="Customer support specialist listening to a customer in a bright office" />
          <div className="hero-photo-shade" />
          <div className="hero-photo-note"><span className="hero-note-icon"><HeartHandshake size={19}/></span><span><small>THE ECE DIFFERENCE</small><strong>People first.<br/>Every interaction.</strong></span><ArrowUpRight size={18}/></div>
          <div className="hero-photo-pill"><span className="live-dot"/> Built around better experiences</div>
          <div className="hero-image-index">01 <i/> PEOPLE · PURPOSE · PERFORMANCE</div>
        </div>
        <div className="hero-bottom"><span>01 — 04</span><span className="bottom-rule"/><span>EXTRAORDINARY STARTS WITH LISTENING</span></div>
      </section>
      <section className="intro-section section-pad" id="about"><div className="section-kicker">A BETTER KIND OF BPO PARTNER <span>—</span></div><div className="intro-grid"><h2>Good service is a feeling.<br/><em>We make it a standard.</em></h2><div><p>ECE (Extraordinary Customer Experience) is a business process outsourcing company helping organizations support their customers with care, consistency, and purpose.</p><p>Behind every great customer experience is a supported, well-prepared team. That is where we begin.</p><a className="inline-link" href="/why-ece" onClick={e=>{e.preventDefault();go('difference');}}>See what makes ECE different <ArrowUpRight size={14}/></a></div></div>
        <div className="stats-row"><div><strong>2008</strong><span>Founded with a people-first idea</span></div><div><strong>5<span className="stat-star">★</span></strong><span>Customer-rated service focus</span></div><div><strong>PH<span className="stat-dot">.</span></strong><span>Teams in Makati & Dumaguete</span></div><div><strong>1 : 1</strong><span>Every interaction matters</span></div></div></section>
      <section className="services-section section-pad" id="services"><div className="section-heading"><div><div className="section-kicker">WHAT WE DO <span>—</span></div><h2>Support that feels<br/><em>like your own.</em></h2></div><p>We bring people, process, and thoughtful service together to help brands show up for their customers.</p></div>
        <div className="service-grid"><article className="service-card featured"><div className="service-icon"><Headphones size={21}/></div><span className="service-no">01</span><h3>Customer care</h3><p>Live chat, voice, email, text, in-app support, social media, and inbound or outbound customer calls.</p><div className="service-tags"><span>Voice</span><span>Chat</span><span>Email</span></div></article><article className="service-card"><div className="service-icon"><MessageCircle size={20}/></div><span className="service-no">02</span><h3>Back office support</h3><p>E-commerce transaction management, data quality, data entry, and content moderation.</p><div className="service-tags"><span>Operations</span><span>Data</span></div></article><article className="service-card"><div className="service-icon"><ShieldCheck size={20}/></div><span className="service-no">03</span><h3>Technical support</h3><p>Application and device support, operating system assistance, network monitoring, and troubleshooting.</p><div className="service-tags"><span>IT support</span><span>Troubleshooting</span></div></article><article className="service-card"><div className="service-icon"><Users size={20}/></div><span className="service-no">04</span><h3>Quality & business services</h3><p>Quality assurance, call monitoring, root-cause analysis, coaching, reporting, finance, and accounting.</p><div className="service-tags"><span>Quality</span><span>Analytics</span></div></article></div>
        <div className="service-photo-band"><img src="/images/ece-support.png" alt="ECE-style customer care specialist assisting a customer"/><div className="service-photo-copy"><span className="service-photo-kicker">ONE TEAM. MANY WAYS TO HELP.</span><h3>Here for customers<br/><em>wherever they are.</em></h3><p>From a quick chat to a tricky technical question, support can meet people in the channel that works for them.</p><div className="service-photo-chips"><span>Live support</span><span>Digital care</span><span>Back office</span><span>Technical help</span></div></div><div className="service-photo-mark">ECE <span>· CX, made human</span></div></div>
      </section>
      <section className="difference section-pad" id="difference"><div className="difference-photo"><img src="/images/ece-team.png" alt="Colleagues supporting one another during a team coaching session"/><div className="difference-photo-tag"><span>ECE CULTURE</span><strong>Extraordinary employee experience.<br/>Extraordinary customer experience.</strong></div><div className="difference-photo-number">02 <i/> TEAMWORK IN ACTION</div></div><div className="difference-copy"><div className="section-kicker">WHY ECE <span>—</span></div><h2>What makes ECE<br/><em>different?</em></h2><p className="difference-intro">ECE builds its service around the people doing the work. When employees have product knowledge, useful coaching, and a voice in improving service, customers feel the difference too.</p><div className="difference-points"><article><span>01</span><div><h3>People-first culture</h3><p>Employees are trusted to solve problems and represent each client with care.</p></div></article><article><span>02</span><div><h3>Training that keeps going</h3><p>Hands-on product learning, coaching, certifications, and regular development help teams build confidence.</p></div></article><article><span>03</span><div><h3>Service you can measure</h3><p>Customer feedback, quality reviews, and performance data help teams find ways to improve.</p></div></article><article><span>04</span><div><h3>Flexible partnership</h3><p>ECE describes a low-friction start: no setup fees, no minimum headcount, and pay-as-you-go options.</p></div></article></div><div className="difference-signoff"><span className="signoff-check"><Check size={15}/></span><span><strong>People supported.</strong> Customers cared for. Better outcomes.</span></div></div></section>
      <section className="locations-section section-pad" id="locations"><div className="section-heading"><div><div className="section-kicker">WHERE WE WORK <span>—</span></div><h2>Rooted in the<br/><em>Philippines.</em></h2></div><p>ECE’s Philippine operations have grown across two cities, with teams bringing care and expertise to each customer conversation.</p></div><div className="locations-grid">{locations.map((l,i)=><a href={l.link} target="_blank" rel="noreferrer" className="location-card" key={l.city}><div className={'map-pattern map-'+i}><MapPin size={24}/><div className="map-pulse"/></div><div className="location-content"><span className="location-label">PHILIPPINES · 0{i+1}</span><h3>{l.city}</h3><p>{l.region}</p><div className="location-address"><MapPin size={14}/>{l.address}</div><span className="location-link">View on map <ArrowUpRight size={15}/></span></div></a>)}</div><p className="locations-note">ECE’s company history also notes U.S. operations in Ashland, Ohio and Henderson, Nevada. <a href="https://www.ececonsultinggroup.com/careers.html" target="_blank" rel="noreferrer">View company locations ↗</a></p></section>
      <section className="careers-section section-pad" id="careers"><div className="careers-top"><div><div className="section-kicker">YOUR NEXT CHAPTER <span>—</span></div><h2>Bring your whole self.<br/><em>Build something meaningful.</em></h2></div><p>Start with a team that believes great customer experiences begin with great employee experiences.</p></div><div className="careers-culture"><img src="/images/ece-team.png" alt="ECE teammates working together"/><div><span>ROOM TO LEARN. PEOPLE TO GROW WITH.</span><strong>Great work happens<br/>when people feel supported.</strong></div><a href="https://www.ececonsultinggroup.com/careers.html" target="_blank" rel="noreferrer" aria-label="Open ECE official careers listings"><ArrowUpRight size={20}/></a></div><div className="careers-benefits"><div><span><Sparkles size={17}/></span><b>Learn with support</b><small>Training and coaching from day one.</small></div><div><span><Users size={17}/></span><b>Grow together</b><small>Work with people who value your voice.</small></div><div><span><Globe2 size={17}/></span><b>Make an impact</b><small>Help customers feel the difference.</small></div></div><div className="openings-head"><div><h3>Explore opportunities</h3><span>{jobs.length} roles shown</span></div><span className="listing-note"><span className="live-dot"/> Example roles · verify current openings with ECE</span></div><div className="jobs-list">{jobs.map((job,i)=><article className="job-row" key={job.id || job.title}><div className="job-number">0{i+1}</div><div className="job-main"><h4>{job.title}</h4><div className="job-meta"><span><BriefcaseBusiness size={14}/>{job.group || 'Customer Support'}</span><span><MapPin size={14}/>{job.place || 'Philippines'}</span><span><Clock3 size={14}/>{job.type || 'Full time'}</span></div><p>{job.desc}</p></div><button className="apply-arrow" onClick={()=>apply(job.title)} aria-label={`Apply for ${job.title}`}><ArrowUpRight size={19}/></button></article>)}</div><div className="careers-footer"><span>Don’t see the right fit?</span><a href="https://www.ececonsultinggroup.com/careers.html" target="_blank" rel="noreferrer">Explore ECE’s official careers page <ArrowUpRight size={15}/></a></div></section>
      <section className="cta-band"><div className="cta-spark"><Sparkles size={18}/></div><div><span>READY TO MAKE A DIFFERENCE?</span><h2>Your next opportunity<br/>could start here.</h2></div><button className="button button-white" onClick={()=>apply(jobs[0]?.title || 'Customer Experience Associate')}>Start an application <ArrowRight size={17}/></button><div className="cta-orbit orbit-one"/><div className="cta-orbit orbit-two"/></section>
    </main>}
    {page === 'difference' && <main className="why-page"><button className="back-link" onClick={()=>go('home')}>← Back to ECE</button><section className="why-hero"><div className="why-hero-copy"><div className="why-kicker"><span/> THE ECE DIFFERENCE</div><h1>People first.<br/><em>Extraordinary service follows.</em></h1><p>What sets ECE apart is the belief that people do their best work when they feel valued, prepared, and trusted. That care carries through to every customer interaction.</p><button className="button button-white" onClick={()=>{go('home');setTimeout(()=>document.getElementById('careers')?.scrollIntoView({behavior:'smooth'}),80)}}>Find your place at ECE <ArrowRight size={17}/></button><div className="why-hero-foot"><span>01 / 04</span><i/><span>CULTURE · COACHING · CUSTOMER CARE</span></div></div><div className="why-hero-image"><img src="/images/ece-team.png" alt="Illustrative workplace photo of colleagues exchanging ideas in a coaching session"/><span className="why-image-note">GOOD WORK GROWS<br/><b>WHEN PEOPLE GROW.</b></span></div></section><section className="why-principles"><div className="why-section-title"><span>BUILT INTO HOW WE WORK</span><h2>Different by the way<br/>we <em>show up.</em></h2><p>Here are the practical choices behind the ECE experience.</p></div><div className="why-card-grid"><article><span className="why-card-number">01</span><div className="why-card-icon"><HeartHandshake size={21}/></div><h3>People-first culture</h3><p>ECE puts employees at the center of the business and empowers them to make decisions that support a better customer experience.</p><span className="why-card-caption">CARE STARTS INSIDE</span></article><article><span className="why-card-number">02</span><div className="why-card-icon"><Sparkles size={21}/></div><h3>Hands-on preparation</h3><p>Client and product learning, real-world practice, certifications, and ongoing coaching help teams arrive ready and keep improving.</p><span className="why-card-caption">LEARN BY DOING</span></article><article><span className="why-card-number">03</span><div className="why-card-icon"><ShieldCheck size={21}/></div><h3>Feedback into action</h3><p>Customer feedback and service measures help reveal what is working, what needs attention, and where a process can improve.</p><span className="why-card-caption">LISTEN · LEARN · IMPROVE</span></article><article><span className="why-card-number">04</span><div className="why-card-icon"><Globe2 size={21}/></div><h3>Flexible partnerships</h3><p>ECE offers a simple way to begin outsourcing, with no setup fees, no minimum headcount, and pay-as-you-go options described on its site.</p><span className="why-card-caption">START AT YOUR OWN SCALE</span></article></div></section><section className="why-proof"><img src="/images/ece-support.png" alt="Illustrative workplace photo of a customer care representative assisting a customer"/><div className="why-proof-copy"><div className="why-kicker why-kicker-light"><span/> A BETTER KIND OF PARTNER</div><h2>Not just a service desk.<br/><em>A team in your corner.</em></h2><p>ECE works to understand the client’s products and customers, then pairs that knowledge with quality reviews and ongoing support. The goal is service that feels consistent, informed, and genuinely helpful.</p><div className="why-proof-list"><span><Check size={15}/> Domain and product learning</span><span><Check size={15}/> Clear performance measures</span><span><Check size={15}/> Access to coaching and leadership</span></div></div></section><section className="why-end"><span>THOUGHTFUL SERVICE STARTS WITH THOUGHTFUL PEOPLE</span><h2>That’s the ECE<br/><em>difference.</em></h2><div><button className="button button-green" onClick={()=>{go('home');setTimeout(()=>document.getElementById('services')?.scrollIntoView({behavior:'smooth'}),80)}}>Explore our services <ArrowRight size={16}/></button><button className="why-text-button" onClick={()=>{go('home');setTimeout(()=>document.getElementById('careers')?.scrollIntoView({behavior:'smooth'}),80)}}>See career opportunities <ArrowUpRight size={15}/></button></div></section></main>}
    {page === 'apply' && <main className="form-page"><button className="back-link" onClick={()=>go('home')}>← Back to ECE</button><div className="form-layout"><div className="form-aside"><div className="section-kicker">ECE CAREERS <span>—</span></div><h1>Your next step<br/>starts <em>here.</em></h1><p>Apply for <strong>{selectedRole}</strong>. We’ll confirm your Gmail address before your application is sent.</p><div className="secure-note"><ShieldCheck size={18}/><span>Your application is private and only visible to authorized ECE hiring admins.</span></div></div><section className="application-card"><div className="form-card-heading"><span className="step-label">APPLICATION FORM</span><span className="step-count">01 / 02</span></div>
      {!session?.user?.email_confirmed_at ? <form onSubmit={sendVerification} className="verify-form"><h2>Verify your email</h2><p>Enter your Gmail address. We’ll send you a secure sign-in link to verify it before you apply.</p><label>Gmail address<input type="email" placeholder="you@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} required /></label><button className="button button-green full-button" disabled={busy}>{busy?'Sending link…':'Send verification link'} <ArrowRight size={16}/></button>{otpSent&&<div className="success-callout"><BadgeCheck size={18}/><span>Verification link sent. Open the email on this device. After verification, return here to continue.</span></div>}</form>:
      <form onSubmit={submitApplication} className="application-form"><div className="verified-banner"><BadgeCheck size={17}/> Verified as <strong>{session.user.email}</strong></div><h2>Your details</h2><div className="field-grid"><label>First name<input required value={form.firstName} onChange={e=>setField('firstName',e.target.value)}/></label><label>Last name<input required value={form.lastName} onChange={e=>setField('lastName',e.target.value)}/></label></div><label>Phone number<input type="tel" required placeholder="+63 9XX XXX XXXX" value={form.phone} onChange={e=>setField('phone',e.target.value)}/></label><div className="field-grid"><label>Preferred location<select required value={form.location} onChange={e=>setField('location',e.target.value)}><option value="">Select location</option><option>Makati</option><option>Dumaguete</option></select></label><label>Relevant experience<select required value={form.experience} onChange={e=>setField('experience',e.target.value)}><option value="">Select one</option><option>No experience yet</option><option>Less than 1 year</option><option>1–3 years</option><option>3+ years</option></select></label></div><label>What would you like us to know? <span className="optional">Optional</span><textarea rows="4" placeholder="Share a little about your experience or what interests you about ECE." value={form.note} onChange={e=>setField('note',e.target.value)}/></label><button className="button button-green full-button" disabled={busy}>{busy?'Submitting…':'Submit application'} <ArrowRight size={16}/></button></form>}
      {status && <div className={status.includes('submitted')||status.includes('Check your Gmail')?'form-status positive':'form-status'}>{status}</div>}
      </section></div></main>}
    {page === 'admin' && <main className="admin-page"><button className="back-link" onClick={()=>go('home')}>← Back to ECE</button><div className="admin-heading"><div><div className="section-kicker">ECE RECRUITMENT <span>—</span></div><h1>Application <em>inbox</em></h1><p>Review verified candidate submissions.</p></div>{session&&<button className="button button-outline" onClick={logout}>Sign out</button>}</div>
      {!session?.user?.email_confirmed_at ? <form className="admin-login" onSubmit={signInAdmin}><div className="admin-lock"><ShieldCheck size={22}/></div><h2>Admin sign in</h2><p>Use your authorized ECE admin Gmail. We’ll email you a secure sign-in link.</p><label>Admin Gmail<input type="email" required value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} placeholder="admin@gmail.com"/></label><button className="button button-green full-button" disabled={busy}>{busy?'Sending…':'Send sign-in link'} <ArrowRight size={16}/></button>{status&&<div className="form-status">{status}</div>}</form> : !admin ? <div className="admin-login"><div className="admin-lock"><ShieldCheck size={22}/></div><h2>Access restricted</h2><p>{status||'This account is not assigned the admin role.'}</p><button className="button button-outline" onClick={logout}>Sign out</button></div> : <section className="inbox"><div className="inbox-toolbar"><div className="inbox-stat"><strong>{applications.length}</strong><span>applications</span></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>New</option><option>Reviewing</option><option>Shortlisted</option><option>Declined</option></select><button className="button button-outline" onClick={loadApplications}>Refresh</button></div>{status&&<div className="form-status">{status}</div>}{applications.filter(a=>filter==='All'||a.status===filter).length===0?<div className="empty-state"><CircleHelp size={24}/><h3>No applications yet</h3><p>Verified candidate submissions will appear here.</p></div>:<div className="application-table-wrap"><table><thead><tr><th>Candidate</th><th>Position</th><th>Location</th><th>Experience</th><th>Submitted</th><th>Status</th></tr></thead><tbody>{applications.filter(a=>filter==='All'||a.status===filter).map(a=><tr key={a.id}><td><strong>{a.first_name} {a.last_name}</strong><small>{a.email}</small><small>{a.phone}</small>{a.note&&<details><summary>Candidate note</summary><p>{a.note}</p></details>}</td><td>{a.jobs?.title||'General application'}</td><td>{a.location}</td><td>{a.experience}</td><td>{new Date(a.created_at).toLocaleDateString()}</td><td><select value={a.status} onChange={e=>updateStatus(a.id,e.target.value)}><option>New</option><option>Reviewing</option><option>Shortlisted</option><option>Declined</option></select></td></tr>)}</tbody></table></div>}</section>}
    </main>}
    <footer className="footer"><div className="footer-brand"><a className="brand" onClick={()=>go('home')} href="#top"><span className="brand-mark">e<span>.</span></span><span className="brand-name">ECE<span>EXTRAORDINARY CUSTOMER EXPERIENCE</span></span></a><p>People-first service.<br/>Extraordinary by design.</p></div><div className="footer-links"><div><span>EXPLORE</span><a onClick={()=>go('home')}>About ECE</a><a onClick={()=>go('difference')}>Why ECE</a><a onClick={()=>{go('home');setTimeout(()=>document.getElementById('careers')?.scrollIntoView({behavior:'smooth'}),80)}}>Careers</a><a href="https://www.ececonsultinggroup.com/" target="_blank" rel="noreferrer">Official website ↗</a></div><div><span>PHILIPPINES</span><a href={locations[0].link} target="_blank" rel="noreferrer">Makati, Metro Manila ↗</a><a href={locations[1].link} target="_blank" rel="noreferrer">Dumaguete, Negros Oriental ↗</a></div><div><span>FOR ECE ADMINS</span><button className="footer-admin" onClick={()=>go('admin')}>Application inbox <ArrowUpRight size={14}/></button></div></div><div className="footer-bottom"><span>© 2026 ECE · Extraordinary Customer Experience</span><span>Illustrative images; verify company details and job openings with ECE before publication.</span></div></footer>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
