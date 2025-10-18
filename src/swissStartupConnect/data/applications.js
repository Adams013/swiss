export const applicationStatuses = ['submitted', 'in_review', 'interviewing', 'offer', 'hired', 'rejected'];

export const formatStatusKeyLabel = (statusKey) => {
  if (!statusKey || typeof statusKey !== 'string') {
    return '';
  }

  return statusKey
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};
