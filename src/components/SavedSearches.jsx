import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Bell,
  BellOff,
  Clock,
  Zap,
  Calendar,
  Check,
  X,
  Save,
} from 'lucide-react';
import {
  fetchSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
} from '../services/supabaseNotifications';

/**
 * SavedSearches Component
 * Manages user's saved job searches with alert configuration
 */
const SavedSearches = ({ user, translate, setFeedback, currentFilters, onApplySearch }) => {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    alert_enabled: true,
    alert_frequency: 'daily',
  });

  useEffect(() => {
    if (user?.id) {
      loadSavedSearches();
    }
  }, [user?.id]);

  const loadSavedSearches = async () => {
    setLoading(true);
    const { searches: data, error } = await fetchSavedSearches(user.id);

    if (error) {
      setFeedback({
        type: 'error',
        message: translate('savedSearches.loadError', 'Failed to load saved searches'),
      });
    } else {
      setSearches(data);
    }

    setLoading(false);
  };

  const handleSaveCurrentSearch = () => {
    setFormData({
      name: '',
      description: '',
      alert_enabled: true,
      alert_frequency: 'daily',
    });
    setEditingSearch(null);
    setShowCreateModal(true);
  };

  const handleEditSearch = (search) => {
    setFormData({
      name: search.name,
      description: search.description || '',
      alert_enabled: search.alert_enabled,
      alert_frequency: search.alert_frequency,
    });
    setEditingSearch(search);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFeedback({
        type: 'error',
        message: translate('savedSearches.nameRequired', 'Please enter a name for this search'),
      });
      return;
    }

    if (editingSearch) {
      // Update existing search
      const { error } = await updateSavedSearch(editingSearch.id, {
        name: formData.name,
        description: formData.description,
        alert_enabled: formData.alert_enabled,
        alert_frequency: formData.alert_frequency,
      });

      if (error) {
        setFeedback({
          type: 'error',
          message: translate('savedSearches.updateError', 'Failed to update search'),
        });
      } else {
        setFeedback({
          type: 'success',
          message: translate('savedSearches.updateSuccess', 'Search updated successfully!'),
        });
        loadSavedSearches();
        setShowCreateModal(false);
      }
    } else {
      // Create new search
      const { error } = await createSavedSearch(user.id, {
        name: formData.name,
        description: formData.description,
        filters: currentFilters,
        alert_enabled: formData.alert_enabled,
        alert_frequency: formData.alert_frequency,
      });

      if (error) {
        setFeedback({
          type: 'error',
          message: translate('savedSearches.createError', 'Failed to save search'),
        });
      } else {
        setFeedback({
          type: 'success',
          message: translate('savedSearches.createSuccess', 'Search saved successfully!'),
        });
        loadSavedSearches();
        setShowCreateModal(false);
      }
    }
  };

  const handleDelete = async (searchId, searchName) => {
    if (!window.confirm(
      translate(
        'savedSearches.confirmDelete',
        `Are you sure you want to delete "${searchName}"?`
      )
    )) {
      return;
    }

    const { error } = await deleteSavedSearch(searchId);

    if (error) {
      setFeedback({
        type: 'error',
        message: translate('savedSearches.deleteError', 'Failed to delete search'),
      });
    } else {
      setFeedback({
        type: 'success',
        message: translate('savedSearches.deleteSuccess', 'Search deleted'),
      });
      loadSavedSearches();
    }
  };

  const handleToggleAlert = async (search) => {
    const { error } = await updateSavedSearch(search.id, {
      alert_enabled: !search.alert_enabled,
    });

    if (error) {
      setFeedback({
        type: 'error',
        message: translate('savedSearches.toggleError', 'Failed to update alert'),
      });
    } else {
      loadSavedSearches();
    }
  };

  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case 'instant':
        return <Zap size={14} />;
      case 'daily':
        return <Clock size={14} />;
      case 'weekly':
        return <Calendar size={14} />;
      default:
        return null;
    }
  };

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'instant':
        return translate('savedSearches.frequency.instant', 'Instant');
      case 'daily':
        return translate('savedSearches.frequency.daily', 'Daily');
      case 'weekly':
        return translate('savedSearches.frequency.weekly', 'Weekly');
      default:
        return frequency;
    }
  };

  const formatFilters = (filters) => {
    const parts = [];

    if (filters.searchTerm) {
      parts.push(`"${filters.searchTerm}"`);
    }

    if (filters.locations?.length > 0) {
      parts.push(filters.locations.join(', '));
    }

    if (filters.workArrangements?.length > 0) {
      parts.push(filters.workArrangements.join(', '));
    }

    if (filters.employmentTypes?.length > 0) {
      parts.push(filters.employmentTypes.join(', '));
    }

    if (filters.salaryMin || filters.salaryMax) {
      const salaryRange = `CHF ${filters.salaryMin || '0'} - ${filters.salaryMax || '∞'}`;
      parts.push(salaryRange);
    }

    return parts.length > 0 ? parts.join(' • ') : translate('savedSearches.noFilters', 'No filters');
  };

  if (loading) {
    return (
      <div className="ssc__saved-searches ssc__saved-searches--loading">
        <div className="ssc__spinner"></div>
      </div>
    );
  }

  return (
    <div className="ssc__saved-searches">
      <div className="ssc__saved-searches__header">
        <div>
          <h2>
            <Search className="ssc__icon" size={20} />
            {translate('savedSearches.title', 'Saved Searches')}
          </h2>
          <p className="ssc__saved-searches__subtitle">
            {translate(
              'savedSearches.subtitle',
              'Save your job searches and get notified about new matches'
            )}
          </p>
        </div>
        <button
          type="button"
          className="ssc__btn ssc__btn--primary"
          onClick={handleSaveCurrentSearch}
        >
          <Plus size={16} />
          {translate('savedSearches.saveCurrentSearch', 'Save Current Search')}
        </button>
      </div>

      {searches.length === 0 ? (
        <div className="ssc__saved-searches__empty">
          <Search size={48} className="ssc__icon--muted" />
          <h3>{translate('savedSearches.empty.title', 'No saved searches yet')}</h3>
          <p>
            {translate(
              'savedSearches.empty.description',
              'Save your favorite job searches and get notified when new matching jobs are posted.'
            )}
          </p>
          <button
            type="button"
            className="ssc__btn ssc__btn--primary"
            onClick={handleSaveCurrentSearch}
          >
            <Plus size={16} />
            {translate('savedSearches.saveYourFirstSearch', 'Save Your First Search')}
          </button>
        </div>
      ) : (
        <div className="ssc__saved-searches__list">
          {searches.map((search) => (
            <div key={search.id} className="ssc__saved-search">
              <div className="ssc__saved-search__header">
                <h3 className="ssc__saved-search__name">{search.name}</h3>
                <div className="ssc__saved-search__actions">
                  <button
                    type="button"
                    className="ssc__btn ssc__btn--icon"
                    onClick={() => handleToggleAlert(search)}
                    title={
                      search.alert_enabled
                        ? translate('savedSearches.disableAlerts', 'Disable alerts')
                        : translate('savedSearches.enableAlerts', 'Enable alerts')
                    }
                  >
                    {search.alert_enabled ? (
                      <Bell size={16} className="ssc__icon--active" />
                    ) : (
                      <BellOff size={16} className="ssc__icon--muted" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="ssc__btn ssc__btn--icon"
                    onClick={() => handleEditSearch(search)}
                    title={translate('savedSearches.edit', 'Edit search')}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="ssc__btn ssc__btn--icon ssc__btn--danger"
                    onClick={() => handleDelete(search.id, search.name)}
                    title={translate('savedSearches.delete', 'Delete search')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {search.description && (
                <p className="ssc__saved-search__description">{search.description}</p>
              )}

              <div className="ssc__saved-search__filters">
                <span className="ssc__saved-search__filters-label">
                  {translate('savedSearches.filters', 'Filters:')}
                </span>
                <span className="ssc__saved-search__filters-value">
                  {formatFilters(search.filters || {})}
                </span>
              </div>

              <div className="ssc__saved-search__meta">
                {search.alert_enabled && (
                  <span className="ssc__saved-search__alert-badge">
                    {getFrequencyIcon(search.alert_frequency)}
                    {getFrequencyLabel(search.alert_frequency)}{' '}
                    {translate('savedSearches.alerts', 'alerts')}
                  </span>
                )}
                {search.match_count > 0 && (
                  <span className="ssc__saved-search__match-count">
                    {search.match_count}{' '}
                    {translate('savedSearches.currentMatches', 'current matches')}
                  </span>
                )}
                {onApplySearch && (
                  <button
                    type="button"
                    className="ssc__btn ssc__btn--link"
                    onClick={() => onApplySearch(search.filters)}
                  >
                    {translate('savedSearches.applySearch', 'Apply this search')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="ssc__modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="ssc__modal" onClick={(e) => e.stopPropagation()}>
            <div className="ssc__modal__header">
              <h2>
                {editingSearch
                  ? translate('savedSearches.editTitle', 'Edit Saved Search')
                  : translate('savedSearches.createTitle', 'Save Search')}
              </h2>
              <button
                type="button"
                className="ssc__btn ssc__btn--icon"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="ssc__modal__content">
              <div className="ssc__form-group">
                <label htmlFor="search-name">
                  {translate('savedSearches.form.name', 'Search Name')} *
                </label>
                <input
                  id="search-name"
                  type="text"
                  className="ssc__input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={translate(
                    'savedSearches.form.namePlaceholder',
                    'e.g., React Developer in Zurich'
                  )}
                  required
                />
              </div>

              <div className="ssc__form-group">
                <label htmlFor="search-description">
                  {translate('savedSearches.form.description', 'Description (optional)')}
                </label>
                <textarea
                  id="search-description"
                  className="ssc__textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={translate(
                    'savedSearches.form.descriptionPlaceholder',
                    'Add notes about this search...'
                  )}
                  rows={3}
                />
              </div>

              <div className="ssc__form-group">
                <label className="ssc__checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.alert_enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, alert_enabled: e.target.checked })
                    }
                  />
                  <span>{translate('savedSearches.form.enableAlerts', 'Enable email alerts')}</span>
                </label>
              </div>

              {formData.alert_enabled && (
                <div className="ssc__form-group">
                  <label htmlFor="alert-frequency">
                    {translate('savedSearches.form.alertFrequency', 'Alert Frequency')}
                  </label>
                  <select
                    id="alert-frequency"
                    className="ssc__select"
                    value={formData.alert_frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, alert_frequency: e.target.value })
                    }
                  >
                    <option value="instant">
                      {translate('savedSearches.frequency.instant', 'Instant (as jobs are posted)')}
                    </option>
                    <option value="daily">
                      {translate('savedSearches.frequency.daily', 'Daily (once per day)')}
                    </option>
                    <option value="weekly">
                      {translate('savedSearches.frequency.weekly', 'Weekly (once per week)')}
                    </option>
                  </select>
                </div>
              )}

              {!editingSearch && (
                <div className="ssc__saved-search-preview">
                  <strong>{translate('savedSearches.form.currentFilters', 'Current filters:')}</strong>
                  <p>{formatFilters(currentFilters || {})}</p>
                </div>
              )}

              <div className="ssc__modal__footer">
                <button
                  type="button"
                  className="ssc__btn ssc__btn--secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  {translate('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="ssc__btn ssc__btn--primary">
                  <Save size={16} />
                  {editingSearch
                    ? translate('common.save', 'Save Changes')
                    : translate('savedSearches.form.save', 'Save Search')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedSearches;

