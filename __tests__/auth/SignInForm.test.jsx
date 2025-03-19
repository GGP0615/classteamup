import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignInForm from '@/components/auth/SignInForm'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Mail: () => <span data-testid="mail-icon" />,
  KeyRound: () => <span data-testid="key-icon" />,
  LogIn: () => <span data-testid="login-icon" />,
  UserPlus: () => <span data-testid="user-plus-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  EyeOff: () => <span data-testid="eye-off-icon" />
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn()
}))

describe('SignInForm', () => {
  const mockRouter = {
    push: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue(mockRouter)
    createClientComponentClient.mockReturnValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'test-id' } }, error: null })
      }
    })
  })

  it('renders sign in form', () => {
    render(<SignInForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles successful sign in', async () => {
    render(<SignInForm />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('displays error message on failed sign in', async () => {
    const errorMessage = 'Invalid credentials'
    createClientComponentClient.mockReturnValueOnce({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({ data: null, error: { message: errorMessage } })
      }
    })
    
    render(<SignInForm />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })
}) 