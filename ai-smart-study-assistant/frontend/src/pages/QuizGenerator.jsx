import { useEffect, useState } from "react";
import { useToolParams } from "../hooks/useToolParams";
import { ArrowRight, Clock3, ListChecks, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useResource } from "../hooks/useResource";
import { api, date } from "../services/api";
import DocumentSelect from "../components/documents/DocumentSelect";
import QuizPlayer from "../components/quiz/QuizPlayer";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LanguageSelect,
  LoadingSpinner,
  PageHeading,
  SectionTitle,
  Select,
} from "../components/common/UI";

export default function QuizGenerator() {
  const docs = useResource("/documents"),
    history = useResource("/quizzes");
  const { toast, language, setLanguage } = useApp();
  const [params, setParams] = useToolParams("quizzes");
  const [documentId, setDocumentId] = useState(""),
    [count, setCount] = useState(5),
    [difficulty, setDifficulty] = useState("Medium"),
    [topic, setTopic] = useState(""),
    [quiz, setQuiz] = useState(null),
    [result, setResult] = useState(null),
    [pending, setPending] = useState(false),
    [opening, setOpening] = useState(false);
  const id = params.get("id"),
    attempt = params.get("attempt");
  useEffect(() => {
    let active = true;
    if (!id && !attempt) {
      setQuiz(null);
      setResult(null);
      return;
    }
    setOpening(true);
    api
      .get(attempt ? `/quizzes/results/${attempt}` : `/quizzes/${id}`)
      .then((data) => {
        if (active) {
          if (attempt) setResult(data);
          else {
            setQuiz(data);
            setResult(null);
          }
        }
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => {
        if (active) setOpening(false);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  async function generate(e) {
    e.preventDefault();
    setPending(true);
    try {
      const q = await api.post("/quizzes/generate", {
        document_id: documentId,
        count,
        difficulty,
        language,
        topic,
      });
      setQuiz(q);
      setResult(null);
      setParams({ id: q.id });
      history.refresh();
      toast("Your practice quiz is ready.");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setPending(false);
    }
  }
  async function submit(answers) {
    setPending(true);
    try {
      const r = await api.post(`/quizzes/${quiz.id}/submit`, { answers });
      setResult(r);
      setParams({ attempt: r.id });
      toast("Quiz complete. Your progress is saved.");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="FROM FAMILIAR TO UNDERSTOOD"
        title="Practice with purpose"
        description="Turn your study materials into a challenge. See what really sticks."
        action={
          (quiz || result) && (
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setParams({})}
            >
              Quiz workspace
              <ArrowRight size={15} />
            </Button>
          )
        }
      />
      {opening ? (
        <LoadingSpinner text="Opening your quiz…" />
      ) : quiz || result ? (
        <QuizPlayer
          quiz={quiz}
          result={result}
          pending={pending}
          onSubmit={submit}
          onReset={() => setParams({})}
        />
      ) : (
        <div className="tool-columns">
          <Card className="config-card">
            <div className="config-heading">
              <span className="feature-icon">
                <ListChecks size={20} />
              </span>
              <div>
                <h2>Build your practice session</h2>
                <p>A challenge shaped around your notes.</p>
              </div>
            </div>
            {docs.error && (
              <ErrorState message={docs.error} retry={docs.refresh} />
            )}
            <form onSubmit={generate}>
              <DocumentSelect
                documents={docs.data || []}
                value={documentId}
                onChange={setDocumentId}
                disabled={pending || docs.loading}
              />
              <div className="form-row">
                <Select
                  label="Questions"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  disabled={pending}
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} questions
                    </option>
                  ))}
                </Select>
                <Select
                  label="Difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={pending}
                >
                  {["Easy", "Medium", "Hard"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <LanguageSelect
                value={language}
                onChange={setLanguage}
                disabled={pending}
              />
              <Input
                label="Topic or chapter (optional)"
                placeholder="e.g. Cellular respiration"
                maxLength={200}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={pending}
                hint="Leave blank to practice across the whole document."
              />
              <Button
                className="full-width"
                type="submit"
                loading={pending}
                disabled={!documentId || docs.loading}
              >
                <Sparkles size={16} />
                {pending
                  ? "Creating your questions…"
                  : "Generate practice quiz"}
              </Button>
              <p className="config-footnote">
                Answers stay hidden until you submit.
              </p>
            </form>
          </Card>
          <Card className="quiz-intro">
            {pending ? (
              <LoadingSpinner text="Reading your notes and crafting a thoughtful challenge. This may take a few minutes…" />
            ) : (
              <>
                <div className="quiz-intro-art">
                  <ListChecks size={49} strokeWidth={1} />
                  <span>✦</span>
                </div>
                <span className="eyebrow">MAKE KNOWLEDGE YOUR OWN</span>
                <h2>
                  Don’t just read it.
                  <br />
                  <em>Remember it.</em>
                </h2>
                <p>
                  The best way to find out what you know is to put it to work.
                  Every quiz comes with explanations to help the ideas click.
                </p>
                <div className="quiz-benefits">
                  <span>
                    <span>01</span>Questions from your own material
                  </span>
                  <span>
                    <span>02</span>Instant scoring and clear explanations
                  </span>
                  <span>
                    <span>03</span>Progress saved across study sessions
                  </span>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
      {!quiz && !result && (
        <>
          <SectionTitle title="Your practice library" />
          {history.error ? (
            <ErrorState message={history.error} retry={history.refresh} />
          ) : history.loading ? (
            <LoadingSpinner text="Loading quizzes…" />
          ) : !history.data.length ? (
            <Card>
              <EmptyState
                icon={ListChecks}
                title="Your first challenge awaits"
                description="Generate a quiz above, and it will be saved here for you to revisit."
              />
            </Card>
          ) : (
            <div className="history-cards">
              {history.data.map((q) => (
                <button
                  key={q.id}
                  className="card saved-summary"
                  disabled={pending}
                  onClick={() => setParams({ id: q.id })}
                >
                  <span className="saved-summary-icon">
                    <ListChecks size={18} />
                  </span>
                  <strong>{q.title}</strong>
                  <Badge>{q.difficulty}</Badge>
                  <small>
                    <Clock3 size={12} />
                    {date(q.created_at)}
                    <ArrowRight size={14} />
                  </small>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
