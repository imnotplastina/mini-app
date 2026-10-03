import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock3 } from "lucide-react";
import { getCatalog } from "@/lib/repository";
import { ContentImage } from "@/components/content-view";
import { LessonRow } from "@/components/catalog";
export const dynamic = "force-dynamic";
export default async function SectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catalog = await getCatalog();
  const section = catalog.sections.find((s) => s.id === id);
  if (!section) notFound();
  const lessons = catalog.lessons.filter((l) => l.sectionId === id);
  return (
    <>
      <Link className="back-link" href="/sections">
        <ArrowLeft size={17} />
        Все разделы
      </Link>
      <section className={`section-banner ${section.color}`}>
        <div>
          <span className="eyebrow">УЧЕБНЫЙ РАЗДЕЛ</span>
          <h1>{section.title}</h1>
          <p>{section.description}</p>
          <span className="lesson-meta">
            <BookOpen size={15} />
            {lessons.length} материалов<span>·</span>
            <Clock3 size={15} />
            {lessons.reduce((n, l) => n + l.minutes, 0)} мин
          </span>
        </div>
        {section.cover && <ContentImage src={section.cover} alt="" />}
      </section>
      <div className="section-heading">
        <h2>В этом разделе</h2>
        <span className="muted">Шаг за шагом</span>
      </div>
      <div className="lesson-list">
        {lessons.map((lesson, index) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            index={index}
            section={section}
          />
        ))}
      </div>
      {!lessons.length && (
        <div className="empty-state">
          <BookOpen />
          <h2>Материалы скоро появятся</h2>
          <p>Загляните сюда чуть позже.</p>
        </div>
      )}
    </>
  );
}
