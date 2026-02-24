import React from "react";

export default function Tabs({ tab, setTab }) {
  const tabs = ["stream", "assignments", "notes", "live"];
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button
          key={t}
          className={`tabbtn ${tab === t ? "is-active" : ""}`}
          onClick={() => setTab(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
