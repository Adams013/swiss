import React from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Calendar,
  Globe,
  MapPin,
  Users,
} from 'lucide-react';

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const CompanyProfilePage = ({ company, onClose, translate }) => {
  if (!company) {
    return null;
  }

  const {
    name,
    tagline,
    location,
    industry,
    website,
    profile: profileData = {},
  } = company;

  const hero = profileData.hero || {};
  const about = profileData.about || company.culture || '';
  const metrics = Array.isArray(profileData.metrics) ? profileData.metrics : [];
  const openRoles = Array.isArray(profileData.openRoles) ? profileData.openRoles : [];
  const team = Array.isArray(profileData.team) ? profileData.team : [];
  const updates = Array.isArray(profileData.updates) ? profileData.updates : [];

  return (
    <div className="ssc__company-profile-overlay" role="dialog" aria-modal="true">
      <div className="ssc__company-profile-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="ssc__company-profile-panel">
        <button type="button" className="ssc__company-profile-close" onClick={onClose}>
          <ArrowLeft size={16} />
          {translate('companies.profile.back', 'Back to startups')}
        </button>

        <section className="ssc__company-profile-hero">
          <div className="ssc__company-profile-hero-media">
            {hero.imageUrl ? (
              <img src={hero.imageUrl} alt={name ? `${name} hero` : 'Hero media'} />
            ) : (
              <div className="ssc__company-profile-hero-placeholder">
                <Briefcase size={32} />
              </div>
            )}
          </div>
          <div className="ssc__company-profile-hero-content">
            <span className="ssc__company-profile-industry">{industry}</span>
            <h2>{name}</h2>
            {tagline && <p className="ssc__company-profile-tagline">{tagline}</p>}
            <div className="ssc__company-profile-hero-meta">
              {location && (
                <span>
                  <MapPin size={16} />
                  {location}
                </span>
              )}
              {hero.headline && (
                <span>
                  <Users size={16} />
                  {hero.headline}
                </span>
              )}
            </div>
            {hero.subheadline && <p className="ssc__company-profile-subheadline">{hero.subheadline}</p>}
            <div className="ssc__company-profile-cta">
              {website && (
                <a href={website} target="_blank" rel="noreferrer">
                  <Globe size={16} />
                  {translate('companies.profile.visitWebsite', 'Visit website')}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              )}
              <a href="#jobs" className="ssc__company-profile-secondary">
                <Briefcase size={16} />
                {translate('companies.profile.viewRoles', 'Browse open roles')}
              </a>
            </div>
          </div>
        </section>

        <section className="ssc__company-profile-section">
          <h3>{translate('companies.profile.about', 'About')}</h3>
          <p>{about}</p>
          {metrics.length > 0 && (
            <ul className="ssc__company-profile-metrics">
              {metrics.map((metric) => (
                <li key={`${metric.label}-${metric.value}`}>
                  <span className="ssc__company-profile-metric-label">{metric.label}</span>
                  <span className="ssc__company-profile-metric-value">{metric.value}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {openRoles.length > 0 && (
          <section className="ssc__company-profile-section">
            <div className="ssc__company-profile-section-head">
              <h3>{translate('companies.profile.openRoles', 'Open roles')}</h3>
              <span className="ssc__company-profile-count">{openRoles.length}</span>
            </div>
            <ul className="ssc__company-profile-role-list">
              {openRoles.map((role) => (
                <li key={role.id} className="ssc__company-profile-role">
                  <div className="ssc__company-profile-role-meta">
                    <h4>{role.title}</h4>
                    <div className="ssc__company-profile-role-tags">
                      {role.location && (
                        <span>
                          <MapPin size={14} />
                          {role.location}
                        </span>
                      )}
                      {role.type && (
                        <span>
                          <Briefcase size={14} />
                          {role.type}
                        </span>
                      )}
                    </div>
                  </div>
                  {role.description && <p>{role.description}</p>}
                  <div className="ssc__company-profile-role-actions">
                    <a href={role.applyUrl || '#jobs'}>
                      {translate('companies.profile.roleCta', 'View details')}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {team.length > 0 && (
          <section className="ssc__company-profile-section">
            <h3>{translate('companies.profile.team', 'Leadership team')}</h3>
            <div className="ssc__company-profile-team">
              {team.map((member) => (
                <article key={member.name} className="ssc__company-profile-team-card">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} />
                  ) : (
                    <div className="ssc__company-profile-avatar-fallback">
                      <Users size={18} />
                    </div>
                  )}
                  <div>
                    <h4>{member.name}</h4>
                    <span>{member.title}</span>
                    {member.bio && <p>{member.bio}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {updates.length > 0 && (
          <section className="ssc__company-profile-section">
            <h3>{translate('companies.profile.updates', 'Latest updates')}</h3>
            <ul className="ssc__company-profile-updates">
              {updates.map((update) => (
                <li key={update.id}>
                  <div className="ssc__company-profile-update-date">
                    <Calendar size={14} />
                    {formatDate(update.date)}
                  </div>
                  <div>
                    <h4>{update.title}</h4>
                    {update.summary && <p>{update.summary}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default CompanyProfilePage;
