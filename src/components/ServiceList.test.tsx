// src/components/ServiceList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ServiceList from './ServiceList';

describe('ServiceList Presentational Grid', () => {
  const mockServices = [
    { id: 1, name: 'Full Grooming', price: 500, duration_minutes: 120 },
    { id: 2, name: 'Bath & Blowdry', price: 300, duration_minutes: 60 }
  ];

  it('renders all services dynamically and fires select callback on click', () => {
    const mockOnSelect = vi.fn();

    // Render the grid module passing down mock metrics
    render(
      <ServiceList 
        services={mockServices} 
        selectedId={null} 
        onSelect={mockOnSelect} 
      />
    );

    // Verify all item card text blocks render cleanly into the DOM
    expect(screen.getByText('Full Grooming')).toBeInTheDocument();
    expect(screen.getByText('Bath & Blowdry')).toBeInTheDocument();

    // Click on the first service card wrapper
    const serviceCard = screen.getByText('Full Grooming');
    fireEvent.click(serviceCard);

    // Confirm that clicking the layout card maps the correct database row ID (1) back to the parent state
    expect(mockOnSelect).toHaveBeenCalledWith(1);
  });
});