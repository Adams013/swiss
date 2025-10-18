import React from 'react';

const CODE_SEGMENT_PATTERN = /(<code>[\s\S]*?<\/code>)/gi;
const CODE_WRAPPER_PATTERN = /^<code>([\s\S]*?)<\/code>$/i;

const parseSegments = (text) => {
  if (typeof text !== 'string') {
    return [];
  }

  const parts = text.split(CODE_SEGMENT_PATTERN).filter(Boolean);

  return parts.map((part) => {
    const codeMatch = part.match(CODE_WRAPPER_PATTERN);

    if (codeMatch) {
      return { type: 'code', content: codeMatch[1] };
    }

    return { type: 'text', content: part };
  });
};

const CvFootnote = ({ text, ...spanProps }) => {
  const segments = parseSegments(text);

  if (segments.length === 0) {
    return <span {...spanProps}>{typeof text === 'string' ? text : ''}</span>;
  }

  return (
    <span {...spanProps}>
      {segments.map((segment, index) =>
        segment.type === 'code' ? (
          <code key={`code-${index}`}>{segment.content}</code>
        ) : (
          segment.content
        )
      )}
    </span>
  );
};

export { parseSegments };
export default CvFootnote;
