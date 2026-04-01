import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = true,
}: ConfirmModalProps) => {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm border-border">
        <DialogHeader>
          <DialogTitle className={destructive ? "text-destructive" : ""}>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel ?? t("confirm_cancel")}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel ?? t("confirm_action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmModal;
