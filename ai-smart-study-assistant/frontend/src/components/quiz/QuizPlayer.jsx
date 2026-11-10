import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { Button, Card, Modal } from "../common/UI";

export default function QuizPlayer({
  quiz,
  onSubmit,
  pending,
  result,
  onReset,
}) {
  const [answers, setAnswers] = useState({}),
    [position, setPosition] = useState(0),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    setAnswers({});
    setPosition(0);
  }, [quiz?.id]);
  if (result) return <QuizReview result={result} onReset={onReset} />;
  const question = quiz.questions[position],
    answered = Object.keys(answers).length;
  const submit = () => {
    setConfirm(false);
    onSubmit(
      Object.fromEntries(
        quiz.questions.map((q) => [q.id, answers[q.id] ?? null]),
      ),
    );
  };
  return (
    <Card className="quiz-player">
      <div className="quiz-player-heading">
        <div>
          <span className="eyebrow">PUT YOUR KNOWLEDGE TO WORK</span>
          <h2>{quiz.title}</h2>
        </div>
        <span className="mono">
          {answered}/{quiz.questions.length} ANSWERED
        </span>
      </div>
      <div className="quiz-progress">
        <span
          style={{ width: `${(answered / quiz.questions.length) * 100}%` }}
        />
      </div>
      <nav className="question-numbers" aria-label="Quiz questions">
        {quiz.questions.map((q, i) => (
          <button
            key={q.id}
            disabled={pending}
            aria-label={`Question ${i + 1}${answers[q.id] !== undefined ? ", answered" : ""}`}
            aria-current={position === i ? "step" : undefined}
            className={`${position === i ? "current" : ""} ${answers[q.id] !== undefined ? "answered" : ""}`}
            onClick={() => setPosition(i)}
          >
            {i + 1}
          </button>
        ))}
      </nav>
      <div className="quiz-question">
        <span className="mono blue">
          QUESTION {String(position + 1).padStart(2, "0")}
        </span>
        <h3>{question.question}</h3>
        <fieldset className="quiz-options" disabled={pending}>
          <legend className="sr-only">Choose one answer</legend>
          {question.options.map((option, i) => (
            <label
              className={answers[question.id] === i ? "chosen" : ""}
              key={i}
            >
              <input
                type="radio"
                name={question.id}
                checked={answers[question.id] === i}
                onChange={() => setAnswers((a) => ({ ...a, [question.id]: i }))}
              />
              <span className="option-letter">{"ABCD"[i]}</span>
              <span>{option}</span>
              {answers[question.id] === i && <Check size={17} />}
            </label>
          ))}
        </fieldset>
      </div>
      <div className="quiz-navigation">
        <Button
          variant="secondary"
          disabled={position === 0 || pending}
          onClick={() => setPosition((i) => i - 1)}
        >
          <ArrowLeft size={15} />
          Previous
        </Button>
        <span>
          {position + 1} of {quiz.questions.length}
        </span>
        {position < quiz.questions.length - 1 ? (
          <Button onClick={() => setPosition((i) => i + 1)} disabled={pending}>
            Next question
            <ArrowRight size={15} />
          </Button>
        ) : (
          <Button onClick={() => setConfirm(true)} loading={pending}>
            <Send size={15} />
            Submit quiz
          </Button>
        )}
      </div>
      <Modal
        open={confirm}
        title="Ready to check your understanding?"
        onClose={() => setConfirm(false)}
      >
        <p className="muted">
          {answered === quiz.questions.length
            ? "You’ve answered every question."
            : `${quiz.questions.length - answered} question(s) are unanswered and will count as incorrect.`}{" "}
          Submit to see your score, correct answers, and explanations.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Keep practicing
          </Button>
          <Button onClick={submit}>Submit answers</Button>
        </div>
      </Modal>
    </Card>
  );
}
export function QuizReview({ result, onReset }) {
  return (
    <div className="quiz-review">
      <Card className="result-hero">
        <span className="result-icon">
          <CheckCircle2 size={28} />
        </span>
        <span className="eyebrow">ANOTHER STEP FORWARD</span>
        <h2>
          {result.percentage >= 80
            ? "Your hard work is showing."
            : result.percentage >= 50
              ? "You’re making connections."
              : "Every attempt is a chance to learn."}
        </h2>
        <p>{result.title}</p>
        <div className="result-score">
          <strong>
            {result.percentage}
            <span>%</span>
          </strong>
          <span>
            {result.score} of {result.total} correct
          </span>
        </div>
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw size={15} />
          Back to quiz workspace
        </Button>
      </Card>
      <div className="section-title">
        <h2>Let’s learn from your answers</h2>
        <span className="muted small-text">Saved to your learning history</span>
      </div>
      {result.questions.map((q, i) => (
        <Card className="review-question" key={q.id}>
          <div className="review-label">
            {q.correct ? (
              <CheckCircle2 size={17} className="success-text" />
            ) : (
              <X size={17} className="error-text" />
            )}
            <span className="mono">
              QUESTION {i + 1} · {q.correct ? "CORRECT" : "REVIEW"}
            </span>
            {q.source_page && <span className="muted">p. {q.source_page}</span>}
          </div>
          <h3>{q.question}</h3>
          <div className="review-options">
            {q.options.map((option, n) => (
              <div
                className={`${n === q.correct_answer ? "correct" : ""} ${n === q.selected_answer && n !== q.correct_answer ? "incorrect" : ""}`}
                key={n}
              >
                <span>{"ABCD"[n]}.</span>
                <span>{option}</span>
                {n === q.correct_answer ? (
                  <Check size={16} />
                ) : n === q.selected_answer ? (
                  <X size={16} />
                ) : null}
              </div>
            ))}
          </div>
          {q.selected_answer === null && (
            <p className="error-text small-text">You skipped this question.</p>
          )}
          <div className="explanation">
            <strong>Why this answer?</strong>
            <p>{q.explanation}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
