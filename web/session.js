// Sesión de práctica de una lección: cola de ejercicios, corrección y progreso. Sin DOM: se prueba en Node.
import { checkActivity, correctAnswer } from "../src/activities.js";
import {
  currentLesson,
  isLessonCleared,
  isUnitCleared,
  lessonActivities,
  nextReviews,
  record,
  roleplayAvailable,
} from "../src/game.js";

export const MAX_ROUNDS = 4; // tandas de práctica por lección antes de cortar
export const REVIEW_LIMIT = 4; // repasos que se suman al empezar

export class Session {
  constructor({ state, curriculum, day, rng = Math.random, lesson = currentLesson(state, curriculum), reviewLimit = REVIEW_LIMIT }) {
    this.state = state;
    this.curriculum = curriculum;
    this.day = day;
    this.rng = rng;
    this.lesson = lesson;
    this.startXp = state.xp;
    this.answered = 0;
    this.correct = 0;
    this.rounds = lesson ? 1 : 0;
    this.last = null;
    const reviews = nextReviews(state, curriculum, day, rng, reviewLimit).map((activity) => ({ activity, context: "review" }));
    const practice = lesson ? lessonActivities(state, curriculum, lesson, rng, { extras: true }).map((activity) => ({ activity, context: "learn" })) : [];
    this.queue = [...reviews, ...practice];
  }

  get current() {
    return this.queue[0]?.activity ?? null;
  }

  get finished() {
    return this.queue.length === 0;
  }

  // 0..1. Al sumarse una nueva tanda puede bajar un poco: refleja lo que falta.
  get progress() {
    const total = this.answered + this.queue.length;
    return total ? this.answered / total : 1;
  }

  // Corrige la respuesta y actualiza el progreso guardable (this.state).
  submit(response) {
    const { activity, context } = this.queue[0];
    const ok = checkActivity(activity, response);
    this.state = record(this.state, activity, ok, context, this.day);
    this.answered += 1;
    if (ok) this.correct += 1;
    this.last = { ok, activity, response, xp: ok ? activity.xp : 0, answer: correctAnswer(activity) };
    return this.last;
  }

  // Pasa al siguiente ejercicio; si se acabó la tanda y la lección no está superada, arma otra con lo que falta.
  next() {
    this.queue.shift();
    if (this.queue.length === 0) this.refill();
    return this.current;
  }

  refill() {
    if (!this.lesson || isLessonCleared(this.state, this.lesson) || this.rounds >= MAX_ROUNDS) return;
    this.rounds += 1;
    this.queue = lessonActivities(this.state, this.curriculum, this.lesson, this.rng, { extras: false }).map((activity) => ({ activity, context: "learn" }));
  }

  summary() {
    const unit = this.lesson ? this.curriculum.unitOf(this.lesson.unitId) : null;
    return {
      xp: this.state.xp - this.startXp,
      answered: this.answered,
      correct: this.correct,
      accuracy: this.answered ? Math.round((this.correct / this.answered) * 100) : 0,
      lesson: this.lesson,
      unit,
      cleared: this.lesson ? isLessonCleared(this.state, this.lesson) : false,
      unitCleared: unit ? isUnitCleared(this.state, unit) : false,
      roleplay: unit ? roleplayAvailable(this.state, unit) : false,
      streak: this.state.streak.days,
    };
  }
}
