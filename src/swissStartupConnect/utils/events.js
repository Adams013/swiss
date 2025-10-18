export const sortEventsBySchedule = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }

  return [...list].sort((a, b) => {
    const buildDateValue = (entry) => {
      if (!entry || !entry.event_date) {
        return 0;
      }

      const time = entry.event_time ? String(entry.event_time) : '00:00';
      const formattedTime = time.length > 5 ? time.slice(0, 8) : time;
      const composed = `${entry.event_date}T${formattedTime}`;
      const value = new Date(composed).getTime();
      return Number.isFinite(value) ? value : 0;
    };

    return buildDateValue(a) - buildDateValue(b);
  });
};
