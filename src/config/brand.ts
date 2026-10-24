/**
 * Product name and copy in one place. To rename the app, change these values
 * (and the <title>/meta in index.html).
 */
export const BRAND = {
  name: 'ThutoVest',
  /** Logo wordmark: first part in ink, second part in the accent colour. */
  wordmark: ['Thuto', 'Vest'] as const,
  tagline: 'From “I want to study” to “I can graduate.”',
  demoDomain: 'thutovest.demo',
  storagePrefix: 'thutovest',
  /** Official WhatsApp number in E.164 without '+', e.g. '27600000000'. Empty until the number is live: the app then shows the simulator only. */
  whatsappNumber: '',
  /** The live demo bot (Twilio WhatsApp Sandbox). Each phone sends the join code once, then chats as the demo student. */
  whatsappSandbox: { number: '14155238886', display: '+1 415 523 8886', joinCode: 'join salmon-castle' },
};
