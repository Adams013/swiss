import React from 'react';
import { swissCities } from './TerminalExperience';
import './SwissNationalPresenceMap.css';

const SwissNationalPresenceMap = ({ translate = (key, fallback) => fallback }) => {
  const title = translate('map.nationalPresence.title', 'National Presence');
  const description = translate(
    'map.nationalPresence.description',
    'Swiss startup talent is active from Geneva to St. Gallen with coordinated hubs across the country.'
  );
  const ariaLabel = translate(
    'map.nationalPresence.ariaLabel',
    'Map of Switzerland highlighting major Swiss startup hubs'
  );

  return (
    <section className="ssc-map-panel">
      <div className="ssc__max">
        <div className="ssc-map-panel__inner">
          <header className="ssc-map-panel__header">
            <h2>{title}</h2>
            <p>{description}</p>
          </header>
          <div className="ssc-map-panel__visual">
            <svg viewBox="0 0 100 64" preserveAspectRatio="xMidYMid meet" role="img" aria-label={ariaLabel}>
              <defs>
                <radialGradient id="sscMapGlow" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="var(--ssc-map-node)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--ssc-map-node)" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100" height="64" fill="var(--ssc-map-surface)" />
              <path
                d="M8,34 C14,22 28,14 40,16 C48,20 58,16 66,20 C74,24 86,22 94,32 C90,40 82,46 70,50 C58,56 44,56 32,52 C24,48 14,44 8,34 Z"
                fill="var(--ssc-map-land)"
                stroke="var(--ssc-map-outline)"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
              {swissCities.map(({ id, name, x, y }, index) => (
                <g key={id}>
                  <circle cx={x} cy={y} r={2.8} fill="url(#sscMapGlow)" />
                  <circle
                    cx={x}
                    cy={y}
                    r={1.1}
                    fill="var(--ssc-map-node-core)"
                    stroke="var(--ssc-map-outline)"
                    strokeWidth="0.3"
                  >
                    <animate
                      attributeName="r"
                      values="1.1;2;1.1"
                      dur="2.8s"
                      begin={`${index * 0.28}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <title>{name}</title>
                </g>
              ))}
            </svg>
          </div>
          <ul className="ssc-map-panel__legend">
            {swissCities.map(({ id, name }) => (
              <li key={id}>{name}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SwissNationalPresenceMap;
