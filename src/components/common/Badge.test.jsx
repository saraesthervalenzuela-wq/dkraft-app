import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
    it('renders children correctly', () => {
        render(<Badge>Active</Badge>);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('applies default variant', () => {
        const { container } = render(<Badge>Default</Badge>);
        expect(container.firstChild).toHaveClass('bg-slate-500/20');
    });

    it('applies success variant', () => {
        const { container } = render(<Badge variant="success">Completed</Badge>);
        expect(container.firstChild).toHaveClass('bg-green-500/20');
    });

    it('applies danger variant', () => {
        const { container } = render(<Badge variant="danger">Error</Badge>);
        expect(container.firstChild).toHaveClass('bg-red-500/20');
    });

    it('applies warning variant', () => {
        const { container } = render(<Badge variant="warning">Pending</Badge>);
        expect(container.firstChild).toHaveClass('bg-amber-500/20');
    });

    it('applies info variant', () => {
        const { container } = render(<Badge variant="info">Info</Badge>);
        expect(container.firstChild).toHaveClass('bg-blue-500/20');
    });

    it('applies orange variant', () => {
        const { container } = render(<Badge variant="orange">Orange</Badge>);
        expect(container.firstChild).toHaveClass('bg-orange-500/20');
    });

    it('renders with icon', () => {
        render(<Badge icon="check">With Icon</Badge>);
        expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(<Badge className="custom-class">Custom</Badge>);
        expect(container.firstChild).toHaveClass('custom-class');
    });
});
