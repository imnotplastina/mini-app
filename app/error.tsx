"use client";
import { RotateCcw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h1>Не удалось открыть материалы</h1>
      <p>Попробуйте ещё раз чуть позже.</p>
      <button className="button primary" onClick={reset}>
        <RotateCcw size={17} />
        Повторить
      </button>
    </div>
  );
}
