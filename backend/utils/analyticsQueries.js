export const BUSIEST_MONTH_QUERY = `
  SELECT TO_CHAR(event_date, 'Month') AS month, COUNT(*) as count 
  FROM events 
  GROUP BY month 
  ORDER BY count DESC 
  LIMIT 1;
`;

export const MOST_BOOKED_TYPE_QUERY = `
  SELECT event_type, COUNT(*) as count 
  FROM events 
  GROUP BY event_type 
  ORDER BY count DESC 
  LIMIT 1;
`;

export const MOST_SELECTED_THEME_QUERY = `
  SELECT theme, COUNT(*) as count 
  FROM events 
  WHERE theme IS NOT NULL 
  GROUP BY theme 
  ORDER BY count DESC 
  LIMIT 1;
`;