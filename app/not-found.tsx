import Link from "next/link";
import { BookOpen } from "lucide-react";
export default function NotFound() {
  return (
    <div className="empty-state">
      <BookOpen size={36} />
      <h1>Материал недоступен</h1>
      <p>Возможно, его ещё готовят или уже сняли с публикации.</p>
      <Link className="button primary" href="/">
        Вернуться к обучению
      </Link>
    </div>
  );
}
