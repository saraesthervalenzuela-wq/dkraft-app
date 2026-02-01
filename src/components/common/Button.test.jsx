import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click</Button>);
        fireEvent.click(screen.getByText('Click'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByText('Disabled').closest('button')).toBeDisabled();
    });

    it('shows loading state', () => {
        render(<Button loading>Submit</Button>);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders with icon', () => {
        render(<Button icon="add">Add Item</Button>);
        expect(screen.getByText('Add Item')).toBeInTheDocument();
    });

    it('applies variant classes', () => {
        const { container } = render(<Button variant="danger">Delete</Button>);
        expect(container.firstChild).toHaveClass('from-red-500');
    });

    it('applies size classes', () => {
        const { container } = render(<Button size="lg">Large</Button>);
        expect(container.firstChild).toHaveClass('px-6');
    });

    it('applies fullWidth class', () => {
        const { container } = render(<Button fullWidth>Full Width</Button>);
        expect(container.firstChild).toHaveClass('w-full');
    });

    it('does not call onClick when disabled', () => {
        const handleClick = vi.fn();
        render(<Button disabled onClick={handleClick}>Click</Button>);
        fireEvent.click(screen.getByText('Click'));
        expect(handleClick).not.toHaveBeenCalled();
    });
});
