"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, ShieldCheck, UserRound } from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
export default function ProfilePage() {
  const auth = useTelegram();
  const [copied, setCopied] = useState(false);
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">ЛИЧНОЕ ПРОСТРАНСТВО</span>
          <h1>Ваш профиль</h1>
          <p>Всё для комфортного обучения.</p>
        </div>
      </div>
      <section className="profile-card">
        <span className="profile-avatar">
          <UserRound size={34} />
        </span>
        <h2>
          {auth.user
            ? `${auth.user.first_name} ${auth.user.last_name || ""}`
            : "Добро пожаловать"}
        </h2>
        {auth.loading ? (
          <p role="status">Проверяем вход…</p>
        ) : auth.user ? (
          <>
            <p className="muted">
              {auth.user.username
                ? `@${auth.user.username}`
                : "Вы вошли через Telegram"}
            </p>
            <div className="id-card">
              <span>Ваш Telegram ID</span>
              <strong>{auth.user.id}</strong>
              <button
                className="icon-button"
                aria-label="Скопировать Telegram ID"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(String(auth.user!.id));
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? <Check size={19} /> : <Copy size={19} />}
              </button>
            </div>
            {copied && <p role="status">ID скопирован</p>}
            {auth.admin ? (
              <Link className="button primary" href="/admin">
                <ShieldCheck size={18} />
                Управление материалами
                <ArrowRight size={18} />
              </Link>
            ) : (
              <p className="profile-hint">
                Вы вошли как читатель. Если вы владелец приложения, добавьте
                этот ID в ADMIN_TELEGRAM_IDS в настройках Vercel и выполните
                новое развёртывание.
              </p>
            )}
          </>
        ) : (
          <>
            <p>
              Откройте приложение кнопкой в вашем Telegram-боте, чтобы увидеть
              имя и числовой Telegram ID.
            </p>
            {!auth.configured && !auth.error && (
              <p className="notice">
                Вход ещё не настроен. Владельцу нужно добавить токен бота и
                секрет сессий в настройки сервера.
              </p>
            )}
          </>
        )}
        {auth.error && (
          <div className="notice error" role="alert">
            <p>{auth.error}</p>
            <button className="button secondary" onClick={auth.retry}>
              Повторить вход
            </button>
          </div>
        )}
      </section>
      <div className="profile-tip">
        <BookNote />
        <div>
          <h3>Всему своё время</h3>
          <p>
            Выбирайте темы, которые интересны вам сейчас. Все опубликованные
            уроки доступны без оплаты.
          </p>
        </div>
      </div>
    </>
  );
}
function BookNote() {
  return <span className="small-star">✳</span>;
}
