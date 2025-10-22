import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '../supabaseClient';

/**
 * NotificationCenter Component
 * Displays in-app notifications with a bell icon and dropdown
 */
const NotificationCenter = ({ user, translate }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      subscribeToNotifications();
    }

    return () => {
      // Cleanup subscription
    };
  }, [user?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      // For now, fetch from notification queue
      // In production, you'd have a dedicated notifications table
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => n.status === 'pending').length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }

    setLoading(false);
  };

  const subscribeToNotifications = () => {
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notification_queue')
        .update({ status: 'sent' })
        .eq('id', notificationId);

      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notification_queue')
        .update({ status: 'sent' })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await supabase
        .from('notification_queue')
        .update({ status: 'cancelled' })
        .eq('id', notificationId);

      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    // Return appropriate icon based on notification type
    return <Bell size={16} />;
  };

  const getNotificationAction = (notification) => {
    const payload = notification.payload || {};

    switch (notification.notification_type) {
      case 'job_alert':
        return payload.jobs?.[0]?.id
          ? { label: 'View Job', link: `/?job=${payload.jobs[0].id}` }
          : null;
      case 'application_status_update':
        return { label: 'View Application', link: '/applications' };
      case 'company_new_job':
        return payload.job?.id
          ? { label: 'View Job', link: `/?job=${payload.job.id}` }
          : null;
      default:
        return null;
    }
  };

  const formatNotificationText = (notification) => {
    const payload = notification.payload || {};

    switch (notification.notification_type) {
      case 'job_alert':
        return `${payload.jobs?.length || 0} new jobs matching "${payload.savedSearchName}"`;
      case 'application_status_update':
        return `${payload.jobTitle} at ${payload.companyName}: ${payload.status}`;
      case 'application_message':
        return `New message from ${payload.companyName}`;
      case 'company_new_job':
        return `${payload.companyName} posted: ${payload.job?.title}`;
      default:
        return payload.subject || 'New notification';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return created.toLocaleDateString();
  };

  return (
    <div className="ssc__notification-center" ref={dropdownRef}>
      <button
        type="button"
        className="ssc__notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={translate('notifications.toggleMenu', 'Toggle notifications')}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="ssc__notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="ssc__notification-dropdown">
          <div className="ssc__notification-dropdown__header">
            <h3>{translate('notifications.title', 'Notifications')}</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="ssc__btn ssc__btn--link ssc__btn--small"
                onClick={markAllAsRead}
              >
                <Check size={14} />
                {translate('notifications.markAllRead', 'Mark all read')}
              </button>
            )}
          </div>

          <div className="ssc__notification-list">
            {loading ? (
              <div className="ssc__notification-list__loading">
                <div className="ssc__spinner ssc__spinner--small"></div>
                <p>{translate('notifications.loading', 'Loading...')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="ssc__notification-list__empty">
                <Bell size={32} className="ssc__icon--muted" />
                <p>{translate('notifications.empty', 'No notifications yet')}</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const action = getNotificationAction(notification);
                const isUnread = notification.status === 'pending';

                return (
                  <div
                    key={notification.id}
                    className={`ssc__notification-item ${isUnread ? 'ssc__notification-item--unread' : ''}`}
                  >
                    <div className="ssc__notification-item__icon">
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    <div className="ssc__notification-item__content">
                      <p className="ssc__notification-item__text">
                        {formatNotificationText(notification)}
                      </p>
                      <span className="ssc__notification-item__time">
                        {formatTimeAgo(notification.created_at)}
                      </span>

                      {action && (
                        <a
                          href={action.link}
                          className="ssc__notification-item__action"
                          onClick={() => {
                            markAsRead(notification.id);
                            setIsOpen(false);
                          }}
                        >
                          {action.label}
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    <div className="ssc__notification-item__actions">
                      {isUnread && (
                        <button
                          type="button"
                          className="ssc__btn ssc__btn--icon ssc__btn--small"
                          onClick={() => markAsRead(notification.id)}
                          title={translate('notifications.markRead', 'Mark as read')}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="ssc__btn ssc__btn--icon ssc__btn--small"
                        onClick={() => deleteNotification(notification.id)}
                        title={translate('notifications.delete', 'Delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="ssc__notification-dropdown__footer">
              <a
                href="/notifications"
                className="ssc__btn ssc__btn--link"
                onClick={() => setIsOpen(false)}
              >
                {translate('notifications.viewAll', 'View all notifications')}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

