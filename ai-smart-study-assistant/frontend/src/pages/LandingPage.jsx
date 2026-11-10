import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  MessageSquare,
  AlignLeft,
  ListChecks,
  Upload,
  ScanText,
  BookOpen,
  Sparkles,
  Menu,
  X,
  Check,
  ShieldCheck,
  CornerDownRight,
} from "lucide-react";
import { Logo } from "../components/layout/Layout";
import Reveal from "../components/common/Reveal";
import {
  landingSections,
  useActiveLandingSection,
} from "../hooks/useActiveLandingSection";

const features = [
  {
    icon: FileText,
    title: "Smart PDF Reader",
    tag: "01 / YOUR MATERIALS",
    text: "Give your lecture notes a second life. Upload PDFs and turn pages of information into a searchable knowledge base.",
    to: "documents",
  },
  {
    icon: MessageSquare,
    title: "AI Study Chat",
    tag: "02 / YOUR QUESTIONS",
    text: "Ask the question you didn’t get to ask in class. Get clear answers grounded in your notes, with page references.",
    to: "chat",
  },
  {
    icon: AlignLeft,
    title: "Intelligent Summaries",
    tag: "03 / YOUR CLARITY",
    text: "Find the thread in complex ideas. Create concise overviews, key takeaways, or detailed notes in your language.",
    to: "summaries",
  },
  {
    icon: ListChecks,
    title: "Practice Quiz Generator",
    tag: "04 / YOUR PROGRESS",
    text: "Move from “I’ve read it” to “I understand it.” Test your knowledge with tailored questions and useful explanations.",
    to: "quizzes",
  },
];
export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [activeSection, setActiveSection] = useActiveLandingSection();
  const menuButton = useRef(null);
  return (
    <div className="landing" id="home">
      <a className="skip-link" href="#hero">
        Skip to content
      </a>
      <header
        className="landing-nav"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menu) {
            setMenu(false);
            menuButton.current?.focus();
          }
        }}
      >
        <Logo />
        <button
          ref={menuButton}
          className="icon-btn mobile-only"
          aria-label="Toggle navigation"
          aria-expanded={menu}
          aria-controls="landing-navigation"
          onClick={() => setMenu((v) => !v)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav
          id="landing-navigation"
          className={menu ? "open" : ""}
          aria-label="Website navigation"
        >
          {landingSections.map(({ id, label }) => (
            <a
              key={id}
              className="nav-pill"
              href={`#${id}`}
              aria-current={activeSection === id ? "location" : undefined}
              onClick={() => {
                setActiveSection(id);
                setMenu(false);
              }}
            >
              {label}
            </a>
          ))}
          <Link className="btn btn-secondary nav-launch" to="/app">
            Launch App
            <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="hero" id="hero">
          <div className="hero-grid" aria-hidden="true" />
          <Reveal className="hero-content">
            <span className="hero-badge">
              <span />
              AI-POWERED LEARNING PLATFORM
              <Sparkles size={12} />
            </span>
            <h1>
              Study smarter,
              <br />
              understand <em>deeper.</em>
            </h1>
            <p>
              Transform your lecture materials into intelligent conversations,
              <br className="desktop-break" /> clear summaries, and personalized
              practice questions — all powered by AI.
            </p>
            <div className="hero-actions">
              <Link to="/app" className="btn btn-primary">
                Start Learning
                <ArrowRight size={17} />
              </Link>
              <a href="#features" className="btn btn-secondary">
                Explore Features
                <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="hero-footnote">
              <ShieldCheck size={14} />
              <span>Your materials. Your pace. Your potential.</span>
            </div>
          </Reveal>
          <Reveal className="learning-strip" delay={0.12}>
            <span className="mono">
              BUILT FOR YOUR
              <br />
              NEXT BREAKTHROUGH
            </span>
            <div>
              <FileText size={19} />
              <span>Your lecture PDFs</span>
            </div>
            <span className="strip-line" />
            <div>
              <Sparkles size={20} />
              <span>A little intelligence</span>
            </div>
            <span className="strip-line" />
            <div>
              <BookOpen size={20} />
              <span>A deeper understanding</span>
            </div>
            <span className="strip-star" aria-hidden="true">
              ✳
            </span>
          </Reveal>
        </section>
        <section className="features-section section-wrap" id="features">
          <Reveal className="landing-section-heading">
            <div>
              <div className="eyebrow">
                <span className="tiny-line" />
                DESIGNED FOR THE WAY YOU LEARN
              </div>
              <h2>
                Big ideas.
                <br />
                <span className="muted-serif">A little less friction.</span>
              </h2>
            </div>
            <p>
              Everything you need to go from a folder full of notes
              <br className="desktop-break" /> to knowledge that actually stays
              with you.
            </p>
          </Reveal>
          <div className="features-grid">
            {features.map(({ icon: Icon, ...f }, index) => (
              <Reveal
                as="link"
                className="feature-card"
                to={`/app/${f.to}`}
                key={f.title}
                delay={index * 0.07}
              >
                <div className="feature-top">
                  <span className="feature-icon">
                    <Icon size={24} strokeWidth={1.4} />
                  </span>
                  <ArrowUpRight size={18} />
                </div>
                <div className="mono feature-tag">{f.tag}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <span className="feature-cta">
                  Explore tool
                  <ArrowRight size={14} />
                </span>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="workflow-section section-wrap" id="how-it-works">
          <Reveal className="landing-section-heading">
            <div>
              <div className="eyebrow">
                <span className="tiny-line" />A SIMPLER STUDY ROUTINE
              </div>
              <h2>
                From upload
                <br />
                to <em>“I get it.”</em>
              </h2>
            </div>
            <p>
              No complicated setup. No new way of thinking.
              <br />
              Just your materials, working harder for you.
            </p>
          </Reveal>
          <div className="steps">
            {[
              [
                Upload,
                "Bring your materials",
                "Upload a lecture PDF with selectable text.",
              ],
              [
                ScanText,
                "Let AI connect the dots",
                "Your notes become a searchable study resource.",
              ],
              [
                MessageSquare,
                "Make it make sense",
                "Ask questions and shape your own study notes.",
              ],
              [
                ListChecks,
                "Put understanding to work",
                "Practice, review explanations, and see your progress.",
              ],
            ].map(([Icon, title, text], i) => (
              <Reveal className="step" key={title} delay={i * 0.07}>
                <div className="step-number">
                  0{i + 1}
                  <Icon size={18} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </section>
        <Reveal as="section" className="about-section section-wrap" id="about">
          <div className="about-mark">
            <BookOpen size={44} strokeWidth={1} />
            <span className="orbital" />
          </div>
          <div>
            <div className="eyebrow">A THOUGHTFUL STUDY COMPANION</div>
            <h2>
              More curiosity.
              <br />
              Less cognitive overload.
            </h2>
            <p>
              Built for university life: the dense readings, the late-night
              questions, the moment an idea finally clicks. AI Smart Study keeps
              your own learning materials at the center of every conversation.
            </p>
            <div className="about-points">
              <span>
                <Check size={15} />
                Answers with sources
              </span>
              <span>
                <Check size={15} />
                Multiple languages
              </span>
              <span>
                <Check size={15} />
                Progress that persists
              </span>
            </div>
          </div>
        </Reveal>
        <Reveal as="section" className="closing-cta section-wrap">
          <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
          <h2>
            Make room for
            <br />
            <em>understanding.</em>
          </h2>
          <Link to="/app/documents" className="btn btn-primary">
            Upload your first PDF
            <ArrowRight size={17} />
          </Link>
          <span className="closing-decoration" aria-hidden="true">
            <CornerDownRight size={90} strokeWidth={0.6} />
          </span>
        </Reveal>
      </main>
      <Reveal as="footer" className="landing-footer">
        <div>
          <Logo />
          <p>A clearer way to learn.</p>
        </div>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>
          <Link to="/app">
            Workspace
            <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AI Smart Study Assistant</span>
          <span className="mono">
            MADE FOR CURIOUS MINDS <span className="blue">✦</span>
          </span>
        </div>
      </Reveal>
    </div>
  );
}
