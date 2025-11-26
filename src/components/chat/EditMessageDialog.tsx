import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField
} from '@mui/material';

type EditMessageDialogProps = {
    open: boolean;
    initialContent: string;
    onClose: () => void;
    onSave: (newContent: string) => Promise<void>;
};

export default function EditMessageDialog({
    open,
    initialContent,
    onClose,
    onSave
}: EditMessageDialogProps) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setContent(initialContent);
    }, [initialContent]);

    const handleSave = async () => {
        if (!content.trim()) {
            return;
        }

        setIsSaving(true);
        try {
            await onSave(content.trim());
            onClose();
        } catch (error) {
            console.error('Failed to edit message:', error);
            alert('編輯訊息失敗');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>編輯訊息</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    multiline
                    fullWidth
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSaving}
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>
                    取消
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={isSaving || !content.trim()}
                >
                    {isSaving ? '儲存中...' : '儲存'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
