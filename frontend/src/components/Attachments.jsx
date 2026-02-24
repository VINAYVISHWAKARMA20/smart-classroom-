import React from "react";

export default function Attachments({ attachments = [] }) {
  if (!attachments.length) return null;
  return (
    <ul>
      {attachments.map((a) => (
        <li key={a._id}>
          <a href={`${import.meta.env.VITE_API_URL}${a.url}`} target="_blank" rel="noreferrer">
            {a.originalName}
          </a>
        </li>
      ))}
    </ul>
  );
}
