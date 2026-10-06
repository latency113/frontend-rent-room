import Swal, { SweetAlertOptions, SweetAlertIcon } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Base customized SweetAlert instance
const baseSwal = Swal.mixin({
  customClass: {
    popup: 'swal2-custom-popup',
    title: 'swal2-custom-title',
    htmlContainer: 'swal2-custom-html',
    confirmButton: 'swal2-custom-confirm-btn',
    cancelButton: 'swal2-custom-cancel-btn',
    input: 'swal2-custom-input',
    actions: 'swal2-custom-actions',
    icon: 'swal2-custom-icon',
  },
  buttonsStyling: false,
  reverseButtons: true,
  backdrop: 'rgba(15, 23, 42, 0.48)',
  focusConfirm: false,
});

interface ConfirmDialogOptions {
  title: string;
  text?: string;
  html?: string;
  icon?: SweetAlertIcon;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

/**
 * Beautiful confirmation dialog (replaces native window.confirm)
 */
export async function confirmDialog({
  title,
  text,
  html,
  icon = 'question',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  isDanger = false,
}: ConfirmDialogOptions): Promise<boolean> {
  const result = await baseSwal.fire({
    title,
    text,
    html,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      htmlContainer: 'swal2-custom-html',
      confirmButton: isDanger ? 'swal2-custom-danger-btn' : 'swal2-custom-confirm-btn',
      cancelButton: 'swal2-custom-cancel-btn',
      actions: 'swal2-custom-actions',
      icon: 'swal2-custom-icon',
    },
  });

  return result.isConfirmed;
}

interface PromptDialogOptions {
  title: string;
  text?: string;
  html?: string;
  inputPlaceholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  required?: boolean;
  icon?: SweetAlertIcon;
}

/**
 * Beautiful prompt dialog with input field (replaces native window.prompt)
 */
export async function promptDialog({
  title,
  text,
  html,
  inputPlaceholder = 'พิมพ์ข้อความที่นี่...',
  defaultValue = '',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  isDanger = false,
  required = false,
  icon = 'info',
}: PromptDialogOptions): Promise<string | null> {
  const result = await baseSwal.fire({
    title,
    text,
    html,
    icon,
    input: 'text',
    inputValue: defaultValue,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    inputValidator: required
      ? (value) => {
          if (!value || !value.trim()) {
            return 'กรุณากรอกข้อมูลในช่องนี้';
          }
          return null;
        }
      : undefined,
    customClass: {
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      htmlContainer: 'swal2-custom-html',
      confirmButton: isDanger ? 'swal2-custom-danger-btn' : 'swal2-custom-confirm-btn',
      cancelButton: 'swal2-custom-cancel-btn',
      input: 'swal2-custom-input',
      actions: 'swal2-custom-actions',
      icon: 'swal2-custom-icon',
    },
  });

  if (result.isConfirmed) {
    return result.value ?? '';
  }
  return null;
}

/**
 * Modern Success Alert Modal
 */
export async function successAlert(title: string, text?: string): Promise<void> {
  await baseSwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'ตกลง',
    customClass: {
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      htmlContainer: 'swal2-custom-html',
      confirmButton: 'swal2-custom-confirm-btn',
      actions: 'swal2-custom-actions',
      icon: 'swal2-custom-icon',
    },
  });
}

/**
 * Modern Error Alert Modal
 */
export async function errorAlert(title: string, text?: string): Promise<void> {
  await baseSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'ตกลง',
    customClass: {
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      htmlContainer: 'swal2-custom-html',
      confirmButton: 'swal2-custom-danger-btn',
      actions: 'swal2-custom-actions',
      icon: 'swal2-custom-icon',
    },
  });
}

/**
 * Modern Warning Alert Modal
 */
export async function warningAlert(title: string, text?: string): Promise<void> {
  await baseSwal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'รับทราบ',
    customClass: {
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      htmlContainer: 'swal2-custom-html',
      confirmButton: 'swal2-custom-confirm-btn',
      actions: 'swal2-custom-actions',
      icon: 'swal2-custom-icon',
    },
  });
}

