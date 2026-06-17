const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\moham\\ruladiet-site\\course';

function buildPage(slug, title, metaDesc, badge, heroTitle, heroSub, heroMeta, aboutBadge, aboutHeading, aboutDesc, learnItems, whoForItems, infoCards, curriculumHTML, price, priceWas, ctaText, ctaUrl, priceNote) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - رولا دايت</title>
<meta name="description" content="${metaDesc}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="https://ruladiet.com/course/${slug}">
<meta property="og:title" content="${title} - رولا دايت">
<meta property="og:description" content="${metaDesc}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://ruladiet.com/course/${slug}">
<meta property="og:image" content="https://ruladiet.com/images/ruladiet1.webp">
<meta property="og:locale" content="ar_AR">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "${title}",
  "description": "${metaDesc}",
  "provider": {"@type": "Organization", "name": "رولا دايت", "url": "https://ruladiet.com"},
  "instructor": {"@type": "Person", "name": "رولا علوش", "jobTitle": "اختصاصية تغذية"},
  "offers": {"@type": "Offer", "price": "${price}", "priceCurrency": "USD", "availability": "https://schema.org/OnlineOnly", "url": "https://ruladiet.com/course/${slug}"},
  "educationalLevel": "All",
  "inLanguage": "ar"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://ruladiet.com/"},
    {"@type": "ListItem", "position": 2, "name": "الدورات", "item": "https://ruladiet.com/الدورات"},
    {"@type": "ListItem", "position": 3, "name": "${title}", "item": "https://ruladiet.com/course/${slug}"}
  ]
}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="../css/style.css" media="print" onload="this.media='all'">
<link rel="stylesheet" href="../css/pages.css" media="print" onload="this.media='all'">
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&display=swap">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/pages.css">
</noscript>
<style>
:root{--primary:#2D5240;--primary-light:#3A6B54;--primary-dark:#1F3A2D;--accent:#C8A97E;--accent-hover:#B8956A;--bg:#F7F9F5;--bg-alt:#E8F5EE;--text:#1A2E24;--text-light:#4A6B5A;--text-faint:#8BA69A;--border:#D4E3D9;--white:#FFFFFF;--highlight:#C8A97E;--shadow:0 4px 24px rgba(45,82,64,0.08);--radius:16px;--radius-sm:10px;--transition:0.3s ease;--font-primary:'Tajawal',sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-primary);background:var(--bg);color:var(--text);line-height:1.8;overflow-x:hidden}
a{text-decoration:none;color:inherit}
img{max-width:100%;height:auto;display:block}
.container{max-width:1200px;margin:0 auto;padding:0 20px;width:100%}
.header{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(255,255,255,0.95);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);transition:var(--transition)}
.header-inner{display:flex;align-items:center;justify-content:space-between;height:72px;gap:20px}
.logo img{height:60px;width:auto;display:block}
.nav-list{display:flex;list-style:none;gap:8px}
.nav-link{padding:8px 18px;border-radius:var(--radius-sm);font-weight:500;font-size:0.95rem;color:var(--text);transition:var(--transition)}
.nav-link:hover,.nav-link.active{background:var(--bg-alt);color:var(--primary)}
.nav-cta{background:var(--primary);color:var(--white);padding:10px 24px;border-radius:var(--radius-sm);font-weight:600;font-size:0.9rem;transition:var(--transition)}
.nav-cta:hover{background:var(--primary-light);transform:translateY(-1px)}
.menu-toggle{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:8px}
.menu-toggle span{width:26px;height:2.5px;background:var(--text);border-radius:2px;transition:var(--transition)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 28px;border-radius:var(--radius-sm);font-weight:600;font-size:0.95rem;transition:var(--transition);cursor:pointer;border:2px solid transparent;font-family:var(--font-primary)}
.btn-primary{background:var(--primary);color:var(--white)}
.btn-primary:hover{background:var(--primary-light);transform:translateY(-2px);box-shadow:0 8px 24px rgba(45,82,64,0.25)}
.btn-accent{background:var(--accent);color:var(--white);border:none}
.btn-accent:hover{background:var(--accent-hover);transform:translateY(-2px)}
.btn-lg{padding:16px 40px;font-size:1.05rem;width:100%}
.page-hero{margin-top:72px;padding:80px 0 100px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));position:relative;overflow:hidden;text-align:center;color:var(--white)}
.page-hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:50px;background:var(--bg);-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 50'%3E%3Cpath d='M0,0 C360,50 1080,50 1440,0 L1440,50 L0,50 Z' fill='%23F7F9F5'/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 50'%3E%3Cpath d='M0,0 C360,50 1080,50 1440,0 L1440,50 L0,50 Z' fill='%23F7F9F5'/%3E%3C/svg%3E");-webkit-mask-size:100% 100%;mask-size:100% 100%}
.section-badge{display:inline-block;padding:6px 20px;border-radius:20px;font-weight:600;font-size:0.85rem;margin-bottom:16px}
.page-hero .section-badge{background:rgba(200,169,126,0.25);color:var(--highlight)}
.page-hero h1{font-size:2.8rem;font-weight:800;margin-bottom:12px}
.page-hero .sub{font-size:1.1rem;opacity:0.9;max-width:650px;margin:0 auto 24px}
.hero-meta{display:flex;justify-content:center;gap:28px;flex-wrap:wrap}
.hero-meta span{font-size:0.9rem;opacity:0.85;display:flex;align-items:center;gap:6px}
.course-layout{display:grid;grid-template-columns:1fr 340px;gap:48px;padding:60px 0 80px;align-items:start}
.section-title-badge{background:rgba(200,169,126,0.15);color:var(--accent)}
.section-heading{font-size:1.8rem;font-weight:700;color:var(--text);margin:8px 0 16px}
.section-desc{color:var(--text-light);font-size:1.02rem;line-height:1.9;margin-bottom:32px}
.who-for-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:40px}
.who-item{display:flex;align-items:flex-start;gap:10px;background:var(--white);padding:14px 16px;border-radius:var(--radius-sm);border:1px solid var(--border)}
.who-item svg{color:var(--accent);flex-shrink:0;margin-top:3px}
.who-item span{color:var(--text-light);font-size:0.9rem;line-height:1.5}
.learn-section{background:var(--bg-alt);padding:32px;border-radius:var(--radius);margin-bottom:32px}
.learn-section h3{font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:20px;display:flex;align-items:center;gap:8px}
.learn-list{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.learn-list li{display:flex;align-items:flex-start;gap:10px;color:var(--text-light);font-size:0.92rem;line-height:1.6}
.learn-list li svg{margin-top:3px;color:var(--primary);flex-shrink:0;width:16px;height:16px}
.curriculum-section{margin-bottom:32px}
.curriculum-section h3{font-size:1.15rem;font-weight:700;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px}
.chapter-label{background:var(--primary);color:var(--white);padding:10px 20px;border-radius:var(--radius-sm);font-weight:600;font-size:0.9rem;margin-bottom:8px}
.curriculum{display:flex;flex-direction:column;gap:8px}
.lecture{display:flex;align-items:center;justify-content:space-between;background:var(--white);padding:14px 18px;border-radius:var(--radius-sm);border:1px solid var(--border);transition:var(--transition)}
.lecture:hover{border-color:var(--primary);box-shadow:var(--shadow)}
.lecture-info{display:flex;align-items:center;gap:12px}
.lecture-number{background:var(--primary);color:var(--white);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;flex-shrink:0}
.lecture-title{font-weight:500;color:var(--text);font-size:0.92rem}
.lecture-right{display:flex;align-items:center;gap:10px}
.lecture-duration{color:var(--text-faint);font-size:0.82rem;white-space:nowrap}
.lecture-free{color:var(--primary);font-weight:600;font-size:0.8rem;background:rgba(45,82,64,0.1);padding:3px 10px;border-radius:10px}
.lecture-bonus{background:var(--accent);color:var(--white);padding:3px 10px;border-radius:10px;font-size:0.8rem;font-weight:600}
.info-cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px}
.info-card{background:var(--white);padding:24px;border-radius:var(--radius);border:1px solid var(--border)}
.info-card h4{font-size:0.95rem;font-weight:700;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:8px}
.info-card h4 svg{color:var(--primary)}
.info-card ul{list-style:none}
.info-card ul li{font-size:0.88rem;color:var(--text-light);padding:4px 0 4px 0;padding-right:14px;position:relative;line-height:1.5}
.info-card ul li::before{content:'';position:absolute;right:0;top:12px;width:5px;height:5px;border-radius:50%;background:var(--accent)}
.instructor-card{display:flex;align-items:center;gap:20px;background:var(--white);padding:28px;border-radius:var(--radius);border:1px solid var(--border);margin-bottom:32px}
.instructor-card img{width:80px;height:80px;border-radius:50%;object-fit:cover;flex-shrink:0}
.instructor-info h4{font-size:1.05rem;font-weight:700;color:var(--text)}
.instructor-info p{font-size:0.88rem;color:var(--text-light);margin-top:4px;line-height:1.6}
.course-sidebar{position:sticky;top:100px}
.sidebar-card{background:var(--white);border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;box-shadow:0 8px 32px rgba(45,82,64,0.12)}
.sidebar-price-box{background:linear-gradient(135deg,var(--primary),var(--primary-dark));padding:28px;text-align:center;color:var(--white)}
.price-free{font-size:2.2rem;font-weight:800;color:var(--accent)}
.price-label{font-size:0.9rem;opacity:0.8;margin-top:4px}
.price-was{font-size:1rem;text-decoration:line-through;opacity:0.6;margin-top:2px}
.sidebar-cta{padding:24px}
.sidebar-cta .btn-accent{width:100%;text-align:center;padding:16px;font-size:1rem;border-radius:var(--radius-sm);display:block;margin-bottom:12px}
.sidebar-cta .btn-outline-dark{width:100%;text-align:center;padding:14px;font-size:0.92rem;border-radius:var(--radius-sm);display:block;border:2px solid var(--border);color:var(--text-light);background:transparent;transition:var(--transition)}
.sidebar-cta .btn-outline-dark:hover{border-color:var(--primary);color:var(--primary);background:var(--bg-alt)}
.sidebar-includes{padding:0 24px 24px}
.sidebar-includes h4{font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:12px}
.includes-list{list-style:none;display:flex;flex-direction:column;gap:8px}
.includes-list li{display:flex;align-items:center;gap:10px;font-size:0.88rem;color:var(--text-light)}
.includes-list li svg{color:var(--primary);flex-shrink:0;width:16px;height:16px}
.sidebar-divider{height:1px;background:var(--border);margin:0 24px 20px}
.sidebar-meta{padding:0 24px 24px}
.sidebar-meta h4{font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:12px}
.meta-list{list-style:none;display:flex;flex-direction:column;gap:8px}
.meta-list li{display:flex;align-items:center;gap:10px;font-size:0.85rem;color:var(--text-light)}
.meta-list li svg{color:var(--primary);flex-shrink:0;width:16px;height:16px}
.footer{background:var(--primary-dark);color:var(--white);padding:60px 0 20px}
.footer-top{display:grid;grid-template-columns:2fr 3fr;gap:48px;margin-bottom:40px}
.footer-brand p{color:rgba(255,255,255,0.7);font-size:0.9rem;margin-top:8px}
.footer-links-new{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.footer-col-new h4{font-size:0.95rem;font-weight:700;margin-bottom:16px;color:var(--highlight)}
.footer-col-new ul{list-style:none}
.footer-col-new ul li{margin-bottom:8px}
.footer-col-new ul li a{color:rgba(255,255,255,0.7);font-size:0.88rem;transition:var(--transition)}
.footer-col-new ul li a:hover{color:var(--white)}
.footer-bottom-new{display:flex;justify-content:space-between;align-items:center;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1)}
.footer-bottom-new p{color:rgba(255,255,255,0.6);font-size:0.85rem}
.footer-social{display:flex;gap:16px}
.footer-social a{color:rgba(255,255,255,0.6);transition:var(--transition)}
.footer-social a:hover{color:var(--white)}
@media(min-width:769px){
  .menu-toggle{display:none !important}
  .nav{position:static;width:auto;height:auto;background:transparent;box-shadow:none;padding:0}
  .nav-list{flex-direction:row;gap:8px}
  .nav.open{right:auto}
}
@media(max-width:768px){
  .page-hero h1{font-size:1.8rem}
  .hero-meta{gap:14px}
  .learn-list{grid-template-columns:1fr}
  .who-for-grid{grid-template-columns:1fr}
  .info-cards{grid-template-columns:1fr}
  .footer-top{grid-template-columns:1fr}
  .footer-links-new{grid-template-columns:1fr 1fr}
  .instructor-card{flex-direction:column;text-align:center}
  .course-layout{grid-template-columns:1fr}
  .course-sidebar{position:static}
  .sidebar-card{max-width:480px}
  .menu-toggle{display:flex}
  .nav{position:fixed;top:72px;left:0;right:0;background:rgba(255,255,255,0.98);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);padding:20px;border-bottom:1px solid var(--border);transform:translateY(-120%);opacity:0;transition:var(--transition);pointer-events:none;z-index:999}
  .nav.open{transform:translateY(0);opacity:1;pointer-events:auto}
  .nav-list{flex-direction:column;gap:4px}
}
</style>
</head>
<body>

