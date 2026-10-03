"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import { ImageOff, RotateCcw } from "lucide-react";

export function ContentImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <span
        className={`image-placeholder ${className}`}
        role="img"
        aria-label={alt || "Изображение недоступно"}
      >
        <ImageOff size={26} />
      </span>
    );
  // Images come from editor-controlled HTTPS sources or bundled illustrations.
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
export function Markdown({ body }: { body: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        skipHtml
        urlTransform={(url, key) => {
          if (key === "src")
            return /^https:\/\//i.test(url) ||
              /^\/images\/[a-z0-9/_\-.]+$/i.test(url)
              ? url
              : "";
          return defaultUrlTransform(url);
        }}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <ContentImage
              src={typeof src === "string" ? src : ""}
              alt={alt || "Иллюстрация к уроку"}
            />
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
export function VideoPlayer({ src, poster }: { src: string; poster: string }) {
  return <VideoPlayerContent key={src} src={src} poster={poster} />;
}
function VideoPlayerContent({ src, poster }: { src: string; poster: string }) {
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (video.current?.error) setError(true);
  }, [attempt]);
  return (
    <div className="video-wrap">
      {error ? (
        <div className="video-error">
          <p>Не удалось загрузить видео</p>
          <span>Проверьте подключение к интернету и попробуйте ещё раз.</span>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setError(false);
              setAttempt((n) => n + 1);
            }}
          >
            <RotateCcw size={17} />
            Повторить
          </button>
        </div>
      ) : (
        <video
          ref={video}
          key={`${src}-${attempt}`}
          src={src}
          controls
          playsInline
          preload="metadata"
          poster={poster || undefined}
          onError={() => setError(true)}
          aria-label="Видеоурок"
        >
          Ваш браузер не поддерживает видео.
        </video>
      )}
    </div>
  );
}
