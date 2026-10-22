import axios from 'axios';
import api from './api';
import { ExplainRequest, Explanation, ParsedRideRequest } from '../models/rideAssistant';

/** The AI answer can take a few seconds. The server gives up after 30 seconds and uses a template text instead. */
const AI_TIMEOUT_MS = 45000;

const errorMessage = (e: unknown, fallback: string): string => {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (e.response?.status === 503) return 'שירות ה-AI אינו זמין כרגע';
    if (e.code === 'ECONNABORTED') return 'הבקשה ארכה יותר מדי זמן';
  }
  return fallback;
};

const rideAssistantService = {
  /** Extracts the fields of a ride request from a free-text message. */
  async parseRequest(text: string): Promise<ParsedRideRequest> {
    try {
      const res = await api.post<ParsedRideRequest>('/rides/parse-request', { text }, { timeout: AI_TIMEOUT_MS });
      return res.data;
    } catch (e) {
      throw new Error(errorMessage(e, 'לא הצלחנו לנתח את ההודעה'));
    }
  },

  /** Explains the ranking of the matching screen and drafts a message to the top volunteer. */
  async explainMatch(request: ExplainRequest): Promise<Explanation> {
    try {
      const res = await api.post<Explanation>('/rides/explain-match', request, { timeout: AI_TIMEOUT_MS });
      return res.data;
    } catch (e) {
      throw new Error(errorMessage(e, 'לא הצלחנו להכין הסבר'));
    }
  },
};

export default rideAssistantService;