<header class="header">
  <div class="container">
    <div class="header-inner">
      <button type="button" class="btn btn-primary nav-cta" onclick="alert('\u0642\u0631\u064A\u0628\u0627\u064B')">\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644</button>
      <nav class="nav" id="nav" aria-label="\u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629">
        <ul class="nav-list">
          <li><a href="../" class="nav-link">\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629</a></li>
          <li><a href="../\u0627\u0644\u062F\u0648\u0631\u0627\u062A" class="nav-link active">\u062F\u0648\u0631\u0627\u062A\u0646\u0627</a></li>
          <li><a href="../\u0627\u0644\u0641\u0631\u064A\u0642" class="nav-link">\u0645\u0646 \u0646\u062D\u0646</a></li>
          <li><a href="../\u0627\u062D\u062C\u0632-\u0645\u0648\u0639\u062F" class="nav-link">\u0627\u062D\u062C\u0632 \u0645\u0648\u0639\u062F</a></li>
          <li><a href="../\u0627\u0644\u0645\u062F\u0648\u0646\u0629" class="nav-link">\u0627\u0644\u0645\u062F\u0648\u0646\u0629</a></li>
        </ul>
      </nav>
      <a href="../" class="logo" aria-label="\u0631\u0648\u0644\u0627 \u062F\u0627\u064A\u062A - \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629">
        <img src="/images/RULA-DIET-LOGO.png" alt="\u0634\u0639\u0627\u0631 \u0631\u0648\u0644\u0627 \u062F\u0627\u064A\u062A" width="180" height="60">
      </a>
      <button class="menu-toggle" id="menuToggle" aria-label="\u0641\u062A\u062D \u0627\u0644\u0642\u0627\u0626\u0645\u0629" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<main>
  <section class="page-hero">
    <div class="container">
      <span class="section-badge">${badge}</span>
      <h1>${heroTitle}</h1>
      <p class="sub">${heroSub}</p>
      <div class="hero-meta">
        ${heroMeta.map(m => `<span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${m.icon}</svg>${m.text}</span>`).join('\\n        ')}
      </div>
    </div>
  </section>

  <div class="container">
    <div class="course-layout">
      <div class="course-main">
        <span class="section-badge section-title-badge">${aboutBadge}</span>
        <h2 class="section-heading">${aboutHeading}</h2>
        <p class="section-desc">${aboutDesc}</p>

        <h3 style="font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          هذا الكورس لك إذا كنت...
        </h3>
        <div class="who-for-grid">
          ${whoForItems.map(w => `<div class="who-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg><span>${w}</span></div>`).join('\\n          ')}
        </div>

        <div class="learn-section">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            ماذا ستتعلم؟
          </h3>
          <ul class="learn-list">
            ${learnItems.map(l => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>${l}</li>`).join('\\n            ')}
          </ul>
        </div>

        <div class="curriculum-section">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            محتوى الدورة
          </h3>
          ${curriculumHTML}
        </div>

        <div class="info-cards">
          ${infoCards.map(c => `<div class="info-card"><h4><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${c.icon}</svg>${c.title}</h4><ul>${c.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('\\n          ')}
        </div>

        <div class="instructor-card">
          <img src="../images/newrulaface.png" alt="\u0631\u0648\u0644\u0627 \u0639\u0644\u0648\u0634" loading="lazy">
          <div class="instructor-info">
            <h4>\u0631\u0648\u0644\u0627 \u0639\u0644\u0648\u0634</h4>
            <p>\u0627\u062E\u062A\u0635\u0627\u0635\u064A\u0629 \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u2014 \u0623\u0643\u062B\u0631 \u0645\u0646 140 \u0623\u0644\u0641 \u0645\u062A\u0627\u0628\u0639 \u0639\u0644\u0649 \u0627\u0646\u0633\u062A\u063A\u0631\u0627\u0645\u060C \u0645\u0624\u0633\u0633\u0629 \u0631\u0648\u0644\u0627 \u062F\u0627\u064A\u062A \u0648\u0645\u0642\u062F\u0645\u0629 \u0628\u0631\u0627\u0645\u062C \u0627\u0644\u062A\u0648\u0639\u064A\u0629 \u0627\u0644\u063A\u0630\u0627\u0626\u064A\u0629.</p>
          </div>
        </div>
      </div>

      <aside class="course-sidebar">
        <div class="sidebar-card">
          <div class="sidebar-price-box">
            <div class="price-free">${priceNote}</div>
            ${priceWas ? `<div class="price-was">${priceWas}</div>` : ''}
            <div class="price-label">${slug === '\u0631\u062D\u0644\u0629-\u0627\u0644\u062A\u063A\u064A\u064A\u0631' ? '100% \u2014 \u0628\u062F\u0648\u0646 \u0623\u064A \u0631\u0633\u0648\u0645' : '\u0627\u0634\u062A\u0631\u0627\u0643 \u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u2014 \u0648\u0635\u0648\u0644 \u0645\u062F\u0649 \u0627\u0644\u062D\u064A\u0627\u0629'}</div>
          </div>
          <div class="sidebar-cta">
            <a href="${ctaUrl}" class="btn-accent" target="_blank" rel="noopener">${ctaText}</a>
            <a href="../\u0627\u0644\u062F\u0648\u0631\u0627\u062A" class="btn-outline-dark">\u062C\u0645\u064A\u0639 \u0627\u0644\u062F\u0648\u0631\u0627\u062A</a>
          </div>
          <div class="sidebar-divider"></div>
          <div class="sidebar-includes">
            <h4>\u062A\u0634\u0645\u0644 \u0627\u0644\u062F\u0648\u0631\u0629</h4>
            <ul class="includes-list">
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0645\u0633\u062C\u0644\u0629</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>\u0645\u0644\u0641\u0627\u062A \u0648\u0623\u0648\u0631\u0627\u0642 \u0639\u0645\u0644</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>\u0648\u0635\u0648\u0644 \u0645\u062F\u0649 \u0627\u0644\u062D\u064A\u0627\u0629</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>\u0645\u062A\u0627\u062D \u0639\u0644\u0649 \u0627\u0644\u062C\u0648\u0627\u0644</li>
            </ul>
          </div>
          <div class="sidebar-divider"></div>
          <div class="sidebar-meta">
            <h4>\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062F\u0648\u0631\u0629</h4>
            <ul class="meta-list">
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>\u0645\u0633\u062A\u0648\u0649: \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>\u0627\u0644\u0645\u062F\u0631\u0628\u0629: \u0631\u0648\u0644\u0627 \u0639\u0644\u0648\u0634</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>\u0634\u0647\u0627\u062F\u0629 \u0625\u062A\u0645\u0627\u0645</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  </div>
</main>

<footer class="footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <img src="/images/RULA-DIET-LOGO.png" alt="\u0631\u0648\u0644\u0627 \u062F\u0627\u064A\u062A" width="180" height="60" loading="lazy">
        <p>\u0627\u062E\u062A\u0635\u0627\u0635\u064A\u0629 \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0631\u0648\u0644\u0627 \u0639\u0644\u0648\u0634<br>\u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0641\u064A \u0627\u0633\u0637\u0646\u0628\u0648\u0644</p>
      </div>
      <div class="footer-links-new">
        <div class="footer-col-new">
          <h4>\u0631\u0648\u0627\u0628\u0637</h4>
          <ul>
            <li><a href="../">\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629</a></li>
            <li><a href="../\u0627\u0644\u062F\u0648\u0631\u0627\u062A">\u0627\u0644\u062F\u0648\u0631\u0627\u062A</a></li>
            <li><a href="../\u0627\u0644\u0645\u062F\u0648\u0646\u0629">\u0627\u0644\u0645\u062F\u0648\u0646\u0629</a></li>
            <li><a href="../\u0627\u0644\u0641\u0631\u064A\u0642">\u0627\u0644\u0641\u0631\u064A\u0642</a></li>
          </ul>
        </div>
        <div class="footer-col-new">
          <h4>\u0633\u064A\u0627\u0633\u0627\u062A</h4>
          <ul>
            <li><a href="../\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629">\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629</a></li>
            <li><a href="../\u0627\u0644\u0634\u0631\u0648\u0637">\u0627\u0644\u0634\u0631\u0648\u0637</a></li>
            <li><a href="../\u0627\u0644\u0625\u0633\u062A\u0631\u062C\u0627\u0639">\u0627\u0644\u0625\u0633\u062A\u0631\u062C\u0627\u0639</a></li>
          </ul>
        </div>
        <div class="footer-col-new">
          <h4>\u062A\u0648\u0627\u0635\u0644\u064A \u0645\u0639\u0646\u0627</h4>
          <ul>
            <li><a href="https://wa.me/905300222468" target="_blank">\u0648\u0627\u062A\u0633\u0627\u0628</a></li>
            <li><a href="mailto:ruladietltd@gmail.com">\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A</a></li>
            <li><a href="tel:+905300222468">+90 530 022 24 68</a></li>
          </ul>
        </div>
        <div class="footer-col-new">
          <h4>\u0627\u0644\u0645\u0648\u0642\u0639</h4>
          <ul>
            <li>Esenkent, Esenkent-Bah\u00E7e\u015Fehir Yolu</li>
            <li>34510 Esenyurt/\u0130stanbul</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="footer-bottom-new">
      <p>\u00A9 2026 \u0631\u0648\u0644\u0627 \u062F\u0627\u064A\u062A. \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629</p>
      <div class="footer-social">
        <a href="https://www.instagram.com/rulaalloush/" target="_blank" aria-label="\u0627\u0646\u0633\u062A\u063A\u0631\u0627\u0645">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1.5" fill="currentColor"/></svg>
        </a>
        <a href="https://www.facebook.com/ruladiet" target="_blank" aria-label="\u0641\u064A\u0633\u0628\u0648\u0643">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
        </a>
        <a href="https://www.youtube.com/channel/UC8X0eusHpqq3KUtvD9EN4oQ" target="_blank" aria-label="\u064A\u0648\u062A\u064A\u0648\u0628">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#fff"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

<script>
  document.getElementById('menuToggle').addEventListener('click', function() {
    var nav = document.getElementById('nav');
    var isOpen = nav.classList.toggle('open');
    this.setAttribute('aria-expanded', isOpen);
  });
</script>
</body>
</html>`;
}

// Icon helpers (just path data)
const icons = {
  clock: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
};

// ============ COURSE 1: المسار الصحي ============
const masar = buildPage(
  '%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D8%B1-%D8%A7%D9%84%D8%B5%D8%AD%D9%8A',
  '\u0643\u0648\u0631\u0633 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0635\u062D\u064A',
  '\u062F\u0648\u0631\u0629 \u0634\u0627\u0645\u0644\u0629 \u0644\u0641\u0647\u0645 \u0623\u0633\u0627\u0633\u064A\u0627\u062A \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0648\u062A\u062D\u0633\u064A\u0646 \u0639\u0627\u062F\u0627\u062A \u0627\u0644\u0623\u0643\u0644.\u06611 \u0623\u0633\u0628\u0648\u0639 \u0645\u0646 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0639\u0644\u0645\u064A \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629.',
  '\u062F\u0648\u0631\u0629 \u0634\u0627\u0645\u0644\u0629',
  '\u0643\u0648\u0631\u0633 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0635\u062D\u064A',
  '\u062F\u0648\u0631\u0629 \u0634\u0627\u0645\u0644\u0629 \u0644\u0641\u0647\u0645 \u0623\u0633\u0627\u0633\u064A\u0627\u062A \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0648\u062A\u062D\u0633\u064A\u0646 \u0639\u0627\u062F\u0627\u062A \u0627\u0644\u0623\u0643\u0644. 11 \u0623\u0633\u0628\u0648\u0639 \u0645\u0646 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0639\u0644\u0645\u064A \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629.',
  [
    { icon: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', text: '2 \u0633\u0627\u0639\u0629 53 \u062F\u0642\u064A\u0642\u0629' },
    { icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>', text: '11 \u0623\u0633\u0628\u0648\u0639' },
    { icon: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', text: '\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A' },
    { icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', text: '\u0627\u062E\u062A\u0635\u0627\u0635\u064A\u0629 \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0631\u0648\u0644\u0627 \u0639\u0644\u0648\u0634' },
  ],
  '\u0639\u0646 \u0627\u0644\u062F\u0648\u0631\u0629',
  '\u0645\u0627 \u0647\u0648 \u0643\u0648\u0631\u0633 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0635\u062D\u064A\u061F',
  '\u062F\u0648\u0631\u0629 \u0634\u0627\u0645\u0644\u0629 \u0644\u0641\u0647\u0645 \u0623\u0633\u0627\u0633\u064A\u0627\u062A \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0648\u062A\u062D\u0633\u064A\u0646 \u0639\u0627\u062F\u0627\u062A \u0627\u0644\u0623\u0643\u0644. 11 \u0623\u0633\u0628\u0648\u0639 \u0645\u0646 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0639\u0644\u0645\u064A \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0633\u0627\u0639\u062F\u0643 \u0639\u0644\u0649 \u0628\u0646\u0627\u0621 \u0646\u0638\u0627\u0645 \u063A\u0630\u0627\u0626\u064A \u0635\u062D\u064A \u0645\u062A\u0648\u0627\u0632\u0646 \u064A\u0646\u0627\u0633\u0628 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A\u0643 \u0627\u0644\u0641\u0631\u062F\u064A\u0629.',
  [
    '\u0641\u0647\u0645 \u0623\u0633\u0627\u0633\u064A\u0627\u062A \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0648\u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0648\u0627\u0644\u062D\u0635\u0635 \u0627\u0644\u063A\u0630\u0627\u0626\u064A\u0629',
    '\u062A\u062D\u0633\u064A\u0646 \u0639\u0627\u062F\u0627\u062A \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629',
    '\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u062A\u0631\u0643\u064A\u0628 \u0648\u062C\u0628\u0627\u062A \u0645\u062A\u0648\u0627\u0632\u0646\u0629',
    '\u062A\u0635\u0645\u064A\u0645 \u0646\u0638\u0627\u0645\u0643 \u0627\u0644\u063A\u0630\u0627\u0626\u064A \u0627\u0644\u062E\u0627\u0635 \u0628\u0643',
    '\u0623\u0633\u0627\u0633\u064A\u0627\u062A \u0627\u0644\u062A\u0633\u0648\u0642 \u0627\u0644\u0635\u062D\u064A \u0648\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u063A\u0630\u0627\u0626\u064A\u0629',
    '\u062F\u0645\u062C \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0641\u064A \u0646\u0645\u0637 \u062D\u064A\u0627\u062A\u0643 \u0645\u0639 \u0627\u0644\u0631\u064A\u0627\u0636\u0629 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0648\u062A\u0631',
    '\u0641\u0647\u0645 \u0645\u0634\u0643\u0644\u0629 \u0625\u062F\u0645\u0627\u0646 \u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u0637\u0631\u0642 \u0639\u0644\u0627\u062C\u0647\u0627',
    '\u0627\u0644\u0641\u0631\u0642 \u0628\u064A\u0646 \u0627\u0644\u0623\u0643\u0644 \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0648\u0627\u0644\u0639\u0627\u0637\u0641\u064A',
    '\u0637\u0631\u0642 \u0631\u0641\u0639 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u062D\u0631\u0642 \u0648\u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0628',
    '\u0623\u0633\u0631\u0627\u0631 \u0636\u0628\u0637 \u0627\u0644\u0634\u0647\u064A\u0629 \u0648\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0639\u0644\u0627\u0642\u0629 \u0635\u062D\u064A\u0629 \u0645\u0639 \u0627\u0644\u0637\u0639\u0627\u0645',
  ],
  [
    '\u062A\u0639\u0627\u0646\u064A \u0645\u0646 \u062A\u0643\u0631\u0627\u0631 \u0641\u0634\u0644 \u0627\u0644\u062F\u0627\u064A\u062A \u062F\u0648\u0646 \u0646\u062A\u0627\u0626\u062C \u0645\u0633\u062A\u062F\u0627\u0645\u0629',
    '\u062A\u0631\u063A\u0628 \u0641\u064A \u062A\u063A\u064A\u064A\u0631 \u0648\u0632\u0646\u0643 \u0648\u0646\u0638\u0627\u0645 \u062D\u064A\u0627\u062A\u0643 \u0627\u0644\u0635\u062D\u064A',
    '\u062A\u0639\u0627\u0646\u064A \u0645\u0646 \u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0645\u062A\u0643\u0631\u0631\u0629',
    '\u062A\u0628\u062D\u062B \u0639\u0646 \u0628\u062F\u0627\u064A\u0629 \u0635\u062D\u064A\u0629 \u0648\u0627\u0642\u0639\u064A\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631',
  ],
  [
    {
      icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
      title: '\u0645\u0648\u0627\u062F \u0627\u0644\u062F\u0648\u0631\u0629',
      items: ['3 \u0633\u0627\u0639\u0627\u062A \u0645\u0646 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0639\u0644\u0645\u064A', '\u0644\u0642\u0627\u0621 \u0634\u062E\u0635\u064A \u062C\u0644\u0633\u0629 \u0635\u062D\u064A\u0629 \u0645\u0639 \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0635\u064A\u0629 \u0631\u0648\u0644\u0627', '\u0646\u0638\u0627\u0645 \u063A\u0630\u0627\u0626\u064A \u0635\u062D\u064A \u0645\u062A\u0648\u0627\u0632\u0646 \u062D\u0633\u0628 \u0627\u062D\u062A\u064A\u0627\u062C\u0643', '\u0645\u0644\u0641 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629', '\u0645\u0644\u0641 \u0627\u0644\u0648\u0635\u0641\u0627\u062A \u0627\u0644\u0635\u062D\u064A\u0629', '\u0645\u0644\u0641 \u0627\u0644\u0628\u062F\u0627\u0626\u0644 \u0627\u0644\u063A\u0630\u0627\u0626\u064A\u0629', '\u0645\u0644\u0641 \u062A\u0643\u0648\u064A\u0646 \u0627\u0644\u0639\u0627\u062F\u0627\u062A \u0627\u0644\u0635\u062D\u064A\u0629', '3 \u062C\u062F\u0627\u0648\u0644 \u0631\u064A\u0627\u0636\u064A\u0629', '\u0634\u0647\u0627\u062F\u0629 \u062D\u0636\u0648\u0631', '\u062C\u0644\u0633\u0627\u062A \u0623\u0633\u0628\u0648\u0639\u064A\u0629 \u062C\u0645\u0627\u0639\u064A\u0629 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629'],
    },
    {
      icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
      title: '\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A',
      items: ['\u0627\u0644\u0648\u0639\u064A \u0648\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u062A\u0637\u0628\u064A\u0642 \u0645\u0627 \u062A\u062A\u0639\u0644\u0645\u0647', '\u0644\u0627 \u064A\u062A\u0637\u0644\u0628 \u0623\u064A \u062E\u0628\u0631\u0629 \u0645\u0633\u0628\u0642\u0629', '\u064A\u0646\u0635\u062D \u0628\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062F\u0631\u0648\u0633 \u0628\u0627\u0644\u062A\u0631\u062A\u064A\u0628', '\u062A\u062E\u0635\u064A\u0635 \u0648\u0642\u062A \u0623\u0633\u0628\u0648\u0639\u064A \u0644\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0639\u0645\u0644\u064A'],
    },
  ],
  '<div class="chapter-label">\u0645\u062D\u062A\u0648\u0649 \u0643\u0648\u0631\u0633 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0635\u062D\u064A</div>\n          <div style="text-align:center;background:var(--white);padding:40px 24px;border-radius:var(--radius);border:2px dashed var(--border);margin-top:8px">\n            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" style="margin-bottom:12px">\n              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>\n              <path d="M7 11V7a5 5 0 0110 0v4"/>\n            </svg>\n            <h3 style="font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:6px">\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0648\u0631\u0629 \u0645\u062A\u0627\u062D \u0644\u0644\u0645\u0634\u062A\u0631\u0643\u064A\u0646</h3>\n            <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:20px;line-height:1.6">\u0627\u0634\u062A\u0631\u0643 \u0641\u064A \u0627\u0644\u062F\u0648\u0631\u0629 \u0648\u0627\u0637\u0644\u0639 \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u062D\u0627\u0636\u0631\u0627\u062A \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629</p>\n            <a href="https://wa.me/905300222468?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%83%D9%88%D8%B1%D8%B3%20%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D8%B1%20%D8%A7%D9%84%D8%B5%D8%AD%D9%8A" class="btn btn-primary" target="_blank" rel="noopener">\u0627\u0634\u062A\u0631\u0650 \u0627\u0644\u0622\u0646 - $247</a>\n          </div>',
  '247', null,
  '\u0627\u0634\u062A\u0631\u0650 \u0627\u0644\u0622\u0646 - $247',
  'https://wa.me/905300222468?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%83%D9%88%D8%B1%D8%B3%20%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D8%B1%20%D8%A7%D9%84%D8%B5%D8%AD%D9%8A',
  '$247'
);

// ============ COURSE 2: الأكل العاطفي ============
const emotional = buildPage(
  '%D8%A7%D9%84%D8%A3%D9%83%D9%84-%D8%A7%D9%84%D8%B9%D8%A7%D8%B7%D9%81%D9%8A',
  '\u0643\u0648\u0631\u0633 \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0645\u0646 \u0627\u0644\u0634\u0647\u064A\u0629 \u0627\u0644\u0627\u0646\u0641\u0639\u0627\u0644\u064A\u0629',
  '\u0631\u062D\u0644\u0629 \u0641\u0631\u064A\u062F\u0629 \u062A\u0645\u062A\u062F \u0639\u0644\u0649 \u0645\u062F\u0649 6 \u0623\u0633\u0627\u0628\u064A\u0639\u060C \u062A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u0639\u0644\u0645 \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0644\u0641\u0647\u0645 \u0639\u0644\u0627\u0642\u062A\u0643 \u0645\u0639 \u0627\u0644\u0637\u0639\u0627\u0645\u060C \u0648\u0627\u0644\u062A\u062D\u0631\u0631 \u0645\u0646 \u0627\u0644\u0623\u0643\u0644 \u0627\u0644\u0639\u0627\u0637\u0641\u064A \u0628\u0634\u0643\u0644 \u0646\u0647\u0627\u0626\u064A.',
  '\u062F\u0648\u0631\u0629 \u0645\u062F\u0641\u0648\u0639\u0629',
  '\u0643\u0648\u0631\u0633 \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0645\u0646 \u0627\u0644\u0634\u0647\u064A\u0629 \u0627\u0644\u0627\u0646\u0641\u0639\u0627\u0644\u064A\u0629',
  '\u0631\u062D\u0644\u0629 \u0641\u0631\u064A\u062F\u0629 \u062A\u0645\u062A\u062F \u0639\u0644\u0649 \u0645\u062F\u0649 6 \u0623\u0633\u0627\u0628\u064A\u0639\u060C \u062A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u0639\u0644\u0645 \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0644\u0641\u0647\u0645 \u0639\u0644\u0627\u0642\u062A\u0643 \u0645\u0639 \u0627\u0644\u0637\u0639\u0627\u0645\u060C \u0648\u0627\u0644\u062A\u062D\u0631\u0631 \u0645\u0646 \u0627\u0644\u0623\u0643\u0644 \u0627\u0644\u0639\u0627\u0637\u0641\u064A \u0628\u0634\u0643\u0644 \u0646\u0647\u0627\u0626\u064A.',
  [
    { icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>', text: '6 \u0623\u0633\u0627\u0628\u064A\u0639' },
    { icon: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', text: '\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A' },
    { icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', text: '5 \u0645\u0644\u062A\u062D\u0642' },
    { icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', text: '\u0627\u062E\u062A\u0635\u0627\u0635\u064A\u0629 \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0631\u0648\u0644\u0627 \u0639\u0644\u0648\u0634' },
  ],
  '\u0639\u0646 \u0627\u0644\u062F\u0648\u0631\u0629',
  '\u062A\u062E\u0644\u0635\u064A \u0645\u0646 \u0627\u0644\u0623\u0643\u0644 \u0627\u0644\u0639\u0627\u0637\u0641\u064A \u0646\u0647\u0627\u0626\u064A\u0627\u064B',
  '\u0631\u062D\u0644\u0629 \u0641\u0631\u064A\u062F\u0629 \u062A\u0645\u062A\u062F \u0639\u0644\u0649 \u0645\u062F\u0649 6 \u0623\u0633\u0627\u0628\u064A\u0639\u060C \u062A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u0639\u0644\u0645 \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0644\u0641\u0647\u0645 \u0639\u0644\u0627\u0642\u062A\u0643 \u0645\u0639 \u0627\u0644\u0637\u0639\u0627\u0645\u060C \u0648\u0627\u0644\u062A\u062D\u0631\u0631 \u0645\u0646 \u0627\u0644\u0623\u0643\u0644 \u0627\u0644\u0639\u0627\u0637\u0641\u064A \u0628\u0634\u0643\u0644 \u0646\u0647\u0627\u0626\u064A. \u0633\u062A\u062A\u0639\u0644\u0645\u064A\u0646 \u0643\u064A\u0641 \u062A\u0645\u064A\u0632\u064A\u0646 \u0628\u064A\u0646 \u0627\u0644\u062C\u0648\u0639 \u0627\u0644\u062C\u0633\u062F\u064A \u0648\u0627\u0644\u0639\u0627\u0637\u0641\u064A\u060C \u0648\u0643\u064A\u0641 \u062A\u062A\u0639\u0627\u0645\u0644\u064A\u0646 \u0645\u0639 \u0645\u0634\u0627\u0639\u0631\u0643 \u062F\u0648\u0646 \u0627\u0644\u0644\u062C\u0648\u0621 \u0644\u0644\u0637\u0639\u0627\u0645.',
  [
    '\u0627\u0644\u062A\u0645\u064A\u0632 \u0628\u064A\u0646 \u0627\u0644\u062C\u0648\u0639 \u0627\u0644\u062C\u0633\u062F\u064A \u0648\u0627\u0644\u0639\u0627\u0637\u0641\u064A',
    '\u0627\u0644\u062A\u0639\u0627\u0645\u0644 \u0645\u0639 \u0627\u0644\u0645\u0634\u0627\u0639\u0631 \u062F\u0648\u0646 \u0627\u0644\u0644\u062C\u0648\u0621 \u0644\u0644\u0637\u0639\u0627\u0645',
    '\u0643\u0633\u0631 \u0627\u0644\u062A\u0639\u0644\u0642 \u0628\u0627\u0644\u0623\u0643\u0644 \u0643\u0648\u0633\u064A\u0644\u0629 \u0631\u0627\u062D\u0629',
    '\u0628\u0646\u0627\u0621 \u0639\u0644\u0627\u0642\u0629 \u0645\u062A\u0648\u0627\u0632\u0646\u0629 \u0645\u0639 \u062C\u0633\u062F\u0643',
    '\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0637\u0627\u0642\u062A\u0643 \u0648\u062B\u0642\u062A\u0643 \u0628\u0646\u0641\u0633\u0643',
    '\u0639\u064A\u0634 \u062D\u064A\u0627\u0629 \u063A\u0630\u0627\u0626\u064A\u0629 \u0647\u0627\u062F\u0626\u0629 \u0648\u0645\u0633\u062A\u0642\u0631\u0629',
  ],
  [
    '\u062A\u0623\u0643\u0644\u064A\u0646 \u0639\u0646\u062F \u0627\u0644\u063A\u0636\u0628 \u0623\u0648 \u0627\u0644\u062A\u0648\u062A\u0631 \u0623\u0648 \u0627\u0644\u0645\u0644\u0644 \u062F\u0648\u0646 \u0648\u0639\u064A',
    '\u062A\u0634\u0639\u0631\u064A\u0646 \u0628\u0627\u0644\u0630\u0646\u0628 \u0628\u0639\u062F \u0627\u0644\u0623\u0643\u0644',
    '\u062C\u0631\u0628\u062A \u0623\u0646\u0638\u0645\u0629 \u0643\u062B\u064A\u0631\u0629 \u0648\u0644\u0645 \u062A\u0633\u062A\u0637\u064A\u0639\u064A \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645',
    '\u062A\u0639\u0627\u0646\u064A\u0646 \u0645\u0646 \u0646\u0648\u0628\u0627\u062A \u0634\u0631\u0627\u0647\u0629 \u0623\u0648 \u0623\u0643\u0644 \u0644\u064A\u0644\u064A',
    '\u062A\u0631\u064A\u062F\u064A\u0646 \u0623\u0646 \u062A\u062D\u0628\u064A \u062C\u0633\u062F\u0643 \u062F\u0648\u0646 \u062C\u0644\u062F \u0623\u0648 \u062D\u0631\u0645\u0627\u0646',
    '\u062A\u0628\u062D\u062B\u064A\u0646 \u0639\u0646 \u062A\u0648\u0627\u0632\u0646 \u062D\u0642\u064A\u0642\u064A',
  ],
  [
    {
      icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
      title: '\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A',
      items: ['\u0644\u0627 \u064A\u062A\u0637\u0644\u0628 \u0623\u064A \u062E\u0644\u0641\u064A\u0629 \u0645\u0633\u0628\u0642\u0629', '\u064A\u0646\u0635\u062D \u0628\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0623\u0633\u0627\u0628\u064A\u0639 \u0628\u0627\u0644\u062A\u0631\u062A\u064A\u0628', '\u062A\u062E\u0635\u064A\u0635 \u0648\u0642\u062A \u0644\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0639\u0645\u0644\u064A', '\u0631\u063A\u0628\u0629 \u0635\u0627\u062F\u0642\u0629 \u0641\u064A \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0639\u0644\u0627\u0642\u0629 \u0645\u0639 \u0627\u0644\u0637\u0639\u0627\u0645'],
    },
    {
      icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      title: '\u0645\u0627\u0630\u0627 \u0633\u062A\u062D\u0635\u0644\u064A\u0646\u061F',
      items: ['6 \u0623\u0633\u0627\u0628\u064A\u0639 \u0645\u0646 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0639\u0644\u0645\u064A', '\u062A\u0645\u0627\u0631\u064A\u0646 \u0639\u0645\u0644\u064A\u0629 \u0644\u0641\u0647\u0645 \u0645\u0634\u0627\u0639\u0631\u0643 \u062A\u062C\u0627\u0647 \u0627\u0644\u0637\u0639\u0627\u0645', '\u0623\u062F\u0648\u0627\u062A \u0644\u0644\u062A\u0645\u064A\u0632 \u0628\u064A\u0646 \u0627\u0644\u062C\u0648\u0639 \u0627\u0644\u062C\u0633\u062F\u064A \u0648\u0627\u0644\u0639\u0627\u0637\u0641\u064A', '\u062E\u0637\u0648\u0627\u062A \u0644\u0643\u0633\u0631 \u062F\u0627\u0626\u0631\u0629 \u0627\u0644\u0630\u0646\u0628 \u0648\u0627\u0644\u062D\u0631\u0645\u0627\u0646', '\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0627\u062A \u0644\u0628\u0646\u0627\u0621 \u0639\u0627\u062F\u0627\u062A \u063A\u0630\u0627\u0626\u064A\u0629 \u0645\u062A\u0648\u0627\u0632\u0646\u0629', '\u062F\u0639\u0645 \u0645\u0633\u062A\u0645\u0631 \u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631\u064A\u0629'],
    },
  ],
  '<div class="chapter-label">\u0645\u062D\u062A\u0648\u0649 \u0643\u0648\u0631\u0633 \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0645\u0646 \u0627\u0644\u0634\u0647\u064A\u0629 \u0627\u0644\u0627\u0646\u0641\u0639\u0627\u0644\u064A\u0629</div>\n          <div style="text-align:center;background:var(--white);padding:40px 24px;border-radius:var(--radius);border:2px dashed var(--border);margin-top:8px">\n            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" style="margin-bottom:12px">\n              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>\n              <path d="M7 11V7a5 5 0 0110 0v4"/>\n            </svg>\n            <h3 style="font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:6px">\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0648\u0631\u0629 \u0645\u062A\u0627\u062D \u0644\u0644\u0645\u0634\u062A\u0631\u0643\u064A\u0646</h3>\n            <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:20px;line-height:1.6">\u0627\u0634\u062A\u0631\u0643\u064A \u0641\u064A \u0627\u0644\u062F\u0648\u0631\u0629 \u0648\u0627\u0637\u0644\u0639\u064A \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u062D\u0627\u0636\u0631\u0627\u062A \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629</p>\n            <a href="https://wa.me/905300222468?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%83%D9%88%D8%B1%D8%B3%20%D8%A7%D9%84%D8%B4%D9%87%D9%8A%D8%A9%20%D8%A7%D9%84%D8%A7%D9%86%D9%81%D8%B9%D8%A7%D9%84%D9%8A%D8%A9" class="btn btn-primary" target="_blank" rel="noopener">\u0627\u0634\u062A\u0631\u0650 \u0627\u0644\u0622\u0646 - $200</a>\n          </div>',
  '200', '$249',
  '\u0627\u0634\u062A\u0631\u0650 \u0627\u0644\u0622\u0646 - $200',
  'https://wa.me/905300222468?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%83%D9%88%D8%B1%D8%B3%20%D8%A7%D9%84%D8%B4%D9%87%D9%8A%D8%A9%20%D8%A7%D9%84%D8%A7%D9%86%D9%81%D8%B9%D8%A7%D9%84%D9%8A%D8%A9',
  '$200'
);

// ============ COURSE 3: تكيس المبايض ============
const takayus = buildPage(
  '%D8%AA%D9%83%D9%8A%D8%B3-%D8%A7%D9%84%D9%85%D8%A8%D8%A7%D9%8A%D8%B6',
  '\u0643\u0648\u0631\u0633 \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0645\u0646 \u062A\u0643\u064A\u0633 \u0627\u0644\u0645\u0628\u0627\u064A\u0636',
  '\u0628\u0631\u0646\u0627\u0645\u062C \u0645\u062A\u062E\u0635\u0635 \u0644\u0645\u0633\u0627\u0639\u062F\u0629 \u0627\u0644\u0646\u0633\u0627\u0621 \u0627\u0644\u0645\u0635\u0627\u0628\u0627\u062A \u0628\u062A\u0643\u064A\u0633 \u0627\u0644\u0645\u0628\u0627\u064A\u0636 \u0639\u0644\u0649 \u062A\u062D\u0633\u064A\u0646 \u0635\u062D\u062A\u0647\u0646 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0639\u0644\u0627\u062C\u064A\u0629.',
  '\u062F\u0648\u0631\u0629 \u0645\u062A\u062E\u0635\u0635\u0629',
  '\u0643\u0648\u0631\u0633 \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0645\u0646 \u062A\u0643\u064A\u0633 \u0627\u0644\u0645\u0628\u0627\u064A\u0636',
  '\u0635\u0645\u0645 \u0644\u064A\u0639\u0637\u064A\u0643 \u0635\u0648\u0631\u0629 \u0648\u0627\u0636\u062D\u0629 \u0648\u0634\u0627\u0645\u0644\u0629 \u0639\u0646 \u0643\u0644 \u0645\u0627 \u064A\u062E\u0635 \u0627\u0644\u062A\u0643\u064A\u0633 \u0648\u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629 \u0648\u0627\u0644\u0639\u0644\u0627\u062C.',
  [
    { icon: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', text: '2 \u0633\u0627\u0639\u062A\u064A\u0646' },
    { icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>', text: '33 \u062F\u0631\u0633' },
    { icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>', text: '5.00 \u062A\u0642\u064A\u064A\u0645' },
    { icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', text: '\u0627\u062E\u062A\u0635\u0627\u0635\u064A\u0629 \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0631\u0648\u0644\u0627 \u0639\u0644\u0648\u0634' },
  ],
  '\u0639\u0646 \u0627\u0644\u062F\u0648\u0631\u0629',
  '\u0643\u0644 \u0645\u0627 \u062A\u0631\u064A\u062F\u064A\u0646 \u0645\u0639\u0631\u0641\u062A\u0647 \u0639\u0646 \u062A\u0643\u064A\u0633 \u0627\u0644\u0645\u0628\u0627\u064A\u0636',
  '\u0643\u0648\u0631\u0633 \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0645\u0646 \u062A\u0643\u064A\u0633 \u0627\u0644\u0645\u0628\u0627\u064A\u0636 \u0635\u0645\u0645 \u0644\u064A\u0639\u0637\u064A\u0643 \u0635\u0648\u0631\u0629 \u0648\u0627\u0636\u062D\u0629 \u0648\u0634\u0627\u0645\u0644\u0629 \u0639\u0646 \u0643\u0644 \u0645\u0627 \u064A\u062E\u0635 \u0627\u0644\u062A\u0643\u064A\u0633 \u0648\u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629 \u0648\u0627\u0644\u0639\u0644\u0627\u062C. \u064A\u0634\u0631\u062D \u0627\u0644\u0643\u0648\u0631\u0633 \u0627\u0644\u0623\u0633\u0628\u0627\u0628 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0644\u0627\u0636\u0637\u0631\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0648\u0631\u0629\u060C \u0637\u0631\u0642 \u0627\u0644\u062A\u0634\u062E\u064A\u0635 \u0627\u0644\u0635\u062D\u064A\u062D\u0629\u060C \u0648\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0644\u0627\u062C\u064A\u0629 \u0627\u0644\u0645\u062A\u0627\u062D\u0629.',
  [
    '\u0641\u0647\u0645 \u0623\u0633\u0628\u0627\u0628 \u0627\u0636\u0637\u0631\u0627\u0628 \u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629 \u0648\u0639\u0644\u0627\u0642\u062A\u0647\u0627 \u0628\u0627\u0644\u0647\u0631\u0645\u0648\u0646\u0627\u062A',
    '\u0627\u0644\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0645\u062A\u0644\u0627\u0632\u0645\u0629 \u062A\u0643\u064A\u0633 \u0627\u0644\u0645\u0628\u0627\u064A\u0636: \u0627\u0644\u0623\u0639\u0631\u0627\u0636\u060C \u0627\u0644\u062A\u0634\u062E\u064A\u0635\u060C \u0648\u0627\u0644\u0641\u0631\u0642 \u0628\u064A\u0646\u0647\u0627 \u0648\u0628\u064A\u0646 \u0627\u0644\u0623\u0643\u064A\u0627\u0633',
    '\u0627\u0644\u0637\u0631\u0642 \u0627\u0644\u0639\u0644\u0627\u062C\u064A\u0629 \u0627\u0644\u0645\u062A\u0627\u062D\u0629: \u0627\u0644\u0623\u062F\u0648\u064A\u0629\u060C \u0627\u0644\u0645\u0643\u0645\u0644\u0627\u062A\u060C \u0648\u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u063A\u0630\u0627\u0626\u064A \u0627\u0644\u0645\u0646\u0627\u0633\u0628',
    '\u0627\u0644\u0639\u0644\u0627\u0642\u0629 \u0628\u064A\u0646 \u0627\u0644\u0648\u0632\u0646\u060C \u0645\u0642\u0627\u0648\u0645\u0629 \u0627\u0644\u0623\u0646\u0633\u0648\u0644\u064A\u0646\u060C \u0648\u0635\u0639\u0648\u0628\u0629 \u0646\u0632\u0648\u0644\u0647',
    '\u0643\u064A\u0641\u064A\u0629 \u0627\u0644\u062A\u0639\u0627\u0645\u0644 \u0645\u0639 \u0627\u0644\u062D\u0628\u0648\u0628 \u0627\u0644\u0647\u0631\u0645\u0648\u0646\u064A\u0629',
    '\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0627\u062A \u0644\u0632\u064A\u0627\u062F\u0629 \u0641\u0631\u0635 \u0627\u0644\u062D\u0645\u0644 \u0645\u0639 \u0648\u062C\u0648\u062F \u0627\u0644\u062A\u0643\u064A\u0633',
    '\u0625\u062C\u0627\u0628\u0627\u062A \u0639\u0644\u0645\u064A\u0629 \u0644\u0623\u0634\u0647\u0631 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u062D\u0648\u0644 \u0627\u0644\u062A\u0643\u064A\u0633',
  ],
  [
    '\u062A\u0639\u0627\u0646\u064A\u0646 \u0645\u0646 \u062A\u0643\u064A\u0633 \u0627\u0644\u0645\u0628\u0627\u064A\u0636 \u0648\u062A\u0628\u062D\u062B\u064A\u0646 \u0639\u0646 \u062D\u0644\u0648\u0644 \u0635\u062D\u064A\u0629',
    '\u062A\u0631\u064A\u062F\u064A\u0646 \u062A\u062D\u0633\u064A\u0646 \u0635\u062D\u062A\u0643 \u0627\u0644\u0647\u0631\u0645\u0648\u0646\u064A\u0629',
    '\u062A\u0628\u062D\u062B\u064A\u0646 \u0639\u0646 \u0632\u064A\u0627\u062F\u0629 \u0641\u0631\u0635 \u0627\u0644\u062D\u0645\u0644',
    '\u062A\u0631\u064A\u062F\u064A\u0646 \u0641\u0647\u0645\u0627 \u0639\u0644\u0645\u064A\u0627\u064B \u0644\u062D\u0627\u0644\u062A\u0643',
  ],
  [
    {
      icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
      title: '\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A',
      items: ['\u0644\u0627 \u062A\u062D\u062A\u0627\u062C\u064A \u0644\u0623\u064A \u062E\u0644\u0641\u064A\u0629 \u0637\u0628\u064A\u0629 \u0645\u0633\u0628\u0642\u0629', '\u064A\u0641\u0636\u0644 \u0648\u062C\u0648\u062F \u062F\u0641\u062A\u0631 \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A', '\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0645\u0634\u0627\u0647\u062F\u0629 \u0627\u0644\u062F\u0631\u0648\u0633 \u0628\u0627\u0644\u062A\u0631\u062A\u064A\u0628'],
    },
    {
      icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      title: '\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0645\u0631\u0641\u0642\u0629',
      items: ['\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0645\u0633\u062C\u0644\u0629 \u0628\u0634\u0643\u0644 \u0645\u0628\u0633\u0637', '\u0645\u0644\u062E\u0635\u0627\u062A \u0645\u0643\u062A\u0648\u0628\u0629 \u0644\u0623\u0647\u0645 \u0627\u0644\u0646\u0642\u0627\u0637', '\u062C\u062F\u0627\u0648\u0644 \u0639\u0645\u0644\u064A\u0629 \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0648\u0632\u0646 \u0648\u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644', '\u0642\u0627\u0626\u0645\u0629 \u0645\u0643\u0645\u0644\u0627\u062A \u0648\u0623\u062F\u0648\u064A\u0629 \u0645\u0639 \u0634\u0631\u062D', '\u0625\u062C\u0627\u0628\u0627\u062A \u0639\u0644\u0649 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629'],
    },
  ],
  '<div class="chapter-label">\u0645\u062D\u062A\u0648\u0649 \u0643\u0648\u0631\u0633 \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0645\u0646 \u062A\u0643\u064A\u0633 \u0627\u0644\u0645\u0628\u0627\u064A\u0636</div>\n          <div style="text-align:center;background:var(--white);padding:40px 24px;border-radius:var(--radius);border:2px dashed var(--border);margin-top:8px">\n            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" style="margin-bottom:12px">\n              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>\n              <path d="M7 11V7a5 5 0 0110 0v4"/>\n            </svg>\n            <h3 style="font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:6px">\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0648\u0631\u0629 \u0645\u062A\u0627\u062D \u0644\u0644\u0645\u0634\u062A\u0631\u0643\u064A\u0646</h3>\n            <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:20px;line-height:1.6">\u0627\u0634\u062A\u0631\u0643\u064A \u0641\u064A \u0627\u0644\u062F\u0648\u0631\u0629 \u0648\u0627\u0637\u0644\u0639\u064A \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u062D\u0627\u0636\u0631\u0627\u062A \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629</p>\n            <a href="https://wa.me/905300222468?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%83%D9%88%D8%B1%D8%B3%20%D8%AA%D9%83%D9%8A%D8%B3%20%D8%A7%D9%84%D9%85%D8%A8%D8%A7%D9%8A%D8%B6" class="btn btn-primary" target="_blank" rel="noopener">\u0627\u0634\u062A\u0631\u0650 \u0627\u0644\u0622\u0646 - $247</a>\n          </div>',
  '247', null,
  '\u0627\u0634\u062A\u0631\u0650 \u0627\u0644\u0622\u0646 - $247',
  'https://wa.me/905300222468?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%83%D9%88%D8%B1%D8%B3%20%D8%AA%D9%83%D9%8A%D8%B3%20%D8%A7%D9%84%D9%85%D8%A8%D8%A7%D9%8A%D8%B6',
  '$247'
);

// Write files
fs.writeFileSync(path.join(dir, '%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D8%B1-%D8%A7%D9%84%D8%B5%D8%AD%D9%8A.html'), masar, 'utf-8');
console.log('Wrote المسار-الصحي.html');
fs.writeFileSync(path.join(dir, '%D8%A7%D9%84%D8%A3%D9%83%D9%84-%D8%A7%D9%84%D8%B9%D8%A7%D8%B7%D9%81%D9%8A.html'), emotional, 'utf-8');
console.log('Wrote الأكل-العاطفي.html');
fs.writeFileSync(path.join(dir, '%D8%AA%D9%83%D9%8A%D8%B3-%D8%A7%D9%84%D9%85%D8%A8%D8%A7%D9%8A%D8%B6.html'), takayus, 'utf-8');
console.log('Wrote تكيس-المبايض.html');
console.log('Done!');
