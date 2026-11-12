import { WorkspaceLink as Link } from "../components/common/WorkspaceLink";
import {
  ArrowRight,
  ArrowUpRight,
  Files,
  MessageSquare,
  AlignLeft,
  ListChecks,
  Plus,
  FileText,
  Activity,
  Sparkles,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useResource } from "../hooks/useResource";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeading,
  SectionTitle,
  Skeleton,
} from "../components/common/UI";
import { date, size } from "../services/api";

export default function Dashboard() {
  const stats = useResource("/dashboard/stats"),
    docs = useResource("/documents"),
    activity = useResource("/dashboard/activity"),
    results = useResource("/quizzes/results");
  const cards = [
    ["documents", "Uploaded PDFs", Files],
    ["conversations", "AI conversations", MessageSquare],
    ["summaries", "Study summaries", AlignLeft],
    ["quizzes_completed", "Quizzes completed", ListChecks],
  ];
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE PROGRESS, EVERY DAY"
        title="Welcome to your study space."
        description="Make sense of your notes. Make the most of your potential."
        action={
          <Link to="/?tool=documents" className="btn btn-primary">
            <Plus size={17} />
            Upload PDF
          </Link>
        }
      />
      <Card className="welcome-banner">
        <div>
          <Badge>
            <Sparkles size={12} />
            YOUR NEXT BREAKTHROUGH
          </Badge>
          <h2>
            One good question can
            <br />
            change everything.
          </h2>
          <p>Bring your lecture notes. Let curiosity lead the way.</p>
          <Link className="text-link" to="/?tool=chat">
            Ask your study assistant
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-ring ring-one" />
          <div className="art-ring ring-two" />
          <BookArt />
        </div>
      </Card>
      {stats.error ? (
        <ErrorState message={stats.error} retry={stats.refresh} />
      ) : stats.loading ? (
        <Skeleton />
      ) : (
        <div className="stats-grid">
          {cards.map(([key, label, Icon], index) => (
            <Card className="stat-card" key={key} delay={index * 0.06}>
              <div>
                <span className="stat-icon">
                  <Icon size={18} />
                </span>
                <span className="mono">ALL TIME</span>
              </div>
              <strong>{stats.data[key]}</strong>
              <p>{label}</p>
            </Card>
          ))}
        </div>
      )}
      <div className="dashboard-columns">
        <div>
          <SectionTitle title="Recent documents" to="/?tool=documents" />
          <Card className="list-card">
            {docs.error ? (
              <ErrorState message={docs.error} retry={docs.refresh} />
            ) : docs.loading ? (
              <Skeleton />
            ) : !docs.data.length ? (
              <EmptyState
                icon={Files}
                title="Your knowledge starts here"
                description="Upload your first lecture PDF to unlock conversations, summaries, and quizzes."
                action={
                  <Link className="text-link" to="/?tool=documents">
                    Add your first document
                    <ArrowRight size={14} />
                  </Link>
                }
              />
            ) : (
              docs.data.slice(0, 4).map((d) => (
                <Link className="document-row" key={d.id} to="/?tool=documents">
                  <span className="pdf-icon">
                    <FileText size={21} />
                  </span>
                  <div>
                    <strong>{d.title}</strong>
                    <small>
                      {d.page_count} pages · {size(d.size)} ·{" "}
                      {date(d.created_at)}
                    </small>
                  </div>
                  <Badge tone={d.status}>{d.status}</Badge>
                  <ArrowUpRight size={15} />
                </Link>
              ))
            )}
          </Card>
          <SectionTitle title="Your learning curve" />
          <Card className="chart-card">
            <div className="chart-heading">
              <div>
                <p>Average quiz score</p>
                <strong>
                  {stats.data?.quizzes_completed
                    ? `${stats.data.average_score}%`
                    : "—"}
                </strong>
              </div>
              <Badge>
                <Target size={13} />
                Practice makes progress
              </Badge>
            </div>
            {results.error ? (
              <ErrorState message={results.error} retry={results.refresh} />
            ) : results.loading ? (
              <Skeleton />
            ) : !results.data.length ? (
              <EmptyState
                icon={Activity}
                title="Every attempt is a step forward"
                description="Complete a quiz to start seeing your learning progress here."
              />
            ) : (
              <div className="chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={results.data
                      .slice(0, 20)
                      .reverse()
                      .map((r, i) => ({ ...r, attempt: i + 1 }))}
                  >
                    <defs>
                      <linearGradient id="score" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--color-neon-blue)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--color-neon-blue)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="var(--border-neutral)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="attempt"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--color-white)", fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--color-white)", fontSize: 11 }}
                      unit="%"
                      width={42}
                    />
                    <Tooltip
                      cursor={{
                        stroke: "var(--color-neon-blue)",
                        strokeDasharray: "3 3",
                      }}
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-neutral)",
                        color: "var(--color-white)",
                        borderRadius: 10,
                      }}
                      formatter={(v) => [`${v}%`, "Score"]}
                      labelFormatter={(v) => `Attempt ${v}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke="var(--color-neon-blue)"
                      activeDot={{
                        r: 5,
                        fill: "var(--color-neon-blue)",
                        stroke: "var(--color-white)",
                      }}
                      strokeWidth={2}
                      fill="url(#score)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
        <div>
          <SectionTitle title="A good place to start" />
          <div className="quick-actions">
            {[
              [
                MessageSquare,
                "Talk to your notes",
                "Find clarity, one question at a time.",
                "chat",
              ],
              [
                AlignLeft,
                "See the bigger picture",
                "Turn dense chapters into clear notes.",
                "summaries",
              ],
              [
                ListChecks,
                "Check your understanding",
                "A little practice goes a long way.",
                "quizzes",
              ],
            ].map(([Icon, title, text, to]) => (
              <Link className="card quick-action" to={`/?tool=${to}`} key={to}>
                <span className="feature-icon">
                  <Icon size={19} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
          <SectionTitle title="Recent activity" to="/?tool=history" />
          <Card className="activity-card">
            {activity.error ? (
              <ErrorState message={activity.error} retry={activity.refresh} />
            ) : activity.loading ? (
              <Skeleton />
            ) : !activity.data.length ? (
              <EmptyState
                icon={Activity}
                title="A fresh beginning"
                description="Your learning moments will appear here."
              />
            ) : (
              activity.data.slice(0, 5).map((a) => (
                <div className="activity-row" key={`${a.type}-${a.id}`}>
                  <span className="activity-dot" />
                  <div>
                    <strong>{a.title}</strong>
                    <small>
                      {a.type === "attempt"
                        ? `Quiz completed · ${a.percentage}%`
                        : a.type}{" "}
                      · {date(a.created_at)}
                    </small>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
function BookArt() {
  return (
    <div className="book-art">
      <Files size={65} strokeWidth={0.8} />
      <span className="sparkle-one">✦</span>
      <span className="sparkle-two">✧</span>
    </div>
  );
}
