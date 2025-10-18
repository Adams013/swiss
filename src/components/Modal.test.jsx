import React, { useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('renders children when open and closes on overlay click', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();

    render(
      <Modal isOpen onRequestClose={handleClose}>
        <button type="button">Inside</button>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(document.querySelector('.ssc__modal-backdrop'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('traps focus within the modal', () => {
    render(
      <Modal isOpen>
        <button type="button">First</button>
        <button type="button">Second</button>
      </Modal>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(buttons[1]).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(buttons[0]).toHaveFocus();
  });

  it('supports setting an initial focus element', () => {
    const TestModal = () => {
      const initialRef = useRef(null);
      return (
        <Modal isOpen initialFocusRef={initialRef}>
          <button type="button">First</button>
          <button type="button" ref={initialRef}>
            Initial
          </button>
        </Modal>
      );
    };

    render(<TestModal />);

    expect(screen.getByText('Initial')).toHaveFocus();
  });

  it('closes when pressing Escape', () => {
    const handleClose = jest.fn();

    render(
      <Modal isOpen onRequestClose={handleClose}>
        <button type="button">Close</button>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
