import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock3, Play } from "lucide-react";
import { getCatalog } from "@/lib/repository";
import { Markdown, VideoPlayer } from "@/components/content-view";
export const dynamic = "force-dynamic";
export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catalog = await getCatalog();
  const lesson = catalog.lessons.find((l) => l.id === id);
  if (!lesson) notFound();
  const section = catalog.sections.find((s) => s.id === lesson.sectionId)!;
  const siblings = catalog.lessons.filter((l) => l.sectionId === section.id);
  const index = siblings.findIndex((l) => l.id === id);
  const previous = siblings[index - 1];
  const next = siblings[index + 1];
  return (
    <article className="reader">
      <Link href={`/sections/${section.id}`} className="back-link">
        <ArrowLeft size={17} />
        {section.title}
      </Link>
      <div className="reader-header">
        <span className="eyebrow">
          УРОК {index + 1} ИЗ {siblings.length}
        </span>
        <h1>{lesson.title}</h1>
        <p>{lesson.description}</p>
        <span className="lesson-meta">
          {lesson.type === "video" ? (
            <Play size={16} />
          ) : (
            <BookOpen size={16} />
          )}
          {lesson.type === "video" ? "Видео" : "Статья"}
          <span>·</span>
          <Clock3 size={16} />
          {lesson.minutes} мин
        </span>
      </div>
      {lesson.type === "video" && (
        <VideoPlayer src={lesson.videoUrl} poster={lesson.cover} />
      )}
      <Markdown body={lesson.body} />
      <div className="lesson-navigation">
        {previous ? (
          <Link href={`/lessons/${previous.id}`} className="previous-lesson">
            <ArrowLeft size={19} />
            <span>
              <small>Предыдущий урок</small>
              {previous.title}
            </span>
          </Link>
        ) : (
          <Link href={`/sections/${section.id}`} className="previous-lesson">
            <ArrowLeft size={19} />К разделу
          </Link>
        )}
        {next ? (
          <Link href={`/lessons/${next.id}`} className="next-lesson">
            <span>
              <small>Следующий урок</small>
              {next.title}
            </span>
            <ArrowRight size={19} />
          </Link>
        ) : (
          <Link href="/sections" className="next-lesson">
            <span>
              <small>Вы изучили раздел</small>Выбрать новый
            </span>
            <ArrowRight size={19} />
          </Link>
        )}
      </div>
    </article>
  );
}
