export const hotelConfig = {
  contact: {
    phone: '',
    email: '',
  },
  presence: {
    heartbeatMs: 30_000,
    onlineTimeoutSeconds: 90,
  },
  feedback: {
    maxLength: 500,
    cooldownSeconds: 30,
  },
} as const
