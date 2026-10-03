"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock3,
  Play,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { Catalog, Lesson, Section } from "@/lib/content";
import { ContentImage } from "./content-view";

export function LessonRow({
  lesson,
  section,
  index,
}: {
  lesson: Lesson;
  section?: Section;
  index?: number;
}) {
  return (
    <Link className="lesson-row" href={`/lessons/${lesson.id}`}>
      <span className={`lesson-thumb ${section?.color || "sage"}`}>
        {index !== undefined ? (
          <span className="lesson-number">
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : lesson.type === "video" ? (
          <Play size={24} />
        ) : (
          <BookOpen size={24} />
        )}
      </span>
      <span className="lesson-info">
        <span className="eyebrow">{section?.title}</span>
        <strong>{lesson.title}</strong>
        <span className="lesson-meta">
          {lesson.type === "video" ? (
            <Play size={13} />
          ) : (
            <BookOpen size={13} />
          )}
          {lesson.type === "video" ? "Видео" : "Статья"}
          <span className="separator">·</span>
          <Clock3 size={13} />
          {lesson.minutes} мин
        </span>
      </span>
      <ArrowUpRight className="row-arrow" size={20} />
    </Link>
  );
}
export function SectionCard({
  section,
  count,
  index,
}: {
  section: Section;
  count: number;
  index: number;
}) {
  return (
    <Link
      href={`/sections/${section.id}`}
      className={`section-card ${section.color}`}
    >
      <div className="section-art">
        <span className="section-index">
          РАЗДЕЛ {String(index + 1).padStart(2, "0")}
        </span>
        <ContentImage
          src={
            section.cover ||
            `/images/${section.color === "peach" ? "practice" : section.color === "lavender" ? "rhythm" : "start"}.svg`
          }
          alt=""
        />
        <span className="round-arrow">
          <ArrowUpRight size={21} />
        </span>
      </div>
      <div className="section-card-body">
        <h3>{section.title}</h3>
        <p>{section.description}</p>
        <span className="card-count">
          <BookOpen size={14} />
          {count}{" "}
          {count === 1 ? "урок" : count > 1 && count < 5 ? "урока" : "уроков"}
        </span>
      </div>
    </Link>
  );
}
export function CatalogView({
  catalog,
  sectionsOnly = false,
}: {
  catalog: Catalog;
  sectionsOnly?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const lessons = useMemo(
    () =>
      catalog.lessons.filter(
        (lesson) =>
          (filter === "all" || lesson.type === filter) &&
          `${lesson.title} ${lesson.description}`
            .toLocaleLowerCase("ru")
            .includes(query.trim().toLocaleLowerCase("ru")),
      ),
    [catalog.lessons, query, filter],
  );
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">ПРОСТРАНСТВО ДЛЯ РОСТА</span>
          <h1>
            {sectionsOnly ? "Все разделы" : "Рады вас видеть"}
            {!sectionsOnly && <span className="greeting-star"> ✳</span>}
          </h1>
          <p>
            {sectionsOnly
              ? "Выберите то, что интересно именно сейчас."
              : "Новые знания ближе, чем кажется. Начнём?"}
          </p>
        </div>
        <span className="top-tag">
          <span />В своём темпе
        </span>
      </div>
      {!sectionsOnly && (
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-label">
              <Sparkles size={14} />
              УЧИТЬСЯ — ЗНАЧИТ ПРОБОВАТЬ
            </span>
            <h2>
              Маленький шаг
              <br />к большим <em>идеям.</em>
            </h2>
            <p>
              Читайте, смотрите и открывайте новое.
              <br />
              Один урок — одно полезное открытие.
            </p>
            <a href="#materials" className="button primary">
              Выбрать урок <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <img src="/images/hero.svg" alt="" />
          </div>
          <span className="hero-corner">01 / ВРЕМЯ ДЛЯ СЕБЯ</span>
        </section>
      )}
      <section className="sections-block">
        <div className="section-heading">
          <h2>{sectionsOnly ? "Направления обучения" : "С чего начнём?"}</h2>
          {!sectionsOnly && (
            <Link href="/sections">
              Все разделы <ArrowRight size={16} />
            </Link>
          )}
        </div>
        {catalog.sections.length ? (
          <div className="section-grid">
            {catalog.sections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index}
                count={
                  catalog.lessons.filter((l) => l.sectionId === section.id)
                    .length
                }
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen />
            <h3>Скоро здесь появятся разделы</h3>
            <p>Мы готовим для вас новые материалы.</p>
          </div>
        )}
      </section>
      {!sectionsOnly && (
        <section id="materials" className="materials">
          <div className="section-heading">
            <h2>
              Библиотека знаний{" "}
              <span className="count-badge">{catalog.lessons.length}</span>
            </h2>
          </div>
          <div className="library-toolbar">
            <div className="filter-tabs" role="group" aria-label="Формат урока">
              {[
                ["all", "Все материалы"],
                ["article", "Статьи"],
                ["video", "Видео"],
              ].map(([value, title]) => (
                <button
                  key={value}
                  aria-pressed={filter === value}
                  className={filter === value ? "selected" : ""}
                  onClick={() => setFilter(value)}
                >
                  {title}
                </button>
              ))}
            </div>
            <div className="search-field">
              <Search size={17} />
              <input
                aria-label="Поиск уроков"
                placeholder="Найти интересное"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Очистить поиск"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
          <div className="lesson-list">
            {lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                section={catalog.sections.find(
                  (s) => s.id === lesson.sectionId,
                )}
              />
            ))}
          </div>
          {!lessons.length && (
            <div className="empty-state">
              <Search />
              <h3>Пока ничего не нашлось</h3>
              <p>Попробуйте другое название или формат.</p>
              <button
                className="button secondary"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </section>
      )}
      {catalog.demo && (
        <p className="demo-note">
          Пример учебной библиотеки · Материалы для знакомства с приложением
        </p>
      )}
      <footer className="content-footer">
        <span>Не спешите. Главное — продолжать.</span>
        <span>
          практика<span className="brand-dot">.</span>
        </span>
      </footer>
    </>
  );
}
