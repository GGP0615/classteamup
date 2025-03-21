import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfileUpdatePage from '@/app/student/profile/page'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn()
}))

describe('ProfileUpdatePage', () => {
  const mockRouter = {
    push: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue(mockRouter)
    createClientComponentClient.mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          first_name: 'John',
          last_name: 'Doe',
          major: 'Computer Science',
          skills: ['JavaScript', 'React']
        }
      }),
      update: jest.fn().mockResolvedValue({ data: {}, error: null })
    })
  })

  it('loads user profile data', async () => {
    render(<ProfileUpdatePage />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Computer Science')).toBeInTheDocument()
    })
  })

  it('validates required fields on submit', async () => {
    render(<ProfileUpdatePage />)
    
    const submitButton = screen.getByRole('button', { name: /update profile/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
    })
  })

  it('handles successful profile update', async () => {
    render(<ProfileUpdatePage />)
    
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Jane' }
    })
    
    const submitButton = screen.getByRole('button', { name: /update profile/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles profile update error', async () => {
    createClientComponentClient.mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue({
        error: { message: 'Update failed' }
      })
    })
    
    render(<ProfileUpdatePage />)
    
    const submitButton = screen.getByRole('button', { name: /update profile/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeInTheDocument()
    })
  })
}) 