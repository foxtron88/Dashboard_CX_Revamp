import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

/**
 * Initialize Google Sheets API Client
 * Uses service account credentials from GOOGLE_APPLICATION_CREDENTIALS environment variable.
 */
function getSheetsClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Fetch raw data from a Google Sheet
 */
export async function fetchSheetData(spreadsheetId: string, range: string): Promise<any[][]> {
  const sheets = getSheetsClient();
  
  if (!sheets) {
    console.warn('Google Sheets credentials not found. Returning mock empty array.');
    return [];
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values || [];
  } catch (error) {
    console.error('Google Sheets API Error:', error);
    throw error;
  }
}
