import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { validateTelegramData, isAdmin } from "../lib/telegram-auth";
const token = "12345:test-only-token";
const now = 1_800_000_000;
function signed(fields: Record<string, string>) {
  const params = new URLSearchParams(fields);
  const check = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  params.set("hash", createHmac("sha256", secret).update(check).digest("hex"));
  return params.toString();
}
const user = { id: 111222333, first_name: "Тест", username: "editor_test" };
test("accepts Telegram HMAC and ignores username for authorization", () => {
  const data = signed({
    auth_date: String(now),
    query_id: "test",
    user: JSON.stringify(user),
  });
  assert.deepEqual(validateTelegramData(data, token, now), user);
  process.env.ADMIN_TELEGRAM_IDS = "777, 111222333";
  assert.equal(isAdmin(user.id), true);
  assert.equal(isAdmin(333), false);
});
test("rejects forged user and invalid signature lengths", () => {
  const data = signed({ auth_date: String(now), user: JSON.stringify(user) });
  assert.throws(() =>
    validateTelegramData(data.replace("111222333", "999999999"), token, now),
  );
  assert.throws(() => validateTelegramData("hash=abc", token, now));
});
test("rejects expired and future credentials", () => {
  for (const date of [now - 3601, now + 31, 0])
    assert.throws(() =>
      validateTelegramData(
        signed({ auth_date: String(date), user: JSON.stringify(user) }),
        token,
        now,
      ),
    );
});
test("rejects duplicate fields and an invalid user id", () => {
  const data = signed({ auth_date: String(now), user: JSON.stringify(user) });
  assert.throws(() =>
    validateTelegramData(`${data}&auth_date=${now}`, token, now),
  );
  assert.throws(() =>
    validateTelegramData(
      signed({
        auth_date: String(now),
        user: JSON.stringify({ ...user, id: -1 }),
      }),
      token,
      now,
    ),
  );
});
