import React from "react";
import { motion } from "framer-motion";
import { Clock, Paperclip, Timer, AlertOctagon, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { fmtRaisedOn, isOverdue, remainingText } from "../utils/time.js";

export default function TicketCard({
  ticket,
  nowMs,
  expanded,
  onToggleExpanded,
  onProvideDeadline,
  onMarkResolved,
}) {
  const resolved = String(ticket.status || "").trim().toLowerCase() === "resolved";
  const overdue = !resolved && isOverdue(ticket.deadlineAtISO, nowMs);

  const issueTooLong = (ticket.issue || "").length > 160;
  const showFull = expanded || !issueTooLong;

  return (
    <motion.div
      className={`ntw-card ${overdue ? "overdue" : ""} ${resolved ? "resolved" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      layout
    >
      <div className="ntw-cardTop">
        <div>
          <div className="ntw-cardTitle">{ticket.raisedFor || "—"}</div>
          <div className="ntw-cardSub">
            Ticket No: <b>{ticket.ticketNo}</b>
          </div>
        </div>

        <div className={`ntw-pill ${resolved ? "ok" : overdue ? "danger" : ticket.deadlineAtISO ? "warn" : "ok"}`}>
          {resolved ? (
            <>
              <CheckCircle2 size={14} /> Resolved
            </>
          ) : overdue ? (
            <>
              <AlertOctagon size={14} /> Overdue
            </>
          ) : ticket.deadlineAtISO ? (
            <>
              <Timer size={14} /> Running
            </>
          ) : (
            <>
              <Clock size={14} /> Raised
            </>
          )}
        </div>
      </div>

      <div className="ntw-row">
        <div className="ntw-kv">
          <div className="ntw-k">Concerned / Resolving Person</div>
          <div className="ntw-v">{ticket.concernedPerson || "—"}</div>
        </div>
        <div className="ntw-kv">
          <div className="ntw-k">Raised On</div>
          <div className="ntw-v">{fmtRaisedOn(ticket.raisedOnISO) || ticket.raisedOnFormatted || "—"}</div>
        </div>
      </div>

      <div className="ntw-issue">
        <div className="ntw-k">Issue</div>
        <div className={`ntw-issueText ${showFull ? "" : "clamp"}`}>
          {ticket.issue || "—"}
        </div>

        {issueTooLong ? (
          <button className="ntw-linkBtn" onClick={onToggleExpanded} type="button">
            {showFull ? (
              <>
                <ChevronUp size={16} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={16} /> Show more
              </>
            )}
          </button>
        ) : null}
      </div>

      {ticket.deadlineAtISO ? (
        <div className={`ntw-timer ${overdue ? "overdue" : ""}`}>
          <div className="ntw-timerLeft">
            <Timer size={18} />
            <div>
              <div className="ntw-timerLabel">{resolved ? "Resolved" : "Remaining Time"}</div>
              <div className="ntw-timerValue">
                {resolved ? (fmtRaisedOn(ticket.resolvedAtISO) || ticket.resolvedAtFormatted || "—") : remainingText(ticket.deadlineAtISO, nowMs)}
              </div>
            </div>
          </div>
          <div className="ntw-timerRight">
            <div className="ntw-smallMuted">{resolved ? "Deadline" : "Deadline"}</div>
            <div className="ntw-smallStrong">{fmtRaisedOn(ticket.deadlineAtISO)}</div>
          </div>
        </div>
      ) : (
        <div className="ntw-tip">
          Deadline provide karoge to live timer start ho jayega.
        </div>
      )}

      <div className="ntw-actions">
        {ticket.attachmentUrl ? (
          <button
            className="ntw-btn ntw-btnGhost"
            onClick={() => window.open(ticket.attachmentUrl, "_blank", "noopener,noreferrer")}
            type="button"
          >
            <Paperclip size={16} /> Open Attachment
          </button>
        ) : (
          <button className="ntw-btn ntw-btnGhost" disabled type="button">
            <Paperclip size={16} /> No Attachment
          </button>
        )}

        <button className="ntw-btn" onClick={() => onProvideDeadline?.(ticket)} type="button" disabled={resolved}>
          Provide Deadline
        </button>

        {/* ✅ Only show when deadline is provided */}
        {ticket.deadlineAtISO && !resolved ? (
          <button className="ntw-btn ntw-btnSuccess" onClick={() => onMarkResolved?.(ticket)} type="button">
            <CheckCircle2 size={16} /> Mark Resolved
          </button>
        ) : null}
      </div>

      <div className="ntw-foot">
        {ticket.raisedBy ? (
          <span className="ntw-smallMuted">Raised By: <b>{ticket.raisedBy}</b></span>
        ) : (
          <span className="ntw-smallMuted">Raised By: <b>—</b></span>
        )}
      </div>
    </motion.div>
  );
}
