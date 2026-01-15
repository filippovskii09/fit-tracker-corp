export interface IBaseModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  text: string;
  cancelButtonText: string;
  confirmButtonText: string;
}
