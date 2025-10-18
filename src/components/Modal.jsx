import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(' ');

const getFocusableElements = (node) => {
  if (!node) {
    return [];
  }

  const elements = Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR));

  return elements.filter((element) => {
    if (element.hasAttribute('disabled')) {
      return false;
    }

    const ariaHidden = element.getAttribute('aria-hidden');
    if (ariaHidden === 'true') {
      return false;
    }

    if (element instanceof HTMLElement) {
      return !element.hasAttribute('inert') && element.tabIndex !== -1;
    }

    return true;
  });
};

const Modal = ({
  isOpen,
  onRequestClose,
  children,
  overlayClassName = '',
  dialogClassName = '',
  shouldCloseOnOverlayClick = true,
  shouldCloseOnEsc = true,
  initialFocusRef,
  ...dialogProps
}) => {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const lastFocusedElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    const dialogNode = dialogRef.current;
    if (!dialogNode) {
      return undefined;
    }

    lastFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusable = getFocusableElements(dialogNode);
    const initialFocusElement = initialFocusRef?.current || focusable[0] || dialogNode;

    if (initialFocusElement && typeof initialFocusElement.focus === 'function') {
      initialFocusElement.focus();
    }

    const handleKeyDown = (event) => {
      if (!dialogRef.current) {
        return;
      }

      if (event.key === 'Escape' && shouldCloseOnEsc) {
        event.preventDefault();
        event.stopPropagation();
        if (onRequestClose) {
          onRequestClose();
        }
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const currentIndex = focusableElements.indexOf(document.activeElement);
      if (event.shiftKey) {
        const previousIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        event.preventDefault();
        focusableElements[previousIndex].focus();
        return;
      }

      const nextIndex = currentIndex === -1 || currentIndex === focusableElements.length - 1 ? 0 : currentIndex + 1;
      event.preventDefault();
      focusableElements[nextIndex].focus();
    };

    const handleFocus = (event) => {
      if (!dialogRef.current) {
        return;
      }

      if (dialogRef.current.contains(event.target)) {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);
      const fallbackTarget = focusableElements[0] || dialogRef.current;

      if (fallbackTarget && typeof fallbackTarget.focus === 'function') {
        fallbackTarget.focus();
        event.stopPropagation();
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focus', handleFocus, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focus', handleFocus, true);

      const lastFocused = lastFocusedElementRef.current;
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    };
  }, [isOpen, onRequestClose, shouldCloseOnEsc, initialFocusRef]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const handleOverlayMouseDown = (event) => {
    if (!shouldCloseOnOverlayClick) {
      return;
    }

    if (event.target !== overlayRef.current) {
      return;
    }

    if (onRequestClose) {
      onRequestClose();
    }
  };

  const dialog = (
    <div
      ref={overlayRef}
      className={joinClassNames('ssc__modal-backdrop', overlayClassName)}
      onMouseDown={handleOverlayMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={joinClassNames('ssc__modal', dialogClassName)}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        {...dialogProps}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};

export default Modal;
