/**
 * Google Sheets Service for DotCom Events
 *
 * This service integrates with Google Sheets via the Google Sheets API v4.
 * It reads QR code data and updates ticket status to "used".
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.cloud.google.com
 * 2. Create a new project
 * 3. Enable "Google Sheets API"
 * 4. Create credentials → Service Account
 * 5. Download the JSON key file
 * 6. Share your Google Sheet with the service account email
 * 7. Set GOOGLE_SHEETS_API_KEY in the app settings screen
 *
 * SHEET FORMAT EXPECTED:
 * Column A: Ticket ID / QR Code value
 * Column B: Attendee Name
 * Column C: Ticket Type
 * Column D: Status (leave blank or "valid" for unused, will be set to "USED")
 * Column E: Check-in Timestamp (auto-filled on scan)
 */

import axios from 'axios';

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export class GoogleSheetsService {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.spreadsheetId = config.spreadsheetId;
    this.sheetName = config.sheetName || 'Sheet1';
    this.headerRow = config.headerRow || 1;

    // Column mapping (1-indexed)
    this.columns = {
      ticketId: config.ticketIdColumn || 'A',
      attendeeName: config.attendeeNameColumn || 'B',
      ticketType: config.ticketTypeColumn || 'C',
      status: config.statusColumn || 'D',
      checkInTime: config.checkInTimeColumn || 'E',
    };
  }

  /**
   * Fetch all ticket data from the sheet
   */
  async fetchAllTickets() {
    try {
      const range = `${this.sheetName}!A:E`;
      const url = `${SHEETS_BASE_URL}/${this.spreadsheetId}/values/${encodeURIComponent(range)}`;

      const response = await axios.get(url, {
        params: { key: this.apiKey },
        timeout: 10000,
      });

      const rows = response.data.values || [];
      if (rows.length <= this.headerRow) return [];

      // Skip header rows
      const dataRows = rows.slice(this.headerRow);

      return dataRows.map((row, index) => ({
        rowIndex: index + this.headerRow + 1, // 1-indexed, accounting for header
        ticketId: row[0] || '',
        attendeeName: row[1] || 'Unknown',
        ticketType: row[2] || 'General Admission',
        status: (row[3] || '').toUpperCase(),
        checkInTime: row[4] || '',
      })).filter(ticket => ticket.ticketId !== '');
    } catch (error) {
      throw this._handleError(error, 'fetching tickets');
    }
  }

  /**
   * Find a ticket by its QR code value
   */
  async findTicketByQRCode(qrValue) {
    const tickets = await this.fetchAllTickets();
    const ticket = tickets.find(t => t.ticketId === qrValue);
    return ticket || null;
  }

  /**
   * Mark a ticket as used
   */
  async markTicketAsUsed(rowIndex) {
    try {
      const now = new Date();
      const timestamp = now.toLocaleString('en-ZA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Update Status column (D) and CheckIn column (E)
      const statusRange = `${this.sheetName}!${this.columns.status}${rowIndex}:${this.columns.checkInTime}${rowIndex}`;
      const url = `${SHEETS_BASE_URL}/${this.spreadsheetId}/values/${encodeURIComponent(statusRange)}`;

      await axios.put(url, {
        range: statusRange,
        majorDimension: 'ROWS',
        values: [['USED', timestamp]],
      }, {
        params: {
          key: this.apiKey,
          valueInputOption: 'RAW',
        },
        timeout: 10000,
      });

      return { success: true, timestamp };
    } catch (error) {
      throw this._handleError(error, 'updating ticket status');
    }
  }

  /**
   * Process a scanned QR code end-to-end
   * Returns: { status: 'valid'|'already_used'|'not_found', ticket, timestamp }
   */
  async processQRCode(qrValue) {
    const ticket = await this.findTicketByQRCode(qrValue);

    if (!ticket) {
      return {
        status: 'not_found',
        ticket: null,
        message: 'This QR code is not registered in the system.',
      };
    }

    if (ticket.status === 'USED') {
      return {
        status: 'already_used',
        ticket,
        message: `This ticket was already checked in at ${ticket.checkInTime}.`,
      };
    }

    // Mark as used
    const result = await this.markTicketAsUsed(ticket.rowIndex);

    return {
      status: 'valid',
      ticket: { ...ticket, status: 'USED', checkInTime: result.timestamp },
      message: `Welcome, ${ticket.attendeeName}! Check-in successful.`,
      timestamp: result.timestamp,
    };
  }

  /**
   * Validate configuration by testing connection
   */
  async testConnection() {
    try {
      const range = `${this.sheetName}!A1:E1`;
      const url = `${SHEETS_BASE_URL}/${this.spreadsheetId}/values/${encodeURIComponent(range)}`;
      await axios.get(url, {
        params: { key: this.apiKey },
        timeout: 8000,
      });
      return { success: true };
    } catch (error) {
      throw this._handleError(error, 'connecting to Google Sheets');
    }
  }

  _handleError(error, context) {
    if (error.response) {
      const status = error.response.status;
      const msg = error.response.data?.error?.message || 'Unknown error';
      if (status === 403) {
        return new Error(`Access denied. Check your API key and sheet permissions. (${msg})`);
      } else if (status === 404) {
        return new Error(`Spreadsheet not found. Check your Spreadsheet ID. (${msg})`);
      } else if (status === 400) {
        return new Error(`Invalid request. Check your sheet name and column settings. (${msg})`);
      }
      return new Error(`Google Sheets error (${status}): ${msg}`);
    } else if (error.code === 'ECONNABORTED') {
      return new Error('Connection timed out. Check your internet connection.');
    } else if (error.request) {
      return new Error('No response from Google Sheets. Check your internet connection.');
    }
    return new Error(`Error ${context}: ${error.message}`);
  }
}

export default GoogleSheetsService;
