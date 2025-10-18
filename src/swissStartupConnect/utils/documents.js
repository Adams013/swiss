const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'tex'];

export const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  return parts.pop().toLowerCase();
};

export const getFileNameFromUrl = (url) => {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    const trimmed = url.trim();
    if (!trimmed) {
      return '';
    }

    const withoutQuery = trimmed.split('?')[0];
    const segments = withoutQuery.split('/').filter(Boolean);
    if (!segments.length) {
      return '';
    }

    const lastSegment = segments[segments.length - 1];
    return decodeURIComponent(lastSegment);
  } catch (error) {
    console.error('Failed to derive file name from URL', error);
    return '';
  }
};

export const isAllowedDocumentFile = (file) => {
  if (!file) return false;
  const extension = getFileExtension(file.name);
  return DOCUMENT_EXTENSIONS.includes(extension);
};
