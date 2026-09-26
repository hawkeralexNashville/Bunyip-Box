import Link from "next/link";

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div>
          <p className="eyebrow">Your signal, neatly stored</p>
          <h1>Keep the posts worth coming back to.</h1>
          <p className="lede">
            Bunyip Box is a private research workspace for finding the strongest
            public content and turning a busy feed into a useful library.
          </p>
          <div className="hero-actions">
            <span className="button button-primary">Private access coming soon</span>
            <Link className="button button-secondary" href="/privacy">How we handle data</Link>
          </div>
        </div>
        <div className="signal-card" aria-label="Product preview">
          <div className="card-topline"><span>Research box</span><span>01</span></div>
          <div className="signal-orbit"><span>Curate</span></div>
          <div className="signal-list">
            <p><span>Discover</span><strong>Clear signals</strong></p>
            <p><span>Compare</span><strong>Useful context</strong></p>
            <p><span>Save</span><strong>One private place</strong></p>
          </div>
        </div>
      </section>
      <section className="principles" aria-labelledby="principles-title">
        <p className="eyebrow">Built for considered research</p>
        <h2 id="principles-title">A calmer way to spot what resonates.</h2>
        <div className="principle-grid">
          <article><span>01</span><h3>Focused</h3><p>Organize the sources you care about without the noise of a live feed.</p></article>
          <article><span>02</span><h3>Evidence-led</h3><p>Compare the information available to you with context that stays visible.</p></article>
          <article><span>03</span><h3>Private</h3><p>Keep saved research and working notes inside your own workspace.</p></article>
        </div>
      </section>
    </div>
  );
}

