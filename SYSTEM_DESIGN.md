# CareSync System Design

**Scope:** Double-booking prevention, slot hold mechanism, doctor leave conflict handling, and notification failure handling. All references point to the actual implementation in this repository.

---

## 1. Double-Booking Prevention: The Hold Mechanism

The single hardest problem in appointment booking is the race between two patients selecting the same open slot. CareSync solves it with a **two-phase, atomic slot state machine** backed by a unique database constraint.

**Slot states:** `AVAILABLE → HELD → BOOKED → CANCELLED`

### Phase 1 — The Atomic Hold

When a patient selects a slot, the backend executes:

```sql
UPDATE "Slot"
SET status = 'HELD', held_until = now() + interval '5 minutes'
WHERE id = $slotId AND status = 'AVAILABLE'
```

This is a single conditional `UPDATE` — never a `SELECT` followed by an `UPDATE`. Prisma's `updateMany` with a `where: { id, status: 'AVAILABLE' }` clause maps directly to this. If `result.count === 0`, the slot was already taken by a concurrent request and the API immediately returns **HTTP 409** ("Slot no longer available"). No second trip to the database, no window for a race.

This is implemented in [`src/routes/patient.ts`](src/routes/patient.ts) at the `/slots/:slotId/hold` endpoint.

### Phase 2 — The Atomic Booking

When the patient confirms, a `$transaction` block does:

1. `updateMany WHERE { id: slot_id, status: 'HELD' }` → `BOOKED` — if 0 rows updated, throws `SLOT_NOT_HELD`
2. `appointment.create(...)` with `slot_id`

The `Appointment.slot_id` column carries a `@unique` constraint in the Prisma schema. This is the **second safeguard** — even if two requests somehow both completed Phase 1 (impossible with the atomic update, but this covers any future code path), the database unique index will reject the second `INSERT` with a `P2002` error, which the route handler catches and returns as **HTTP 409**.

### Slot Hold Expiry

A `node-cron` job runs every 60 seconds and executes one bulk update:

```sql
UPDATE "Slot"
SET status = 'AVAILABLE', held_until = NULL
WHERE status = 'HELD' AND held_until < now()
```

Implemented in [`src/jobs/slotExpiry.ts`](src/jobs/slotExpiry.ts). This ensures abandoned holds (browser close, payment timeout) are automatically recycled without manual intervention.

---

## 2. Doctor Leave Conflict Handling

When an admin marks a doctor absent, existing bookings must be cancelled and patients notified. The challenge is doing this atomically while not blocking the HTTP response.

### Transactional Cancellation

The leave-marking endpoint ([`src/routes/admin.ts`](src/routes/admin.ts)) first inserts the `DoctorLeave` row (protected by a `@@unique([doctor_id, date])` constraint). It then queries all `BOOKED` slots within that day's window for the doctor, and processes them inside a single `prisma.$transaction`:

```typescript
await prisma.$transaction(async (tx) => {
  for (const slot of affectedSlots) {
    await tx.slot.update({ where: { id: slot.id }, data: { status: 'CANCELLED' } });
    await tx.appointment.update({ where: { id: slot.appointment.id }, data: { status: 'CANCELLED' } });
  }
});
```

Because this is one atomic transaction, there is no partial state: either all appointments are cancelled or none are (e.g., on DB failure). The leave-marking HTTP response returns **immediately after the transaction commits**, with `{ affected_appointments: N }`.

### Async Notification Dispatch

Notifications are dispatched via `setImmediate()` — the Node.js event loop runs them as soon as the current call stack is clear, but after the HTTP response has been sent. This means:

- The admin's UI is responsive (no 30-second wait on email sends)
- Each cancellation triggers `sendCancellationEmail()` (which creates a `NotificationLog` row with status `PENDING` before attempting the send), plus Google Calendar `deleteCalendarEvent()` calls for both the patient's and doctor's calendars

If any notification fails, the `NotificationLog` row is updated to `RETRYING` with the error message captured, and the notification retry worker picks it up in the next cycle.

---

## 3. Notification Failure Handling

Notifications are treated as **first-class, observable state** — never fire-and-forget.

### Log-Before-Send Pattern

Every notification attempt in [`src/services/email.ts`](src/services/email.ts) follows this sequence:

1. Create a `NotificationLog` row with `status: PENDING` before any network call
2. Attempt the SMTP send
3. On success → update log to `SENT`
4. On failure → update log to `RETRYING`, increment `attempts`, store `last_error`

This means a crashed server mid-send leaves the log in `PENDING`, which the worker will pick up.

### Retry Worker with Exponential Backoff

[`src/jobs/notificationWorker.ts`](src/jobs/notificationWorker.ts) runs on a `node-cron` schedule every 5 minutes. It:

1. Queries all `PENDING` and `RETRYING` `NotificationLog` rows
2. For each retrying log, computes `nextRetry = updated_at + 2^attempts minutes` — skips if `now < nextRetry`
3. Attempts the send
4. On success → `SENT`
5. On failure with `attempts >= 3` → `FAILED` (no more retries)

This gives backoff windows of 2 min, 4 min, 8 min before marking as `FAILED`.

### Admin Visibility

All `FAILED` and `RETRYING` logs are surfaced in the Admin portal at `/api/admin/notifications/failed` (implemented in [`src/routes/admin.ts`](src/routes/admin.ts)). Admins can manually reset a log to `PENDING` (zero attempts) to trigger a fresh retry cycle. The frontend auto-refreshes this view every 30 seconds.

Calendar failures follow the same `NotificationLog` pattern — a `type: CALENDAR` log row is created and tracked identically to email logs.

---

## 4. LLM Resilience Pattern

LLM calls ([`src/services/llm.ts`](src/services/llm.ts)) are wrapped in a `callWithTimeout` utility that races the OpenAI API call against a 10-second `setTimeout`. Any failure path — network error, invalid JSON, timeout, empty response, wrong schema — is caught in a single `try/catch` and returns a fallback object `{ error: true, raw_symptoms: symptoms }`.

The booking transaction and the appointment confirmation are **never awaited on the LLM result** — the LLM call happens before the transaction, and its result (whether real or fallback) is stored in `ai_pre_summary`. The booking flow cannot be broken by LLM failures.

---

## Summary Table

| Concern | Mechanism | Guarantee |
|---|---|---|
| Double-booking | Atomic `WHERE status='AVAILABLE'` update | Database-enforced, no race window |
| Second safeguard | `@unique` on `Appointment.slot_id` | DB rejects duplicate INSERTs |
| Hold expiry | Cron every 60s, bulk `UPDATE WHERE held_until < now` | Abandoned holds freed automatically |
| Leave conflicts | Single `$transaction` for all cancellations | All-or-nothing atomicity |
| Notification failures | Log-before-send + 3-attempt exponential backoff | No silent failures, all state observable |
| LLM failures | 10s timeout + try/catch + fallback JSON | LLM never blocks booking flow |
