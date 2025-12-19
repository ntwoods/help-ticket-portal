import React, { useMemo, useState } from "react";
import Modal from "./Modal.jsx";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "../utils/time.js";

const QUICK = [
  { label: "10 mins", mins: 10 },
  { label: "20 mins", mins: 20 },
  { label: "30 mins", mins: 30 },
  { label: "45 mins", mins: 45 },
  { label: "1 hr", mins: 60 },
];

export default function DeadlineModal({ open, onClose, ticket, onSubmit }) {
  const [quickMins, setQuickMins] = useState(null);
  const [manualDt, setManualDt] = useState("");

  const existing = useMemo(() => ticket?.deadlineAtISO || "", [ticket]);
  const existingLocal = useMemo(() => toDatetimeLocalValue(existing), [existing]);

  return (
    <Modal open={open} onClose={onClose} title={`Provide Deadline • ${ticket?.ticketNo || ""}`} width={620}>
      <div className="ntw-grid2">
        <div className="ntw-box">
          <div className="ntw-label">Quick Options</div>
          <div className="ntw-chipRow">
            {QUICK.map((q) => (
              <button
                key={q.mins}
                className={`ntw-chip ${quickMins === q.mins ? "active" : ""}`}
                onClick={() => {
                  setQuickMins(q.mins);
                  setManualDt("");
                }}
                type="button"
              >
                {q.label}
              </button>
            ))}
          </div>
          <div className="ntw-help">
            Timer start hoga <b>jab aap punch</b> karoge (abhi ke time se).
          </div>
        </div>

        <div className="ntw-box">
          <div className="ntw-label">Custom Date & Time (If more)</div>
          <input
            className="ntw-input"
            type="datetime-local"
            value={manualDt}
            onChange={(e) => {
              setManualDt(e.target.value);
              setQuickMins(null);
            }}
            placeholder="Select date & time"
          />
          <div className="ntw-help">
            Existing: <b>{existingLocal || "—"}</b>
          </div>
        </div>
      </div>

      <div className="ntw-actions">
        <button className="ntw-btn ntw-btnGhost" onClick={onClose} type="button">
          Cancel
        </button>

        <button
          className="ntw-btn"
          type="button"
          onClick={() => {
            if (!quickMins && !manualDt) return;

            const payload = {
              ticketNo: ticket.ticketNo,
              mode: quickMins ? "quick" : "manual",
              minutes: quickMins || null,
              deadlineAtISO: manualDt ? fromDatetimeLocalValue(manualDt) : null,
            };

            onSubmit?.(payload);
          }}
        >
          Save Deadline
        </button>
      </div>
    </Modal>
  );
}
