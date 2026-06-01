"use client";

type Props = {
  children: string;
  confirmMessage: string;
  className?: string;
};

export function ConfirmSubmitButton({ children, confirmMessage, className }: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
