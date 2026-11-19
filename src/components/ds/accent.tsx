import { Fragment } from "react";

/**
 * Renders editable text where *asterisks* mark the accent phrase, as an <em> (inside h1–h3
 * globals.css styles it as the light bronze accent). Never renders HTML from the text.
 */
export function Accent({ text, emClassName }: { text: string; emClassName?: string }) {
  const parts = text.split("*");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className={emClassName}>
            {part}
          </em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
