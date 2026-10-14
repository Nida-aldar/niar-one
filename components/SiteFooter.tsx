import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="brand" href="/" aria-label="NIAR One home">
            <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
            <span className="brand-wordmark">NIAR<span>One</span></span>
          </Link>
          <p>One Platform. Endless Possibilities.<br />A little more room for what matters.</p>
          <Link className="footer-email" href="/contact">Get in touch</Link>
        </div>
        <div className="footer-links">
          <div><h3>Explore</h3><Link href="/ai">AI Tools</Link><Link href="/study">Study Zone</Link><Link href="/data-lab">Data Lab</Link><Link href="/tools">Utilities</Link></div>
          <div><h3>NIAR One</h3><Link href="/about">About us</Link><Link href="/contact">Contact</Link><Link href="/pricing">Pricing</Link></div>
          <div><h3>Your account</h3><Link href="/login">Log in</Link><Link href="/signup">Sign up</Link><Link href="/dashboard">Dashboard</Link></div>
        </div>
      </div>
      <div className="footer-bottom"><span>© 2026 NIAR One. Made for what’s next.</span><span>Thoughtful tools. One clear space.</span></div>
    </footer>
  );
}
