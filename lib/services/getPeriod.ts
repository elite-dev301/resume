export const getPeriod = (start_date: Date, end_date: Date) => {
  const diffMillis = end_date.getTime() - start_date.getTime();
  let periodMillis;

  if (diffMillis <= 24 * 60 * 60 * 1000) { // <= 1 day
    periodMillis = 10 * 60 * 1000;  // 10 minutes
  } else if (diffMillis <= 3 * 24 * 60 * 60 * 1000) { // 1 - 3 days
    periodMillis = 30 * 60 * 1000;  // 30 minutes
  } else if (diffMillis <= 7 * 24 * 60 * 60 * 1000) { // 3 - 7 days
    periodMillis = 1 * 60 * 60 * 1000; // 1 hour
  } else if (diffMillis <= 14 * 24 * 60 * 60 * 1000) { // 7 - 14 days
    periodMillis = 2 * 60 * 60 * 1000; // 2 hours
  } else if (diffMillis <= 30 * 24 * 60 * 60 * 1000) { // 14 - 30 days
    periodMillis = 6 * 60 * 60 * 1000; // 6 hours
  } else if (diffMillis <= 60 * 24 * 60 * 60 * 1000) { // 30 - 60 days
    periodMillis = 12 * 60 * 60 * 1000; // 12 hours
  } else if (diffMillis <= 180 * 24 * 60 * 60 * 1000) { // 60 - 180 days
    periodMillis = 24 * 60 * 60 * 1000; // 1 day
  } else {
    periodMillis = 30 * 24 * 60 * 60 * 1000; // 1 month
  }

  return periodMillis;
}