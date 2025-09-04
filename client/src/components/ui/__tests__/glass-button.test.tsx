import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import GlassButton from '../glass-button'

describe('GlassButton', () => {
  it('renders with glass effect styling', () => {
    render(<GlassButton>Glass Button</GlassButton>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('backdrop-blur-md')
    expect(button).toHaveClass('bg-white/20')
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<GlassButton onClick={handleClick}>Click me</GlassButton>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<GlassButton disabled>Disabled</GlassButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies variant styles correctly', () => {
    render(<GlassButton variant="outline">Outline Glass</GlassButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border')
  })

  it('renders with icon correctly', () => {
    const TestIcon = () => <span data-testid="test-icon">📷</span>
    render(
      <GlassButton>
        <TestIcon />
        With Icon
      </GlassButton>
    )
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('With Icon')).toBeInTheDocument()
  })
})