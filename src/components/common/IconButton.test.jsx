import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IconButton from './IconButton';

describe('IconButton', () => {
    it('renders with icon', () => {
        render(<IconButton icon="edit" title="Edit" />);
        expect(screen.getByTitle('Edit')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<IconButton icon="delete" onClick={handleClick} title="Delete" />);
        fireEvent.click(screen.getByTitle('Delete'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        render(<IconButton icon="edit" disabled title="Edit" />);
        expect(screen.getByTitle('Edit')).toBeDisabled();
    });

    it('applies danger variant', () => {
        const { container } = render(<IconButton icon="delete" variant="danger" title="Delete" />);
        expect(container.firstChild).toHaveClass('text-red-400');
    });

    it('applies success variant', () => {
        const { container } = render(<IconButton icon="check" variant="success" title="Approve" />);
        expect(container.firstChild).toHaveClass('text-green-400');
    });

    it('applies primary variant', () => {
        const { container } = render(<IconButton icon="edit" variant="primary" title="Edit" />);
        expect(container.firstChild).toHaveClass('text-blue-400');
    });

    it('applies size classes', () => {
        const { container } = render(<IconButton icon="edit" size="lg" title="Edit" />);
        expect(container.firstChild).toHaveClass('w-11');
    });

    it('does not call onClick when disabled', () => {
        const handleClick = vi.fn();
        render(<IconButton icon="edit" disabled onClick={handleClick} title="Edit" />);
        fireEvent.click(screen.getByTitle('Edit'));
        expect(handleClick).not.toHaveBeenCalled();
    });
});
