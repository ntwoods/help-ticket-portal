import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, RotateCw, Ticket, Sparkles } from "lucide-react";
import Modal from "./components/Modal.jsx";
import TicketCard from "./components/TicketCard.jsx";
import DeadlineModal from "./components/DeadlineModal.jsx";
import ToastStack from "./components/Toast.jsx";
import { apiCall } from "./api.js";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function uniq(arr) {
  return Array.from(new Set((arr || []).map((x) => String(x || "").trim()).filter(Boolean)));
}

function useNowTick() {
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return nowMs;
}

async function fileToDataUrl(file) {
  if (!file) return null;
  // Safety cap (approx). You can increase, but Apps Script + browser will have limits.
  const MAX = 2.5 * 1024 * 1024; // 2.5MB
  if (file.size > MAX) throw new Error("Attachment too large (max ~2.5MB). Please compress the image.");
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Unable to read file"));
    r.readAsDataURL(file);
  });
}

export default function App() {
  const nowMs = useNowTick();

  const [raiseOpen, setRaiseOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [deadlineTicket, setDeadlineTicket] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const [expanded, setExpanded] = useState({});
  const [toasts, setToasts] = useState([]);

  const [form, setForm] = useState({
    raisedFor: "",
    concernedPerson: "",
    issue: "",
    file: null,
  });

  const fileRef = useRef(null);

  const addToast = (type, title, message = "") => {
    const id = uid();
    setToasts((p) => [{ id, type, title, message }, ...p].slice(0, 4));
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const resetForm = () => {
    setForm({ raisedFor: "", concernedPerson: "", issue: "", file: null });
    if (fileRef.current) fileRef.current.value = "";
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await apiCall("LIST_MY_TICKETS", {});
      setTickets(data?.tickets || []);
    } catch (e) {
      addToast("error", "Unable to load tickets", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const liveTickets = useMemo(
  () => (tickets || []).filter((t) => String(t?.status || "").trim().toLowerCase() !== "resolved"),
  [tickets]
);
const resolvedTickets = useMemo(
  () => (tickets || []).filter((t) => String(t?.status || "").trim().toLowerCase() === "resolved"),
  [tickets]
);

const [liveFilter, setLiveFilter] = useState({ raisedFor: "", concernedPerson: "" });
const [resolvedFilter, setResolvedFilter] = useState({ raisedFor: "", concernedPerson: "" });

const liveOptions = useMemo(() => {
  return {
    raisedFor: uniq(liveTickets.map((t) => t.raisedFor)),
    concernedPerson: uniq(liveTickets.map((t) => t.concernedPerson)),
  };
}, [liveTickets]);

const resolvedOptions = useMemo(() => {
  return {
    raisedFor: uniq(resolvedTickets.map((t) => t.raisedFor)),
    concernedPerson: uniq(resolvedTickets.map((t) => t.concernedPerson)),
  };
}, [resolvedTickets]);

const liveFiltered = useMemo(() => {
  const rf = String(liveFilter.raisedFor || "");
  const cp = String(liveFilter.concernedPerson || "");
  return (liveTickets || []).filter((t) => {
    if (rf && String(t.raisedFor || "").trim() !== rf) return false;
    if (cp && String(t.concernedPerson || "").trim() !== cp) return false;
    return true;
  });
}, [liveTickets, liveFilter]);

const resolvedFiltered = useMemo(() => {
  const rf = String(resolvedFilter.raisedFor || "");
  const cp = String(resolvedFilter.concernedPerson || "");
  return (resolvedTickets || []).filter((t) => {
    if (rf && String(t.raisedFor || "").trim() !== rf) return false;
    if (cp && String(t.concernedPerson || "").trim() !== cp) return false;
    return true;
  });
}, [resolvedTickets, resolvedFilter]);

const liveCount = liveTickets.length;
const resolvedCount = resolvedTickets.length;


  const previewUrl = useMemo(() => {
    if (!form.file) return "";
    return URL.createObjectURL(form.file);
  }, [form.file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const submitTicket = async () => {
    if (!form.raisedFor.trim()) return addToast("error", "Ticket Raised For required");
    if (!form.concernedPerson.trim()) return addToast("error", "Concerned / Resolving Person required");
    if (!form.issue.trim()) return addToast("error", "Issue required");

    try {
      const attachmentDataUrl = await fileToDataUrl(form.file);
      const payload = {
        raisedFor: form.raisedFor.trim(),
        concernedPerson: form.concernedPerson.trim(),
        issue: form.issue.trim(),
        attachmentDataUrl: attachmentDataUrl || "",
        attachmentName: form.file?.name || "",
      };

      await apiCall("RAISE_TICKET", payload);
      addToast("success", "Ticket Raised ✅", "Sheet1 me save ho gaya");
      setRaiseOpen(false);
      resetForm();
      await loadTickets();
    } catch (e) {
      addToast("error", "Ticket raise failed", e.message);
    }
  };

  const submitDeadline = async (payload) => {
    try {
      await apiCall("SET_DEADLINE", payload);
      addToast("success", "Deadline Saved ✅", "Live timer start ho gaya");
      setDeadlineOpen(false);
      setDeadlineTicket(null);
      await loadTickets();
    } catch (e) {
      addToast("error", "Deadline update failed", e.message);
    }
  };

  const markResolved = async (ticket) => {
    const ticketNo = ticket?.ticketNo;
    if (!ticketNo) return;

    const ok = window.confirm(`Mark this ticket as RESOLVED?\n\nTicket: ${ticketNo}`);
    if (!ok) return;

    try {
      await apiCall("MARK_RESOLVED", { ticketNo });
      addToast("success", "Marked Resolved ✅", "Sheet1 me update ho gaya");
      await loadTickets();
    } catch (e) {
      addToast("error", "Resolve failed", e.message);
    }
  };

  return (
    <div className="ntw-app">
      <div className="ntw-bg">
        <div className="ntw-blob b1" />
        <div className="ntw-blob b2" />
        <div className="ntw-blob b3" />
      </div>

      <ToastStack toasts={toasts} onClose={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <header className="ntw-header">
        <div className="ntw-brand">
          <div className="ntw-logo">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="ntw-title">Help Ticket Portal</div>
            <div className="ntw-subtitle">White & Blue • Professional • Animated</div>
          </div>
        </div>

        <div className="ntw-headerActions">
          <button className="ntw-btn ntw-btnGhost" onClick={loadTickets} type="button" disabled={loading}>
            <RotateCw size={16} /> {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="ntw-btn" onClick={() => setRaiseOpen(true)} type="button">
            <Plus size={16} /> Raise A Ticket
          </button>
        </div>
      </header>

      <main className="ntw-main">
  <motion.div
    className="ntw-stats"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 420, damping: 34 }}
  >
    <div className="ntw-statsLeft">
      <div className="ntw-statCard">
        <div className="ntw-statIcon">
          <Ticket size={18} />
        </div>
        <div>
          <div className="ntw-statLabel">Raised Tickets (Live)</div>
          <div className="ntw-statValue">{liveCount}</div>
        </div>
      </div>

      <div className="ntw-statCard ntw-statCardGreen">
        <div className="ntw-statIcon green">
          <Ticket size={18} />
        </div>
        <div>
          <div className="ntw-statLabel">Resolved Tickets</div>
          <div className="ntw-statValue">{resolvedCount}</div>
        </div>
      </div>
    </div>

    <div className="ntw-hint">
      Tip: Deadline provide karne ke baad card me live timer chalega. Deadline cross =&gt; card Overdue (red). Resolved tickets neeche alag section me milenge.
    </div>
  </motion.div>

  {/* Live Tickets */}
  <section className="ntw-section">
    <div className="ntw-sectionHead">
      <div>
        <div className="ntw-sectionTitle">Live Tickets</div>
        <div className="ntw-sectionSub">
          Showing <b>{liveFiltered.length}</b> of <b>{liveCount}</b>
        </div>
      </div>

      <div className="ntw-filters">
        <div className="ntw-filter">
          <div className="ntw-filterLabel">Raised For</div>
          <select
            className="ntw-input"
            value={liveFilter.raisedFor}
            onChange={(e) => setLiveFilter((p) => ({ ...p, raisedFor: e.target.value }))}
          >
            <option value="">All</option>
            {liveOptions.raisedFor.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <div className="ntw-filter">
          <div className="ntw-filterLabel">Concerned Person</div>
          <select
            className="ntw-input"
            value={liveFilter.concernedPerson}
            onChange={(e) => setLiveFilter((p) => ({ ...p, concernedPerson: e.target.value }))}
          >
            <option value="">All</option>
            {liveOptions.concernedPerson.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <button
          className="ntw-btn ntw-btnGhost ntw-btnSm"
          type="button"
          onClick={() => setLiveFilter({ raisedFor: "", concernedPerson: "" })}
        >
          Clear
        </button>
      </div>
    </div>

    {liveCount === 0 ? (
      <motion.div
        className="ntw-sectionEmpty"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <div className="ntw-emptyTitle">No live tickets</div>
        <div className="ntw-emptySub">
          Raise A Ticket button se start karo. Resolved tickets neeche alag section me mil jayenge.
        </div>
        <button className="ntw-btn" onClick={() => setRaiseOpen(true)} type="button">
          <Plus size={16} /> Raise A Ticket
        </button>
      </motion.div>
    ) : liveFiltered.length === 0 ? (
      <motion.div
        className="ntw-sectionEmpty"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <div className="ntw-emptyTitle">No matching live tickets</div>
        <div className="ntw-emptySub">Filters clear karke dekho.</div>
        <button
          className="ntw-btn ntw-btnGhost"
          onClick={() => setLiveFilter({ raisedFor: "", concernedPerson: "" })}
          type="button"
        >
          Clear Filters
        </button>
      </motion.div>
    ) : (
      <div className="ntw-grid">
        {liveFiltered.map((t) => (
          <TicketCard
            key={t.ticketNo}
            ticket={t}
            nowMs={nowMs}
            expanded={!!expanded[t.ticketNo]}
            onToggleExpanded={() =>
              setExpanded((p) => ({ ...p, [t.ticketNo]: !p[t.ticketNo] }))
            }
            onProvideDeadline={(ticket) => {
              setDeadlineTicket(ticket);
              setDeadlineOpen(true);
            }}
            onMarkResolved={markResolved}
          />
        ))}
      </div>
    )}
  </section>

  {/* Resolved Tickets */}
  <section className="ntw-section">
    <div className="ntw-sectionHead">
      <div>
        <div className="ntw-sectionTitle">Resolved Tickets</div>
        <div className="ntw-sectionSub">
          Showing <b>{resolvedFiltered.length}</b> of <b>{resolvedCount}</b>
        </div>
      </div>

      <div className="ntw-filters">
        <div className="ntw-filter">
          <div className="ntw-filterLabel">Raised For</div>
          <select
            className="ntw-input"
            value={resolvedFilter.raisedFor}
            onChange={(e) => setResolvedFilter((p) => ({ ...p, raisedFor: e.target.value }))}
          >
            <option value="">All</option>
            {resolvedOptions.raisedFor.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <div className="ntw-filter">
          <div className="ntw-filterLabel">Concerned Person</div>
          <select
            className="ntw-input"
            value={resolvedFilter.concernedPerson}
            onChange={(e) =>
              setResolvedFilter((p) => ({ ...p, concernedPerson: e.target.value }))
            }
          >
            <option value="">All</option>
            {resolvedOptions.concernedPerson.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <button
          className="ntw-btn ntw-btnGhost ntw-btnSm"
          type="button"
          onClick={() => setResolvedFilter({ raisedFor: "", concernedPerson: "" })}
        >
          Clear
        </button>
      </div>
    </div>

    {resolvedCount === 0 ? (
      <motion.div
        className="ntw-sectionEmpty"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <div className="ntw-emptyTitle">No resolved tickets yet</div>
        <div className="ntw-emptySub">Resolved tickets yahan appear honge, live section se auto shift ho jayenge.</div>
      </motion.div>
    ) : resolvedFiltered.length === 0 ? (
      <motion.div
        className="ntw-sectionEmpty"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <div className="ntw-emptyTitle">No matching resolved tickets</div>
        <div className="ntw-emptySub">Filters clear karke dekho.</div>
        <button
          className="ntw-btn ntw-btnGhost"
          onClick={() => setResolvedFilter({ raisedFor: "", concernedPerson: "" })}
          type="button"
        >
          Clear Filters
        </button>
      </motion.div>
    ) : (
      <div className="ntw-grid">
        {resolvedFiltered.map((t) => (
          <TicketCard
            key={t.ticketNo}
            ticket={t}
            nowMs={nowMs}
            expanded={!!expanded[t.ticketNo]}
            onToggleExpanded={() =>
              setExpanded((p) => ({ ...p, [t.ticketNo]: !p[t.ticketNo] }))
            }
            onProvideDeadline={(ticket) => {
              setDeadlineTicket(ticket);
              setDeadlineOpen(true);
            }}
            onMarkResolved={markResolved}
          />
        ))}
      </div>
    )}
  </section>
</main>


      {/* Raise Ticket Modal */}
      <Modal open={raiseOpen} onClose={() => setRaiseOpen(false)} title="Raise A Ticket" width={700}>
        <div className="ntw-formGrid">
          <div>
            <label className="ntw-label">Ticket Raised For:</label>
            <input
              className="ntw-input"
              value={form.raisedFor}
              onChange={(e) => setForm((p) => ({ ...p, raisedFor: e.target.value }))}
              placeholder="e.g., IT Support / Hardware / Portal Bug / etc."
            />
          </div>

          <div>
            <label className="ntw-label">Concerned / Resolving Person:</label>
            <input
              className="ntw-input"
              value={form.concernedPerson}
              onChange={(e) => setForm((p) => ({ ...p, concernedPerson: e.target.value }))}
              placeholder="e.g., Rajesh / Kuldeep / MIS Team / etc."
            />
          </div>

          <div className="span2">
            <label className="ntw-label">Issue:</label>
            <textarea
              className="ntw-textarea"
              value={form.issue}
              onChange={(e) => setForm((p) => ({ ...p, issue: e.target.value }))}
              placeholder="Issue details..."
              rows={5}
            />
          </div>

          <div className="span2">
            <label className="ntw-label">Attach Image (Optional):</label>
            <div className="ntw-fileRow">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="ntw-file"
                onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
              />
              {form.file ? (
                <button className="ntw-btn ntw-btnGhost" type="button" onClick={() => {
                  resetForm();
                }}>
                  Remove
                </button>
              ) : null}
            </div>

            {form.file ? (
              <div className="ntw-preview">
                <img src={previewUrl} alt="preview" />
                <div className="ntw-previewMeta">
                  <div className="ntw-smallStrong">{form.file.name}</div>
                  <div className="ntw-smallMuted">{Math.round(form.file.size / 1024)} KB</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="ntw-actions">
          <button className="ntw-btn ntw-btnGhost" onClick={() => { setRaiseOpen(false); }} type="button">
            Cancel
          </button>
          <button className="ntw-btn" onClick={submitTicket} type="button">
            Raise Ticket
          </button>
        </div>
      </Modal>

      <DeadlineModal
        open={deadlineOpen}
        onClose={() => {
          setDeadlineOpen(false);
          setDeadlineTicket(null);
        }}
        ticket={deadlineTicket || {}}
        onSubmit={submitDeadline}
      />
    </div>
  );
}
