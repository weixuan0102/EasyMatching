import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Box,
    Typography
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

type ReportDialogProps = {
    open: boolean;
    reportedUserId: string;
    reportedUsername: string;
    conversationId?: string;
    onClose: () => void;
    onSubmit: (data: { reportedUserId: string; conversationId?: string; reason: string; description?: string }) => Promise<void>;
};

const REPORT_REASONS = [
    { value: 'harassment', label: '騷擾或霸凌' },
    { value: 'spam', label: '垃圾訊息或廣告' },
    { value: 'inappropriate_content', label: '不當內容' },
    { value: 'fake_profile', label: '假帳號' },
    { value: 'other', label: '其他' }
];

export default function ReportDialog({
    open,
    reportedUserId,
    reportedUsername,
    conversationId,
    onClose,
    onSubmit
}: ReportDialogProps) {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason) {
            alert('請選擇舉報原因');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                reportedUserId,
                conversationId,
                reason,
                description: description.trim() || undefined
            });

            // Reset form
            setReason('');
            setDescription('');
            onClose();
            alert('舉報已送出，感謝您的回報');
        } catch (error) {
            console.error('Report submission failed:', error);
            alert('舉報失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />
                    舉報用戶
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    您正在舉報用戶：<strong>{reportedUsername}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, mb: 2 }}>
                    請選擇舉報原因並提供詳細說明。我們將儘快處理您的舉報。
                </Typography>

                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>舉報原因 *</InputLabel>
                    <Select
                        value={reason}
                        label="舉報原因 *"
                        onChange={(e) => setReason(e.target.value)}
                        disabled={isSubmitting}
                    >
                        {REPORT_REASONS.map((r) => (
                            <MenuItem key={r.value} value={r.value}>
                                {r.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="詳細說明（選填）"
                    multiline
                    rows={4}
                    fullWidth
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    sx={{ mt: 2 }}
                    placeholder="請描述具體情況..."
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSubmitting}>
                    取消
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="error"
                    disabled={isSubmitting || !reason}
                >
                    {isSubmitting ? '送出中...' : '送出舉報'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
