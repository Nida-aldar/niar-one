import type { Metadata } from "next";
import { ArrowRight, BookOpen, Sparkles, BarChart3 } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = { title: "About NIAR One" };

export default function AboutPage() {
  return (
    <main className="route-page">
      <section className="page-shell">
        <PageIntro eyebrow="A calmer digital workspace" title={<>One Platform.<br /><span>Endless Possibilities.</span></>} description="NIAR One brings useful tools into one thoughtful home for students, creators, freelancers, and curious teams." />
        <div className="about-route-grid">
          <article className="route-card"><Sparkles /><h2>Make</h2><p>Get unstuck and turn ideas into something you can use with helpful AI tools.</p><Link href="/ai">Explore AI <ArrowRight size={15} /></Link></article>
          <article className="route-card"><BookOpen /><h2>Learn</h2><p>Keep notes, revision cards, and the next task you need to finish together.</p><Link href="/study">Explore Study <ArrowRight size={15} /></Link></article>
          <article className="route-card"><BarChart3 /><h2>Understand</h2><p>Explore your own spreadsheet data in the browser and keep files on your device.</p><Link href="/data-lab">Explore Data Lab <ArrowRight size={15} /></Link></article>
        </div>
        <div className="callout"><h2>Built with care, one useful step at a time.</h2><p>NIAR One is actively being built. We label sample content, configuration requirements, and any feature that is not yet available.</p><Link className="button button-primary" href="/contact">Get in touch <ArrowRight size={15} /></Link></div>
      </section>
    </main>
  );
}
