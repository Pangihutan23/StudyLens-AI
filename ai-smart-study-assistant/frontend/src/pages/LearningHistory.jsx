import { useState } from "react";
import { WorkspaceLink as Link } from "../components/common/WorkspaceLink";
import {
  AlignLeft,
  ArrowUpRight,
  FileText,
  History,
  ListChecks,
  MessageSquare,
} from "lucide-react";
import { useResource } from "../hooks/useResource";
import { date } from "../services/api";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  PageHeading,
  SectionTitle,
} from "../components/common/UI";

const icons = {
  document: FileText,
  chat: MessageSquare,
  summary: AlignLeft,
  quiz: ListChecks,
  attempt: ListChecks,
};
const target = (a) =>
  a.type === "document"
    ? "/?tool=documents"
    : a.type === "chat"
      ? `/?tool=chat&session=${a.id}`
      : a.type === "summary"
        ? `/?tool=summaries&summary=${a.id}`
        : a.type === "quiz"
          ? `/?tool=quizzes&quiz=${a.id}`
          : `/?tool=quizzes&attempt=${a.id}`;
export default function LearningHistory() {
  const activity = useResource("/dashboard/activity"),
    results = useResource("/quizzes/results");
  const [filter, setFilter] = useState("all");
  const items = (activity.data || []).filter(
    (a) =>
      filter === "all" ||
      (filter === "quiz"
        ? ["quiz", "attempt"].includes(a.type)
        : a.type === filter),
  );
  return (
    <>
      <PageHeading
        eyebrow="EVERY SMALL STEP COUNTS"
        title="Your learning story"
        description="Pick up where you left off, and see how far you’ve come."
      />
      <div className="filter-tabs" role="group" aria-label="Filter activity">
        {[
          ["all", "All activity"],
          ["document", "Documents"],
          ["chat", "Conversations"],
          ["summary", "Summaries"],
          ["quiz", "Quizzes"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={filter === key}
            className={filter === key ? "active" : ""}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {activity.error ? (
        <ErrorState message={activity.error} retry={activity.refresh} />
      ) : activity.loading ? (
        <LoadingSpinner />
      ) : (
        <Card className="history-list">
          {!items.length ? (
            <EmptyState
              icon={History}
              title="The story is just beginning"
              description="Your uploads, conversations, summaries, and quiz attempts will appear here as you learn."
            />
          ) : (
            items.map((a) => {
              const Icon = icons[a.type];
              return (
                <Link
                  to={target(a)}
                  className="history-row"
                  key={`${a.type}-${a.id}`}
                >
                  <span className="feature-icon">
                    <Icon size={20} />
                  </span>
                  <div>
                    <Badge>
                      {a.type === "attempt" ? "Quiz result" : a.type}
                    </Badge>
                    <h3>{a.title}</h3>
                    <p>{date(a.created_at)}</p>
                  </div>
                  {a.percentage !== null && a.percentage !== undefined && (
                    <strong className="history-score">{a.percentage}%</strong>
                  )}
                  <ArrowUpRight size={17} />
                </Link>
              );
            })
          )}
        </Card>
      )}
      <SectionTitle title="Quiz attempts" />
      {results.error ? (
        <ErrorState message={results.error} retry={results.refresh} />
      ) : results.loading ? (
        <LoadingSpinner />
      ) : !results.data.length ? (
        <p className="muted small-text">
          Complete your first quiz to start a record of your progress.
        </p>
      ) : (
        <Card className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Practice session</th>
                <th>Date</th>
                <th>Correct answers</th>
                <th>Score</th>
                <th>
                  <span className="sr-only">Review</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {results.data.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{date(r.created_at)}</td>
                  <td>
                    {r.score} / {r.total}
                  </td>
                  <td>
                    <Badge tone={r.percentage >= 70 ? "ready" : ""}>
                      {r.percentage}%
                    </Badge>
                  </td>
                  <td>
                    <Link
                      className="text-link"
                      to={`/?tool=quizzes&attempt=${r.id}`}
                    >
                      Review
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
