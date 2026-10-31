export const hotelConfig = {
  contact: {
    phone: '',
    email: '',
  },
  presence: {
    heartbeatMs: 30_000,
    onlineTimeoutSeconds: 90,
  },
  comments: {
    minLength: 2,
    maxLength: 600,
    cooldownSeconds: 20,
  },
} as const
