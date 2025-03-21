import { jest } from '@jest/globals'

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  order: jest.fn().mockReturnThis(),
}

export const createClientComponentClient = jest.fn(() => mockSupabaseClient)

export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient.auth).forEach(mock => mock.mockReset())
  Object.values(mockSupabaseClient).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockReset()
      mock.mockReturnThis()
    }
  })
  createClientComponentClient.mockReset()
  createClientComponentClient.mockReturnValue(mockSupabaseClient)
}

export default {
  createClientComponentClient,
  resetSupabaseMocks,
  mockSupabaseClient,
} 