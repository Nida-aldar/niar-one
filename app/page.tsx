"use client";

import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  Command,
  FileText,
  Layers3,
  MessageSquareText,
  PenLine,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const tools = [
  {
    name: "AI Writing Studio",
    description: "Turn a blank page into your next great idea.",
    category: "NIAR AI",
    icon: PenLine,
    accent: "violet",
    tag: "Popular",
    href: "/ai",
  },
  {
    name: "Smart Study Notes",
    description: "Make clear, useful notes from your learning.",
    category: "NIAR Study",
    icon: BookOpen,
    accent: "blue",
    tag: "For students",
    href: "/study",
  },
  {
    name: "Data Storyteller",
    description: "Find the signal in your spreadsheets.",
    category: "Data Lab",
    icon: BarChart3,
    accent: "mint",
    tag: "Coming soon",
    href: "/data-lab",
  },
  {
    name: "Quick Summarizer",
    description: "Get the gist, without losing the important bits.",
    category: "NIAR AI",
    icon: FileText,
    accent: "pink",
    tag: "New",
    href: "/ai",
  },
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    note: "Sample pricing · final prices not configured",
    description: "A great place to get started.",
    features: ["Essential everyday tools", "A taste of NIAR AI", "Personal workspace"],
    featured: false,
  },
  {
    name: "Pro",
    price: "Sample",
    note: "Pricing to be announced",
    description: "More room for your best work.",
    features: ["Expanded AI usage", "Full Study toolkit", "Data Lab essentials"],
    featured: true,
  },
  {
    name: "Business",
    price: "Let’s talk",
    note: "Custom plans planned",
    description: "Bring your team’s ideas together.",
    features: ["Team-ready workspace", "Advanced insights", "Priority support"],
    featured: false,
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`brand${compact ? " brand-compact" : ""}`} href="#home" aria-label="NIAR One home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-wordmark">
        NIAR<span>One</span>
      </span>
    </a>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return tools;
    return tools.filter((tool) =>
      `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  return (
    <main id="home">
      <section aria-labelledby="hero-heading" className="hero-section">
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="eyebrow hero-eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            <span>Meet your new favorite workspace</span>
          </div>
          <h1 id="hero-heading">
            Your Entire Digital World,
            <span> One Platform.</span>
          </h1>
          <p className="hero-copy">
            Discover powerful AI tools, simplify your studies, analyze data, and get more done
            with NIAR One.
          </p>

          <form
            action="#featured-tools"
            className="hero-search"
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("featured-tools")?.scrollIntoView({ behavior: "smooth" });
            }}
            role="search"
          >
            <Search aria-hidden="true" className="search-icon" size={19} />
            <input
              aria-label="Search tools"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What would you like to get done?"
              ref={searchInput}
              type="search"
              value={query}
            />
            <kbd><Command size={12} aria-hidden="true" /> K</kbd>
            <button aria-label="Find a tool" type="submit">
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </form>
          <div className="hero-actions">
            <a className="button button-primary" href="#featured-tools">
              Explore tools <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a className="button button-quiet" href="/signup">
              Get started free
            </a>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars" aria-hidden="true">
              <span>A</span><span>R</span><span>S</span><span>+</span>
            </div>
            <p><strong>Made for curious minds</strong><span>Students, creators &amp; doers</span></p>
            <span className="proof-divider" />
            <p className="proof-rating"><span aria-label="5 out of 5 stars">★★★★★</span><small>Built for what’s next</small></p>
          </div>
        </div>
        <div aria-hidden="true" className="hero-orbit">
          <div className="orbit-ring orbit-ring-one" />
          <div className="orbit-ring orbit-ring-two" />
          <div className="orbit-core"><Brand compact /></div>
          <span className="orbit-node node-one"><Sparkles size={19} /></span>
          <span className="orbit-node node-two"><BarChart3 size={18} /></span>
          <span className="orbit-node node-three"><BookOpen size={18} /></span>
          <span className="orbit-node node-four"><Zap size={17} /></span>
          <span className="orbit-caption caption-one">Create</span>
          <span className="orbit-caption caption-two">Learn</span>
          <span className="orbit-caption caption-three">Discover</span>
        </div>
        <a className="scroll-cue" href="#featured-tools">
          <span>Scroll to explore</span><ArrowDown size={14} aria-hidden="true" />
        </a>
      </section>

      <section aria-label="Platform highlights" className="trust-strip">
        <p>One calm place for the things that move you forward</p>
        <div className="trust-items">
          <span><Sparkles size={15} aria-hidden="true" /> Create with AI</span>
          <span><BookOpen size={15} aria-hidden="true" /> Learn with focus</span>
          <span><BarChart3 size={15} aria-hidden="true" /> Understand your data</span>
          <span><Layers3 size={15} aria-hidden="true" /> Make space to do more</span>
        </div>
      </section>

      <section aria-labelledby="tools-heading" className="section tools-section" id="featured-tools">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> A little bit of everything</div>
            <h2 id="tools-heading">Meet your new <span>toolkit.</span></h2>
            <p>Thoughtful tools for big ideas, busy days, and everything in between.</p>
          </div>
          <a className="text-link" href="#tool-suite">
            Explore the platform <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
        <div aria-live="polite" className="tool-grid">
          {filteredTools.length ? filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <article className={`tool-card tool-${tool.accent}`} key={tool.name}>
                <div className="tool-card-top">
                  <span className="tool-icon"><Icon size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                  <span className={`tool-tag${tool.tag === "Coming soon" ? " tag-soon" : ""}`}>{tool.tag}</span>
                </div>
                <p className="tool-category">{tool.category}</p>
                <h3>{tool.name}</h3>
                <p className="tool-description">{tool.description}</p>
                <a aria-label={`Explore ${tool.name}`} className="tool-arrow" href={tool.href}>
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
                <span aria-hidden="true" className="card-glow" />
              </article>
            );
          }) : (
            <div className="empty-search">
              <Search size={21} aria-hidden="true" />
              <p>No tools match “{query}” yet.</p>
              <button onClick={() => setQuery("")} type="button">Clear search</button>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="suite-heading" className="suite-section" id="tool-suite">
        <div className="section suite-intro">
          <div className="eyebrow"><span className="eyebrow-dot" /> One platform, your pace</div>
          <h2 id="suite-heading">More focus.<br /><span>Less bouncing around.</span></h2>
          <p>Less time switching tabs. More time doing the things you came here to do.</p>
        </div>
        <div className="suite-cards">
          <article className="suite-card suite-ai" id="study-zone">
            <div className="suite-card-icon"><MessageSquareText size={19} aria-hidden="true" /></div>
            <span className="suite-label">01 / CREATE</span>
            <h3>Ideas, meet momentum.</h3>
            <p>Write, plan, and think things through with your choice of AI tools.</p>
            <a href="/ai">Explore NIAR AI <ArrowRight size={14} aria-hidden="true" /></a>
            <div aria-hidden="true" className="suite-decoration suite-decoration-ai"><Sparkles size={68} /></div>
          </article>
          <article className="suite-card suite-study">
            <div className="suite-card-icon"><BookOpen size={19} aria-hidden="true" /></div>
            <span className="suite-label">02 / LEARN</span>
            <h3>Study in your own flow.</h3>
            <p>Bring notes, revision, and the next thing on your list into one clear space.</p>
            <a href="/study">Discover NIAR Study <ArrowRight size={14} aria-hidden="true" /></a>
            <div aria-hidden="true" className="suite-decoration suite-decoration-study"><BookOpen size={72} /></div>
          </article>
          <article className="suite-card suite-data" id="data-lab">
            <div className="suite-card-icon"><BarChart3 size={19} aria-hidden="true" /></div>
            <span className="suite-label">03 / DISCOVER</span>
            <h3>Make data make sense.</h3>
            <p>Turn scattered rows into clearer questions and insights worth acting on.</p>
            <a href="/data-lab">Take a look at Data Lab <ArrowRight size={14} aria-hidden="true" /></a>
            <div aria-hidden="true" className="suite-decoration suite-decoration-data"><BarChart3 size={76} /></div>
          </article>
        </div>
      </section>

      <section aria-labelledby="about-heading" className="section about-section" id="about">
        <div className="about-visual">
          <div className="about-window">
            <div className="window-top"><span /><span /><span /><small>your space, in sync</small></div>
            <div className="window-content">
              <div className="window-sidebar"><i /><i /><i /><i /></div>
              <div className="window-main">
                <span className="window-kicker">A LITTLE MORE CLARITY</span>
                <strong>One thing at a time.<br /><em>All in one place.</em></strong>
                <div className="window-sparkline"><span /><span /><span /><span /><span /><span /><span /><span /></div>
                <div className="window-stat-row"><i /><i /><i /></div>
              </div>
            </div>
          </div>
          <div className="floating-badge"><span><Check size={14} /></span> Your work, together</div>
        </div>
        <div className="about-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A more connected kind of useful</div>
          <h2 id="about-heading">Your next good idea is closer <span>than you think.</span></h2>
          <p>NIAR One brings helpful tools into one thoughtful home—so your energy can go into the work, not the window switching.</p>
          <ul>
            <li><span><Check size={14} /></span>Made for students, creators, and curious teams</li>
            <li><span><Check size={14} /></span>Useful tools, without the noisy workspace</li>
            <li><span><Check size={14} /></span>Designed to grow around the way you work</li>
          </ul>
          <a className="button button-dark" href="#featured-tools">Find your flow <ArrowRight size={15} aria-hidden="true" /></a>
        </div>
      </section>

      <section aria-labelledby="testimonials-heading" className="testimonials-section">
        <div className="section">
          <div className="section-heading testimonial-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> A preview of what’s possible</div>
              <h2 id="testimonials-heading">Good things happen<br /><span>when it all clicks.</span></h2>
            </div>
            <p className="demo-disclaimer">Sample testimonials for design preview<br />— not real customer endorsements.</p>
          </div>
          <div className="testimonial-grid">
            {[
              ["“My ideas finally have a place to land. I can go from a messy thought to a proper plan without losing my afternoon.”", "Aanya M.", "Design student · Sample profile"],
              ["“I like that the useful things are together. Less tab-hopping means I can get back to the work I actually enjoy.”", "Rohan K.", "Independent creator · Sample profile"],
              ["“It feels calm. I can find what I need, focus on one thing, and keep moving without the usual digital clutter.”", "Meera S.", "Early-career professional · Sample profile"],
            ].map(([quote, name, role]) => (
              <article className="testimonial-card" key={name}>
                <div aria-label="5 out of 5 stars" className="testimonial-stars">★★★★★</div>
                <blockquote>{quote}</blockquote>
                <div className="testimonial-person"><span>{name.charAt(0)}</span><p><strong>{name}</strong><small>{role}</small></p></div>
                <span aria-hidden="true" className="quote-mark">“</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="pricing-heading" className="section pricing-section" id="pricing">
        <div className="pricing-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> Room to grow</div>
          <h2 id="pricing-heading">Start simple.<br /><span>Go wherever.</span></h2>
          <p>Pick a plan that fits your pace. You can always change things up.</p>
          <span className="sample-pricing-note"><Sparkles size={14} aria-hidden="true" /> Sample pricing — final prices aren’t configured yet.</span>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card${plan.featured ? " price-card-featured" : ""}`} key={plan.name}>
              {plan.featured && <span className="popular-pill">MADE FOR MORE</span>}
              <p className="plan-name">{plan.name}</p>
              <p className="plan-price">{plan.price}{plan.name === "Free" && <small> / forever</small>}</p>
              <p className="plan-note">{plan.note}</p>
              <p className="plan-description">{plan.description}</p>
              <a className={plan.featured ? "button button-primary plan-button" : "button button-outline plan-button"} href="/pricing">
                {plan.name === "Business" ? "Get in touch" : plan.name === "Free" ? "Explore the free plan" : "View plan details"}
                <ArrowRight size={15} aria-hidden="true" />
              </a>
              <div className="plan-divider" />
              <p className="included-label">WHAT’S IN IT</p>
              <ul>{plan.features.map((feature) => <li key={feature}><Check size={15} aria-hidden="true" />{feature}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="section faq-section">
        <div className="faq-intro">
          <div className="eyebrow"><span className="eyebrow-dot" /> A few good questions</div>
          <h2 id="faq-heading">Curious?<br /><span>We thought so.</span></h2>
          <p>We’re building NIAR One with care. Here’s what to know about this preview.</p>
          <a className="text-link" href="/contact">Ask us anything <ArrowRight size={15} aria-hidden="true" /></a>
        </div>
        <div className="faq-list">
          <details open>
            <summary>What is NIAR One?<ChevronDown size={18} aria-hidden="true" /></summary>
            <p>NIAR One is a work in progress: one home for useful AI tools, study support, practical utilities, and data insights.</p>
          </details>
          <details>
            <summary>Can I use the tools today?<ChevronDown size={18} aria-hidden="true" /></summary>
            <p>Everyday utilities and study planning work in the browser. AI generation requires a server-side provider key; saved study items require an account.</p>
          </details>
          <details>
            <summary>Are the testimonials and prices real?<ChevronDown size={18} aria-hidden="true" /></summary>
            <p>No. Testimonials are clearly marked sample content, and all plan details are illustrative until actual pricing is configured.</p>
          </details>
          <details>
            <summary>When will accounts be available?<ChevronDown size={18} aria-hidden="true" /></summary>
            <p>Sign up and login are available. Password reset links require the owner to configure an SMTP mail service.</p>
          </details>
        </div>
      </section>

      <section className="closing-cta" id="account-access">
        <div aria-hidden="true" className="closing-glow" />
        <div className="eyebrow"><Sparkles size={14} aria-hidden="true" /> A fresh start, when you’re ready</div>
        <h2>Make room for<br /><span>what’s next.</span></h2>
        <p>Take a first look around NIAR One. We’re just getting started.</p>
        <a className="button button-primary" href="#featured-tools">Explore NIAR One <ArrowRight size={16} aria-hidden="true" /></a>
        <span className="launch-note">Create a free account to save your study work.</span>
      </section>
    </main>
  );
}
