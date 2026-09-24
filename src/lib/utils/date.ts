/**
 * Format date as month name.
 * Example: "Sep"
 */
export const formatMonth = (date: Date | string | number): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(date));
};

/**
 * Format date as day number.
 * Example: "17"
 */
export const formatDay = (date: Date | string | number): string => {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  }).format(new Date(date));
};

/**
 * Format date as full date.
 * Example: "Sep 17, 2026"
 */
export const formatDate = (date: Date | string | number): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

/**
 * Format date as long date.
 * Example: "September 17, 2026"
 */
export const formatLongDate = (date: Date | string | number): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

/**
 * Format date as month and year.
 * Example: "Sep 2026"
 */
export const formatMonthYear = (date: Date | string | number): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

/**
 * Format date as numeric date.
 * Example: "09/17/2026"
 */
export const formatNumericDate = (date: Date | string | number): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

/**
 * Format time.
 * Example: "4:30 PM"
 */
export const formatTime = (date: Date | string | number): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
};

/**
 * Format date and time.
 * Example: "Sep 17, 2026, 4:30 PM"
 */
export const formatDateTime = (date: Date | string | number): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
};

/**
 * Format date for HTML date input.
 * Example: "2026-09-17"
 */
export const formatDateForInput = (date?: Date | string | number): string => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
