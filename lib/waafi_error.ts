export class WaafiPayError extends Error {
  responseCode: string;
  errorCode?: string;
  state?: string;

  constructor(message: string, responseCode: string, errorCode?: string, state?: string) {
    super(message);
    this.name = 'WaafiPayError';
    this.responseCode = responseCode;
    this.errorCode = errorCode;
    this.state = state;
  }
}
