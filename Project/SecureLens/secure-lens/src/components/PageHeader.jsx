import { Box, Typography } from "@mui/material";

export default function PageHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 4.5, maxWidth: 920 }}>
      <Typography variant="h4" sx={{ mb: subtitle ? 1.25 : 0 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography
          color="text.secondary"
          sx={{
            fontSize: 16,
            lineHeight: 1.7,
            overflowWrap: "anywhere",
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
