"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  FileText,
  ImagePlus,
  Plus,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
import { Markdown, VideoPlayer, ContentImage } from "@/components/content-view";
import {
  sortContent,
  type Catalog,
  type Lesson,
  type Section,
} from "@/lib/content";

type AdminCatalog = Catalog & { database: boolean; storage: boolean };
type Editing =
  | { kind: "section"; data: Section }
  | { kind: "lesson"; data: Lesson };
async function responseJson(response: Response) {
  const json = await response.json();
  if (!response.ok)
    throw new Error(json.error || "Не удалось выполнить запрос");
  return json;
}
export default function AdminPage() {
  const router = useRouter();
  const auth = useTelegram();
  const [catalog, setCatalog] = useState<AdminCatalog | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCatalog(
        await responseJson(
          await fetch("/api/admin/content", { cache: "no-store" }),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось открыть редактор");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (auth.admin) void load();
  }, [auth.admin, load]);
  if (auth.loading)
    return (
      <div className="loading-state" role="status">
        <span className="spinner" />
        <p>Проверяем доступ…</p>
      </div>
    );
  if (!auth.admin)
    return (
      <div className="empty-state">
        <ShieldCheck size={35} />
        <h1>Управление материалами</h1>
        <p>
          {auth.error ||
            "Редактор доступен администраторам после входа через Telegram."}
        </p>
        <Link href="/profile" className="button primary">
          Открыть профиль
        </Link>
      </div>
    );
  const newSection = () => {
    setMessage("");
    setEditing({
      kind: "section",
      data: {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        cover: "",
        color: "sage",
        position: catalog?.sections.length || 0,
        status: "draft",
        revision: 0,
      },
    });
  };
  const newLesson = () => {
    setMessage("");
    setEditing({
      kind: "lesson",
      data: {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        cover: "",
        sectionId: catalog?.sections[0]?.id || "",
        type: "article",
        minutes: 5,
        body: "",
        videoUrl: "",
        position: catalog?.lessons.length || 0,
        status: "draft",
        revision: 0,
      },
    });
  };
  return (
    <>
      <Link className="back-link" href="/profile">
        <ArrowLeft size={17} />
        Профиль
      </Link>
      <div className="page-intro">
        <div>
          <span className="eyebrow">ДЛЯ РЕДАКТОРА</span>
          <h1>Ваши материалы</h1>
          <p>Создавайте, дополняйте, делитесь знаниями.</p>
        </div>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button className="button secondary" onClick={load}>
            Повторить
          </button>
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      {loading && <p role="status">Загружаем материалы…</p>}
      {catalog && (
        <>
          {!catalog.database && (
            <div className="notice">
              Сейчас открыт пример библиотеки. Чтобы сохранять материалы,
              подключите SQLite и выполните инициализацию таблиц по инструкции в
              README.
            </div>
          )}
          {editing ? (
            <Editor
              key={`${editing.kind}-${editing.data.id}`}
              initial={editing}
              catalog={catalog}
              onClose={() => setEditing(null)}
              onSaved={async () => {
                setEditing(null);
                setMessage("Материал сохранён.");
                router.refresh();
                await load();
              }}
            />
          ) : (
            <>
              <div className="admin-actions">
                <button
                  className="button primary"
                  onClick={newSection}
                  disabled={!catalog.database}
                >
                  <Plus size={17} />
                  Добавить раздел
                </button>
                <button
                  className="button secondary"
                  onClick={newLesson}
                  disabled={!catalog.database || !catalog.sections.length}
                >
                  <Plus size={17} />
                  Добавить урок
                </button>
                <button className="button secondary" onClick={load}>
                  Обновить список
                </button>
              </div>
              <div className="admin-list">
                <div className="admin-list-group">
                  <h2>
                    Разделы{" "}
                    <span className="count-badge">
                      {catalog.sections.length}
                    </span>
                  </h2>
                  {sortContent(catalog.sections).map((section) => (
                    <button
                      className="admin-list-item"
                      key={section.id}
                      onClick={() => {
                        setMessage("");
                        setEditing({ kind: "section", data: section });
                      }}
                    >
                      <span>{section.title}</span>
                      <Status status={section.status} />
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                  {!catalog.sections.length && (
                    <p className="muted">Создайте первый раздел.</p>
                  )}
                </div>
                <div className="admin-list-group">
                  <h2>
                    Уроки{" "}
                    <span className="count-badge">
                      {catalog.lessons.length}
                    </span>
                  </h2>
                  {sortContent(catalog.lessons).map((lesson) => (
                    <button
                      className="admin-list-item"
                      key={lesson.id}
                      onClick={() => {
                        setMessage("");
                        setEditing({ kind: "lesson", data: lesson });
                      }}
                    >
                      <span>{lesson.title}</span>
                      <Status status={lesson.status} />
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                  {!catalog.lessons.length && (
                    <p className="muted">Добавьте статью или видеоурок.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
function Status({ status }: { status: "draft" | "published" }) {
  return (
    <span className={`status-tag ${status}`}>
      {status === "published" ? "Опубликован" : "Черновик"}
    </span>
  );
}

function Editor({
  initial,
  catalog,
  onClose,
  onSaved,
}: {
  initial: Editing;
  catalog: AdminCatalog;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<Editing>(structuredClone(initial));
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const dirty = JSON.stringify(editing) !== JSON.stringify(initial);
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  const update = (field: string, value: string | number) =>
    setEditing(
      (old) => ({ ...old, data: { ...old.data, [field]: value } }) as Editing,
    );
  const close = () => {
    if (!dirty || window.confirm("Закрыть редактор без сохранения изменений?"))
      onClose();
  };
  const insert = (text: string) => {
    if (editing.kind !== "lesson") return;
    const start = textarea.current?.selectionStart ?? editing.data.body.length;
    const end = textarea.current?.selectionEnd ?? start;
    update(
      "body",
      editing.data.body.slice(0, start) + text + editing.data.body.slice(end),
    );
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(
        start + text.length,
        start + text.length,
      );
    });
  };
  async function upload(file: File | undefined, toBody = false) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      if (file.size > 4_000_000)
        throw new Error("Максимальный размер изображения — 4 МБ.");
      const result = await responseJson(
        await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: file,
        }),
      );
      if (toBody) insert(`\n\n![Описание изображения](${result.url})\n\n`);
      else update("cover", result.url);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось загрузить изображение",
      );
    } finally {
      setUploading(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await responseJson(
        await fetch("/api/admin/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing),
        }),
      );
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }
  const data = editing.data;
  return (
    <form className="editor" onSubmit={save}>
      <div className="editor-header">
        <h2>
          {editing.kind === "section" ? "Редактор раздела" : "Редактор урока"}
        </h2>
        <button
          type="button"
          onClick={close}
          className="icon-button"
          aria-label="Закрыть редактор"
        >
          <X size={21} />
        </button>
      </div>
      <fieldset
        disabled={saving || uploading}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        <div className="form-grid">
          <label className="field full">
            Название
            <input
              required
              maxLength={160}
              value={data.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="О чём этот материал?"
            />
          </label>
          <label className="field full">
            Краткое описание
            <textarea
              maxLength={600}
              value={data.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Что узнает читатель"
            />
          </label>
          {editing.kind === "lesson" && (
            <>
              <label className="field">
                Раздел
                <select
                  value={editing.data.sectionId}
                  onChange={(e) => update("sectionId", e.target.value)}
                  required
                >
                  {catalog.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                      {s.status === "draft" ? " (черновик)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Формат
                <select
                  value={editing.data.type}
                  onChange={(e) => update("type", e.target.value)}
                >
                  <option value="article">Статья с изображениями</option>
                  <option value="video">Видеоурок</option>
                </select>
              </label>
              <label className="field">
                Время изучения, минут
                <input
                  type="number"
                  required
                  min={1}
                  max={600}
                  value={editing.data.minutes}
                  onChange={(e) => update("minutes", Number(e.target.value))}
                />
              </label>
            </>
          )}
          <label className="field">
            Порядок отображения
            <input
              type="number"
              required
              min={0}
              max={10000}
              value={data.position}
              onChange={(e) => update("position", Number(e.target.value))}
            />
            <small>Меньшее число — выше в списке</small>
          </label>
          <label className="field">
            Статус
            <select
              value={data.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="draft">Черновик</option>
              <option value="published">Опубликован</option>
            </select>
          </label>
          {editing.kind === "section" && (
            <label className="field">
              Цвет карточки
              <select
                value={editing.data.color}
                onChange={(e) => update("color", e.target.value)}
              >
                <option value="sage">Шалфей</option>
                <option value="peach">Персик</option>
                <option value="lavender">Лаванда</option>
              </select>
            </label>
          )}
          <label className="field full">
            Ссылка на обложку
            <input
              value={data.cover}
              maxLength={2048}
              onChange={(e) => update("cover", e.target.value)}
              placeholder="https://…"
            />
            <small>
              HTTPS-ссылка или загруженное изображение. Обложка необязательна.
            </small>
          </label>
          <label className="field full">
            Загрузить обложку
            <input
              className="upload-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={!catalog.storage || uploading}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <small>
              {catalog.storage
                ? "JPEG, PNG, WebP или GIF до 4 МБ"
                : "Для загрузки подключите Vercel Blob. Пока можно вставлять HTTPS-ссылки."}
            </small>
          </label>
          {editing.kind === "lesson" && editing.data.type === "video" && (
            <label className="field full">
              Ссылка на видео MP4
              <input
                value={editing.data.videoUrl}
                maxLength={2048}
                onChange={(e) => update("videoUrl", e.target.value)}
                placeholder="https://…/lesson.mp4"
                required={editing.data.status === "published"}
              />
              <small>
                Прямая ссылка на файл. Ссылки на страницы YouTube и других
                платформ не подходят.
              </small>
            </label>
          )}
        </div>
        {editing.kind === "lesson" && (
          <>
            <div className="editor-toolbar">
              <button
                type="button"
                onClick={() => insert("\n\n## Заголовок\n\n")}
              >
                Заголовок
              </button>
              <button
                type="button"
                onClick={() => insert("**Выделенный текст**")}
              >
                Жирный
              </button>
              <button
                type="button"
                onClick={() => insert("\n- Первый пункт\n- Второй пункт\n")}
              >
                Список
              </button>
              <button
                type="button"
                onClick={() => insert("[Текст ссылки](https://example.com)")}
              >
                Ссылка
              </button>
              <button
                type="button"
                onClick={() =>
                  insert(
                    "\n\n![Описание изображения](https://example.com/image.jpg)\n\n",
                  )
                }
              >
                <ImagePlus size={14} />
                Изображение
              </button>
            </div>
            <label className="field">
              {editing.data.type === "video"
                ? "Описание под видео"
                : "Текст урока"}
              <textarea
                ref={textarea}
                className="markdown-editor"
                maxLength={100000}
                value={editing.data.body}
                onChange={(e) => update("body", e.target.value)}
                placeholder="Напишите первую мысль…"
              />
              <small>
                Markdown: ## заголовок, **жирный текст**, *курсив*. HTML не
                выполняется.
              </small>
            </label>
            <label className="field" style={{ marginTop: 14 }}>
              Вставить изображение в текст
              <input
                className="upload-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={!catalog.storage || uploading}
                onChange={(e) => {
                  void upload(e.target.files?.[0], true);
                  e.target.value = "";
                }}
              />
              <small>
                После вставки замените «Описание изображения» на содержательный
                альтернативный текст.
              </small>
            </label>
          </>
        )}
        <div className="editor-toolbar">
          <button type="button" onClick={() => setPreview(!preview)}>
            {preview ? <FileText size={15} /> : <Eye size={15} />}
            {preview ? "Скрыть предпросмотр" : "Предварительный просмотр"}
          </button>
        </div>
        {preview && (
          <section className="preview-panel">
            <span className="eyebrow">ПРЕДВАРИТЕЛЬНЫЙ ПРОСМОТР</span>
            <h1>{data.title || "Название материала"}</h1>
            <p>{data.description}</p>
            {editing.kind === "lesson" ? (
              <>
                {editing.data.type === "video" && editing.data.videoUrl && (
                  <VideoPlayer
                    src={editing.data.videoUrl}
                    poster={editing.data.cover}
                  />
                )}
                <Markdown body={editing.data.body} />
              </>
            ) : (
              data.cover && (
                <ContentImage
                  src={data.cover}
                  alt={data.title}
                  className="preview-cover"
                />
              )
            )}
          </section>
        )}
      </fieldset>
      {editing.kind === "lesson" &&
        catalog.sections.find((s) => s.id === editing.data.sectionId)
          ?.status === "draft" && (
          <div className="notice">
            Раздел находится в черновиках. Урок станет доступен читателям после
            публикации раздела.
          </div>
        )}
      {uploading && <p role="status">Загружаем изображение…</p>}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <div className="editor-footer">
        <span>
          {dirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}
        </span>
        <button
          className="button primary"
          disabled={saving || uploading || !catalog.database}
          type="submit"
        >
          <Save size={17} />
          {saving
            ? "Сохраняем…"
            : data.status === "published"
              ? "Сохранить и опубликовать"
              : "Сохранить черновик"}
        </button>
      </div>
    </form>
  );
}
