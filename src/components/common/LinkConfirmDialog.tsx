import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import WarningIcon from '@mui/icons-material/Warning';

type LinkConfirmDialogProps = {
    open: boolean;
    url: string | null;
    onClose: () => void;
    onConfirm: () => void;
};

export default function LinkConfirmDialog({
    open,
    url,
    onClose,
    onConfirm
}: LinkConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    確認開啟外部連結
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    您即將開啟以下外部連結：
                </Typography>
                <Box
                    sx={{
                        bgcolor: 'action.hover',
                        p: 2,
                        borderRadius: 1,
                        mt: 2,
                        wordBreak: 'break-all'
                    }}
                >
                    <Typography variant="body2" fontFamily="monospace">
                        {url}
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    ⚠️ 請確保連結來源可信，避免點擊不明連結。
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>取消</Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    startIcon={<OpenInNewIcon />}
                >
                    開啟連結
                </Button>
            </DialogActions>
        </Dialog>
    );
}
