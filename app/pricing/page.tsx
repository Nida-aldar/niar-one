"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { PageIntro } from "@/components/PageIntro";
import { Notice } from "@/components/Notice";
import Link from "next/link";

const plans = [
  { name: "Free", price: "₹0", note: "Illustrative sample price · not a charge", description: "For trying out everyday NIAR One features.", features: ["Browser-based utilities", "Personal study workspace", "Limited AI only when configured"] },
  { name: "Pro", price: "Not configured", note: "No price or payment is currently configured", description: "For regular use across your work and learning.", features: ["Expanded AI usage (planned)", "Advanced study workflow (planned)", "Enhanced insights (planned)"] },
  { name: "Business", price: "Contact us", note: "No checkout or team billing is configured", description: "For teams that need a shared workspace.", features: ["Team administration (planned)", "Shared projects (planned)", "Priority support (planned)"] },
];

export default function PricingPage() {
  const [showNotice, setShowNotice] = useState(false);
  return (
    <main className="route-page"><section className="page-shell">
      <PageIntro eyebrow="Simple, honest plans" title={<>Start with what’s useful.<br /><span>Grow when you’re ready.</span></>} description="Sample plan descriptions only. No subscriptions, payment processing, or paid feature gating are configured." />
      {showNotice && <div className="payment-notice"><Notice>Payments are not configured. No charge has been made or plan changed.</Notice><button aria-label="Dismiss" onClick={() => setShowNotice(false)} type="button"><X size={17} /></button></div>}
      <div className="pricing-grid route-pricing">
        {plans.map((plan) => <article className={`price-card${plan.name === "Pro" ? " price-card-featured" : ""}`} key={plan.name}>
          {plan.name === "Pro" && <span className="popular-pill">SAMPLE PLAN</span>}
          <p className="plan-name">{plan.name}</p><p className="plan-price">{plan.price}</p><p className="plan-note">{plan.note}</p>
          <p className="plan-description">{plan.description}</p>
          <button className={plan.name === "Free" ? "button button-outline plan-button" : "button button-primary plan-button"} onClick={() => plan.name === "Free" ? window.location.assign("/signup") : plan.name === "Business" ? window.location.assign("/contact") : setShowNotice(true)} type="button">
            {plan.name === "Free" ? "Create a free account" : plan.name === "Business" ? "Contact us" : "Payment not configured"}
          </button>
          <div className="plan-divider" /><p className="included-label">PLAN DETAILS</p>
          <ul>{plan.features.map((feature) => <li key={feature}><Check size={15} aria-hidden="true" />{feature}</li>)}</ul>
        </article>)}
      </div>
      <p className="pricing-footnote">No actual price, subscription, or payment is implied. <Link href="/contact">Questions? Contact us.</Link></p>
    </section></main>
  );
}
