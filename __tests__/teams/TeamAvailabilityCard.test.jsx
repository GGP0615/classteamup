import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TeamAvailabilityCard from '@/app/teams/components/TeamAvailabilityCard'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

// Mock the modules
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      })
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'profile123',
        looking_for_team: false,
        completion_percentage: 100
      },
      error: null
    }),
    update: jest.fn().mockResolvedValue({
      data: { id: 'profile123' },
      error: null
    })
  }))
}))
jest.mock('react-hot-toast')

describe('TeamAvailabilityCard', () => {
  const mockUpdateUser = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    createClientComponentClient.mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          looking_for_team: false,
          completion_percentage: 100
        }
      }),
      update: mockUpdateUser.mockResolvedValue({ data: {}, error: null })
    })
  })
  
  test('renders with initial looking for team status as false', async () => {
    render(<TeamAvailabilityCard />)
    
    await waitFor(() => {
      expect(screen.getByText(/Not Looking for Team/i)).toBeInTheDocument()
      expect(screen.getByRole('switch')).not.toBeChecked()
    })
  })
  
  test('renders with initial looking for team status as true', async () => {
    jest.mocked(createClientComponentClient).mockReturnValueOnce({
      ...createClientComponentClient(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'profile123',
          looking_for_team: true,
          completion_percentage: 100
        },
        error: null
      })
    })
    
    render(<TeamAvailabilityCard />)
    
    await waitFor(() => {
      expect(screen.getByText(/Looking for Team/i)).toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeChecked()
    })
  })
  
  test('handles toggle action when enabled', async () => {
    render(<TeamAvailabilityCard />)
    
    await waitFor(() => {
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
    })
    
    await waitFor(() => {
      expect(createClientComponentClient().update).toHaveBeenCalledWith({
        looking_for_team: true
      })
    })
  })
  
  test('handles toggle action when disabled', async () => {
    jest.mocked(createClientComponentClient).mockReturnValueOnce({
      ...createClientComponentClient(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'profile123',
          looking_for_team: true,
          completion_percentage: 100
        },
        error: null
      })
    })
    
    render(<TeamAvailabilityCard />)
    
    await waitFor(() => {
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
    })
    
    await waitFor(() => {
      expect(createClientComponentClient().update).toHaveBeenCalledWith({
        looking_for_team: false
      })
    })
  })
  
  test('prevents toggle when profile is incomplete', async () => {
    createClientComponentClient.mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          looking_for_team: false,
          completion_percentage: 50
        }
      })
    })
    
    render(<TeamAvailabilityCard />)
    
    await waitFor(() => {
      const toggle = screen.getByRole('switch')
      expect(toggle).toBeDisabled()
      expect(screen.getByText(/Complete your profile/i)).toBeInTheDocument()
    })
  })
}) 