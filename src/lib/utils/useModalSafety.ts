"use client";

import { useEffect, useRef } from "react";

export interface UseModalSafetyOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  disableEscape?: boolean;
}

/**
 * Ensures modal safety (P1):
 * 1. Traps focus within modal container (Tab and Shift+Tab)
 * 2. Closes modal on Escape key press (with stopPropagation)
 * 3. Restores focus to the trigger element that opened the modal upon close
 * 4. Auto-focuses the initial element or first interactive element
 */
export function useModalSafety({
  isOpen,
  onClose,
  initialFocusRef,
  disableEscape = false,
}: UseModalSafetyOptions) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    // Capture the trigger element before modal takes focus
    triggerElementRef.current = document.activeElement as HTMLElement | null;

    // Focus the initial element or the first focusable element inside the modal
    const focusTimer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const visibleFocusable = Array.from(focusables).find(
          (el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0
        );
        if (visibleFocusable) {
          visibleFocusable.focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 30);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !disableEscape) {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);

      // Focus return to the triggering element
      const trigger = triggerElementRef.current;
      if (trigger && typeof trigger.focus === "function" && document.contains(trigger)) {
        setTimeout(() => {
          trigger.focus();
        }, 10);
      }
    };
  }, [isOpen, disableEscape, initialFocusRef]);

  return modalRef;
}
